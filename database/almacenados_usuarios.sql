USE DB_Equipo_Rummi;
DELIMITER $$
SET SQL_SAFE_UPDATES = 0;
-- Procedimiento para buscar usuario (ORIGINAL ADAPTADO)
DROP PROCEDURE IF EXISTS buscarUsuario$$
CREATE PROCEDURE buscarUsuario (_id INT(11), _id_usuario INT)
BEGIN
    SELECT * FROM Usuarios WHERE id_usuario = _id_usuario OR id = _id;
END$$

-- Función para crear nuevo usuario (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS nuevoUsuario$$
CREATE FUNCTION nuevoUsuario (
    _id_usuario INT,
    _correo VARCHAR(255),
    _rol INT,
    _clave VARBINARY(64)
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _id_administrador INT;
    
	INSERT INTO Usuarios(id_usuario, correo, rol, clave) 
		VALUES (_id_usuario, _correo, _rol, SHA2(_clave, 256));
    SET _id_administrador = LAST_INSERT_ID();
    
    RETURN _id_administrador;
END$$

-- Función para eliminar usuario (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS eliminarUsuario$$
CREATE FUNCTION eliminarUsuario (_id INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id) INTO _cant FROM Usuarios WHERE id = _id;
    IF _cant > 0 THEN
        DELETE FROM Usuarios WHERE id = _id;
    END IF;
    RETURN _cant;
END$$

-- Procedimiento para cambiar rol (ORIGINAL ADAPTADO)
DROP PROCEDURE IF EXISTS rolUsuario$$
CREATE PROCEDURE rolUsuario (
    _id_usuario INT, 
    _rol INT
) 
BEGIN 
    UPDATE Usuarios SET rol = _rol WHERE id_usuario = _id_usuario;
END$$

-- Procedimiento para cambiar contraseña (ORIGINAL: passwUsuario -> claveUsuario)
DROP PROCEDURE IF EXISTS claveUsuario$$
CREATE PROCEDURE claveUsuario (
    _id_usuario INT, 
    _clave VARBINARY(64)
) 
BEGIN 
    UPDATE Usuarios SET clave = _clave WHERE id_usuario = _id_usuario;
END$$

DELIMITER ;


-- ========================================
-- SCRIPTS DE PRUEBA - SOLO PROCEDIMIENTOS ORIGINALES
-- ========================================


-- 1. PRUEBA: Crear usuarios usando función nuevoUsuario (ORIGINAL)
SELECT nuevoUsuario(1005,'nuevoUsuarioadmin@hospital.com', 1,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856');
select * from usuarios;

-- 2. PRUEBA: Usuario duplicado (ORIGINAL - debe retornar 1 = ya existe)
SELECT nuevoUsuario(1005, 'nuevoUsuarioadmin@hospital.com', 1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856');
select * from usuarios;
-- 3. PRUEBA: Buscar usuario por ID o id_usuario (ORIGINAL)
CALL buscarUsuario(1, 0); -- Por ID
CALL buscarUsuario(0, 1005); -- Por id_usuario

-- 4. PRUEBA: Cambiar rol de usuario (ORIGINAL)
CALL rolUsuario(1005, 5);

-- 5. PRUEBA: Cambiar contraseña (ORIGINAL: passwUsuario -> claveUsuario)
CALL claveUsuario(1005, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859');

-- 6. PRUEBA: Eliminar usuario (ORIGINAL)
SELECT eliminarUsuario(1) AS 'Usuario Eliminado';

-- 7. VERIFICACIÓN: Buscar usuarios después de cambios
CALL buscarUsuario(0, 1002); -- Ver cambio de rol
CALL buscarUsuario(0, 1003); -- Ver cambio de contraseña

-- ========================================
-- LIMPIAR DATOS DE PRUEBA
-- ========================================
/*
DELETE FROM Usuarios WHERE id_usuario IN (1001, 1002, 1003);
*/