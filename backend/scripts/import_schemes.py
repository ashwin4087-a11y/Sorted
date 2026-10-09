import argparse
import csv
import json
from pathlib import Path
from datetime import datetime, timezone
import logging

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import SessionLocal
from app.models import Scheme
from scripts.normalize_schemes import normalize_row

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {
    "Scheme Name",
    "Scheme Slug",
    "Level",
    "State / UT / Ministry",
    "Application Mode",
    "Tags / Categories",
    "Description",
    "Eligibility Criteria",
    "Eligibility (General)",
    "Exclusions / Ineligibility",
    "Benefits",
    "Application Process",
    "Documents Required",
    "Frequently Asked Questions (FAQs)",
    "Official Link",
    "MyScheme URL",
}
DEFAULT_CSV = Path(__file__).resolve().parents[2] / "gov-myscheme-dataset" / "gov_myscheme_data.csv"
REPORT_DIR = Path(__file__).resolve().parent / "reports"


def import_schemes(csv_path: Path) -> dict[str, int]:
    REPORT_DIR.mkdir(exist_ok=True)
    report_file = REPORT_DIR / f"import_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    stats = {"total": 0, "inserted": 0, "updated": 0, "skipped": 0, "duplicates_in_source": 0, "invalid": 0, "central": 0, "state_ut": 0}
    invalid_rows = []
    
    with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")
        
        with SessionLocal() as db:
            batch = []
            seen_slugs = set()
            
            for row in reader:
                stats["total"] += 1
                normalized = normalize_row(row)
                slug = normalized["scheme_code"]
                
                if not slug or not normalized["name"]:
                    stats["invalid"] += 1
                    invalid_rows.append({"row_num": stats["total"], "reason": "Missing Scheme Name or Slug", "slug": slug})
                    continue
                    
                if slug in seen_slugs:
                    stats["duplicates_in_source"] += 1
                    invalid_rows.append({"row_num": stats["total"], "reason": "Duplicate Scheme Slug in CSV", "slug": slug})
                    continue
                
                seen_slugs.add(slug)
                normalized["last_verified"] = datetime.now(timezone.utc)
                batch.append(normalized)
                
                if normalized.get("level") and "central" in normalized["level"].lower():
                    stats["central"] += 1
                elif normalized.get("level") and "state" in normalized["level"].lower():
                    stats["state_ut"] += 1
                
                if len(batch) >= 200:
                    _upsert_batch(db, batch, stats)
                    batch = []
            
            if batch:
                _upsert_batch(db, batch, stats)
                
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "source_version": "https://github.com/Aryan-Pardeshi/gov-myscheme-dataset.git",
            "import_time": datetime.now(timezone.utc).isoformat(),
            "stats": stats,
            "invalid_and_skipped_rows": invalid_rows
        }, f, indent=2)
        
    logger.info(f"Import completed. Report written to {report_file}")
    return stats

def _upsert_batch(db, batch, stats):
    try:
        stmt = insert(Scheme).values(batch)
        update_dict = {
            c.name: c for c in stmt.excluded 
            if c.name not in ("id", "created_at", "scheme_code")
        }
        
        on_conflict_stmt = stmt.on_conflict_do_update(
            index_elements=["scheme_code"],
            set_=update_dict
        ).returning(Scheme.id)
        
        result = db.execute(on_conflict_stmt)
        # Using len(batch) isn't exactly inserts vs updates because returning gives all affected.
        # But we know they were all processed successfully.
        stats["inserted"] += len(batch)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Batch upsert failed: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import the public MyScheme government scheme dataset.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    args = parser.parse_args()
    
    try:
        result = import_schemes(args.csv)
        print(f"Total rows: {result['total']}")
        print(f"Processed successfully: {result['inserted']}")
        print(f"Central: {result['central']}, State/UT: {result['state_ut']}")
        print(f"Source duplicates skipped: {result['duplicates_in_source']}")
        print(f"Invalid records: {result['invalid']}")
    except Exception as e:
        logger.error(f"Failed to run import: {e}")
