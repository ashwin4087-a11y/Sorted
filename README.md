# Sorted

Sorted is a hackathon-ready full-stack foundation for an AI agent that helps citizens resolve government-benefit problems before or after applying. The first iteration provides the product shell and API health check; business workflows are intentionally left for the next build phase.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL
- **AI:** LLM provider configured through environment variables

## Project layout

```text
sorted/
├── frontend/                 # React + Vite client
├── backend/
│   ├── app/
│   │   ├── agents/           # Agent orchestration
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # FastAPI endpoints
│   │   ├── rules/            # Benefits and validation rules
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Application services
│   │   ├── tools/            # Agent tools and integrations
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   └── requirements.txt
├── data/
│   ├── raw/
│   └── processed/
├── scripts/
└── docs/
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (a local database is enough for the scaffold)

## Local setup

### 1. Configure environment variables

From the project root:

```powershell
Copy-Item .env.example backend\.env
```

Update `backend/.env` with your PostgreSQL connection details. Keep provider keys local; do not commit `.env`.

### 2. Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Check `http://localhost:8000/health` or open the interactive docs at `http://localhost:8000/docs`.

### 3. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

## Notes

- The API currently exposes only `GET /health`.
- PostgreSQL and SQLAlchemy are configured, with database tables managed through Alembic.
- AI credentials are read from environment variables and are not hard-coded.
- The frontend pages are presentational placeholders designed for rapid iteration during a six-hour hackathon.

## Database workflow

With `backend/.env` configured for a reachable PostgreSQL database:

```powershell
cd backend
$env:PYTHONPATH = "."
python -m alembic upgrade head
python scripts\seed_basic.py
```

The initial migration creates the citizen, scheme, application, document, health-check, mismatch, payment, diagnosis, action, event, and agent-activity tables. Database-backed CRUD is available for citizens and applications at `/citizens` and `/applications`.

## Government scheme dataset

The real public dataset is imported from `gov-myscheme-dataset/gov_myscheme_data.csv`:

```powershell
cd backend
$env:PYTHONPATH = "."
python -m alembic upgrade head
python scripts\import_schemes.py
```

The importer validates CSV headers, normalizes nulls and tags, preserves source URLs and source text, and skips duplicate scheme slugs. It reports total rows, imported rows, skipped rows, duplicates, and invalid records. The current dataset contains 2,066 rows and imports 1,866 unique schemes.

Scheme search endpoints:

- `GET /api/schemes?page=1&limit=20&keyword=&state=&level=&category=`
- `GET /api/schemes/search` with the same parameters
- `GET /api/schemes/{scheme_id}`

Search is performed in PostgreSQL over scheme names, descriptions, tags/categories, eligibility, and benefits. The API returns only the requested page; the full dataset is never sent to an LLM.

## Document upload and extraction

The document workflow accepts PDF, PNG, JPG, and JPEG files at:

- `POST /api/documents/upload`
- `POST /api/documents/{id}/extract`
- `GET /api/documents/{id}`
- `GET /api/applications/{application_id}/documents`

Supported document types are identity/Aadhaar, bank passbook, income certificate, residence certificate, application document, and other. PDF text extraction uses `pypdf`; image OCR is used when optional Pillow/Tesseract tooling is available. Uncertain fields are returned as `UNKNOWN` and documents below the confidence threshold are marked `needs_review`.

Sensitive values are never persisted in full: Aadhaar-like numbers are stored as `XXXX XXXX ####`, and bank account extraction stores only `****####`. Generate synthetic demo PDFs with:

```powershell
cd backend
python scripts\create_sample_documents.py
```

## DBT payment diagnosis

The payment diagnosis flow is a rule-based, citizen-guided decision tree:

- `POST /api/payment-diagnosis/start`
- `POST /api/payment-diagnosis/{case_id}/answer`
- `GET /api/payment-diagnosis/{case_id}`

Rules are configured in `backend/app/rules/dbt_failure_rules.json`. The flow asks the citizen for payment, account, seeding, beneficiary, and rejection information. It does not access Aadhaar, NPCI, bank, or PFMS private records. Selecting `I don't know` provides instructions for obtaining the information and never becomes an assumed fact.
