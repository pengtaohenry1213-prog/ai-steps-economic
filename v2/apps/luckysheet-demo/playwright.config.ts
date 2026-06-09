import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  expect: {
    timeout: 8000
  },
  fullyParallel: false, // 多标签页协作测试需要串行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // 协作测试需要单 worker
  reporter: [['html', { outputFolder: 'tests/e2e/html-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:3008',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  // 注意：运行 E2E 测试前，请先手动启动 dev server：
  //终端 1：cd apps/luckysheet-demo && pnpm run dev
  // 终端 2：pnpm --filter luckysheet-demo run test:e2e
  // Playwright 会通过 reuseExistingServer: true 复用已有 server
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3008',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
    // 可按需添加 Firefox / WebKit
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ]
})