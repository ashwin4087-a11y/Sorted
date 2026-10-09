# Phase 12 API Flow

- `POST /api/auth/google`: Issues JWT session.
- `POST /api/digilocker/authorize`: Returns state and URL.
- `POST /api/digilocker/callback`: Validates state, syncs profile, sets `verified=True`.
- `POST /applications`: Creates application, gates based on `SchemeMatcher`.
- `POST /api/health-check/{id}`: Runs document mismatch health checks.
