import time
from typing import Set
from sqlmodel import Session, select
from app.core.database import engine
from app.features.organizations.models import Client

# Simple in-memory cache for allowed origins
class CORSCache:
    def __init__(self, ttl_seconds: int = 600):
        self.ttl = ttl_seconds
        self.last_updated = 0
        self.allowed_origins: Set[str] = set()

    def is_expired(self) -> bool:
        return (time.time() - self.last_updated) > self.ttl

    def update(self, origins: Set[str]):
        self.allowed_origins = origins
        self.last_updated = time.time()

_cors_cache = CORSCache()

def get_allowed_origins() -> Set[str]:
    """
    Fetch all allowed domains from the database across all active clients.
    Cached for efficiency.
    """
    if not _cors_cache.is_expired():
        return _cors_cache.allowed_origins

    with Session(engine) as session:
        # Fetch all active clients
        stmt = select(Client).where(Client.is_active == True)
        clients = session.exec(stmt).all()
        
        all_origins = set()
        for client in clients:
            if client.allowed_domains:
                domains = [d.strip() for d in client.allowed_domains.split(",") if d.strip()]
                for domain in domains:
                    if not domain.startswith(("http://", "https://")):
                        all_origins.add(f"http://{domain}")
                        all_origins.add(f"https://{domain}")
                    else:
                        all_origins.add(domain)
        
        _cors_cache.update(all_origins)
        return all_origins
