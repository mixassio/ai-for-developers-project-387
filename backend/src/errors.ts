import type { FastifyError, FastifyInstance, FastifyReply } from "fastify";
import type { ErrorBody } from "./types.js";

// Ответы-ошибки контракта оборачивают единое тело ErrorBody { code, message }.
// Сообщения — на русском, как и @doc в спецификации.

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
): FastifyReply {
  const body: ErrorBody = { code, message };
  return reply.code(statusCode).send(body);
}

export const notFound = (reply: FastifyReply, message = "Ресурс не найден.") =>
  sendError(reply, 404, "not_found", message);

export const conflict = (
  reply: FastifyReply,
  message = "На выбранное время уже есть бронирование.",
) => sendError(reply, 409, "conflict", message);

export const validation = (reply: FastifyReply, message = "Данные не прошли валидацию.") =>
  sendError(reply, 422, "validation_error", message);

/**
 * Глобальные обработчики ошибок Fastify приводят встроенные ответы к формату
 * контракта: ошибки валидации схемы → 422 ValidationError, неизвестные
 * маршруты → 404 NotFoundError, прочие — 500 в виде ErrorBody.
 */
export function registerErrorHandlers(
  app: FastifyInstance,
  options: { skipNotFoundHandler?: boolean } = {},
): void {
  // Когда включена раздача SPA, обработчик notFound ставит registerStatic
  // (Fastify запрещает задавать его дважды для одного префикса).
  if (!options.skipNotFoundHandler) {
    app.setNotFoundHandler((_request, reply) => {
      notFound(reply, "Запрашиваемый маршрут не найден.");
    });
  }

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    // Ошибки валидации JSON-схемы Fastify по умолчанию отдаёт как 400 —
    // контракт же требует 422 ValidationError.
    if (error.validation) {
      return validation(reply, error.message);
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 400 && statusCode < 500) {
      return sendError(reply, statusCode, "bad_request", error.message);
    }

    app.log.error(error);
    return sendError(reply, 500, "internal_error", "Внутренняя ошибка сервера.");
  });
}
