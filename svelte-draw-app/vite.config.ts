import path from "node:path";
import { fileURLToPath } from "node:url";

import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

import { lazyChunksPlugin } from "./pwa-lazy-chunks.ts";

const packagesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages",
);

export default defineConfig(({ command, mode }) => {
  // the service worker is only registered by production builds, like
  // `devOptions.enabled` of the old VitePWA config; opt in for dev/preview
  // with `VITE_APP_ENABLE_PWA=true` (shell env, or a .env file in the repo
  // root or in this directory)
  const appDir = path.dirname(fileURLToPath(import.meta.url));
  const envVars = {
    ...loadEnv(mode, path.resolve(appDir, ".."), "VITE_APP_"),
    ...loadEnv(mode, appDir, "VITE_APP_"),
    ...process.env,
  };
  const registerServiceWorker =
    command === "build" || envVars.VITE_APP_ENABLE_PWA === "true";

  return {
    server: {
      // the editor sources (incl. bundled fonts) live outside the app root
      fs: { allow: [path.resolve(packagesDir, "..")] },
    },
    plugins: [
      sveltekit({
        adapter: adapter({ pages: "build", assets: "build", strict: true }),
        // `register` is baked into the HTML script at build time; the dev
        // server would otherwise register the service worker automatically
        ...(registerServiceWorker
          ? {}
          : { serviceWorker: { register: false as const } }),
      }),
      lazyChunksPlugin(),
    ],
  };
});
