SHELL  := /bin/bash
VENV   := backend/.venv
PY     := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest
# Caminho absoluto para usar após "cd backend"
ABS_PY := $(abspath $(VENV))/bin/python

DB_URL := postgresql://relotacao:relotacao@localhost:5432/relotacao

.PHONY: help setup setup-backend setup-frontend \
        dev dev-backend dev-frontend dev-db \
        migrate migrate-down test build clean

# ── default ──────────────────────────────────────────────────────────────────

help:
	@printf "\n\033[1mRelotação PGE-RJ\033[0m\n\n"
	@printf "  \033[36mmake setup\033[0m          Instala deps backend + frontend\n"
	@printf "  \033[36mmake dev\033[0m            Sobe tudo via Docker (DB + backend + frontend)\n"
	@printf "  \033[36mmake dev-db\033[0m         Sobe só o banco (PostgreSQL :5432)\n"
	@printf "  \033[36mmake dev-backend\033[0m    DB + uvicorn local com hot reload (:8000)\n"
	@printf "  \033[36mmake dev-frontend\033[0m   Vite dev server (:5173)\n"
	@printf "  \033[36mmake migrate\033[0m        Aplica migrations Alembic\n"
	@printf "  \033[36mmake test\033[0m           pytest\n"
	@printf "  \033[36mmake build\033[0m          Build produção do frontend\n"
	@printf "  \033[36mmake clean\033[0m          Remove .venv e node_modules\n\n"

# ── setup ─────────────────────────────────────────────────────────────────────

setup: setup-backend setup-frontend

setup-backend:
	@echo "→ Criando virtualenv..."
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip --quiet
	$(PIP) install -r backend/requirements.txt --quiet
	@echo "✓ Backend pronto"

setup-frontend:
	@echo "→ Instalando dependências Node..."
	cd frontend && npm install --silent
	@echo "✓ Frontend pronto"

# ── dev ──────────────────────────────────────────────────────────────────────

dev:
	docker compose --profile app up --build

dev-db:
	docker compose up db

dev-backend:
	@$(MAKE) -s dev-db &
	@echo "→ Aguardando PostgreSQL..."
	@until docker compose exec db pg_isready -U relotacao -q 2>/dev/null; do sleep 1; done
	@echo "→ Aplicando migrations..."
	cd backend && DATABASE_URL=$(DB_URL) $(ABS_PY) -m alembic upgrade head
	@echo "→ Iniciando uvicorn..."
	cd backend && DATABASE_URL=$(DB_URL) $(ABS_PY) -m uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# ── migrate ───────────────────────────────────────────────────────────────────

migrate:
	cd backend && DATABASE_URL=$(DB_URL) $(ABS_PY) -m alembic upgrade head

migrate-down:
	cd backend && DATABASE_URL=$(DB_URL) $(ABS_PY) -m alembic downgrade -1

# ── test ─────────────────────────────────────────────────────────────────────

test:
	cd backend && $(ABS_PY) -m pytest tests/ -v

# ── build ────────────────────────────────────────────────────────────────────

build:
	cd frontend && npm run build

# ── clean ────────────────────────────────────────────────────────────────────

clean:
	rm -rf $(VENV) frontend/node_modules frontend/dist
	@echo "✓ Limpo"
