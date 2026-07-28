import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again.';
    let reason: string | undefined;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      // ── NestJS class-validator errors (BadRequestException) ──
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;

        // Custom reason field (e.g., ACCOUNT_INACTIVE, TOKEN_EXPIRED)
        if (typeof res.reason === 'string') {
          reason = res.reason;
        }

        // Array of validation errors from class-validator
        if (Array.isArray(res.message)) {
          const validationMessages = res.message as string[];

          // Try to extract a friendly first error
          const first = validationMessages[0];
          if (first) {
            // Remove the "property " prefix from "property X should not exist"
            message = first.replace(/^property /, '');
            // Capitalize first letter
            message = message.charAt(0).toUpperCase() + message.slice(1);

            // If there are more errors, mention the count
            if (validationMessages.length > 1) {
              message += ` (and ${validationMessages.length - 1} more issue${validationMessages.length > 2 ? 's' : ''})`;
            }
          } else {
            message = 'Validation failed. Please check your input.';
          }
        } else if (typeof res.message === 'string') {
          message = res.message;
        } else if (typeof res.error === 'string') {
          message = res.error;
        }
      } else if (typeof response === 'string') {
        message = response;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody: Record<string, unknown> = {
      statusCode: httpStatus,
      message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (reason) {
      responseBody.reason = reason;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
