#!/bin/bash
# ════════════════════════════════════════════════════════════════
# CoopTaxi — Script de configuración inicial
# Uso: chmod +x setup.sh && ./setup.sh
# ════════════════════════════════════════════════════════════════

set -e  # Salir si algún comando falla

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       CoopTaxi — Setup inicial       ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Verificar prerequisitos ───────────────────────────────────
echo -e "${YELLOW}[1/6] Verificando prerequisitos...${NC}"

command -v docker   >/dev/null 2>&1 || { echo -e "${RED}✗ Docker no instalado${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}✗ Docker Compose no instalado${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker y Docker Compose encontrados${NC}"

# ── Verificar estructura de carpetas ─────────────────────────
echo -e "${YELLOW}[2/6] Verificando estructura del proyecto...${NC}"

for dir in cooptaxi-api cooptaxi-frontend cooptaxi-chofer cooptaxi-pasajero; do
  if [ ! -d "$dir" ]; then
    echo -e "${RED}✗ Carpeta '$dir' no encontrada${NC}"
    echo "  Asegúrate de haber descomprimido todos los ZIPs en la misma carpeta"
    exit 1
  fi
  echo -e "${GREEN}✓ $dir${NC}"
done

# ── Configurar variables de entorno ──────────────────────────
echo -e "${YELLOW}[3/6] Configurando variables de entorno...${NC}"

if [ ! -f ".env" ]; then
  cp .env.production .env
  echo -e "${YELLOW}⚠  Se creó .env desde .env.production"
  echo -e "   IMPORTANTE: Edita .env con tus valores reales antes de continuar${NC}"
  echo ""
  echo "   Variables críticas a cambiar:"
  echo "   - DATABASE_PASSWORD"
  echo "   - JWT_SECRET  (usa: openssl rand -base64 64)"
  echo "   - JWT_REFRESH_SECRET  (usa: openssl rand -base64 64)"
  echo "   - VITE_API_URL  (IP o dominio de tu servidor)"
  echo "   - VITE_WS_URL   (IP o dominio de tu servidor)"
  echo ""
  read -p "   ¿Continuar de todas formas con valores de ejemplo? (s/N): " resp
  if [[ ! "$resp" =~ ^[sS]$ ]]; then
    echo "  Edita .env y vuelve a ejecutar este script"
    exit 0
  fi
else
  echo -e "${GREEN}✓ .env ya existe${NC}"
fi

# ── Copiar migration al backend ───────────────────────────────
echo -e "${YELLOW}[4/6] Copiando migration inicial al backend...${NC}"

mkdir -p cooptaxi-api/src/migrations
if [ -f "migrations/1700000000000-InitialSchema.ts" ]; then
  cp migrations/1700000000000-InitialSchema.ts cooptaxi-api/src/migrations/
  echo -e "${GREEN}✓ Migration copiada${NC}"
fi

# Copiar nginx.conf y Dockerfiles a cada frontend
for app in cooptaxi-frontend cooptaxi-chofer cooptaxi-pasajero; do
  cp nginx/nginx.conf "$app/nginx.conf"
done

# Copiar Dockerfiles específicos
cp docker/Dockerfile.admin    cooptaxi-frontend/Dockerfile
cp docker/Dockerfile.chofer   cooptaxi-chofer/Dockerfile
cp docker/Dockerfile.pasajero cooptaxi-pasajero/Dockerfile
cp docker/.dockerignore       cooptaxi-frontend/.dockerignore
cp docker/.dockerignore       cooptaxi-chofer/.dockerignore
cp docker/.dockerignore       cooptaxi-pasajero/.dockerignore

echo -e "${GREEN}✓ Archivos de configuración copiados${NC}"

# ── Levantar base de datos y Redis ────────────────────────────
echo -e "${YELLOW}[5/6] Levantando PostgreSQL y Redis...${NC}"

docker compose -f docker/docker-compose.prod.yml --env-file .env up -d postgres redis

echo "  Esperando que la base de datos esté lista..."
sleep 8

# ── Ejecutar seed ─────────────────────────────────────────────
echo -e "${YELLOW}[6/6] Ejecutando seed de datos iniciales...${NC}"

docker compose -f docker/docker-compose.prod.yml --env-file .env \
  run --rm api npm run seed

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Setup completado exitosamente${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
echo "  Para levantar todos los servicios:"
echo -e "  ${BLUE}docker compose -f docker/docker-compose.prod.yml --env-file .env up -d${NC}"
echo ""
echo "  URLs disponibles:"
echo "  🔧 API:      http://localhost:3000/api"
echo "  📚 Swagger:  http://localhost:3000/api/docs"
echo "  🏢 Admin:    http://localhost:3001"
echo "  🚕 Chofer:   http://localhost:3002"
echo "  🧍 Pasajero: http://localhost:3003"
echo ""
echo "  Credenciales iniciales:"
echo "  👤 Admin:      admin@cooptaxi.com     / Admin1234!"
echo "  📡 Despacho:   despacho@cooptaxi.com  / Despacho123!"
echo "  🚕 Chofer:     r.morales@coop.com      / Chofer123!"
echo "  🧍 Pasajero:   pasajero@test.com       / Pasajero123!"
