# MyScheme Dataset Integration Findings

## Inspection Results

### 1. Database Configuration
- **Current DB Type:** The `.env` file uses `DATABASE_URL=sqlite:///./sorted.db`, but `config.py` defaults to `postgresql+psycopg://sorted:sorted@localhost:5432/sorted`.
- **Finding:** The project is configured to use SQLAlchemy (`create_engine`) through `app.database`. The instructions explicitly mandate the use of the *existing PostgreSQL instance*. I will rely on the `database_url` config format, ensuring environment variables securely override it, and verify that PostgreSQL driver (`psycopg`) is being used instead of SQLite, reverting `.env` to PostgreSQL if necessary based on local project settings.

### 2. SQLAlchemy Models
- **Existing `Scheme` Model (`backend/app/models/entities.py`):**
  - Primary Key: UUID (`id`) via `UUIDTimestampModel`
  - Current Fields: `scheme_code`, `name`, `level`, `ministry`, `description`, `category`, `tags`, `state`, `eligibility`, `benefits`, `required_documents`, `application_process`, `official_url`, `myscheme_url`, `source`, `last_verified`.
  - Relationships: Has a one-to-many relationship with `Application` (`applications = relationship(back_populates="scheme")`).
- **Required New Fields:** The 16 source fields require adding:
  1. `application_mode` (String)
  2. `eligibility_general` (Text/JSONB)
  3. `exclusions` (Text/JSONB)
  4. `faqs` (JSONB)
- **Migrations:** Need to create an Alembic migration to add these 4 fields to the `schemes` table without wiping existing data.

### 3. Scheme Import Scripts
- **Current Script:** `backend/scripts/import_schemes.py` and `backend/scripts/normalize_schemes.py`.
- **Findings:** The current script skips duplicates (`if normalized["scheme_code"] in existing: ... continue`) rather than performing an upsert. It doesn't write rejected rows to a report, nor does it handle all 16 fields securely. It must be upgraded to a robust upsert mechanism that writes duplicate/rejection logs and preserves application foreign keys.

### 4. API Endpoints
- **Current API (`backend/app/routers/schemes.py`):** Supports pagination, keyword search, state, level, and category filtering.
- **Finding:** The query builder `scheme_query` searches `name`, `description`, `category`, `tags`, `eligibility`, and `benefits`. It will need to include the new fields like `application_mode` for filtering.
- **Current Schema (`backend/app/schemas/schemes.py`):** Needs to be updated to expose the newly added fields.

### 5. Frontend UI
- **Discovery Component:** `SchemeDiscovery.tsx` (built in Phase 6) hits the `/api/schemes` endpoint. It dynamically lists results from the backend. 
- **Finding:** No hardcoded scheme lists exist in the React files anymore. The UI securely pulls real data from the backend, complying with the requirement.

### 6. Overall Architecture
- **Data Flow:** SORTED React Frontend -> API Client (`api.ts`) -> FastAPI Backend -> PostgreSQL DB.
- **Finding:** Architecture complies fully with the request. We will strictly add the 16-field mapping, run an Alembic migration, and upgrade the data importer. No new databases or Supabase dependencies will be added.
