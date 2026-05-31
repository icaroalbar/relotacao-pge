from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, field_validator


class AreaBase(BaseModel):
    codigo: str
    nome: str
    tipo: str  # ESPECIALIZADA | REGIONAL | GABINETE
    vagas_pg: int = 0
    vagas_nomeacao: int = 0
    vagas_escolha: int = 0
    vagas_designacao: int = 0
    vagas_acervo: int = 0
    rotulos_nomeacao: Optional[List[str]] = None
    rotulos_designacao: Optional[List[str]] = None

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v: str) -> str:
        validos = {"ESPECIALIZADA", "REGIONAL", "GABINETE"}
        if v not in validos:
            raise ValueError(f"tipo deve ser um de {validos}")
        return v


class AreaCreate(AreaBase):
    pass


class AreaUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    vagas_pg: Optional[int] = None
    vagas_nomeacao: Optional[int] = None
    vagas_escolha: Optional[int] = None
    vagas_designacao: Optional[int] = None
    vagas_acervo: Optional[int] = None
    rotulos_nomeacao: Optional[List[str]] = None
    rotulos_designacao: Optional[List[str]] = None


class AreaOut(AreaBase):
    total_vagas: int

    model_config = {"from_attributes": True}
