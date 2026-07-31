# backend/app/models/player.py

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
)

from sqlalchemy.orm import relationship

from app.database.database import Base


class Player(Base):
    __tablename__ = "players"

    # ----------------------------
    # Identity
    # ----------------------------
    id = Column(Integer, primary_key=True, index=True)
    fifa_id = Column(Integer, unique=True, nullable=False)

    name = Column(String, nullable=False, index=True)
    full_name = Column(String)

    age = Column(Integer)

    nationality = Column(String, index=True)

    club = Column(String, index=True)

    league = Column(String, index=True)

    # ----------------------------
    # Position
    # ----------------------------

    position = Column(String, index=True)

    position_group = Column(String)

    preferred_foot = Column(String)

    jersey_number = Column(Integer)

    height_cm = Column(Integer)

    weight_kg = Column(Integer)

    # ----------------------------
    # Overall
    # ----------------------------

    overall = Column(Integer)

    potential = Column(Integer)

    value_eur = Column(Float)

    wage_eur = Column(Float)

    release_clause = Column(Float)

    # ----------------------------
    # Face Stats
    # ----------------------------

    pace = Column(Integer)

    shooting = Column(Integer)

    passing = Column(Integer)

    dribbling = Column(Integer)

    defending = Column(Integer)

    physical = Column(Integer)

    # ----------------------------
    # Goalkeeper
    # ----------------------------

    gk_diving = Column(Integer)

    gk_handling = Column(Integer)

    gk_kicking = Column(Integer)

    gk_reflexes = Column(Integer)

    gk_positioning = Column(Integer)

    # ----------------------------
    # Season Statistics
    # ----------------------------

    appearances = Column(Integer)

    minutes = Column(Integer)

    goals = Column(Integer)

    assists = Column(Integer)

    xg = Column(Float)

    xa = Column(Float)

    tackles = Column(Float)

    interceptions = Column(Float)

    progressive_passes = Column(Float)

    progressive_carries = Column(Float)

    clean_sheets = Column(Integer)

    # ----------------------------
    # Images
    # ----------------------------

    face_url = Column(String)

    club_logo = Column(String)

    nation_flag = Column(String)

    # ----------------------------
    # Status
    # ----------------------------

    is_active = Column(Boolean, default=True)
    # =====================================================
    # Relationships
    # =====================================================

    squad_players = relationship(
        "SquadPlayer",
        back_populates="player",
        cascade="all, delete-orphan"
    )

    captain_of = relationship(
        "Squad",
        foreign_keys="Squad.captain_id",
        back_populates="captain"
    )

    vice_captain_of = relationship(
        "Squad",
        foreign_keys="Squad.vice_captain_id",
        back_populates="vice_captain"
    )

    transfer_history = relationship(
        "TransferHistory",
        back_populates="player",
        cascade="all, delete-orphan",
        foreign_keys="TransferHistory.player_id",
        primaryjoin="Player.fifa_id == TransferHistory.player_id"
    )

    watchlisted_by = relationship(
        "Watchlist",
        back_populates="player",
        cascade="all, delete-orphan"
    )