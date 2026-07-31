import os
import sqlite3
import pandas as pd
from sqlalchemy import create_engine

# Script to copy tables from local SQLite database to Supabase (PostgreSQL)

LOCAL_SQLITE_PATH = os.path.join(os.path.dirname(__file__), "football_manager.db")

def migrate():
    target_url = os.environ.get("DATABASE_URL")
    if not target_url:
        print("ERROR: Please set the TARGET DATABASE_URL environment variable.")
        print("Example: $env:DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres\"")
        return

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif target_url.startswith("postgresql://"):
        target_url = target_url.replace("postgresql://", "postgresql+pg8000://", 1)

    if not os.path.exists(LOCAL_SQLITE_PATH):
        print(f"ERROR: Local SQLite database not found at {LOCAL_SQLITE_PATH}")
        return

    print(f"Connecting to target database...")
    target_engine = create_engine(target_url)
    
    print(f"Connecting to local SQLite database...")
    sqlite_conn = sqlite3.connect(LOCAL_SQLITE_PATH)

    # Get list of all tables in SQLite
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"Found tables to migrate: {tables}")

    for table in tables:
        print(f"Migrating table '{table}'...")
        df = pd.read_sql_query(f"SELECT * FROM {table}", sqlite_conn)
        print(f"  - Loaded {len(df)} rows.")
        df.to_sql(table, con=target_engine, if_exists="replace", index=False)
        print(f"  - Successfully written '{table}' to target database!")

    print("\n✅ Migration complete! All data successfully migrated to Supabase.")

if __name__ == "__main__":
    migrate()
