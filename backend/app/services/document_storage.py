import os
import hashlib
from pathlib import Path
from uuid import uuid4

STORAGE_DIR = Path(__file__).resolve().parents[2] / "secure_vault"

def init_storage():
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    # Ensure it is locked down
    if os.name == 'posix':
        os.chmod(STORAGE_DIR, 0o700)

init_storage()

def store_document(encrypted_data: bytes, extension: str) -> tuple[str, str]:
    """
    Stores encrypted document in the secure vault.
    Returns (storage_key, sha256_hash).
    """
    sha256_hash = hashlib.sha256(encrypted_data).hexdigest()
    storage_key = f"{uuid4().hex}{extension}"
    
    file_path = STORAGE_DIR / storage_key
    file_path.write_bytes(encrypted_data)
    
    if os.name == 'posix':
        os.chmod(file_path, 0o600)
        
    return storage_key, sha256_hash


def retrieve_document(storage_key: str) -> bytes:
    """
    Retrieves the encrypted document from the secure vault.
    """
    file_path = STORAGE_DIR / storage_key
    if not file_path.is_file():
        raise FileNotFoundError(f"Document not found in storage: {storage_key}")
        
    return file_path.read_bytes()

def delete_document_from_storage(storage_key: str) -> bool:
    """
    Deletes a document from the secure vault securely.
    """
    file_path = STORAGE_DIR / storage_key
    if file_path.is_file():
        # Secure delete (overwrite with 0 before unlink)
        size = file_path.stat().st_size
        with open(file_path, "wb") as f:
            f.write(b'\0' * size)
        file_path.unlink()
        return True
    return False
