import react from "@vitejs/plugin-react";
import os from "node:os";
import { defineConfig } from "vite";

const hmrHost = process.env.LABTORIO_HMR_HOST;
const hmrClientPort = Number(process.env.LABTORIO_HMR_CLIENT_PORT || "443");
const hmrPath = process.env.LABTORIO_HMR_PATH || "/@vite-hmr";
const cacheOwner = typeof process.getuid === "function" ? process.getuid() : "user";
const cacheDir =
  process.env.VITE_CACHE_DIR || `${os.tmpdir()}/factorio-gui-web-editor-vite-${cacheOwner}`;

export default defineConfig({
  cacheDir,
  plugins: [react()],
  server: {
    hmr: hmrHost
      ? {
          clientPort: hmrClientPort,
          host: hmrHost,
          path: hmrPath,
          protocol: "wss"
        }
      : undefined
  }
});
