from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.area import Area
from app.models.ciclo import Ciclo
from app.models.vaga import Vaga
from app.schemas.area import AreaCreate, AreaUpdate, AreaOut

router = APIRouter()

_TIPOS = [
    ("PG",         "vagas_pg"),
    ("NOMEACAO",   "vagas_nomeacao"),
    ("ESCOLHA",    "vagas_escolha"),
    ("DESIGNACAO", "vagas_designacao"),
    ("ACERVO",     "vagas_acervo"),
]


def _sincronizar_vagas(area: Area, ciclo_id: str, db: Session) -> None:
    """Garante que as instâncias de Vaga do ciclo refletem os contadores da área.
    Adiciona vagas faltantes e remove vagas livres excedentes.
    Vagas com ocupante nunca são removidas.
    """
    for tipo, attr in _TIPOS:
        qtd = getattr(area, attr, 0) or 0
        existentes = (
            db.query(Vaga)
            .filter(Vaga.area_codigo == area.codigo, Vaga.tipo == tipo, Vaga.ciclo_id == ciclo_id)
            .order_by(Vaga.numero)
            .all()
        )
        numeros_existentes = {v.numero for v in existentes}

        # Adicionar vagas faltantes
        for num in range(1, qtd + 1):
            if num not in numeros_existentes:
                db.add(Vaga(area_codigo=area.codigo, numero=num, tipo=tipo, ciclo_id=ciclo_id))

        # Remover vagas livres excedentes (sem ocupante)
        for v in existentes:
            if v.numero > qtd and v.ocupante_id is None:
                db.delete(v)


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
    db.flush()

    # Se há ciclo ativo, gerar vagas imediatamente
    ciclo = db.query(Ciclo).filter(Ciclo.status == "EM_CURSO").first()
    if ciclo:
        _sincronizar_vagas(area, ciclo.id, db)

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
    db.flush()

    # Sincronizar vagas com ciclo ativo
    ciclo = db.query(Ciclo).filter(Ciclo.status == "EM_CURSO").first()
    if ciclo:
        _sincronizar_vagas(area, ciclo.id, db)

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
