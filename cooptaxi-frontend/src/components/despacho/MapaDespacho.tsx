import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface PosicionChofer {
  chofer_id:  string;
  nombre:     string;
  lat:        number;
  lng:        number;
  carrera_id?: string;
}

let L: any = null;
const markers: Record<string, any> = {};

export default function MapaDespacho() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const [posiciones, setPosiciones] = useState<PosicionChofer[]>([]);
  const { on } = useSocket('/despacho');

  // Recibir GPS de todos los choferes en tiempo real
  useEffect(() => {
    const off = on<PosicionChofer>('gps_chofer', (data) => {
      setPosiciones((prev) => {
        const idx = prev.findIndex((p) => p.chofer_id === data.chofer_id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [...prev, data];
      });
    });
    return off;
  }, [on]);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current) return;
    import('leaflet').then((leaflet) => {
      L = leaflet.default;
      if (mapRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current!, {
        center: [-2.9001, -79.0059], // Centro Cuenca Ecuador
        zoom:   13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      Object.keys(markers).forEach((k) => delete markers[k]);
    };
  }, []);

  // Actualizar marcadores cuando cambian posiciones
  useEffect(() => {
    if (!mapRef.current || !L) return;

    posiciones.forEach((pos) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:34px;height:34px;border-radius:50%;
          background:#EEEDFE;border:2.5px solid #534AB7;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">
          🚕
        </div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
      });

      if (markers[pos.chofer_id]) {
        markers[pos.chofer_id].setLatLng([pos.lat, pos.lng]);
      } else {
        markers[pos.chofer_id] = L.marker([pos.lat, pos.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<b>${pos.nombre ?? 'Chofer'}</b>`);
      }
    });
  }, [posiciones]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-gray-100"
        style={{ height: '340px' }}
      />
      {posiciones.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {posiciones.length} unidad{posiciones.length !== 1 ? 'es' : ''} con GPS activo
        </p>
      )}
      {posiciones.length === 0 && (
        <p className="text-xs text-gray-400 text-center">
          Esperando posiciones GPS de los choferes...
        </p>
      )}
    </div>
  );
}
