from sqlalchemy import select

from app.database import SessionLocal
from app.models import Citizen


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(Citizen).where(Citizen.phone == "9999999999"))
        if existing:
            print(f"Basic citizen already exists: {existing.id}")
            citizen = existing
        else:
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

        from app.models import Application, Scheme
        from uuid import UUID

        scheme_id = UUID("00000000-0000-0000-0000-000000000001")
        existing_scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
        if not existing_scheme:
            scheme = Scheme(
                id=scheme_id,
                scheme_code="DEMO_SCHEME",
                name="Demo General Pension",
            )
            db.add(scheme)
            db.commit()

        app_id = UUID("00000000-0000-0000-0000-000000000000")
        existing_app = db.scalar(select(Application).where(Application.id == app_id))
        if not existing_app:
            application = Application(
                id=app_id,
                citizen_id=citizen.id,
                scheme_id=scheme_id,
                status="draft",
            )
            db.add(application)
            db.commit()
            print(f"Created basic application: {application.id}")
        else:
            print(f"Basic application already exists: {existing_app.id}")


if __name__ == "__main__":
    seed()
