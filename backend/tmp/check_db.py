import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# Assemble URI
db_uri = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
print(f"Connecting to: {POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}")

engine = create_engine(db_uri)
inspector = inspect(engine)

try:
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    for table_name in tables:
        print(f"\nTable: {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"- {column['name']} ({column['type']})")
except Exception as e:
    print(f"Error during inspection: {e}")
    import traceback
    traceback.print_exc()
