# Phase 12 Eligibility Flow

- Uses `SchemeMatcher` in-memory (`persist=False`) to batch-evaluate thousands of schemes.
- Filters down to `ELIGIBLE` and `NEEDS_VERIFICATION` schemes.
- Backend API securely blocks application creation if the scheme is `NOT_ELIGIBLE`.
