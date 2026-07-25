# backend/app/schemas/player.py

from pydantic import BaseModel


class PlayerResponse(BaseModel):
    id: int
    name: str
    age: int
    nationality: str
    club: str
    league: str
    position: str

    overall: int
    potential: int

    value_eur: float

    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int

    face_url: str | None

    class Config:
        from_attributes = True


class PlayerSearch(BaseModel):
    query: str


class PlayerSummary(BaseModel):
    id: int
    name: str
    club: str
    position: str
    overall: int
    value_eur: float

    class Config:
        from_attributes = True