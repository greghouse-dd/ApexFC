# backend/app/models/transfer_history.py

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class TransferHistory(Base):
    __tablename__ = "transfer_history"

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

    transfer_type = Column(String(10))      # BUY / SELL

    transfer_fee = Column(Float)

    transferred_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # =====================================================
    # Relationships
    # =====================================================

    squad = relationship(
        "Squad",
        back_populates="transfers"
    )

    player = relationship(
        "Player",
        back_populates="transfer_history",
        foreign_keys=[player_id],
        primaryjoin="Player.fifa_id == TransferHistory.player_id"
    )