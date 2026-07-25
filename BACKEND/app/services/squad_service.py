# backend/app/services/squad_service.py

from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User
from app.models.player import Player
from app.models.squad import Squad
from app.models.squad_player import SquadPlayer
from app.models.watchlist import Watchlist


class SquadService:

    VALID_FORMATIONS = [
        "4-3-3",
        "4-4-2",
        "3-5-2",
        "3-4-3",
        "4-2-3-1",
        "5-3-2",
        "5-4-1"
    ]

    DEFAULT_BUDGET = 750_000_000

    # =====================================================
    # Create Squad
    # =====================================================

    @staticmethod
    def create_squad(
        db: Session,
        user_id: int,
        squad_name: str,
        formation: str = "4-3-3"
    ):

        # Check user exists
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise ValueError("User not found.")

        # Check squad/club name already exists across all users
        existing = (
            db.query(Squad)
            .filter(Squad.squad_name == squad_name)
            .first()
        )

        if existing:
            raise ValueError(
                "This club name is already taken by another user."
            )

        # Validate formation
        if formation not in SquadService.VALID_FORMATIONS:
            raise ValueError(
                "Invalid formation selected."
            )

        squad = Squad(
            user_id=user_id,
            squad_name=squad_name,
            formation=formation,
            budget=SquadService.DEFAULT_BUDGET,
            squad_value=0,
            total_points=0
        )

        db.add(squad)
        db.commit()
        db.refresh(squad)

        return squad

    # =====================================================
    # Get All Squads of User
    # =====================================================

    @staticmethod
    def get_user_squads(
        db: Session,
        user_id: int
    ):

        return (
            db.query(Squad)
            .filter(
                Squad.user_id == user_id
            )
            .order_by(
                Squad.created_at.desc()
            )
            .all()
        )

    # =====================================================
    # Get Single Squad
    # =====================================================

    @staticmethod
    def get_squad(
        db: Session,
        squad_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(
                Squad.id == squad_id
            )
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        return squad

    # =====================================================
    # Delete Squad
    # =====================================================

    @staticmethod
    def delete_squad(
        db: Session,
        squad_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(
                Squad.id == squad_id
            )
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        db.delete(squad)
        db.commit()

        return {
            "message": "Squad deleted successfully."
        }

    # =====================================================
    # Add Player to Squad
    # =====================================================

    @staticmethod
    def add_player(
        db: Session,
        squad_id: int,
        player_id: int,
        position: str
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        player = (
            db.query(Player)
            .filter(Player.fifa_id == player_id)
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        # Prevent duplicate players
        existing = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id,
                SquadPlayer.player_id == player_id
            )
            .first()
        )

        if existing:
            raise ValueError(
                "Player already exists in squad."
            )

        # Maximum 11 players
        player_count = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .count()
        )

        if player_count >= 33:
            raise ValueError(
                "Squad already has 33 players."
            );

        # Budget validation
        if player.value_eur > squad.budget:
            raise ValueError(
                "Insufficient budget."
            )

        squad_player = SquadPlayer(
            squad_id=squad_id,
            player_id=player_id,
            purchase_price=player.value_eur,
            current_value=player.value_eur,
            position=position,
            points=0
        )

        db.add(squad_player)

        squad.budget -= player.value_eur

        # Remove player from user's watchlist if present
        watchlist_item = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == squad.user_id,
                Watchlist.player_id == player.fifa_id
            )
            .first()
        )
        if watchlist_item:
            db.delete(watchlist_item)

        db.commit()

        return squad_player

    # =====================================================
    # Remove Player
    # =====================================================

    @staticmethod
    def remove_player(
        db: Session,
        squad_id: int,
        player_id: int
    ):

        squad_player = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id,
                SquadPlayer.player_id == player_id
            )
            .first()
        )

        if not squad_player:
            raise ValueError(
                "Player not found in squad."
            )

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        # Refund current value
        squad.budget += squad_player.current_value

        # Remove captain
        if squad.captain_id == player_id:
            squad.captain_id = None

        # Remove vice captain
        if squad.vice_captain_id == player_id:
            squad.vice_captain_id = None

        db.delete(squad_player)
        db.commit()

        return {
            "message": "Player removed successfully."
        }

    # =====================================================
    # Remove All Players
    # =====================================================

    @staticmethod
    def remove_all_players(
        db: Session,
        squad_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        squad_players = (
            db.query(SquadPlayer)
            .filter(SquadPlayer.squad_id == squad_id)
            .all()
        )

        # Refund all players
        for sp in squad_players:
            squad.budget += sp.current_value

        # Clear captain/vice captain
        squad.captain_id = None
        squad.vice_captain_id = None

        # Delete all rows
        for sp in squad_players:
            db.delete(sp)

        db.commit()

        return {
            "message": "All players removed successfully."
        }

    # =====================================================
    # Set Captain
    # =====================================================

    @staticmethod
    def set_captain(
        db: Session,
        squad_id: int,
        player_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        exists = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id,
                SquadPlayer.player_id == player_id
            )
            .first()
        )

        if not exists:
            raise ValueError(
                "Captain must belong to squad."
            )

        squad.captain_id = player_id

        db.commit()

        return squad

    # =====================================================
    # Set Vice Captain
    # =====================================================

    @staticmethod
    def set_vice_captain(
        db: Session,
        squad_id: int,
        player_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        exists = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id,
                SquadPlayer.player_id == player_id
            )
            .first()
        )

        if not exists:
            raise ValueError(
                "Vice captain must belong to squad."
            )

        squad.vice_captain_id = player_id

        db.commit()

        return squad

    # =====================================================
    # Change Formation
    # =====================================================

    @staticmethod
    def change_formation(
        db: Session,
        squad_id: int,
        formation: str
    ):

        if formation not in SquadService.VALID_FORMATIONS:
            raise ValueError(
                "Invalid formation."
            )

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        squad.formation = formation

        db.commit()

        return squad

    # =====================================================
    # Update Squad Settings
    # =====================================================

    @staticmethod
    def update_squad(
        db: Session,
        squad_id: int,
        squad_name: Optional[str] = None,
        formation: Optional[str] = None,
        budget: Optional[float] = None
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        if squad_name is not None:
            existing = (
                db.query(Squad)
                .filter(
                    Squad.squad_name == squad_name,
                    Squad.id != squad_id
                )
                .first()
            )
            if existing:
                raise ValueError(
                    "This club name is already taken by another user."
                )
            squad.squad_name = squad_name

        if formation is not None:
            if formation not in SquadService.VALID_FORMATIONS:
                raise ValueError(
                    "Invalid formation selected."
                )
            squad.formation = formation

        if budget is not None:
            if budget < 0:
                raise ValueError(
                    "Budget cannot be negative."
                )
            squad.budget = budget

        db.commit()
        db.refresh(squad)

        return squad
    
    # =====================================================
    # Calculate Squad Value
    # =====================================================

    @staticmethod
    def calculate_squad_value(
        db: Session,
        squad_id: int
    ):

        squad_players = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .all()
        )

        total_value = sum(
            player.current_value
            for player in squad_players
        )

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        squad.squad_value = total_value
        db.commit()

        return total_value

    # =====================================================
    # Calculate Remaining Budget
    # =====================================================

    @staticmethod
    def calculate_remaining_budget(
        db: Session,
        squad_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        return squad.budget

    # =====================================================
    # Calculate Total Points
    # =====================================================

    @staticmethod
    def calculate_total_points(
        db: Session,
        squad_id: int
    ):

        squad_players = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .all()
        )

        total_points = sum(
            player.points
            for player in squad_players
        )

        squad = (
            db.query(Squad)
            .filter(
                Squad.id == squad_id
            )
            .first()
        )

        squad.total_points = total_points

        db.commit()

        return total_points

    # =====================================================
    # Calculate Average Rating
    # =====================================================

    @staticmethod
    def calculate_average_rating(
        db: Session,
        squad_id: int
    ):

        squad_players = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .all()
        )

        if len(squad_players) == 0:
            return 0

        ratings = []

        for squad_player in squad_players:

            player = (
                db.query(Player)
                .filter(
                    Player.fifa_id == squad_player.player_id
                )
                .first()
            )

            if player:
                ratings.append(player.overall)

        if not ratings:
            return 0

        return round(
            sum(ratings) / len(ratings),
            2
        )

    # =====================================================
    # Calculate Average Age
    # =====================================================

    @staticmethod
    def calculate_average_age(
        db: Session,
        squad_id: int
    ):

        squad_players = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .all()
        )

        if len(squad_players) == 0:
            return 0

        ages = []

        for squad_player in squad_players:

            player = (
                db.query(Player)
                .filter(
                    Player.fifa_id == squad_player.player_id
                )
                .first()
            )

            if player:
                ages.append(player.age)

        if not ages:
            return 0

        return round(
            sum(ages) / len(ages),
            2
        )

    # =====================================================
    # Squad Summary
    # =====================================================

    @staticmethod
    def get_squad_summary(
        db: Session,
        squad_id: int
    ):

        squad = (
            db.query(Squad)
            .filter(
                Squad.id == squad_id
            )
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        total_players = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .count()
        )

        squad_value = SquadService.calculate_squad_value(
            db,
            squad_id
        )

        total_points = SquadService.calculate_total_points(
            db,
            squad_id
        )

        average_rating = SquadService.calculate_average_rating(
            db,
            squad_id
        )

        average_age = SquadService.calculate_average_age(
            db,
            squad_id
        )

        return {
            "squad_id": squad.id,
            "squad_name": squad.squad_name,
            "formation": squad.formation,
            "total_players": total_players,
            "budget": squad.budget,
            "squad_value": squad_value,
            "remaining_budget": squad.budget,
            "average_rating": average_rating,
            "average_age": average_age,
            "total_points": total_points,
            "captain_id": squad.captain_id,
            "vice_captain_id": squad.vice_captain_id
        }