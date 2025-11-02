USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- Procedimiento para buscar administrador (ORIGINAL ADAPTADO)
DROP PROCEDURE IF EXISTS buscarAdministrador$$
CREATE PROCEDURE buscarAdministrador (_id INT(11))
BEGIN
    SELECT * FROM Administradores WHERE id = _id;
END$$

DROP PROCEDURE IF EXISTS filtrarAdministrador$$
CREATE PROCEDURE filtrarAdministrador (
    _nombre varchar(255),
    _primer_apellido varchar(255),
    _segundo_apellido varchar(255),
    _pagina SMALLINT UNSIGNED, 
    _cantRegs SMALLINT UNSIGNED)
begin	
	IF _nombre IS NULL OR _nombre = '' AND  _primer_apellido IS NULL OR _primer_apellido = '' AND  _segundo_apellido IS NULL OR _segundo_apellido = '' THEN
    SELECT * from Administradores LIMIT _pagina, _cantRegs;
    ELSE 
		SELECT * from Administradores
		WHERE nombre LIKE CONCAT('%', _nombre,'%') 
		OR primer_apellido LIKE CONCAT('%', _primer_apellido, '%')
		OR segundo_apellido LIKE CONCAT('%', _segundo_apellido, '%')
        LIMIT _pagina, _cantRegs;   
	END IF;
end$$

-- Función para crear nuevo administrador (USA CONTADORES)
DROP FUNCTION IF EXISTS nuevoAdministrador$$
CREATE FUNCTION nuevoAdministrador (
    _nombre VARCHAR(25),
    _primer_apellido VARCHAR(25),
    _segundo_apellido VARCHAR(25),
    _correo VARCHAR(255),
    _telefono VARCHAR(8)
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _nuevo_id INT;
    
    -- Incrementar el contador de administradores
    UPDATE counters SET val = val + 1 WHERE name = 'id_administrador';
    
    -- Obtener el nuevo ID del contador
    SELECT val INTO _nuevo_id FROM counters WHERE name = 'id_administrador';
    
    -- Insertar administrador con el ID del contador
    INSERT INTO Administradores(id, nombre, primer_apellido, segundo_apellido, correo, telefono) 
		VALUES (_nuevo_id, _nombre, _primer_apellido, _segundo_apellido, _correo, _telefono);
    
    RETURN _nuevo_id;
END$$

-- Función para eliminar administrador por ID (clave primaria) (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS eliminarAdministrador$$
CREATE FUNCTION eliminarAdministrador (_id INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id) INTO _cant FROM Administradores WHERE id = _id;
    IF _cant > 0 THEN
        DELETE FROM Administradores WHERE id = _id;
    END IF;
    RETURN _cant;
END$$

-- Procedimiento para cambiar datos de administrador
DROP PROCEDURE IF EXISTS actualizarAdministrador$$
CREATE PROCEDURE actualizarAdministrador (  
	_id int,
    _nombre VARCHAR(25),
    _primer_apellido VARCHAR(25),
    _segundo_apellido VARCHAR(25),
    _correo VARCHAR(255),
    _telefono VARCHAR(8)
) 
BEGIN 
    UPDATE Administradores SET 
        nombre = _nombre,
        primer_apellido = _primer_apellido,
        segundo_apellido = _segundo_apellido,
        correo = _correo,
        telefono = _telefono
    WHERE id = _id;
END$$

-- ========================================
-- TRIGGER: Eliminar usuario cuando se elimina administrador
-- ========================================
DROP TRIGGER IF EXISTS trigger_eliminar_usuario_admin$$
CREATE TRIGGER trigger_eliminar_usuario_admin
    AFTER DELETE ON Administradores
    FOR EACH ROW
BEGIN
    -- Eliminar el usuario asociado al administrador eliminado
    DELETE FROM Usuarios WHERE id_usuario = OLD.id;
END$$

DELIMITER ;

-- ========================================
-- SCRIPTS DE PRUEBA - ADMINISTRADORES
-- ========================================

-- Insertar administradores de prueba
INSERT INTO Administradores (id_administrador, nombre, primer_apellido, segundo_apellido, correo, telefono) 
VALUES 
(2001, 'Carlos', 'Rodriguez', 'Martinez', 'carlos.admin@hospital.com', '88881111'),
(2002, 'Maria', 'Gonzalez', 'Lopez', 'maria.admin@hospital.com', '88882222'),
(2003, 'Juan', 'Perez', 'Castro', 'juan.admin@hospital.com', '88883333');

SELECT * FROM Administradores;

-- 1. PRUEBA: Crear nuevo administrador usando función
SELECT nuevoAdministrador(2004, 'Ana', 'Morales', 'Vega', 'ana.admin@hospital.com', '88884444') AS 'Nuevo Admin';

-- 2. PRUEBA: Administrador duplicado (debe retornar 1 = ya existe)
SELECT nuevoAdministrador(2001, 'Carlos', 'Duplicado', 'Test', 'carlos2@hospital.com', '88885555') AS 'Duplicado';

-- 3. PRUEBA: Buscar administrador por ID o id_administrador
CALL buscarAdministrador(1, 0); -- Por ID
CALL buscarAdministrador(0, 2002); -- Por id_administrador

-- 4. PRUEBA: Actualizar datos de administrador
CALL actualizarAdministrador(2002, 'Maria Fernanda', 'Gonzalez', 'Lopez', 'maria.nueva@hospital.com', '88889999');

-- 5. PRUEBA: Eliminar administrador por ID (clave primaria)
SELECT eliminarAdministrador(1) AS 'Admin Eliminado por ID';

-- 6. PRUEBA: Eliminar administrador por id_administrador
SELECT eliminarAdministradorPorId(2003) AS 'Admin Eliminado por id_administrador';

-- 7. VERIFICACIÓN: Ver estado final
SELECT * FROM Administradores;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN eliminarAdministrador():
0 = Administrador no encontrado
1 = Administrador eliminado exitosamente

FUNCIÓN eliminarAdministradorPorId():
0 = Administrador no encontrado
1 = Administrador eliminado exitosamente

FUNCIÓN nuevoAdministrador():
0 = Administrador creado exitosamente
>=1 = Administrador ya existe (por id_administrador)
*/

-- ========================================
-- LIMPIAR DATOS DE PRUEBA
-- ========================================
/*
DELETE FROM Administradores WHERE id_administrador IN (2001, 2002, 2003, 2004);
*/
