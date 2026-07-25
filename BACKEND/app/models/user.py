# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    # ----------------------------
    # Primary Key
    # ----------------------------
    id = Column(Integer, primary_key=True, index=True)

    # ----------------------------
    # Authentication
    # ----------------------------
    username = Column(String(50), unique=True, nullable=False, index=True)

    email = Column(String(255), unique=True, nullable=False, index=True)

    hashed_password = Column(String, nullable=False)

    # ----------------------------
    # Profile
    # ----------------------------
    full_name = Column(String(100), nullable=True)

    profile_picture = Column(String, nullable=True)

    favorite_club = Column(String(100), nullable=True)

    favorite_league = Column(String(100), nullable=True)

    # ----------------------------
    # Permissions
    # ----------------------------
    is_active = Column(Boolean, default=True)

    is_admin = Column(Boolean, default=False)

    # ----------------------------
    # Timestamps
    # ----------------------------
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    last_login = Column(DateTime(timezone=True), nullable=True)

    # =====================================================
    # Relationships
    # =====================================================

    squads = relationship(
        "Squad",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    watchlist = relationship(
        "Watchlist",
        back_populates="user",
        cascade="all, delete-orphan"
    )