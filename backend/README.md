# Arif Alta Backend API

Backend API based on FastAPI, SQLModel (PostgreSQL), Milvus (Vector DB), and Langfuse (AI Tracing).

## 🚀 Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **ORM:** [SQLModel](https://sqlmodel.tiangolo.com/) (Pydantic + SQLAlchemy)
- **Database:** PostgreSQL
- **Vector DB:** [Milvus](https://milvus.io/)
- **Auth:** JWT with HttpOnly Cookies (Cross-site support)
- **Tracing:** [Langfuse](https://langfuse.com/)

## 🛠 Prerequisites

- Python 3.10+
- PostgreSQL
- Milvus (managed or local)
- `bun` or `npm` (for any frontend/sdk sync if needed)

## 📦 Setup

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   *Required variables include Database credentials, Milvus host, and Langfuse keys.*

## 🏃 Running the Application

### Development Mode (with hot-reload)
```bash
fastapi dev app/main.py
```

### Production Mode
```bash
fastapi run app/main.py
```

## 📚 API Documentation

Once the server is running, you can access:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## 🔐 Authentication

The application uses **HttpOnly Cookies** for authentication. 
- **Cookie Name:** `access_token`
- **Security:** `httponly=True`, `secure=True`, `samesite="none"` (allows usage in cross-domain widgets).
- **CORS:** Ensure your frontend domain is listed in `BACKEND_CORS_ORIGINS` in `.env`.

## 📂 Project Structure

```text
backend/
├── app/
│   ├── core/           # Configuration, Security, DB initialization
│   ├── features/       # Feature-based modules
│   │   ├── auth/       # Authentication (Login, Register, Cookies)
│   │   └── organizations/ # Organization & Client management
│   └── main.py         # App entry point & Middleware config
├── .env.example        # Template for env variables
└── requirements.txt     # Python dependencies
```

## 🐳 External Services

- **Milvus:** Used for RAG and vector search operations.
- **Langfuse:** Used for observability and prompt management.
- **KAZLLM:** Integration for local LLM models.
