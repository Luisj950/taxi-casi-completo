import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN INICIAL — Crea todas las tablas del sistema CoopTaxi
 *
 * Cómo usar en producción:
 *   1. En app.module.ts: synchronize: false, migrationsRun: true
 *   2. npm run migration:run        (aplica esta migración)
 *   3. npm run migration:revert     (deshace si algo falla)
 *
 * Para generar nuevas migrations después de cambiar entities:
 *   npm run migration:generate -- src/migrations/NombreDescriptivo
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(qr: QueryRunner): Promise<void> {
    // Extensión UUID requerida por PostgreSQL
    await qr.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── ENUMs ────────────────────────────────────────────────
    await qr.query(`CREATE TYPE "users_rol_enum"           AS ENUM('ADMIN','DESPACHADOR','CHOFER','PASAJERO','MECANICO')`);
    await qr.query(`CREATE TYPE "users_estado_chofer_enum" AS ENUM('DISPONIBLE','EN_CARRERA','INACTIVO')`);
    await qr.query(`CREATE TYPE "carreras_estado_enum"     AS ENUM('PENDIENTE','ASIGNADA','EN_RUTA','COMPLETADA','CANCELADA')`);
    await qr.query(`CREATE TYPE "documentos_tipo_enum"     AS ENUM('LICENCIA','MATRICULA','SPPAT','RTV')`);
    await qr.query(`CREATE TYPE "cuotas_tipo_enum"         AS ENUM('MENSUAL','MULTA','ESPECIAL')`);
    await qr.query(`CREATE TYPE "cuotas_metodo_pago_enum"  AS ENUM('EFECTIVO','TRANSFERENCIA')`);
    await qr.query(`CREATE TYPE "incidentes_tipo_enum"     AS ENUM('PANICO','PASAJERO_CONFLICTIVO','ZONA_PELIGROSA','ACCIDENTE','OTRO')`);
    await qr.query(`CREATE TYPE "mant_tipo_enum"           AS ENUM('ACEITE','FRENOS','LLANTAS','GENERAL','OTRO')`);
    await qr.query(`CREATE TYPE "alta_demanda_estado_enum" AS ENUM('ACTIVO','RESUELTO')`);

    // ── TABLA: users ─────────────────────────────────────────
    await qr.query(`
      CREATE TABLE "users" (
        "id"                 UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "nombre"             VARCHAR(120) NOT NULL,
        "email"              VARCHAR(100) NOT NULL,
        "cedula"             VARCHAR(10),
        "telefono"           VARCHAR(15),
        "password_hash"      VARCHAR      NOT NULL,
        "rol"                "users_rol_enum"           NOT NULL DEFAULT 'CHOFER',
        "activo"             BOOLEAN      NOT NULL DEFAULT true,
        "rating_promedio"    FLOAT        NOT NULL DEFAULT 5,
        "total_carreras"     INT          NOT NULL DEFAULT 0,
        "posicion_cola"      INT          NOT NULL DEFAULT 0,
        "estado_chofer"      "users_estado_chofer_enum" DEFAULT 'INACTIVO',
        "fcm_token"          VARCHAR,
        "refresh_token_hash" VARCHAR,
        "created_at"         TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users"       PRIMARY KEY ("id")
      )
    `);

    // ── TABLA: vehiculos ─────────────────────────────────────
    await qr.query(`
      CREATE TABLE "vehiculos" (
        "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "socio_id"   UUID         NOT NULL,
        "placa"      VARCHAR(10)  NOT NULL,
        "marca"      VARCHAR(60)  NOT NULL,
        "modelo"     VARCHAR(60)  NOT NULL,
        "anio"       INT          NOT NULL,
        "color"      VARCHAR(30),
        "activo"     BOOLEAN      NOT NULL DEFAULT true,
        "km_actual"  INT,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vehiculos_placa" UNIQUE ("placa"),
        CONSTRAINT "PK_vehiculos"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehiculos_socio" FOREIGN KEY ("socio_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── TABLA: carreras ──────────────────────────────────────
    await qr.query(`
      CREATE TABLE "carreras" (
        "id"                   UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "pasajero_id"          UUID,
        "chofer_id"            UUID,
        "estado"               "carreras_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        "origen_lat"           FLOAT             NOT NULL,
        "origen_lng"           FLOAT             NOT NULL,
        "origen_descripcion"   VARCHAR(200),
        "destino_lat"          FLOAT             NOT NULL,
        "destino_lng"          FLOAT             NOT NULL,
        "destino_descripcion"  VARCHAR(200),
        "distancia_km"         FLOAT,
        "duracion_min"         INT,
        "tarifa"               NUMERIC(8,2),
        "calificacion"         INT,
        "comentario"           VARCHAR(300),
        "inicio_en_ruta"       TIMESTAMP,
        "fin_carrera"          TIMESTAMP,
        "created_at"           TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carreras"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_carreras_pasajero" FOREIGN KEY ("pasajero_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_carreras_chofer"   FOREIGN KEY ("chofer_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // ── TABLA: documentos ────────────────────────────────────
    await qr.query(`
      CREATE TABLE "documentos" (
        "id"                UUID                NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"           UUID,
        "vehiculo_id"       UUID,
        "tipo"              "documentos_tipo_enum" NOT NULL,
        "numero_documento"  VARCHAR(80),
        "fecha_vencimiento" DATE                NOT NULL,
        "alerta_enviada"    BOOLEAN             NOT NULL DEFAULT false,
        "created_at"        TIMESTAMP           NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documentos"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_documentos_user"     FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_documentos_vehiculo" FOREIGN KEY ("vehiculo_id")
          REFERENCES "vehiculos"("id") ON DELETE CASCADE
      )
    `);

    // ── TABLA: cuotas ────────────────────────────────────────
    await qr.query(`
      CREATE TABLE "cuotas" (
        "id"                UUID                   NOT NULL DEFAULT uuid_generate_v4(),
        "socio_id"          UUID                   NOT NULL,
        "tipo"              "cuotas_tipo_enum"      NOT NULL DEFAULT 'MENSUAL',
        "monto"             NUMERIC(8,2)            NOT NULL,
        "fecha_vencimiento" DATE                   NOT NULL,
        "pagada"            BOOLEAN                NOT NULL DEFAULT false,
        "fecha_pago"        TIMESTAMP,
        "metodo_pago"       "cuotas_metodo_pago_enum",
        "comprobante"       VARCHAR(60),
        "descripcion"       VARCHAR(200),
        "created_at"        TIMESTAMP              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuotas"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_cuotas_socio" FOREIGN KEY ("socio_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── TABLA: incidentes ────────────────────────────────────
    await qr.query(`
      CREATE TABLE "incidentes" (
        "id"          UUID                  NOT NULL DEFAULT uuid_generate_v4(),
        "chofer_id"   UUID,
        "carrera_id"  UUID,
        "tipo"        "incidentes_tipo_enum" NOT NULL,
        "descripcion" TEXT,
        "lat"         FLOAT,
        "lng"         FLOAT,
        "created_at"  TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incidentes"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_incidentes_chofer"   FOREIGN KEY ("chofer_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_incidentes_carrera"  FOREIGN KEY ("carrera_id")
          REFERENCES "carreras"("id") ON DELETE SET NULL
      )
    `);

    // ── TABLA: mantenimientos ────────────────────────────────
    await qr.query(`
      CREATE TABLE "mantenimientos" (
        "id"           UUID             NOT NULL DEFAULT uuid_generate_v4(),
        "vehiculo_id"  UUID             NOT NULL,
        "tipo"         "mant_tipo_enum" NOT NULL,
        "descripcion"  TEXT,
        "km_actual"    INT,
        "km_proximo"   INT,
        "costo"        NUMERIC(8,2),
        "fecha"        DATE,
        "created_at"   TIMESTAMP        NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mantenimientos"    PRIMARY KEY ("id"),
        CONSTRAINT "FK_mant_vehiculo"     FOREIGN KEY ("vehiculo_id")
          REFERENCES "vehiculos"("id") ON DELETE CASCADE
      )
    `);

    // ── TABLA: alta_demanda_eventos ──────────────────────────
    await qr.query(`
      CREATE TABLE "alta_demanda_eventos" (
        "id"                       UUID                    NOT NULL DEFAULT uuid_generate_v4(),
        "solicitudes_pendientes"   INT                     NOT NULL,
        "conductores_notificados"  INT                     NOT NULL DEFAULT 0,
        "conductores_respondieron" INT                     NOT NULL DEFAULT 0,
        "estado"                   "alta_demanda_estado_enum" NOT NULL DEFAULT 'ACTIVO',
        "resuelto_en"              TIMESTAMP,
        "created_at"               TIMESTAMP               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alta_demanda" PRIMARY KEY ("id")
      )
    `);

    // ── ÍNDICES para performance ─────────────────────────────
    await qr.query(`CREATE INDEX "IDX_users_rol"          ON "users"      ("rol")`);
    await qr.query(`CREATE INDEX "IDX_users_activo"       ON "users"      ("activo")`);
    await qr.query(`CREATE INDEX "IDX_users_estado"       ON "users"      ("estado_chofer")`);
    await qr.query(`CREATE INDEX "IDX_carreras_estado"    ON "carreras"   ("estado")`);
    await qr.query(`CREATE INDEX "IDX_carreras_chofer"    ON "carreras"   ("chofer_id")`);
    await qr.query(`CREATE INDEX "IDX_carreras_pasajero"  ON "carreras"   ("pasajero_id")`);
    await qr.query(`CREATE INDEX "IDX_carreras_fecha"     ON "carreras"   ("created_at")`);
    await qr.query(`CREATE INDEX "IDX_documentos_venc"    ON "documentos" ("fecha_vencimiento")`);
    await qr.query(`CREATE INDEX "IDX_documentos_alerta"  ON "documentos" ("alerta_enviada")`);
    await qr.query(`CREATE INDEX "IDX_cuotas_socio"       ON "cuotas"     ("socio_id")`);
    await qr.query(`CREATE INDEX "IDX_cuotas_pagada"      ON "cuotas"     ("pagada")`);
    await qr.query(`CREATE INDEX "IDX_cuotas_venc"        ON "cuotas"     ("fecha_vencimiento")`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    // Drop en orden inverso respetando FK
    await qr.query(`DROP TABLE IF EXISTS "alta_demanda_eventos"`);
    await qr.query(`DROP TABLE IF EXISTS "mantenimientos"`);
    await qr.query(`DROP TABLE IF EXISTS "incidentes"`);
    await qr.query(`DROP TABLE IF EXISTS "cuotas"`);
    await qr.query(`DROP TABLE IF EXISTS "documentos"`);
    await qr.query(`DROP TABLE IF EXISTS "carreras"`);
    await qr.query(`DROP TABLE IF EXISTS "vehiculos"`);
    await qr.query(`DROP TABLE IF EXISTS "users"`);
    await qr.query(`DROP TYPE IF EXISTS "alta_demanda_estado_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "mant_tipo_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "incidentes_tipo_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "cuotas_metodo_pago_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "cuotas_tipo_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "documentos_tipo_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "carreras_estado_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "users_estado_chofer_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "users_rol_enum"`);
  }
}
