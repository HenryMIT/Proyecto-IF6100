from fastapi import APIRouter, Depends, HTTPException,Form 
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.productos import ProductoCreate, ProductoUpdate, ProductoResponse as ProductoR
from fastapi import UploadFile, File
from utils.file_manager import file_manager

router = APIRouter(prefix="/productos", tags=["productos"])


@router.post("/crear-con-imagen")
async def crear_producto_con_imagen(
    id_Categoria: int = Form(...),
    descripcion: str = Form(...),
    cantidad: int = Form(...),
    descuento: float = Form(...),
    precio: float = Form(...),
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Guardar la imagen
    imagen_result = file_manager.upload_image(imagen)
    ruta_imagen = imagen_result["image_url"]

    # 2. Insertar el producto con la ruta de la imagen
    result = db.execute(
        text("""SELECT nuevoProducto(:id_Categoria, :descripcion, :cantidad, :descuento, :precio, :imagen_producto) AS id"""),
        {
            "id_Categoria": id_Categoria,
            "descripcion": descripcion,
            "cantidad": cantidad,
            "descuento": descuento,
            "precio": precio,
            "imagen_producto": ruta_imagen
        }
    )
    id_producto = result.fetchone().id
    db.commit()

    if id_producto == 0:
        # Si la categoría no existe, elimina la imagen recién subida
        file_manager.delete_file(ruta_imagen)
        raise HTTPException(status_code=400, detail="Categoría no existe")

    return {
        "id": id_producto,
        "mensaje": "Producto creado exitosamente",
        "imagen_url": ruta_imagen
    }


    
@router.post("/upload-imagen")
async def upload_imagen(imagen: UploadFile = File(...)):
    """
    Sube una imagen y la guarda en uploads/
    """
    return file_manager.upload_image(imagen)
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
def listar_productos(categoria: int = None, busqueda: str = None, db: Session = Depends(get_db))->list[ProductoR]:
    if categoria:
        result = db.execute(text("CALL buscarProductosPorCategoria(:cat)"), {"cat": categoria})
    elif busqueda:
        result = db.execute(text("CALL buscarProductosPorDescripcion(:desc)"), {"desc": busqueda})
    else:
        result = db.execute(text("CALL listarProductos()")).fetchall()
    result = [ProductoR.from_orm(row) for row in result]
    return result

# OBTENER POR ID (usa buscarProductoPorId)
@router.get("/{id}")
def obtener_producto(id: int, db: Session = Depends(get_db)):
    result = db.execute(text("CALL buscarProductoPorId(:id)"), {"id": id}).first()._asdict()
    
    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return result

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

# ACTUALIZAR SOLO LA IMAGEN
@router.put("/{id}/imagen")
async def actualizar_imagen_producto(
    id: int,
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Actualiza únicamente la imagen de un producto.
    Elimina la imagen anterior y sube la nueva.
    """
    # 1. Obtener el producto actual para conseguir la imagen vieja
    producto_result = db.execute(text("CALL buscarProductoPorId(:id)"), {"id": id}).first()

    if not producto_result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    producto = producto_result._asdict()
    imagen_vieja = producto.get("imagen_producto")

    # 2. Subir la nueva imagen
    imagen_result = file_manager.upload_image(imagen)
    nueva_imagen_url = imagen_result["image_url"]

    # 3. Actualizar el producto con la nueva imagen en la BD
    result = db.execute(
        text("""SELECT actualizarProducto(:_id_producto, :_id_categoria, :_descripcion, :_cantidad, :_descuento, :_precio, :_imagen_producto) AS estado"""),
        {
            "_id_producto": id,
            "_id_categoria": producto.get("id_Categoria"),
            "_descripcion": producto.get("descripcion"),
            "_cantidad": producto.get("cantidad"),
            "_descuento": producto.get("descuento"),
            "_precio": producto.get("precio"),
            "_imagen_producto": nueva_imagen_url
        }
    )
    estado = result.fetchone().estado
    db.commit()

    if estado == 0:
        # Si falla la actualización, eliminar la imagen nueva que subimos
        file_manager.delete_file(nueva_imagen_url)
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    elif estado == 2:
        # Si falla por categoría, eliminar la imagen nueva
        file_manager.delete_file(nueva_imagen_url)
        raise HTTPException(status_code=400, detail="Categoría no existe")

    # 4. Si todo salió bien, eliminar la imagen vieja del servidor
    if imagen_vieja:
        file_manager.delete_file(imagen_vieja)

    return {
        "mensaje": "Imagen actualizada correctamente",
        "imagen_url": nueva_imagen_url
    }

# ELIMINAR (usa eliminarProducto)
@router.delete("/{id}")
def eliminar_producto(id: int, db: Session = Depends(get_db)):
    # 1. Primero obtener la ruta de la imagen del producto antes de eliminarlo
    producto_result = db.execute(text("CALL buscarProductoPorId(:id)"), {"id": id}).first()

    if not producto_result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    producto = producto_result._asdict()
    imagen_url = producto.get("imagen_producto")

    # 2. Intentar eliminar el producto de la base de datos
    result = db.execute(text("SELECT eliminarProducto(:id) AS estado"), {"id": id})
    estado = result.fetchone().estado
    db.commit()

    if estado == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    elif estado == 2:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene facturas asociadas")

    # 3. Si se eliminó exitosamente de la BD, eliminar la imagen del servidor
    if estado == 1 and imagen_url:
        file_manager.delete_file(imagen_url)

    return {"mensaje": "Producto eliminado correctamente"}
