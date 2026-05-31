from __future__ import annotations

from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ciclo import Ciclo
from app.schemas.ciclo import CicloCreate, CicloOut
from app.services.ciclo import alocar_acervo_db, encerrar_ciclo

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


@router.post("/{id}/alocar-acervo")
def alocar_acervo_endpoint(id: str, db: Session = Depends(get_db)):
    """
    Executa R2 (Serial Dictatorship) sobre as vagas ACERVO do ciclo.
    Idempotente: limpa alocações automáticas anteriores antes de rodar.
    """
    try:
        resultado = alocar_acervo_db(id, db)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {
        "alocados": resultado.alocados,
        "sem_vaga": resultado.sem_vaga,
        "vagas_preenchidas": resultado.vagas_preenchidas,
    }


@router.post("/{id}/encerrar", response_model=CicloOut)
def encerrar_ciclo_endpoint(id: str, db: Session = Depends(get_db)):
    """
    R7: encerra ciclo EM_CURSO.
    Gera snapshot JSONB, fecha lotações abertas, cria histórico e calcula métricas.
    """
    try:
        encerrar_ciclo(id, db)
    except ValueError as e:
        raise HTTPException(400, str(e))
    ciclo = db.get(Ciclo, id)
    return ciclo
