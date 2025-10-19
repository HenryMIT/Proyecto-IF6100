"""
Archivo de prueba para verificar la conexión a MySQL y probar endpoints de contactos
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Importar nuestros módulos
from databases import get_db, engine
from routes.contactos import router as contactos_router

# Crear la aplicación FastAPI
app = FastAPI(
    title="API Equipo Rummi - Prueba Contactos",
    description="API para gestión de electrodomésticos - Módulo de prueba",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir el router de contactos
app.include_router(contactos_router)

# Endpoint de prueba de conexión
@app.get("/")
def root():
    return {"mensaje": "API Equipo Rummi funcionando correctamente"}

@app.get("/test-conexion")
def test_conexion(db: Session = Depends(get_db)):
    """Endpoint para probar la conexión a la base de datos"""
    try:
        # Probar conexión básica
        result = db.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        
        # Probar que la base de datos correcta esté seleccionada
        result_db = db.execute(text("SELECT DATABASE() as current_db"))
        db_row = result_db.fetchone()
        
        return {
            "status": "Conexión exitosa",
            "test_query": row.test if row else None,
            "base_datos_actual": db_row.current_db if db_row else None,
            "motor_db": str(engine.url)
        }
    except Exception as e:
        return {
            "status": "Error de conexión",
            "error": str(e)
        }

@app.get("/test-procedimiento")
def test_procedimiento(db: Session = Depends(get_db)):
    """Endpoint para probar si los procedimientos almacenados están disponibles"""
    try:
        # Probar que el procedimiento nuevoContacto existe
        result = db.execute(
            text("SHOW FUNCTION STATUS WHERE Name = 'nuevoContacto'")
        )
        functions = result.fetchall()
        
        return {
            "status": "Procedimientos verificados",
            "funcion_nuevoContacto_existe": len(functions) > 0,
            "detalles": [dict(row._mapping) for row in functions] if functions else []
        }
    except Exception as e:
        return {
            "status": "Error al verificar procedimientos",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("test_app:app", host="127.0.0.1", port=8000, reload=True)