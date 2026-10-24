import { z, ZodSchema } from 'zod';
import { apiError } from './api-response';

export async function validateRequestBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  requestId?: string
): Promise<{ data: T } | { errorResponse: ReturnType<typeof apiError> }> {
  try {
    const raw = await req.json();
    const result = schema.safeParse(raw);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = `${firstIssue.path.join('.')}: ${firstIssue.message}`;
      return {
        errorResponse: apiError('VALIDATION_ERROR', message, 400, requestId),
      };
    }

    return { data: result.data };
  } catch (err: any) {
    return {
      errorResponse: apiError('MALFORMED_JSON', 'Request body must be valid JSON.', 400, requestId),
    };
  }
}

export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
  requestId?: string
): { data: T } | { errorResponse: ReturnType<typeof apiError> } {
  const entries: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    entries[key] = value;
  });

  const result = schema.safeParse(entries);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = `${firstIssue.path.join('.')}: ${firstIssue.message}`;
    return {
      errorResponse: apiError('VALIDATION_ERROR', message, 400, requestId),
    };
  }

  return { data: result.data };
}
