import { expect, test } from '@playwright/test'
import { profile } from '../../src/data/site'

declare global {
  interface Window {
    siteMetrics: { lcp: number; cls: number }
  }
}

test('copies to the real browser clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Copy email address' }).click()
  await expect(page.getByRole('status')).toContainText('Email address copied.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    profile.email,
  )
})

test('meets Core Web Vitals budgets on a throttled mobile-sized page', async ({
  page,
  context,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    window.siteMetrics = { lcp: 0, cls: 0 }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.siteMetrics.lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          'hadRecentInput' in entry &&
          !entry.hadRecentInput &&
          'value' in entry &&
          typeof entry.value === 'number'
        ) {
          window.siteMetrics.cls += entry.value
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: 'cellular4g',
  })
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await expect
    .poll(() => page.evaluate(() => window.siteMetrics.lcp))
    .toBeGreaterThan(0)
  const metrics = await page.evaluate(() => window.siteMetrics)

  await testInfo.attach('core-web-vitals', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  })
  console.log(
    `Mobile Web Vitals: LCP ${Math.round(metrics.lcp)}ms; CLS ${metrics.cls.toFixed(4)}`,
  )
  expect(
    metrics.lcp,
    'Largest Contentful Paint must be below 2.5 seconds',
  ).toBeLessThan(2500)
  expect(metrics.cls, 'Cumulative Layout Shift must be below 0.1').toBeLessThan(
    0.1,
  )
})
