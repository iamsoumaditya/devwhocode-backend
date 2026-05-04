import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from 'pg';

export interface StandardErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolveException(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${statusCode}: ${message}`,
      );
    }

    const body: StandardErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    // 1. NestJS HTTP exceptions (NotFoundException, ConflictException etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null && 'message' in res) {
        const resObj = res as Record<string, unknown>;
        const message = Array.isArray(resObj.message)
          ? (resObj.message as string[]).join('; ')
          : String(resObj.message);
        return {
          statusCode: status,
          message,
          error: String(resObj.error ?? exception.name),
        };
      }

      return {
        statusCode: status,
        message: typeof res === 'string' ? res : exception.message,
        error: exception.name,
      };
    }

    // 2. PostgreSQL driver errors — Drizzle surfaces these directly
    if (exception instanceof DatabaseError) {
      return this.resolvePostgresError(exception);
    }

    // 3. Unknown — never leak internals
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
      error: 'Internal Server Error',
    };
  }

  private resolvePostgresError(exception: DatabaseError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      case '23505': {
        const detail = exception.detail ?? '';
        const match = detail.match(/Key \((.+?)\)=/);
        const field = match ? match[1] : 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          error: 'Conflict',
        };
      }
      case '23503':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Bad Request',
        };
      case '23502':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'A required field is missing',
          error: 'Bad Request',
        };
      case '22P02':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data format in request',
          error: 'Bad Request',
        };
      default:
        this.logger.error(
          `Unhandled PostgreSQL error ${exception.code}`,
          exception.message,
        );
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred',
          error: 'Database Error',
        };
    }
  }
}
