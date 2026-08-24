import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://127.0.0.1:3001";
  const port = Number(env.VITE_PORT) || 5100;
  const proxy = {
    "/api": {
      target: apiBaseUrl,
      changeOrigin: true,
      secure: false,
    },
    "/ws": {
      target: apiBaseUrl,
      changeOrigin: true,
      secure: false,
      ws: true,
    },
    "/images": {
      target: apiBaseUrl,
      changeOrigin: true,
      secure: false,
    },
  };

  return {
    plugins: [react()],
    server: {
      port,
      proxy,
    },
    preview: {
      port,
      proxy,
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        input: "index.html",
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
        },
      },
    },
  };
});
