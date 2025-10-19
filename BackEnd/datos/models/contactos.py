from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from databases import Base

class Contacto(Base):
    __tablename__ = "Contactos"
    
    id_Mensaje = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    correo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    fecha = Column(DateTime, default=func.current_timestamp())
    estado = Column(Boolean, default=False)
    tipo = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<Contacto(id={self.id_Mensaje}, nombre='{self.nombre}', correo='{self.correo}')>"