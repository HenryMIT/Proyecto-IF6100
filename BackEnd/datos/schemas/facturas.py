from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FacturaBase(BaseModel):
    id_usuario: int
    fecha: datetime
    comentario: Optional[str] = None
    estado: Optional[str] = "NO ENTREGADO"
    total: float
    
class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    comentario: Optional[str] = None
    estado: Optional[str] = None
    total: Optional[float] = None
    
class FacturaDelete(BaseModel):
    id_Factura: int
    
class FacturaResponse(FacturaBase):
        id_Factura: int
        
        class Config:
            from_attributes = True