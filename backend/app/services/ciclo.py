"""
Serviços de ciclo: alocação de acervo com DB e encerramento.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Optional

from sqlalchemy.orm import Session, selectinload

from app.models.area import Area
from app.models.ciclo import Ciclo
from app.models.lotacao import Lotacao
from app.models.procurador import Procurador
from app.models.vaga import Vaga
from app.services.acervo import (
    PrefDTO,
    ProcuradorDTO,
    VagaDTO,
    alocar_acervo,
)


# ── DTOs de resultado ──────────────────────────────────────────────────────────

@dataclass
class ResultadoAlocacao:
    alocados: int
    sem_vaga: List[int]  # procurador ids
    vagas_preenchidas: List[int]  # vaga ids


@dataclass
class ResultadoEncerramento:
    ciclo_id: str
    total_procuradores: int
    total_vagas: int
    movimentacoes: int
    permanencias: int
    pct_primeira_pref: float


# ── MOTIVO por tipo de vaga ────────────────────────────────────────────────────

_MOTIVO: Dict[str, str] = {
    "PG": "POSSE_INICIAL",
    "NOMEACAO": "NOMEACAO",
    "ESCOLHA": "ESCOLHA_CHEFE",
    "DESIGNACAO": "DESIGNACAO_PG",
    "ACERVO": "ACERVO",
}


# ── Alocação de acervo com persistência ───────────────────────────────────────

def alocar_acervo_db(ciclo_id: str, db: Session) -> ResultadoAlocacao:
    """
    Executa R2 usando dados do banco e persiste as alocações.
    Limpa alocações AUTOMATICA anteriores antes de rodar (idempotente).
    """
    ciclo = db.get(Ciclo, ciclo_id)
    if not ciclo:
        raise ValueError(f"Ciclo '{ciclo_id}' não encontrado")
    if ciclo.status != "EM_CURSO":
        raise ValueError(f"Ciclo '{ciclo_id}' não está EM_CURSO")

    # Limpa alocações automáticas anteriores para reexecutar de forma idempotente
    vagas_acervo_auto = (
        db.query(Vaga)
        .filter(Vaga.ciclo_id == ciclo_id, Vaga.tipo == "ACERVO", Vaga.origem == "AUTOMATICA")
        .all()
    )
    for v in vagas_acervo_auto:
        v.ocupante_id = None

    db.flush()

    # Carrega procuradores com preferências
    procuradores_db = (
        db.query(Procurador)
        .options(selectinload(Procurador.preferencias))
        .all()
    )

    # Vagas ACERVO livres (inclui as manuais que ainda estão livres)
    vagas_db = (
        db.query(Vaga)
        .filter(Vaga.ciclo_id == ciclo_id, Vaga.tipo == "ACERVO", Vaga.ocupante_id.is_(None))
        .all()
    )

    # Converte para DTOs
    proc_dtos = [
        ProcuradorDTO(
            id=p.id,
            antiguidade=p.antiguidade,
            ativo=p.ativo,
            preferencias=[
                PrefDTO(area_codigo=pref.area_codigo, ordem=pref.ordem)
                for pref in p.preferencias
            ],
        )
        for p in procuradores_db
    ]

    vaga_dtos = [
        VagaDTO(id=v.id, area_codigo=v.area_codigo, ocupante_id=v.ocupante_id)
        for v in vagas_db
    ]

    # Executa R2 (sem verificar budget — vagas já filtradas por tipo)
    resultado = alocar_acervo(proc_dtos, vaga_dtos, verificar_budget=False)

    # Map vaga_id → Vaga ORM para lookup rápido
    vaga_map: Dict[int, Vaga] = {v.id: v for v in vagas_db}

    # Persiste alocações
    for proc_id, vaga_id in resultado.alocacoes.items():
        vaga_orm = vaga_map[vaga_id]
        vaga_orm.ocupante_id = proc_id
        vaga_orm.origem = "AUTOMATICA"

    # Atualiza lotacao_atual e status dos procuradores alocados
    proc_map: Dict[int, Procurador] = {p.id: p for p in procuradores_db}
    area_por_vaga: Dict[int, str] = {v.id: v.area_codigo for v in vagas_db}

    for proc_id, vaga_id in resultado.alocacoes.items():
        proc_orm = proc_map[proc_id]
        proc_orm.lotacao_atual_codigo = area_por_vaga[vaga_id]
        proc_orm.status = "LOTADO"

    db.commit()

    return ResultadoAlocacao(
        alocados=len(resultado.alocacoes),
        sem_vaga=resultado.sem_vaga,
        vagas_preenchidas=list(resultado.alocacoes.values()),
    )


# ── Encerramento de ciclo ──────────────────────────────────────────────────────

def encerrar_ciclo(ciclo_id: str, db: Session) -> ResultadoEncerramento:
    """
    R7: encerra o ciclo EM_CURSO.
    - Congela snapshot JSONB das vagas
    - Fecha lotações abertas
    - Cria Lotacao para cada procurador com vaga
    - Calcula métricas
    """
    ciclo = db.get(Ciclo, ciclo_id)
    if not ciclo:
        raise ValueError(f"Ciclo '{ciclo_id}' não encontrado")
    if ciclo.status != "EM_CURSO":
        raise ValueError(f"Ciclo '{ciclo_id}' não está EM_CURSO")

    hoje = date.today()

    # 1. Snapshot: todas as vagas do ciclo
    vagas_ciclo = db.query(Vaga).filter(Vaga.ciclo_id == ciclo_id).all()
    ciclo.snapshot = [
        {
            "id": v.id,
            "area_codigo": v.area_codigo,
            "numero": v.numero,
            "tipo": v.tipo,
            "cargo": v.cargo,
            "ocupante_id": v.ocupante_id,
            "origem": v.origem,
        }
        for v in vagas_ciclo
    ]

    # 2. Fecha lotações abertas do ciclo
    db.query(Lotacao).filter(
        Lotacao.ciclo_id == ciclo_id, Lotacao.data_saida.is_(None)
    ).update({"data_saida": hoje})

    # 3. Mapa procurador_id → vaga atual (qualquer tipo)
    proc_ids_com_vaga: Dict[int, Vaga] = {}
    for v in vagas_ciclo:
        if v.ocupante_id is not None:
            proc_ids_com_vaga[v.ocupante_id] = v

    # 4. Carrega todos os procuradores ativos
    procuradores = db.query(Procurador).filter(Procurador.ativo == True).all()  # noqa: E712

    # 5. Para calcular métricas de acervo (pct_primeira_pref)
    prefs_map: Dict[int, str] = {}  # proc_id → área da 1ª preferência
    for proc in procuradores:
        prefs = sorted(proc.preferencias, key=lambda x: x.ordem)
        if prefs:
            prefs_map[proc.id] = prefs[0].area_codigo

    # 6. Gera Lotacao para cada procurador com vaga
    movimentacoes = 0
    permanencias = 0
    acervo_total = 0
    acervo_primeira_pref = 0

    for proc in procuradores:
        vaga = proc_ids_com_vaga.get(proc.id)
        if vaga is None:
            continue

        motivo = _MOTIVO.get(vaga.tipo, "ACERVO")

        lotacao = Lotacao(
            procurador_id=proc.id,
            area_codigo=vaga.area_codigo,
            data_entrada=hoje,
            data_saida=None,
            motivo=motivo,
            ciclo_id=ciclo_id,
        )
        db.add(lotacao)

        # Métricas de movimentação
        if proc.lotacao_atual_codigo and proc.lotacao_atual_codigo == vaga.area_codigo:
            permanencias += 1
        else:
            movimentacoes += 1

        # Métricas de acervo
        if vaga.tipo == "ACERVO":
            acervo_total += 1
            if prefs_map.get(proc.id) == vaga.area_codigo:
                acervo_primeira_pref += 1

    pct = (acervo_primeira_pref / acervo_total * 100) if acervo_total > 0 else 0.0

    # 7. Atualiza métricas e fecha ciclo
    total_procs = db.query(Procurador).count()
    total_vagas = len(vagas_ciclo)

    ciclo.status = "ENCERRADO"
    ciclo.encerramento = hoje
    ciclo.total_procuradores = total_procs
    ciclo.total_vagas = total_vagas
    ciclo.movimentacoes = movimentacoes
    ciclo.permanencias = permanencias
    ciclo.pct_primeira_pref = round(pct, 2)

    db.commit()

    return ResultadoEncerramento(
        ciclo_id=ciclo_id,
        total_procuradores=total_procs,
        total_vagas=total_vagas,
        movimentacoes=movimentacoes,
        permanencias=permanencias,
        pct_primeira_pref=round(pct, 2),
    )
