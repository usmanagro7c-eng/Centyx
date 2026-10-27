import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: {
        "/api": {
          target: process.env.VITE_BACKEND_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});