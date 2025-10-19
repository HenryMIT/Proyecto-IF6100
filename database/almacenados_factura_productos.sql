USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- ========================================
-- PROCEDIMIENTOS PARA FACTURA_PRODUCTOS
-- ========================================

-- Función para agregar producto a factura
DROP FUNCTION IF EXISTS agregarProductoAFactura$$
CREATE FUNCTION agregarProductoAFactura (
    _id_factura INT,
    _id_producto INT,
    _cantidad INT
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant_factura INT;
    DECLARE _cant_producto INT;
    DECLARE _precio DECIMAL(10,2);
    DECLARE _descuento DECIMAL(10,2);
    DECLARE _subtotal DECIMAL(10,2);
    DECLARE _stock INT;
    DECLARE _id_detalle INT;
    
    -- Verificar si existe la factura
    SELECT COUNT(id_Factura) INTO _cant_factura FROM Facturas WHERE id_Factura = _id_factura;
    
    -- Verificar si existe el producto y obtener datos
    SELECT COUNT(id_Producto), precio, descuento, cantidad 
    INTO _cant_producto, _precio, _descuento, _stock
    FROM Productos WHERE id_Producto = _id_producto;
    
    IF _cant_factura > 0 AND _cant_producto > 0 AND _stock >= _cantidad THEN
        -- Calcular subtotal con descuento
        SET _subtotal = (_precio - (_precio * _descuento / 100)) * _cantidad;
        
        -- Insertar detalle de factura
        INSERT INTO Factura_Productos(id_Factura, id_Producto, cantidad, subtotal)
            VALUES (_id_factura, _id_producto, _cantidad, _subtotal);
        SET _id_detalle = LAST_INSERT_ID();
        
        -- Actualizar stock del producto
        UPDATE Productos SET cantidad = cantidad - _cantidad WHERE id_Producto = _id_producto;
        
        -- Actualizar total de la factura
        CALL actualizarTotalFactura(_id_factura);
        
        RETURN _id_detalle;
    ELSE
        RETURN 0; -- Error: factura no existe, producto no existe, o stock insuficiente
    END IF;
END$$

-- Función para eliminar producto de factura
DROP FUNCTION IF EXISTS eliminarProductoDeFactura$$
CREATE FUNCTION eliminarProductoDeFactura (_id_factura_producto INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _id_factura INT;
    DECLARE _id_producto INT;
    DECLARE _cantidad_devolver INT;
    
    -- Obtener datos del detalle
    SELECT COUNT(id_factura_producto), id_Factura, id_Producto, cantidad
    INTO _cant, _id_factura, _id_producto, _cantidad_devolver
    FROM Factura_Productos 
    WHERE id_factura_producto = _id_factura_producto;
    
    IF _cant > 0 THEN
        -- Devolver stock al producto
        UPDATE Productos SET cantidad = cantidad + _cantidad_devolver WHERE id_Producto = _id_producto;
        
        -- Eliminar detalle
        DELETE FROM Factura_Productos WHERE id_factura_producto = _id_factura_producto;
        
        -- Actualizar total de factura
        CALL actualizarTotalFactura(_id_factura);
        
        RETURN 1; -- Eliminado exitosamente
    ELSE
        RETURN 0; -- No encontrado
    END IF;
END$$

-- Función para actualizar cantidad de producto en factura
DROP FUNCTION IF EXISTS actualizarCantidadProductoFactura$$
CREATE FUNCTION actualizarCantidadProductoFactura (_id_factura_producto INT, _nueva_cantidad INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _id_factura INT;
    DECLARE _id_producto INT;
    DECLARE _cantidad_actual INT;
    DECLARE _diferencia INT;
    DECLARE _precio DECIMAL(10,2);
    DECLARE _descuento DECIMAL(10,2);
    DECLARE _nuevo_subtotal DECIMAL(10,2);
    DECLARE _stock_disponible INT;
    
    -- Obtener datos del detalle actual
    SELECT COUNT(id_factura_producto), id_Factura, id_Producto, cantidad
    INTO _cant, _id_factura, _id_producto, _cantidad_actual
    FROM Factura_Productos 
    WHERE id_factura_producto = _id_factura_producto;
    
    IF _cant > 0 THEN
        -- Obtener stock disponible y precios
        SELECT cantidad, precio, descuento 
        INTO _stock_disponible, _precio, _descuento
        FROM Productos WHERE id_Producto = _id_producto;
        
        SET _diferencia = _nueva_cantidad - _cantidad_actual;
        
        -- Verificar si hay stock suficiente para el aumento
        IF _diferencia <= _stock_disponible THEN
            -- Calcular nuevo subtotal
            SET _nuevo_subtotal = (_precio - (_precio * _descuento / 100)) * _nueva_cantidad;
            
            -- Actualizar detalle
            UPDATE Factura_Productos 
            SET cantidad = _nueva_cantidad, subtotal = _nuevo_subtotal 
            WHERE id_factura_producto = _id_factura_producto;
            
            -- Actualizar stock del producto
            UPDATE Productos SET cantidad = cantidad - _diferencia WHERE id_Producto = _id_producto;
            
            -- Actualizar total de factura
            CALL actualizarTotalFactura(_id_factura);
            
            RETURN 1; -- Actualizado exitosamente
        ELSE
            RETURN 2; -- Stock insuficiente
        END IF;
    ELSE
        RETURN 0; -- Detalle no encontrado
    END IF;
END$$

-- Procedimiento para ver detalle completo de factura
DROP PROCEDURE IF EXISTS verDetalleFactura$$
CREATE PROCEDURE verDetalleFactura (_id_factura INT)
BEGIN
    SELECT 
        fp.*,
        p.descripcion AS producto_descripcion,
        p.precio AS producto_precio_original,
        p.descuento AS producto_descuento,
        (p.precio - (p.precio * p.descuento / 100)) AS precio_con_descuento,
        c.nombre AS categoria_nombre
    FROM Factura_Productos fp
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE fp.id_Factura = _id_factura
    ORDER BY fp.id_factura_producto;
END$$

-- Procedimiento para buscar productos en facturas por producto
DROP PROCEDURE IF EXISTS buscarFacturasPorProducto$$
CREATE PROCEDURE buscarFacturasPorProducto (_id_producto INT)
BEGIN
    SELECT 
        fp.*,
        f.fecha AS fecha_factura,
        f.estado AS estado_factura,
        f.comentario AS comentario_factura,
        u.correo AS usuario_correo,
        p.descripcion AS producto_descripcion
    FROM Factura_Productos fp
    INNER JOIN Facturas f ON fp.id_Factura = f.id_Factura
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    WHERE fp.id_Producto = _id_producto
    ORDER BY f.fecha DESC;
END$$

-- Procedimiento para buscar detalles por rango de fechas
DROP PROCEDURE IF EXISTS buscarDetallesPorFecha$$
CREATE PROCEDURE buscarDetallesPorFecha (_fecha_inicio DATE, _fecha_fin DATE)
BEGIN
    SELECT 
        fp.*,
        f.fecha AS fecha_factura,
        f.estado AS estado_factura,
        u.correo AS usuario_correo,
        p.descripcion AS producto_descripcion,
        c.nombre AS categoria_nombre
    FROM Factura_Productos fp
    INNER JOIN Facturas f ON fp.id_Factura = f.id_Factura
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE DATE(f.fecha) BETWEEN _fecha_inicio AND _fecha_fin
    ORDER BY f.fecha DESC, fp.id_factura_producto;
END$$

-- Procedimiento para actualizar total de factura
DROP PROCEDURE IF EXISTS actualizarTotalFactura$$
CREATE PROCEDURE actualizarTotalFactura (_id_factura INT)
BEGIN
    DECLARE _total DECIMAL(10,2);
    
    SELECT COALESCE(SUM(subtotal), 0.00) INTO _total 
    FROM Factura_Productos 
    WHERE id_Factura = _id_factura;
    
    UPDATE Facturas SET total = _total WHERE id_Factura = _id_factura;
END$$

-- Función para obtener productos más vendidos
DROP PROCEDURE IF EXISTS productosmasVendidos$$
CREATE PROCEDURE productosmasVendidos (_fecha_inicio DATE, _fecha_fin DATE, _limite INT)
BEGIN
    SELECT 
        p.id_Producto,
        p.descripcion AS producto_descripcion,
        c.nombre AS categoria_nombre,
        SUM(fp.cantidad) AS total_vendido,
        SUM(fp.subtotal) AS ingresos_totales,
        COUNT(DISTINCT fp.id_Factura) AS numero_facturas,
        AVG(fp.cantidad) AS promedio_por_factura
    FROM Factura_Productos fp
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    INNER JOIN Facturas f ON fp.id_Factura = f.id_Factura
    WHERE DATE(f.fecha) BETWEEN _fecha_inicio AND _fecha_fin
    GROUP BY p.id_Producto, p.descripcion, c.nombre
    ORDER BY total_vendido DESC
    LIMIT _limite;
END$$

-- Función para obtener resumen de ventas por categoría
DROP PROCEDURE IF EXISTS ventasPorCategoria$$
CREATE PROCEDURE ventasPorCategoria (_fecha_inicio DATE, _fecha_fin DATE)
BEGIN
    SELECT 
        c.id_Categoria,
        c.nombre AS categoria_nombre,
        COUNT(DISTINCT fp.id_Producto) AS productos_diferentes,
        SUM(fp.cantidad) AS total_unidades_vendidas,
        SUM(fp.subtotal) AS ingresos_totales,
        AVG(fp.subtotal) AS promedio_por_producto,
        COUNT(DISTINCT fp.id_Factura) AS numero_facturas
    FROM Factura_Productos fp
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    INNER JOIN Facturas f ON fp.id_Factura = f.id_Factura
    WHERE DATE(f.fecha) BETWEEN _fecha_inicio AND _fecha_fin
    GROUP BY c.id_Categoria, c.nombre
    ORDER BY ingresos_totales DESC;
END$$

DELIMITER ;

-- ========================================
-- RELLENO DE DATOS INICIALES - FACTURA_PRODUCTOS
-- ========================================

-- Agregar productos a las facturas (ajustar IDs según tus datos)
SELECT agregarProductoAFactura(1, 1, 1) AS 'Producto 1 a Factura 1'; -- Cocina
SELECT agregarProductoAFactura(1, 5, 1) AS 'Producto 2 a Factura 1'; -- Fregadero
SELECT agregarProductoAFactura(2, 3, 1) AS 'Producto 1 a Factura 2'; -- Refrigerador
SELECT agregarProductoAFactura(2, 6, 1) AS 'Producto 2 a Factura 2'; -- Campana
SELECT agregarProductoAFactura(3, 3, 1) AS 'Producto 1 a Factura 3'; -- Refrigerador

-- Ver detalles creados
SELECT * FROM Factura_Productos ORDER BY id_Factura;

-- ========================================
-- SCRIPTS DE PRUEBA - FACTURA_PRODUCTOS
-- ========================================

-- 1. PRUEBA: Ver detalle de factura
CALL verDetalleFactura(1);
CALL verDetalleFactura(2);

-- 2. PRUEBA: Agregar más productos a factura existente
SELECT agregarProductoAFactura(1, 7, 1) AS 'Nuevo producto a Factura 1'; -- Horno

-- 3. PRUEBA: Actualizar cantidad de producto en factura
SELECT actualizarCantidadProductoFactura(1, 2) AS 'Cantidad Actualizada';

-- 4. PRUEBA: Buscar facturas por producto específico
CALL buscarFacturasPorProducto(3); -- Refrigerador

-- 5. PRUEBA: Buscar detalles por fecha
CALL buscarDetallesPorFecha(CURDATE(), CURDATE());

-- 6. PRUEBA: Productos más vendidos (top 5)
CALL productosmasVendidos(CURDATE(), CURDATE(), 5);

-- 7. PRUEBA: Ventas por categoría
CALL ventasPorCategoria(CURDATE(), CURDATE());

-- 8. PRUEBA: Eliminar producto de factura
SELECT eliminarProductoDeFactura(2) AS 'Producto Eliminado';

-- 9. VERIFICACIÓN: Ver estado final
SELECT * FROM Factura_Productos ORDER BY id_Factura;
SELECT * FROM Facturas ORDER BY id_Factura;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN agregarProductoAFactura():
0 = Error (factura no existe, producto no existe, o stock insuficiente)
>0 = ID del detalle de factura creado

FUNCIÓN eliminarProductoDeFactura():
0 = Detalle no encontrado
1 = Eliminado exitosamente (stock devuelto)

FUNCIÓN actualizarCantidadProductoFactura():
0 = Detalle no encontrado
1 = Cantidad actualizada exitosamente
2 = Stock insuficiente para el aumento

LÓGICA IMPLEMENTADA:
- Control automático de stock al agregar/eliminar/modificar
- Cálculo automático de subtotales con descuentos aplicados
- Actualización automática del total de facturas
- Devolución de stock al eliminar o reducir cantidades
- Reportes de productos más vendidos
- Análisis de ventas por categoría
- Histórico de ventas por producto
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO
-- ========================================
/*
-- Agregar producto a factura
SELECT agregarProductoAFactura(1, 2, 2); -- 2 Cocinas eléctricas a factura 1

-- Cambiar cantidad de producto en factura
SELECT actualizarCantidadProductoFactura(1, 3); -- Cambiar a 3 unidades

-- Ver detalle completo de factura
CALL verDetalleFactura(1);

-- Ver qué facturas contienen un producto específico
CALL buscarFacturasPorProducto(2);

-- Top 10 productos más vendidos del mes
CALL productosmasVendidos('2025-10-01', '2025-10-31', 10);

-- Análisis de ventas por categoría del mes
CALL ventasPorCategoria('2025-10-01', '2025-10-31');

-- Eliminar producto de factura (devuelve stock)
SELECT eliminarProductoDeFactura(3);
*/