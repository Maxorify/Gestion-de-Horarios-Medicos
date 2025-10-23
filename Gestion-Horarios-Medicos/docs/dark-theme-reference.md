# Guía rápida de contraste - Modo oscuro

Este documento resume las combinaciones de colores más utilizadas en el modo oscuro. Los valores provienen de `tokens("dark")` definidos en [`src/theme.js`](../src/theme.js).

| Uso | Fondo | Superficie | Borde | Texto principal | Texto secundario | Comentarios |
| --- | --- | --- | --- | --- | --- | --- |
| Pantalla / layout base | `primary[700]` (`#0d1423`) | `primary[600]` (`#121a2d`) | `primary[700]` (`#0d1423`) | `grey[100]` (`#f7f8fb`) | `grey[300]` (`#c9cee0`) | Contraste AA para texto ≥14 px, AAA para ≥18 px. |
| Paneles y tarjetas | `primary[600]` (`#121a2d`) | `primary[600]` - `primary[500]` (`#161f36`) | `primary[700]` (`#0d1423`) | `grey[100]` (`#f7f8fb`) | `grey[300]` (`#c9cee0`) | Aplicar sombras `rgba(5,8,15,0.65)` para separación. |
| Elementos elevados (modales, hover) | `primary[600]` (`#121a2d`) | `primary[400]` (`#435882`) | `blueAccent[700]` (`#164299`) | `grey[100]` (`#f7f8fb`) | `grey[200]` (`#e1e4ee`) | Usar `alpha(blueAccent[200], 0.45)` para estados hover. |
| Botones de acción | `blueAccent[600]` (`#205dcc`) | `blueAccent[500]` (`#2b78ff`) | `blueAccent[700]` (`#164299`) | `grey[100]` (`#f7f8fb`) | `grey[200]` (`#e1e4ee`) | Texto blanco mantiene contraste AAA. |
| Estados de éxito | `primary[600]` (`#121a2d`) | `greenAccent[500]` (`#2dd699`) | `greenAccent[700]` (`#197f57`) | `primary[900]` (`#05080f`) | `grey[900]` (`#1e2946`) | Preferir texto oscuro sobre superficies verdes. |
| Estados de error | `primary[600]` (`#121a2d`) | `redAccent[500]` (`#f32823`) | `redAccent[700]` (`#911715`) | `grey[100]` (`#f7f8fb`) | `grey[200]` (`#e1e4ee`) | Mantener padding suficiente para accesibilidad. |
| Scrollbar | — | `primary[400]` (`#435882`) | — | — | — | `thumb-hover`: `blueAccent[400]`, `thumb-active`: `greenAccent[500]`. |

## Recomendaciones

- Para fondos complejos, usar `alpha(primary[400], 0.35)` en overlays u hovers.
- Cuando se necesite una superficie neutra más clara, recurrir a `grey[800]` (`#3b4665`) con texto `grey[100]`.
- Los íconos en modo oscuro deben heredar `grey[100]` o `blueAccent[200]` en estados activos para garantizar contraste adecuado.
