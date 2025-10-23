# Resumen de ajustes recientes

## Qué ocurría
- Tras iniciar sesión con una cuenta administrativa el _Topbar_ intentaba leer el estado del modo oscuro directamente desde el tema sin utilizar el contexto compartido, lo que provocaba que el botón de cambio de tema dejara de funcionar y generara advertencias en consola.
- El componente `MisCitas` asumía que siempre existía una configuración válida de Supabase y que el usuario actual era un paciente, por lo que cuando se ingresaba con el rol de administrador el llamado RPC fallaba y se lanzaban errores que interrumpían la navegación del sidebar.

## Cómo se solucionó
- El `Topbar` ahora obtiene el flag de modo oscuro con `theme.palette.mode === "dark"` y usa `ColorModeContext` para invocar `toggleColorMode`, de manera que el botón vuelva a operar sin errores y con estilos coherentes en ambos temas.【F:src/components/Topbar.jsx†L30-L83】
- Se añadieron guardas en `MisCitas` para detectar cuando el usuario no es paciente o Supabase no está configurado; en esos casos se muestran mensajes amigables y se evita ejecutar RPCs que fallaban, manteniendo la navegación estable.【F:src/features/pacientes/pages/MisCitas.jsx†L1-L88】
- Se expuso el indicador `isSupabaseConfigured` junto con la advertencia correspondiente en `supabaseClient.js`, permitiendo que otras vistas decidan si deben omitir solicitudes remotas cuando faltan credenciales.【F:src/services/supabaseClient.js†L1-L17】
