from sqlalchemy import Column, String, Date, Integer, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Ciclo(Base):
    __tablename__ = "ciclos"

    id = Column(String, primary_key=True)  # "2026.1"
    abertura = Column(Date, nullable=False)
    encerramento = Column(Date)
    status = Column(String, nullable=False, default="EM_CURSO")  # EM_CURSO | ENCERRADO | CANCELADO
    snapshot = Column(JSONB)  # Vaga[] congelado ao encerrar
    total_procuradores = Column(Integer)
    total_vagas = Column(Integer)
    movimentacoes = Column(Integer)
    permanencias = Column(Integer)
    pct_primeira_pref = Column(Float)

    vagas = relationship("Vaga", back_populates="ciclo")
    lotacoes = relationship("Lotacao", back_populates="ciclo")
