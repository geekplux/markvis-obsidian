import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The real `obsidian` package ships types only; tests use a small stand-in.
    alias: { obsidian: fileURLToPath(new URL("./test/obsidian-stub.ts", import.meta.url)) },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
  },
});
