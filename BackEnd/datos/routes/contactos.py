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
        text("SELECT nuevoContacto(:nombre, :apellido, :correo, :mensaje, :tipo) as id_mensaje"),
        contacto.dict()
    )
    id_nuevo = result.fetchone().id_mensaje
    db.commit()
    return {"id": id_nuevo, "mensaje": "Contacto creado exitosamente"}

@router.post("/completo")
def crear_contacto_completo(contacto: ContactoCreate, db: Session = Depends(get_db)):
    """Crear contacto usando función nuevoContactoCompleto() con estado TRUE por defecto"""
    params = contacto.dict()
    params['estado'] = False  # Estado quemado como False por defecto
    
    result = db.execute(
        text("SELECT nuevoContactoCompleto(:nombre, :apellido, :correo, :mensaje, :estado, :tipo) as id_mensaje"),
        params
    )
    id_nuevo = result.fetchone().id_mensaje
    db.commit()
    return {"id": id_nuevo, "mensaje": "Contacto completo creado exitosamente", "estado": True}

@router.get("/listar")
def listar_contactos(limite: int = 0, offset: int = 0, db: Session = Depends(get_db)):
    """Listar contactos usando procedimiento listarContactos()"""
    result = db.execute(
        text("CALL listarContactos(:limite, :offset)"),
        {"limite": limite, "offset": offset}
    )
    return [dict(row._mapping) for row in result.fetchall()]

@router.get("/estado/{estado}")
def buscar_contactos_por_estado(estado: bool, db: Session = Depends(get_db)):
    """Buscar contactos por estado usando procedimiento buscarContactosPorEstado()"""
    result = db.execute(
        text("CALL buscarContactosPorEstado(:estado)"),
        {"estado": estado}
    )
    contactos = [dict(row._mapping) for row in result.fetchall()]
    
    estado_texto = "revisados" if estado else "no revisados"
    return {
        "estado_filtrado": estado,
        "descripcion": f"Contactos {estado_texto}",
        "total_encontrados": len(contactos),
        "contactos": contactos
    }

@router.get("/buscar/correo")
def buscar_contactos_por_correo(filtro_correo: str, db: Session = Depends(get_db)):
    """Buscar contactos por correo usando procedimiento buscarContactosPorCorreo()"""
    result = db.execute(
        text("CALL buscarContactosPorCorreo(:filtro_correo)"),
        {"filtro_correo": filtro_correo}
    )
    contactos = [dict(row._mapping) for row in result.fetchall()]
    
    return {
        "filtro_aplicado": filtro_correo,
        "descripcion": f"Contactos que contienen '{filtro_correo}' en el correo",
        "total_encontrados": len(contactos),
        "contactos": contactos
    }

@router.get("/{id_mensaje}")
def obtener_contacto_por_id(id_mensaje: int, db: Session = Depends(get_db)):
    """Obtener un contacto específico por ID"""
    result = db.execute(
        text("SELECT * FROM Contactos WHERE id_Mensaje = :id_mensaje"),
        {"id_mensaje": id_mensaje}
    )
    contacto = result.fetchone()
    
    if not contacto:
        raise HTTPException(
            status_code=404,
            detail=f"Contacto con ID {id_mensaje} no encontrado"
        )
    
    return dict(contacto._mapping)

@router.put("/{id_mensaje}/estado")
def actualizar_estado_contacto(id_mensaje: int, estado: bool, db: Session = Depends(get_db)):
    """Actualizar estado de contacto usando función actualizarEstadoContacto()"""
    result = db.execute(
        text("SELECT actualizarEstadoContacto(:id_mensaje, :estado) as contactos_actualizados"),
        {"id_mensaje": id_mensaje, "estado": estado}
    )
    contactos_actualizados = result.fetchone().contactos_actualizados
    db.commit()
    
    if contactos_actualizados == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Contacto con ID {id_mensaje} no encontrado"
        )
    
    estado_texto = "revisado" if estado else "no revisado"
    return {
        "id": id_mensaje,
        "nuevo_estado": estado,
        "mensaje": f"Contacto marcado como {estado_texto}",
        "contactos_actualizados": contactos_actualizados
    }

@router.delete("/{id_mensaje}")
def eliminar_contacto(id_mensaje: int, db: Session = Depends(get_db)):
    """Eliminar contacto usando función eliminarContacto()"""
    result = db.execute(
        text("SELECT eliminarContacto(:id_mensaje) as contactos_eliminados"),
        {"id_mensaje": id_mensaje}
    )
    contactos_eliminados = result.fetchone().contactos_eliminados
    db.commit()
    
    if contactos_eliminados == 0:
        raise HTTPException(
            status_code=404, 
            detail=f"Contacto con ID {id_mensaje} no encontrado"
        )
    
    return {
        "id": id_mensaje,
        "mensaje": "Contacto eliminado exitosamente",
        "contactos_eliminados": contactos_eliminados
    }
