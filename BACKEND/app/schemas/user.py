# backend/app/schemas/user.py

from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None
    favorite_club: str | None = None
    favorite_league: str | None = None


class UserUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    favorite_club: str | None = None
    favorite_league: str | None = None
    profile_picture: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str | None = None
    favorite_club: str | None = None
    favorite_league: str | None = None
    profile_picture: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True