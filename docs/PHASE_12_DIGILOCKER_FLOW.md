# Phase 12 DigiLocker Flow

- The user authenticates via Google.
- `operator.digilocker_verified` is checked.
- If false, user is sent to `DigiLockerGateway.tsx`.
- Upon clicking Verify, `POST /api/digilocker/authorize` initiates OAuth.
- The callback syncs the profile and grants dashboard access.
