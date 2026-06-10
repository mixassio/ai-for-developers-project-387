import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

// Базовый URL: в dev оставляем "/" — Vite проксирует /admin и /public на Prism.
// Для реального бэкенда задайте VITE_API_URL (см. .env.example).
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || "/",
});

// Реэкспорт доменных моделей контракта для удобного импорта в компонентах.
export type Schemas = components["schemas"];
export type Owner = Schemas["Owner"];
export type EventType = Schemas["EventType"];
export type EventTypeCreate = Schemas["EventTypeCreate"];
export type EventTypeUpdate = Schemas["EventTypeUpdate"];
export type PublicEventType = Schemas["PublicEventType"];
export type Slot = Schemas["Slot"];
export type Booking = Schemas["Booking"];
export type BookingCreate = Schemas["BookingCreate"];
export type ErrorBody = Schemas["ErrorBody"];
