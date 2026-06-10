import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const BACKEND_URL = "http://localhost:8080";

export interface Guest {
  name: string;
  email: string;
}

/** Уникальный гость, чтобы тесты не зависели друг от друга. */
export function uniqueGuest(prefix = "guest"): Guest {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return { name: `Тест ${id}`, email: `${prefix}-${id}@example.com` };
}

interface PublicEventType {
  id: string;
  title: string;
  durationMinutes: number;
}

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

/** Первый тип события из публичного API. */
export async function firstEventType(request: APIRequestContext): Promise<PublicEventType> {
  const res = await request.get(`${BACKEND_URL}/public/event-types`);
  expect(res.ok()).toBeTruthy();
  const page = (await res.json()) as { items: PublicEventType[] };
  expect(page.items.length).toBeGreaterThan(0);
  return page.items[0];
}

/** Первый свободный слот типа события (эндпоинт отдаёт голый массив). */
export async function firstFreeSlot(
  request: APIRequestContext,
  eventTypeId: string,
): Promise<Slot> {
  const res = await request.get(`${BACKEND_URL}/public/event-types/${eventTypeId}/slots`);
  expect(res.ok()).toBeTruthy();
  const slots = (await res.json()) as Slot[];
  expect(slots.length).toBeGreaterThan(0);
  return slots[0];
}

/** Занять слот напрямую через API — имитация второго гостя (для теста конфликта). */
export async function bookViaApi(
  request: APIRequestContext,
  params: { eventTypeId: string; start: string; guest?: Guest },
): Promise<void> {
  const guest = params.guest ?? uniqueGuest("api");
  const res = await request.post(`${BACKEND_URL}/public/bookings`, {
    data: {
      eventTypeId: params.eventTypeId,
      start: params.start,
      guestName: guest.name,
      guestEmail: guest.email,
    },
  });
  expect(res.status()).toBe(201);
}

/**
 * Полный UI-сценарий бронирования первого свободного слота первого типа события.
 * Возвращает гостя, на которого оформлена бронь.
 */
export async function bookFirstSlotViaUi(page: Page, guest: Guest = uniqueGuest()): Promise<Guest> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Выберите тип встречи" })).toBeVisible();

  await page.getByRole("button", { name: "Записаться" }).first().click();

  await expect(page.getByRole("heading", { name: "Свободные слоты (14 дней)" })).toBeVisible();

  // Первая кнопка-слот внутри карточек дня (время HH:mm).
  await openFirstSlotModal(page);

  await page.getByLabel("Ваше имя").fill(guest.name);
  await page.getByLabel("Email").fill(guest.email);
  await page.getByRole("button", { name: "Забронировать" }).click();

  return guest;
}

/** Открыть модалку бронирования для первого свободного слота на странице типа. */
export async function openFirstSlotModal(page: Page): Promise<void> {
  const slotButton = page
    .getByRole("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first();
  await expect(slotButton).toBeVisible();
  await slotButton.click();
  await expect(page.getByRole("heading", { name: "Подтверждение записи" })).toBeVisible();
}
