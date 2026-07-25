# backend/app/routers/squads.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.squad import (
    SquadCreate,
    SquadResponse,
    SquadDetailResponse,
    SquadMessage,
    AddPlayerRequest,
    CaptainUpdate,
    ViceCaptainUpdate,
    FormationUpdate,
    SquadUpdate,
)
from app.services.squad_service import SquadService

router = APIRouter(
    prefix="/squads",
    tags=["Squads"]
)


# ==========================================================
# Create Squad
# ==========================================================

@router.post(
    "/",
    response_model=SquadResponse,
    status_code=status.HTTP_201_CREATED
)
def create_squad(
    squad: SquadCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.create_squad(
            db=db,
            user_id=user_id,
            squad_name=squad.squad_name,
            formation=squad.formation
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Get User Squads
# ==========================================================

@router.get(
    "/",
    response_model=list[SquadResponse]
)
def get_user_squads(
    user_id: int,
    db: Session = Depends(get_db)
):
    return SquadService.get_user_squads(
        db=db,
        user_id=user_id
    )


# ==========================================================
# Get Squad
# ==========================================================

@router.get(
    "/{squad_id}",
    response_model=SquadDetailResponse
)
def get_squad(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.get_squad(
            db=db,
            squad_id=squad_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Delete Squad
# ==========================================================

@router.delete(
    "/{squad_id}",
    response_model=SquadMessage
)
def delete_squad(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.delete_squad(
            db=db,
            squad_id=squad_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# Add Player
# ==========================================================

@router.post(
    "/{squad_id}/players",
    response_model=SquadMessage
)
def add_player(
    squad_id: int,
    request: AddPlayerRequest,
    db: Session = Depends(get_db)
):
    try:
        SquadService.add_player(
            db=db,
            squad_id=squad_id,
            player_id=request.player_id,
            position=request.position
        )

        return {
            "message": "Player added successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Remove Player
# ==========================================================

@router.delete(
    "/{squad_id}/players/{player_id}",
    response_model=SquadMessage
)
def remove_player(
    squad_id: int,
    player_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.remove_player(
            db=db,
            squad_id=squad_id,
            player_id=player_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Remove All Players
# ==========================================================

@router.delete(
    "/{squad_id}/players",
    response_model=SquadMessage
)
def remove_all_players(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.remove_all_players(
            db=db,
            squad_id=squad_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Set Captain
# ==========================================================

@router.patch(
    "/{squad_id}/captain",
    response_model=SquadResponse
)
def set_captain(
    squad_id: int,
    request: CaptainUpdate,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.set_captain(
            db=db,
            squad_id=squad_id,
            player_id=request.player_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Set Vice Captain
# ==========================================================

@router.patch(
    "/{squad_id}/vice-captain",
    response_model=SquadResponse
)
def set_vice_captain(
    squad_id: int,
    request: ViceCaptainUpdate,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.set_vice_captain(
            db=db,
            squad_id=squad_id,
            player_id=request.player_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Change Formation
# ==========================================================

@router.patch(
    "/{squad_id}/formation",
    response_model=SquadResponse
)
def change_formation(
    squad_id: int,
    request: FormationUpdate,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.change_formation(
            db=db,
            squad_id=squad_id,
            formation=request.formation
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Update Squad Settings
# ==========================================================

@router.patch(
    "/{squad_id}",
    response_model=SquadResponse
)
def update_squad(
    squad_id: int,
    request: SquadUpdate,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.update_squad(
            db=db,
            squad_id=squad_id,
            squad_name=request.squad_name,
            formation=request.formation,
            budget=request.budget
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# Squad Summary
# ==========================================================

@router.get(
    "/{squad_id}/summary"
)
def squad_summary(
    squad_id: int,
    db: Session = Depends(get_db)
):
    try:
        return SquadService.get_squad_summary(
            db=db,
            squad_id=squad_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )