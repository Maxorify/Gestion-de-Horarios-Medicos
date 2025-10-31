from pydantic import BaseModel
from typing import List

class Usuario(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    rut: str
    email: str
    celular: str
    cel_secundario: str
    direccion: str
    rol_id: int
    especialidad_id: str

class Rol(BaseModel):
    nombre: str
    descripcion: str    

class Especialidad(BaseModel):
    nombre: str
    descripcion: str


class SubEspecialidad(BaseModel):
    nombre: str
    descripcion: str

class VinculoEspSub(BaseModel):
    especialidad_id: int
    sub_especialidad_id: int    


class VinculoEspSubBatch(BaseModel):
    especialidad_id: int
    sub_especialidad_ids: List[int]    