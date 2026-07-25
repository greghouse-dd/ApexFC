# backend/app/schemas/transfer.py

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ==========================================================
# Buy / Sell Requests
# ==========================================================

class BuyPlayerRequest(BaseModel):
    squad_id: int
    player_id: int
    position: str = Field(
        ...,
        description="Position assigned in the squad"
    )


class SellPlayerRequest(BaseModel):
    squad_id: int
    player_id: int


# ==========================================================
# Transfer History
# ==========================================================

class TransferBase(BaseModel):
    squad_id: int
    player_id: int
    transfer_type: Literal["BUY", "SELL"]
    transfer_fee: float


class TransferResponse(TransferBase):
    id: int
    transferred_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# Detailed Transfer Response
# ==========================================================

class TransferDetailResponse(BaseModel):
    id: int

    squad_id: int
    squad_name: str

    player_id: int
    player_name: str

    transfer_type: Literal["BUY", "SELL"]

    transfer_fee: float

    transferred_at: datetime


# ==========================================================
# Transfer Summary
# ==========================================================

class TransferSummary(BaseModel):
    total_transfers: int
    total_buys: int
    total_sells: int

    total_spent: float
    total_received: float
    net_spent: float


# ==========================================================
# Generic API Responses
# ==========================================================

class TransferMessage(BaseModel):
    message: str


# ==========================================================
# Recent Market Activity
# ==========================================================

class RecentTransferResponse(BaseModel):
    squad_name: str
    player_name: str

    transfer_type: Literal["BUY", "SELL"]

    transfer_fee: float

    transferred_at: datetime