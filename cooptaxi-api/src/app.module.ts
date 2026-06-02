import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DespachoModule } from './despacho/despacho.module';
import { SeguridadModule } from './seguridad/seguridad.module';
import { DocumentosModule } from './documentos/documentos.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { FlotaModule } from './flota/flota.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AltaDemandaModule } from './alta-demanda/alta-demanda.module';

@Module({
  imports: [
    // ─── Config (variables de entorno) ───────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),

    // ─── Base de datos PostgreSQL ─────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DATABASE_HOST'),
        port: cfg.get<number>('DATABASE_PORT'),
        username: cfg.get('DATABASE_USER'),
        password: cfg.get('DATABASE_PASSWORD'),
        database: cfg.get('DATABASE_NAME'),
        // Carga automática de entities — desactivar en producción
        autoLoadEntities: true,
        synchronize: cfg.get('NODE_ENV') !== 'production',
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),

    // ─── Redis + Bull (cola de despacho y jobs) ───────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host: cfg.get('REDIS_HOST'),
          port: cfg.get<number>('REDIS_PORT'),
        },
      }),
    }),

    // ─── Cron jobs (@Cron decorators) ────────────────
    ScheduleModule.forRoot(),

    // ─── Módulos de dominio ───────────────────────────
    AuthModule,
    UsersModule,
    DespachoModule,
    SeguridadModule,
    DocumentosModule,
    FinanzasModule,
    FlotaModule,
    NotificacionesModule,
    AltaDemandaModule,
  ],
})
export class AppModule {}
