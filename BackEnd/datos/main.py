# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from routes.contactos import router as contactos_router
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

# Endpoint principal
@app.get("/")
def root():
    return {"mensaje": "API Equipo Rummi funcionando correctamente"}
