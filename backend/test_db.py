from sqlmodel import Session, select
from app.core.database import engine
from app.features.organizations.models import Client
with Session(engine) as session:
    clients = session.exec(select(Client)).all()
    print("Clients:")
    for c in clients:
        print(f"- {c.name} ({c.allowed_domains})")
