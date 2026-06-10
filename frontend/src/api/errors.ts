import type { ErrorBody } from "./client";

/**
 * Единый тип ошибки API. Любой ответ-ошибка контракта (NotFoundError 404,
 * ConflictError 409, ValidationError 422) приводится к этому виду.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Ошибки контракта оборачивают ErrorBody в поле body.
type ContractError = { body?: ErrorBody } | ErrorBody | undefined;

function pickBody(error: ContractError): ErrorBody | undefined {
  if (!error) return undefined;
  if ("body" in error && error.body) return error.body;
  if ("code" in error && "message" in error) return error as ErrorBody;
  return undefined;
}

const FALLBACK_MESSAGE: Record<number, string> = {
  404: "Ресурс не найден.",
  409: "На выбранное время уже есть бронирование.",
  422: "Данные не прошли валидацию.",
};

/** Преобразует объект ошибки openapi-fetch в ApiError со статусом. */
export function toApiError(error: ContractError, status?: number): ApiError {
  const body = pickBody(error);
  const httpStatus = status ?? 0;
  const message = body?.message ?? FALLBACK_MESSAGE[httpStatus] ?? "Произошла ошибка запроса.";
  const code = body?.code ?? `http_${httpStatus || "unknown"}`;
  return new ApiError(httpStatus, code, message);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Произошла неизвестная ошибка.";
}

/**
 * Разворачивает результат openapi-fetch: бросает ApiError при ошибке,
 * иначе возвращает data. Структурный тип параметра намеренно «слабый» —
 * это обходит схлопывание response в `never` для эндпоинтов без error-ответов.
 */
export function unwrap<D>(result: { data?: D; error?: unknown; response: Response }): D {
  if (result.error) throw toApiError(result.error, result.response.status);
  return result.data as D;
}
