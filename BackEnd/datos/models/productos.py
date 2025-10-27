from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from databases import Base

class Producto(Base):
    __tablename__ = "Productos"
    
    id_Producto = Column(Integer, primary_key=True, autoincrement=True)
    id_Categoria = Column(Integer, ForeignKey("Categoria_productos.id_Categoria"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False)
    descuento = Column(DECIMAL(10,2))
    precio = Column(DECIMAL(10,2), nullable=False)
    imagen_producto = Column(String(200))
    
    def __repr__(self):
        return f"<Producto(id={self.id_Producto}, nombre='{self.nombre}', precio={self.precio})>"