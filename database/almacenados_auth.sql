USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- ========================================
-- PROCEDIMIENTOS DE AUTENTICACIÓN - USUARIOS
-- ========================================

-- Procedimiento para verificar token de refresh (ADAPTADO)
DROP PROCEDURE IF EXISTS verificarTokenR$$
CREATE PROCEDURE verificarTokenR (_id_usuario VARCHAR(100), _tkRef VARCHAR(255))
BEGIN
    SELECT rol FROM Usuarios 
    WHERE (id_usuario = _id_usuario OR correo = _id_usuario) AND tkRef = _tkRef;
END$$

-- Función para modificar token 
DROP FUNCTION IF EXISTS modificarToken$$
CREATE FUNCTION modificarToken (_id_usuario VARCHAR(100), _tkRef VARCHAR(255)) 
RETURNS INT 
DETERMINISTIC 
READS SQL DATA 
BEGIN
    DECLARE _cant INT;
    
    SELECT COUNT(id_usuario) INTO _cant FROM Usuarios 
    WHERE id_usuario = _id_usuario OR correo = _id_usuario;
    
    IF _cant > 0 THEN
        UPDATE Usuarios SET
            tkRef = _tkRef
        WHERE id_usuario = _id_usuario OR correo = _id_usuario;
        
        IF _tkRef <> "" THEN
            UPDATE Usuarios SET
                ultimo_acceso = NOW()
            WHERE id_usuario = _id_usuario OR correo = _id_usuario;
        END IF;
    END IF;
    
    RETURN _cant;
END$$

-- Función para autenticar usuario (login)
DROP FUNCTION IF EXISTS autenticarUsuario$$
CREATE FUNCTION autenticarUsuario (_correo VARCHAR(255), _clave VARCHAR(255))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN    
    DECLARE _user_id INT;
    
    SELECT id_usuario INTO _user_id 
    FROM Usuarios 
    WHERE correo = _correo AND clave = SHA2(_clave, 256);
    
    IF _user_id > 0 THEN
        -- Actualizar último acceso
        UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = _user_id;
        RETURN _user_id; -- Retorna el ID del usuario autenticado
    ELSE
        RETURN 0; -- Usuario no encontrado o clave incorrecta
    END IF;
END$$

-- Función para obtener datos del usuario autenticado
DROP PROCEDURE IF EXISTS obtenerDatosUsuario$$
CREATE PROCEDURE obtenerDatosUsuario(_id_usuario INT)
BEGIN
    SELECT 
        u.id,
        if(u.rol = 1, c.nombre, a.nombre) AS nombre,
        if(u.rol = 1, c.primer_apellido, a.primer_apellido) AS primer_apellido,
        if(u.rol = 1, c.segundo_apellido, a.segundo_apellido) AS segundo_apellido, 
        u.id_usuario,
        u.rol,
        u.correo,
        u.ultimo_acceso,
        u.tkRef                
    FROM Usuarios u
    LEFT JOIN `Administradores` a ON u.id_usuario = a.id
    LEFT JOIN `Clientes` c ON u.id_usuario = c.id
    WHERE u.id_usuario = _id_usuario;
END$$

-- Función para cambiar contraseña
DROP FUNCTION IF EXISTS cambiarClave$$
CREATE FUNCTION cambiarClave (_id_usuario INT, _clave_actual VARCHAR(255), _clave_nueva VARCHAR(255))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE _cant INT;
    
    -- Verificar que la clave actual sea correcta
    SELECT COUNT(id) INTO _cant FROM Usuarios 
    WHERE id = _id_usuario AND clave = SHA2(_clave_actual, 256);
    
    IF _cant > 0 THEN
        -- Actualizar con la nueva clave
        UPDATE Usuarios SET 
            clave = SHA2(_clave_nueva, 256),
            ultimo_acceso = NOW()
        WHERE id = _id_usuario;
        RETURN 1; -- Clave cambiada exitosamente
    ELSE
        RETURN 0; -- Clave actual incorrecta
    END IF;
END$$

-- Función para resetear token (logout)
DROP FUNCTION IF EXISTS cerrarSesion$$
CREATE FUNCTION cerrarSesion (_id_usuario INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE _cant INT;
    
    SELECT COUNT(id) INTO _cant FROM Usuarios WHERE id = _id_usuario;
    
    IF _cant > 0 THEN
        UPDATE Usuarios SET tkRef = NULL WHERE id = _id_usuario;
        RETURN 1; -- Sesión cerrada exitosamente
    ELSE
        RETURN 0; -- Usuario no encontrado
    END IF;
END$$

-- Procedimiento para verificar sesión activa
DROP PROCEDURE IF EXISTS verificarSesion$$
CREATE PROCEDURE verificarSesion (_id_usuario INT, _tkRef VARCHAR(255))
BEGIN
    DECLARE _valido INT DEFAULT 0;
    
    SELECT COUNT(id) INTO _valido FROM Usuarios 
    WHERE id = _id_usuario AND tkRef = _tkRef AND tkRef IS NOT NULL;
    
    IF _valido > 0 THEN
        -- Actualizar último acceso si la sesión es válida
        UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = _id_usuario;
        
        SELECT 
            u.id,
            u.id_usuario,
            u.rol,
            u.correo,
            u.ultimo_acceso,
            'SESION_VALIDA' AS estado
        FROM Usuarios u
        WHERE u.id = _id_usuario;
    ELSE
        SELECT 'SESION_INVALIDA' AS estado;
    END IF;
END$$

-- Función para validar correo único (registro)
DROP FUNCTION IF EXISTS validarCorreoUnico$$
CREATE FUNCTION validarCorreoUnico (_correo VARCHAR(255))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE _cant INT;
    SELECT COUNT(id) INTO _cant FROM Usuarios WHERE correo = _correo;
    RETURN _cant; -- 0 = disponible, >0 = ya existe
END$$

-- Procedimiento para obtener usuarios por rol
DROP PROCEDURE IF EXISTS obtenerUsuariosPorRol$$
CREATE PROCEDURE obtenerUsuariosPorRol (_rol INT)
BEGIN
    SELECT 
        u.id,
        u.id_usuario,
        u.correo,
        u.ultimo_acceso,
        CASE 
            WHEN u.rol = 1 THEN 'Cliente'
            WHEN u.rol = 2 THEN 'Administrador'
            ELSE 'Usuario'
        END AS tipo_usuario,
        CASE 
            WHEN u.tkRef IS NOT NULL THEN 'Activa'
            ELSE 'Inactiva'
        END AS sesion_estado
    FROM Usuarios u
    WHERE u.rol = _rol
    ORDER BY u.ultimo_acceso DESC;
END$$

-- Función para limpiar sesiones expiradas (más de 24 horas)
DROP FUNCTION IF EXISTS limpiarSesionesExpiradas$$
CREATE FUNCTION limpiarSesionesExpiradas ()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE _cant INT;
    
    -- Contar sesiones que se van a limpiar
    SELECT COUNT(id) INTO _cant FROM Usuarios 
    WHERE tkRef IS NOT NULL 
    AND ultimo_acceso < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Limpiar tokens de sesiones expiradas
    UPDATE Usuarios SET tkRef = NULL 
    WHERE tkRef IS NOT NULL 
    AND ultimo_acceso < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    RETURN _cant; -- Número de sesiones limpiadas
END$$

DELIMITER ;

-- ========================================
-- RELLENO DE DATOS INICIALES - USUARIOS AUTH
-- ========================================

-- Insertar usuarios de prueba para autenticación
INSERT INTO Usuarios (id_usuario, rol, correo, clave, ultimo_acceso, tkRef) 
VALUES 
(1001, 2, 'admin@empresa.com', SHA2('admin123', 256), NOW(), NULL),
(1002, 1, 'cliente1@email.com', SHA2('cliente123', 256), NOW(), NULL),
(1003, 1, 'cliente2@email.com', SHA2('cliente123', 256), NOW(), NULL);

SELECT * FROM Usuarios;

-- ========================================
-- SCRIPTS DE PRUEBA - AUTENTICACIÓN
-- ========================================

-- 1. PRUEBA: Autenticar usuario (login)
SELECT autenticarUsuario('admin@empresa.com', 'admin123') AS 'ID Usuario Autenticado';
SELECT autenticarUsuario('cliente1@email.com', 'cliente123') AS 'ID Usuario Autenticado';
SELECT autenticarUsuario('noexiste@email.com', 'clave') AS 'Usuario Inexistente';

-- 2. PRUEBA: Obtener datos de usuario autenticado
CALL obtenerDatosUsuario(1);
CALL obtenerDatosUsuario(2);

-- 3. PRUEBA: Validar correo único
SELECT validarCorreoUnico('nuevo@email.com') AS 'Correo Disponible';
SELECT validarCorreoUnico('admin@empresa.com') AS 'Correo Ya Existe';

-- 4. PRUEBA: Modificar token (simular login exitoso)
SELECT modificarToken('admin@empresa.com', 'token_123_abc') AS 'Token Modificado';
SELECT modificarToken('cliente1@email.com', 'token_456_def') AS 'Token Cliente';

-- 5. PRUEBA: Verificar token de refresh
CALL verificarTokenR('admin@empresa.com', 'token_123_abc');
CALL verificarTokenR('cliente1@email.com', 'token_456_def');
CALL verificarTokenR('admin@empresa.com', 'token_incorrecto');

-- 6. PRUEBA: Verificar sesión activa
CALL verificarSesion(1, 'token_123_abc');
CALL verificarSesion(2, 'token_456_def');
CALL verificarSesion(1, 'token_incorrecto');

-- 7. PRUEBA: Cambiar contraseña
SELECT cambiarClave(1, 'admin123', 'nueva_clave_admin') AS 'Clave Cambiada';
SELECT cambiarClave(1, 'clave_incorrecta', 'otra_clave') AS 'Clave Actual Incorrecta';

-- 8. PRUEBA: Obtener usuarios por rol
CALL obtenerUsuariosPorRol(1); -- Clientes
CALL obtenerUsuariosPorRol(2); -- Administradores

-- 9. PRUEBA: Cerrar sesión (logout)
SELECT cerrarSesion(2) AS 'Sesion Cerrada';

-- 10. PRUEBA: Limpiar sesiones expiradas
SELECT limpiarSesionesExpiradas() AS 'Sesiones Limpiadas';

-- 11. VERIFICACIÓN: Ver estado final
SELECT * FROM Usuarios ORDER BY id;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN autenticarUsuario():
0 = Usuario no encontrado o clave incorrecta
>0 = ID del usuario autenticado

FUNCIÓN modificarToken():
0 = Usuario no encontrado
1 = Token modificado exitosamente

FUNCIÓN cambiarClave():
0 = Clave actual incorrecta
1 = Clave cambiada exitosamente

FUNCIÓN cerrarSesion():
0 = Usuario no encontrado
1 = Sesión cerrada exitosamente

FUNCIÓN validarCorreoUnico():
0 = Correo disponible
>0 = Correo ya existe

FUNCIÓN limpiarSesionesExpiradas():
Retorna el número de sesiones limpiadas

PROCEDIMIENTO verificarSesion():
Retorna datos del usuario si la sesión es válida
Retorna 'SESION_INVALIDA' si no es válida
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO - FLUJO COMPLETO
-- ========================================
/*
-- FLUJO DE LOGIN:
-- 1. Validar credenciales
SELECT autenticarUsuario('admin@empresa.com', 'admin123') AS user_id;

-- 2. Si es válido, generar y guardar token
SELECT modificarToken('admin@empresa.com', 'nuevo_token_jwt_123') AS token_updated;

-- 3. Obtener datos completos del usuario
CALL obtenerDatosUsuario(1);

-- FLUJO DE VERIFICACIÓN DE SESIÓN:
-- 1. Verificar token en cada request
CALL verificarSesion(1, 'nuevo_token_jwt_123');

-- 2. Verificar solo el rol (más rápido)
CALL verificarTokenR('admin@empresa.com', 'nuevo_token_jwt_123');

-- FLUJO DE LOGOUT:
-- 1. Cerrar sesión (limpiar token)
SELECT cerrarSesion(1);

-- MANTENIMIENTO:
-- 1. Limpiar sesiones expiradas (ejecutar periódicamente)
SELECT limpiarSesionesExpiradas();

-- REGISTRO DE NUEVO USUARIO:
-- 1. Validar que el correo esté disponible
SELECT validarCorreoUnico('nuevo@email.com');

-- 2. Si está disponible, crear usuario (usar procedimiento de usuarios)
-- SELECT nuevoUsuario(...);
*/
