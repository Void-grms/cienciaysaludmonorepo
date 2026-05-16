import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Error interno del servidor' };

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message || 'Error',
        details: typeof errorResponse === 'object' ? (errorResponse as any).error : null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: request.requestId || 'N/A',
      },
    });
  }
}
