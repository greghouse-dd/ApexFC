from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

import hashlib
import os
import bcrypt

# --------------------------------------------------
# Configuration
# --------------------------------------------------

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "8d3b7c5a9f2e1d4c6b8a0f7e9c1d3a5b7e9f1a2c4d6b8e0f3a5c7d9e1f2b4a6"))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours default for deployed session longevity

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

# --------------------------------------------------
# Password Hashing (using bcrypt directly, no passlib)
# --------------------------------------------------


def _pre_hash_password(password: str) -> str:
    """Pre-hash password with SHA-256 to support passwords of any length (always produces 64 chars, under bcrypt's 72-byte limit)."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    pre_hashed = _pre_hash_password(password).encode("utf-8")
    return bcrypt.hashpw(pre_hashed, bcrypt.gensalt()).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    pre_hashed = _pre_hash_password(plain_password).encode("utf-8")
    return bcrypt.checkpw(pre_hashed, hashed_password.encode("utf-8"))


# --------------------------------------------------
# JWT
# --------------------------------------------------

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):
    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc) +
        (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        return None


def get_current_token(
    token: str = Depends(oauth2_scheme)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )

    return payload


def get_current_user_email(
    token: str = Depends(oauth2_scheme)
):
    payload = get_current_token(token)

    email = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )

    return email