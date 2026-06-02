# CoopTaxi — App del Pasajero (PWA)

App móvil progresiva para solicitar taxis de la cooperativa.

## Stack
React 18 + Vite + Tailwind CSS + TypeScript + vite-plugin-pwa

## Inicio rápido
```bash
npm install
cp .env.local.example .env.local
npm run dev   # → http://localhost:3003
```

## Pantallas

| Ruta | Descripción |
|---|---|
| `/login` | Login con email y contraseña |
| `/register` | Registro de cuenta nueva |
| `/home` | Solicitar taxi — origen, destino, tarifa estimada |
| `/esperando` | Buscando chofer con animación en tiempo real |
| `/en-ruta` | Viaje activo — GPS del chofer, info del conductor |
| `/calificar` | Calificación con estrellas y comentario rápido |

## Flujo completo
1. Pasajero ingresa origen (o usa GPS) y destino
2. Confirma — el sistema crea la carrera y busca chofer
3. Ve la pantalla de espera con animación pulsante
4. Cuando el chofer acepta → pasa automáticamente a "en ruta"
5. Ve el mapa con la posición del chofer en tiempo real (WebSocket)
6. Al llegar → califica al conductor con 1-5 estrellas

## Instalar como PWA
1. Abrir en Chrome/Safari → menú → "Añadir a pantalla de inicio"
2. Funciona offline con los datos cacheados por el service worker
