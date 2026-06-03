/**
 * Seed script — crea datos iniciales para arrancar el sistema
 * Uso: npx ts-node src/seed.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

import { User, UserRol, EstadoChofer } from './users/entities/user.entity';
import { Vehiculo } from './flota/entities/vehiculo.entity';
import { Cuota, TipoCuota } from './finanzas/entities/cuota.entity';
import { Documento, TipoDocumento } from './documentos/entities/documento.entity';
const dayjs = require('dayjs');

const ds = new DataSource({
  type: 'postgres',
  host: '127.0.0.1',
  port: 5433,
  username: 'cooptaxi',
  password: 'supersecret',
  database: 'cooptaxi_db',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  logging: false,
});

async function seed() {
  await ds.initialize();
  console.log('📦 Conectado a la base de datos');

  const userRepo     = ds.getRepository(User);
  const vehiculoRepo = ds.getRepository(Vehiculo);
  const cuotaRepo    = ds.getRepository(Cuota);
  const docRepo      = ds.getRepository(Documento);

  // ─── Admin ──────────────────────────────────────────────
  const adminExiste = await userRepo.findOne({ where: { email: 'admin@cooptaxi.com' } });
  if (!adminExiste) {
    const admin = userRepo.create({
      nombre: 'Administrador',
      email: 'admin@cooptaxi.com',
      password_hash: await bcrypt.hash('Admin1234!', 12),
      rol: UserRol.ADMIN,
      activo: true,
    });
    await userRepo.save(admin);
    console.log('✅ Admin creado → admin@cooptaxi.com / Admin1234!');
  }

  // ─── Despachador ────────────────────────────────────────
  const despExiste = await userRepo.findOne({ where: { email: 'despacho@cooptaxi.com' } });
  if (!despExiste) {
    await userRepo.save(userRepo.create({
      nombre: 'Luis Valverde',
      email: 'despacho@cooptaxi.com',
      password_hash: await bcrypt.hash('Despacho123!', 12),
      rol: UserRol.DESPACHADOR,
      activo: true,
    }));
    console.log('✅ Despachador creado → despacho@cooptaxi.com / Despacho123!');
  }

  // ─── Choferes de ejemplo ────────────────────────────────
  const choferes = [
    { nombre: 'Roberto Morales', email: 'r.morales@coop.com',  placa: 'ABC-1234', rating: 4.8 },
    { nombre: 'Manuel Chimbo',   email: 'm.chimbo@coop.com',   placa: 'DEF-9012', rating: 4.9 },
    { nombre: 'Jorge Quito',     email: 'j.quito@coop.com',    placa: 'GHI-3456', rating: 4.4 },
    { nombre: 'Carlos Pulla',    email: 'c.pulla@coop.com',    placa: 'JKL-7890', rating: 4.7 },
    { nombre: 'Rosa Illescas',   email: 'r.illescas@coop.com', placa: 'MNO-1122', rating: 4.6 },
  ];

  for (let i = 0; i < choferes.length; i++) {
    const c = choferes[i];
    const existe = await userRepo.findOne({ where: { email: c.email } });
    if (existe) continue;

    const chofer = await userRepo.save(userRepo.create({
      nombre: c.nombre,
      email: c.email,
      cedula: `010${i}345678`,
      password_hash: await bcrypt.hash('Chofer123!', 12),
      rol: UserRol.CHOFER,
      activo: true,
      rating_promedio: c.rating,
      posicion_cola: i + 1,
      estado_chofer: EstadoChofer.DISPONIBLE,
    }));

    // Vehículo
    const vehiculo = await vehiculoRepo.save(vehiculoRepo.create({
      socio_id: chofer.id,
      placa: c.placa,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2020 + (i % 3),
      color: ['Blanco', 'Plata', 'Negro', 'Gris', 'Azul'][i],
      km_actual: 40000 + i * 5000,
    }));

    // Cuota mensual al día
    await cuotaRepo.save(cuotaRepo.create({
      socio_id: chofer.id,
      tipo: TipoCuota.MENSUAL,
      monto: 48.00,
      fecha_vencimiento: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      pagada: i !== 1,  // segundo chofer en mora
      descripcion: 'Cuota mensual Abril 2026',
    }));

    // Documentos
    await docRepo.save([
      docRepo.create({
        user_id: chofer.id,
        vehiculo_id: vehiculo.id,
        tipo: TipoDocumento.LICENCIA,
        fecha_vencimiento: dayjs().add(i === 0 ? 8 : 180, 'day').format('YYYY-MM-DD'),
      }),
      docRepo.create({
        user_id: chofer.id,
        vehiculo_id: vehiculo.id,
        tipo: TipoDocumento.SPPAT,
        fecha_vencimiento: dayjs().add(i === 1 ? 12 : 200, 'day').format('YYYY-MM-DD'),
      }),
      docRepo.create({
        user_id: chofer.id,
        vehiculo_id: vehiculo.id,
        tipo: TipoDocumento.MATRICULA,
        fecha_vencimiento: dayjs().add(240, 'day').format('YYYY-MM-DD'),
      }),
    ]);

    console.log(`✅ Chofer creado → ${c.email} / Chofer123!`);
  }

  // ─── Pasajero de prueba ─────────────────────────────────
  const pasExiste = await userRepo.findOne({ where: { email: 'pasajero@test.com' } });
  if (!pasExiste) {
    await userRepo.save(userRepo.create({
      nombre: 'Carlos Andrade',
      email: 'pasajero@test.com',
      password_hash: await bcrypt.hash('Pasajero123!', 12),
      rol: UserRol.PASAJERO,
      activo: true,
    }));
    console.log('✅ Pasajero creado → pasajero@test.com / Pasajero123!');
  }

  await ds.destroy();
  console.log('\n🚕 Seed completado. Puedes iniciar sesión con las credenciales de arriba.');
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
