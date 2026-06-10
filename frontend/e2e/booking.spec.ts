import { expect, test } from "@playwright/test";
import { bookFirstSlotViaUi, uniqueGuest } from "./helpers";

test.describe("Основной сценарий бронирования", () => {
  test("гость выбирает тип, слот и подтверждает запись", async ({ page }) => {
    const guest = uniqueGuest();

    await bookFirstSlotViaUi(page, guest);

    // Переход на страницу подтверждения.
    await expect(page).toHaveURL(/\/bookings\/.+/);
    await expect(page.getByRole("heading", { name: "Вы записаны!" })).toBeVisible();
    await expect(page.getByText(guest.email)).toBeVisible();
    await expect(page.getByText(guest.name)).toBeVisible();
    await expect(page.getByRole("link", { name: "На главную" })).toBeVisible();
  });

  test("кнопка «На главную» возвращает к списку типов", async ({ page }) => {
    await bookFirstSlotViaUi(page);

    await expect(page.getByRole("heading", { name: "Вы записаны!" })).toBeVisible();
    await page.getByRole("link", { name: "На главную" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Выберите тип встречи" })).toBeVisible();
  });
});
