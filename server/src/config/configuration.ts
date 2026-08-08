export default () => ({
  port: parseInt(process.env.PORT || '', 10) || 8081,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'secret-key',
  },
  osrm: {
    url: process.env.OSRM_URL || 'http://localhost:5000/route/v1/driving',
    timeoutMs: parseInt(process.env.OSRM_TIMEOUT_MS || '', 10) || 8000,
  },
});
