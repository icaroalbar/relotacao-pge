from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Vaga(Base):
    __tablename__ = "vagas"
    __table_args__ = (UniqueConstraint("area_codigo", "numero", "tipo"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    area_codigo = Column(String, ForeignKey("areas.codigo"), nullable=False)
    numero = Column(Integer, nullable=False)
    tipo = Column(String, nullable=False)  # PG | NOMEACAO | ESCOLHA | DESIGNACAO | ACERVO
    cargo = Column(String)
    ocupante_id = Column(Integer, ForeignKey("procuradores.id"))
    origem = Column(String, nullable=False, default="AUTOMATICA")  # AUTOMATICA | MANUAL
    ciclo_id = Column(String, ForeignKey("ciclos.id"))

    area = relationship("Area", back_populates="vagas")
    ocupante = relationship("Procurador", back_populates="vagas_ocupadas")
    ciclo = relationship("Ciclo", back_populates="vagas")
