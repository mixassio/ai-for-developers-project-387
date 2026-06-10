// Типы домена, повторяющие модели контракта TypeSpec (specs/models.tsp).
// Бэкенд реализует контракт вручную типизированными обработчиками, поэтому
// держим локальные интерфейсы вместо генерации из openapi.yaml.

export interface Owner {
  id: string;
  name: string;
  email: string;
  /** Таймзона владельца в формате IANA, например `Europe/Moscow`. */
  timezone: string;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface EventTypeCreate {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: number;
}

export interface PublicEventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  /** Начало слота (UTC, ISO 8601). */
  start: string;
  /** Конец слота (UTC, ISO 8601). Равен start + durationMinutes. */
  end: string;
  available: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  start: string;
  end: string;
  guestName: string;
  guestEmail: string;
  notes?: string;
  createdAt: string;
}

export interface BookingCreate {
  eventTypeId: string;
  start: string;
  guestName: string;
  guestEmail: string;
  notes?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface ErrorBody {
  code: string;
  message: string;
}
