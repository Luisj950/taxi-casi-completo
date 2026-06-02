import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Usado por el CLI de TypeORM para generar y correr migrations
// Uso: npx typeorm migration:generate -d src/data-source.ts src/migrations/NombreMigration
export default new DataSource({
  type: 'postgres',
  host:     process.env.DATABASE_HOST     ?? 'localhost',
  port:     Number(process.env.DATABASE_PORT) ?? 5432,
  username: process.env.DATABASE_USER     ?? 'cooptaxi',
  password: process.env.DATABASE_PASSWORD ?? '',
  database: process.env.DATABASE_NAME     ?? 'cooptaxi_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,   // NUNCA true en producción
  logging: true,
});
