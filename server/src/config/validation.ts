import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(8081),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  RABBITMQ_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  COOKIE_SECRET: Joi.string().min(16).required(),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:5173'),
});
