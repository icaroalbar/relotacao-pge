from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Lotacao(Base):
    __tablename__ = "lotacoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    procurador_id = Column(Integer, ForeignKey("procuradores.id"), nullable=False)
    area_codigo = Column(String, ForeignKey("areas.codigo"), nullable=False)
    data_entrada = Column(Date, nullable=False)
    data_saida = Column(Date)
    motivo = Column(String, nullable=False)
    # POSSE_INICIAL | NOMEACAO | ESCOLHA_CHEFE | DESIGNACAO_PG | ACERVO | PERMANENCIA | SUBSTITUICAO_MANUAL
    ciclo_id = Column(String, ForeignKey("ciclos.id"), nullable=False)

    procurador = relationship("Procurador", back_populates="historico")
    area = relationship("Area", back_populates="lotacoes")
    ciclo = relationship("Ciclo", back_populates="lotacoes")
