from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings

print("Settings cors origins:", get_settings().cors_origins)

client = TestClient(app)
response = client.options("/api/schemes", headers={
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "GET"
})
print("TestClient Status:", response.status_code)
print("TestClient Body:", response.text)
print("TestClient Headers:", response.headers)
