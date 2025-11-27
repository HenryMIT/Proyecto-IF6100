from pydantic import BaseModel


class Correo_electronico(BaseModel):
    destinatario: str
    asunto: str
    cuerpo: str