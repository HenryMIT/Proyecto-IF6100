from pydantic import BaseModel
from typing import Optional

class FacturaProductoBase(BaseModel):
    id_factura: int
    id_producto: int
    cantidad: int

class FacturaProductoCreate(FacturaProductoBase):
    pass    

class FacturaProductoResponse(BaseModel):
    id_factura_producto: int
    id_factura: int
    id_producto: int
    cantidad: int
    subtotal: float

    class Config:
        from_attributes = True

class FacturaProductoUpdate(BaseModel):
    cantidad: int

class FacturaProductoDelete(BaseModel):
    id_factura_producto: int
    
