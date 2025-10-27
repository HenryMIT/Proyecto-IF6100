from pydantic import BaseModel
from typing import Optional

class ProductoBase(BaseModel):
    id_Categoria: int
    descripcion: str
    cantidad: int
    descuento: Optional[float] = 0
    precio: float
    imagen_producto: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_Producto: int
    class Config:
        from_attributes = True

class ProductoUpdate(BaseModel):
    descripcion: Optional[str] = None
    cantidad: Optional[int] = None
    descuento: Optional[float] = None
    precio: Optional[float] = None
    imagen_producto: Optional[str] = None
