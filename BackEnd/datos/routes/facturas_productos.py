from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.facturas_productos import FacturaProductoCreate, FacturaProductoUpdate
from typing import List

router = APIRouter(prefix="/facturas_productos", tags=["facturas_productos"])

# Crear nuevo registro en facturas_productos (usa nuevaFacturaProducto)
@router.post("/")
def create_factura_producto(factura_producto: FacturaProductoCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT nuevaFacturaProducto(:id_factura, :id_producto, :cantidad, :subtotal) AS id"""),
        factura_producto.dict()
    )
    id = result.fetchone().id
    db.commit()
    if id == 0:
        raise HTTPException(status_code=400, detail="Error al crear el registro de factura_producto")
    created = db.execute(text("CALL buscarFacturaProductoPorId(:id)"), {"id": id}).fetchone()
    if not created:
        raise HTTPException(status_code=404, detail="Registro no encontrado después de crear")
    return dict(created._mapping)

# Actualizar registro en facturas_productos (usa actualizarFacturaProducto)
@router.put("/{id}")
def actualizar_factura_producto(id: int, data: FacturaProductoUpdate, db: Session = Depends(get_db)):
    params = {
        "_id_facturas_productos": id,
        "_cantidad": data.cantidad,
        "_subtotal": data.subtotal
    }
    result = db.execute(
        text("""SELECT actualizarFacturaProducto(:_id_facturas_productos, :_cantidad, :_subtotal) AS estado"""),
        params
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Registro de factura_producto no encontrado o no actualizado")
    updated = db.execute(text("CALL buscarFacturaProductoPorId(:id)"), {"id": id}).fetchone()
    if not updated:
        raise HTTPException(status_code=404, detail="Registro no encontrado después de actualizar")
    return dict(updated._mapping)

# Eliminar registro en facturas_productos (usa eliminarFacturaProducto)
@router.delete("/{id}")
def eliminar_factura_producto(id: int, db: Session = Depends(get_db)):
    existing = db.execute(text("CALL buscarFacturaProductoPorId(:id)"), {"id": id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Registro de factura_producto no encontrado")

    result = db.execute(
        text("SELECT eliminarFacturaProducto(:id_facturas_productos) AS estado"),
        {"id_facturas_productos": id}
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Registro de factura_producto no encontrado")
    return {"id": id, "mensaje": "Registro de factura_producto eliminado exitosamente"}

# Listar todos los registros en facturas_productos (usa listarFacturaProductos)
@router.get("/")
def listar_facturas_productos(db: Session = Depends(get_db)):
    result = db.execute(text("CALL listarFacturaProductos()"))
    return [dict(r._mapping) for r in result.fetchall()]
