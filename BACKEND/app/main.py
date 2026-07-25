from fastapi import FastAPI

from app.database.database import Base, engine
from app.models import *

from app.routers import (auth_router, player_router, squad_router, transfer_router, watchlist_router)
from app.routers.ai_router import router as ai_router
from app.routers.news import router as news_router

from fastapi.middleware.cors import CORSMiddleware


from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Create case-insensitive database indexes on startup to optimize analytics page queries
with engine.begin() as conn:
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fifa_players_name_nocase ON fifa_players(name COLLATE NOCASE);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fifa_players_fullname_nocase ON fifa_players(full_name COLLATE NOCASE);"))

app = FastAPI(
    title="Football Manager API",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Football Manager API Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(auth_router)
app.include_router(player_router)
app.include_router(squad_router)
app.include_router(transfer_router)
app.include_router(watchlist_router)
app.include_router(ai_router)
app.include_router(news_router)