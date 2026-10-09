# PHASE 11: FUNCTIONAL AUDIT

## Overview
This document outlines the findings from an initial inspection of the SORTED application's frontend and backend, identifying gaps in functional integration and end-to-end wiring. The goal is to eliminate hardcoded demo paths and connect the UI directly to the real PostgreSQL-backed API.

## Frontend Assessment

### App & Routing (`App.tsx`)
- **Current State:** Uses a simple state-based tab switcher (`activeTab`).
- **Data Source:** Hardcoded `LAKSHMI_CASE` and `LAKSHMI_PRE_CASE` from `data/demoCases.ts`.
- **Issues:** 
  - Fake "RESET DEMO" button.
  - Case selection is entirely mocked.
  - Doesn't load real Citizen or Application state from the backend.
  - Needs to transition from a demo UI to a real application shell with proper routing (e.g., using `react-router-dom` or robust state machine) or at least manage a real `activeApplicationId`.

### Scheme Discovery (`SchemeDiscovery.tsx`)
- **Current State:** Uses `/api/schemes` to search for schemes.
- **Issues:**
  - "Start Pre-Submission Check" button does absolutely nothing (`onClick` missing).
  - No detailed view of the scheme.
  - Does not transition the user into creating an `Application` for a specific scheme.

### Operator Console (`OperatorConsole.tsx`)
- **Current State:** A chat interface for citizen intake.
- **Issues:**
  - Attempts to call a non-existent `/api/operator` endpoint.
  - Backend actually has `/api/agent/chat`.
  - Chat history and facts are updated locally but not persisted properly in relation to a real citizen/application.
  
### Pre-Submission Health Check (`PreSubmissionHealthCheck.tsx`)
- **Current State:** Calls `/api/health-check/{appId}`.
- **Issues:**
  - Uses a hardcoded `00000000-0000-0000-0000-000000000000` dummy Application ID.
  - Reverts to local demo data for document previews and traces when the API data doesn't perfectly align.
  - The "Upload Additional Statutory Document" button has no `onClick` handler and no actual file input logic. Needs to wire up to `/api/documents/upload`.

### DBT Failure Diagnoser (`DBTFailureDiagnoser.tsx`)
- **Current State:** Interfaces with `/api/payment-diagnosis/start` and `/api/payment-diagnosis/{caseId}/answer`.
- **Issues:**
  - Uses a hardcoded `dummyCitizenId` (`00000000-0000-0000-0000-000000000000`).
  - Lacks a mechanism to associate the diagnosis with an actual selected citizen from the DB.
  
### Generated Letters (`GeneratedArtifactsView.tsx`) & One-Trip Planner (`OneTripPlannerView.tsx`)
- **Current State:** (To be inspected further) likely using client-side generation instead of calling backend or saving the artifacts to the database.

## Backend Assessment

The backend API is robust and structured via FastAPI. It already contains the endpoints needed to fulfill these interactions:
- `/api/citizens`
- `/api/applications`
- `/api/documents` (including `/upload` with Phase 10 security)
- `/api/health-check`
- `/api/agent/chat`
- `/api/schemes`
- `/api/payment-diagnosis`

## Required Actions for Full Wiring
1. **Remove `demoCases.ts`** and replace it with real state management for a selected `Citizen` and `Application`.
2. **Wire Scheme Discovery:** Allow users to search -> View Scheme -> Create Application.
3. **Wire Document Upload:** In the health check or application view, connect the file uploader to the `/api/documents/upload` endpoint, ensuring the `x-citizen-id` header is properly managed.
4. **Wire Health Check:** Execute health checks using the actual `Application ID` generated in the DB.
5. **Wire Operator Console:** Update the endpoint in `api.ts` to point to `/api/agent/chat` and handle the response correctly.
6. **Wire Diagnoser:** Allow selection of a citizen/application and use their real ID for starting a payment diagnosis.
7. **Ensure UI consistency:** Remove all fake/placeholder `onClick={() => {}}`, `console.log`, and "Coming soon" elements.
