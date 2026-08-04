import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# --------------------------------------------------
# Database Configuration
# --------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///football_manager.db")

# Standardize PostgreSQL URL prefix for SQLAlchemy and psycopg2 compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def create_db_engine(url: str):
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {"connect_timeout": 5}
    return create_engine(
        url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=1800
    )

# Attempt connection to configured primary database with automatic fallback to SQLite
try:
    engine = create_db_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"[Database] Successfully connected to primary DB: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as e:
    print(f"[Database Warning] Primary DB connection failed: {e}. Falling back to SQLite...")
    DATABASE_URL = "sqlite:///football_manager.db"
    engine = create_db_engine(DATABASE_URL)


# --------------------------------------------------
# Session Factory
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# --------------------------------------------------
# Base Class
# --------------------------------------------------

Base = declarative_base()


# --------------------------------------------------
# Dependency
# --------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()