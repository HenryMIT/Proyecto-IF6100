import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from databases import get_db
from auth.jwt import  create_access_token, create_code_token, create_refresh_token, jwt
from schemas.usuarios import UsuarioCambiarClave, UsuarioCreate, UsuarioRecuperar, UsuarioValidar, UsuarioRefreshToken
from services.emailService_Test import send_email_test 
from services.email_Service import send_email
from sqlalchemy import text
from config import settings

auth_router = APIRouter(prefix="/auth", tags=["auth"])

def modificar_token_refresh(id_usuario: int | str, tkRef:str, db: Session):
    sql = "SELECT modificarToken(:id_usuario, :token_refresh) as validacion"
    result = db.execute(
        text(sql),
    {
        "id_usuario": id_usuario, 
        "token_refresh": tkRef
     }).fetchone()                   
    db.commit()
    if result == None:
        return 0    
    return result.validacion

def verificar_token_refresh(id_usuario:int | str, tkRef:str, db: Session):
    sql = "CALL verificarTokenR(:id_usuario, :token_refresh)"
    result = db.execute(
        text(sql),
    {
        "id_usuario": id_usuario, 
        "token_refresh": tkRef
     }).fetchone()    
    if result == None:
        return 0
    return result.rol

def generar_Tokens(id_usuario:str, db: Session):
    
    obtener_datos = "Call obtenerDatosUsuario(:id_usuario)"
    param_id = {"id_usuario": id_usuario}
    datos = db.execute( text(obtener_datos), param_id).fetchone()._asdict()
    
    token_auth = create_access_token(
        sub = str(id_usuario), 
        nombre = datos["nombre"],
        apellido1= datos["primer_apellido"], 
        correo= datos["correo"], 
        rol = datos["rol"])    
    tkRef = create_refresh_token(sub = str(id_usuario))
    modificar_token_refresh(id_usuario, tkRef, db)    
    return token_auth, tkRef
    
    
@auth_router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):    
    
    autenticar = "SELECT autenticarUsuario(:correo, :clave) as es_valido"
    paramAutenticar = {"correo": form.username, "clave": form.password}
    
    idusuario = db.execute(text(autenticar), paramAutenticar).fetchone().es_valido    
    if idusuario == 0:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token_auth, tkRef = generar_Tokens(idusuario, db) 
     
    return {"access_token": token_auth,"tkRef": tkRef, "token_type": "bearer"}    
 
@auth_router.patch("/refreshToken")
def refresh_token( datos_Ref:UsuarioRefreshToken, db: Session = Depends(get_db)):    
    validacion = verificar_token_refresh(datos_Ref.id_usuario, datos_Ref.tkRef, db)    
    if validacion == 0:
        raise HTTPException(status_code=401, detail="Token de refresco inválido")        
    new_access_token, new_tkRef = generar_Tokens(datos_Ref.id_usuario, db)           
    return {"access_token": new_access_token,"tkRef": new_tkRef, "token_type": "bearer"}  

@auth_router.get("/obtenerUsuario")
def obtener_usuario(token: str, db: Session = Depends(get_db)):
    deToken = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    usuario = {
            "id": deToken["sub"],
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
        token_auth, tkRef = generar_Tokens(new_id, db)
        db.commit()
        return {"access_token": token_auth,"tkRef": tkRef, "token_type": "bearer"} 
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
    
@auth_router.delete("/cerrarSesion/{id_usuario}")
def cerrar_sesion(id_usuario: int, db: Session = Depends(get_db)):
    try:
        with db.begin():
            db.execute(
                text("SELECT cerrarSesion(:id_usuario)"),
                {"id_usuario": id_usuario}
            )
        return {"mensaje": "Sesión cerrada correctamente"}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Error en la base de datos")
    except Exception as e:
        print(e)  
    