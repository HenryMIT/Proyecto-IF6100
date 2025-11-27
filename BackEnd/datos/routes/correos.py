from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from databases import get_db
from schemas.correo import Correo_electronico
from services.email_Service import EmailMessage
from services.emailService_Test import send_email_test

router_correo = APIRouter(prefix="/correo", tags=["Correos_Electronicos"])

@router_correo.post("/enviar_correo")
def enviar_correo(correo: Correo_electronico):
    
    response = send_email_test(correo.destinatario, correo.asunto, correo.cuerpo)    
    return response