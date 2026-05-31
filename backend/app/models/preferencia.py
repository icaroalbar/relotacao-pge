from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Preferencia(Base):
    __tablename__ = "preferencias"

    procurador_id = Column(Integer, ForeignKey("procuradores.id"), primary_key=True)
    area_codigo = Column(String, ForeignKey("areas.codigo"), primary_key=True)
    ordem = Column(Integer, nullable=False)  # 1 = mais querida

    procurador = relationship("Procurador", back_populates="preferencias")
    area = relationship("Area", back_populates="preferencias")
