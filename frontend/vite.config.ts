import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue(), vuetify({ autoImport: true })],
    server: {
      port: 5173,
      proxy: { "/api": env.VITE_API_URL ? undefined : "http://localhost:4000" },
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? "/api"),
    },
  };
});
