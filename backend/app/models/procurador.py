from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Procurador(Base):
    __tablename__ = "procuradores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    antiguidade = Column(Integer, unique=True, nullable=False)  # 1 = mais antigo
    status = Column(String, nullable=False, default="PENDENTE")  # LOTADO | PENDENTE | EM_LICENCA | VACANCIA
    lotacao_atual_codigo = Column(String, ForeignKey("areas.codigo"))
    ativo = Column(Boolean, nullable=False, default=True)

    lotacao_atual = relationship("Area", back_populates="procuradores", foreign_keys=[lotacao_atual_codigo])
    preferencias = relationship("Preferencia", back_populates="procurador", order_by="Preferencia.ordem")
    historico = relationship("Lotacao", back_populates="procurador")
    vagas_ocupadas = relationship("Vaga", back_populates="ocupante")
