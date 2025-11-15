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

class ProductoResponse(BaseModel):
    id_Producto: int
    id_Categoria: int
    descripcion: str
    cantidad: int
    descuento: Optional[float] = 0
    precio: float
    imagen_producto: Optional[str] = None    
    class Config:
        from_attributes = True

class ProductoUpdate(BaseModel):
    id_Categoria: Optional[int] = None
    descripcion: Optional[str] = None
    cantidad: Optional[int] = None
    descuento: Optional[float] = None
    precio: Optional[float] = None
    imagen_producto: Optional[str] = None
