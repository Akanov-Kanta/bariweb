from sqlmodel import Session, select
from app.core.database import engine
from app.features.organizations.models import Client

try:
    with Session(engine) as session:
        clients = session.exec(select(Client)).all()
        print(f"Total clients in db: {len(clients)}")
        for i, c in enumerate(clients):
            print(f"{i}. ID={c.id} Name={c.name} Domains={c.allowed_domains} Owner={c.owner_id} Public={c.public_id}")
except Exception as e:
    print(f"Error: {e}")
