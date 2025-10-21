# models/clientes.py
from sqlalchemy import Column, Integer, String, Text
from databases import Base

class Cliente(Base):
    __tablename__ = "Clientes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, nullable=True)
    nombre = Column(String(25), nullable=False)
    primer_apellido = Column(String(25), nullable=False)
    segundo_apellido = Column(String(25), nullable=False)
    correo = Column(String(255), nullable=False, unique=True)
    telefono = Column(String(8), nullable=False)
    direccion = Column(Text, nullable=False)
    
    def __repr__(self):
        return (
            f"<Cliente(id={self.id}, nombre='{self.nombre}', "
            f"correo='{self.correo}', telefono='{self.telefono}')>"
        )
