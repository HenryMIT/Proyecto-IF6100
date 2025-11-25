from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.facturas import FacturaCreate, FacturaUpdate
# Actualizado: schemas corregidos
from typing import List, Optional 

router = APIRouter(prefix="/facturas", tags=["facturas"])

# Crear nueva factura (usa nuevaFactura)
@router.post("/", response_model=dict)
def create_factura(factura: FacturaCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT nuevaFactura(:id_usuario, :comentario) AS id"""),
        factura.dict()
    )
    id = result.fetchone().id
    db.commit()
    if id == 0:
        raise HTTPException(status_code=400, detail="Error al crear la factura - Usuario no existe")
    return {"id": id, "mensaje": "Factura creada exitosamente"}

# Listar todas las facturas con resumen (recomendado para panel admin)
@router.get("/resumen", response_model=List[dict])
def listar_facturas_con_resumen(db: Session = Depends(get_db)):
    result = db.execute(text("CALL listarFacturasConResumen()"))
    return [dict(r._mapping) for r in result.fetchall()]

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

# Actualizar estado de factura (usa actualizarEstadoFactura)
@router.put("/{id}/estado", response_model=dict)
def actualizar_estado_factura(id: int, data: FacturaUpdate, db: Session = Depends(get_db)):
    if not data.estado:
        raise HTTPException(status_code=400, detail="El campo 'estado' es requerido")

    result = db.execute(
        text("""SELECT actualizarEstadoFactura(:id_factura, :estado) AS resultado"""),
        {"id_factura": id, "estado": data.estado}
    )
    resultado = result.fetchone().resultado
    db.commit()
    if resultado == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return {"mensaje": "Estado de factura actualizado exitosamente"}

# NOTA: No se permite eliminar facturas - usar cambio de estado en su lugar
# La función eliminarFactura no está implementada en la BD por diseño
# Para marcar una factura como cancelada, usar el endpoint de actualizar estado

# Obtener facturas por ID de usuario
@router.get("/usuario/{id_usuario}", response_model=List[dict])
def obtener_facturas_por_usuario(id_usuario: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarFacturasPorUsuario(:id_usuario)"), {"id_usuario": id_usuario})
    data = result.fetchall()
    if not data:
        raise HTTPException(status_code=404, detail="No se encontraron facturas para el usuario")
    return data

# Búsqueda avanzada de facturas con múltiples criterios
@router.get("/buscar/avanzado", response_model=List[dict])
def buscar_facturas_avanzado(
    parametros: str,
    campos: str,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("CALL buscarFacturasAvanzado(:parametros, :campos)"),
        {"parametros": parametros, "campos": campos}
    )
    return [dict(r._mapping) for r in result.fetchall()]

