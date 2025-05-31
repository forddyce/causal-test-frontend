import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  plugins: [react()],
});
