import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const { method, url, user } = req;
    const inicio = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - inicio;
        const quien = user?.email ?? 'anónimo';
        this.logger.log(`${method} ${url} — ${ms}ms — ${quien}`);
      }),
    );
  }
}
