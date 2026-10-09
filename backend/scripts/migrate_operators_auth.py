from sqlalchemy import text

from app.database import engine

with engine.begin() as c:
    c.execute(text("ALTER TABLE operators ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
    c.execute(text("ALTER TABLE operators ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) NOT NULL DEFAULT 'google'"))
    c.execute(text("ALTER TABLE operators ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ"))
    r = c.execute(text(
        "DELETE FROM operators WHERE google_id LIKE 'mock-google-%' "
        "OR google_id IN ('test-google-id', 'google-oauth2|1234567890') "
        "OR google_id LIKE 'google-oauth2|%'"
    ))
    print("mock operators removed:", r.rowcount)
    print("remaining operators:", c.execute(text("SELECT count(*) FROM operators")).scalar())
