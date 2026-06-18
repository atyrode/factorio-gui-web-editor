import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const hmrHost = process.env.LABTORIO_HMR_HOST;
const hmrClientPort = Number(process.env.LABTORIO_HMR_CLIENT_PORT || "443");

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: hmrHost
      ? {
          clientPort: hmrClientPort,
          host: hmrHost,
          protocol: "wss"
        }
      : undefined
  }
});
