from __future__ import annotations

from datetime import date
from typing import Optional, Any
from pydantic import BaseModel


class CicloBase(BaseModel):
    id: str  # "2026.1"
    abertura: date
    status: str = "EM_CURSO"


class CicloCreate(CicloBase):
    pass


class CicloUpdate(BaseModel):
    status: Optional[str] = None
    encerramento: Optional[date] = None


class CicloOut(CicloBase):
    encerramento: Optional[date] = None
    snapshot: Optional[Any] = None
    total_procuradores: Optional[int] = None
    total_vagas: Optional[int] = None
    movimentacoes: Optional[int] = None
    permanencias: Optional[int] = None
    pct_primeira_pref: Optional[float] = None

    model_config = {"from_attributes": True}
