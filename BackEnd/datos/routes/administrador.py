# routes/administradores.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.administrador import AdministradorCreate, AdministradorUpdate, AdministradorResponse
from typing import List, Optional
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

router = APIRouter(prefix="/administradores", tags=["administradores"])

@router.get("/{pag}/{cant}", response_model=List[AdministradorResponse])
def filtrar_administradores(   
    pag: int,   
    cant: int,                     
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    primer_apellido: Optional[str] = Query(None, description="Filtrar por primer apellido"),
    segundo_apellido: Optional[str] = Query(None, description="Filtrar por segundo apellido"),    
    db: Session = Depends(get_db)
):    
    sql = "CALL filtrarAdministrador(:nombre, :primer_apellido, :segundo_apellido, :pag, :cant)"  
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
    resultados = [AdministradorResponse.from_orm(row) for row in resultados]
    return resultados

@router.get("/{id}", response_model=AdministradorResponse)
def buscar_administrador(id: int, db: Session = Depends(get_db)):
    try:
        sql = "CALL buscarAdministrador(:id)"
        resultado = db.execute(text(sql), {"id": id}).fetchone()
        
        if not resultado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Administrador con ID {id} no encontrado"
            )
        
        return AdministradorResponse.from_orm(resultado)
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Error en la base de datos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=int, status_code=status.HTTP_201_CREATED)
def crear_administrador(administrador: AdministradorCreate, db: Session = Depends(get_db)):   
    try:
        with db.begin():
            sql = """
                SELECT nuevoAdministrador(
                    :nombre, :apellido1, :apellido2,
                    :correo, :telefono
                ) AS id_administrador
            """

            id_usuario = db.execute(
                text(sql),
                {
                    "nombre": administrador.nombre,
                    "apellido1": administrador.primer_apellido,
                    "apellido2": administrador.segundo_apellido,
                    "correo": administrador.correo,
                    "telefono": administrador.telefono
                }
            ).fetchone().id_administrador
        
            sqlUsuario = """
                SELECT nuevoUsuario(
                    :id_usuario, :correo, :rol, :clave
                )
            """
            db.execute(text(sqlUsuario),
                {
                    "id_usuario": id_usuario,
                    "correo": administrador.correo,
                    "rol": 2,  # rol 2 para administradores
                    "clave": administrador.clave
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
def actualizar_administrador(id: int, administrador: AdministradorUpdate, db: Session = Depends(get_db)):
    try:
        sql = """
            CALL actualizarAdministrador(
                :id, :nombre, :apellido1, :apellido2,
                :correo, :telefono
            )
        """        
        db.execute(
            text(sql),
            {
                "id": id,
                "nombre": administrador.nombre,
                "apellido1": administrador.primer_apellido,
                "apellido2": administrador.segundo_apellido,
                "correo": administrador.correo,
                "telefono": administrador.telefono
            }
        )
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de datos: " + str(e.orig))

@router.delete("/{id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def eliminar_administrador(id: int, db: Session = Depends(get_db)):
    try:
        sql = "SELECT eliminarAdministrador(:id)"
        db.execute(text(sql), {"id": id})
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de datos: " + str(e.orig))