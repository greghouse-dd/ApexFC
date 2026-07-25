# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.player_service import PlayerService

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)


@router.get("/")
def get_players(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    club: str | None = None,
    league: str | None = None,
    nationality: str | None = None,
    position: str | None = None,
    min_overall: int | None = Query(None, ge=0, le=99),
    min_age: int | None = None,
    max_age: int | None = Query(None, ge=15, le=60),
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
    descending: bool = True,
    db: Session = Depends(get_db)
):
    return PlayerService.get_players(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        club=club,
        league=league,
        nationality=nationality,
        position=position,
        min_overall=min_overall,
        min_age=min_age,
        max_age=max_age,
        min_potential=min_potential,
        min_height=min_height,
        min_weight=min_weight,
        max_market_value=max_market_value,
        min_xg=min_xg,
        min_goals=min_goals,
        min_pass_accuracy=min_pass_accuracy,
        min_progressive_passes=min_progressive_passes,
        foot=foot,
        sort_by=sort_by,
        descending=descending
    )


@router.get("/top")
def get_top_players(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return PlayerService.get_top_players(
        db,
        limit
    )


@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db)
):
    return PlayerService.get_statistics(db)


@router.get("/clubs")
def get_clubs(
    db: Session = Depends(get_db)
):
    return PlayerService.get_all_clubs(db)


@router.get("/leagues")
def get_leagues(
    db: Session = Depends(get_db)
):
    return PlayerService.get_all_leagues(db)


@router.get("/nationalities")
def get_nationalities(
    db: Session = Depends(get_db)
):
    return PlayerService.get_all_nationalities(db)


@router.get("/{player_id}")
def get_player(
    player_id: int,
    db: Session = Depends(get_db)
):
    return PlayerService.get_player_by_id(
        db,
        player_id
    )