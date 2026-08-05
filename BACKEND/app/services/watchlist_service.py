# backend/app/services/watchlist_service.py

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.player import Player
from app.models.watchlist import Watchlist


class WatchlistService:

    # =====================================================
    # Add Player to Watchlist
    # =====================================================

    @staticmethod
    def add_to_watchlist(
        db: Session,
        user_id: int,
        player_id: int,
        notes: str | None = None
    ):

        # ---------------------------------------
        # Check user exists
        # ---------------------------------------

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise ValueError("User not found.")

        # ---------------------------------------
        # Check player exists (accepts fifa_id or internal id)
        # ---------------------------------------

        player = (
            db.query(Player)
            .filter((Player.fifa_id == player_id) | (Player.id == player_id))
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        # ---------------------------------------
        # Prevent duplicate entries
        # ---------------------------------------

        existing = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id,
                Watchlist.player_id == player.id
            )
            .first()
        )

        if existing:
            raise ValueError(
                "Player is already in your watchlist."
            )

        # ---------------------------------------
        # Create watchlist entry (storing players.id)
        # ---------------------------------------

        watchlist_item = Watchlist(
            user_id=user_id,
            player_id=player.id,
            notes=notes
        )

        db.add(watchlist_item)

        db.commit()

        db.refresh(watchlist_item)

        return {
            "message": "Player added to watchlist successfully.",
            "player": player.name,
            "watchlist_id": watchlist_item.id
        }

    # =====================================================
    # Get User Watchlist
    # =====================================================

    @staticmethod
    def get_user_watchlist(
        db: Session,
        user_id: int
    ):

        # ---------------------------------------
        # Check user exists
        # ---------------------------------------

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise ValueError("User not found.")

        # ---------------------------------------
        # Fetch watchlist
        # ---------------------------------------

        watchlist = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id
            )
            .order_by(
                Watchlist.created_at.desc()
            )
            .all()
        )

        results = []

        for item in watchlist:

            player = (
                db.query(Player)
                .filter(
                    (Player.id == item.player_id) | (Player.fifa_id == item.player_id)
                )
                .first()
            )

            if not player:
                continue

            results.append({
                "id": item.id,
                "user_id": item.user_id,

                "player_id": player.fifa_id,
                "player_name": player.name,

                "club": player.club,
                "nationality": player.nationality,

                "overall": player.overall,
                "potential": player.potential,

                "market_value": player.value_eur,

                "notes": item.notes,

                "created_at": item.created_at
            })

        return results

    # =====================================================
    # Update Watchlist Notes
    # =====================================================

    @staticmethod
    def update_notes(
        db: Session,
        user_id: int,
        player_id: int,
        notes: str
    ):

        player = (
            db.query(Player)
            .filter((Player.fifa_id == player_id) | (Player.id == player_id))
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        # ---------------------------------------
        # Find watchlist entry
        # ---------------------------------------

        watchlist_item = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id,
                Watchlist.player_id.in_([player.id, player.fifa_id])
            )
            .first()
        )

        if not watchlist_item:
            raise ValueError(
                "Player is not in your watchlist."
            )

        # ---------------------------------------
        # Update notes
        # ---------------------------------------

        watchlist_item.notes = notes

        db.commit()

        db.refresh(watchlist_item)

        return {
            "message": "Watchlist notes updated successfully."
        }

    # =====================================================
    # Remove Player from Watchlist
    # =====================================================

    @staticmethod
    def remove_from_watchlist(
        db: Session,
        user_id: int,
        player_id: int
    ):

        player = (
            db.query(Player)
            .filter((Player.fifa_id == player_id) | (Player.id == player_id))
            .first()
        )

        target_ids = [player_id]
        if player:
            target_ids = [player.id, player.fifa_id]

        # ---------------------------------------
        # Find watchlist entry
        # ---------------------------------------

        watchlist_item = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id,
                Watchlist.player_id.in_(target_ids)
            )
            .first()
        )

        if not watchlist_item:
            raise ValueError(
                "Player is not in your watchlist."
            )

        db.delete(watchlist_item)

        db.commit()

        return {
            "message": "Player removed from watchlist successfully."
        }

    # =====================================================
    # Clear Watchlist
    # =====================================================

    @staticmethod
    def clear_watchlist(
        db: Session,
        user_id: int
    ):

        # ---------------------------------------
        # Check user exists
        # ---------------------------------------

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            raise ValueError("User not found.")

        # ---------------------------------------
        # Delete all watchlist entries
        # ---------------------------------------

        deleted = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id
            )
            .delete(synchronize_session=False)
        )

        db.commit()

        return {
            "message": f"{deleted} player(s) removed from watchlist."
        }

    # =====================================================
    # Check if Player is Watchlisted
    # =====================================================

    @staticmethod
    def is_watchlisted(
        db: Session,
        user_id: int,
        player_id: int
    ):

        player = (
            db.query(Player)
            .filter((Player.fifa_id == player_id) | (Player.id == player_id))
            .first()
        )

        target_ids = [player_id]
        if player:
            target_ids = [player.id, player.fifa_id]

        watchlist_item = (
            db.query(Watchlist)
            .filter(
                Watchlist.user_id == user_id,
                Watchlist.player_id.in_(target_ids)
            )
            .first()
        )

        return {
            "user_id": user_id,
            "player_id": player_id,
            "watchlisted": watchlist_item is not None
        }

    