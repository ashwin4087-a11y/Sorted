# SORTED - Hackathon Merge Plan

## A. Existing functionality in SCHEME SATHI (Backend)
- **FastAPI Framework & PostgreSQL**: Fully functional REST API backend.
- **SQLAlchemy Models**: Complete schema including Citizens, Schemes, Applications, Documents, Health Checks, Mismatches, Payment Cases, Diagnoses, Actions, Application Events, and Agent Activities.
- **Dataset Integration**: Import scripts for the 2,066-scheme dataset from MyScheme.
- **Document Processing**: API for document upload and extraction using `pypdf` and Pillow/Tesseract, with sensitive data masking.
- **Backend Services**: Authoritative logic for health checks, mismatch detection, and rule-based payment diagnosis.

## B. Existing functionality in SORTED (Frontend)
- **React + Vite App**: Comprehensive UI with Tailwind CSS.
- **User Interfaces**: Operator Console, Case Header, Timeline Tracker, Warning Hatch.
- **Interactive Workflows**: Health Check interface, Mismatch fixing UI, DBT Failure Diagnoser, One-Trip Planner interface, and Letter generation UI.
- **TypeScript Business Engines**: Contains duplicated business logic in TypeScript for diagnosis, mismatch detection, health checks, action compilation, and letter generation.
- **Mock Demo**: Strong synthetic "Lakshmi" demo scenario and responsive designs ready for hackathon presentation.

## C. Features that overlap
- **Health Check Logic**: Exists in both backend (`health_check.py`) and frontend (`healthCheckEngine.ts`).
- **Mismatch Detection**: Exists in both backend (`mismatch_fixer.py`) and frontend (`mismatchEngine.ts`).
- **DBT Payment Diagnosis**: Taxonomy and decision rules exist in both backend (`payment_diagnosis.py` / `dbt_failure_rules.json`) and frontend (`diagnoser.ts`).

## D. Features missing from both
- **Backend Action Compiler**: `action_compiler.py` is missing in the backend (currently exists only in frontend TS).
- **Backend Letter Generator**: Letter generation logic must be implemented in the Python backend to support English/Tamil securely.
- **Backend One-Trip Planner**: Missing in the backend; needs `one_trip_planner.py` service.
- **Application Tracker API**: Fully integrated `GET /api/applications/{id}/timeline` endpoint.
- **AI Agent API**: The `POST /api/agent/chat` endpoint with tool-calling capabilities and Tamil/English/Tanglish intent classification is missing.
- **Unified API Client**: The frontend lacks a centralized `api.ts` connecting all frontend features to the backend.

## E. Features to keep from SCHEME SATHI
- **FastAPI and PostgreSQL**: The authoritative backend framework and database.
- **All SQLAlchemy Models & Alembic migrations**.
- **Real Scheme Dataset**: The 2,066 MyScheme records and the PostgreSQL scheme search system.
- **Document Extraction & Masking**: The Python-based OCR and extraction logic.
- **Backend Rule Engines**: Keep and expand the Python-based Health Check, mismatch detection, and payment diagnosis as the single source of truth.

## F. Features to keep from SORTED
- **React Frontend**: The overall layout, navigation, visual design, and reusable components.
- **Specialized Interfaces**: Operator console, DBT diagnosis UI, One-Trip planner UI, letter interface, timeline, and agent activity views.
- **PFMS Taxonomy**: The stronger PFMS failure taxonomy from the frontend's TS code.
- **Demo Scenario**: The compelling Lakshmi demo data layout and hackathon presentation flow.

## G. Features to rewrite
- **TypeScript Business Engines**: Rewrite the React components to consume backend API responses rather than computing health checks, diagnosis, and action plans in the browser.
- **DBT Diagnoser Rules**: Merge the rich PFMS taxonomy from SORTED into the SCHEME SATHI backend (`dbt_failure_rules.json`).
- **Frontend API Calls**: Create a single `frontend/src/services/api.ts` using `VITE_API_BASE_URL` and route all data requests through it.
- **Action, Letter & One-Trip Planner**: Move these from frontend TS to backend Python services.

## H. Features to delete
- **Frontend Engines**: Safely delete or strip `healthCheckEngine.ts`, `diagnoser.ts`, `mismatchEngine.ts`, `actionCompiler.ts`, and `letterGenerator.ts` once their logic is securely moved to the backend.
- **Duplicate Backends/Databases**: Delete any Express server or secondary databases if they exist (though none were found, the rule remains).
- **Fake State**: Remove hardcoded application state in React that skips backend execution.

## I. API Mapping
- `GET /api/schemes` - Search and list schemes (DB-backed).
- `GET /api/schemes/{id}` - Fetch scheme details.
- `POST /api/applications` - Create application.
- `POST /api/documents/upload` - Upload documents.
- `POST /api/documents/{id}/extract` - Extract info from documents.
- `GET /api/health-check/{app_id}` - Retrieve authoritative health check result.
- `POST /api/payment-diagnosis/start` - Initialize DBT payment diagnosis.
- `POST /api/payment-diagnosis/{case_id}/answer` - Submit guided question answers.
- `GET /api/applications/{id}/timeline` - Retrieve application timeline.
- `POST /api/agent/chat` - Interact with the tool-calling AI agent.

## J. Database Mapping
- All domain concepts will strictly map to the existing SCHEME SATHI PostgreSQL `entities.py` models:
  - `Citizens`, `Schemes`, `Applications`, `Documents`, `HealthChecks`, `Mismatches`, `PaymentCases`, `Diagnoses`, `Actions`, `ApplicationEvents`, `AgentActivities`.

## K. Frontend/Backend Integration Plan
1. Establish `api.ts` in the frontend targeting `http://localhost:8000`.
2. Connect Scheme Discovery and Application creation screens to backend REST endpoints.
3. Replace frontend TS engine calls with API hooks that fetch Health Checks, Mismatch Plans, and Diagnoses from the backend.
4. Integrate the timeline and Agent Activity components with PostgreSQL events.
5. Create a `DEMO MODE` toggle in the frontend that invokes real backend APIs using synthetic "Lakshmi" data.

## L. Final Architecture
**SORTED React Frontend**  
*Handles layout, UI presentation, synthetic demo data injection, and rendering results.*  
↓ (REST API via `api.ts`)  
**SCHEME SATHI FastAPI Backend**  
*The authoritative source for rules, schemes, document processing, health checks, diagnosis, letter generation, one-trip plans, and AI tools.*  
↓ (SQLAlchemy)  
**PostgreSQL Database**  
*Persists Schemes, Citizens, Applications, Documents, Rules, and Events.*
