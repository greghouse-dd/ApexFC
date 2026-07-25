# backend/app/schemas/squad.py

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================================
# Squad Player Schemas
# ==========================================================

class SquadPlayerBase(BaseModel):
    player_id: int = Field(..., description="FIFA Player ID")
    purchase_price: float
    current_value: float
    position: str


class SquadPlayerCreate(SquadPlayerBase):
    pass


class SquadPlayerResponse(SquadPlayerBase):
    id: int
    squad_id: int
    points: int
    joined_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# Squad Schemas
# ==========================================================

class SquadBase(BaseModel):
    squad_name: str = Field(..., min_length=3, max_length=100)
    formation: str = "4-3-3"


class SquadCreate(SquadBase):
    pass


class SquadUpdate(BaseModel):
    squad_name: Optional[str] = None
    formation: Optional[str] = None
    budget: Optional[float] = None


class FormationUpdate(BaseModel):
    formation: str


class CaptainUpdate(BaseModel):
    player_id: int


class ViceCaptainUpdate(BaseModel):
    player_id: int


# ==========================================================
# Squad Response
# ==========================================================

class SquadResponse(BaseModel):
    id: int
    user_id: int

    squad_name: str
    formation: str

    budget: float
    squad_value: float
    total_points: int

    captain_id: Optional[int]
    vice_captain_id: Optional[int]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SquadDetailResponse(SquadResponse):
    players: List[SquadPlayerResponse] = []


# ==========================================================
# Squad Summary
# ==========================================================

class SquadSummary(BaseModel):
    total_players: int
    squad_value: float
    remaining_budget: float
    average_age: float
    average_rating: float
    total_points: int


# ==========================================================
# Generic API Responses
# ==========================================================

class SquadMessage(BaseModel):
    message: str


class AddPlayerRequest(BaseModel):
    player_id: int
    position: str


class RemovePlayerRequest(BaseModel):
    player_id: int