from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel

from app.schemas.lotacao import LotacaoOut


class ProcuradorBase(BaseModel):
    nome: str
    antiguidade: int
    status: str = "PENDENTE"  # LOTADO | PENDENTE | EM_LICENCA | VACANCIA
    lotacao_atual_codigo: Optional[str] = None
    ativo: bool = True


class ProcuradorCreate(ProcuradorBase):
    pass


class ProcuradorUpdate(BaseModel):
    nome: Optional[str] = None
    status: Optional[str] = None
    lotacao_atual_codigo: Optional[str] = None
    ativo: Optional[bool] = None


class PreferenciaOut(BaseModel):
    area_codigo: str
    ordem: int

    model_config = {"from_attributes": True}


class ProcuradorOut(ProcuradorBase):
    id: int
    preferencias: List[PreferenciaOut] = []

    model_config = {"from_attributes": True}


class ProcuradorDetalhe(ProcuradorOut):
    historico: List[LotacaoOut] = []
