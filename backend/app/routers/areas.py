from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.area import Area
from app.schemas.area import AreaCreate, AreaUpdate, AreaOut

router = APIRouter()


@router.get("", response_model=List[AreaOut])
def listar_areas(db: Session = Depends(get_db)):
    return db.query(Area).order_by(Area.codigo).all()


@router.get("/{codigo}", response_model=AreaOut)
def obter_area(codigo: str, db: Session = Depends(get_db)):
    area = db.get(Area, codigo)
    if not area:
        raise HTTPException(404, f"Área '{codigo}' não encontrada")
    return area


@router.post("", response_model=AreaOut, status_code=201)
def criar_area(payload: AreaCreate, db: Session = Depends(get_db)):
    if db.get(Area, payload.codigo):
        raise HTTPException(409, f"Área '{payload.codigo}' já existe")
    area = Area(**payload.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


@router.patch("/{codigo}", response_model=AreaOut)
def atualizar_area(codigo: str, payload: AreaUpdate, db: Session = Depends(get_db)):
    area = db.get(Area, codigo)
    if not area:
        raise HTTPException(404, f"Área '{codigo}' não encontrada")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(area, campo, valor)
    db.commit()
    db.refresh(area)
    return area


@router.delete("/{codigo}", status_code=204)
def deletar_area(codigo: str, db: Session = Depends(get_db)):
    area = db.get(Area, codigo)
    if not area:
        raise HTTPException(404, f"Área '{codigo}' não encontrada")
    db.delete(area)
    db.commit()
