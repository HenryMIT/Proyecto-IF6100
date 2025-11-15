from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.contactos import ContactoCreate
from typing import List

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/")
def crear_usuario(usuario: ContactoCreate, db: Session = Depends(get_db)):
    """Crear usuario usando función nuevoContacto()"""
    sql = """
        SELECT nuevoUsuario(
            :nombre, :apellido, :correo, :mensaje, :tipo
        ) AS id_mensaje
    """
    result = db.execute(        
    )
    id_nuevo = result.fetchone().id_mensaje
    db.commit()
    return {"id": id_nuevo, "mensaje": "Usuario creado exitosamente"}
