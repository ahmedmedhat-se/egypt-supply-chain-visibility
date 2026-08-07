import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev proxy: with VITE_API_BASE_URL defaulting to '' (same-origin),
      // forward API + WebSocket calls to the NestJS backend in development.
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:8081",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
