from pydantic import BaseModel
from app.schemas.user import UserResponse


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse