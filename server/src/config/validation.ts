import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(8080),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  JWT_SECRET: Joi.string().required(),
  CLIENT_URL: Joi.string().default('http://localhost:5173'),
});