# CoopTaxi API

API REST completa para cooperativa de taxis — **NestJS 10 + TypeScript + PostgreSQL + Redis**

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | NestJS 10 + TypeScript 5 |
| Base de datos | PostgreSQL 16 + TypeORM |
| Cola / Jobs | Bull + Redis 7 |
| Auth | JWT access + refresh · Passport |
| WebSockets | Socket.io · GPS en tiempo real · Pánico |
| Push | Firebase Admin SDK (FCM) |
| Cron | @nestjs/schedule · alertas de vencimiento |
| Docs | Swagger auto-generado en /api/docs |
| Tests | Jest · Supertest |
| Docker | Multi-stage build · docker-compose |

---

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL, Redis y Firebase

# 3. Levantar PostgreSQL + Redis con Docker
docker compose up -d

# 4. Poblar datos iniciales (admin, choferes, vehículos, documentos)
npm run seed

# 5. Arrancar en modo desarrollo
npm run start:dev
```

**URLs disponibles:**
- API → http://localhost:3000/api
- Swagger → http://localhost:3000/api/docs
- Redis UI → http://localhost:8081

---

## Credenciales del seed

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@cooptaxi.com | Admin1234! |
| Despachador | despacho@cooptaxi.com | Despacho123! |
| Chofer | r.morales@coop.com | Chofer123! |
| Pasajero | pasajero@test.com | Pasajero123! |

---

## Estructura del proyecto

```
src/
├── auth/                   # JWT, guards, Passport strategy
│   ├── decorators/         # @Roles()
│   ├── dto/                # LoginDto, RefreshDto
│   └── guards/             # JwtAuthGuard
├── users/                  # Socios y perfiles
│   ├── dto/
│   └── entities/
├── despacho/               # Cola equitativa + carreras
│   ├── dto/
│   ├── entities/
│   ├── queue/              # Bull processor
│   ├── despacho.gateway.ts # WebSocket GPS
│   ├── despacho.service.ts
│   └── despacho.controller.ts
├── seguridad/              # Pánico + incidentes
│   ├── entities/
│   └── seguridad.gateway.ts # WebSocket pánico
├── documentos/             # Licencias, SPPAT, RTV + cron
│   └── entities/
├── finanzas/               # Cuotas, multas, reportes
│   └── entities/
├── flota/                  # Vehículos + mantenimiento
│   └── entities/
├── notificaciones/         # FCM push
├── common/
│   ├── filters/            # AllExceptionsFilter
│   ├── guards/             # RolesGuard, ChoferActivoGuard
│   └── interceptors/       # LoggingInterceptor
├── config/
│   └── env.validation.ts   # Validación Joi al arranque
├── app.module.ts
├── main.ts
├── data-source.ts          # TypeORM CLI
└── seed.ts                 # Datos iniciales
test/
├── auth.service.spec.ts    # Tests unitarios auth
├── despacho.service.spec.ts # Tests unitarios despacho
├── auth.e2e-spec.ts        # Tests e2e
└── jest-e2e.json
```

---

## Scripts disponibles

```bash
npm run start:dev       # Desarrollo con hot-reload
npm run build           # Compilar para producción
npm run start           # Producción (requiere build previo)
npm run seed            # Poblar base de datos con datos de prueba
npm run test:unit       # Tests unitarios
npm run test:e2e        # Tests end-to-end
npm run test:cov        # Coverage
npm run migration:generate  # Generar migration desde entities
npm run migration:run       # Ejecutar migrations pendientes
npm run migration:revert    # Revertir última migration
```

---

## Módulos y endpoints

| Módulo | Ruta base | Endpoints principales |
|---|---|---|
| Auth | /api/auth | POST login, refresh, logout · GET me |
| Users | /api/users | GET / POST · GET/PATCH /:id · PATCH /:id/estado |
| Despacho | /api/despacho | POST carreras · PATCH carreras/:id/responder, /completar · GET cola |
| Seguridad | /api/seguridad | POST panico, incidentes · GET incidentes |
| Documentos | /api/documentos | GET / POST · PATCH /:id |
| Finanzas | /api/finanzas | GET/POST cuotas · POST cuotas/:id/pagar · GET reporte |
| Flota | /api/flota | GET/POST vehiculos · POST vehiculos/:id/mantenimiento |

---

## WebSocket events

**Namespace `/despacho`**

| Dirección | Evento | Descripción |
|---|---|---|
| cliente → | `join_queue` | Chofer entra a la cola |
| cliente → | `leave_queue` | Chofer sale de la cola |
| cliente → | `gps_update` | Coords cada ~5 seg durante carrera |
| cliente → | `join_central` | Despachador se conecta al panel |
| servidor → | `carrera_incoming` | Nueva carrera asignada al chofer |
| servidor → | `carrera_confirmada` | Notifica al pasajero que hay chofer |
| servidor → | `carrera_cancelada` | Carrera cancelada o timeout |
| servidor → | `cola_actualizada` | Broadcast a despachadores |

**Namespace `/seguridad`**

| Dirección | Evento | Descripción |
|---|---|---|
| cliente → | `panic_trigger` | Activa alerta de pánico |
| cliente → | `register_chofer` | Registra posición GPS del chofer |
| servidor → | `panic_alert` | Alerta a central + unidades cercanas |
| servidor → | `doc_warning` | Aviso de documento próximo a vencer |

---

## Roles y permisos

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso completo |
| `DESPACHADOR` | Cola, carreras, documentos (lectura), incidentes |
| `CHOFER` | Propias carreras, pánico, incidentes |
| `PASAJERO` | Solicitar carreras |
| `MECANICO` | Registro de mantenimiento de flota |

---

## Docker producción

```bash
# Build
docker build -t cooptaxi-api .

# Run (con variables de entorno)
docker run -p 3000:3000 --env-file .env cooptaxi-api
```
