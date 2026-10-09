# Phase 2 - Remaining Integration Tasks

## Backend Seed Data Needed
The frontend relies on the synthetic "Lakshmi" demo scenario to showcase the application's capabilities. During Phase 2, the frontend was wired to real backend endpoints using `api.ts`, but the backend database currently lacks the required seeded records to fully test the flow end-to-end without receiving 404 errors.

To fully realize the demo in future phases, the backend needs a seed script that creates:
1. **Citizen Record**: Lakshmi (with correct name, DOB, address).
2. **Scheme Record**: A scheme instance (e.g., PM-KISAN or similar) mapped to Lakshmi.
3. **Application Record (Post-Submission)**: An approved application for Lakshmi that is currently failing DBT.
4. **Application Record (Pre-Submission)**: An incomplete/draft application for Lakshmi to demonstrate Health Check mismatches.
5. **Document Records**: Sample PDFs/images (Aadhaar, Bank Passbook, etc.) linked to the applications with specific OCR-extracted facts that trigger the mismatch and health check algorithms.

Until this seed data is provided in the backend, the React frontend will handle 404s gracefully when attempting to run Health Checks or Payment Diagnoses on the mock `currentCase.id`.
