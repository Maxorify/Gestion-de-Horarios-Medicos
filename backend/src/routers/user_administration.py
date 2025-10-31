from fastapi import APIRouter, HTTPException, Query
from src.models.users import Rol, Usuario
from src.utils.supabase import supabase_client

user_router = APIRouter(tags=["Funciones de roles"], prefix="/Roles")

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


@user_router.post("/crear-usuario")
async def crear_usuario(usuario: Usuario):
    """
    Crea un nuevo usuario en la tabla usuario_sistema.
    Rut y email deben ser únicos.
    """
    try:
        # Verificar si ya existe rut o email
        existe = (
            supabase_client
            .table("usuario_sistema")
            .select("id")
            .or_(f"rut.eq.{usuario.rut},email.eq.{usuario.email}")
            .execute()
        )
        if existe.data:
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese rut o email.")

        nuevo = (
            supabase_client
            .table("usuario_sistema")
            .insert({
                "nombre": usuario.nombre,
                "apellido_paterno": usuario.apellido_paterno,
                "apellido_materno": usuario.apellido_materno,
                "rut": usuario.rut,
                "email": usuario.email,
                "celular": usuario.celular,
                "cel_secundario": usuario.cel_secundario,
                "direccion": usuario.direccion,
                "rol_id": usuario.rol_id
            })
            .execute()
        )
        if not nuevo.data:
            raise HTTPException(status_code=500, detail="No se pudo crear el usuario.")

        # Si tiene especialidad, agregar a especialidades_doctor
        if usuario.especialidad_id and usuario.especialidad_id != "":
            supabase_client.table("especialidades_doctor").insert({
                "usuario_sistema_id": nuevo.data[0]["id"],
                "especialidad_id": int(usuario.especialidad_id)
            }).execute()

        return {"mensaje": "Usuario creado correctamente.", "usuario": nuevo.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@user_router.put("/modificar-usuario/{usuario_id}")
async def modificar_usuario(usuario_id: int, usuario: Usuario):
    """
    Modifica los datos de un usuario existente.
    """
    try:
        existe = (
            supabase_client
            .table("usuario_sistema")
            .select("id")
            .eq("id", usuario_id)
            .execute()
        )
        if not existe.data:
            raise HTTPException(status_code=404, detail="No existe el usuario.")

        # Verificar duplicado de rut o email (en otro usuario)
        duplicado = (
            supabase_client
            .table("usuario_sistema")
            .select("id")
            .or_(f"rut.eq.{usuario.rut},email.eq.{usuario.email}")
            .neq("id", usuario_id)
            .execute()
        )
        if duplicado.data:
            raise HTTPException(status_code=409, detail="Ya existe otro usuario con ese rut o email.")

        actualizado = (
            supabase_client
            .table("usuario_sistema")
            .update({
                "nombre": usuario.nombre,
                "apellido_paterno": usuario.apellido_paterno,
                "apellido_materno": usuario.apellido_materno,
                "rut": usuario.rut,
                "email": usuario.email,
                "celular": usuario.celular,
                "direccion": usuario.direccion,
                "rol_id": usuario.rol_id
            })
            .eq("id", usuario_id)
            .execute()
        )
        if not actualizado.data:
            raise HTTPException(status_code=500, detail="No se pudo actualizar el usuario.")

        # Actualizar especialidad (en especialidades_doctor)
        if usuario.especialidad_id and usuario.especialidad_id != "":
            # Buscar si ya tiene registro
            reg = supabase_client.table("especialidades_doctor").select("id").eq("usuario_sistema_id", usuario_id).execute()
            if reg.data:
                supabase_client.table("especialidades_doctor").update({
                    "especialidad_id": int(usuario.especialidad_id)
                }).eq("usuario_sistema_id", usuario_id).execute()
            else:
                supabase_client.table("especialidades_doctor").insert({
                    "usuario_sistema_id": usuario_id,
                    "especialidad_id": int(usuario.especialidad_id)
                }).execute()
        else:
            # Si no se envía especialidad, eliminar registro si existe
            supabase_client.table("especialidades_doctor").delete().eq("usuario_sistema_id", usuario_id).execute()

        return {"mensaje": "Usuario modificado correctamente.", "usuario": actualizado.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@user_router.delete("/eliminar-usuario/{usuario_id}")
async def eliminar_usuario(usuario_id: int):
    """
    Elimina un usuario por su ID. Elimina también su especialidad si existe.
    """
    try:
        existe = (
            supabase_client
            .table("usuario_sistema")
            .select("id")
            .eq("id", usuario_id)
            .execute()
        )
        if not existe.data:
            raise HTTPException(status_code=404, detail="No existe el usuario.")

        # Eliminar especialidad si existe
        supabase_client.table("especialidades_doctor").delete().eq("usuario_sistema_id", usuario_id).execute()

        eliminado = (
            supabase_client
            .table("usuario_sistema")
            .delete()
            .eq("id", usuario_id)
            .execute()
        )
        if not eliminado.data:
            raise HTTPException(status_code=500, detail="No se pudo eliminar el usuario.")

        return {"mensaje": "Usuario eliminado correctamente."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@user_router.get("/listar-usuarios")
async def listar_usuarios():
    """
    Devuelve todos los usuarios existentes en la tabla 'usuario_sistema'.
    """
    try:
        res = (
            supabase_client
            .table("usuario_sistema")
            .select("*")
            .order("id", desc=False)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="No hay usuarios registrados.")
        return {"usuarios": res.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    


@user_router.get("/listar-roles")
async def listar_roles():
    """
    Devuelve todos los roles existentes en la tabla 'rol'.
    """
    try:
        res = (
            supabase_client
            .table("rol")
            .select("*")
            .order("id", desc=False)
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=404, detail="No hay roles registrados.")

        return {"roles": res.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))