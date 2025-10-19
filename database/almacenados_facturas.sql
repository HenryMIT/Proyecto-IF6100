USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- ========================================
-- PROCEDIMIENTOS PARA FACTURAS
-- ========================================

-- Función para crear nueva factura
DROP FUNCTION IF EXISTS nuevaFactura$$
CREATE FUNCTION nuevaFactura (
    _id_usuario INT,
    _comentario TEXT
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _id_factura INT;
    
    -- Verificar si existe el usuario
    SELECT COUNT(id) INTO _cant FROM Usuarios WHERE id = _id_usuario;
    
    IF _cant > 0 THEN
        INSERT INTO Facturas(id_usuario, fecha, comentario, estado, total) 
            VALUES (_id_usuario, NOW(), _comentario, 'NO ENTREGADO', 0.00);
        SET _id_factura = LAST_INSERT_ID();
    ELSE
        SET _id_factura = 0; -- Usuario no existe
    END IF;
    
    RETURN _id_factura;
END$$

-- Procedimiento para buscar factura por ID
DROP PROCEDURE IF EXISTS buscarFacturaPorId$$
CREATE PROCEDURE buscarFacturaPorId (_id_factura INT)
BEGIN
    SELECT f.*, u.correo AS usuario_correo
    FROM Facturas f
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    WHERE f.id_Factura = _id_factura;
END$$

-- Procedimiento para buscar facturas por usuario
DROP PROCEDURE IF EXISTS buscarFacturasPorUsuario$$
CREATE PROCEDURE buscarFacturasPorUsuario (_id_usuario INT)
BEGIN
    SELECT f.*, u.correo AS usuario_correo
    FROM Facturas f
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    WHERE f.id_usuario = _id_usuario
    ORDER BY f.fecha DESC;
END$$

-- Procedimiento para búsqueda avanzada en comentarios usando cadenaFiltro
DROP PROCEDURE IF EXISTS buscarFacturasAvanzado$$
CREATE PROCEDURE buscarFacturasAvanzado (_parametros VARCHAR(250), _campos VARCHAR(50))
BEGIN
    SET @sql = CONCAT(
        'SELECT f.*, u.correo AS usuario_correo ',
        'FROM Facturas f ',
        'INNER JOIN Usuarios u ON f.id_usuario = u.id ',
        'WHERE ', cadenaFiltro(_parametros, _campos),
        ' ORDER BY f.fecha DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- Procedimiento para buscar facturas por estado
DROP PROCEDURE IF EXISTS buscarFacturasPorEstado$$
CREATE PROCEDURE buscarFacturasPorEstado (_estado ENUM('ENTREGADO', 'NO ENTREGADO'))
BEGIN
    SELECT f.*, u.correo AS usuario_correo
    FROM Facturas f
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    WHERE f.estado = _estado
    ORDER BY f.fecha DESC;
END$$

-- Procedimiento para buscar facturas por rango de fechas
DROP PROCEDURE IF EXISTS buscarFacturasPorFecha$$
CREATE PROCEDURE buscarFacturasPorFecha (_fecha_inicio DATE, _fecha_fin DATE)
BEGIN
    SELECT f.*, u.correo AS usuario_correo
    FROM Facturas f
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    WHERE DATE(f.fecha) BETWEEN _fecha_inicio AND _fecha_fin
    ORDER BY f.fecha DESC;
END$$

-- Función para actualizar estado de factura
DROP FUNCTION IF EXISTS actualizarEstadoFactura$$
CREATE FUNCTION actualizarEstadoFactura (_id_factura INT, _estado ENUM('ENTREGADO', 'NO ENTREGADO')) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Factura) INTO _cant FROM Facturas WHERE id_Factura = _id_factura;
    IF _cant > 0 THEN
        UPDATE Facturas SET estado = _estado WHERE id_Factura = _id_factura;
    END IF;
    RETURN _cant;
END$$

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

-- Procedimiento para ver detalle completo de factura
DROP PROCEDURE IF EXISTS verDetalleFactura$$
CREATE PROCEDURE verDetalleFactura (_id_factura INT)
BEGIN
    SELECT 
        fp.*,
        p.descripcion AS producto_descripcion,
        p.precio AS producto_precio,
        p.descuento AS producto_descuento,
        c.nombre AS categoria_nombre
    FROM Factura_Productos fp
    INNER JOIN Productos p ON fp.id_Producto = p.id_Producto
    INNER JOIN Categoria_productos c ON p.id_Categoria = c.id_Categoria
    WHERE fp.id_Factura = _id_factura
    ORDER BY fp.id_factura_producto;
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

-- Procedimiento para listar facturas con resumen
DROP PROCEDURE IF EXISTS listarFacturasConResumen$$
CREATE PROCEDURE listarFacturasConResumen()
BEGIN
    SELECT 
        f.*,
        u.correo AS usuario_correo,
        COUNT(fp.id_factura_producto) AS total_productos,
        COALESCE(SUM(fp.cantidad), 0) AS total_items
    FROM Facturas f
    INNER JOIN Usuarios u ON f.id_usuario = u.id
    LEFT JOIN Factura_Productos fp ON f.id_Factura = fp.id_Factura
    GROUP BY f.id_Factura, f.id_usuario, f.fecha, f.comentario, f.estado, f.total, u.correo
    ORDER BY f.fecha DESC;
END$$

-- Función para obtener estadísticas de ventas
DROP PROCEDURE IF EXISTS estadisticasVentas$$
CREATE PROCEDURE estadisticasVentas (_fecha_inicio DATE, _fecha_fin DATE)
BEGIN
    SELECT 
        COUNT(f.id_Factura) AS total_facturas,
        SUM(f.total) AS ventas_totales,
        AVG(f.total) AS promedio_por_factura,
        COUNT(CASE WHEN f.estado = 'ENTREGADO' THEN 1 END) AS facturas_entregadas,
        COUNT(CASE WHEN f.estado = 'NO ENTREGADO' THEN 1 END) AS facturas_pendientes,
        SUM(CASE WHEN f.estado = 'ENTREGADO' THEN f.total ELSE 0 END) AS ventas_entregadas
    FROM Facturas f
    WHERE DATE(f.fecha) BETWEEN _fecha_inicio AND _fecha_fin;
END$$

DELIMITER ;

-- ========================================
-- RELLENO DE DATOS INICIALES - FACTURAS
-- ========================================

-- Insertar facturas de prueba (asumiendo que usuarios y productos ya existen)
SELECT nuevaFactura(1, 'Venta de cocina y accesorios para cliente nuevo') AS 'Factura 1';
SELECT nuevaFactura(2, 'Pedido de electrodomésticos para renovación de cocina') AS 'Factura 2';
SELECT nuevaFactura(1, 'Compra de refrigerador Samsung') AS 'Factura 3';

-- Agregar productos a las facturas (ajustar IDs según tus datos)
SELECT agregarProductoAFactura(1, 1, 1) AS 'Producto 1 a Factura 1'; -- Cocina
SELECT agregarProductoAFactura(1, 5, 1) AS 'Producto 2 a Factura 1'; -- Fregadero
SELECT agregarProductoAFactura(2, 3, 1) AS 'Producto 1 a Factura 2'; -- Refrigerador
SELECT agregarProductoAFactura(3, 3, 1) AS 'Producto 1 a Factura 3'; -- Refrigerador

-- Ver facturas creadas
SELECT * FROM Facturas ORDER BY fecha DESC;

-- ========================================
-- SCRIPTS DE PRUEBA - FACTURAS
-- ========================================

-- 1. PRUEBA: Buscar factura por ID
CALL buscarFacturaPorId(1);

-- 2. PRUEBA: Buscar facturas por usuario
CALL buscarFacturasPorUsuario(1);

-- 3. PRUEBA: Búsqueda avanzada en comentarios
CALL buscarFacturasAvanzado('cocina', 'comentario');
CALL buscarFacturasAvanzado('Samsung&refrigerador', 'comentario&comentario');

-- 4. PRUEBA: Buscar por estado
CALL buscarFacturasPorEstado('NO ENTREGADO');
CALL buscarFacturasPorEstado('ENTREGADO');

-- 5. PRUEBA: Buscar por rango de fechas
CALL buscarFacturasPorFecha(CURDATE(), CURDATE());

-- 6. PRUEBA: Ver detalle de factura
CALL verDetalleFactura(1);

-- 7. PRUEBA: Actualizar estado
SELECT actualizarEstadoFactura(1, 'ENTREGADO') AS 'Estado Actualizado';

-- 8. PRUEBA: Listar facturas con resumen
CALL listarFacturasConResumen();

-- 9. PRUEBA: Estadísticas de ventas
CALL estadisticasVentas(CURDATE(), CURDATE());

-- 10. VERIFICACIÓN: Ver estado final
SELECT * FROM Facturas ORDER BY fecha DESC;
SELECT * FROM Factura_Productos ORDER BY id_Factura;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN nuevaFactura():
0 = Usuario no existe
>0 = ID de la nueva factura creada

FUNCIÓN agregarProductoAFactura():
0 = Error (factura no existe, producto no existe, o stock insuficiente)
>0 = ID del detalle de factura creado

FUNCIÓN eliminarProductoDeFactura():
0 = Detalle no encontrado
1 = Eliminado exitosamente (stock devuelto)

FUNCIÓN actualizarEstadoFactura():
0 = Factura no encontrada
1 = Estado actualizado exitosamente

LÓGICA IMPLEMENTADA:
- Control de stock automático
- Cálculo automático de subtotales con descuentos
- Actualización automática del total de factura
- Devolución de stock al eliminar productos
- Búsquedas avanzadas con cadenaFiltro
- Estadísticas de ventas
- Resúmenes de facturas
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO
-- ========================================
/*
-- Crear nueva factura (fecha automática NOW(), estado automático 'NO ENTREGADO')
SELECT nuevaFactura(1, 'Pedido especial cliente VIP');

-- Agregar productos a factura
SELECT agregarProductoAFactura(1, 2, 1); -- 1 Cocina eléctrica
SELECT agregarProductoAFactura(1, 4, 1); -- 1 Congelador

-- Ver detalle completo
CALL verDetalleFactura(1);

-- Buscar facturas por comentario
CALL buscarFacturasAvanzado('VIP', 'comentario');

-- Estadísticas del mes
CALL estadisticasVentas('2025-10-01', '2025-10-31');

-- Cambiar estado cuando se entregue
SELECT actualizarEstadoFactura(1, 'ENTREGADO');
*/