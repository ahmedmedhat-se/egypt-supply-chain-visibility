import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { FastifyRequest } from 'fastify';
import { RequestContext } from './request-context';

/**
 * Binds the FastifyRequest to the ALS context for the duration of each HTTP
 * request. Non-HTTP contexts (RabbitMQ consumers, WebSocket adapters) are
 * skipped — the context simply stays empty there.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return new Observable((subscriber) => {
      RequestContext.run(request, () => next.handle().subscribe(subscriber));
    });
  }
}