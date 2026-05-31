from __future__ import annotations

from datetime import date
from typing import Optional
from pydantic import BaseModel


class LotacaoOut(BaseModel):
    id: int
    procurador_id: int
    area_codigo: str
    data_entrada: date
    data_saida: Optional[date] = None
    motivo: str
    ciclo_id: str

    model_config = {"from_attributes": True}
