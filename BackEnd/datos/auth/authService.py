from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from databases import get_db
from auth.jwt import hash_password, verify_password, create_access_token, jwt
from models.usuarios import Usuario
from schemas.usuarios import UsuarioCreate
from sqlalchemy import text
from config import settings

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
    usuario = db.execute(
                text("Call obtenerDatosUsuario(:id_usuario)"),
                {"id_usuario": idusuario}).fetchone()._asdict()
    rol = "Clientes" if usuario["rol"] == 1 else "Administradores"
    nombreCompleto = db.execute(
                text(f"SELECT nombre, primer_apellido FROM {rol} WHERE id = :id_usuario"),
                {"id_usuario": usuario["id_usuario"]}).fetchone()._asdict()
    
    token = create_access_token(sub = str(idusuario), nombre = nombreCompleto["nombre"],
                                     apellido1= nombreCompleto["primer_apellido"],
                                     correo= usuario["correo"], rol = usuario["rol"])
    
    return {"access_token": token, "token_type": "bearer"}
    # return { "ok": True,
    #          "id_usuario": idusuario}
   


@auth_router.get("/obtenerUsuario")
def obtener_usuario(token: str, db: Session = Depends(get_db)):
    deToken = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    usuario= {"id": deToken["sub"],
              "nombre": deToken["nombre"],
              "correo": deToken["correo"],
              "rol": deToken["rol"]
            }
    return usuario

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