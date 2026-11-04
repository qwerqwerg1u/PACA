import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig(({ command }) => ({
  // GitHub Pages project site uses /PACA/ in production.
  base: command === "serve" ? "/" : "/PACA/",
  plugins: [react(), tailwindcss()],
  worker: { format: "es" },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    setupFiles: "./src/test/setup.ts",
    exclude: ["src/e2e/**", "node_modules/**", "dist/**"],
  },
}))
