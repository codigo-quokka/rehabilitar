export interface ApiErrorResponse {
  error: string;
  errorCode: string | null;
  fieldErrors: Record<string, string[]>;
}

export function parseApiError(err: unknown): ApiErrorResponse {
  const body = (err as any)?.response?.data ?? {};
  return {
    error: body.error ?? "Ha ocurrido un error inesperado",
    errorCode: body.errorCode ?? null,
    fieldErrors: body.fieldErrors ?? {},
  };
}

export function getFieldError(
  apiError: ApiErrorResponse,
  field: string
): string | undefined {
  return apiError.fieldErrors[field]?.[0];
}
