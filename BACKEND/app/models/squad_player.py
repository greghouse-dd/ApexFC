# backend/app/models/squad_player.py

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class SquadPlayer(Base):
    __tablename__ = "squad_players"

    id = Column(Integer, primary_key=True, index=True)

    squad_id = Column(
        Integer,
        ForeignKey("squads.id"),
        nullable=False
    )

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
        nullable=False
    )

    purchase_price = Column(Float)

    current_value = Column(Float)

    position = Column(String(20))

    points = Column(Integer, default=0)

    joined_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # =====================================================
    # Relationships
    # =====================================================

    squad = relationship(
        "Squad",
        back_populates="players"
    )

    player = relationship(
        "Player",
        back_populates="squad_players",
        foreign_keys=[player_id],
        primaryjoin="Player.fifa_id == SquadPlayer.player_id"
    )