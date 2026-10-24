import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  requestId?: string
) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
    },
  };

  return NextResponse.json(payload, { status });
}

export function handleRouteError(error: any, requestId?: string) {
  // If already an API response, return it directly
  if (error instanceof NextResponse) {
    return error;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  logger.error('Unhandled route error', {
    requestId,
    errorMessage: error?.message || 'Unknown error',
    errorStack: isDev ? error?.stack : undefined,
  });

  // Never leak internal exception details to client in production
  const safeMessage = isDev
    ? error?.message || 'Internal server error'
    : 'An unexpected internal error occurred. Please try again later.';

  return apiError('INTERNAL_ERROR', safeMessage, 500, requestId);
}
