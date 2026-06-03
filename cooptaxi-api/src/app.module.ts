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
        host: '127.0.0.1',
        port: 5433,
        username: 'cooptaxi',
        password: 'supersecret',
        database: 'cooptaxi_db',
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),

    // ─── Redis + Bull (cola de despacho y jobs) ───────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host: '127.0.0.1',
          port: 6379,
        },
      } as any), // <-- AQUÍ ESTÁ LA MAGIA QUE DESTRABA EL ERROR
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