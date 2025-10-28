from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.productos import ProductoCreate, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["productos"])

# CREAR (usa nuevoProducto)
@router.post("/")
def crear_producto(prod: ProductoCreate, db: Session = Depends(get_db)):
    result = db.execute(
        text("""SELECT nuevoProducto(:id_Categoria, :descripcion, :cantidad, :descuento, :precio, :imagen_producto) AS id"""),
        prod.dict()
    )
    id = result.fetchone().id
    db.commit()
    if id == 0:
        raise HTTPException(status_code=400, detail="Categoría no existe")
    return {"id": id, "mensaje": "Producto creado exitosamente"}

# OBTENER TODOS (usa listar o filtros)
@router.get("/")
def listar_productos(categoria: int = None, busqueda: str = None, db: Session = Depends(get_db)):
    if categoria:
        result = db.execute(text("CALL buscarProductosPorCategoria(:cat)"), {"cat": categoria})
    elif busqueda:
        result = db.execute(text("CALL buscarProductosPorDescripcion(:desc)"), {"desc": busqueda})
    else:
        result = db.execute(text("CALL listarProductos()"))
    return result.fetchall()

# OBTENER POR ID (usa buscarProductoPorId)
@router.get("/{id}")
def obtener_producto(id: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarProductoPorId(:id)"), {"id": id})
    data = result.fetchall()
    if not data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return data[0]

# CTUALIZAR (usa actualizarProducto)
@router.put("/{id}")
def actualizar_producto(id: int, data: ProductoUpdate, db: Session = Depends(get_db)):
    params = {
        "_id_producto": id,
        "_id_categoria": data.id_Categoria,
        "_descripcion": data.descripcion,
        "_cantidad": data.cantidad,
        "_descuento": data.descuento,
        "_precio": data.precio,
        "_imagen_producto": data.imagen_producto
    }
    result = db.execute(
        text("""SELECT actualizarProducto(:_id_producto, :_id_categoria, :_descripcion, :_cantidad, :_descuento, :_precio, :_imagen_producto) AS estado"""),
        params
    )
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    elif estado == 2:
        raise HTTPException(status_code=400, detail="Categoría no existe")
    return {"mensaje": "Producto actualizado correctamente"}

# ELIMINAR (usa eliminarProducto)
@router.delete("/{id}")
def eliminar_producto(id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT eliminarProducto(:id) AS estado"), {"id": id})
    estado = result.fetchone().estado
    db.commit()
    if estado == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    elif estado == 2:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene facturas asociadas")
    return {"mensaje": "Producto eliminado correctamente"}
