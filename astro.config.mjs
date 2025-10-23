// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// import.meta.env.PROD is automatically true during builds (npm run build)
// and false during development (npm run dev)
const isProduction = import.meta.env.PROD;

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://settlements-88a.pages.dev/", // Update this to your actual Cloudflare Pages URL
  integrations: [react(), sitemap()],
  server: { port: 4321 },
  vite: {
    // @ts-expect-error - Tailwind CSS plugin type compatibility
    plugins: [tailwindcss()],
    resolve: {
      alias: isProduction
        ? {
            // Use edge-compatible React DOM server for Cloudflare Workers
            // This prevents "MessageChannel is not defined" error with React 19
            "react-dom/server": "react-dom/server.edge",
          }
        : {},
    },
    ssr: {
      external: ["node:async_hooks"],
    },
  },
  adapter: cloudflare({
    // @ts-expect-error - runtime.mode is valid but not in current type definitions
    runtime: {
      mode: "directory", // Optimizes for Cloudflare's directory-based routing
    },
    platformProxy: {
      enabled: true,
    },
    imageService: "compile", // Use compile-time image optimization
  }),
});
