# backend/app/routers/transfers.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.transfer import (
    BuyPlayerRequest,
    SellPlayerRequest,
    TransferMessage,
    TransferSummary,
    TransferDetailResponse,
    RecentTransferResponse,
)

from app.services.transfer_service import TransferService

router = APIRouter(
    prefix="/transfers",
    tags=["Transfers"]
)


# ==========================================================
# Buy Player
# ==========================================================

@router.post(
    "/buy",
    response_model=TransferMessage,
    status_code=status.HTTP_201_CREATED
)
def buy_player(
    request: BuyPlayerRequest,
    db: Session = Depends(get_db)
):
    try:
        result = TransferService.buy_player(
            db=db,
            squad_id=request.squad_id,
            player_id=request.player_id,
            position=request.position
        )

        return {
            "message": result["message"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Sell Player
# ==========================================================

@router.post(
    "/sell",
    response_model=TransferMessage
)
def sell_player(
    request: SellPlayerRequest,
    db: Session = Depends(get_db)
):
    try:
        result = TransferService.sell_player(
            db=db,
            squad_id=request.squad_id,
            player_id=request.player_id
        )

        return {
            "message": result["message"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Squad Transfer History
# ==========================================================

@router.get(
    "/history/{squad_id}",
    response_model=list[TransferDetailResponse]
)
def get_transfer_history(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return TransferService.get_transfer_history(
            db=db,
            squad_id=squad_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Player Transfer History
# ==========================================================

@router.get(
    "/player/{player_id}",
    response_model=list[TransferDetailResponse]
)
def get_player_transfer_history(
    player_id: int,
    db: Session = Depends(get_db)
):
    try:
        return TransferService.get_player_transfer_history(
            db=db,
            player_id=player_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Recent Market Activity
# ==========================================================

@router.get(
    "/recent",
    response_model=list[RecentTransferResponse]
)
def get_recent_transfers(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return TransferService.get_recent_transfers(
        db=db,
        limit=limit
    )


# ==========================================================
# Transfer Summary
# ==========================================================

@router.get(
    "/summary/{squad_id}",
    response_model=TransferSummary
)
def get_transfer_summary(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return TransferService.get_transfer_summary(
            db=db,
            squad_id=squad_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )