import type { Booking, Slot } from "../types.js";

// --- Конфигурация окна записи и рабочих часов -----------------------------

/** Ширина окна записи: свободные слоты формируются на 14 дней от текущего момента. */
export const WINDOW_DAYS = 14;

/**
 * Смещение таймзоны владельца (Europe/Moscow) в минутах. У Москвы нет перехода
 * на летнее время с 2014 года — фиксированный UTC+3. Вынесено в константу,
 * чтобы при необходимости легко поменять рабочую зону.
 */
const TZ_OFFSET_MINUTES = 180;

/** Рабочие часы в локальной зоне владельца: [09:00, 18:00). */
const BUSINESS_START_MIN = 9 * 60;
const BUSINESS_END_MIN = 18 * 60;

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

interface LocalParts {
  year: number;
  month: number; // 0-11
  day: number;
  /** День недели: 0 — воскресенье, 6 — суббота. */
  weekday: number;
}

/** Разбирает UTC-инстант в календарные части локальной зоны владельца. */
function toLocalParts(utcMs: number): LocalParts {
  const shifted = new Date(utcMs + TZ_OFFSET_MINUTES * MINUTE_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/** UTC-инстант полуночи (00:00 локального времени) для заданной даты владельца. */
function localMidnightUtcMs(parts: LocalParts): number {
  return Date.UTC(parts.year, parts.month, parts.day) - TZ_OFFSET_MINUTES * MINUTE_MS;
}

// --- Окно записи ----------------------------------------------------------

export interface Window {
  fromMs: number;
  toMs: number;
}

/**
 * Вычисляет эффективное окно выборки: базовое окно [now, now + 14 дней],
 * обрезанное запрошенными границами from/to.
 */
export function resolveWindow(
  now: number,
  requestedFrom?: string,
  requestedTo?: string,
): Window {
  const windowStart = now;
  const windowEnd = now + WINDOW_DAYS * DAY_MS;

  let fromMs = windowStart;
  let toMs = windowEnd;

  if (requestedFrom) {
    const t = Date.parse(requestedFrom);
    if (!Number.isNaN(t)) fromMs = Math.max(fromMs, t);
  }
  if (requestedTo) {
    const t = Date.parse(requestedTo);
    if (!Number.isNaN(t)) toMs = Math.min(toMs, t);
  }

  return { fromMs, toMs };
}

// --- Генерация слотов -----------------------------------------------------

/**
 * Все слоты-кандидаты для типа события в окне [fromMs, toMs): рабочие часы
 * 09:00–18:00 по будням, шаг и длина равны durationMinutes. Занятость здесь
 * не учитывается (available всегда true). Слот включается, только если
 * полностью помещается до 18:00.
 */
export function generateCandidateSlots(
  durationMinutes: number,
  window: Window,
): Slot[] {
  const slots: Slot[] = [];
  if (window.toMs <= window.fromMs) return slots;

  let cursor = localMidnightUtcMs(toLocalParts(window.fromMs));

  while (cursor < window.toMs) {
    const parts = toLocalParts(cursor);
    const isWeekday = parts.weekday >= 1 && parts.weekday <= 5;

    if (isWeekday) {
      for (
        let localMin = BUSINESS_START_MIN;
        localMin + durationMinutes <= BUSINESS_END_MIN;
        localMin += durationMinutes
      ) {
        const startMs = cursor + localMin * MINUTE_MS;
        if (startMs >= window.fromMs && startMs < window.toMs) {
          const endMs = startMs + durationMinutes * MINUTE_MS;
          slots.push({
            start: new Date(startMs).toISOString(),
            end: new Date(endMs).toISOString(),
            available: true,
          });
        }
      }
    }

    cursor += DAY_MS;
  }

  return slots;
}

// --- Занятость ------------------------------------------------------------

/** Два полуинтервала [aStart, aEnd) и [bStart, bEnd) пересекаются. */
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Занят ли интервал [startMs, endMs) хотя бы одним бронированием.
 * Правило глобальное: учитываются брони всех типов событий.
 */
export function isOccupied(startMs: number, endMs: number, bookings: Booking[]): boolean {
  return bookings.some((b) =>
    overlaps(startMs, endMs, Date.parse(b.start), Date.parse(b.end)),
  );
}

/** Свободные слоты = кандидаты, не пересекающиеся ни с одним бронированием. */
export function generateFreeSlots(
  durationMinutes: number,
  window: Window,
  bookings: Booking[],
): Slot[] {
  return generateCandidateSlots(durationMinutes, window).filter(
    (slot) =>
      !isOccupied(Date.parse(slot.start), Date.parse(slot.end), bookings),
  );
}

/**
 * Является ли `start` началом допустимого слота-кандидата (выровнен по
 * рабочим часам/длительности и попадает в 14-дневное окно). Используется при
 * создании бронирования для различения 422 (невалидный слот) и 409 (занят).
 */
export function isValidSlotStart(
  startIso: string,
  durationMinutes: number,
  now: number,
): boolean {
  const startMs = Date.parse(startIso);
  if (Number.isNaN(startMs)) return false;

  const window = resolveWindow(now);
  const candidates = generateCandidateSlots(durationMinutes, window);
  return candidates.some((slot) => Date.parse(slot.start) === startMs);
}
