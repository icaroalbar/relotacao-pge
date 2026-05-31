from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class VagaBase(BaseModel):
    area_codigo: str
    numero: int
    tipo: str  # PG | NOMEACAO | ESCOLHA | DESIGNACAO | ACERVO
    cargo: Optional[str] = None
    ocupante_id: Optional[int] = None
    origem: str = "AUTOMATICA"
    ciclo_id: Optional[str] = None


class VagaCreate(VagaBase):
    pass


class VagaUpdate(BaseModel):
    cargo: Optional[str] = None
    ocupante_id: Optional[int] = None
    origem: Optional[str] = None


class VagaOut(VagaBase):
    id: int

    model_config = {"from_attributes": True}
