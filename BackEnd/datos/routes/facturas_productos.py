from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.facturas_productos import FacturaProductoCreate, FacturaProductoUpdate
from typing import List

router = APIRouter(prefix="/factura_productos", tags=["factura_productos"])

# Crear nuevo registro en facturas_productos (usa agregarProductoAFactura)
@router.post("/")
def create_factura_producto(factura_producto: FacturaProductoCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT agregarProductoAFactura(:id_factura, :id_producto, :cantidad) AS id"""),
        factura_producto.dict()
    )
    id = result.fetchone().id
    db.commit()
    if id == 0:
        raise HTTPException(status_code=400, detail="Error al agregar producto - Factura no existe, producto no existe, o stock insuficiente")
    return {"id": id, "mensaje": "Producto agregado a factura exitosamente"}

# Actualizar cantidad de producto en factura (usa actualizarCantidadProductoFactura)
@router.put("/{id}")
def actualizar_factura_producto(id: int, data: FacturaProductoUpdate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT actualizarCantidadProductoFactura(:id_factura_producto, :nueva_cantidad) AS estado"""),
        {"id_factura_producto": id, "nueva_cantidad": data.cantidad}
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Registro de factura_producto no encontrado")
    elif estado == 2:
        raise HTTPException(status_code=400, detail="Stock insuficiente para actualizar la cantidad")
    return {"mensaje": "Cantidad actualizada exitosamente"}

# Eliminar producto de factura (usa eliminarProductoDeFactura)
@router.delete("/{id}")
def eliminar_factura_producto(id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT eliminarProductoDeFactura(:id_factura_producto) AS estado"),
        {"id_factura_producto": id}
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Registro de factura_producto no encontrado")
    return {"id": id, "mensaje": "Producto eliminado de factura exitosamente (stock devuelto)"}

# Ver detalle completo de factura (usa verDetalleFactura)
@router.get("/factura/{id_factura}")
def ver_detalle_factura(id_factura: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL verDetalleFactura(:id_factura)"), {"id_factura": id_factura})
    data = result.fetchall()
    if not data:
        return []
    return [dict(r._mapping) for r in data]

# Buscar facturas que contienen un producto específico (usa buscarFacturasPorProducto)
@router.get("/producto/{id_producto}")
def buscar_por_producto(id_producto: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarFacturasPorProducto(:id_producto)"), {"id_producto": id_producto})
    data = result.fetchall()
    if not data:
        return []
    return [dict(r._mapping) for r in data]
