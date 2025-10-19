from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.contactos import ContactoCreate
from typing import List

router = APIRouter(prefix="/contactos", tags=["contactos"])

@router.post("/")
def crear_contacto(contacto: ContactoCreate, db: Session = Depends(get_db)):
    """Crear contacto usando función nuevoContacto()"""
    result = db.execute(
        text("SELECT nuevoContacto(:nombre, :apellido, :correo, :mensaje, :tipo) as id_contacto"),
        contacto.dict()
    )
    id_nuevo = result.fetchone().id_contacto
    db.commit()
    return {"id": id_nuevo, "mensaje": "Contacto creado exitosamente"}




@router.get("/listar")
def listar_contactos(limite: int = 0, offset: int = 0, db: Session = Depends(get_db)):
    """Listar contactos usando procedimiento listarContactos()"""
    result = db.execute(
        text("CALL listarContactos(:limite, :offset)"),
        {"limite": limite, "offset": offset}
    )
    return [dict(row._mapping) for row in result.fetchall()]
