// Componente de mapa Leaflet para la app del pasajero
// Muestra la posición del chofer en tiempo real y los puntos de origen/destino
import { useEffect, useRef } from 'react';

interface MapaProps {
  choferLat?:  number;
  choferLng?:  number;
  origenLat:   number;
  origenLng:   number;
  destinoLat:  number;
  destinoLng:  number;
}

// Cargamos Leaflet dinámicamente para evitar problemas con SSR
let L: any = null;

export default function MapaLeaflet({
  choferLat, choferLng,
  origenLat, origenLng,
  destinoLat, destinoLng,
}: MapaProps) {
  const mapRef      = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const choferMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cargar Leaflet solo en el browser
    import('leaflet').then((leaflet) => {
      L = leaflet.default;

      // Evitar inicializar dos veces
      if (mapRef.current) return;

      // Inyectar CSS de Leaflet
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current!, {
        center: [origenLat, origenLng],
        zoom:   14,
        zoomControl: false,
        attributionControl: false,
      });

      // Tiles OpenStreetMap (gratuitos, sin API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Ícono origen (azul)
      const iconOrigen = L.divIcon({
        className: '',
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#534AB7;border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3)">
        </div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });

      // Ícono destino (verde)
      const iconDestino = L.divIcon({
        className: '',
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#1D9E75;border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3)">
        </div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });

      // Ícono chofer (taxi)
      const iconChofer = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:#FAEEDA;border:3px solid #BA7517;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.25)">
          🚕
        </div>`,
        iconSize: [36, 36], iconAnchor: [18, 18],
      });

      // Marcadores
      L.marker([origenLat,  origenLng],  { icon: iconOrigen  }).addTo(map)
       .bindPopup('Punto de recogida');
      L.marker([destinoLat, destinoLng], { icon: iconDestino }).addTo(map)
       .bindPopup('Destino');

      // Línea de ruta
      L.polyline(
        [[origenLat, origenLng], [destinoLat, destinoLng]],
        { color: '#534AB7', weight: 3, dashArray: '6 8', opacity: 0.6 },
      ).addTo(map);

      // Marcador del chofer (si hay coordenadas)
      if (choferLat && choferLng) {
        choferMarkerRef.current = L.marker([choferLat, choferLng], { icon: iconChofer })
          .addTo(map)
          .bindPopup('Tu taxi');
        map.setView([choferLat, choferLng], 15);
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Solo mount/unmount

  // Actualizar posición del chofer en tiempo real
  useEffect(() => {
    if (!mapRef.current || !L || !choferLat || !choferLng) return;

    if (choferMarkerRef.current) {
      choferMarkerRef.current.setLatLng([choferLat, choferLng]);
    } else {
      const iconChofer = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:#FAEEDA;border:3px solid #BA7517;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.25)">🚕</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18],
      });
      choferMarkerRef.current = L.marker([choferLat, choferLng], { icon: iconChofer })
        .addTo(mapRef.current);
    }
    // Centrar suavemente en el chofer
    mapRef.current.panTo([choferLat, choferLng], { animate: true, duration: 0.8 });
  }, [choferLat, choferLng]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-gray-100"
      style={{ height: '200px' }}
    />
  );
}
