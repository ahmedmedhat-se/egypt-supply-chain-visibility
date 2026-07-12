import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      role: string;
      tokenVersion: number;
      [key: string]: any;
    };
  }
}
