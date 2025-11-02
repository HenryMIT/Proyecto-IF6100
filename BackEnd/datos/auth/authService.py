import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from databases import get_db
from auth.jwt import  create_access_token, create_code_token, jwt
from models.usuarios import Usuario
from schemas.usuarios import UsuarioCambiarClave, UsuarioCreate, UsuarioRecuperar, UsuarioValidar
from services.emailService_Test import send_email_test 
from services.email_Service import send_email
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
    
@auth_router.patch("/recoverPass")
def enviarCodigo(correo: UsuarioRecuperar, db: Session = Depends(get_db)):
    try:
        with db.begin():
            # Buscar usuario
            result = db.execute(
                text("SELECT id_usuario FROM Usuarios WHERE correo = :correo"),
                {"correo": correo.correo}
            ).fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Correo no encontrado")
            
            id_usuario = result.id_usuario
            codigo = random.randint(10000, 19999)
            tkcode = create_code_token(codigo, id_usuario)
            
            # Actualizar código
            db.execute(
                text("UPDATE Usuarios SET tkCode = :tkcode WHERE id_usuario = :id_usuario"),
                {"tkcode": tkcode, "id_usuario": id_usuario}
            )
            
            # Envio de codigo
            send_email_test(correo.correo, "Código de recuperación", f"Tu código es: {codigo}")  
                      
            return {"mensaje": "Código enviado correctamente"}            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Error al procesar la solicitud")
   
    
@auth_router.patch("/validarCodigo")
def validar(usuario: UsuarioValidar, db: Session = Depends(get_db)):   
    try:
        with db.begin():        
            result = db.execute(
                text("SELECT tkCode FROM Usuarios WHERE correo = :correo"), 
                {"correo": usuario.correo}
                ).fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Correo no encontrado")
            
            tkCode = result.tkCode
            deCode = jwt.decode(tkCode, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
            codigoValido = int(deCode["sub"]) 
                            
                   
            if codigoValido != usuario.codigo:
                raise HTTPException(status_code=401, detail="Codigo Incorrecto")        
            return {"mensaje": "Codigo Correcto"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Error al procesar la solicitud")    


@auth_router.patch("/changePass")
def cambiarPass(usuario: UsuarioCambiarClave, db: Session = Depends(get_db)):
    try: 
        with db.begin():        
            result = db.execute(text("SELECT tkCode FROM Usuarios WHERE correo = :correo"), {"correo": usuario.correo}).fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Correo no encontrado")
                                           
            tkCode = result.tkCode
            deCode = jwt.decode(tkCode, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
            
            codigoValido = int(deCode["sub"])
            id_usuario = deCode["id_usuario"]
                      
            if codigoValido != usuario.codigo:
                raise HTTPException(status_code=401, detail="Codigo Incorrecto")
            
            db.execute(text("CALL claveUsuario(:id_usuario, :clave)"), {"id_usuario": id_usuario, "clave":usuario.nueva_clave})
            
            return {"mensaje":"Recuperacion exitosa"}
    except SQLAlchemyError as e:        
        raise HTTPException(status_code=500, detail="Error en la base de datos")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Error al procesar la solicitud") 