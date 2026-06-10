import type { FastifyInstance } from "fastify";
import { notFound } from "../errors.js";
import { listBookings } from "../domain/bookings.js";
import type { Store } from "../store.js";
import type {
  Booking,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Page,
} from "../types.js";

const eventTypeCreateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "durationMinutes"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 2000 },
    durationMinutes: { type: "integer", minimum: 1, maximum: 1440 },
  },
} as const;

const eventTypeUpdateSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 2000 },
    durationMinutes: { type: "integer", minimum: 1, maximum: 1440 },
  },
} as const;

const bookingsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    from: { type: "string" },
    to: { type: "string" },
  },
} as const;

function page<T>(items: T[]): Page<T> {
  return { items, total: items.length };
}

export function registerAdminRoutes(app: FastifyInstance, store: Store): void {
  // GET /admin/profile
  app.get("/admin/profile", async () => store.owner);

  // POST /admin/event-types
  app.post<{ Body: EventTypeCreate }>(
    "/admin/event-types",
    { schema: { body: eventTypeCreateSchema } },
    async (request, reply) => {
      const created = store.createEventType(request.body);
      return reply.code(201).send(created);
    },
  );

  // GET /admin/event-types
  app.get("/admin/event-types", async (): Promise<Page<EventType>> =>
    page(store.listEventTypes()),
  );

  // GET /admin/event-types/:id
  app.get<{ Params: { id: string } }>(
    "/admin/event-types/:id",
    async (request, reply) => {
      const eventType = store.getEventType(request.params.id);
      if (!eventType) return notFound(reply, "Тип события не найден.");
      return eventType;
    },
  );

  // PUT /admin/event-types/:id
  app.put<{ Params: { id: string }; Body: EventTypeUpdate }>(
    "/admin/event-types/:id",
    { schema: { body: eventTypeUpdateSchema } },
    async (request, reply) => {
      const updated = store.updateEventType(request.params.id, request.body);
      if (!updated) return notFound(reply, "Тип события не найден.");
      return updated;
    },
  );

  // DELETE /admin/event-types/:id
  app.delete<{ Params: { id: string } }>(
    "/admin/event-types/:id",
    async (request, reply) => {
      const deleted = store.deleteEventType(request.params.id);
      if (!deleted) return notFound(reply, "Тип события не найден.");
      return reply.code(204).send();
    },
  );

  // GET /admin/bookings
  app.get<{ Querystring: { from?: string; to?: string } }>(
    "/admin/bookings",
    { schema: { querystring: bookingsQuerySchema } },
    async (request): Promise<Page<Booking>> => {
      const { from, to } = request.query;
      return page(listBookings(store, from, to));
    },
  );
}
