# schemas/cliente.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ---------- Esquema base ----------
class ClienteBase(BaseModel):   
    pass

# ---------- Esquema para crear ----------
class ClienteCreate(ClienteBase):
    """Esquema para crear un nuevo cliente"""
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    correo: EmailStr
    telefono: str
    direccion: str
    clave: str
    
# ---------- Esquema para actualizar ----------
class ClienteUpdate(ClienteBase):
    """Esquema para actualizar cliente"""    
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    

# ---------- Esquema para respuesta ----------
class ClienteResponse(ClienteBase):
    """Esquema para respuesta de cliente"""
    id: int
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    correo: EmailStr
    telefono: str
    direccion: str


    class Config:
        from_attributes = True # Habilita la compatibilidad con ORM
