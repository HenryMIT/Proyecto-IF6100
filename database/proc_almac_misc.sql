USE DB_Equipo_Rummi;
DELIMITER $$
DROP FUNCTION IF EXISTS cadenaFiltro$$
CREATE FUNCTION cadenaFiltro (
    _parametros VARCHAR(250),
    _campos VARCHAR(50)
) RETURNS VARCHAR(250)
DETERMINISTIC
BEGIN
    DECLARE _salida VARCHAR(250);
    SET @param = _parametros;
    SET @campos = _campos;
    SET @filtro = "";
    
    WHILE (LOCATE('&', @param) > 0) DO
        SET @valor = SUBSTRING_INDEX(@param, '&', 1);
        SET @param = SUBSTR(@param, LOCATE('&', @param)+1);
        SET @campo = SUBSTRING_INDEX(@campos, '&', 1);
        SET @campos = SUBSTR(@campos, LOCATE('&', @campos)+1);
        SET @filtro = CONCAT(@filtro, " `", @campo, "` LIKE '%", @valor, "%' AND");       
    END WHILE;
    
    -- Procesar el último elemento (sin &)
    IF LENGTH(@param) > 0 THEN
        SET @filtro = CONCAT(@filtro, " `", @campos, "` LIKE '%", @param, "%' AND");
    END IF;
    
    SET @filtro = TRIM(TRAILING 'AND' FROM @filtro);  
    RETURN @filtro;
END$$
DELIMITER ;