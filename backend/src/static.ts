import path from "node:path";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import { notFound } from "./errors.js";

/**
 * Раздаёт собранный фронтенд (SPA) с того же origin, что и API. Так одно
 * приложение в одном контейнере отдаёт и статику по «/», и контракт по
 * «/admin» и «/public». Включается только когда задан каталог со сборкой
 * (переменная окружения STATIC_DIR при деплое); в dev и тестах не активен.
 */
export async function registerStatic(app: FastifyInstance, dir: string): Promise<void> {
  await app.register(fastifyStatic, {
    root: path.resolve(dir),
    wildcard: false,
  });

  // SPA-фолбэк: любые GET-маршруты, не относящиеся к API, отдают index.html,
  // чтобы клиентский роутинг (React Router) работал по прямым ссылкам.
  // Запросы к /admin и /public, не нашедшие маршрут, остаются JSON-ошибкой 404.
  app.setNotFoundHandler((request, reply) => {
    const isApi = request.url.startsWith("/admin") || request.url.startsWith("/public");
    if (request.method === "GET" && !isApi) {
      return reply.sendFile("index.html");
    }
    return notFound(reply, "Запрашиваемый маршрут не найден.");
  });
}
