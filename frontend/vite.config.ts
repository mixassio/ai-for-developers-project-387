import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Во время разработки клиент ходит на относительный "/" и Vite проксирует
// запросы /admin и /public на VITE_API_URL (по умолчанию Prism на :4010).
// Так избегаем CORS и одной сменой переменной переключаемся на реальный бэкенд.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "http://localhost:4010";
  console.log("🚀 ~ target:", target)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/admin": { target, changeOrigin: true },
        "/public": { target, changeOrigin: true },
      },
    },
  };
});
