USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$


-- Procedimiento para buscar cliente (ORIGINAL ADAPTADO)
DROP PROCEDURE IF EXISTS buscarCliente$$
CREATE PROCEDURE buscarCliente (_id INT)
BEGIN
    SELECT * FROM Clientes WHERE id = _id ;
END$$


DROP PROCEDURE IF EXISTS filtrarCliente$$
CREATE PROCEDURE filtrarCliente (
    _nombre varchar(255),
    _primer_apellido varchar(255),
    _segundo_apellido varchar(255),
    _pagina SMALLINT UNSIGNED, 
    _cantRegs SMALLINT UNSIGNED)
begin	
	IF _nombre IS NULL OR _nombre = '' AND  _primer_apellido IS NULL OR _primer_apellido = '' AND  _segundo_apellido IS NULL OR _segundo_apellido = '' THEN
    SELECT * from Clientes LIMIT _pagina, _cantRegs;
    ELSE 
		SELECT * from Clientes
		WHERE nombre LIKE CONCAT('%', _nombre,'%') 
		OR primer_apellido LIKE CONCAT('%', _primer_apellido, '%')
		OR segundo_apellido LIKE CONCAT('%', _segundo_apellido, '%')
        LIMIT _pagina, _cantRegs;   
	END IF;
end$$

-- Función para crear nuevo cliente (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS nuevoCliente$$
CREATE FUNCTION nuevoCliente (    
    _nombre VARCHAR(25),
    _primer_apellido VARCHAR(25),
    _segundo_apellido VARCHAR(25),
    _telefono VARCHAR(8),
    _direccion TEXT,
    _correo VARCHAR(255)
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _id_usuario INT;
    
    INSERT INTO Clientes(nombre, primer_apellido, segundo_apellido, telefono, direccion, correo) 
		VALUES (_nombre, _primer_apellido, _segundo_apellido, _telefono, _direccion, _correo);
	SET _id_usuario = LAST_INSERT_ID(); 		
    
    RETURN _id_usuario;
END$$

-- Función para editar cliente (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS editarCliente$$
CREATE FUNCTION editarCliente (
    _id INT,    
    _nombre VARCHAR(25),
    _primer_apellido VARCHAR(25),
    _segundo_apellido VARCHAR(25),
    _telefono VARCHAR(8),
    _direccion TEXT,
    _correo VARCHAR(255)
) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE no_encontrado INT DEFAULT 0;
    IF NOT EXISTS (SELECT 1 FROM Clientes WHERE id = _id) THEN
        SET no_encontrado = 1;
    ELSE
        UPDATE Clientes SET            
            nombre = _nombre,
            primer_apellido = _primer_apellido,
            segundo_apellido = _segundo_apellido,
            telefono = _telefono,
            direccion = _direccion,
            correo = _correo
        WHERE id = _id;
    END IF;
    RETURN no_encontrado;
END$$

-- Función para eliminar cliente por ID (clave primaria) (ORIGINAL ADAPTADO)
DROP FUNCTION IF EXISTS eliminarCliente$$
CREATE FUNCTION eliminarCliente (_id INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _resp INT;
    SET _resp = 0;
    SELECT COUNT(id) INTO _cant FROM Clientes WHERE id = _id;
    IF _cant > 0 THEN
        SET _resp = 1;
        -- Verificar si tiene facturas asociadas
        SELECT COUNT(id_Factura) INTO _cant FROM Facturas 
        WHERE id_usuario IN (SELECT id FROM Usuarios WHERE correo = (SELECT correo FROM Clientes WHERE id = _id));
        IF _cant = 0 THEN
            DELETE FROM Clientes WHERE id = _id;
        ELSE 
            SET _resp = 2; -- No se puede eliminar porque tiene facturas
        END IF;
    END IF;
    RETURN _resp;
END$$



DELIMITER ;

-- ========================================
-- SCRIPTS DE PRUEBA - CLIENTES
-- ========================================

-- Insertar clientes de prueba
INSERT INTO Clientes (id_cliente, nombre, primer_apellido, segundo_apellido, telefono, direccion, correo) 
VALUES 
(3001, 'Pedro', 'Ramirez', 'Solano', '88771111', 'San José, Costa Rica', 'pedro.cliente@email.com'),
(3002, 'Laura', 'Martinez', 'Vega', '88772222', 'Cartago, Costa Rica', 'laura.cliente@email.com'),
(3003, 'Roberto', 'Hernandez', 'Castro', '88773333', 'Alajuela, Costa Rica', 'roberto.cliente@email.com');

SELECT * FROM Clientes;

-- 1. PRUEBA: Crear nuevo cliente usando función
SELECT nuevoCliente(3004, 'Sofia', 'Lopez', 'Morales', '88774444', 'Heredia, Costa Rica', 'sofia.cliente@email.com') AS 'Nuevo Cliente';

-- 2. PRUEBA: Cliente duplicado por id_cliente (debe retornar 1 = ya existe)
SELECT nuevoCliente(3001, 'Pedro', 'Duplicado', 'Test', '88775555', 'Otra dirección', 'pedro2@email.com') AS 'Duplicado ID';

-- 3. PRUEBA: Cliente duplicado por correo (debe retornar 1 = ya existe)
SELECT nuevoCliente(3005, 'Otro', 'Cliente', 'Test', '88776666', 'Otra dirección', 'pedro.cliente@email.com') AS 'Duplicado Correo';

-- 4. PRUEBA: Buscar cliente por ID o id_cliente
CALL buscarCliente(1, 0); -- Por ID
CALL buscarCliente(0, 3002); -- Por id_cliente

-- 5. PRUEBA: Editar cliente existente
SELECT editarCliente(2, 3002, 'Laura Maria', 'Martinez', 'Vega', '88779999', 'Nueva dirección en Cartago', 'laura.nueva@email.com') AS 'Cliente Editado';

-- 6. PRUEBA: Editar cliente inexistente (debe retornar 1)
SELECT editarCliente(999, 9999, 'No', 'Existe', 'Cliente', '88888888', 'Sin dirección', 'noexiste@email.com') AS 'Cliente Inexistente';

-- 7. PRUEBA: Eliminar cliente sin facturas (por ID clave primaria)
SELECT eliminarCliente(1) AS 'Cliente Eliminado por ID';

-- 8. PRUEBA: Eliminar cliente sin facturas (por id_cliente)
SELECT eliminarClientePorIdCliente(3003) AS 'Cliente Eliminado por id_cliente';

-- 9. VERIFICACIÓN: Ver estado final
SELECT * FROM Clientes;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN eliminarCliente():
0 = Cliente no encontrado
1 = Cliente eliminado exitosamente
2 = Cliente no se puede eliminar (tiene facturas asociadas)

FUNCIÓN eliminarClientePorIdCliente():
0 = Cliente no encontrado
1 = Cliente eliminado exitosamente
2 = Cliente no se puede eliminar (tiene facturas asociadas)

FUNCIÓN editarCliente():
0 = Cliente editado exitosamente
1 = Cliente no encontrado

FUNCIÓN nuevoCliente():
0 = Cliente creado exitosamente
>=1 = Cliente ya existe (por id_cliente o correo)
*/

-- ========================================
-- LIMPIAR DATOS DE PRUEBA
-- ========================================
/*
DELETE FROM Clientes WHERE id_cliente IN (3001, 3002, 3003, 3004);
*/
