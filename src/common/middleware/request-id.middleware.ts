import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private logger = new Logger(RequestIdMiddleware.name);
  use(req: any, res: any, next: (error?: any) => void) {
    const incomingId = req.headers['x-request-id'];
    const startTime = Date.now();
    const isValid =
        typeof incomingId === 'string' &&
        incomingId.length > 0 &&
        incomingId.length <= 64;
    
    const requestId = isValid ? incomingId : randomUUID()
    req.headers['x-request-id']=requestId;
    res.setHeader('x-request-id',requestId);

    res.on('finish', () => {
      this.logger.log(
        `${req.method} ${req.url} ${res.statusCode} ${requestId} ${Date.now() - startTime}ms`,
      );
    });
    next();
  }
}

//to chk req id validation
// Invoke-WebRequest http://localhost:3000/ | Select-Object -ExpandProperty Headers