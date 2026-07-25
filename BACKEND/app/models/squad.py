# backend/app/models/squad.py

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Squad(Base):
    __tablename__ = "squads"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    squad_name = Column(String(100), unique=True, nullable=False)

    formation = Column(String(20), default="4-3-3")

    budget = Column(Float, default=100000000)

    squad_value = Column(Float, default=0)

    total_points = Column(Integer, default=0)

    captain_id = Column(
        Integer,
        ForeignKey("players.id"),
        nullable=True
    )

    vice_captain_id = Column(
        Integer,
        ForeignKey("players.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship(
        "User",
        back_populates="squads"
    )

    # =====================================================
    # Relationships
    # =====================================================

    user = relationship(
        "User",
        back_populates="squads"
    )

    players = relationship(
        "SquadPlayer",
        back_populates="squad",
        cascade="all, delete-orphan"
    )

    captain = relationship(
        "Player",
        foreign_keys=[captain_id]
    )

    vice_captain = relationship(
        "Player",
        foreign_keys=[vice_captain_id]
    )

    transfers = relationship(
        "TransferHistory",
        back_populates="squad",
        cascade="all, delete-orphan"
    )