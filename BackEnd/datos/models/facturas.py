from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from databases import Base

class Factura(Base):
    __tablename__ = "Facturas"
    
    id_Factura = Column(Integer, primary_key=True, autoincrement=True)
    id_usario = Column(Integer, ForeignKey("Usuarios.id_Usuario"), nullable=False)
    fecha = Column(String(50), default=func.now(), nullable=False)
    comentario = Column(String(255), nullable=True)
    estado = Column(String(50), nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    
    def __repr__(self):
        return (
            f"<Factura(id_Factura={self.id_Factura}, id_usario={self.id_usario}, "
            f"fecha='{self.fecha}', estado='{self.estado}', total={self.total})>"
        )