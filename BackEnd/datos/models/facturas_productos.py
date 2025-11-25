from sqlalchemy import Column, Integer, DECIMAL, ForeignKey
from databases import Base

class facturas_productos(Base):
    __tablename__ = "Factura_Productos"
    
    id_factura_producto = Column(Integer, primary_key=True, autoincrement=True)
    id_factura = Column(Integer, ForeignKey("Facturas.id_Factura"), nullable=False)
    id_producto = Column(Integer, ForeignKey("Productos.id_Producto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    
    def __repr__(self):
        return (
            f"<facturas_productos(id_factura_producto={self.id_factura_producto}, "
            f"id_factura={self.id_factura}, id_producto={self.id_producto}, "
            f"cantidad={self.cantidad}, subtotal={self.subtotal})>"
        )