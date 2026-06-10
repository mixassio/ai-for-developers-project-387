import { expect, test } from "@playwright/test";
import { bookViaApi, firstEventType, firstFreeSlot, openFirstSlotModal, uniqueGuest } from "./helpers";

test.describe("Конфликт времени (409)", () => {
  test("слот, занятый другим гостем, нельзя забронировать повторно", async ({ page, request }) => {
    const eventType = await firstEventType(request);

    // UI открывает страницу типа и «держит» первый свободный слот в модалке.
    await page.goto(`/event-types/${eventType.id}`);
    await openFirstSlotModal(page);

    // Тот же слот в это время занимает другой гость (через API).
    const slot = await firstFreeSlot(request, eventType.id);
    await bookViaApi(request, {
      eventTypeId: eventType.id,
      start: slot.start,
      guest: uniqueGuest("rival"),
    });

    // Отправка формы в UI должна вернуть 409 и показать уведомление.
    await page.getByLabel("Ваше имя").fill("Опоздавший гость");
    await page.getByLabel("Email").fill("late@example.com");
    await page.getByRole("button", { name: "Забронировать" }).click();

    await expect(page.getByText("Время уже занято")).toBeVisible();
    await expect(page).not.toHaveURL(/\/bookings\//);
  });
});
