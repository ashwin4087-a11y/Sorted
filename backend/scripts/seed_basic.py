from sqlalchemy import select

from app.database import SessionLocal
from app.models import Citizen


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(Citizen).where(Citizen.phone == "9999999999"))
        if existing:
            print(f"Basic citizen already exists: {existing.id}")
            return
        citizen = Citizen(
            name="Test Citizen",
            phone="9999999999",
            language="en",
            state="Delhi",
            district="New Delhi",
        )
        db.add(citizen)
        db.commit()
        print(f"Created basic citizen: {citizen.id}")


if __name__ == "__main__":
    seed()
