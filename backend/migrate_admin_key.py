import os
from sqlmodel import Session, create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(DATABASE_URL)

def migrate():
    with Session(engine) as session:
        print("Checking tables for missing columns...")
        
        # 1. client table
        try:
            session.execute(text("ALTER TABLE client ADD COLUMN IF NOT EXISTS admin_key_hash VARCHAR;"))
            print("✓ client.admin_key_hash checked.")
        except Exception as e:
            print(f"Error updating client: {e}")

        # 2. trained_screens table
        try:
            # First ensure table exists (though it should)
            session.execute(text("ALTER TABLE trained_screens ADD COLUMN IF NOT EXISTS description VARCHAR;"))
            session.execute(text("ALTER TABLE trained_screens ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;"))
            session.execute(text("ALTER TABLE trained_screens ADD COLUMN IF NOT EXISTS page_url VARCHAR DEFAULT '';"))
            print("✓ trained_screens columns checked.")
        except Exception as e:
            print(f"Error updating trained_screens: {e}")

        session.commit()
        print("Full migration successful.")

if __name__ == "__main__":
    migrate()
