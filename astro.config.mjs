// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://settlements-88a.pages.dev/", // Update this to your actual Cloudflare Pages URL
  integrations: [react(), sitemap()],
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Use edge-compatible React DOM server for Cloudflare Workers
        // This prevents "MessageChannel is not defined" error with React 19
        "react-dom/server": "react-dom/server.edge",
      },
    },
    ssr: {
      external: ["node:async_hooks"],
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "compile", // Use compile-time image optimization
  }),
});
