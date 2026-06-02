# CoopTaxi Frontend

Panel de administración y despacho — **React 18 + Vite + Tailwind CSS + TypeScript**

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| Estado global | Zustand (auth) |
| Servidor de estado | TanStack React Query |
| HTTP | Axios (con auto-refresh JWT) |
| WebSockets | Socket.io-client |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Íconos | Lucide React |

---

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.local.example .env.local
# Editar si tu backend no corre en localhost:3000

# 3. Arrancar en desarrollo
npm run dev
# → http://localhost:3001
```

> El backend debe estar corriendo en `http://localhost:3000` antes de iniciar el frontend.
> Asegúrate de haber ejecutado `npm run seed` en el backend para tener usuarios de prueba.

---

## Credenciales de prueba (requiere seed del backend)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@cooptaxi.com | Admin1234! |
| Despachador | despacho@cooptaxi.com | Despacho123! |
| Chofer | r.morales@coop.com | Chofer123! |

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx          # Login con validación Zod
│   ├── admin/
│   │   ├── DashboardPage.tsx      # Métricas, alertas, socios
│   │   ├── SociosPage.tsx         # CRUD completo de socios
│   │   ├── DocumentosPage.tsx     # Vencimientos con semáforo
│   │   ├── FinanzasPage.tsx       # Cuotas y modal de pago
│   │   ├── FlotaPage.tsx          # Vehículos de la cooperativa
│   │   └── IncidentesPage.tsx     # Registro de alertas
│   └── despacho/
│       ├── DespachoPage.tsx       # Central en tiempo real (WebSocket)
│       └── AltaDemandaPage.tsx    # Monitor y historial alta demanda
├── components/
│   ├── ui/index.tsx               # Button, Badge, Card, Modal, Input...
│   └── layout/AdminLayout.tsx     # Sidebar + Outlet
├── hooks/
│   └── useSocket.ts               # Hook Socket.io reutilizable
├── lib/
│   ├── api.ts                     # Cliente Axios con auto-refresh JWT
│   └── utils.ts                   # cn() helper
├── store/
│   └── auth.store.ts              # Zustand auth persistida
├── types/
│   └── index.ts                   # Tipos TypeScript del dominio
├── App.tsx                        # Router con rutas protegidas
└── main.tsx                       # Entry point
```

---

## Vistas disponibles

| Ruta | Vista | Roles |
|---|---|---|
| `/login` | Login | Público |
| `/admin` | Dashboard con métricas | Admin, Despachador |
| `/admin/socios` | CRUD de socios | Admin |
| `/admin/documentos` | Alertas de vencimiento | Admin, Despachador |
| `/admin/finanzas` | Cuotas y pagos | Admin |
| `/admin/flota` | Vehículos | Admin |
| `/admin/incidentes` | Registro de incidentes | Admin, Despachador |
| `/despacho` | Central de despacho (real-time) | Admin, Despachador |
| `/despacho/alta-demanda` | Monitor alta demanda | Admin, Despachador |

---

## Scripts

```bash
npm run dev        # Desarrollo con hot-reload en :3001
npm run build      # Compilar para producción
npm run preview    # Vista previa del build
npm run type-check # Verificar tipos TypeScript sin compilar
```

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | URL del backend REST |
| `VITE_WS_URL` | `http://localhost:3000` | URL del backend WebSocket |

---

## Próximas vistas (pendientes)

- App del chofer (móvil PWA) — estados de carrera, botón de pánico
- App del pasajero (móvil PWA) — solicitud, tracking en tiempo real
- Gráficas de reportes en el dashboard
