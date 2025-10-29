from fastapi import APIRouter, HTTPException
from src.models.users import Rol
from src.utils.supabase import supabase_client

user_router = APIRouter(tags=["User Data"], prefix="/users")

@user_router.post("/crear-rol")
async def crear_rol(rol: Rol):
    """
    Crea un nuevo rol en la tabla public.rol si no existe.
    Lanza error 409 si el nombre ya está registrado.
    """
    try:
        # 1) Verificar si ya existe
        existe = (
            supabase_client
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
        # Si Supabase devuelve JSON de error, pásalo textual para no perder el detalle
        raise HTTPException(status_code=500, detail=str(e))
@user_router.put("/modificar-rol/{rol_id}")
async def modificar_rol(rol_id: int, rol: Rol):
    """
    Modifica un rol existente según su ID.
    Lanza 404 si no existe el rol.
    Lanza 409 si se intenta cambiar a un nombre ya usado.
    """
    try:
        # Verificar existencia
        existente = (
            supabase_client
            .table("rol")
            .select("id, nombre")
            .eq("id", rol_id)
            .execute()
        )

        if not existente.data:
            raise HTTPException(status_code=404, detail=f"No existe el rol con ID {rol_id}.")

        # Verificar duplicado de nombre (otro rol con mismo nombre)
        duplicado = (
            supabase_client
            .table("rol")
            .select("id")
            .eq("nombre", rol.nombre)
            .neq("id", rol_id)
            .execute()
        )
        if duplicado.data:
            raise HTTPException(status_code=409, detail=f"Ya existe otro rol con nombre '{rol.nombre}'.")

        # Actualizar datos
        actualizado = (
            supabase_client
            .table("rol")
            .update({
                "nombre": rol.nombre,
                "descripcion": rol.descripcion
            })
            .eq("id", rol_id)
            .execute()
        )

        if not actualizado.data:
            raise HTTPException(status_code=500, detail="No se pudo actualizar el rol.")

        return {
            "mensaje": f"Rol '{rol.nombre}' modificado correctamente.",
            "rol_actualizado": actualizado.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@user_router.delete("/eliminar-rol/{rol_id}")
async def eliminar_rol(rol_id: int):
    """
    Elimina un rol existente por su ID.
    Lanza 404 si el rol no existe.
    """
    try:
        # Verificar existencia
        existe = (
            supabase_client
            .table("rol")
            .select("id, nombre")
            .eq("id", rol_id)
            .execute()
        )
        if not existe.data:
            raise HTTPException(status_code=404, detail=f"No existe el rol con ID {rol_id}.")

        nombre = existe.data[0]["nombre"]

        # Eliminar el rol
        eliminado = (
            supabase_client
            .table("rol")
            .delete()
            .eq("id", rol_id)
            .execute()
        )

        if not eliminado.data:
            raise HTTPException(status_code=500, detail="No se pudo eliminar el rol.")

        return {"mensaje": f"Rol '{nombre}' eliminado correctamente."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
