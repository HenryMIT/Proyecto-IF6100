# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from routes.contactos import router as contactos_router
from routes.cliente import router as routercliente
from routes.administrador import router as administrador_router
from auth.authService import auth_router
from routes.productos import router as producto_router
from routes.facturas import router as routerfacturas
from routes.facturas_productos import router as routerfacturas_productos
from databases import get_db, engine

app = FastAPI(
    title="API Equipo Rummi - Electrodomésticos",
    description="API para gestión de electrodomésticos y equipos de cocina",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Incluir routers
app.include_router(contactos_router)
app.include_router(routercliente)
app.include_router(administrador_router)
app.include_router(auth_router)
app.include_router(producto_router)
app.include_router(routerfacturas)
app.include_router(routerfacturas_productos)

# Endpoint principal
@app.get("/")
def root():
    return {"mensaje": "API Equipo Rummi funcionando correctamente"}
