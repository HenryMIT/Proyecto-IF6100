from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..databases import get_db
from ..schemas.contactos import ContactoCreate, ContactoResponse, ContactoUpdate
from typing import List

router = APIRouter(prefix="/contactos", tags=["contactos"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_contacto(contacto: ContactoCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo contacto usando procedimiento almacenado nuevoContacto()
    """
    try:
        # Llamar al procedimiento almacenado
        result = db.execute(
            text("SELECT nuevoContacto(:nombre, :apellido, :correo, :mensaje, :tipo) as id_contacto"),
            {
                "nombre": contacto.nombre,
                "apellido": contacto.apellido, 
                "correo": contacto.correo,
                "mensaje": contacto.mensaje,
                "tipo": contacto.tipo
            }
        )
        
        # Obtener el ID del contacto creado
        row = result.fetchone()
        if row and row.id_contacto:
            db.commit()
            return {
                "mensaje": "Contacto creado exitosamente",
                "id_contacto": row.id_contacto,
                "datos": contacto.dict()
            }
        else:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el contacto"
            )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.delete("/{id_contacto}", response_model=dict)
def eliminar_contacto(id_contacto: int, db: Session = Depends(get_db)):
    """
    Eliminar un contacto usando procedimiento almacenado eliminarContacto()
    """
    try:
        # Llamar al procedimiento almacenado
        result = db.execute(
            text("SELECT eliminarContacto(:id_mensaje) as eliminado"),
            {"id_mensaje": id_contacto}
        )
        
        row = result.fetchone()
        if row and row.eliminado == 1:
            db.commit()
            return {
                "mensaje": "Contacto eliminado exitosamente",
                "id_contacto": id_contacto
            }
        elif row and row.eliminado == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contacto con ID {id_contacto} no encontrado"
            )
        else:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar el contacto"
            )
            
    except HTTPException:
        # Re-lanzar excepciones HTTP
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/buscar/correo/{filtro_correo}", response_model=List[dict])
def buscar_contactos_por_correo(filtro_correo: str, db: Session = Depends(get_db)):
    """
    Buscar contactos por correo usando procedimiento almacenado buscarContactosPorCorreo()
    """
    try:
        # Llamar al procedimiento almacenado
        result = db.execute(
            text("CALL buscarContactosPorCorreo(:filtro_correo)"),
            {"filtro_correo": filtro_correo}
        )
        
        # Obtener los resultados
        contactos = []
        for row in result.fetchall():
            contactos.append({
                "id_Mensaje": row.id_Mensaje,
                "nombre": row.nombre,
                "apellido": row.apellido,
                "correo": row.correo,
                "mensaje": row.mensaje,
                "fecha": row.fecha,
                "estado": row.estado,
                "tipo": row.tipo
            })
        
        return contactos
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al buscar contactos: {str(e)}"
        )

@router.get("/listar", response_model=List[dict])
def listar_contactos(limite: int = 0, offset: int = 0, db: Session = Depends(get_db)):
    """
    Listar contactos usando procedimiento almacenado listarContactos()
    """
    try:
        # Llamar al procedimiento almacenado
        result = db.execute(
            text("CALL listarContactos(:limite, :offset)"),
            {"limite": limite, "offset": offset}
        )
        
        # Obtener los resultados
        contactos = []
        for row in result.fetchall():
            contactos.append({
                "id_Mensaje": row.id_Mensaje,
                "nombre": row.nombre,
                "apellido": row.apellido,
                "correo": row.correo,
                "mensaje": row.mensaje,
                "fecha": row.fecha,
                "estado": row.estado,
                "tipo": row.tipo
            })
        
        return contactos
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar contactos: {str(e)}"
        )