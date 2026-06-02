# CoopTaxi — Tests unitarios

Tests unitarios para los módulos del backend que faltaban.

## Cómo integrar

Copia los archivos `.spec.ts` a la carpeta `test/` del backend:

```bash
cp *.spec.ts ../cooptaxi-api/test/
```

## Ejecutar tests

```bash
cd cooptaxi-api

# Todos los tests unitarios
npm run test:unit

# Un archivo específico
npx jest test/finanzas.service.spec.ts

# Con coverage
npm run test:cov

# En modo watch (durante desarrollo)
npx jest --watch
```

## Cobertura por módulo

| Módulo | Tests | Casos cubiertos |
|---|---|---|
| `auth.service` | 4 | login ok, credenciales inválidas, usuario inactivo, logout |
| `despacho.service` | 5 | solicitar, aceptar, rechazar, NotFoundException, BadRequest |
| `alta-demanda.service` | 7 | activar, no duplicar, resolver, respuesta conductor, límite notif |
| `finanzas.service` | 5 | crear cuota, listar, pagar, total pendiente, reporte |
| `documentos.service` | 6 | crear, listar con días, update, cron con push, sin token, alerta ya enviada |
| `flota.service` | 7 | crear vehiculo, listar con docs_vencidos, findOne, mantenimiento, km_proximo |
| `users.service` | 7 | crear, hash password, email duplicado, mora, rating acumulado, setEstado |

**Total: 41 tests unitarios**
