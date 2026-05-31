"""
Testes unitários para o algoritmo de acervo (R2, R4, R5, R6).
Sem banco de dados — operações puras sobre dataclasses.
"""
from __future__ import annotations

import pytest

from app.services.acervo import (
    alocar_acervo,
    verificar_orcamento,
    BudgetExceededException,
    ProcuradorDTO,
    PrefDTO,
    VagaDTO,
)


# ── helpers ──────────────────────────────────────────────────────────────────

def proc(id: int, antiguidade: int, prefs: list[str], ativo: bool = True) -> ProcuradorDTO:
    return ProcuradorDTO(
        id=id,
        antiguidade=antiguidade,
        ativo=ativo,
        preferencias=[PrefDTO(area_codigo=a, ordem=i + 1) for i, a in enumerate(prefs)],
    )


def vaga(id: int, area: str, ocupante_id: int | None = None) -> VagaDTO:
    return VagaDTO(id=id, area_codigo=area, ocupante_id=ocupante_id)


# ── R2: caso básico ───────────────────────────────────────────────────────────

def test_r2_basico_cada_um_pega_primeira_preferencia():
    """3 procuradores, 3 áreas distintas, 1 vaga cada → todos na 1ª preferência."""
    procs = [
        proc(1, antiguidade=1, prefs=["A", "B", "C"]),
        proc(2, antiguidade=2, prefs=["B", "A", "C"]),
        proc(3, antiguidade=3, prefs=["C", "A", "B"]),
    ]
    vagas = [vaga(10, "A"), vaga(20, "B"), vaga(30, "C")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] == 10  # proc 1 → área A
    assert resultado.alocacoes[2] == 20  # proc 2 → área B
    assert resultado.alocacoes[3] == 30  # proc 3 → área C
    assert resultado.sem_vaga == []


# ── R2: conflito → mais antigo vence ─────────────────────────────────────────

def test_r2_conflito_mais_antigo_vence():
    """2 procuradores querem a mesma área. Mais antigo (menor antiguidade) fica, outro cai para 2ª."""
    procs = [
        proc(1, antiguidade=1, prefs=["A", "B"]),
        proc(2, antiguidade=2, prefs=["A", "B"]),
    ]
    vagas = [vaga(10, "A"), vaga(20, "B")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] == 10  # mais antigo fica na A
    assert resultado.alocacoes[2] == 20  # mais novo cai para B
    assert resultado.sem_vaga == []


def test_r2_conflito_sem_segunda_opcao():
    """2 procuradores querem área A, só 1 vaga, nenhuma outra área disponível."""
    procs = [
        proc(1, antiguidade=1, prefs=["A"]),
        proc(2, antiguidade=2, prefs=["A"]),
    ]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] == 10
    assert 2 in resultado.sem_vaga


# ── R2: procurador sem preferência satisfeita ────────────────────────────────

def test_r2_sem_preferencia_disponivel():
    """Procurador cuja única preferência não tem vaga fica sem lotação."""
    procs = [
        proc(1, antiguidade=1, prefs=["A"]),
        proc(2, antiguidade=2, prefs=["B"]),  # B não tem vaga
    ]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] == 10
    assert 2 in resultado.sem_vaga


def test_r2_sem_preferencias_cadastradas():
    """Procurador sem preferências → sem_vaga."""
    procs = [proc(1, antiguidade=1, prefs=[])]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert 1 in resultado.sem_vaga
    assert resultado.alocacoes == {}


# ── R2: ordem de antiguidade ──────────────────────────────────────────────────

def test_r2_ordem_antiguidade_respeitada():
    """Com 1 vaga disputada por 3, o mais antigo (antiguidade=1) sempre vence."""
    procs = [
        proc(3, antiguidade=3, prefs=["A"]),
        proc(1, antiguidade=1, prefs=["A"]),
        proc(2, antiguidade=2, prefs=["A"]),
    ]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] == 10
    assert 2 in resultado.sem_vaga
    assert 3 in resultado.sem_vaga


# ── R4: orçamento ────────────────────────────────────────────────────────────

def test_r4_orcamento_ok():
    """Σ vagas == total procuradores: não levanta exceção."""
    procs = [proc(1, 1, ["A"]), proc(2, 2, ["B"])]
    vagas = [vaga(10, "A"), vaga(20, "B")]
    verificar_orcamento(vagas, procs)  # não deve levantar


def test_r4_orcamento_excedido_levanta_excecao():
    """Σ vagas > total procuradores → BudgetExceededException."""
    procs = [proc(1, 1, ["A"])]
    vagas = [vaga(10, "A"), vaga(20, "B"), vaga(30, "C")]

    with pytest.raises(BudgetExceededException) as exc_info:
        verificar_orcamento(vagas, procs)

    assert exc_info.value.total_vagas == 3
    assert exc_info.value.total_procuradores == 1


def test_r4_alocar_levanta_excecao_por_padrao():
    """alocar_acervo com verificar_budget=True (padrão) valida orçamento."""
    procs = [proc(1, 1, ["A"])]
    vagas = [vaga(10, "A"), vaga(20, "B")]

    with pytest.raises(BudgetExceededException):
        alocar_acervo(procs, vagas)


# ── R5: licença libera vaga ───────────────────────────────────────────────────

def test_r5_em_licenca_nao_aloca():
    """Procurador EM_LICENCA (ativo=False) não participa da alocação."""
    procs = [
        proc(1, antiguidade=1, prefs=["A"], ativo=False),  # em licença
        proc(2, antiguidade=2, prefs=["A"], ativo=True),
    ]
    # Vaga de A está livre (licença liberou — pool já chegou sem ocupante)
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert 1 not in resultado.alocacoes
    assert resultado.alocacoes[2] == 10


def test_r5_em_licenca_nao_aparece_em_sem_vaga():
    """Inativo nem tenta alocar, logo não entra em sem_vaga."""
    procs = [proc(1, antiguidade=1, prefs=["A"], ativo=False)]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert 1 not in resultado.sem_vaga
    assert resultado.alocacoes == {}


# ── R6: vacância libera vaga (idêntico ao R5) ────────────────────────────────

def test_r6_vacancia_nao_aloca():
    """Procurador em vacância (ativo=False) não participa; vaga vai ao pool."""
    procs = [
        proc(1, antiguidade=1, prefs=["A"], ativo=False),  # vacância
        proc(2, antiguidade=2, prefs=["A"], ativo=True),
    ]
    vagas = [vaga(10, "A")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[2] == 10
    assert 1 not in resultado.alocacoes


# ── múltiplas vagas na mesma área ────────────────────────────────────────────

def test_multiplas_vagas_mesma_area():
    """Área com 2 vagas azuis acomoda os 2 primeiros que a preferirem."""
    procs = [
        proc(1, antiguidade=1, prefs=["A"]),
        proc(2, antiguidade=2, prefs=["A"]),
        proc(3, antiguidade=3, prefs=["A", "B"]),
    ]
    vagas = [vaga(10, "A"), vaga(11, "A"), vaga(20, "B")]

    resultado = alocar_acervo(procs, vagas, verificar_budget=False)

    assert resultado.alocacoes[1] in (10, 11)
    assert resultado.alocacoes[2] in (10, 11)
    assert resultado.alocacoes[1] != resultado.alocacoes[2]
    assert resultado.alocacoes[3] == 20
