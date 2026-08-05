from pydantic import BaseModel
from typing import List, Optional

class TacticalAdvisorRequest(BaseModel):
    query: str

class TacticalAdvisorResponse(BaseModel):
    answer: str

class PlayerSimilarityResponse(BaseModel):
    fifa_id: int
    name: str
    overall: int
    position: str
    club: str
    similarity_score: float
    age: Optional[int] = None
    potential: Optional[int] = None
    preferred_foot: Optional[str] = None
    value_eur: Optional[float] = None
    wage_eur: Optional[float] = None
    nationality: Optional[str] = None
    face_url: Optional[str] = None
    club_logo: Optional[str] = None
    nation_flag: Optional[str] = None
    
class HiddenGemResponse(BaseModel):
    fifa_id: int
    name: str
    age: int
    overall: int
    potential: int
    value_eur: Optional[float] = None
    wage_eur: Optional[float] = None
    predicted_value_eur: float
    undervaluation_gap: float
    hidden_gem_score: float
