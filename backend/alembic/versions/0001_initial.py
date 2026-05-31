"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── ciclos ────────────────────────────────────────────────────────────────
    op.create_table(
        "ciclos",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("abertura", sa.Date(), nullable=False),
        sa.Column("encerramento", sa.Date()),
        sa.Column("status", sa.String(), nullable=False, server_default="EM_CURSO"),
        sa.Column("snapshot", postgresql.JSONB()),
        sa.Column("total_procuradores", sa.Integer()),
        sa.Column("total_vagas", sa.Integer()),
        sa.Column("movimentacoes", sa.Integer()),
        sa.Column("permanencias", sa.Integer()),
        sa.Column("pct_primeira_pref", sa.Float()),
    )

    # ── areas ─────────────────────────────────────────────────────────────────
    op.create_table(
        "areas",
        sa.Column("codigo", sa.String(), primary_key=True),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("vagas_pg", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("vagas_nomeacao", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("vagas_escolha", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("vagas_designacao", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("vagas_acervo", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rotulos_nomeacao", postgresql.JSONB()),
        sa.Column("rotulos_designacao", postgresql.JSONB()),
    )

    # ── procuradores ──────────────────────────────────────────────────────────
    op.create_table(
        "procuradores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("antiguidade", sa.Integer(), unique=True, nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="PENDENTE"),
        sa.Column("lotacao_atual_codigo", sa.String(), sa.ForeignKey("areas.codigo")),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_procuradores_antiguidade", "procuradores", ["antiguidade"])

    # ── vagas ─────────────────────────────────────────────────────────────────
    op.create_table(
        "vagas",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("area_codigo", sa.String(), sa.ForeignKey("areas.codigo"), nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("cargo", sa.String()),
        sa.Column("ocupante_id", sa.Integer(), sa.ForeignKey("procuradores.id")),
        sa.Column("origem", sa.String(), nullable=False, server_default="AUTOMATICA"),
        sa.Column("ciclo_id", sa.String(), sa.ForeignKey("ciclos.id")),
        sa.UniqueConstraint("area_codigo", "numero", "tipo", name="uq_vaga_area_num_tipo"),
    )
    op.create_index("ix_vagas_ciclo_tipo", "vagas", ["ciclo_id", "tipo"])

    # ── preferencias ──────────────────────────────────────────────────────────
    op.create_table(
        "preferencias",
        sa.Column("procurador_id", sa.Integer(), sa.ForeignKey("procuradores.id"), primary_key=True),
        sa.Column("area_codigo", sa.String(), sa.ForeignKey("areas.codigo"), primary_key=True),
        sa.Column("ordem", sa.Integer(), nullable=False),
    )

    # ── lotacoes ──────────────────────────────────────────────────────────────
    op.create_table(
        "lotacoes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("procurador_id", sa.Integer(), sa.ForeignKey("procuradores.id"), nullable=False),
        sa.Column("area_codigo", sa.String(), sa.ForeignKey("areas.codigo"), nullable=False),
        sa.Column("data_entrada", sa.Date(), nullable=False),
        sa.Column("data_saida", sa.Date()),
        sa.Column("motivo", sa.String(), nullable=False),
        sa.Column("ciclo_id", sa.String(), sa.ForeignKey("ciclos.id"), nullable=False),
    )
    op.create_index("ix_lotacoes_procurador", "lotacoes", ["procurador_id"])
    op.create_index("ix_lotacoes_ciclo", "lotacoes", ["ciclo_id"])


def downgrade() -> None:
    op.drop_table("lotacoes")
    op.drop_table("preferencias")
    op.drop_table("vagas")
    op.drop_table("procuradores")
    op.drop_table("areas")
    op.drop_table("ciclos")
