# routes/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.clientes import ClienteCreate, ClienteUpdate  # ClienteResponse opcional si tus SP devuelven esas columnas
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/clientes", tags=["clientes"])

# ------------- Helper para mapear filas -------------
def rows_to_dicts(result) -> List[dict]:
    return [dict(r._mapping) for r in result.fetchall()]

def row_to_dict(row) -> dict:
    return dict(row._mapping)

# ------------- Crear (usa función almacenada) -------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_cliente(payload: ClienteCreate, db: Session = Depends(get_db)):
    """
    Crear cliente usando función SQL: nuevoCliente(...)
    Debe devolver el ID del nuevo cliente como 'id_cliente'.
    """
    try:
        # Si usas Pydantic v2, model_dump(); si v1, usa dict()
        params = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()

        # Ajusta el orden/nombres según tu función:
        # ejemplo de firma esperada:
        # nuevoCliente(IN p_nombre, IN p_primer_apellido, IN p_segundo_apellido,
        #              IN p_correo, IN p_telefono, IN p_direccion) RETURNS PK
        stmt = text("""
            SELECT nuevoCliente(
                :nombre, :primer_apellido, :segundo_apellido,
                :correo, :telefono, :direccion
            ) AS id_cliente
        """)

        result = db.execute(stmt, params)
        new_id = result.fetchone().id_cliente
        db.commit()
        return {"id": new_id, "mensaje": "Cliente creado exitosamente"}

    except IntegrityError:
        db.rollback()
        # Ej. UNIQUE(correo)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado para otro cliente."
        )

# ------------- Listar (usa procedimiento almacenado) -------------
@router.get("/listar")
def listar_clientes(
    limite: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Listar clientes usando: CALL listarClientes(:limite, :offset)
    Si limite=0 retorna todos (ajústalo en el SP).
    """
    result = db.execute(
        text("CALL listarClientes(:limite, :offset)"),
        {"limite": limite, "offset": offset}
    )
    return rows_to_dicts(result)

# ------------- Obtener detalle (usa procedimiento almacenado) -------------
@router.get("/{id}")
def obtener_cliente(id: int, db: Session = Depends(get_db)):
    """
    Detalle de cliente: CALL obtenerCliente(:id)
    Debe retornar exactamente una fila para el ID solicitado.
    """
    result = db.execute(text("CALL obtenerCliente(:id)"), {"id": id}).fetchone()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return row_to_dict(result)

# ------------- Actualizar (usa procedimiento almacenado) -------------
@router.put("/{id}")
def actualizar_cliente(id: int, payload: ClienteUpdate, db: Session = Depends(get_db)):
    """
    Actualizar cliente usando: CALL actualizarCliente(...)
    Sugerencia de firma en el SP para updates parciales:
      actualizarCliente(
        IN p_id INT,
        IN p_nombre VARCHAR(25) NULL,
        IN p_primer_apellido VARCHAR(25) NULL,
        IN p_segundo_apellido VARCHAR(25) NULL,
        IN p_correo VARCHAR(255) NULL,
        IN p_telefono VARCHAR(8) NULL,
        IN p_direccion TEXT NULL
      )
    y dentro usar COALESCE(p_campo, campo_actual).
    """
    # Armamos parámetros, pasando None para no cambiar ese campo
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

    params = {
        "id": id,
        "nombre": data.get("nombre"),
        "primer_apellido": data.get("primer_apellido"),
        "segundo_apellido": data.get("segundo_apellido"),
        "correo": data.get("correo"),
        "telefono": data.get("telefono"),
        "direccion": data.get("direccion"),
    }

    try:
        db.execute(
            text("""
                CALL actualizarCliente(
                    :id, :nombre, :primer_apellido, :segundo_apellido,
                    :correo, :telefono, :direccion
                )
            """),
            params
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado para otro cliente."
        )

    # Volver a leer el registro actualizado
    updated = db.execute(text("CALL obtenerCliente(:id)"), {"id": id}).fetchone()
    if not updated:
        # Si el SP pudiera desactivar/eliminar, maneja el 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return row_to_dict(updated)

# ------------- Eliminar (usa procedimiento almacenado) -------------
@router.delete("/{id}", status_code=status.HTTP_200_OK)
def eliminar_cliente(id: int, db: Session = Depends(get_db)):
    """
    Eliminar cliente por id usando: CALL eliminarCliente(:id)
    Implementa hard/soft delete dentro del SP según tu política.
    """
    # (Opcional) Verificar existencia primero:
    found = db.execute(text("CALL obtenerCliente(:id)"), {"id": id}).fetchone()
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    db.execute(text("CALL eliminarCliente(:id)"), {"id": id})
    db.commit()
    return {"id": id, "mensaje": "Cliente eliminado exitosamente"}

