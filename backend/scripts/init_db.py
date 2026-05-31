"""
init_db.py — roda no startup do container, antes do uvicorn.
1. Aplica migrations (alembic upgrade head)
2. Semeia dados se o banco estiver vazio

Acesso direto via SQLAlchemy — não depende da API estar no ar.
"""
from __future__ import annotations

import os
import random
import sys
from datetime import date

# Garante que o diretório /app está no path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic import command
from alembic.config import Config

from app.database import get_engine, Base
from app.models.area import Area
from app.models.ciclo import Ciclo
from app.models.lotacao import Lotacao  # noqa: F401
from app.models.preferencia import Preferencia
from app.models.procurador import Procurador
from app.models.vaga import Vaga

from sqlalchemy.orm import Session


# ─── dados ────────────────────────────────────────────────────────────────────

AREAS = [
    {"codigo": "PG-02", "nome": "Gabinete da Procuradoria-Geral",             "tipo": "GABINETE",      "vagas_pg": 1, "vagas_nomeacao": 3, "vagas_escolha": 0, "vagas_designacao": 6, "vagas_acervo": 2},
    {"codigo": "PG-03", "nome": "Procuradoria Tributária",                     "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 3, "vagas_designacao": 0, "vagas_acervo": 6},
    {"codigo": "PG-04", "nome": "Procuradoria de Pessoal",                     "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 8},
    {"codigo": "PG-05", "nome": "Procuradoria da Dívida Ativa",                "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 5},
    {"codigo": "PG-06", "nome": "Procuradoria do Patrimônio e Meio Ambiente",  "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-07", "nome": "Procuradoria Previdenciária",                 "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 5},
    {"codigo": "PG-08", "nome": "Procuradoria de Serviços Públicos",           "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 4},
    {"codigo": "PG-09", "nome": "Centro de Estudos Jurídicos — CEJUR",         "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-10", "nome": "Procuradoria Trabalhista",                    "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-12", "nome": "Diretoria de Gestão",                         "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-13", "nome": "Procuradoria na Capital Federal",             "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-14", "nome": "Procuradoria de Sucessões",                   "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-15", "nome": "Coordenadoria do Sistema Jurídico",           "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-16", "nome": "Procuradoria de Serviços de Saúde",           "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-17", "nome": "Procuradoria Administrativa",                 "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-18", "nome": "Procuradoria de Petróleo e Gás Natural",      "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "PG-19", "nome": "Procuradoria de Controvérsias e Dir. Humanos","tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "1PR-NIT",  "nome": "Regional de Niterói",                      "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "1PA-NIT",  "nome": "Posto Avançado Niterói",                   "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "2PR-DC",   "nome": "Regional Duque de Caxias",                 "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "3PR-NI",   "nome": "Regional Nova Iguaçu",                     "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "4PR-CF",   "nome": "Regional Cabo Frio",                       "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "5PR-VR",   "nome": "Regional Volta Redonda",                   "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "5PA-VR",   "nome": "Posto Avançado Volta Redonda",             "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "6PR-ANG",  "nome": "Regional Angra dos Reis",                  "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "7PR-PET",  "nome": "Regional Petrópolis",                      "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "8PR-FRIB", "nome": "Regional Nova Friburgo",                   "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "9PR-MAC",  "nome": "Regional Macaé",                           "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "10PR-CG",  "nome": "Regional Campos dos Goytacazes",           "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "10PA-CG",  "nome": "Posto Avançado Campos dos Goytacazes",     "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
]

NOMES = [
    "Carlos Henrique Mendes",       "Mariana Albuquerque Fonseca",
    "André Luís Ferreira",          "Juliana Costa Barbosa",
    "Roberto Assis Cavalcante",     "Fernanda Melo Ribeiro",
    "Pedro Paulo Azevedo",          "Beatriz Nunes Cardoso",
    "Marcelo Vieira Santos",        "Patrícia Leal Drummond",
    "Ricardo Borges Teixeira",      "Cristina Macedo Pereira",
    "Eduardo Pinheiro Gomes",       "Vanessa Rocha Correia",
    "Thiago Monteiro Dias",         "Luciana Farias Esteves",
    "Felipe Araújo Guimarães",      "Ana Paula Siqueira Lima",
    "Diego Campos Novaes",          "Camila Duarte Andrade",
    "Bruno Martins Queiroz",        "Renata Sobral Castro",
    "Gustavo Lopes Cunha",          "Mônica Tavares Alves",
    "Rodrigo Freitas Bastos",       "Isabela Ramos Magalhães",
    "Alexandre Carvalho Viana",     "Letícia Braga Silveira",
    "Henrique Mota Barcellos",      "Daniela Pinto Medeiros",
    "Leonardo Batista Machado",     "Priscila Moura Figueiredo",
    "Vinícius Souza Rezende",       "Tatiana Godoi Nascimento",
    "Fábio Leite Gonçalves",        "Clara Brito Fernandes",
    "Marcos Paixão Salomão",        "Aline Quaresma Oliveira",
    "Nelson Mourão Cavalcanti",     "Soraya Aragão Lustosa",
    "Otávio Cruz Brandão",          "Débora Simões Estrada",
    "Maurício Teles Pacheco",       "Jéssica Valente Moreira",
    "Sérgio Andrade Lacerda",       "Natália Cunha Fleury",
    "Paulo Henrique Resende",       "Larissa Bessa Pontual",
    "Ivan Meirelles Sampaio",       "Carolina Lyra Magalhães",
    "Claudio Pires Negrão",         "Viviane Torres Dornelas",
    "Antônio Luz Cavalcante",       "Raquel Abreu Monteiro",
    "Leandro Fonseca Amorim",       "Simone Dantas Barreto",
    "Gilberto Uchoa Fontes",        "Luana Moraes Pedrosa",
    "Edson Prado Cavalcante",       "Sandra Paiva Herculano",
    "Waldemar Vasconcelos Neto",    "Helena Coelho Trindade",
    "Flávio Teixeira Mourão",       "Elisa Maciel Guedes",
    "Jonatas Borba Salazar",        "Miriam Holanda Pimentel",
    "Álvaro Barros Camargos",       "Cíntia Paes Landim",
]

CARGOS_NOM = {
    "PG-02": ["Secretário de Gestão", "Procurador-Assistente/DG", "Chefe de Gabinete"],
    "PG-03": ["Subprocurador Tributário", "Coordenador Fiscal"],
    "PG-04": ["Subprocurador de Pessoal", "Coordenador RH"],
    "PG-05": ["Subprocurador Dívida Ativa", "Coordenador de Cobrança"],
    "PG-06": ["Subprocurador Ambiental", "Coordenador Patrimônio"],
    "PG-07": ["Subprocurador Previdenciário", "Coordenador Benefícios"],
    "PG-08": ["Subprocurador Serviços", "Coordenador Concessões"],
    "PG-09": ["Diretor do CEJUR"],
    "PG-10": ["Subprocurador Trabalhista", "Coordenador Trabalhista"],
    "PG-12": ["Diretor de Gestão", "Coordenador Administrativo"],
    "PG-13": ["Procurador Federal"],
    "PG-14": ["Subprocurador Sucessões"],
    "PG-15": ["Coordenador do Sistema"],
    "PG-16": ["Subprocurador Saúde", "Coordenador Saúde"],
    "PG-17": ["Subprocurador Administrativo", "Coordenador Adm."],
    "PG-18": ["Procurador Petróleo"],
    "PG-19": ["Procurador DH"],
}


# ─── seed ──────────────────────────────────────────────────────────────────────

def run_migrations() -> None:
    cfg = Config("/app/alembic.ini")
    cfg.set_main_option("script_location", "/app/alembic")
    command.upgrade(cfg, "head")
    print("✓ migrations OK")


def seed_if_empty() -> None:
    engine = get_engine()
    with Session(engine) as db:
        if db.query(Area).count() > 0:
            print("✓ banco já populado — pulando seed")
            return

        print("→ banco vazio — semeando dados fictícios...")
        _seed(db)


def _seed(db: Session) -> None:
    random.seed(42)

    # 1. Áreas
    for a in AREAS:
        db.add(Area(**a))
    db.flush()
    print(f"  ✓ {len(AREAS)} áreas")

    # 2. Procuradores
    status_dist = (["LOTADO"] * 55) + (["PENDENTE"] * 8) + (["EM_LICENCA"] * 5) + (["VACANCIA"] * 2)
    random.shuffle(status_dist)
    procs: list[Procurador] = []
    for i, nome in enumerate(NOMES):
        antig = i + 1
        status = status_dist[i] if i < len(status_dist) else "PENDENTE"
        ativo = status not in ("EM_LICENCA", "VACANCIA")
        p = Procurador(nome=nome, antiguidade=antig, status=status, ativo=ativo)
        db.add(p)
        procs.append(p)
    db.flush()
    print(f"  ✓ {len(procs)} procuradores")

    # 3. Ciclo
    ciclo = Ciclo(id="2026.1", abertura=date.today(), status="EM_CURSO")
    db.add(ciclo)
    db.flush()

    # 4. Vagas
    tipos = [("PG","vagas_pg"),("NOMEACAO","vagas_nomeacao"),("ESCOLHA","vagas_escolha"),
             ("DESIGNACAO","vagas_designacao"),("ACERVO","vagas_acervo")]
    all_vagas: list[Vaga] = []
    for a_data in AREAS:
        area = db.get(Area, a_data["codigo"])
        for tipo, attr in tipos:
            for num in range(1, a_data[attr] + 1):
                v = Vaga(area_codigo=a_data["codigo"], numero=num, tipo=tipo, ciclo_id="2026.1")
                db.add(v)
                all_vagas.append(v)
    db.flush()
    print(f"  ✓ {len(all_vagas)} vagas geradas")

    # 5. Preferências (todos exceto os 5 últimos)
    codigos = [a["codigo"] for a in AREAS]
    for proc in procs[:-5]:
        areas_pref = random.sample(codigos, min(random.randint(5, 8), len(codigos)))
        for ordem, cod in enumerate(areas_pref):
            db.add(Preferencia(procurador_id=proc.id, area_codigo=cod, ordem=ordem + 1))
    db.flush()
    print(f"  ✓ preferências para {len(procs) - 5} procuradores")

    # 6. Preencher nomeações (vermelhas)
    vagas_nom = [v for v in all_vagas if v.tipo == "NOMEACAO"]
    ocupados: set[int] = set()
    procs_ativos = [p for p in procs if p.ativo]
    for v in vagas_nom:
        cargos = CARGOS_NOM.get(v.area_codigo, ["Procurador"])
        cargo = cargos[(v.numero - 1) % len(cargos)]
        cands = [p for p in procs_ativos if p.id not in ocupados and p.antiguidade > 30]
        if not cands:
            cands = [p for p in procs_ativos if p.id not in ocupados]
        if not cands:
            continue
        proc = random.choice(cands)
        ocupados.add(proc.id)
        v.ocupante_id = proc.id
        v.cargo = cargo

    # 7. Preencher escolhas dos chefes (verdes)
    vagas_esc = [v for v in all_vagas if v.tipo == "ESCOLHA"]
    for v in vagas_esc:
        cands = [p for p in procs_ativos if p.id not in ocupados and p.antiguidade > 20]
        if not cands:
            cands = [p for p in procs_ativos if p.id not in ocupados]
        if not cands:
            continue
        proc = random.choice(cands)
        ocupados.add(proc.id)
        v.ocupante_id = proc.id
        v.cargo = "Assessor Especializado"

    # 8. Preencher designações PG (amarelas)
    vagas_des = [v for v in all_vagas if v.tipo == "DESIGNACAO"]
    for v in vagas_des:
        cands = [p for p in procs_ativos if p.id not in ocupados and p.antiguidade <= 15]
        if not cands:
            cands = [p for p in procs_ativos if p.id not in ocupados]
        if not cands:
            continue
        proc = random.choice(cands)
        ocupados.add(proc.id)
        v.ocupante_id = proc.id
        v.cargo = "Subprocurador-Geral"

    # 9. Preencher vaga PG (cinza)
    vagas_pg = [v for v in all_vagas if v.tipo == "PG"]
    for v in vagas_pg:
        cands = [p for p in procs_ativos if p.id not in ocupados and p.antiguidade == 1]
        if not cands:
            cands = [p for p in procs_ativos if p.id not in ocupados]
        if not cands:
            continue
        proc = cands[0]
        ocupados.add(proc.id)
        v.ocupante_id = proc.id
        v.cargo = "Procurador-Geral"

    db.flush()
    print(f"  ✓ nomeações/escolhas/designações/PG preenchidas")

    # 10. Acervo — Serial Dictatorship
    from app.services.acervo import alocar_acervo, ProcuradorDTO, PrefDTO, VagaDTO
    from sqlalchemy.orm import selectinload

    procs_db = db.query(Procurador).options(selectinload(Procurador.preferencias)).all()
    vagas_acervo = [v for v in all_vagas if v.tipo == "ACERVO" and v.ocupante_id is None]

    proc_dtos = [
        ProcuradorDTO(
            id=p.id, antiguidade=p.antiguidade, ativo=p.ativo,
            preferencias=[PrefDTO(area_codigo=pr.area_codigo, ordem=pr.ordem) for pr in p.preferencias]
        ) for p in procs_db
    ]
    vaga_dtos = [VagaDTO(id=v.id, area_codigo=v.area_codigo) for v in vagas_acervo]
    vaga_map = {v.id: v for v in vagas_acervo}

    resultado = alocar_acervo(proc_dtos, vaga_dtos, verificar_budget=False)
    proc_map = {p.id: p for p in procs_db}

    for proc_id, vaga_id in resultado.alocacoes.items():
        vaga_orm = vaga_map[vaga_id]
        vaga_orm.ocupante_id = proc_id
        vaga_orm.origem = "AUTOMATICA"
        proc_map[proc_id].lotacao_atual_codigo = vaga_orm.area_codigo
        proc_map[proc_id].status = "LOTADO"

    db.commit()
    print(f"  ✓ {len(resultado.alocacoes)} procuradores alocados no acervo")
    print(f"  ✓ seed completo — ciclo 2026.1 ativo")


if __name__ == "__main__":
    print("→ aplicando migrations...")
    run_migrations()
    print("→ verificando seed...")
    seed_if_empty()
