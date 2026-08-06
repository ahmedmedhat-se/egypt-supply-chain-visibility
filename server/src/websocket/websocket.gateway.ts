import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

export interface SocketUser {
  sub: string;
  email: string | null;
  role: string;
  organizationId: string | null;
  sessionId: string;
}

export interface ShipmentEventPayload {
  shipment_id: string;
  reference_number?: string;
  old_status?: string;
  new_status?: string;
  status?: string;
  event_id?: string;
  occurred_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  estimated_arrival_at?: string | null;
  shipperOrganizationId?: string | null;
  carrierOrganizationId?: string | null;
  carrierUserId?: string | null;
}

@WebSocketGateway()
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        return this.authRequired(client);
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email?: string;
        role?: string;
        organizationId?: string;
        sessionId?: string;
      }>(token);

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sessionId !== 'string'
      ) {
        return this.authRequired(client);
      }

      const sessionAlive = await this.redisService.sismember(
        `user_sessions:${payload.sub}`,
        payload.sessionId,
      );

      if (sessionAlive !== 1) {
        this.logger.warn(
          `WS rejected: session ${payload.sessionId} for user ${payload.sub} is no longer alive`,
        );
        return this.reject(client);
      }

      client.data.user = {
        sub: payload.sub,
        email: payload.email ?? null,
        role: payload.role ?? 'user',
        organizationId: payload.organizationId ?? null,
        sessionId: payload.sessionId,
      } satisfies SocketUser;

      await client.join(`user:${payload.sub}`);
      this.logger.log(
        `WS connected: user ${payload.sub} (session ${payload.sessionId})`,
      );
    } catch (error) {
      this.logger.warn(`WS connection rejected: ${(error as Error).message}`);
      this.authRequired(client);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (user) {
      this.logger.log(`WS disconnected: user ${user.sub}`);
    }
  }

  /**
   * Page-scoped subscription. A connected client can join `page:<name>`
   */
  @SubscribeMessage('join_page')
  handleJoinPage(@MessageBody() page, @ConnectedSocket() client: Socket) {
    const user = this.requireUser(client);
    if (!user) return;
    const pageName = typeof page === 'string' ? page.trim().slice(0, 64) : '';
    if (!pageName) return;
    if (client.data.currentPage) {
      client.leave(`page:${client.data.currentPage}`);
    }
    client.join(`page:${pageName}`);
    client.data.currentPage = pageName;
    this.logger.debug(`user ${user.sub} joined page:${pageName}`);
  }

  @SubscribeMessage('leave_page')
  handleLeavePage(@ConnectedSocket() client: Socket) {
    const user = this.requireUser(client);
    if (!user || !client.data.currentPage) return;
    client.leave(`page:${client.data.currentPage}`);
    client.data.currentPage = undefined;
    this.logger.debug(`user ${user.sub} left page`);
  }

  /** Fan out a shipment event only to sockets allowed to see that shipment */
  emitShipmentEvent(payload: ShipmentEventPayload) {
    const sockets = this.server.sockets.sockets;
    let sent = 0;
    for (const socket of sockets.values()) {
      if (this.canViewShipment(socket.data.user, payload)) {
        socket.emit('shipment:updated', payload);
        sent++;
      }
    }
    this.logger.debug(`shipment:updated broadcast to ${sent} socket(s)`);
  }

  /** Force-disconnect sockets for a revoked session (or all sessions of a user) */
  emitForceLogout(userId: string, sessionId?: string) {
    const sockets = this.server.sockets.sockets;
    for (const socket of sockets.values()) {
      const user = socket.data.user as SocketUser | undefined;
      if (
        user &&
        user.sub === userId &&
        (!sessionId || user.sessionId === sessionId)
      ) {
        socket.emit('force_logout', { reason: 'session_revoked' });
        socket.disconnect(true);
      }
    }
  }

  private requireUser(client: Socket): SocketUser | undefined {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      this.authRequired(client);
      return undefined;
    }
    return user;
  }

  private canViewShipment(
    user: SocketUser | undefined,
    payload: ShipmentEventPayload,
  ): boolean {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'regulator') return true;

    if (user.role === 'shipper') {
      return payload.shipperOrganizationId === user.organizationId;
    }

    if (user.role === 'admin' || user.role === 'org_admin') {
      return (
        payload.shipperOrganizationId === user.organizationId ||
        payload.carrierOrganizationId === user.organizationId
      );
    }

    if (user.role === 'carrier') {
      if (payload.carrierUserId === user.sub) return true;
      if (
        payload.carrierOrganizationId === user.organizationId &&
        !payload.carrierUserId
      ) {
        return true;
      }
      if (!payload.carrierOrganizationId) return true;
      return false;
    }

    return false;
  }

  private extractToken(client: Socket): string | undefined {
    const auth = (client.handshake.auth ?? {}) as { token?: string };
    if (auth.token) return auth.token;

    const header = client.handshake.headers?.authorization;
    if (header) {
      const [type, token] = header.split(' ');
      if (type === 'Bearer' && token) return token;
    }
    return undefined;
  }

  /** Token missing/invalid/expired — client should refresh and reconnect */
  private authRequired(client: Socket) {
    client.emit('auth_required');
    client.disconnect(true);
  }

  /** Session revoked — client must log out */
  private reject(client: Socket) {
    client.emit('force_logout', { reason: 'session_revoked' });
    client.disconnect(true);
  }
}
