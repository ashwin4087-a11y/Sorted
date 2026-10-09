import mimetypes
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, Citizen, Document
from app.schemas.documents import DocumentRead
from app.services.document_extraction import extract_fields

router = APIRouter(prefix="/api", tags=["documents"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
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


def get_document(document_id: UUID, db: Session) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/documents/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    citizen_id: UUID = Form(...),
    document_type: str = Form(...),
    application_id: UUID | None = Form(None),
    db: Session = Depends(get_db),
) -> Document:
    extension = Path(file.filename or "").suffix.lower()
    mime_type = file.content_type or mimetypes.types_map.get(extension)
    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Only PDF, PNG, JPG, and JPEG files are supported")
    if document_type.lower() not in DOCUMENT_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported document type")
    if db.get(Citizen, citizen_id) is None:
        raise HTTPException(status_code=404, detail="Citizen not found")
    if application_id is not None and db.get(Application, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_path = UPLOAD_DIR / f"{uuid4()}{extension}"
    stored_path.write_bytes(content)
    document = Document(
        citizen_id=citizen_id,
        application_id=application_id,
        document_type=document_type,
        file_path=str(stored_path.relative_to(UPLOAD_DIR.parent)),
        original_filename=file.filename,
        mime_type=mime_type,
        verification_status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/{document_id}/extract", response_model=DocumentRead)
def extract_document(document_id: UUID, db: Session = Depends(get_db)) -> Document:
    document = get_document(document_id, db)
    path = UPLOAD_DIR.parent / (document.file_path or "")
    if not path.is_file():
        raise HTTPException(status_code=410, detail="Stored document file is unavailable")
    document.verification_status = "processing"
    db.commit()
    fields = extract_fields(path, document.mime_type or "")
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
    db.commit()
    db.refresh(document)
    return document


@router.get("/documents/{document_id}", response_model=DocumentRead)
def read_document(document_id: UUID, db: Session = Depends(get_db)) -> Document:
    return get_document(document_id, db)


@router.get("/applications/{application_id}/documents", response_model=list[DocumentRead])
def list_application_documents(application_id: UUID, db: Session = Depends(get_db)) -> list[Document]:
    return list(
        db.scalars(
            select(Document).where(Document.application_id == application_id).order_by(Document.created_at.desc())
        ).all()
    )
