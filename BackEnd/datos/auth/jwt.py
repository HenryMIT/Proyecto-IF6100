# app/auth/jwt.py
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from config import settings


def create_access_token(sub: str, nombre:str, apellido1:str, correo: str, rol: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode = {"sub": sub,"nombre": nombre+" "+apellido1, "correo": correo, "rol": rol, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_refresh_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=2)
    to_encode = {"sub": sub, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_code_token(sub: int, id_usuario: int)->str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": str(sub), "id_usuario": id_usuario, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
    