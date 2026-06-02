# CoopTaxi — Infraestructura y despliegue

Paquete de configuración para llevar CoopTaxi a producción.

---

## Estructura de carpetas esperada

```
cooptaxi/                        ← carpeta raíz del proyecto
├── cooptaxi-api/                ← backend NestJS (del ZIP api-v2)
├── cooptaxi-frontend/           ← panel admin (del ZIP frontend-v3)
├── cooptaxi-chofer/             ← app chofer (del ZIP chofer)
├── cooptaxi-pasajero/           ← app pasajero (del ZIP pasajero-v2)
├── cooptaxi-infra/              ← este paquete
│   ├── docker/
│   │   ├── docker-compose.prod.yml
│   │   ├── Dockerfile.admin
│   │   ├── Dockerfile.chofer
│   │   ├── Dockerfile.pasajero
│   │   ├── .dockerignore
│   │   └── .env.production
│   ├── migrations/
│   │   └── 1700000000000-InitialSchema.ts
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       ├── setup.sh             ← configuración inicial (una sola vez)
│       ├── start.sh             ← arranque diario
│       └── generate-icons.py   ← genera iconos PNG para PWA
└── .env                         ← creado por setup.sh desde .env.production
```

---

## Primer despliegue (una sola vez)

```bash
# 1. Descomprimir todos los ZIPs en la misma carpeta
unzip cooptaxi-api-v2.zip
unzip cooptaxi-frontend-v3.zip
unzip cooptaxi-chofer.zip
unzip cooptaxi-pasajero-v2.zip
unzip cooptaxi-infra.zip

# 2. Ejecutar el script de setup automático
cd cooptaxi-infra
chmod +x scripts/setup.sh scripts/start.sh
./scripts/setup.sh

# 3. Levantar todos los servicios
./scripts/start.sh up
```

---

## Uso diario

```bash
./scripts/start.sh up        # levantar todo
./scripts/start.sh down      # apagar todo
./scripts/start.sh restart   # reiniciar
./scripts/start.sh logs api  # ver logs del backend
./scripts/start.sh status    # estado de contenedores
./scripts/start.sh build     # reconstruir imágenes (tras cambios)
```

---

## Variables de entorno críticas

Edita `.env` antes del primer despliegue:

| Variable | Descripción | Cómo generarla |
|---|---|---|
| `DATABASE_PASSWORD` | Contraseña PostgreSQL | Inventar una segura |
| `JWT_SECRET` | Secreto para tokens de acceso | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | `openssl rand -base64 64` |
| `VITE_API_URL` | URL pública del backend | `http://TU_IP:3000/api` |
| `VITE_WS_URL` | URL WebSocket del backend | `http://TU_IP:3000` |

---

## Iconos PWA

Los iconos incluidos son de color sólido. Para usar tu logo real:

```bash
# Opción 1: Regenerar desde script (colores de la app)
python3 scripts/generate-icons.py

# Opción 2: Copiar tu logo
# Necesitas: icon-192.png (192×192px) y icon-512.png (512×512px)
cp tu-logo-192.png cooptaxi-chofer/public/icon-192.png
cp tu-logo-512.png cooptaxi-chofer/public/icon-512.png
# Repetir para cooptaxi-frontend y cooptaxi-pasajero
```

---

## Migrations de base de datos

```bash
# Aplicar migration inicial (primera vez)
cd cooptaxi-api && npm run migration:run

# Generar nueva migration tras cambiar entities
npm run migration:generate -- src/migrations/NombreDescriptivo

# Revertir última migration
npm run migration:revert
```

---

## Puertos

| Servicio | Puerto | Descripción |
|---|---|---|
| API REST | 3000 | Backend NestJS |
| Admin | 3001 | Panel admin + despachador |
| Chofer | 3002 | App PWA del conductor |
| Pasajero | 3003 | App PWA del pasajero |

---

## Credenciales iniciales (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@cooptaxi.com | Admin1234! |
| Despachador | despacho@cooptaxi.com | Despacho123! |
| Chofer | r.morales@coop.com | Chofer123! |
| Pasajero | pasajero@test.com | Pasajero123! |

**Cambia estas contraseñas inmediatamente en producción.**

---

## Requisitos del servidor

- Docker 24+ y Docker Compose v2
- 2 GB RAM mínimo (4 GB recomendado)
- 10 GB disco
- Puerto 3000, 3001, 3002, 3003 abiertos en el firewall
