# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.tests.userstest import router as users_router
from auth.authtest.routes import auth_router
from routes.contactos import router as contactos_router

app = FastAPI(title="API Equipo Rummi - Electrodomésticos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(contactos_router)

# TIP: usa Alembic para migraciones; evita crear tablas aquí en producción.
