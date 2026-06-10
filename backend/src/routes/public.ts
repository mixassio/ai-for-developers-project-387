import type { FastifyInstance } from "fastify";
import { conflict, notFound, validation } from "../errors.js";
import { createBooking } from "../domain/bookings.js";
import { generateFreeSlots, resolveWindow } from "../domain/slots.js";
import type { Store } from "../store.js";
import type { BookingCreate, Page, PublicEventType } from "../types.js";

const slotsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    from: { type: "string" },
    to: { type: "string" },
  },
} as const;

const bookingCreateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventTypeId", "start", "guestName", "guestEmail"],
  properties: {
    eventTypeId: { type: "string", minLength: 1 },
    start: { type: "string", minLength: 1 },
    guestName: { type: "string", minLength: 1, maxLength: 200 },
    guestEmail: { type: "string", minLength: 3, maxLength: 320 },
    notes: { type: "string", maxLength: 2000 },
  },
} as const;

function toPublic(et: {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}): PublicEventType {
  return {
    id: et.id,
    title: et.title,
    description: et.description,
    durationMinutes: et.durationMinutes,
  };
}

function page<T>(items: T[]): Page<T> {
  return { items, total: items.length };
}

export function registerPublicRoutes(app: FastifyInstance, store: Store): void {
  // GET /public/event-types
  app.get("/public/event-types", async (): Promise<Page<PublicEventType>> =>
    page(store.listEventTypes().map(toPublic)),
  );

  // GET /public/event-types/:id
  app.get<{ Params: { id: string } }>(
    "/public/event-types/:id",
    async (request, reply) => {
      const eventType = store.getEventType(request.params.id);
      if (!eventType) return notFound(reply, "Тип события не найден.");
      return toPublic(eventType);
    },
  );

  // GET /public/event-types/:id/slots
  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>(
    "/public/event-types/:id/slots",
    { schema: { querystring: slotsQuerySchema } },
    async (request, reply) => {
      const eventType = store.getEventType(request.params.id);
      if (!eventType) return notFound(reply, "Тип события не найден.");

      const window = resolveWindow(Date.now(), request.query.from, request.query.to);
      return generateFreeSlots(eventType.durationMinutes, window, store.listBookings());
    },
  );

  // POST /public/bookings
  app.post<{ Body: BookingCreate }>(
    "/public/bookings",
    { schema: { body: bookingCreateSchema } },
    async (request, reply) => {
      const result = createBooking(store, request.body);
      if (result.ok) return reply.code(201).send(result.booking);

      switch (result.status) {
        case 404:
          return notFound(reply, result.message);
        case 409:
          return conflict(reply, result.message);
        case 422:
          return validation(reply, result.message);
      }
    },
  );

  // GET /public/bookings/:id
  app.get<{ Params: { id: string } }>(
    "/public/bookings/:id",
    async (request, reply) => {
      const booking = store.getBooking(request.params.id);
      if (!booking) return notFound(reply, "Бронирование не найдено.");
      return booking;
    },
  );
}
