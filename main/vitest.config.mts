import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@db": fileURLToPath(new URL("./db", import.meta.url)),
    },
  },
  envDir: ".",
  test: {
    env: { DATABASE_URL: process.env.DATABASE_URL ?? "" },
    include: ["tests/**/*.test.{ts,tsx,mts,mjs}"],
  },
});
