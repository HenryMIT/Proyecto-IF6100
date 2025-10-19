USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- Función para insertar nuevo producto
DROP FUNCTION IF EXISTS nuevoProducto$$
CREATE FUNCTION nuevoProducto (
    _id_categoria INT,
    _descripcion VARCHAR(255),
    _cantidad INT,
    _descuento DECIMAL(10,2),
    _precio DECIMAL(10,2),
    _imagen_producto VARCHAR(200)
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _id_producto INT;
    
    -- Verificar si existe la categoría
    SELECT COUNT(id_Categoria) INTO _cant FROM Categoria_productos WHERE id_Categoria = _id_categoria;
    
    IF _cant > 0 THEN
        INSERT INTO Productos(id_Categoria, descripcion, cantidad, descuento, precio, imagen_producto) 
            VALUES (_id_categoria, _descripcion, _cantidad, _descuento, _precio, _imagen_producto);
        SET _id_producto = LAST_INSERT_ID();
    ELSE
        SET _id_producto = 0; -- Categoría no existe
    END IF;
    
    RETURN _id_producto;
END$$

-- Función para eliminar producto
DROP FUNCTION IF EXISTS eliminarProducto$$
CREATE FUNCTION eliminarProducto (_id_producto INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _facturas INT;
    DECLARE _resp INT;
    
    SET _resp = 0;
    
    -- Verificar si existe el producto
    SELECT COUNT(id_Producto) INTO _cant FROM Productos WHERE id_Producto = _id_producto;
    
    IF _cant > 0 THEN
        -- Verificar si tiene facturas asociadas
        SELECT COUNT(id_factura_producto) INTO _facturas FROM Factura_Productos WHERE id_Producto = _id_producto;
        
        IF _facturas = 0 THEN
            DELETE FROM Productos WHERE id_Producto = _id_producto;
            SET _resp = 1; -- Eliminado exitosamente
        ELSE
            SET _resp = 2; -- No se puede eliminar, tiene facturas asociadas
        END IF;
    END IF;
    
    RETURN _resp;
END$$

-- Procedimiento para buscar producto por ID
DROP PROCEDURE IF EXISTS buscarProductoPorId$$
CREATE PROCEDURE buscarProductoPorId (_id_producto INT)
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE p.id_Producto = _id_producto;
END$$

-- Procedimiento para buscar productos por categoría (ID de categoría)
DROP PROCEDURE IF EXISTS buscarProductosPorCategoria$$
CREATE PROCEDURE buscarProductosPorCategoria (_id_categoria INT)
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE p.id_Categoria = _id_categoria
    ORDER BY p.descripcion;
END$$

-- Procedimiento para buscar productos por descripción (filtro de cadena simple)
DROP PROCEDURE IF EXISTS buscarProductosPorDescripcion$$
CREATE PROCEDURE buscarProductosPorDescripcion (_filtro_descripcion VARCHAR(255))
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE p.descripcion LIKE CONCAT('%', _filtro_descripcion, '%')
    ORDER BY p.descripcion;
END$$

-- Procedimiento para búsqueda avanzada usando cadenaFiltro (MÚLTIPLES CAMPOS)
DROP PROCEDURE IF EXISTS buscarProductosAvanzado$$
CREATE PROCEDURE buscarProductosAvanzado (_parametros VARCHAR(250), _campos VARCHAR(50))
BEGIN
    SET @sql = CONCAT(
        'SELECT p.*, c.nombre AS nombre_categoria ',
        'FROM Productos p ',
        'INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria ',
        'WHERE ', cadenaFiltro(_parametros, _campos),
        ' ORDER BY p.descripcion'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- Procedimiento para listar todos los productos con información de categoría
DROP PROCEDURE IF EXISTS listarProductos$$
CREATE PROCEDURE listarProductos()
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    ORDER BY c.nombre, p.descripcion;
END$$

-- Procedimiento para buscar productos por rango de precio
DROP PROCEDURE IF EXISTS buscarProductosPorPrecio$$
CREATE PROCEDURE buscarProductosPorPrecio (_precio_min DECIMAL(10,2), _precio_max DECIMAL(10,2))
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE p.precio BETWEEN _precio_min AND _precio_max
    ORDER BY p.precio;
END$$

-- Procedimiento para buscar productos con descuento
DROP PROCEDURE IF EXISTS buscarProductosConDescuento$$
CREATE PROCEDURE buscarProductosConDescuento()
BEGIN
    SELECT p.*, c.nombre AS nombre_categoria,
           (p.precio - (p.precio * p.descuento / 100)) AS precio_final
    FROM Productos p
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE p.descuento > 0
    ORDER BY p.descuento DESC;
END$$

-- Función para actualizar stock de producto
DROP FUNCTION IF EXISTS actualizarStockProducto$$
CREATE FUNCTION actualizarStockProducto (_id_producto INT, _nueva_cantidad INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Producto) INTO _cant FROM Productos WHERE id_Producto = _id_producto;
    IF _cant > 0 THEN
        UPDATE Productos SET cantidad = _nueva_cantidad WHERE id_Producto = _id_producto;
    END IF;
    RETURN _cant;
END$$

-- Función para actualizar precio de producto
DROP FUNCTION IF EXISTS actualizarPrecioProducto$$
CREATE FUNCTION actualizarPrecioProducto (_id_producto INT, _nuevo_precio DECIMAL(10,2)) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Producto) INTO _cant FROM Productos WHERE id_Producto = _id_producto;
    IF _cant > 0 THEN
        UPDATE Productos SET precio = _nuevo_precio WHERE id_Producto = _id_producto;
    END IF;
    RETURN _cant;
END$$

-- Función para actualizar producto completo
DROP FUNCTION IF EXISTS actualizarProducto$$
CREATE FUNCTION actualizarProducto (
    _id_producto INT,
    _id_categoria INT,
    _descripcion VARCHAR(255),
    _cantidad INT,
    _descuento DECIMAL(10,2),
    _precio DECIMAL(10,2),
    _imagen_producto VARCHAR(200)
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _cat_existe INT;
    
    -- Verificar si existe el producto
    SELECT COUNT(id_Producto) INTO _cant FROM Productos WHERE id_Producto = _id_producto;
    
    IF _cant > 0 THEN
        -- Verificar si existe la categoría
        SELECT COUNT(id_Categoria) INTO _cat_existe FROM Categoria_productos WHERE id_Categoria = _id_categoria;
        
        IF _cat_existe > 0 THEN
            UPDATE Productos SET 
                id_Categoria = _id_categoria,
                descripcion = _descripcion,
                cantidad = _cantidad,
                descuento = _descuento,
                precio = _precio,
                imagen_producto = _imagen_producto
            WHERE id_Producto = _id_producto;
            SET _cant = 1; -- Actualizado exitosamente
        ELSE
            SET _cant = 2; -- Categoría no existe
        END IF;
    ELSE
        SET _cant = 0; -- Producto no encontrado
    END IF;
    
    RETURN _cant;
END$$

-- Función para contar productos por categoría
DROP FUNCTION IF EXISTS contarProductosPorCategoria$$
CREATE FUNCTION contarProductosPorCategoria (_id_categoria INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cantidad INT;
    SELECT COUNT(id_Producto) INTO _cantidad FROM Productos WHERE id_Categoria = _id_categoria;
    RETURN _cantidad;
END$$

DELIMITER ;

-- ========================================
-- RELLENO DE DATOS INICIALES - PRODUCTOS
-- ========================================

-- Insertar productos de ejemplo (asumiendo que las categorías ya existen)
SELECT nuevoProducto(1, 'Cocina a Gas 4 Hornillas Mabe', 10, 15.00, 450000.00, 'cocina_mabe_001.jpg') AS 'Producto 1';
SELECT nuevoProducto(1, 'Cocina Eléctrica Whirlpool', 5, 10.00, 380000.00, 'cocina_whirlpool_001.jpg') AS 'Producto 2';
SELECT nuevoProducto(2, 'Refrigerador Samsung 18 pies', 8, 20.00, 650000.00, 'refri_samsung_001.jpg') AS 'Producto 3';
SELECT nuevoProducto(2, 'Congelador Horizontal LG', 6, 0.00, 420000.00, 'congelador_lg_001.jpg') AS 'Producto 4';
SELECT nuevoProducto(4, 'Fregadero Acero Inoxidable Doble', 15, 5.00, 85000.00, 'fregadero_acero_001.jpg') AS 'Producto 5';
SELECT nuevoProducto(5, 'Campana Extractora Teka', 12, 12.00, 150000.00, 'campana_teka_001.jpg') AS 'Producto 6';
SELECT nuevoProducto(9, 'Horno Empotrado Bosch', 4, 25.00, 320000.00, 'horno_bosch_001.jpg') AS 'Producto 7';
SELECT nuevoProducto(10, 'Microondas Panasonic 1.2 Cu Ft', 20, 8.00, 95000.00, 'micro_panasonic_001.jpg') AS 'Producto 8';

-- Ver todos los productos insertados
SELECT * FROM Productos ORDER BY id_Categoria, descripcion;

-- ========================================
-- SCRIPTS DE PRUEBA - PRODUCTOS
-- ========================================

-- 1. PRUEBA: Buscar producto por ID
CALL buscarProductoPorId(1); -- Buscar producto específico

-- 2. PRUEBA: Buscar productos por categoría (ID)
CALL buscarProductosPorCategoria(1); -- Cocinas
CALL buscarProductosPorCategoria(2); -- Refrigeración

-- 3. PRUEBA: Buscar productos por descripción (filtro de cadena simple)
CALL buscarProductosPorDescripcion('Samsung'); -- Productos Samsung
CALL buscarProductosPorDescripcion('cocina'); -- Productos con 'cocina' en descripción

-- 3b. PRUEBA: Búsqueda avanzada con cadenaFiltro (MÚLTIPLES CAMPOS)
-- Buscar productos que contengan "Samsung" en descripción
CALL buscarProductosAvanzado('Samsung', 'descripcion');

-- Buscar productos con múltiples criterios: "Cocina" en descripción Y precio específico
-- CALL buscarProductosAvanzado('Cocina&450000', 'descripcion&precio');

-- 4. PRUEBA: Insertar nuevo producto
SELECT nuevoProducto(3, 'Pila Doble Tazón Granito', 8, 5.00, 120000.00, 'pila_granito_001.jpg') AS 'Nuevo Producto';

-- 5. PRUEBA: Actualizar producto completo
SELECT actualizarProducto(1, 1, 'Cocina a Gas 6 Hornillas Mabe ACTUALIZADA', 12, 20.00, 480000.00, 'cocina_mabe_nueva.jpg') AS 'Producto Actualizado';

-- 6. PRUEBA: Actualizar stock y precio individualmente
SELECT actualizarStockProducto(2, 15) AS 'Stock Actualizado';
SELECT actualizarPrecioProducto(3, 600000.00) AS 'Precio Actualizado';

-- 7. PRUEBA: Buscar productos por rango de precio
CALL buscarProductosPorPrecio(100000.00, 400000.00); -- Entre 100k y 400k

-- 8. PRUEBA: Buscar productos con descuento
CALL buscarProductosConDescuento();

-- 9. PRUEBA: Contar productos por categoría
SELECT contarProductosPorCategoria(1) AS 'Productos en Cocinas';
SELECT contarProductosPorCategoria(2) AS 'Productos en Refrigeración';

-- 10. PRUEBA: Listar todos los productos
CALL listarProductos();

-- 11. PRUEBA: Eliminar producto sin facturas asociadas
SELECT eliminarProducto(9) AS 'Producto Eliminado'; -- El que acabamos de insertar

-- 12. VERIFICACIÓN: Ver estado final
SELECT * FROM Productos ORDER BY id_Categoria, descripcion;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN nuevoProducto():
0 = Categoría no existe
>0 = ID del nuevo producto creado

FUNCIÓN eliminarProducto():
0 = Producto no encontrado
1 = Producto eliminado exitosamente
2 = No se puede eliminar (tiene facturas asociadas)

FUNCIÓN actualizarProducto():
0 = Producto no encontrado
1 = Producto actualizado exitosamente
2 = Categoría no existe

FUNCIÓN actualizarStockProducto():
0 = Producto no encontrado
1 = Stock actualizado exitosamente

FUNCIÓN actualizarPrecioProducto():
0 = Producto no encontrado
1 = Precio actualizado exitosamente

FUNCIÓN contarProductosPorCategoria():
Retorna el número de productos en la categoría especificada
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO
-- ========================================
/*
-- BÚSQUEDAS SIMPLES:
-- Buscar todas las cocinas
CALL buscarProductosPorCategoria(1);

-- Buscar productos Samsung
CALL buscarProductosPorDescripcion('Samsung');

-- Buscar productos baratos (menos de 200k)
CALL buscarProductosPorPrecio(0, 200000);

-- Ver productos en oferta
CALL buscarProductosConDescuento();

-- BÚSQUEDAS AVANZADAS CON CADENA FILTRO:
-- Buscar por un campo
CALL buscarProductosAvanzado('Samsung', 'descripcion');

-- Buscar por múltiples campos (separados por &)
CALL buscarProductosAvanzado('Cocina&15', 'descripcion&cantidad');
CALL buscarProductosAvanzado('Samsung&650000', 'descripcion&precio');

-- Ejemplos de cómo funciona cadenaFiltro:
-- Parámetros: 'Samsung&15&Mabe'
-- Campos: 'descripcion&cantidad&descripcion'
-- Genera: `descripcion` LIKE '%Samsung%' AND `cantidad` LIKE '%15%' AND `descripcion` LIKE '%Mabe%'

-- Actualizar inventario
SELECT actualizarStockProducto(1, 25);
*/
