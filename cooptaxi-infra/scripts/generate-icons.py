#!/usr/bin/env python3
"""
Genera iconos PNG para las tres PWAs sin dependencias externas.
Crea PNGs de color sólido (192x192 y 512x512) para cada app.

Uso:
  python3 generate-icons.py

Los iconos se copian automáticamente a public/ de cada app.
Puedes reemplazarlos con tu logo real manteniendo el mismo nombre.
"""

import struct, zlib, os, sys

def solid_png(width: int, height: int, r: int, g: int, b: int) -> bytes:
    """PNG de color sólido sin librerías externas."""
    def chunk(t: bytes, d: bytes) -> bytes:
        crc = zlib.crc32(t + d) & 0xFFFFFFFF
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', crc)

    sig  = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    row  = b'\x00' + bytes([r, g, b] * width)
    idat = chunk(b'IDAT', zlib.compress(row * height, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


APPS = [
    # directorio,           R    G    B      descripción
    ('cooptaxi-frontend',   83,  74,  183,  'Admin (morado)'),
    ('cooptaxi-chofer',     15, 110,   86,  'Chofer (verde oscuro)'),
    ('cooptaxi-pasajero',   29, 158,  117,  'Pasajero (verde)'),
]

base = os.path.dirname(os.path.abspath(__file__))
# Si se ejecuta desde la carpeta scripts, subir un nivel
if os.path.basename(base) == 'scripts':
    base = os.path.dirname(base)

print("🎨 Generando iconos PWA...\n")

for app_dir, r, g, b, desc in APPS:
    public = os.path.join(base, '..', app_dir, 'public')
    if not os.path.isdir(os.path.dirname(public)):
        print(f"⚠  {app_dir}/ no encontrado — saltando")
        continue

    os.makedirs(public, exist_ok=True)
    for size in (192, 512):
        path = os.path.join(public, f'icon-{size}.png')
        with open(path, 'wb') as f:
            f.write(solid_png(size, size, r, g, b))
        print(f"  ✅ {app_dir}/public/icon-{size}.png  ({desc})")

print("\n✓ Listo. Puedes reemplazar los .png con tu logo real.")
print("  Tamaños requeridos: 192×192 y 512×512 píxeles.")
