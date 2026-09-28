import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@risk-engine/server": fileURLToPath(new URL("../uta-risk-engine/src/server.ts", import.meta.url)),
      "@risk-engine": fileURLToPath(new URL("../uta-risk-engine/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
