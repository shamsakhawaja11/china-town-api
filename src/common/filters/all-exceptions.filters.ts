import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

interface ErrorPayload {
    success: false;
    statusCode: number;
    message: string | string[];
    error: string;
    requestId: string;
    path: string;
    timestamp: string;
}
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();
        const requestId = req.headers['x-request-id'] as string;

        const payload = this.resolvePayload(exception, req.url, requestId);

        if (payload.statusCode >= 500) {
            this.logger.error(
                `[${requestId}] ${req.method} ${req.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        } else {
            this.logger.warn(
                `[${requestId}] ${payload.statusCode} ${payload.error} - ${req.method} ${req.url} - ${JSON.stringify(payload.message)}`,
            );
        }

        res.status(payload.statusCode).json(payload);
    }

    private resolvePayload(exception: unknown, path: string, requestId: string): ErrorPayload {
        
        if (exception instanceof BadRequestException) {
            const responseBody = exception.getResponse();
            if (
                typeof responseBody === 'object' &&
                responseBody !== null &&
                'message' in responseBody &&
                Array.isArray((responseBody as any).message)
            ) {
                console.log(exception.getResponse())
                return this.buildErrorPayload(
                    400,
                    (responseBody as any).message,
                    'VALIDATION_ERROR',
                    path,
                    requestId,
                );
            }
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            return this.buildErrorPayload(
                status,
                exception.message,
                exception.constructor.name,
                path,
                requestId,
            );
        }

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                return this.buildErrorPayload(
                    409,
                    'A record with this value already exists',
                    'CONFLICT_ERROR',
                    path,
                    requestId,
                );
            }
            if (exception.code === 'P2025') {
                return this.buildErrorPayload(
                    404,
                    'Record not found',
                    'RECORD_NOT_FOUND',
                    path,
                    requestId,
                );
            }
            if (exception.code === 'P2003') {
                return this.buildErrorPayload(
                    409,
                    'Related record constraint failed',
                    'CONSTRAINT_FAILED_ERROR',
                    path,
                    requestId,
                );
            }
        }

        return this.buildErrorPayload(500,
            'Internal server error',
            'SERVER_ERROR',
            path,
            requestId,
        );
    }

    private buildErrorPayload(statusCode: number, message: string | string[], error: string, path: string, requestId: string,): ErrorPayload {
        return {
            success: false,
            statusCode,
            message,
            error,
            requestId,
            path,
            timestamp: new Date().toISOString(),
        };
    }
}