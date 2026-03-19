import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testMatch: ["**/*.spec.ts", "**/*.e2e.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run dev:api",
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "CONTENT_DIR=test/content bun run dev:ui -- --port 5174",
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
