import type { Store } from "../store.js";
import type { Booking, BookingCreate } from "../types.js";
import { isOccupied, isValidSlotStart } from "./slots.js";

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: 404 | 409 | 422; message: string };

/**
 * Бизнес-логика создания бронирования. Порядок проверок повторяет контракт
 * (specs/public.tsp): 404 → 422 → 409.
 */
export function createBooking(
  store: Store,
  input: BookingCreate,
  now: number = Date.now(),
): CreateBookingResult {
  const eventType = store.getEventType(input.eventTypeId);
  if (!eventType) {
    return { ok: false, status: 404, message: "Тип события не найден." };
  }

  // 422 — слот вне 14-дневного окна или не выровнен по длительности/рабочим часам.
  if (!isValidSlotStart(input.start, eventType.durationMinutes, now)) {
    return {
      ok: false,
      status: 422,
      message:
        "Выбранный слот недоступен: он вне 14-дневного окна или не выровнен по длительности типа события.",
    };
  }

  const startMs = Date.parse(input.start);
  const endMs = startMs + eventType.durationMinutes * 60 * 1000;

  // 409 — на выбранное время уже есть бронирование (глобальное правило занятости).
  if (isOccupied(startMs, endMs, store.listBookings())) {
    return {
      ok: false,
      status: 409,
      message: "На выбранное время уже есть бронирование.",
    };
  }

  const booking = store.createBooking({
    eventTypeId: input.eventTypeId,
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    notes: input.notes,
  });

  return { ok: true, booking };
}

/** Брони в периоде [from, to), отсортированные по времени начала. */
export function listBookings(store: Store, from?: string, to?: string): Booking[] {
  const fromMs = from ? Date.parse(from) : undefined;
  const toMs = to ? Date.parse(to) : undefined;

  return store
    .listBookings()
    .filter((b) => {
      const startMs = Date.parse(b.start);
      if (fromMs !== undefined && !Number.isNaN(fromMs) && startMs < fromMs) return false;
      if (toMs !== undefined && !Number.isNaN(toMs) && startMs >= toMs) return false;
      return true;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}
