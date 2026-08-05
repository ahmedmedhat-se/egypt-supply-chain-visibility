import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      path: '/ws',
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
    });
  }
}
