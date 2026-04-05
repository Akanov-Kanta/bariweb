import os
import uuid
from datetime import datetime
from sqlmodel import Session, create_engine, select
from dotenv import load_dotenv

from app.features.auth.schemas import User
from app.core.security import get_password_hash

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(DATABASE_URL)

def add_test_user():
    email = "user@test.com"
    password = "123"
    
    with Session(engine) as session:
        # Check if exists
        stmt = select(User).where(User.email == email)
        user = session.exec(stmt).first()
        
        if user:
            print(f"User {email} already exists. Updating password...")
            user.hashed_password = get_password_hash(password)
            session.add(user)
        else:
            print(f"Creating user {email}...")
            new_user = User(
                email=email,
                hashed_password=get_password_hash(password),
                id=uuid.uuid4(),
                created_at=datetime.utcnow()
            )
            session.add(new_user)
            
        session.commit()
        print("Success!")

if __name__ == "__main__":
    add_test_user()
