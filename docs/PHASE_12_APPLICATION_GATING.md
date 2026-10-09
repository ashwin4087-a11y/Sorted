# Phase 12 Application Gating

- Applications are blocked at backend if NEEDS_VERIFICATION (409) or NOT_ELIGIBLE (403).
- Frontend state manipulation cannot bypass backend checks.
