USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- Función para insertar nuevo contacto (TIPO OBLIGATORIO)
DROP FUNCTION IF EXISTS nuevoContacto$$
CREATE FUNCTION nuevoContacto (
    _nombre VARCHAR(100),
    _apellido VARCHAR(100),
    _correo VARCHAR(150),
    _mensaje TEXT,
    _tipo INT
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _id_mensaje INT;
    -- Estado por defecto TRUE, pero tipo es obligatorio
    INSERT INTO Contactos(nombre, apellido, correo, mensaje, fecha, estado, tipo) 
        VALUES (_nombre, _apellido, _correo, _mensaje, NOW(), TRUE, _tipo);
    SET _id_mensaje = LAST_INSERT_ID();
    RETURN _id_mensaje;
END$$

-- Función para insertar nuevo contacto con estado y tipo personalizados
DROP FUNCTION IF EXISTS nuevoContactoCompleto$$
CREATE FUNCTION nuevoContactoCompleto (
    _nombre VARCHAR(100),
    _apellido VARCHAR(100),
    _correo VARCHAR(150),
    _mensaje TEXT,
    _estado BOOLEAN,
    _tipo INT
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _id_mensaje INT;
    INSERT INTO Contactos(nombre, apellido, correo, mensaje, fecha, estado, tipo) 
        VALUES (_nombre, _apellido, _correo, _mensaje, NOW(), _estado, _tipo);
    SET _id_mensaje = LAST_INSERT_ID();
    RETURN _id_mensaje;
END$$

-- Función para eliminar contacto por ID
DROP FUNCTION IF EXISTS eliminarContacto$$
CREATE FUNCTION eliminarContacto (_id_mensaje INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Mensaje) INTO _cant FROM Contactos WHERE id_Mensaje = _id_mensaje;
    IF _cant > 0 THEN
        DELETE FROM Contactos WHERE id_Mensaje = _id_mensaje;
    END IF;
    RETURN _cant;
END$$

-- Procedimiento para buscar contactos por fecha (rango)
DROP PROCEDURE IF EXISTS buscarContactosPorFecha$$
CREATE PROCEDURE buscarContactosPorFecha (_fecha_inicio DATE, _fecha_fin DATE)
BEGIN
    SELECT * FROM Contactos 
    WHERE DATE(fecha) BETWEEN _fecha_inicio AND _fecha_fin
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por fecha específica
DROP PROCEDURE IF EXISTS buscarContactosPorFechaEspecifica$$
CREATE PROCEDURE buscarContactosPorFechaEspecifica (_fecha DATE)
BEGIN
    SELECT * FROM Contactos 
    WHERE DATE(fecha) = _fecha
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por correo (filtro de cadena - LIKE)
DROP PROCEDURE IF EXISTS buscarContactosPorCorreo$$
CREATE PROCEDURE buscarContactosPorCorreo (_filtro_correo VARCHAR(150))
BEGIN
    SELECT * FROM Contactos 
    WHERE correo LIKE CONCAT('%', _filtro_correo, '%')
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por correo exacto
DROP PROCEDURE IF EXISTS buscarContactosPorCorreoExacto$$
CREATE PROCEDURE buscarContactosPorCorreoExacto (_correo VARCHAR(150))
BEGIN
    SELECT * FROM Contactos 
    WHERE correo = _correo
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por estado
DROP PROCEDURE IF EXISTS buscarContactosPorEstado$$
CREATE PROCEDURE buscarContactosPorEstado (_estado BOOLEAN)
BEGIN
    SELECT * FROM Contactos 
    WHERE estado = _estado
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por tipo
DROP PROCEDURE IF EXISTS buscarContactosPorTipo$$
CREATE PROCEDURE buscarContactosPorTipo (_tipo INT)
BEGIN
    SELECT * FROM Contactos 
    WHERE tipo = _tipo
    ORDER BY fecha DESC;
END$$

-- Procedimiento para buscar contactos por estado y tipo
DROP PROCEDURE IF EXISTS buscarContactosPorEstadoYTipo$$
CREATE PROCEDURE buscarContactosPorEstadoYTipo (_estado BOOLEAN, _tipo INT)
BEGIN
    SELECT * FROM Contactos 
    WHERE estado = _estado AND tipo = _tipo
    ORDER BY fecha DESC;
END$$

-- Procedimiento para listar todos los contactos (con paginación opcional)
DROP PROCEDURE IF EXISTS listarContactos$$
CREATE PROCEDURE listarContactos (_limite INT, _offset INT)
BEGIN
    IF _limite > 0 THEN
        SELECT * FROM Contactos 
        ORDER BY fecha DESC
        LIMIT _limite OFFSET _offset;
    ELSE
        SELECT * FROM Contactos 
        ORDER BY fecha DESC;
    END IF;
END$$

-- Función para contar contactos por filtro de correo
DROP FUNCTION IF EXISTS contarContactosPorCorreo$$
CREATE FUNCTION contarContactosPorCorreo (_filtro_correo VARCHAR(150)) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cantidad INT;
    SELECT COUNT(id_Mensaje) INTO _cantidad FROM Contactos 
    WHERE correo LIKE CONCAT('%', _filtro_correo, '%');
    RETURN _cantidad;
END$$

-- Función para contar contactos por fecha
DROP FUNCTION IF EXISTS contarContactosPorFecha$$
CREATE FUNCTION contarContactosPorFecha (_fecha DATE) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cantidad INT;
    SELECT COUNT(id_Mensaje) INTO _cantidad FROM Contactos 
    WHERE DATE(fecha) = _fecha;
    RETURN _cantidad;
END$$

-- Función para actualizar estado de contacto
DROP FUNCTION IF EXISTS actualizarEstadoContacto$$
CREATE FUNCTION actualizarEstadoContacto (_id_mensaje INT, _estado BOOLEAN) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Mensaje) INTO _cant FROM Contactos WHERE id_Mensaje = _id_mensaje;
    IF _cant > 0 THEN
        UPDATE Contactos SET estado = _estado WHERE id_Mensaje = _id_mensaje;
    END IF;
    RETURN _cant;
END$$

-- Función para actualizar tipo de contacto
DROP FUNCTION IF EXISTS actualizarTipoContacto$$
CREATE FUNCTION actualizarTipoContacto (_id_mensaje INT, _tipo INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id_Mensaje) INTO _cant FROM Contactos WHERE id_Mensaje = _id_mensaje;
    IF _cant > 0 THEN
        UPDATE Contactos SET tipo = _tipo WHERE id_Mensaje = _id_mensaje;
    END IF;
    RETURN _cant;
END$$

-- Función para contar contactos por estado
DROP FUNCTION IF EXISTS contarContactosPorEstado$$
CREATE FUNCTION contarContactosPorEstado (_estado BOOLEAN) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cantidad INT;
    SELECT COUNT(id_Mensaje) INTO _cantidad FROM Contactos 
    WHERE estado = _estado;
    RETURN _cantidad;
END$$

-- Función para contar contactos por tipo
DROP FUNCTION IF EXISTS contarContactosPorTipo$$
CREATE FUNCTION contarContactosPorTipo (_tipo INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cantidad INT;
    SELECT COUNT(id_Mensaje) INTO _cantidad FROM Contactos 
    WHERE tipo = _tipo;
    RETURN _cantidad;
END$$

DELIMITER ;

-- ========================================
-- SCRIPTS DE PRUEBA - CONTACTOS
-- ========================================

-- Insertar contactos de prueba (TIPO OBLIGATORIO)
SELECT nuevoContacto('Juan', 'Perez', 'juan.perez@gmail.com', 'Consulta sobre productos disponibles', 1) AS 'Contacto 1 - Consulta';
SELECT nuevoContacto('Maria', 'Rodriguez', 'maria.rodriguez@hotmail.com', 'Pregunta sobre precios y descuentos', 2) AS 'Contacto 2 - Ventas';
SELECT nuevoContacto('Carlos', 'Martinez', 'carlos.martinez@yahoo.com', 'Problema con mi pedido anterior', 3) AS 'Contacto 3 - Queja';
SELECT nuevoContacto('Ana', 'Lopez', 'ana.lopez@gmail.com', 'Solicitud de información de entrega', 1) AS 'Contacto 4 - Consulta';
SELECT nuevoContacto('Roberto', 'Gonzalez', 'roberto.gonzalez@outlook.com', 'Queja sobre el servicio recibido', 3) AS 'Contacto 5 - Queja';

-- Usar función completa (con estado y tipo personalizados)
SELECT nuevoContactoCompleto('Pedro', 'Castro', 'pedro.castro@gmail.com', 'Mensaje con estado personalizado', FALSE, 4) AS 'Contacto Completo - Soporte';

-- Insertar contacto con fecha específica (ayer)
INSERT INTO Contactos(nombre, apellido, correo, mensaje, fecha, estado, tipo) 
VALUES ('Sofia', 'Vargas', 'sofia.vargas@gmail.com', 'Mensaje de ayer', DATE_SUB(NOW(), INTERVAL 1 DAY), TRUE, 2);

SELECT * FROM Contactos ORDER BY fecha DESC;

-- 1. PRUEBA: Buscar contactos por correo usando filtro de cadena
CALL buscarContactosPorCorreo('gmail'); -- Debe mostrar contactos con gmail
CALL buscarContactosPorCorreo('maria'); -- Debe mostrar contactos que contengan "maria"

-- 2. PRUEBA: Buscar contactos por correo exacto
CALL buscarContactosPorCorreoExacto('juan.perez@gmail.com');

-- 3. PRUEBA: Buscar contactos por fecha específica (hoy)
CALL buscarContactosPorFechaEspecifica(CURDATE());

-- 4. PRUEBA: Buscar contactos por rango de fechas (últimos 2 días)
CALL buscarContactosPorFecha(DATE_SUB(CURDATE(), INTERVAL 2 DAY), CURDATE());

-- 5. PRUEBA: Contar contactos por filtro de correo
SELECT contarContactosPorCorreo('gmail') AS 'Contactos con Gmail';
SELECT contarContactosPorCorreo('@') AS 'Total contactos con @';

-- 6. PRUEBA: Contar contactos por fecha
SELECT contarContactosPorFecha(CURDATE()) AS 'Contactos de hoy';

-- 7. PRUEBA: Listar todos los contactos
CALL listarContactos(0, 0); -- Sin límite

-- 8. PRUEBA: Listar contactos con paginación (3 por página, página 1)
CALL listarContactos(3, 0);

-- 9. PRUEBA: Buscar contactos por estado
CALL buscarContactosPorEstado(TRUE); -- Contactos activos
CALL buscarContactosPorEstado(FALSE); -- Contactos inactivos

-- 10. PRUEBA: Buscar contactos por tipo
CALL buscarContactosPorTipo(1); -- Tipo 1 (ej: Consultas)
CALL buscarContactosPorTipo(2); -- Tipo 2 (ej: Ventas)
CALL buscarContactosPorTipo(3); -- Tipo 3 (ej: Quejas)

-- 11. PRUEBA: Buscar contactos por estado y tipo
CALL buscarContactosPorEstadoYTipo(TRUE, 1); -- Activos tipo 1

-- 12. PRUEBA: Contar contactos por estado y tipo
SELECT contarContactosPorEstado(TRUE) AS 'Contactos Activos';
SELECT contarContactosPorEstado(FALSE) AS 'Contactos Inactivos';
SELECT contarContactosPorTipo(1) AS 'Tipo 1',
       contarContactosPorTipo(2) AS 'Tipo 2',
       contarContactosPorTipo(3) AS 'Tipo 3';

-- 13. PRUEBA: Actualizar estado y tipo
SELECT actualizarEstadoContacto(2, FALSE) AS 'Estado Actualizado';
SELECT actualizarTipoContacto(3, 1) AS 'Tipo Actualizado';

-- 14. PRUEBA: Eliminar contacto
SELECT eliminarContacto(1) AS 'Contacto Eliminado';

-- 15. VERIFICACIÓN: Ver estado final
SELECT * FROM Contactos ORDER BY fecha DESC;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN nuevoContacto():
Retorna el ID del mensaje insertado (id_Mensaje)
PARÁMETROS: nombre, apellido, correo, mensaje, tipo (OBLIGATORIO)
Estado por defecto: TRUE

FUNCIÓN nuevoContactoCompleto():
Retorna el ID del mensaje insertado (id_Mensaje)
PARÁMETROS: nombre, apellido, correo, mensaje, estado, tipo (AMBOS OBLIGATORIOS)

FUNCIÓN eliminarContacto():
0 = Contacto no encontrado
1 = Contacto eliminado exitosamente

FUNCIÓN actualizarEstadoContacto():
0 = Contacto no encontrado
1 = Estado actualizado exitosamente

FUNCIÓN actualizarTipoContacto():
0 = Contacto no encontrado
1 = Tipo actualizado exitosamente

FUNCIÓN contarContactosPorCorreo():
Retorna el número de contactos que coinciden con el filtro

FUNCIÓN contarContactosPorFecha():
Retorna el número de contactos de la fecha especificada

FUNCIÓN contarContactosPorEstado():
Retorna el número de contactos con el estado especificado

FUNCIÓN contarContactosPorTipo():
Retorna el número de contactos del tipo especificado

PROCEDIMIENTO listarContactos():
_limite = 0: Lista todos los contactos
_limite > 0: Lista con paginación usando _limite y _offset

VALORES SUGERIDOS:
estado: TRUE = Activo, FALSE = Inactivo
tipo: 1 = Consulta, 2 = Ventas, 3 = Quejas, 4 = Soporte
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO
-- ========================================
/*
-- Buscar todos los contactos de Gmail
CALL buscarContactosPorCorreo('gmail');

-- Buscar contactos que contengan "juan" en el correo
CALL buscarContactosPorCorreo('juan');

-- Obtener contactos de hoy
CALL buscarContactosPorFechaEspecifica(CURDATE());

-- Obtener contactos de la última semana
CALL buscarContactosPorFecha(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());

-- Paginación: 10 contactos por página, página 2
CALL listarContactos(10, 10);

-- Contar cuántos contactos hay con dominios específicos
SELECT contarContactosPorCorreo('gmail') AS Gmail,
       contarContactosPorCorreo('hotmail') AS Hotmail,
       contarContactosPorCorreo('yahoo') AS Yahoo;
*/

-- ========================================
-- LIMPIAR DATOS DE PRUEBA
-- ========================================
/*
DELETE FROM Contactos WHERE correo IN (
    'juan.perez@gmail.com',
    'maria.rodriguez@hotmail.com', 
    'carlos.martinez@yahoo.com',
    'ana.lopez@gmail.com',
    'roberto.gonzalez@outlook.com',
    'sofia.vargas@gmail.com'
);
*/
