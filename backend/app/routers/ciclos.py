from __future__ import annotations

from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ciclo import Ciclo
from app.schemas.ciclo import CicloCreate, CicloOut

router = APIRouter()


@router.get("", response_model=List[CicloOut])
def listar_ciclos(db: Session = Depends(get_db)):
    return db.query(Ciclo).order_by(Ciclo.abertura.desc()).all()


@router.get("/{id}", response_model=CicloOut)
def obter_ciclo(id: str, db: Session = Depends(get_db)):
    ciclo = db.get(Ciclo, id)
    if not ciclo:
        raise HTTPException(404, f"Ciclo '{id}' não encontrado")
    return ciclo


@router.post("", response_model=CicloOut, status_code=201)
def criar_ciclo(payload: CicloCreate, db: Session = Depends(get_db)):
    em_curso = db.query(Ciclo).filter(Ciclo.status == "EM_CURSO").first()
    if em_curso:
        raise HTTPException(409, f"Ciclo '{em_curso.id}' já está EM_CURSO. Encerre-o primeiro.")
    if db.get(Ciclo, payload.id):
        raise HTTPException(409, f"Ciclo '{payload.id}' já existe")
    ciclo = Ciclo(**payload.model_dump())
    db.add(ciclo)
    db.commit()
    db.refresh(ciclo)
    return ciclo


@router.post("/{id}/cancelar", response_model=CicloOut)
def cancelar_ciclo(id: str, db: Session = Depends(get_db)):
    ciclo = db.get(Ciclo, id)
    if not ciclo:
        raise HTTPException(404, f"Ciclo '{id}' não encontrado")
    if ciclo.status != "EM_CURSO":
        raise HTTPException(400, "Só é possível cancelar ciclo EM_CURSO")
    ciclo.status = "CANCELADO"
    ciclo.encerramento = date.today()
    db.commit()
    db.refresh(ciclo)
    return ciclo
