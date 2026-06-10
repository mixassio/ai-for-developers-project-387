import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerErrorHandlers } from "./errors.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerPublicRoutes } from "./routes/public.js";
import { registerStatic } from "./static.js";
import { Store } from "./store.js";

export interface BuildOptions {
  logger?: boolean;
  /** Внешнее хранилище (используется в тестах). По умолчанию — свежее in-memory. */
  store?: Store;
  /**
   * Каталог со сборкой фронтенда. Если задан (или есть STATIC_DIR в окружении),
   * сервер дополнительно раздаёт SPA с того же origin. По умолчанию выключено.
   */
  staticDir?: string;
}

/**
 * Собирает Fastify-приложение со всеми маршрутами контракта. Хранилище —
 * в памяти, без БД: данные живут только в рамках процесса.
 */
export async function buildServer(options: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const store = options.store ?? new Store();

  // Фронтенд-клиент может ходить напрямую (другой origin) — разрешаем CORS.
  await app.register(cors, { origin: true });

  // Когда раздаём SPA, обработчик notFound ставит registerStatic (SPA-фолбэк),
  // поэтому базовый здесь не регистрируем.
  const staticDir = options.staticDir ?? process.env.STATIC_DIR;
  registerErrorHandlers(app, { skipNotFoundHandler: Boolean(staticDir) });
  registerAdminRoutes(app, store);
  registerPublicRoutes(app, store);

  if (staticDir) {
    await registerStatic(app, staticDir);
  }

  return app;
}
