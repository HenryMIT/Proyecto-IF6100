"""
Prueba simple de conexión a MySQL
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from config import settings

# Crear conexión directa
DB_URL = (
    f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}"
    f"@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}?charset=utf8mb4"
)

print(f"Intentando conectar a: {DB_URL}")

try:
    engine = create_engine(DB_URL, pool_pre_ping=True)
    
    # Probar conexión
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        print(f"✅ Conexión exitosa: {row}")
        
        # Verificar base de datos actual
        result = conn.execute(text("SELECT DATABASE() as current_db"))
        db_row = result.fetchone()
        print(f"✅ Base de datos actual: {db_row.current_db}")
        
        # Verificar que la tabla Contactos existe
        result = conn.execute(text("SHOW TABLES LIKE 'Contactos'"))
        table_row = result.fetchone()
        if table_row:
            print(f"✅ Tabla Contactos encontrada: {table_row}")
        else:
            print("❌ Tabla Contactos no encontrada")
            
        # Verificar función nuevoContacto
        result = conn.execute(text("SHOW FUNCTION STATUS WHERE Name = 'nuevoContacto'"))
        function_rows = result.fetchall()
        if function_rows:
            print(f"✅ Función nuevoContacto encontrada: {len(function_rows)} resultados")
        else:
            print("❌ Función nuevoContacto no encontrada")
            
except Exception as e:
    print(f"❌ Error de conexión: {e}")