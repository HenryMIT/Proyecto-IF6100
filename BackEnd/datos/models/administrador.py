# models/administrador.py
from sqlalchemy import Column, Integer, String
from databases import Base

class Administrador(Base):
    __tablename__ = "administradores"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(25))
    primer_apellido = Column(String(25), nullable=False)
    segundo_apellido = Column(String(25), nullable=False)
    correo = Column(String(255), nullable=False, unique=True)
    telefono = Column(String(8), nullable=False)