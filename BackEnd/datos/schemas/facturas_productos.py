from pydantic import BaseModel
from typing import Optional

class FacturaProductoBase(BaseModel):
    id_factura: int
    id_producto: int
    cantidad: int
    subtotal: float
    
class FacturaProductoCreate(FacturaProductoBase):
    pass    

class FacturaProductoResponse(FacturaProductoBase):
    id_facturas_productos: int
    
    class Config:
        from_attributes = True
        
class FacturaProductoUpdate(BaseModel):
    cantidad: Optional[int] = None
    subtotal: Optional[float] = None
    
class FacturaProductoDelete(BaseModel):
    id_facturas_productos: int
    
