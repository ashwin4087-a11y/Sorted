# Phase 10 Document Security Report

## Architecture
The secure document architecture is fully implemented. Documents are uploaded through an authenticated API endpoint. Upon arrival, the file is validated for size and MIME type. It undergoes a malware scan (a placeholder scanning logic that catches the EICAR test signature). The file is then encrypted in-memory using AES-256-GCM authenticated encryption. The ciphertext is persistently stored on disk in the secure vault. Only a reference to this encrypted blob (with its `storage_key`, `sha256_hash`, and `encryption_version`) is kept in PostgreSQL, along with metadata such as the `document_purpose` and `processing_status`.

## Storage
Documents are stored in a private directory backend (`secure_vault`). This directory acts as an abstraction and local fallback, separate from any frontend public or static directory. This prevents direct exposure via URLs and requires API authorization to decrypt and download files. 

## Encryption
AES-256-GCM is implemented via the Python `cryptography` package. Documents are encrypted using a 256-bit symmetric key (`DOCUMENT_ENCRYPTION_KEY` from environment variables) before they are written to disk.

## Authentication
Authentication is enforced on all document APIs (`/api/documents/*`) through the `get_current_citizen` dependency, which verifies the ownership. Any document access, deletion, or download is strictly guarded, and cross-user (IDOR) attempts return a `403 Forbidden` response.

## Masking
Aadhaar and bank account masking is implemented during OCR extraction in `document_extraction.py`. The Aadhaar number is masked to only show the last 4 digits (e.g., `XXXX XXXX 9012`). Similarly, bank account numbers are masked to only show the last 4 digits (e.g., `****1098`). Raw, unmasked numbers are not stored or sent downstream. 

## OCR
The OCR processing decrypts the encrypted document temporarily in memory, extracts required fields (using `pypdf` or `tesseract`), and cleans up the memory immediately after extraction. No permanent plaintext copies of the document are ever persisted. 

## AI Privacy
The AI agent (`/api/agent/chat`) does not receive raw documents. It receives text queries and replies contextually based on the scheme dataset. No personal document text, plaintext PII, or document blobs are ever submitted to the agent context. 

## Audit
The system records document lifecycle events into the `AuditLog` table.
The events recorded are:
- `document_uploaded`
- `malware_detected`
- `document_extracted`
- `document_accessed`
- `document_download_requested`
- `unauthorized_access_attempt`
- `document_deleted`

## Deletion
The document deletion mechanism (`DELETE /api/documents/{document_id}`) securely unlinks the file from storage (zero-ing out the file in local storage first) and retains the database record for audit purposes while masking out the PII in it. 

## Tests
All security testing is contained in `backend/tests/test_secure_documents.py`.
Execution result:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-8.4.2, pluggy-1.6.0
rootdir: D:\projects-2\SCHEME SATHI\backend
plugins: anyio-4.12.1, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collected 9 items

tests\test_secure_documents.py .........                                 [100%]

======================= 9 passed, 129 warnings in 1.32s =======================
```

## Build
```text
✓ 1685 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   2.10 kB │ gzip:   0.95 kB
dist/assets/index-CP16dESe.css   32.54 kB │ gzip:   7.44 kB
dist/assets/index-CS33_i-Y.js   356.87 kB │ gzip: 102.96 kB

✓ built in 290ms
```

## Known Limitations
- Cloud KMS not configured
- Production malware scanner not configured (currently using dummy string matching logic for ClamAV representation)
- Production object storage not configured (currently using local secure vault)
- Production retention policy requires legal review
- Frontend Privacy UI for uploading with purpose was not implemented as part of this exact session, but backend fully supports `document_purpose` validation.
