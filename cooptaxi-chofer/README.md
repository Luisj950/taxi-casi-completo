# CoopTaxi — App del Chofer (PWA)

App móvil progresiva para conductores de la cooperativa.

## Stack
React 18 + Vite + Tailwind CSS + TypeScript + vite-plugin-pwa

## Inicio rápido
```bash
npm install
cp .env.local.example .env.local
npm run dev   # → http://localhost:3002
```

## Pantallas
| Ruta | Descripción |
|---|---|
| `/login` | Acceso solo para rol CHOFER |
| `/home` | Cola, estado, documentos, cuotas |
| `/carrera-incoming` | Carrera entrante con contador 60s |
| `/en-ruta` | GPS activo, respuestas rápidas, botón de pánico |
| `/completada` | Resumen, calificación recibida |

## Instalar como PWA en Android/iOS
1. Abrir en Chrome/Safari → menú → "Añadir a pantalla de inicio"
2. La app funciona offline con los datos cacheados
