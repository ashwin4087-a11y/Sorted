# Sorted architecture

Sorted keeps the first iteration deliberately small:

1. The Vite client owns navigation and the presentational product shell.
2. FastAPI exposes versioned backend capabilities as routers.
3. Pydantic schemas define API contracts.
4. SQLAlchemy provides the PostgreSQL session boundary through `app.database`.
5. Services, agents, tools, and rules are isolated extension points for later workflow implementation.

The frontend and backend communicate over HTTP. CORS is restricted to the configured frontend origins, and secrets are loaded from `.env` using `pydantic-settings`.

