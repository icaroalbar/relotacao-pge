from __future__ import annotations

from pydantic import BaseModel


class PreferenciaCreate(BaseModel):
    procurador_id: int
    area_codigo: str
    ordem: int


class PreferenciaOut(BaseModel):
    procurador_id: int
    area_codigo: str
    ordem: int

    model_config = {"from_attributes": True}
