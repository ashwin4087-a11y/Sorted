from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "sample_documents"

SAMPLES = {
    "synthetic_identity.pdf": [
        "SYNTHETIC DEMO DOCUMENT - NOT A REAL IDENTITY DOCUMENT",
        "Name: Lakshmi Devi",
        "Date of Birth: 12/04/1988",
        "Aadhaar: 9999 8888 7777",
        "Address: 12 Demo Street, Jaipur, Rajasthan",
        "State: Rajasthan",
        "District: Jaipur",
    ],
    "synthetic_bank_passbook.pdf": [
        "SYNTHETIC DEMO DOCUMENT - NOT A REAL BANK DOCUMENT",
        "Account Holder: Lakshmi Devi",
        "Bank Account: 0000000000123456",
        "IFSC: DEMO0001234",
        "Address: 12 Demo Street, Jaipur, Rajasthan",
    ],
    "synthetic_low_confidence.pdf": [
        "SYNTHETIC DEMO DOCUMENT - PARTIAL SAMPLE",
        "The name and address fields are intentionally absent for review testing.",
    ],
}


def create_sample(path: Path, lines: list[str]) -> None:
    document = canvas.Canvas(str(path), pagesize=A4)
    document.setFont("Helvetica", 12)
    y = 800
    for line in lines:
        document.drawString(50, y, line)
        y -= 24
    document.save()


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, lines in SAMPLES.items():
        create_sample(OUTPUT_DIR / filename, lines)
    print(f"Created {len(SAMPLES)} synthetic documents in {OUTPUT_DIR}")
