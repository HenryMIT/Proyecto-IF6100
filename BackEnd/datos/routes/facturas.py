from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.facturas import FacturaCreate, FacturaUpdate
from typing import List, Optional 

router = APIRouter(prefix="/facturas", tags=["facturas"])

# Crear nueva factura (usa nuevaFactura)
@router.post("/", response_model=dict)
def create_factura(factura: FacturaCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT nuevaFactura(:id_usuario, :fecha, :comentario, :estado, :total) AS id"""),
        factura.dict()
    )
    id = result.fetchone().id
    db.commit()
    if id == 0:
        raise HTTPException(status_code=400, detail="Error al crear la factura")
    return {"id": id, "mensaje": "Factura creada exitosamente"}

# Listar todas las facturas (usa listar o filtros)
@router.get("/", response_model=List[dict])
def listar_facturas(estado: Optional[str] = None, db: Session = Depends(get_db)):
    if estado:
        result = db.execute(text("CALL buscarFacturasPorEstado(:estado)"), {"estado": estado})
    else:
        result = db.execute(text("CALL listarFacturas()"))
    return result.fetchall()

# Obtener factura por ID (usa buscarFacturaPorId)
@router.get("/{id}", response_model=dict)
def obtener_factura(id: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarFacturaPorId(:id)"), {"id": id})
    data = result.fetchall()
    if not data:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return data[0]

# Actualizar factura (usa actualizarFactura)
@router.put("/{id}", response_model=dict)
def actualizar_factura(id: int, data: FacturaUpdate, db: Session = Depends(get_db)):
    params = {
        "_id_Factura": id,
        "_comentario": data.comentario,
        "_estado": data.estado,
        "_total": data.total
    }
    result = db.execute(
        text("""SELECT actualizarFactura(:_id_Factura, :_comentario, :_estado, :_total) AS estado"""),
        params
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada o no actualizada")
    return {"mensaje": "Factura actualizada exitosamente"}

# Eliminar factura (usa eliminarFactura)
@router.delete("/{id}", response_model=dict)
def eliminar_factura(id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT eliminarFactura(:id_Factura) AS estado"""),
        {"id_Factura": id}
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada o no eliminada")
    return {"mensaje": "Factura eliminada exitosamente"}

# Obtener facturas por ID de usuario
@router.get("/usuario/{id_usuario}", response_model=List[dict])
def obtener_facturas_por_usuario(id_usuario: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarFacturasPorUsuario(:id_usuario)"), {"id_usuario": id_usuario})
    data = result.fetchall()
    if not data:
        raise HTTPException(status_code=404, detail="No se encontraron facturas para el usuario")
    return data

