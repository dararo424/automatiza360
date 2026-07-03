import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const start = Date.now();

    // Correlation id: respeta el del proxy/cliente o genera uno propio
    const requestId: string = req.headers['x-request-id'] ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const tenantId = req.user?.tenantId ?? '-';
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${ms}ms rid=${requestId} tenant=${tenantId}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const tenantId = req.user?.tenantId ?? '-';
          const status = err?.status ?? 500;
          this.logger.warn(
            `${method} ${url} ${status} ${ms}ms rid=${requestId} tenant=${tenantId} err=${err?.message ?? 'unknown'}`,
          );
        },
      }),
    );
  }
}
