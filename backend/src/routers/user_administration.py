from fastapi import APIRouter, HTTPException
from src.models.users import Rol
from src.utils.supabase import supabase_client

user_router = APIRouter(tags=["User Data"], prefix="/administracion")

@user_router.get("/user-data")
async def user_data():
    pass

@user_router.get("/user-roles")
async def user_roles():
    pass





@user_router.post("/crear-rol")
async def crear_rol(rol: Rol):
    """
    Crea un nuevo rol en la tabla clinica.rol si no existe.
    Lanza error si el nombre ya está registrado.
    """
    try:
        # 1) Verificar si ya existe
        existe = (
            supabase_client
            .schema("clinica")
            .table("rol")
            .select("id, nombre")
            .eq("nombre", rol.nombre)
            .execute()
        )

        if existe.data:
            raise HTTPException(
                status_code=409,
                detail=f"El rol '{rol.nombre}' ya existe en el sistema."
            )

        # 2) Insertar nuevo rol
        nuevo = (
            supabase_client
            .schema("clinica")
            .table("rol")
            .insert({
                "nombre": rol.nombre,
                "descripcion": rol.descripcion
            })
            .execute()
        )

        if not nuevo.data:
            raise HTTPException(status_code=500, detail="No se pudo insertar el rol.")

        # 3) Obtener lista de roles actualizada
        roles_actuales = (
            supabase_client
            .schema("clinica")
            .table("rol")
            .select("id, nombre, descripcion")
            .order("id", desc=False)
            .execute()
        )

        return {
            "mensaje": f"Rol '{rol.nombre}' creado correctamente.",
            "roles_actuales": roles_actuales.data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
