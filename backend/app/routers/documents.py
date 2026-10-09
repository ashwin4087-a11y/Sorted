import mimetypes
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, Citizen, Document, AuditLog
from app.schemas.documents import DocumentRead
from app.services.document_extraction import extract_fields
from app.services.document_encryption import encrypt_document, decrypt_document
from app.services.document_storage import store_document, retrieve_document, delete_document_from_storage
from app.services.document_scanner import scan_file_for_malware

router = APIRouter(prefix="/api", tags=["documents"])
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg"}
DOCUMENT_TYPES = {
    "aadhaar",
    "identity",
    "bank_passbook",
    "income_certificate",
    "residence_certificate",
    "application",
    "other",
}

def get_current_citizen(x_citizen_id: UUID | None = Header(None), db: Session = Depends(get_db)) -> Citizen:
    """Simulated authentication dependency."""
    fallback_uuid = UUID("00000000-0000-0000-0000-000000000000")
    cid = x_citizen_id or fallback_uuid
    citizen = db.get(Citizen, cid)
    if not citizen:
        citizen = Citizen(id=cid, name="Demo Citizen", phone="9999999999", state="KA", district="Bangalore")
        db.add(citizen)
        db.commit()
        db.refresh(citizen)
    return citizen

def log_audit(db: Session, action: str, actor: str, citizen_id: UUID | None = None, application_id: UUID | None = None, document_id: UUID | None = None, purpose: str | None = None, metadata: dict | None = None):
    log = AuditLog(
        action=action,
        actor=actor,
        citizen_id=citizen_id,
        application_id=application_id,
        document_id=document_id,
        purpose=purpose,
        metadata_info=metadata or {}
    )
    db.add(log)


def get_document(document_id: UUID, current_citizen: Citizen, db: Session) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify ownership
    if document.citizen_id != current_citizen.id:
        log_audit(db, "unauthorized_access_attempt", str(current_citizen.id), citizen_id=current_citizen.id, document_id=document_id)
        db.commit()
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    return document


@router.post("/documents/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    citizen_id: UUID = Form(...),
    document_type: str = Form(...),
    document_purpose: str = Form(None),
    application_id: UUID | None = Form(None),
    current_citizen: Citizen = Depends(get_current_citizen),
    db: Session = Depends(get_db),
) -> Document:
    if citizen_id != current_citizen.id:
        raise HTTPException(status_code=403, detail="Cannot upload documents for another citizen")

    extension = Path(file.filename or "").suffix.lower()
    mime_type = file.content_type or mimetypes.types_map.get(extension)
    
    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Only PDF, PNG, JPG, and JPEG files are supported")
    if document_type.lower() not in DOCUMENT_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported document type")
        
    if application_id is not None and db.get(Application, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
        
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
    # Security constraint: Data minimization & purpose limitation
    if not document_purpose:
        document_purpose = f"Upload {document_type}"

    # Malware scan
    if not scan_file_for_malware(content, mime_type or ""):
        log_audit(db, "malware_detected", str(current_citizen.id), citizen_id=citizen_id, purpose=document_purpose)
        db.commit()
        raise HTTPException(status_code=400, detail="Malware detected in uploaded file")
        
    # File size validation (e.g. 10MB limit)
    file_size = len(content)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    # Encrypt
    encrypted_data, encryption_version = encrypt_document(content)
    
    # Store
    storage_key, sha256_hash = store_document(encrypted_data, extension)

    document = Document(
        citizen_id=citizen_id,
        application_id=application_id,
        document_type=document_type,
        document_purpose=document_purpose,
        file_size=file_size,
        original_filename=file.filename,
        mime_type=mime_type,
        verification_status="uploaded",
        storage_key=storage_key,
        sha256_hash=sha256_hash,
        encryption_version=encryption_version,
        encrypted=True,
    )
    db.add(document)
    db.flush() # get document ID
    
    log_audit(db, "document_uploaded", str(current_citizen.id), citizen_id=citizen_id, application_id=application_id, document_id=document.id, purpose=document_purpose, metadata={"file_size": file_size, "hash": sha256_hash})
    
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/{document_id}/extract", response_model=DocumentRead)
def extract_document(document_id: UUID, current_citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)) -> Document:
    document = get_document(document_id, current_citizen, db)
    
    if not document.storage_key or not document.encryption_version:
        raise HTTPException(status_code=410, detail="Document storage information is missing")
        
    document.verification_status = "processing"
    db.commit()
    
    # Retrieve & Decrypt
    try:
        encrypted_data = retrieve_document(document.storage_key)
        decrypted_data = decrypt_document(encrypted_data, document.encryption_version)
    except FileNotFoundError:
        raise HTTPException(status_code=410, detail="Stored document file is unavailable")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

    fields = extract_fields(decrypted_data, document.mime_type or "")
    
    # Clear decrypted data immediately
    del decrypted_data
    
    document.extracted_fields = fields
    extracted = {item["field"]: item["value"] for item in fields}
    document.holder_name = extracted.get("holder_name")
    document.address = extracted.get("address")
    document.document_number = extracted.get("document_number")
    document.extraction_confidence = (
        sum(item["confidence"] for item in fields) / len(fields) if fields else 0.0
    )
    document.verification_status = (
        "extracted" if document.extraction_confidence >= 0.8 else "needs_review"
    )
    document.processing_status = "completed"
    document.processed_at = datetime.utcnow()
    
    log_audit(db, "document_extracted", str(current_citizen.id), citizen_id=current_citizen.id, document_id=document.id, purpose="Data extraction via OCR")
    
    db.commit()
    db.refresh(document)
    return document


@router.get("/documents/{document_id}", response_model=DocumentRead)
def read_document(document_id: UUID, current_citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)) -> Document:
    doc = get_document(document_id, current_citizen, db)
    log_audit(db, "document_accessed", str(current_citizen.id), citizen_id=current_citizen.id, document_id=document_id)
    db.commit()
    return doc


@router.get("/documents/{document_id}/download")
def download_document(document_id: UUID, current_citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)):
    document = get_document(document_id, current_citizen, db)
    
    if not document.storage_key or not document.encryption_version:
        raise HTTPException(status_code=410, detail="Document storage information is missing")
        
    log_audit(db, "document_download_requested", str(current_citizen.id), citizen_id=current_citizen.id, document_id=document_id)
    db.commit()
    
    try:
        encrypted_data = retrieve_document(document.storage_key)
        decrypted_data = decrypt_document(encrypted_data, document.encryption_version)
    except FileNotFoundError:
        raise HTTPException(status_code=410, detail="Stored document file is unavailable")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

    return Response(content=decrypted_data, media_type=document.mime_type or "application/octet-stream")


@router.get("/applications/{application_id}/documents", response_model=list[DocumentRead])
def list_application_documents(application_id: UUID, current_citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)) -> list[Document]:
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.citizen_id != current_citizen.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return list(
        db.scalars(
            select(Document).where(Document.application_id == application_id).order_by(Document.created_at.desc())
        ).all()
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: UUID, current_citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)):
    """Securely deletes a document."""
    document = get_document(document_id, current_citizen, db)
    
    if document.storage_key:
        delete_document_from_storage(document.storage_key)
        
    document.deleted_at = datetime.utcnow()
    # Mask remaining PII in database but keep the record for audit
    document.holder_name = None
    document.document_number = None
    document.address = None
    document.extracted_fields = None
    document.storage_key = None
    document.file_size = None
    document.sha256_hash = None
    
    log_audit(db, "document_deleted", str(current_citizen.id), citizen_id=current_citizen.id, document_id=document_id)
    
    db.commit()
    return None
