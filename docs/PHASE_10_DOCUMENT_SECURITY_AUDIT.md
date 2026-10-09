# Phase 10 Document Security Audit

## Current document flow
Users upload documents via the React frontend. The files are sent to the FastAPI backend, where they undergo validation (size and MIME type), a malware scan, AES-256-GCM encryption, and are finally stored in a secure local vault. Extracted data (OCR) is performed on decrypted data in memory, and the plain text is deleted immediately afterward.

## Current storage mechanism
Documents are stored in a private directory outside the public frontend structure (`secure_vault`). For production, this directory acts as a local fallback but should be replaced by a private object store (e.g., AWS S3, Azure Blob). The frontend never directly accesses these files; all access is via the authenticated API backend.

## Current database fields
The `Document` model includes comprehensive tracking and security fields: `citizen_id`, `application_id`, `document_type`, `document_purpose`, `original_filename`, `mime_type`, `file_size`, `storage_key`, `sha256_hash`, `encryption_version`, `encrypted`, `processing_status`, `verification_status`, `uploaded_at`, `processed_at`, `deleted_at`, and `expires_at`.

## Current security controls
1. **Validation**: Files are checked for appropriate size (10MB max) and MIME types (PDF, PNG, JPG).
2. **Encryption**: AES-256-GCM authenticated encryption is enforced for all stored documents. The key must be injected via the `DOCUMENT_ENCRYPTION_KEY` environment variable.
3. **Hashing**: SHA-256 hashes are used for integrity and stored in the database.
4. **Data Minimization**: Only requested fields are extracted, and documents must have an assigned `document_purpose`.

## Current OCR implementation
When a document is extracted, it is decrypted in-memory. The text is extracted using `pypdf` or `pytesseract`. The needed fields are found using regex, stored in the DB, and the decrypted bytes are then freed. The AI agent only receives structured masked data.

## Current masking implementation
The OCR extraction automatically masks sensitive information. Aadhaar numbers are reduced to their last 4 digits (`XXXX XXXX 9012`), and Bank Accounts are masked to `****4821`. Complete numbers are never persisted in logs or unmasked output.

## Current authentication
Document access (upload, extract, read, download, delete) enforces authentication via a `x-citizen-id` header (with a development fallback). 

## Current authorization
Ownership validation is strict. When attempting to access, download, or delete a document, the system verifies that the `citizen_id` of the document matches the `current_citizen`. IDOR attempts are rejected with 403 Forbidden.

## Current audit logging
Document lifecycle events such as `document_uploaded`, `document_extracted`, `document_accessed`, `document_download_requested`, `malware_detected`, and `document_deleted` are logged in the `AuditLog` table with metadata. Sensitive data is never written to logs.

## Security gaps
- **Configuration Defaults**: Some configurations, like CORS in `main.py`, include `allow_origins=["*"]` implicitly for local development along with `allow_credentials=True`.
- **Malware Scanner**: Currently relies on a mock function (`scan_file_for_malware`) that only checks for the EICAR test string. A production-ready scanner (like ClamAV) must be integrated.
- **Frontend Privacy UI**: The frontend requires a "Privacy & Documents" UI center for transparency and purpose-based upload prompts.

## Recommended changes
- Update `.env.example` to provide a placeholder for the encryption key.
- Strengthen CORS configuration in production to only whitelist authorized domains.
- Construct the Frontend Privacy UI to enforce document purpose limits on upload and provide visibility into document handling.
- Configure production cloud storage backend interfaces.
