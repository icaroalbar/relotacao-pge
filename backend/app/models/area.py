from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Area(Base):
    __tablename__ = "areas"

    codigo = Column(String, primary_key=True)  # "PG-04", "1PR-NIT"
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # ESPECIALIZADA | REGIONAL | GABINETE
    vagas_pg = Column(Integer, default=0, nullable=False)
    vagas_nomeacao = Column(Integer, default=0, nullable=False)
    vagas_escolha = Column(Integer, default=0, nullable=False)
    vagas_designacao = Column(Integer, default=0, nullable=False)
    vagas_acervo = Column(Integer, default=0, nullable=False)
    rotulos_nomeacao = Column(JSONB)
    rotulos_designacao = Column(JSONB)

    procuradores = relationship("Procurador", back_populates="lotacao_atual", foreign_keys="Procurador.lotacao_atual_codigo")
    vagas = relationship("Vaga", back_populates="area")
    preferencias = relationship("Preferencia", back_populates="area")
    lotacoes = relationship("Lotacao", back_populates="area")

    @property
    def total_vagas(self) -> int:
        return (
            self.vagas_pg
            + self.vagas_nomeacao
            + self.vagas_escolha
            + self.vagas_designacao
            + self.vagas_acervo
        )
