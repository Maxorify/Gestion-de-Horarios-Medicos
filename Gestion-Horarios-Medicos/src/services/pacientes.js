// src/services/pacientes.js
import { supabase } from '@/services/supabaseClient'

// split seguro: toma el último token como apellido “principal”
function splitNombre(full) {
  if (!full) return { nombre: '', apellido: '' }
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { nombre: parts[0], apellido: '' }
  const apellido = parts.pop()
  const nombre = parts.join(' ')
  return { nombre, apellido }
}

export async function listarPacientes() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombres_apellidos, rut, email, telefono')
    .order('id', { ascending: false })

  if (error) throw error

  // adapta a las columnas actuales del DataGrid
  const rows = (data || []).map(p => {
    const { nombre, apellido } = splitNombre(p.nombres_apellidos)
    return {
      id: p.id,
      rut: p.rut || '',
      nombre,
      apellido,
      correo: p.email || '',
      numero: p.telefono || '',
    }
  })
  return rows
}

export async function guardarPaciente(pacienteBD) {
  // pacienteBD ya viene armado desde tu modal
  const { data, error } = await supabase
    .from('pacientes')
    .insert([pacienteBD])
    .select('id, nombres_apellidos, rut, email, telefono')
    .single()

  if (error) throw error

  // retorno ya mapeado para el DataGrid
  const { nombre, apellido } = splitNombre(data.nombres_apellidos)
  return {
    id: data.id,
    rut: data.rut || '',
    nombre,
    apellido,
    correo: data.email || '',
    numero: data.telefono || '',
  }
}
