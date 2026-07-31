import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# --------------------------------------------------
# Database Configuration
# --------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///football_manager.db")

# Fix Heroku / Render / Supabase legacy "postgres://" prefix for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


# --------------------------------------------------
# Database Engine
# --------------------------------------------------

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)


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