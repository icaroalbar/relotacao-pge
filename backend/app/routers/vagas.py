from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vaga import Vaga
from app.schemas.vaga import VagaCreate, VagaUpdate, VagaOut

router = APIRouter()


@router.get("", response_model=List[VagaOut])
def listar_vagas(
    area_codigo: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    ciclo_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Vaga)
    if area_codigo:
        q = q.filter(Vaga.area_codigo == area_codigo)
    if tipo:
        q = q.filter(Vaga.tipo == tipo)
    if ciclo_id:
        q = q.filter(Vaga.ciclo_id == ciclo_id)
    return q.order_by(Vaga.area_codigo, Vaga.tipo, Vaga.numero).all()


@router.get("/{id}", response_model=VagaOut)
def obter_vaga(id: int, db: Session = Depends(get_db)):
    vaga = db.get(Vaga, id)
    if not vaga:
        raise HTTPException(404, f"Vaga {id} não encontrada")
    return vaga


@router.post("", response_model=VagaOut, status_code=201)
def criar_vaga(payload: VagaCreate, db: Session = Depends(get_db)):
    vaga = Vaga(**payload.model_dump())
    db.add(vaga)
    db.commit()
    db.refresh(vaga)
    return vaga


@router.patch("/{id}", response_model=VagaOut)
def atualizar_vaga(id: int, payload: VagaUpdate, db: Session = Depends(get_db)):
    """
    R3: edição manual sempre permitida. Se tipo==ACERVO, força origem=MANUAL.
    Regra de unicidade: procurador só pode ocupar uma vaga por vez.
    Se já estiver em outra vaga do mesmo ciclo, aquela é liberada automaticamente.
    """
    vaga = db.get(Vaga, id)
    if not vaga:
        raise HTTPException(404, f"Vaga {id} não encontrada")

    dados = payload.model_dump(exclude_unset=True)
    novo_ocupante_id = dados.get("ocupante_id")

    # Liberar vaga anterior do procurador (unicidade)
    if novo_ocupante_id is not None:
        vaga_anterior = (
            db.query(Vaga)
            .filter(
                Vaga.ocupante_id == novo_ocupante_id,
                Vaga.id != id,
                Vaga.ciclo_id == vaga.ciclo_id,
            )
            .first()
        )
        if vaga_anterior:
            vaga_anterior.ocupante_id = None
            # Se era acervo automático, volta a ser automática (livre)
            # Se era manual, mantém origem mas fica livre

    # R3: alterar ocupante de vaga azul marca como MANUAL
    if "ocupante_id" in dados and vaga.tipo == "ACERVO":
        dados["origem"] = "MANUAL"

    for campo, valor in dados.items():
        setattr(vaga, campo, valor)

    db.commit()
    db.refresh(vaga)
    return vaga


@router.delete("/{id}", status_code=204)
def deletar_vaga(id: int, db: Session = Depends(get_db)):
    vaga = db.get(Vaga, id)
    if not vaga:
        raise HTTPException(404, f"Vaga {id} não encontrada")
    db.delete(vaga)
    db.commit()


@router.post("/gerar/{ciclo_id}", response_model=List[VagaOut], status_code=201)
def gerar_vagas_do_ciclo(ciclo_id: str, db: Session = Depends(get_db)):
    """
    Gera instâncias de Vaga para todas as áreas com base nos contadores,
    para o ciclo informado. Idempotente: ignora vagas já existentes.
    """
    from app.models.area import Area
    from app.models.ciclo import Ciclo

    ciclo = db.get(Ciclo, ciclo_id)
    if not ciclo:
        raise HTTPException(404, f"Ciclo '{ciclo_id}' não encontrado")

    areas = db.query(Area).all()
    criadas: list[Vaga] = []

    tipo_map = [
        ("PG", "vagas_pg"),
        ("NOMEACAO", "vagas_nomeacao"),
        ("ESCOLHA", "vagas_escolha"),
        ("DESIGNACAO", "vagas_designacao"),
        ("ACERVO", "vagas_acervo"),
    ]

    for area in areas:
        for tipo, attr in tipo_map:
            qtd = getattr(area, attr)
            for num in range(1, qtd + 1):
                existente = (
                    db.query(Vaga)
                    .filter(
                        Vaga.area_codigo == area.codigo,
                        Vaga.numero == num,
                        Vaga.tipo == tipo,
                    )
                    .first()
                )
                if not existente:
                    v = Vaga(
                        area_codigo=area.codigo,
                        numero=num,
                        tipo=tipo,
                        ciclo_id=ciclo_id,
                    )
                    db.add(v)
                    criadas.append(v)

    db.commit()
    for v in criadas:
        db.refresh(v)
    return criadas
