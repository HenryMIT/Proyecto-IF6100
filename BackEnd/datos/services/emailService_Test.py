import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings_service_test

port = settings_service_test.EMAIL_PORT_TEST # Puerto para Mailtrap
smtp_server = settings_service_test.EMAIL_HOST_TEST
username = settings_service_test.EMAIL_USER_TEST
password = settings_service_test.EMAIL_PASSWORD_TEST

sender_email = "pruebas_equipos_rummi@example.com"

def send_email_test(destinatario: str, asunto: str, cuerpo: str):
    
    message = MIMEMultipart('alternative')
    message["From"] = sender_email
    message["To"] = destinatario
    message["Subject"] = asunto
    
    
    html = f"""
    <html>
      <body>    
        <h1>Correo de Prueba - Equipos Rummi</h1>
        <h2>{asunto}</h2>
        <p>{cuerpo}</p>    
        </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    message.attach(part)
    server = smtplib.SMTP(smtp_server, port)
    server.set_debuglevel(1)
    server.esmtp_features["auth"] = "LOGIN PLAIN"
    server.login(username, password)
    server.sendmail(sender_email, destinatario, message.as_string())
    return {"message": "Correo enviado exitosamente"}