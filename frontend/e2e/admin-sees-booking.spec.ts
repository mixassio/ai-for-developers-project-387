import { expect, test } from "@playwright/test";
import { bookFirstSlotViaUi, uniqueGuest } from "./helpers";

test.describe("Запись видна владельцу", () => {
  test("созданная гостем бронь появляется в разделе «Записи»", async ({ page }) => {
    const guest = uniqueGuest("admin");

    await bookFirstSlotViaUi(page, guest);
    await expect(page.getByRole("heading", { name: "Вы записаны!" })).toBeVisible();

    // Переходим в кабинет владельца клиентской навигацией (Vite проксирует
    // путь /admin на бэкенд, поэтому прямой page.goto открыл бы JSON, а не SPA).
    await page.getByRole("link", { name: "Владельцу" }).click();
    await page.getByRole("tab", { name: "Записи" }).click();
    await expect(page).toHaveURL(/\/admin\/bookings/);
    await expect(page.getByRole("heading", { name: "Предстоящие записи" })).toBeVisible();

    // По умолчанию период не выбран — показываются все брони.
    const row = page.getByRole("row").filter({ hasText: guest.email });
    await expect(row).toBeVisible();
    await expect(row).toContainText(guest.name);
  });
});
