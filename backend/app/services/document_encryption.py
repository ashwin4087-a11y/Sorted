import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import get_settings

CURRENT_VERSION = "aes-256-gcm-v1"

def _get_key() -> bytes:
    key_hex = get_settings().document_encryption_key
    if not key_hex:
        raise ValueError("DOCUMENT_ENCRYPTION_KEY is missing from environment")
    try:
        key = bytes.fromhex(key_hex)
    except ValueError:
        raise ValueError("DOCUMENT_ENCRYPTION_KEY must be a hex string")
    
    if len(key) != 32:
        raise ValueError(f"DOCUMENT_ENCRYPTION_KEY must be 32 bytes (64 hex characters), got {len(key)}")
    return key


def encrypt_document(data: bytes) -> tuple[bytes, str]:
    """
    Encrypts the document data using AES-256-GCM.
    Returns a tuple of (encrypted_data_with_iv_prepended, encryption_version).
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext, CURRENT_VERSION


def decrypt_document(encrypted_data: bytes, version: str) -> bytes:
    """
    Decrypts the document data using AES-256-GCM.
    """
    if version != CURRENT_VERSION:
        raise ValueError(f"Unsupported encryption version: {version}")
        
    key = _get_key()
    aesgcm = AESGCM(key)
    
    if len(encrypted_data) < 12:
        raise ValueError("Encrypted data is too short to contain a nonce")
        
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    
    return aesgcm.decrypt(nonce, ciphertext, None)
