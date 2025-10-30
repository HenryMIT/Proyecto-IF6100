# routes/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse  # ClienteResponse opcional si tus SP devuelven esas columnas
from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import SQLAlchemyError

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.get("/{pag}/{cant}", response_model=List[ClienteResponse])
def filtrar_clientes(   
    pag: int,   
    cant: int,                     
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    primer_apellido: Optional[str] = Query(None, description="Filtrar por primer apellido"),
    segundo_apellido: Optional[str] = Query(None, description="Filtrar por segundo apellido"),    
    db: Session = Depends(get_db)
):    
    sql = f"CALL filtrarCliente(:nombre, :primer_apellido, :segundo_apellido, :pag, :cant)"  
    resultados = db.execute(
        text(sql),
        {          
            "nombre": nombre,
            "primer_apellido": primer_apellido,
            "segundo_apellido": segundo_apellido,             
            "pag": pag, 
            "cant": cant
         }
    ).fetchall()    
    resultados = [ClienteResponse.from_orm(row) for row in resultados]
    return resultados

@router.post("/", response_model=int, status_code=status.HTTP_201_CREATED)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):   
    try:
        with db.begin():
            sql = """
                SELECT nuevoCliente(
                    :nombre, :apellido1, :apellido2,
                    :telefono, :direccion, :correo
                ) AS id_cliente
            """

            id_usuario = db.execute(
                text(sql),
                {
                    "nombre": cliente.nombre,
                    "apellido1": cliente.primer_apellido,
                    "apellido2": cliente.segundo_apellido,
                    "telefono": cliente.telefono,
                    "direccion": cliente.direccion,
                    "correo": cliente.correo
                }
            ).fetchone().id_cliente
        
            sqlUsuario = """
                SELECT nuevoUsuario(
                    :id_usuario, :correo,:rol, :clave
                )
            """
            db.execute(text(sqlUsuario),
                {
                    "id_usuario": id_usuario,
                    "correo": cliente.correo,
                    "rol": 1,
                    "clave": cliente.clave
                })  
        return id_usuario           
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de datos: " + str(e.orig))
    except SQLAlchemyError as e:
        # la transacción ya fue rollbacked por el context manager
        raise HTTPException(status_code=500, detail="Error en la base de datos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=None)
def actualizar_cliente(id: int, cliente: ClienteUpdate, db: Session = Depends(get_db)):
    try:
        sql = """
            SELECT editarCliente(
                :id, :nombre, :apellido1, :apellido2,
                :telefono, :direccion, :correo
            )
        """        
        db.execute(
            text(sql),
            {
                "id": id,
                "nombre": cliente.nombre,
                "apellido1": cliente.primer_apellido,
                "apellido2": cliente.segundo_apellido,
                "telefono": cliente.telefono,
                "direccion": cliente.direccion,
                "correo": cliente.correo
            }
        )
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de datos: " + str(e.orig))

@router.delete("/{id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(id: int, db: Session = Depends(get_db)):
    try:
        sql = "SELECT eliminarCliente(:id)"
        db.execute(text(sql), {"id": id})
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de datos: " + str(e.orig))
