import { defineConfig } from "@playwright/test";

// Uses the Chrome installed on the machine (no browser download needed).
// CI installs Chrome via the `chrome` channel of the Playwright action.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
  },
  webServer: {
    // dev mode: the editor only exposes the `window.h` test hook outside production builds
    command: "pnpm run dev --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
