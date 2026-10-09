from app.config import Settings

s = Settings()
print("Frontend origins string:", repr(s.frontend_origins))
print("CORS origins list:", s.cors_origins)
