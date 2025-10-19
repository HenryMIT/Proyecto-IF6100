USE DB_Equipo_Rummi;

-- Desactivar modo seguro para permitir UPDATE sin columnas KEY
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

-- Función para agregar nueva categoría
DROP FUNCTION IF EXISTS nuevaCategoria$$
CREATE FUNCTION nuevaCategoria (_nombre VARCHAR(100)) RETURNS INT 
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _id_categoria INT;
    
    -- Verificar si ya existe la categoría
    SELECT COUNT(id_Categoria) INTO _cant FROM Categoria_productos WHERE nombre = _nombre;
    
    IF _cant < 1 THEN
        INSERT INTO Categoria_productos(nombre) VALUES (_nombre);
        SET _id_categoria = LAST_INSERT_ID();
    ELSE
        SET _id_categoria = 0; -- Ya existe
    END IF;
    
    RETURN _id_categoria;
END$$

-- Función para eliminar categoría
DROP FUNCTION IF EXISTS eliminarCategoria$$
CREATE FUNCTION eliminarCategoria (_id_categoria INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _cant INT;
    DECLARE _productos INT;
    DECLARE _resp INT;
    
    SET _resp = 0;
    
    -- Verificar si existe la categoría
    SELECT COUNT(id_Categoria) INTO _cant FROM Categoria_productos WHERE id_Categoria = _id_categoria;
    
    IF _cant > 0 THEN
        -- Verificar si tiene productos asociados
        SELECT COUNT(id_Producto) INTO _productos FROM Productos WHERE id_Categoria = _id_categoria;
        
        IF _productos = 0 THEN
            DELETE FROM Categoria_productos WHERE id_Categoria = _id_categoria;
            SET _resp = 1; -- Eliminado exitosamente
        ELSE
            SET _resp = 2; -- No se puede eliminar, tiene productos asociados
        END IF;
    END IF;
    
    RETURN _resp;
END$$

-- Procedimiento para listar todas las categorías
DROP PROCEDURE IF EXISTS listarCategorias$$
CREATE PROCEDURE listarCategorias()
BEGIN
    SELECT * FROM Categoria_productos ORDER BY nombre;
END$$

-- Función para buscar categoría por nombre
DROP FUNCTION IF EXISTS buscarCategoriaPorNombre$$
CREATE FUNCTION buscarCategoriaPorNombre (_nombre VARCHAR(100)) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE _id INT DEFAULT 0;
    SELECT id_Categoria INTO _id FROM Categoria_productos WHERE nombre = _nombre LIMIT 1;
    RETURN _id;
END$$

DELIMITER ;

-- ========================================
-- RELLENO DE DATOS INICIALES - CATEGORÍAS
-- ========================================

-- Insertar categorías para electrodomésticos y cocinas
SELECT nuevaCategoria('Cocinas') AS 'Categoria 1';
SELECT nuevaCategoria('Refrigeración') AS 'Categoria 2';
SELECT nuevaCategoria('Pilas') AS 'Categoria 3';
SELECT nuevaCategoria('Fregaderos') AS 'Categoria 4';
SELECT nuevaCategoria('Campanas') AS 'Categoria 5';
SELECT nuevaCategoria('Mesas') AS 'Categoria 6';
SELECT nuevaCategoria('Lavadoras') AS 'Categoria 7';
SELECT nuevaCategoria('Lavavajillas') AS 'Categoria 8';
SELECT nuevaCategoria('Hornos') AS 'Categoria 9';


-- Ver todas las categorías insertadas
SELECT * FROM Categoria_productos ORDER BY id_Categoria;

-- ========================================
-- SCRIPTS DE PRUEBA - CATEGORÍAS
-- ========================================

-- 1. PRUEBA: Agregar nueva categoría
SELECT nuevaCategoria('Extractores') AS 'Nueva Categoria';

-- 2. PRUEBA: Intentar agregar categoría duplicada (debe retornar 0)
SELECT nuevaCategoria('Cocinas') AS 'Categoria Duplicada';

-- 3. PRUEBA: Buscar categoría por nombre
SELECT buscarCategoriaPorNombre('Refrigeración') AS 'ID de Refrigeración';
SELECT buscarCategoriaPorNombre('No Existe') AS 'Categoria Inexistente';

-- 4. PRUEBA: Listar todas las categorías
CALL listarCategorias();

-- 5. PRUEBA: Eliminar categoría sin productos asociados
SELECT eliminarCategoria(11) AS 'Categoria Eliminada'; -- Mascotas

-- 6. PRUEBA: Intentar eliminar categoría inexistente
SELECT eliminarCategoria(999) AS 'Categoria Inexistente';

-- 7. VERIFICACIÓN: Ver estado final
SELECT * FROM Categoria_productos ORDER BY id_Categoria;

-- ========================================
-- INFORMACIÓN DE CÓDIGOS DE RETORNO
-- ========================================
/*
FUNCIÓN nuevaCategoria():
0 = Categoría ya existe
>0 = ID de la nueva categoría creada

FUNCIÓN eliminarCategoria():
0 = Categoría no encontrada
1 = Categoría eliminada exitosamente
2 = No se puede eliminar (tiene productos asociados)

FUNCIÓN buscarCategoriaPorNombre():
0 = Categoría no encontrada
>0 = ID de la categoría encontrada
*/

-- ========================================
-- EJEMPLOS DE USO PRÁCTICO
-- ========================================
/*
-- Agregar nueva categoría
SELECT nuevaCategoria('Nueva Categoría');

-- Verificar si existe antes de agregar
SELECT IF(buscarCategoriaPorNombre('Mi Categoría') = 0, 
    nuevaCategoria('Mi Categoría'), 
    'Ya existe') AS 'Resultado';

-- Listar todas
CALL listarCategorias();

-- Eliminar categoría vacía
SELECT eliminarCategoria(12);
*/

-- ========================================
-- DATOS ADICIONALES OPCIONALES
-- ========================================
/*
-- Si necesitas más categorías de electrodomésticos, descomenta estas líneas:

SELECT nuevaCategoria('Extractores') AS 'Extractores';
SELECT nuevaCategoria('Tostadoras') AS 'Tostadoras';
SELECT nuevaCategoria('Batidoras') AS 'Batidoras';
SELECT nuevaCategoria('Licuadoras') AS 'Licuadoras';
SELECT nuevaCategoria('Cafeteras') AS 'Cafeteras';
SELECT nuevaCategoria('Freidoras') AS 'Freidoras';
SELECT nuevaCategoria('Planchas') AS 'Planchas';
SELECT nuevaCategoria('Aspiradoras') AS 'Aspiradoras';
SELECT nuevaCategoria('Ventiladores') AS 'Ventiladores';
SELECT nuevaCategoria('Calentadores') AS 'Calentadores';

*/
