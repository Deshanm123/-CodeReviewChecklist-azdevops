import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/extension/code-review",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../../../dist/extension/code-review",
    emptyOutDir: true,
  },
});

