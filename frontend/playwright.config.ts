import { defineConfig, devices } from "@playwright/test";

// E2E-конфигурация. Playwright сам поднимает два сервера:
//  1) реальный бэкенд (backend/, Fastify, in-memory) на :8080 — чистое состояние
//     на каждый прогон, детерминированные слоты (будни 09:00–18:00).
//  2) фронтенд (Vite dev) на :5173 с VITE_API_URL=http://localhost:8080,
//     чтобы браузер ходил на реальный бэкенд напрямую (CORS на бэкенде включён).
const BACKEND_URL = "http://localhost:8080";
const FRONTEND_URL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      url: BACKEND_URL + "/admin/profile",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      cwd: ".",
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_API_URL: BACKEND_URL },
    },
  ],
});
