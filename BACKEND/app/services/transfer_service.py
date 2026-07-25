# backend/app/services/transfer_service.py

from sqlalchemy.orm import Session

from app.models.player import Player
from app.models.squad import Squad
from app.models.squad_player import SquadPlayer
from app.models.transfer_history import TransferHistory

from app.services.squad_service import SquadService


class TransferService:

    # =====================================================
    # Buy Player
    # =====================================================

    @staticmethod
    def buy_player(
        db: Session,
        squad_id: int,
        player_id: int,
        position: str
    ):

        # ---------------------------------------
        # Check squad exists
        # ---------------------------------------

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        # ---------------------------------------
        # Check player exists
        # ---------------------------------------

        player = (
            db.query(Player)
            .filter(Player.fifa_id == player_id)
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        # ---------------------------------------
        # Prevent duplicate purchases
        # ---------------------------------------

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
                "Player already belongs to this squad."
            )

        # ---------------------------------------
        # Squad size validation
        # ---------------------------------------

        squad_size = (
            db.query(SquadPlayer)
            .filter(
                SquadPlayer.squad_id == squad_id
            )
            .count()
        )

        if squad_size >= 11:
            raise ValueError(
                "Squad already has 11 players."
            )

        # ---------------------------------------
        # Budget validation
        # ---------------------------------------

        if player.value_eur > squad.budget:
            raise ValueError(
                "Insufficient budget."
            )

        # ---------------------------------------
        # Add player to squad
        # ---------------------------------------

        squad_player = SquadPlayer(
            squad_id=squad.id,
            player_id=player.fifa_id,
            purchase_price=player.value_eur,
            current_value=player.value_eur,
            position=position,
            points=0
        )

        db.add(squad_player)

        # ---------------------------------------
        # Update budget
        # ---------------------------------------

        squad.budget -= player.value_eur

        # ---------------------------------------
        # Create transfer history
        # ---------------------------------------

        transfer = TransferHistory(
            squad_id=squad.id,
            player_id=player.fifa_id,
            transfer_type="BUY",
            transfer_fee=player.value_eur
        )

        db.add(transfer)

        # ---------------------------------------
        # Save transaction
        # ---------------------------------------

        db.commit()

        # ---------------------------------------
        # Refresh objects
        # ---------------------------------------

        db.refresh(squad)
        db.refresh(squad_player)
        db.refresh(transfer)

        # ---------------------------------------
        # Update squad statistics
        # ---------------------------------------

        SquadService.calculate_squad_value(
            db,
            squad.id
        )

        SquadService.calculate_total_points(
            db,
            squad.id
        )

        return {
            "message": "Player purchased successfully.",
            "player": player.name,
            "purchase_price": player.value_eur,
            "remaining_budget": squad.budget
        }

    # =====================================================
    # Sell Player
    # =====================================================

    @staticmethod
    def sell_player(
        db: Session,
        squad_id: int,
        player_id: int
    ):

        # ---------------------------------------
        # Check squad exists
        # ---------------------------------------

        squad = (
            db.query(Squad)
            .filter(Squad.id == squad_id)
            .first()
        )

        if not squad:
            raise ValueError("Squad not found.")

        # ---------------------------------------
        # Check player exists in squad
        # ---------------------------------------

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
                "Player is not in this squad."
            )

        # ---------------------------------------
        # Fetch player details
        # ---------------------------------------

        player = (
            db.query(Player)
            .filter(Player.fifa_id == player_id)
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        # ---------------------------------------
        # Refund player's current value
        # ---------------------------------------

        squad.budget += squad_player.current_value

        # ---------------------------------------
        # Remove captain if necessary
        # ---------------------------------------

        if squad.captain_id == player_id:
            squad.captain_id = None

        # ---------------------------------------
        # Remove vice captain if necessary
        # ---------------------------------------

        if squad.vice_captain_id == player_id:
            squad.vice_captain_id = None

        # ---------------------------------------
        # Record transfer history
        # ---------------------------------------

        transfer = TransferHistory(
            squad_id=squad.id,
            player_id=player.fifa_id,
            transfer_type="SELL",
            transfer_fee=squad_player.current_value
        )

        db.add(transfer)

        # ---------------------------------------
        # Remove player from squad
        # ---------------------------------------

        db.delete(squad_player)

        # ---------------------------------------
        # Save changes
        # ---------------------------------------

        db.commit()

        db.refresh(squad)
        db.refresh(transfer)

        # ---------------------------------------
        # Update squad statistics
        # ---------------------------------------

        SquadService.calculate_squad_value(
            db,
            squad.id
        )

        SquadService.calculate_total_points(
            db,
            squad.id
        )

        return {
            "message": "Player sold successfully.",
            "player": player.name,
            "sale_price": transfer.transfer_fee,
            "remaining_budget": squad.budget
        }
    
    # =====================================================
    # Transfer History of a Squad
    # =====================================================

    @staticmethod
    def get_transfer_history(
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

        history = (
            db.query(TransferHistory)
            .filter(
                TransferHistory.squad_id == squad_id
            )
            .order_by(
                TransferHistory.transferred_at.desc()
            )
            .all()
        )

        results = []

        for transfer in history:

            player = (
                db.query(Player)
                .filter(
                    Player.fifa_id == transfer.player_id
                )
                .first()
            )

            results.append({
                "id": transfer.id,
                "squad_id": squad.id,
                "squad_name": squad.squad_name,
                "player_id": transfer.player_id,
                "player_name": player.name if player else "Unknown",
                "transfer_type": transfer.transfer_type,
                "transfer_fee": transfer.transfer_fee,
                "transferred_at": transfer.transferred_at
            })

        return results

    # =====================================================
    # Transfer History of a Player
    # =====================================================

    @staticmethod
    def get_player_transfer_history(
        db: Session,
        player_id: int
    ):

        player = (
            db.query(Player)
            .filter(
                Player.fifa_id == player_id
            )
            .first()
        )

        if not player:
            raise ValueError("Player not found.")

        history = (
            db.query(TransferHistory)
            .filter(
                TransferHistory.player_id == player_id
            )
            .order_by(
                TransferHistory.transferred_at.desc()
            )
            .all()
        )

        results = []

        for transfer in history:

            squad = (
                db.query(Squad)
                .filter(
                    Squad.id == transfer.squad_id
                )
                .first()
            )

            results.append({
                "id": transfer.id,
                "squad_id": transfer.squad_id,
                "squad_name": squad.squad_name if squad else "Unknown",
                "player_id": player.fifa_id,
                "player_name": player.name,
                "transfer_type": transfer.transfer_type,
                "transfer_fee": transfer.transfer_fee,
                "transferred_at": transfer.transferred_at
            })

        return results

    # =====================================================
    # Recent Market Activity
    # =====================================================

    @staticmethod
    def get_recent_transfers(
        db: Session,
        limit: int = 20
    ):

        transfers = (
            db.query(TransferHistory)
            .order_by(
                TransferHistory.transferred_at.desc()
            )
            .limit(limit)
            .all()
        )

        results = []

        for transfer in transfers:

            player = (
                db.query(Player)
                .filter(
                    Player.fifa_id == transfer.player_id
                )
                .first()
            )

            squad = (
                db.query(Squad)
                .filter(
                    Squad.id == transfer.squad_id
                )
                .first()
            )

            results.append({
                "squad_name": squad.squad_name if squad else "Unknown",
                "player_name": player.name if player else "Unknown",
                "transfer_type": transfer.transfer_type,
                "transfer_fee": transfer.transfer_fee,
                "transferred_at": transfer.transferred_at
            })

        return results
    
        # =====================================================
    # Transfer Summary
    # =====================================================

    @staticmethod
    def get_transfer_summary(
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

        history = (
            db.query(TransferHistory)
            .filter(
                TransferHistory.squad_id == squad_id
            )
            .all()
        )

        total_buys = sum(
            1
            for transfer in history
            if transfer.transfer_type == "BUY"
        )

        total_sells = sum(
            1
            for transfer in history
            if transfer.transfer_type == "SELL"
        )

        total_spent = TransferService.get_total_spent(
            db,
            squad_id
        )

        total_received = TransferService.get_total_received(
            db,
            squad_id
        )

        return {
            "total_transfers": len(history),
            "total_buys": total_buys,
            "total_sells": total_sells,
            "total_spent": total_spent,
            "total_received": total_received,
            "net_spent": total_spent - total_received
        }

    # =====================================================
    # Total Money Spent
    # =====================================================

    @staticmethod
    def get_total_spent(
        db: Session,
        squad_id: int
    ):

        transfers = (
            db.query(TransferHistory)
            .filter(
                TransferHistory.squad_id == squad_id,
                TransferHistory.transfer_type == "BUY"
            )
            .all()
        )

        return sum(
            transfer.transfer_fee
            for transfer in transfers
        )

    # =====================================================
    # Total Money Received
    # =====================================================

    @staticmethod
    def get_total_received(
        db: Session,
        squad_id: int
    ):

        transfers = (
            db.query(TransferHistory)
            .filter(
                TransferHistory.squad_id == squad_id,
                TransferHistory.transfer_type == "SELL"
            )
            .all()
        )

        return sum(
            transfer.transfer_fee
            for transfer in transfers
        )

    # =====================================================
    # Net Spending
    # =====================================================

    @staticmethod
    def get_net_spent(
        db: Session,
        squad_id: int
    ):

        spent = TransferService.get_total_spent(
            db,
            squad_id
        )

        received = TransferService.get_total_received(
            db,
            squad_id
        )

        return spent - received