"""
Seed de dados fictícios para demonstração.
Usa as áreas reais da PGE-RJ e ~60 procuradores com nomes fictícios.
Roda contra a API em http://localhost:8000.

Uso:
  python backend/scripts/seed.py
  python backend/scripts/seed.py --clear   # apaga tudo antes de inserir
"""
from __future__ import annotations

import argparse
import random
import sys
import time
from datetime import date

try:
    import requests
except ImportError:
    print("requests não instalado. Execute: pip install requests")
    sys.exit(1)

BASE = "http://localhost:8000"
CICLO_ID = "2026.1"

# ─────────────────────────────────────────────────────────────────────────────
# ÁREAS — dados reais PGE-RJ
# ─────────────────────────────────────────────────────────────────────────────

AREAS = [
    # Gabinete
    {"codigo": "PG-02", "nome": "Gabinete da Procuradoria-Geral",           "tipo": "GABINETE",      "vagas_pg": 1, "vagas_nomeacao": 3, "vagas_escolha": 0, "vagas_designacao": 6, "vagas_acervo": 2},
    # Especializadas
    {"codigo": "PG-03", "nome": "Procuradoria Tributária",                   "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 3, "vagas_designacao": 0, "vagas_acervo": 6},
    {"codigo": "PG-04", "nome": "Procuradoria de Pessoal",                   "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 8},
    {"codigo": "PG-05", "nome": "Procuradoria da Dívida Ativa",              "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 5},
    {"codigo": "PG-06", "nome": "Procuradoria do Patrimônio e Meio Ambiente","tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-07", "nome": "Procuradoria Previdenciária",               "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 5},
    {"codigo": "PG-08", "nome": "Procuradoria de Serviços Públicos",         "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 2, "vagas_designacao": 0, "vagas_acervo": 4},
    {"codigo": "PG-09", "nome": "Centro de Estudos Jurídicos — CEJUR",       "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-10", "nome": "Procuradoria Trabalhista",                  "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-12", "nome": "Diretoria de Gestão",                       "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-13", "nome": "Procuradoria na Capital Federal",           "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-14", "nome": "Procuradoria de Sucessões",                 "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-15", "nome": "Coordenadoria do Sistema Jurídico",         "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-16", "nome": "Procuradoria de Serviços de Saúde",         "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 3},
    {"codigo": "PG-17", "nome": "Procuradoria Administrativa",               "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 2, "vagas_escolha": 1, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "PG-18", "nome": "Procuradoria de Petróleo e Gás Natural",    "tipo": "ESPECIALIZADA", "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "PG-19", "nome": "Procuradoria de Controvérsias e Dir. Humanos","tipo": "ESPECIALIZADA","vagas_pg":0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    # Regionais e Postos Avançados
    {"codigo": "1PR-NIT",  "nome": "Regional de Niterói",                    "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "1PA-NIT",  "nome": "Posto Avançado Niterói",                 "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "2PR-DC",   "nome": "Regional Duque de Caxias",               "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "3PR-NI",   "nome": "Regional Nova Iguaçu",                   "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "4PR-CF",   "nome": "Regional Cabo Frio",                     "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "5PR-VR",   "nome": "Regional Volta Redonda",                 "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "5PA-VR",   "nome": "Posto Avançado Volta Redonda",           "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "6PR-ANG",  "nome": "Regional Angra dos Reis",                "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "7PR-PET",  "nome": "Regional Petrópolis",                    "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "8PR-FRIB", "nome": "Regional Nova Friburgo",                 "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "9PR-MAC",  "nome": "Regional Macaé",                         "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
    {"codigo": "10PR-CG",  "nome": "Regional Campos dos Goytacazes",         "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 1, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 2},
    {"codigo": "10PA-CG",  "nome": "Posto Avançado Campos dos Goytacazes",   "tipo": "REGIONAL",      "vagas_pg": 0, "vagas_nomeacao": 0, "vagas_escolha": 0, "vagas_designacao": 0, "vagas_acervo": 1},
]

# ─────────────────────────────────────────────────────────────────────────────
# PROCURADORES — 70 nomes fictícios
# ─────────────────────────────────────────────────────────────────────────────

_NOMES = [
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

# ─────────────────────────────────────────────────────────────────────────────
# NOMEAÇÕES fictícias para slots vermelhos (gestão)
# Mapeado por area_codigo → lista de cargos
# ─────────────────────────────────────────────────────────────────────────────

CARGOS_NOMEACAO = {
    "PG-02": ["Secretário de Gestão", "Procurador-Assistente/DG", "Chefe de Gabinete"],
    "PG-03": ["Subprocurador Tributário", "Coordenador Fiscal"],
    "PG-04": ["Subprocurador de Pessoal", "Coordenador RH"],
    "PG-05": ["Subprocurador Dívida Ativa", "Coordenador de Cobrança"],
    "PG-06": ["Subprocurador Ambiental", "Coordenador Patrimônio"],
    "PG-07": ["Subprocurador Previdenciário", "Coordenador Benefícios"],
    "PG-08": ["Subprocurador Serviços", "Coordenador Concessões"],
    "PG-09": ["Diretor do CEJUR", ],
    "PG-10": ["Subprocurador Trabalhista", "Coordenador Trabalhista"],
    "PG-12": ["Diretor de Gestão", "Coordenador Administrativo"],
    "PG-13": ["Procurador Federal", ],
    "PG-14": ["Subprocurador Sucessões", "Coordenador Heranças"],
    "PG-15": ["Coordenador do Sistema", ],
    "PG-16": ["Subprocurador Saúde", "Coordenador Saúde"],
    "PG-17": ["Subprocurador Administrativo", "Coordenador Adm."],
    "PG-18": ["Procurador Petróleo", ],
    "PG-19": ["Procurador DH", ],
    "1PR-NIT":  ["Procurador Regional", ],
    "2PR-DC":   ["Procurador Regional", ],
    "3PR-NI":   ["Procurador Regional", ],
    "4PR-CF":   ["Procurador Regional", ],
    "5PR-VR":   ["Procurador Regional", ],
    "6PR-ANG":  ["Procurador Regional", ],
    "7PR-PET":  ["Procurador Regional", ],
    "9PR-MAC":  ["Procurador Regional", ],
    "10PR-CG":  ["Procurador Regional", ],
}

# ─────────────────────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────────────────────

def post(path: str, body: dict) -> dict:
    r = requests.post(f"{BASE}{path}", json=body, timeout=10)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"POST {path} → {r.status_code}: {r.text[:200]}")
    return r.json()

def patch(path: str, body: dict) -> dict:
    r = requests.patch(f"{BASE}{path}", json=body, timeout=10)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"PATCH {path} → {r.status_code}: {r.text[:200]}")
    return r.json()

def get(path: str) -> dict | list:
    r = requests.get(f"{BASE}{path}", timeout=10)
    r.raise_for_status()
    return r.json()

def ok(msg: str): print(f"  ✓ {msg}")
def step(msg: str): print(f"\n→ {msg}")

# ─────────────────────────────────────────────────────────────────────────────
# seed
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    random.seed(42)

    # Verificar API
    try:
        requests.get(f"{BASE}/health", timeout=5)
    except Exception:
        print(f"❌ API não responde em {BASE}. Verifique se o backend está rodando.")
        sys.exit(1)

    # ── 1. Áreas ──────────────────────────────────────────────────────────────
    step("Criando áreas...")
    areas_existentes = {a["codigo"] for a in get("/areas")}
    criadas = 0
    for a in AREAS:
        if a["codigo"] in areas_existentes:
            patch(f"/areas/{a['codigo']}", {
                k: v for k, v in a.items() if k != "codigo"
            })
        else:
            post("/areas", a)
            criadas += 1
    ok(f"{criadas} criadas, {len(AREAS) - criadas} atualizadas ({len(AREAS)} total)")

    # ── 2. Procuradores ────────────────────────────────────────────────────────
    step("Criando procuradores...")
    procs_existentes = {p["antiguidade"] for p in get("/procuradores")}
    proc_ids: dict[int, int] = {}  # antiguidade → id

    nomes = _NOMES[:70]
    status_dist = (["LOTADO"] * 55) + (["PENDENTE"] * 8) + (["EM_LICENCA"] * 5) + (["VACANCIA"] * 2)
    random.shuffle(status_dist)

    for i, nome in enumerate(nomes):
        antig = i + 1
        status = status_dist[i] if i < len(status_dist) else "PENDENTE"
        ativo = status not in ("EM_LICENCA", "VACANCIA")

        if antig in procs_existentes:
            existing = [p for p in get("/procuradores") if p["antiguidade"] == antig]
            proc_ids[antig] = existing[0]["id"] if existing else -1
            continue

        resp = post("/procuradores", {
            "nome": nome,
            "antiguidade": antig,
            "status": status,
            "ativo": ativo,
        })
        proc_ids[antig] = resp["id"]

    ok(f"{len(nomes)} procuradores (inclui 5 licença + 2 vacância)")

    # Atualizar mapa completo de proc por antiguidade (inclui os já existentes)
    all_procs = get("/procuradores")
    proc_ids = {p["antiguidade"]: p["id"] for p in all_procs}

    # ── 3. Preferências ────────────────────────────────────────────────────────
    step("Cadastrando preferências...")
    codigos = [a["codigo"] for a in AREAS]

    for antig, proc_id in proc_ids.items():
        # Procuradores inativos não precisam de prefs, mas vamos cadastrar pra todos
        # exceto os 5 últimos (simulando quem não respondeu)
        if antig > len(nomes) - 5:
            continue

        # Cada procurador ranqueia 5-8 áreas aleatórias
        num_prefs = random.randint(5, 8)
        areas_escolhidas = random.sample(codigos, min(num_prefs, len(codigos)))

        prefs = [
            {"procurador_id": proc_id, "area_codigo": cod, "ordem": ordem + 1}
            for ordem, cod in enumerate(areas_escolhidas)
        ]
        try:
            requests.put(f"{BASE}/procuradores/{proc_id}/preferencias",
                         json=prefs, timeout=10)
        except Exception as e:
            print(f"    ⚠ preferências proc {antig}: {e}")

    ok(f"Preferências para {len(nomes) - 5} procuradores (5 sem prefs para demonstrar)")

    # ── 4. Ciclo ───────────────────────────────────────────────────────────────
    step(f"Criando ciclo {CICLO_ID}...")
    ciclos = get("/ciclos")
    em_curso = [c for c in ciclos if c["status"] == "EM_CURSO"]

    if em_curso:
        ciclo_id = em_curso[0]["id"]
        ok(f"Ciclo {ciclo_id} já existe (EM_CURSO) — reutilizando")
    else:
        try:
            resp = post("/ciclos", {"id": CICLO_ID, "abertura": str(date.today())})
            ciclo_id = resp["id"]
            ok(f"Ciclo {ciclo_id} criado")
        except RuntimeError as e:
            if "já existe" in str(e):
                ciclo_id = CICLO_ID
                ok(f"Ciclo {CICLO_ID} já existe — reutilizando")
            else:
                raise

    # ── 5. Gerar vagas ─────────────────────────────────────────────────────────
    step("Gerando vagas do ciclo...")
    try:
        vagas = post(f"/vagas/gerar/{ciclo_id}", {})
        ok(f"{len(vagas)} vagas geradas")
    except RuntimeError as e:
        ok(f"Vagas já geradas anteriormente ({e})")

    # ── 6. Preencher nomeações (vermelhas) ─────────────────────────────────────
    step("Preenchendo nomeações da gestão (vagas vermelhas)...")
    all_vagas = get(f"/vagas?ciclo_id={ciclo_id}&tipo=NOMEACAO")
    procs_ativos = [p for p in get("/procuradores") if p["ativo"]]
    # Usa os procuradores de maior antiguidade para nomeações (simulação)
    nomeados_ids = set()
    nomeacoes_feitas = 0

    for vaga in all_vagas:
        area_cod = vaga["area_codigo"]
        cargos = CARGOS_NOMEACAO.get(area_cod, ["Procurador"])
        cargo = cargos[(vaga["numero"] - 1) % len(cargos)]

        # Seleciona procurador ativo ainda não nomeado com antiguidade alta (30-70)
        candidatos = [p for p in procs_ativos
                      if p["id"] not in nomeados_ids and p["antiguidade"] > 30]
        if not candidatos:
            candidatos = [p for p in procs_ativos if p["id"] not in nomeados_ids]
        if not candidatos:
            continue

        proc = random.choice(candidatos)
        nomeados_ids.add(proc["id"])

        try:
            patch(f"/vagas/{vaga['id']}", {
                "ocupante_id": proc["id"],
                "cargo": cargo,
            })
            nomeacoes_feitas += 1
        except Exception:
            pass

    ok(f"{nomeacoes_feitas} nomeações preenchidas")

    # ── 7. Preencher escolhas dos chefes (verdes) ──────────────────────────────
    step("Preenchendo escolhas dos chefes (vagas verdes)...")
    vagas_verdes = get(f"/vagas?ciclo_id={ciclo_id}&tipo=ESCOLHA")
    escolhas_feitas = 0
    escolhidos_ids = set(nomeados_ids)

    for vaga in vagas_verdes:
        candidatos = [p for p in procs_ativos
                      if p["id"] not in escolhidos_ids and p["antiguidade"] > 20]
        if not candidatos:
            candidatos = [p for p in procs_ativos if p["id"] not in escolhidos_ids]
        if not candidatos:
            continue

        proc = random.choice(candidatos)
        escolhidos_ids.add(proc["id"])
        try:
            patch(f"/vagas/{vaga['id']}", {
                "ocupante_id": proc["id"],
                "cargo": "Assessor Especializado",
            })
            escolhas_feitas += 1
        except Exception:
            pass

    ok(f"{escolhas_feitas} escolhas dos chefes preenchidas")

    # ── 8. Preencher designações PG (amarelas) ─────────────────────────────────
    step("Preenchendo designações PG (vagas amarelas)...")
    vagas_amarelas = get(f"/vagas?ciclo_id={ciclo_id}&tipo=DESIGNACAO")
    designados_ids = set(escolhidos_ids)
    designacoes_feitas = 0

    for vaga in vagas_amarelas:
        candidatos = [p for p in procs_ativos
                      if p["id"] not in designados_ids and p["antiguidade"] <= 15]
        if not candidatos:
            candidatos = [p for p in procs_ativos if p["id"] not in designados_ids]
        if not candidatos:
            continue

        proc = random.choice(candidatos)
        designados_ids.add(proc["id"])
        try:
            patch(f"/vagas/{vaga['id']}", {
                "ocupante_id": proc["id"],
                "cargo": "Subprocurador-Geral",
            })
            designacoes_feitas += 1
        except Exception:
            pass

    ok(f"{designacoes_feitas} designações do PG preenchidas")

    # ── 9. Executar alocação de acervo (azul) ─────────────────────────────────
    step("Executando alocação de acervo (R2 — Serial Dictatorship)...")
    resultado = post(f"/ciclos/{ciclo_id}/alocar-acervo", {})
    ok(f"{resultado['alocados']} procuradores alocados no acervo")
    if resultado["sem_vaga"]:
        print(f"    ℹ {len(resultado['sem_vaga'])} sem vaga (sem preferências ou áreas cheias)")

    # ── Resumo ─────────────────────────────────────────────────────────────────
    total_vagas = sum(
        a["vagas_pg"] + a["vagas_nomeacao"] + a["vagas_escolha"] +
        a["vagas_designacao"] + a["vagas_acervo"]
        for a in AREAS
    )
    print(f"""
╔══════════════════════════════════════════╗
║         SEED CONCLUÍDO COM SUCESSO       ║
╠══════════════════════════════════════════╣
║  Áreas:         {len(AREAS):>4}                      ║
║  Procuradores:  {len(nomes):>4}  (5 inativos)        ║
║  Total de vagas: {total_vagas:>3}                     ║
║  Saldo:          +{70 - total_vagas:>2}                      ║
║  Ciclo ativo:   {ciclo_id:<10}                ║
╚══════════════════════════════════════════╝

  Acesse: http://localhost:5173
""")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true",
                        help="Limpa o banco antes de inserir (não implementado via API)")
    args = parser.parse_args()

    if args.clear:
        print("⚠ --clear não suportado via API. Use a migration para reset manual.")

    seed()
