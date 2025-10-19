from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ContactoBase(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    mensaje: str
    tipo: int

class ContactoCreate(ContactoBase):
    """Esquema para crear un nuevo contacto"""
    pass

class ContactoResponse(ContactoBase):
    """Esquema para respuesta de contacto"""
    id_Mensaje: int
    fecha: datetime
    estado: bool
    
    class Config:
        from_attributes = True

class ContactoUpdate(BaseModel):
    """Esquema para actualizar contacto"""
    estado: Optional[bool] = None
    tipo: Optional[int] = None