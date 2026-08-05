from fastapi import FastAPI

from app.database.database import Base, engine
from app.models import *

from app.routers import (auth_router, player_router, squad_router, transfer_router, watchlist_router)
from app.routers.ai_router import router as ai_router
from app.routers.news import router as news_router

from fastapi.middleware.cors import CORSMiddleware


from sqlalchemy import text

try:
    Base.metadata.create_all(bind=engine)
    # Create case-insensitive database indexes on startup to optimize analytics page queries for SQLite
    if engine.name == "sqlite":
        with engine.begin() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fifa_players_name_nocase ON fifa_players(name COLLATE NOCASE);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fifa_players_fullname_nocase ON fifa_players(full_name COLLATE NOCASE);"))
except Exception as e:
    print(f"[Database Warning] Could not connect or initialize database schema: {e}")

app = FastAPI(
    title="Football Manager API",
    version="1.0.0"
)

import os

frontend_url = os.environ.get("FRONTEND_URL")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://apexfc.vercel.app",
]

if frontend_url:
    for url in frontend_url.split(","):
        cleaned_url = url.strip()
        if cleaned_url:
            origins.append(cleaned_url)
            origins.append(cleaned_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+|https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
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


import threading

@app.on_event("startup")
def startup_warmup():
    """Pre-load AI models asynchronously in a background thread to prevent port binding timeouts on Render."""
    def warmup_task():
        try:
            from app.services.ai_service import ai_service
            ai_service.warmup()
        except Exception as e:
            print(f"[AI Warmup Warning] Background model warmup failed: {e}")

    threading.Thread(target=warmup_task, daemon=True).start()