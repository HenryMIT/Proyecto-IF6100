import smtplib
from email.message import EmailMessage
from config import settings_service


def send_email(destinatario: str, asunto: str, cuerpo: str):
    try:
        # Configuración del servidor SMTP
        sender_email = settings_service.EMAIL_USER
        
        # Crear el mensaje de correo
        email = EmailMessage()
        email["From"] = settings_service.EMAIL_USER
        email["To"] = destinatario
        email["Subject"] = asunto
        email.set_content(cuerpo)

        # Enviar el correo
        smtp = smtplib.SMTP_SSL(settings_service.EMAIL_HOST)
        smtp.login(sender_email, settings_service.EMAIL_APP_CODE)
        smtp.sendmail(sender_email, destinatario, 
                        email.as_string()) 
        smtp.quit()
        return {"message": "OK"}
    except Exception as e:
        print("menssage:", str(e)) 
   
    