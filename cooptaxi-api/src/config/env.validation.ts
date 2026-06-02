import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Base de datos
  DATABASE_HOST:     Joi.string().required(),
  DATABASE_PORT:     Joi.number().default(5432),
  DATABASE_USER:     Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME:     Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // JWT
  JWT_SECRET:              Joi.string().min(32).required(),
  JWT_EXPIRES_IN:          Joi.string().default('15m'),
  JWT_REFRESH_SECRET:      Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN:  Joi.string().default('7d'),

  // Firebase (opcionales en desarrollo)
  FIREBASE_PROJECT_ID:  Joi.string().optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().optional(),

  // Config de negocio
  PANIC_RADIUS_KM: Joi.number().default(2),
});
