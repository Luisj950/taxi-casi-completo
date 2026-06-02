# CoopTaxi — Archivos pendientes

Este paquete contiene los archivos que completan el sistema.
Cada archivo indica exactamente dónde copiarlo y qué modificar.

---

## 1. Historial del chofer

**Archivo:** `chofer/src/pages/HistorialPage.tsx`
**Copiar a:** `cooptaxi-chofer/src/pages/HistorialPage.tsx`

**Agregar al router** en `cooptaxi-chofer/src/App.tsx`:
```tsx
import HistorialPage from '@/pages/HistorialPage';

// Dentro de <Routes>:
<Route path="/historial" element={<Private><HistorialPage /></Private>} />
```

**Agregar botón en `HomePage.tsx`** del chofer (al final del contenido):
```tsx
import { useNavigate } from 'react-router-dom';
// ...
<button
  onClick={() => navigate('/historial')}
  className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3 active:bg-gray-50"
>
  <span className="text-sm font-medium text-gray-700">📋 Mi historial de carreras</span>
  <span className="text-gray-300">›</span>
</button>
```

---

## 2. Historial del pasajero

**Archivo:** `pasajero/src/pages/HistorialPage.tsx`
**Copiar a:** `cooptaxi-pasajero/src/pages/HistorialPage.tsx`

**Agregar al router** en `cooptaxi-pasajero/src/App.tsx`:
```tsx
import HistorialPage from '@/pages/HistorialPage';

// Dentro de <Routes>:
<Route path="/historial" element={<Private><HistorialPage /></Private>} />
```

**Agregar botón en `HomePage.tsx`** del pasajero (después de los destinos frecuentes):
```tsx
<button
  onClick={() => navigate('/historial')}
  className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 text-left active:bg-gray-50"
>
  <div className="flex items-center gap-3">
    <span className="text-xl">📋</span>
    <span className="text-sm text-gray-700 font-medium">Mis viajes anteriores</span>
  </div>
  <span className="text-gray-300 text-sm">›</span>
</button>
```

---

## 3. FlotaPage completa (CRUD vehículos + mantenimiento)

**Archivo:** `admin/src/pages/admin/FlotaPage.tsx`
**Copiar a:** `cooptaxi-frontend/src/pages/admin/FlotaPage.tsx`

Reemplaza completamente el archivo existente.
No requiere cambios en el router ni en el sidebar — ya está registrada.

**Funcionalidades nuevas que agrega:**
- Modal para crear vehículos con selector de socio propietario
- Vista de historial de mantenimiento por vehículo
- Modal para registrar mantenimiento (tipo, km, costo, fecha)
- Cálculo automático del próximo km de mantenimiento (+5000)
- Stats de docs vencidos y vehículos con alto kilometraje

---

## Resumen de cambios por proyecto

| Proyecto | Archivos nuevos | Archivos a modificar |
|---|---|---|
| `cooptaxi-chofer` | `HistorialPage.tsx` | `App.tsx`, `HomePage.tsx` |
| `cooptaxi-pasajero` | `HistorialPage.tsx` | `App.tsx`, `HomePage.tsx` |
| `cooptaxi-frontend` | — | `FlotaPage.tsx` (reemplazar) |
