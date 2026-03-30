from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.core.config import settings
from app.core.database import Session, engine, init_db
from app.core.milvus import milvus_manager
from app.core.langfuse import langfuse_manager
from app.features.auth.router import auth_router
from app.features.organizations.router import org_router

from app.features.auth.schemas import User
from app.features.organizations.models import Client

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
    
    milvus_manager.initialize()
    
    langfuse_manager.initialize()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(org_router, prefix="/clients")