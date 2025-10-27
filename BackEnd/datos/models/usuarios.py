from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from databases import Base

class Usuario(Base):
    __tablename__ = "Usuarios"
    id = Column(Integer, primary_key=True, index=True)
    idusuario = Column(String(50), unique=True, index=True, nullable=False)
    rol = Column(String(20), nullable=True)
    correo = Column(String(100), unique=True, index=True, nullable=False)
    clave = Column(String(255), nullable=True)
    ultimo_acceso = Column(DateTime, default=func.now(), onupdate=func.now())
    tkRef = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<Usuario(idusuario={self.idusuario}, correo={self.correo}, rol={self.rol})>"