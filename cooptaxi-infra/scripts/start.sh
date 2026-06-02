#!/bin/bash
# Levanta todos los servicios de CoopTaxi
# Uso: ./scripts/start.sh

COMPOSE="docker compose -f docker/docker-compose.prod.yml --env-file .env"

case "${1:-up}" in
  up)
    echo "🚀 Levantando CoopTaxi..."
    $COMPOSE up -d
    echo ""
    echo "✓ Servicios activos:"
    echo "  API:      http://localhost:3000/api"
    echo "  Admin:    http://localhost:3001"
    echo "  Chofer:   http://localhost:3002"
    echo "  Pasajero: http://localhost:3003"
    ;;
  down)
    echo "🛑 Deteniendo CoopTaxi..."
    $COMPOSE down
    ;;
  restart)
    echo "🔄 Reiniciando CoopTaxi..."
    $COMPOSE down && $COMPOSE up -d
    ;;
  logs)
    $COMPOSE logs -f ${2:-api}
    ;;
  status)
    $COMPOSE ps
    ;;
  build)
    echo "🔨 Reconstruyendo imágenes..."
    $COMPOSE build --no-cache
    ;;
  *)
    echo "Uso: ./scripts/start.sh [up|down|restart|logs|status|build]"
    ;;
esac
