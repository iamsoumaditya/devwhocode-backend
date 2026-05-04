import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

export const ResponseMessage = (message: string) =>
  SetMetadata('response_message', message);

export interface StandardResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Read custom message from @ResponseMessage() decorator if set,
    // otherwise fall back to a sensible default based on HTTP method
    const customMessage = this.reflector.get<string>(
      'response_message',
      context.getHandler(),
    );

    const request = ctx.getRequest<Request>();
    const defaultMessage = this.getDefaultMessage(request.method);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        message: customMessage ?? defaultMessage,
        data,
      })),
    );
  }

  private getDefaultMessage(method: string): string {
    const map: Record<string, string> = {
      GET: 'Data fetched successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    return map[method] ?? 'Success';
  }
}
