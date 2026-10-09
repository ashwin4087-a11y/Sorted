import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Scheme
from scripts.normalize_schemes import normalize_row

client = TestClient(app)

def test_normalize_row_handles_empty_values():
    row = {
        "Scheme Slug": "test-slug",
        "Scheme Name": "Test Scheme",
        "Level": "Central",
        "State / UT / Ministry": "Ministry of Test",
        "Application Mode": "Online",
        "Tags / Categories": "Agriculture",
        "Description": "Test Description",
        "Eligibility Criteria": "Test Eligibility",
        "Eligibility (General)": "Test General",
        "Exclusions / Ineligibility": "Test Exclusions",
        "Benefits": "Test Benefits",
        "Application Process": "Test Process",
        "Documents Required": "Test Docs",
        "Frequently Asked Questions (FAQs)": "Test FAQs",
        "Official Link": "https://test.com",
        "MyScheme URL": "https://myscheme.test.com"
    }
    normalized = normalize_row(row)
    assert normalized["scheme_code"] == "test-slug"
    assert normalized["name"] == "Test Scheme"
    assert normalized["level"] == "Central"
    assert normalized["ministry"] == "Ministry of Test"
    assert normalized["state"] is None
    assert normalized["application_mode"] == "Online"
    assert normalized["eligibility_general"] == "Test General"
    assert normalized["exclusions"] == "Test Exclusions"
    assert normalized["faqs"] == "Test FAQs"

def test_api_scheme_pagination():
    response = client.get("/api/schemes?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data

def test_api_scheme_search():
    response = client.get("/api/schemes/search?keyword=Agriculture")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["items"], list)

def test_api_scheme_filtering():
    response = client.get("/api/schemes?level=Central")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["items"], list)

def test_api_scheme_not_found():
    # Use a dummy UUID for not found
    dummy_uuid = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/schemes/{dummy_uuid}")
    assert response.status_code == 404
