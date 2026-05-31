from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.procurador import Procurador
from app.schemas.procurador import ProcuradorCreate, ProcuradorUpdate, ProcuradorOut, ProcuradorDetalhe
from app.schemas.preferencia import PreferenciaCreate

router = APIRouter()


@router.get("", response_model=List[ProcuradorOut])
def listar_procuradores(
    status: Optional[str] = Query(None),
    area_codigo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Procurador).options(selectinload(Procurador.preferencias))
    if status:
        q = q.filter(Procurador.status == status)
    if area_codigo:
        q = q.filter(Procurador.lotacao_atual_codigo == area_codigo)
    return q.order_by(Procurador.antiguidade).all()


@router.get("/{id}", response_model=ProcuradorDetalhe)
def obter_procurador(id: int, db: Session = Depends(get_db)):
    proc = (
        db.query(Procurador)
        .options(
            selectinload(Procurador.preferencias),
            selectinload(Procurador.historico),
        )
        .filter(Procurador.id == id)
        .first()
    )
    if not proc:
        raise HTTPException(404, f"Procurador {id} não encontrado")
    return proc


@router.post("", response_model=ProcuradorOut, status_code=201)
def criar_procurador(payload: ProcuradorCreate, db: Session = Depends(get_db)):
    existente = db.query(Procurador).filter(Procurador.antiguidade == payload.antiguidade).first()
    if existente:
        raise HTTPException(409, f"Antiguidade {payload.antiguidade} já em uso")
    proc = Procurador(**payload.model_dump())
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return proc


@router.patch("/{id}", response_model=ProcuradorOut)
def atualizar_procurador(id: int, payload: ProcuradorUpdate, db: Session = Depends(get_db)):
    proc = db.get(Procurador, id)
    if not proc:
        raise HTTPException(404, f"Procurador {id} não encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(proc, campo, valor)
    db.commit()
    db.refresh(proc)
    return proc


@router.delete("/{id}", status_code=204)
def deletar_procurador(id: int, db: Session = Depends(get_db)):
    proc = db.get(Procurador, id)
    if not proc:
        raise HTTPException(404, f"Procurador {id} não encontrado")
    db.delete(proc)
    db.commit()


# ── preferências ──────────────────────────────────────────────────────────────

@router.put("/{id}/preferencias", response_model=List[PreferenciaCreate])
def definir_preferencias(
    id: int,
    preferencias: List[PreferenciaCreate],
    db: Session = Depends(get_db),
):
    """Substitui toda a lista de preferências de um procurador (idempotente)."""
    from app.models.preferencia import Preferencia

    proc = db.get(Procurador, id)
    if not proc:
        raise HTTPException(404, f"Procurador {id} não encontrado")

    db.query(Preferencia).filter(Preferencia.procurador_id == id).delete()
    for pref in preferencias:
        db.add(Preferencia(procurador_id=id, area_codigo=pref.area_codigo, ordem=pref.ordem))
    db.commit()
    return preferencias
