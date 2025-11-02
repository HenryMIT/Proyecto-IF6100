from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UsuarioBase(BaseModel):
    pass
    
class UsuarioCreate(UsuarioBase):
    nombre: str
    apellido1: str
    apellido2: str
    correo: EmailStr
    telefono: str
    direccion: str
    clave: str
    
class UsuarioRead(UsuarioBase):
    id: int
    idusuario: int
    nombre: str
    apellido1: str
    apellido2: str
    rol: str
    correo: EmailStr
    tkr: Optional[str]

class UsuarioRecuperar(BaseModel):
    correo: EmailStr

class UsuarioValidar(BaseModel):
    correo: EmailStr
    codigo: int

class UsuarioCambiarClave(BaseModel):    
    correo: EmailStr
    codigo: int        
    nueva_clave: str
    
class UsuarioDelete(BaseModel):
    id: int
    