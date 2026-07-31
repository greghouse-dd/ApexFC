from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.ai import (
    PlayerSimilarityResponse,
    HiddenGemResponse,
    TacticalAdvisorRequest,
    TacticalAdvisorResponse
)
from app.services.ai_service import ai_service

router = APIRouter(
    prefix="/ai",
    tags=["AI Features"]
)

@router.get("/similarity/{fifa_id}", response_model=List[PlayerSimilarityResponse])
def get_similar_players(fifa_id: int, k: int = 5, db: Session = Depends(get_db)):
    try:
        similar_players = ai_service.get_similar_players(db=db, fifa_id=fifa_id, k=k)
        if similar_players is None:
            raise HTTPException(status_code=404, detail="Player not found in ML features database")
        return similar_players
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hidden-gems", response_model=List[HiddenGemResponse])
def get_hidden_gems(
    limit: int = 20,
    search: str | None = None,
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
    db: Session = Depends(get_db)
):
    try:
        gems = ai_service.get_top_hidden_gems(
            db=db,
            limit=limit,
            search=search,
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
            foot=foot
        )
        return gems
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tactical-advisor")
def get_tactical_advice(request: TacticalAdvisorRequest):
    try:
        generator = ai_service.query_tactical_advisor_stream(query=request.query)
        return StreamingResponse(generator, media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
