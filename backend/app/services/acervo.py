"""
Algoritmo de Acervo — R2: Serial Dictatorship por antiguidade.
Operação pura sobre dataclasses; sem dependência de SQLAlchemy ou DB.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


class BudgetExceededException(Exception):
    """Σ vagas > total de procuradores ativos (R4)."""

    def __init__(self, total_vagas: int, total_procuradores: int):
        self.total_vagas = total_vagas
        self.total_procuradores = total_procuradores
        super().__init__(
            f"Orçamento excedido: {total_vagas} vagas > {total_procuradores} procuradores"
        )


@dataclass
class PrefDTO:
    area_codigo: str
    ordem: int  # 1 = mais querida


@dataclass
class ProcuradorDTO:
    id: int
    antiguidade: int  # 1 = mais antigo
    ativo: bool  # False = EM_LICENCA ou VACANCIA
    preferencias: list[PrefDTO] = field(default_factory=list)


@dataclass
class VagaDTO:
    id: int
    area_codigo: str
    ocupante_id: Optional[int] = None
    origem: str = "AUTOMATICA"


@dataclass
class ResultadoAcervo:
    alocacoes: dict[int, int]  # procurador_id -> vaga_id
    sem_vaga: list[int]  # procurador_ids que ficaram sem lotação


def verificar_orcamento(
    vagas: list[VagaDTO],
    procuradores: list[ProcuradorDTO],
) -> None:
    """R4: Σ vagas ≤ total de procuradores. Levanta exceção se excedido."""
    total_vagas = len(vagas)
    total_procs = len(procuradores)
    if total_vagas > total_procs:
        raise BudgetExceededException(total_vagas, total_procs)


def alocar_acervo(
    procuradores: list[ProcuradorDTO],
    vagas: list[VagaDTO],
    verificar_budget: bool = True,
) -> ResultadoAcervo:
    """
    R2 — Serial Dictatorship por antiguidade crescente.

    Recebe somente as vagas ACERVO (filtragem fica a cargo do chamador),
    mas aceita qualquer lista de VagaDTO e usa todas as que estão livres.

    R5/R6: procuradores com ativo=False são ignorados; suas vagas já
    devem ter chegado aqui sem ocupante_id (pool liberado pelo chamador).
    """
    ativos = [p for p in procuradores if p.ativo]

    if verificar_budget:
        verificar_orcamento(vagas, procuradores)

    # pool indexado por area_codigo para lookup O(1)
    pool: dict[str, list[VagaDTO]] = {}
    for v in vagas:
        if v.ocupante_id is None:
            pool.setdefault(v.area_codigo, []).append(v)

    alocacoes: dict[int, int] = {}
    sem_vaga: list[int] = []

    for proc in sorted(ativos, key=lambda p: p.antiguidade):
        prefs = sorted(proc.preferencias, key=lambda x: x.ordem)
        alocado = False
        for pref in prefs:
            disponiveis = pool.get(pref.area_codigo, [])
            if disponiveis:
                vaga = disponiveis.pop(0)
                vaga.ocupante_id = proc.id
                vaga.origem = "AUTOMATICA"
                alocacoes[proc.id] = vaga.id
                alocado = True
                break
        if not alocado:
            sem_vaga.append(proc.id)

    return ResultadoAcervo(alocacoes=alocacoes, sem_vaga=sem_vaga)
