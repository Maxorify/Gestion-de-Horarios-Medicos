from pydantic import BaseModel

class Usuario(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    rut: str
    email: str
    celular: str
    direccion: str
    rol_id: int
    especialidad_id: str
