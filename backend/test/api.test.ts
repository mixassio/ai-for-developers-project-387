import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server.js";
import { Store } from "../src/store.js";
import type { Booking, EventType, Page, Slot } from "../src/types.js";

let app: FastifyInstance;
let store: Store;

beforeEach(async () => {
  store = new Store();
  app = await buildServer({ store });
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function firstEventType(): EventType {
  return store.listEventTypes()[0]!;
}

async function firstFreeSlot(eventTypeId: string): Promise<Slot> {
  const res = await app.inject({ method: "GET", url: `/public/event-types/${eventTypeId}/slots` });
  expect(res.statusCode).toBe(200);
  const slots = res.json() as Slot[];
  expect(slots.length).toBeGreaterThan(0);
  return slots[0]!;
}

describe("admin event types", () => {
  it("lists seeded event types as a page", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/event-types" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Page<EventType>;
    expect(body.total).toBe(body.items.length);
    expect(body.total).toBeGreaterThan(0);
  });

  it("creates, reads, updates and deletes an event type", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/admin/event-types",
      payload: { title: "Демо", description: "тест", durationMinutes: 45 },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json() as EventType;
    expect(created.id).toBeTruthy();

    const get = await app.inject({ method: "GET", url: `/admin/event-types/${created.id}` });
    expect(get.statusCode).toBe(200);

    const put = await app.inject({
      method: "PUT",
      url: `/admin/event-types/${created.id}`,
      payload: { title: "Демо 2" },
    });
    expect(put.statusCode).toBe(200);
    expect((put.json() as EventType).title).toBe("Демо 2");

    const del = await app.inject({ method: "DELETE", url: `/admin/event-types/${created.id}` });
    expect(del.statusCode).toBe(204);

    const gone = await app.inject({ method: "GET", url: `/admin/event-types/${created.id}` });
    expect(gone.statusCode).toBe(404);
  });

  it("rejects invalid event type with 422", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/event-types",
      payload: { title: "", description: "x", durationMinutes: 0 },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe("validation_error");
  });

  it("returns 404 for unknown event type", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/event-types/nope" });
    expect(res.statusCode).toBe(404);
  });
});

describe("public booking flow", () => {
  it("creates a booking on a free slot and retrieves it", async () => {
    const et = firstEventType();
    const slot = await firstFreeSlot(et.id);

    const res = await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: {
        eventTypeId: et.id,
        start: slot.start,
        guestName: "Гость",
        guestEmail: "guest@example.com",
      },
    });
    expect(res.statusCode).toBe(201);
    const booking = res.json() as Booking;
    expect(booking.end).toBe(slot.end);

    const get = await app.inject({ method: "GET", url: `/public/bookings/${booking.id}` });
    expect(get.statusCode).toBe(200);
    expect((get.json() as Booking).id).toBe(booking.id);
  });

  it("returns 409 when the slot is already taken (even across event types)", async () => {
    const types = store.listEventTypes();
    const et = types[0]!;
    const otherSameDuration = types.find((t) => t.id !== et.id && t.durationMinutes === et.durationMinutes);

    const slot = await firstFreeSlot(et.id);

    const first = await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: { eventTypeId: et.id, start: slot.start, guestName: "A", guestEmail: "a@a.io" },
    });
    expect(first.statusCode).toBe(201);

    // Та же точка времени, тот же тип → конфликт.
    const dup = await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: { eventTypeId: et.id, start: slot.start, guestName: "B", guestEmail: "b@b.io" },
    });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().code).toBe("conflict");

    // Глобальное правило: другой тип события той же длительности на то же время → тоже 409.
    if (otherSameDuration) {
      const cross = await app.inject({
        method: "POST",
        url: "/public/bookings",
        payload: {
          eventTypeId: otherSameDuration.id,
          start: slot.start,
          guestName: "C",
          guestEmail: "c@c.io",
        },
      });
      expect(cross.statusCode).toBe(409);
    }
  });

  it("excludes a booked slot from the free-slots listing", async () => {
    const et = firstEventType();
    const slot = await firstFreeSlot(et.id);

    await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: { eventTypeId: et.id, start: slot.start, guestName: "A", guestEmail: "a@a.io" },
    });

    const res = await app.inject({ method: "GET", url: `/public/event-types/${et.id}/slots` });
    const slots = res.json() as Slot[];
    expect(slots.some((s) => s.start === slot.start)).toBe(false);
  });

  it("returns 422 for a slot outside the window / not aligned", async () => {
    const et = firstEventType();
    const res = await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: {
        eventTypeId: et.id,
        start: "2000-01-01T10:00:00.000Z",
        guestName: "A",
        guestEmail: "a@a.io",
      },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe("validation_error");
  });

  it("returns 404 when booking an unknown event type", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/public/bookings",
      payload: {
        eventTypeId: "missing",
        start: new Date(Date.now() + 3600_000).toISOString(),
        guestName: "A",
        guestEmail: "a@a.io",
      },
    });
    expect(res.statusCode).toBe(404);
  });
});
