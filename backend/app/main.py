from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import Session, engine, init_db
from app.core.milvus import milvus_manager
from app.core.langfuse import langfuse_manager
from app.features.auth.router import auth_router
from app.features.organizations.router import org_router
from app.features.widget.router import chat_router
from app.features.training.router import training_router
from app.features.training.models import TrainedScreen  # noqa: F401 — ensures SQLModel creates table
from app.features.agent.router import agent_router
from app.features.agent.models import PlanCache, ActionIdempotency  # noqa: F401

from app.features.auth.schemas import User
from app.features.organizations.models import Client
from app.core.middleware.dynamic_cors import DynamicCORSMiddleware

def custom_generate_unique_id(route: APIRoute):
    return f"{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"/openapi.json",
    generate_unique_id_function=custom_generate_unique_id
)

@app.on_event("startup")
def on_startup():
    with Session(engine) as session:
        init_db(session)
    
    # Don't block the whole API when Milvus is unreachable; the client retries lazily on first use
    try:
        milvus_manager.initialize()
    except Exception:
        pass
    langfuse_manager.initialize()


app.add_middleware(
    DynamicCORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(org_router, prefix="/clients")
app.include_router(chat_router, prefix="")
app.include_router(training_router, prefix="/v1/training")
app.include_router(agent_router, prefix="")
# Serve Frontend Static Files (Docker build only; on Vercel the frontend is a separate service)
static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
if os.path.isdir(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
