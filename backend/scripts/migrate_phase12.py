import sys
from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        # Add columns to citizens
        conn.execute(text("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS operator_id UUID;"))
        conn.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_citizens_operator_id') THEN ALTER TABLE citizens ADD CONSTRAINT fk_citizens_operator_id FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL; END IF; END $$;"))
        
        conn.execute(text("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS verification_source VARCHAR(50);"))
        conn.execute(text("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS digilocker_id VARCHAR(100) UNIQUE;"))
        conn.execute(text("ALTER TABLE citizens ADD COLUMN IF NOT EXISTS profile_data JSONB;"))

        print("Migration Phase 12 completed.")

if __name__ == "__main__":
    migrate()
