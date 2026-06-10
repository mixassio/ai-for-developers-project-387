import { expect, test } from "@playwright/test";
import { openFirstSlotModal } from "./helpers";

test.describe("Валидация формы бронирования на клиенте", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Записаться" }).first().click();
    await openFirstSlotModal(page);
  });

  test("имя из пробелов показывает ошибку и не закрывает модалку", async ({ page }) => {
    // Пробелы проходят нативную проверку required, но Mantine валидирует по trim().
    await page.getByLabel("Ваше имя").fill("   ");
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Забронировать" }).click();

    await expect(page.getByText("Укажите имя")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Подтверждение записи" })).toBeVisible();
    await expect(page).not.toHaveURL(/\/bookings\//);
  });

  test("некорректный email показывает ошибку", async ({ page }) => {
    await page.getByLabel("Ваше имя").fill("Иван Гость");
    // Без доменной точки: проходит нативную проверку type=email, но не Mantine-regex.
    await page.getByLabel("Email").fill("user@example");
    await page.getByRole("button", { name: "Забронировать" }).click();

    await expect(page.getByText("Некорректный email")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Подтверждение записи" })).toBeVisible();
    await expect(page).not.toHaveURL(/\/bookings\//);
  });
});
