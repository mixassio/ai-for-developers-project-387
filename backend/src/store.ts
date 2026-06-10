import { randomUUID } from "node:crypto";
import type { Booking, EventType, Owner } from "./types.js";

// Простое хранилище в памяти. После перезапуска процесса данные сбрасываются —
// для учебного сервиса этого достаточно, БД не требуется.
export class Store {
  /** Единственный предзаданный владелец календаря (регистрации/авторизации нет). */
  readonly owner: Owner = {
    id: "owner-1",
    name: "Владелец календаря",
    email: "owner@example.com",
    timezone: "Europe/Moscow",
  };

  private readonly eventTypes = new Map<string, EventType>();
  private readonly bookings = new Map<string, Booking>();

  constructor() {
    this.seed();
  }

  // --- Event types -------------------------------------------------------

  listEventTypes(): EventType[] {
    return [...this.eventTypes.values()];
  }

  getEventType(id: string): EventType | undefined {
    return this.eventTypes.get(id);
  }

  createEventType(data: Omit<EventType, "id">): EventType {
    const eventType: EventType = { id: randomUUID(), ...data };
    this.eventTypes.set(eventType.id, eventType);
    return eventType;
  }

  updateEventType(id: string, patch: Partial<Omit<EventType, "id">>): EventType | undefined {
    const existing = this.eventTypes.get(id);
    if (!existing) return undefined;
    const updated: EventType = { ...existing, ...patch, id: existing.id };
    this.eventTypes.set(id, updated);
    return updated;
  }

  deleteEventType(id: string): boolean {
    return this.eventTypes.delete(id);
  }

  // --- Bookings ----------------------------------------------------------

  listBookings(): Booking[] {
    return [...this.bookings.values()];
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  createBooking(data: Omit<Booking, "id" | "createdAt">): Booking {
    const booking: Booking = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  // --- Seed --------------------------------------------------------------

  private seed(): void {
    const samples: Array<Omit<EventType, "id">> = [
      {
        title: "Знакомство (15 минут)",
        description: "Короткий звонок, чтобы познакомиться и обсудить задачу.",
        durationMinutes: 15,
      },
      {
        title: "Консультация (30 минут)",
        description: "Разбор вопроса и рекомендации по следующим шагам.",
        durationMinutes: 30,
      },
      {
        title: "Глубокая сессия (60 минут)",
        description: "Подробная проработка задачи с планом действий.",
        durationMinutes: 60,
      },
    ];
    for (const sample of samples) this.createEventType(sample);
  }
}
