import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models.base import Base
from app.models.entities import Citizen, Document, Application
from app.services.document_encryption import encrypt_document, decrypt_document

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def setup_citizen(test_db):
    cid = uuid4()
    citizen = Citizen(id=cid, name="Test Citizen", phone="1234567890", state="Test", district="Test")
    test_db.add(citizen)
    test_db.commit()
    test_db.refresh(citizen)
    return citizen

def test_upload_valid_pdf(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    # Valid PDF signature
    pdf_content = b"%PDF-1.4\nTest PDF content for valid upload test."
    
    response = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar",
            "document_purpose": "IDENTITY_VERIFICATION"
        },
        files={"file": ("test.pdf", pdf_content, "application/pdf")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["document_type"] == "aadhaar"
    assert data["encrypted"] is True
    assert "id" in data

def test_upload_unsupported_file(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    exe_content = b"MZ\x90\x00\x03\x00\x00\x00"
    
    response = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar",
            "document_purpose": "IDENTITY_VERIFICATION"
        },
        files={"file": ("malware.exe", exe_content, "application/x-msdownload")}
    )
    assert response.status_code == 415

def test_upload_malformed_malware_file(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    eicar = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    
    response = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar",
            "document_purpose": "IDENTITY_VERIFICATION"
        },
        files={"file": ("test.pdf", eicar, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Malware detected" in response.json()["detail"]

def test_upload_oversized_file(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    large_content = b"0" * (11 * 1024 * 1024)  # 11 MB
    
    response = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar",
            "document_purpose": "IDENTITY_VERIFICATION"
        },
        files={"file": ("test.pdf", large_content, "application/pdf")}
    )
    assert response.status_code == 413
    assert "File too large" in response.json()["detail"]

def test_authorization_owner_can_access(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    pdf_content = b"%PDF-1.4\nTest PDF"
    
    upload_res = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar"
        },
        files={"file": ("test.pdf", pdf_content, "application/pdf")}
    )
    doc_id = upload_res.json()["id"]
    
    get_res = client.get(f"/api/documents/{doc_id}", headers={"x-citizen-id": cid})
    assert get_res.status_code == 200

def test_authorization_unauthorized_user_receives_403(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    pdf_content = b"%PDF-1.4\nTest PDF"
    
    upload_res = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar"
        },
        files={"file": ("test.pdf", pdf_content, "application/pdf")}
    )
    doc_id = upload_res.json()["id"]
    
    other_cid = str(uuid4())
    get_res = client.get(f"/api/documents/{doc_id}", headers={"x-citizen-id": other_cid})
    assert get_res.status_code == 403

def test_encryption_decryption_works():
    content = b"Test secret content"
    enc, version = encrypt_document(content)
    assert enc != content
    dec = decrypt_document(enc, version)
    assert dec == content

def test_masking_extraction(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    pdf_content = b"Aadhaar: 123456789012\nAccount Number: 987654321098"
    
    # Needs to upload as text to simulate OCR for testing (or we test the service directly)
    from app.services.document_extraction import extract_fields
    fields = extract_fields(pdf_content, "text/plain")
    
    extracted = {f["field"]: f["value"] for f in fields}
    assert extracted.get("document_number") == "XXXX XXXX 9012"
    assert extracted.get("bank_account_last4") == "****1098"

def test_document_deletion(setup_citizen, test_db):
    cid = str(setup_citizen.id)
    pdf_content = b"%PDF-1.4\nTest PDF"
    
    upload_res = client.post(
        "/api/documents/upload",
        headers={"x-citizen-id": cid},
        data={
            "citizen_id": cid,
            "document_type": "aadhaar"
        },
        files={"file": ("test.pdf", pdf_content, "application/pdf")}
    )
    doc_id = upload_res.json()["id"]
    
    del_res = client.delete(f"/api/documents/{doc_id}", headers={"x-citizen-id": cid})
    assert del_res.status_code == 204
    
    get_res = client.get(f"/api/documents/{doc_id}", headers={"x-citizen-id": cid})
    assert get_res.status_code == 200
    assert get_res.json()["deleted_at"] is not None
