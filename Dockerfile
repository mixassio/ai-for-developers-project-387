# syntax=docker/dockerfile:1

# Один образ для всего приложения: Fastify-бэкенд раздаёт API (/admin, /public)
# и собранный фронтенд-SPA (/) на одном порту из переменной окружения PORT.

# 1. Контракт: компилируем TypeSpec -> tsp-output/openapi.yaml.
FROM node:20-alpine AS contract
WORKDIR /contract
COPY package.json package-lock.json ./
RUN npm ci
COPY tspconfig.yaml ./
COPY specs ./specs
RUN npm run compile

# 2. Фронтенд: генерируем типы из контракта и собираем статику.
#    VITE_API_URL не задаём — клиент ходит на относительный "/" (тот же origin).
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY --from=contract /contract/tsp-output /tsp-output
RUN npm run gen:api && npm run build

# 3. Бэкенд: компилируем TypeScript и оставляем только prod-зависимости.
FROM node:20-alpine AS backend
WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# 4. Рантайм: минимальный образ только с тем, что нужно для запуска.
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Каталог со статикой фронтенда; включает раздачу SPA в server.ts.
ENV STATIC_DIR=/app/public
COPY --from=backend /backend/package.json ./package.json
COPY --from=backend /backend/node_modules ./node_modules
COPY --from=backend /backend/dist ./dist
COPY --from=frontend /frontend/dist ./public
# PORT приходит из платформы (Render и автопроверка). 8080 — дефолт.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
