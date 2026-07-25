# backend/app/routers/watchlist.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.watchlist import (
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistResponse,
    WatchlistDetailResponse,
    WatchlistMessage,
)

from app.services.watchlist_service import WatchlistService

router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"]
)


# ==========================================================
# Add Player to Watchlist
# ==========================================================

@router.post(
    "/",
    response_model=WatchlistMessage,
    status_code=status.HTTP_201_CREATED
)
def add_to_watchlist(
    request: WatchlistCreate,
    db: Session = Depends(get_db)
):
    try:
        result = WatchlistService.add_to_watchlist(
            db=db,
            user_id=request.user_id,
            player_id=request.player_id,
            notes=request.notes
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
# Get User Watchlist
# ==========================================================

@router.get(
    "/{user_id}",
    response_model=list[WatchlistDetailResponse]
)
def get_watchlist(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        return WatchlistService.get_user_watchlist(
            db=db,
            user_id=user_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Update Notes
# ==========================================================

@router.patch(
    "/{player_id}/notes",
    response_model=WatchlistMessage
)
def update_notes(
    player_id: int,
    request: WatchlistUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = WatchlistService.update_notes(
            db=db,
            user_id=user_id,
            player_id=player_id,
            notes=request.notes
        )

        return {
            "message": result["message"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Remove Player
# ==========================================================

@router.delete(
    "/{player_id}",
    response_model=WatchlistMessage
)
def remove_from_watchlist(
    player_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = WatchlistService.remove_from_watchlist(
            db=db,
            user_id=user_id,
            player_id=player_id
        )

        return {
            "message": result["message"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Clear Watchlist
# ==========================================================

@router.delete(
    "/{user_id}/clear",
    response_model=WatchlistMessage
)
def clear_watchlist(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = WatchlistService.clear_watchlist(
            db=db,
            user_id=user_id
        )

        return {
            "message": result["message"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Check if Player is Watchlisted
# ==========================================================

@router.get(
    "/check/{user_id}/{player_id}"
)
def is_watchlisted(
    user_id: int,
    player_id: int,
    db: Session = Depends(get_db)
):
    return WatchlistService.is_watchlisted(
        db=db,
        user_id=user_id,
        player_id=player_id
    )