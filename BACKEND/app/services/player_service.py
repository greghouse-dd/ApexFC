import os
import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_

from app.models.player import Player

def get_db_attributes(db: Session, name: str, full_name: str, overall: int, shooting: int, passing: int, pace: int, dribbling: int, defending: int, physical: int, p_id: int):
    # Default fallback generation helper
    def generate_fallback():
        # Deterministic variation helper
        def v(base, offset):
            val = int(base + ((p_id * offset) % 11) - 5)
            return max(10, min(99, val))

        return {
            "crossing": v(passing, 3),
            "finishing": v(shooting, 7),
            "heading_accuracy": v(defending * 0.4 + physical * 0.6, 9),
            "short_passing": v(passing + 2, 5),
            "volleys": v(shooting - 2, 8),
            "dribbling": v(dribbling, 6),
            "curve": v(passing - 2, 7),
            "freekick_accuracy": v(passing, 9),
            "long_passing": v(passing - 1, 4),
            "ball_control": v(dribbling + 2, 3),
            "acceleration": v(pace + 2, 5),
            "sprint_speed": v(pace - 2, 8),
            "agility": v(pace * 0.6 + dribbling * 0.4, 7),
            "reactions": v(overall, 4),
            "balance": v(dribbling * 0.5 + physical * 0.5, 6),
            "shot_power": v(shooting + 3, 5),
            "jumping": v(physical, 8),
            "stamina": v(physical + 2, 6),
            "strength": v(physical - 2, 7),
            "long_shots": v(shooting - 1, 9),
            "aggression": v(physical + 2, 4),
            "interceptions": v(defending + 2, 5),
            "positioning": v(overall - 1, 6),
            "vision": v(passing + 3, 8),
            "penalties": v(shooting, 5),
            "composure": v(overall + 1, 7),
            "marking": v(defending - 2, 6),
            "standing_tackle": v(defending + 1, 4),
            "sliding_tackle": v(defending - 1, 3)
        }

    # Query the 'fifa_players' table in the database using case-insensitive index COLLATE NOCASE
    result = None
    try:
        if name:
            query = text("SELECT * FROM fifa_players WHERE name = :name COLLATE NOCASE")
            result = db.execute(query, {"name": name}).first()
            
        if (result is None) and full_name:
            query = text("SELECT * FROM fifa_players WHERE full_name = :full_name COLLATE NOCASE")
            result = db.execute(query, {"full_name": full_name}).first()
 
        if (result is None) and name:
            query = text("SELECT * FROM fifa_players WHERE name LIKE :name_like OR full_name LIKE :name_like")
            result = db.execute(query, {"name_like": f"%{name}%"}).first()
    except Exception as e:
        print(f"Error querying fifa_players table: {e}")

    if result:
        row_dict = dict(result._mapping)
        attrs = [
            'crossing', 'finishing', 'heading_accuracy', 'short_passing', 'volleys',
            'dribbling', 'curve', 'freekick_accuracy', 'long_passing', 'ball_control',
            'acceleration', 'sprint_speed', 'agility', 'reactions', 'balance',
            'shot_power', 'jumping', 'stamina', 'strength', 'long_shots',
            'aggression', 'interceptions', 'positioning', 'vision', 'penalties',
            'composure', 'marking', 'standing_tackle', 'sliding_tackle'
        ]
        res = {}
        for attr in attrs:
            val = row_dict.get(attr)
            if val is None:
                res[attr] = 50
            else:
                res[attr] = int(val)
        return res
    else:
        return generate_fallback()


class PlayerService:

    @staticmethod
    def get_players(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        club: str | None = None,
        league: str | None = None,
        nationality: str | None = None,
        position: str | None = None,
        min_overall: int | None = None,
        min_age: int | None = None,
        max_age: int | None = None,
        min_potential: int | None = None,
        min_height: int | None = None,
        min_weight: int | None = None,
        max_market_value: float | None = None,
        min_xg: float | None = None,
        min_goals: int | None = None,
        min_pass_accuracy: int | None = None,
        min_progressive_passes: float | None = None,
        foot: str | None = None,
        sort_by: str = "overall",
        descending: bool = True
    ):
        """
        Generic player query with filtering,
        sorting and pagination.
        """

        query = db.query(Player)

        # ------------------------
        # Search
        # ------------------------

        if search:
            query = query.filter(
                or_(
                    Player.name.ilike(f"%{search}%"),
                    Player.club.ilike(f"%{search}%"),
                    Player.nationality.ilike(f"%{search}%")
                )
            )

        # ------------------------
        # Filters
        # ------------------------

        if club:
            query = query.filter(Player.club == club)

        if league:
            query = query.filter(Player.league == league)

        if nationality:
            query = query.filter(
                Player.nationality == nationality
            )

        if position:
            query = query.filter(
                Player.position.ilike(f"%{position}%")
            )

        if min_overall:
            query = query.filter(
                Player.overall >= min_overall
            )

        if min_age:
            query = query.filter(
                Player.age >= min_age
            )

        if max_age:
            query = query.filter(
                Player.age <= max_age
            )

        if min_potential:
            query = query.filter(
                Player.potential >= min_potential
            )

        if min_height:
            query = query.filter(
                Player.height_cm >= min_height
            )

        if min_weight:
            query = query.filter(
                Player.weight_kg >= min_weight
            )

        if max_market_value is not None:
            query = query.filter(
                Player.value_eur <= max_market_value
            )

        if min_xg is not None:
            query = query.filter(
                Player.xg >= min_xg
            )

        if min_goals is not None:
            query = query.filter(
                Player.goals >= min_goals
            )

        if min_pass_accuracy:
            query = query.filter(
                Player.passing >= min_pass_accuracy
            )

        if min_progressive_passes is not None:
            query = query.filter(
                Player.progressive_passes >= min_progressive_passes
            )

        if foot:
            query = query.filter(
                Player.preferred_foot == foot
            )

        # ------------------------
        # Sorting
        # ------------------------

        valid_columns = {
            "overall": Player.overall,
            "potential": Player.potential,
            "age": Player.age,
            "value": Player.value_eur,
            "wage": Player.wage_eur,
            "name": Player.name
        }

        column = valid_columns.get(
            sort_by,
            Player.overall
        )

        if descending:
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

        # ------------------------
        # Total Count
        # ------------------------

        total = query.count()

        # ------------------------
        # Pagination
        # ------------------------

        players = (
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return {
            "players": players,
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size
        }

    @staticmethod
    def get_player_by_id(
        db: Session,
        player_id: int
    ):
        player = (
            db.query(Player)
            .filter(Player.fifa_id == player_id)
            .first()
        )

        if player is None:
            raise HTTPException(
                status_code=404,
                detail="Player not found."
            )

        player_dict = {
            col.name: getattr(player, col.name)
            for col in player.__table__.columns
        }

        # Fetch authentic attributes from database or fallback
        db_attrs = get_db_attributes(
            db=db,
            name=player.name,
            full_name=player.full_name,
            overall=player.overall or 75,
            shooting=player.shooting or 70,
            passing=player.passing or 70,
            pace=player.pace or 70,
            dribbling=player.dribbling or 70,
            defending=player.defending or 70,
            physical=player.physical or 70,
            p_id=player.id or 1
        )

        player_dict.update(db_attrs)
        return player_dict

    @staticmethod
    def get_top_players(
        db: Session,
        limit: int = 20
    ):
        return (
            db.query(Player)
            .order_by(Player.overall.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_statistics(db: Session):

        return {
            "total_players":
                db.query(Player).count(),

            "total_clubs":
                db.query(
                    func.count(
                        func.distinct(Player.club)
                    )
                ).scalar(),

            "total_leagues":
                db.query(
                    func.count(
                        func.distinct(Player.league)
                    )
                ).scalar(),

            "total_nationalities":
                db.query(
                    func.count(
                        func.distinct(Player.nationality)
                    )
                ).scalar(),

            "average_rating":
                db.query(
                    func.avg(Player.overall)
                ).scalar()
        }

    @staticmethod
    def get_all_clubs(db: Session):

        return [
            club[0]
            for club in
            db.query(Player.club)
            .distinct()
            .order_by(Player.club)
            .all()
        ]

    @staticmethod
    def get_all_leagues(db: Session):

        return [
            league[0]
            for league in
            db.query(Player.league)
            .distinct()
            .order_by(Player.league)
            .all()
        ]

    @staticmethod
    def get_all_nationalities(db: Session):

        return [
            nation[0]
            for nation in
            db.query(Player.nationality)
            .distinct()
            .order_by(Player.nationality)
            .all()
        ]