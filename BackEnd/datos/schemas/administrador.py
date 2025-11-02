# schemas/administrador.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# ---------- Esquema base ----------
class AdministradorBase(BaseModel):   
    pass

# ---------- Esquema para crear ----------
class AdministradorCreate(AdministradorBase):
    """Esquema para crear un nuevo administrador"""
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    correo: EmailStr
    telefono: str
    clave: str
    
# ---------- Esquema para actualizar ----------
class AdministradorUpdate(AdministradorBase):
    """Esquema para actualizar administrador"""    
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    

# ---------- Esquema para respuesta ----------
class AdministradorResponse(AdministradorBase):
    """Esquema para respuesta de administrador"""
    id: int
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    correo: EmailStr
    telefono: str

    class Config:
        from_attributes = True # Habilita la compatibilidad con ORM