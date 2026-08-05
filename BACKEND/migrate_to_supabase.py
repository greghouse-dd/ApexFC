import os
import sqlite3
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

# Script to copy tables from local SQLite database to Supabase (PostgreSQL)

LOCAL_SQLITE_PATH = "football_manager.db"

def migrate():
    target_url = os.environ.get("DATABASE_URL")
    if not target_url:
        print("ERROR: Please set the TARGET DATABASE_URL environment variable.")
        print("Example: $env:DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres\"")
        return

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif target_url.startswith("postgresql://") and "+psycopg2" not in target_url:
        target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    print(f"Connecting to target database...")
    target_engine = create_engine(target_url)
    
    print(f"Connecting to local SQLite database...")
    sqlite_conn = sqlite3.connect(LOCAL_SQLITE_PATH)

    # Get list of all tables in SQLite
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"Found tables to migrate: {tables}")

    from sqlalchemy import text
    print(f"Dropping existing tables with CASCADE to reset foreign key constraints...")
    with target_engine.begin() as conn:
        for t in ["squad_players", "transfer_history", "watchlists", "squads", "fifa_players", "users", "players"]:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {t} CASCADE;"))
            except Exception as e:
                print(f"Notice: drop table {t}: {e}")

    for table in tables:
        print(f"Migrating table '{table}'...")
        df = pd.read_sql_query(f"SELECT * FROM {table}", sqlite_conn)
        print(f"  - Loaded {len(df)} rows.")
        df.to_sql(table, con=target_engine, if_exists="replace", index=False, chunksize=1000)
        print(f"  - Successfully written '{table}' to target database!")

    print("\n✅ Migration complete! All data successfully migrated to Supabase.")

if __name__ == "__main__":
    migrate()
