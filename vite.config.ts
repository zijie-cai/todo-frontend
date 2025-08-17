import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// replace with your repo name:
const basePath = "/todo-frontend/";

export default defineConfig({
  plugins: [react()],
  base: basePath,
  build: { outDir: "docs" } 
});