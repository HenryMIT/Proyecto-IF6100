from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from databases import get_db
from auth.jwt import hash_password, verify_password, create_access_token
from models.usuarios import Usuario
from schemas.usuarios import UsuarioCreate
from sqlalchemy import text

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):    
    sql ="SELECT autenticarUsuario(:correo, :clave) as es_valido"
    idusuario = db.execute(
                text(sql),
                {"correo": form.username, "clave": form.password}
                )
    idusuario = idusuario.fetchone().es_valido 
      
    if idusuario == 0:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    user = db.execute(
        text("CALL obtenerDatosUsuario(:idusuario)"), 
        {"idusuario":idusuario}).mappings().first()
    
    token = create_access_token(sub={"sub": str(user.id_usuario)})       
    return {"access_token": token, "token_type": "bearer"}

@auth_router.post("/register")
def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):        
    try:
        sql = """
            SELECT nuevoCliente(
                :nombre, :apellido1, :apellido2,
                :telefono, :direccion, :correo
            ) AS id_cliente
        """
      
        clienteNuevo = db.execute(
            text(sql),
            usuario.model_dump()
        )
        new_id = clienteNuevo.fetchone().id_cliente
        sqlUsuario = """
            SELECT nuevoUsuario(
                :id_usuario, :correo,:rol, :clave
            )
        """
        db.execute(text(sqlUsuario),
            {
                "id_usuario": new_id,
                "correo": usuario.correo,
                "rol": 1,
                "clave": usuario.clave
            })
        
        
        db.commit()
        return {"id": new_id, "mensaje": "Usuario registrado exitosamente"}

    except Exception as e:
        db.rollback()
        print(e)
        raise HTTPException(status_code=400, detail="Error al registrar el usuario")