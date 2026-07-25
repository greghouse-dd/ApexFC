# backend/app/models/watchlist.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    # =====================================================
    # Primary Key
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # Foreign Keys
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
        nullable=False
    )

    # =====================================================
    # User Notes
    # =====================================================

    notes = Column(
        String,
        nullable=True
    )

    # =====================================================
    # Timestamp
    # =====================================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # =====================================================
    # Relationships
    # =====================================================

    user = relationship(
        "User",
        back_populates="watchlist"
    )

    player = relationship(
        "Player",
        back_populates="watchlisted_by"
    )