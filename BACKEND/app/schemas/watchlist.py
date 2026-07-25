# backend/app/schemas/watchlist.py

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ==========================================================
# Add Player to Watchlist
# ==========================================================

class WatchlistCreate(BaseModel):
    user_id: int
    player_id: int
    notes: str | None = None


# ==========================================================
# Update Notes
# ==========================================================

class WatchlistUpdate(BaseModel):
    notes: str = Field(
        ...,
        max_length=500,
        description="Personal scouting notes"
    )


# ==========================================================
# Base Schema
# ==========================================================

class WatchlistBase(BaseModel):
    id: int
    user_id: int
    player_id: int
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# Watchlist Response
# ==========================================================

class WatchlistResponse(WatchlistBase):
    pass


# ==========================================================
# Detailed Watchlist Response
# ==========================================================

class WatchlistDetailResponse(BaseModel):
    id: int

    user_id: int

    player_id: int
    player_name: str
    club: str
    nationality: str

    overall: int
    potential: int
    market_value: float

    notes: str | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# Generic Message
# ==========================================================

class WatchlistMessage(BaseModel):
    message: str