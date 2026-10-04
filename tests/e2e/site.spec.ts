import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { contactLinks, profile } from '../../src/data/site'
import { createOfflineOrigin } from './helpers/offline-origin'

test('renders the full profile and working destinations without runtime errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('requestfailed', (request) => errors.push(request.url()))
  page.on('request', (request) => requests.push(request.url()))

  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Aleksandar Nikolic | Software Engineer')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    profile.name,
  )
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.locator('#about p')).toHaveText(
    'Software engineer in Belgrade, Serbia.',
  )

  const contacts = page.getByRole('navigation', { name: 'Contact links' })
  for (const link of contactLinks) {
    const anchor = contacts.getByRole('link', {
      name: `${link.name}${link.external ? ' (opens in a new tab)' : ''}`,
      exact: true,
    })
    await expect(anchor).toHaveAttribute('href', link.href)
    if (link.external) {
      await expect(anchor).toHaveAttribute('target', '_blank')
      await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
    } else {
      await expect(anchor).not.toHaveAttribute('target')
    }
  }

  await page.evaluate(() => document.fonts.ready)
  expect(errors).toEqual([])
  const origin = new URL(page.url()).origin
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true)
  expect(requests.some((url) => /\.(woff2?|ttf|otf)(?:\?|$)/i.test(url))).toBe(
    false,
  )
  await expect(
    page.locator('canvas, astro-island, aside, .contact-card, h2'),
  ).toHaveCount(0)
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(250, 250, 250)',
  )
  await expect(page.locator('html')).toHaveCSS('color', 'rgb(34, 34, 34)')
  const words = (await page.getByRole('main').innerText()).trim().split(/\s+/)
  expect(
    words.length,
    'Keep the initial introduction and contacts concise',
  ).toBeLessThanOrEqual(24)
  await page.screenshot({
    path: testInfo.outputPath('page.png'),
    fullPage: true,
  })
})

test('supports keyboard navigation and existing section bookmarks', async ({
  page,
  browserName,
}) => {
  await page.goto('/')
  const nextLink =
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab'
  await page.keyboard.press(nextLink)
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.keyboard.press(nextLink)
  await expect(
    page.getByRole('link', {
      name: 'GitHub (opens in a new tab)',
      exact: true,
    }),
  ).toBeFocused()
  await page.keyboard.press(nextLink)
  await expect(
    page.getByRole('link', {
      name: 'LinkedIn (opens in a new tab)',
      exact: true,
    }),
  ).toBeFocused()
  await page.keyboard.press(nextLink)
  await expect(
    page.getByRole('link', { name: 'Email', exact: true }),
  ).toBeFocused()
  await page.keyboard.press(nextLink)
  await expect(
    page.getByRole('button', { name: 'Copy email address' }),
  ).toBeFocused()

  await page.goto('/#connect')
  await expect(
    page.getByRole('navigation', { name: 'Contact links' }),
  ).toBeInViewport()
  await page.goto('/#about')
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
})

test('fits narrow, tablet, and desktop screens and enlarged text', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(
      dimensions.content,
      `horizontal overflow at ${width}px`,
    ).toBeLessThanOrEqual(dimensions.viewport)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expect(page.getByRole('link', { name: /^Email\b/ })).toBeInViewport()
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(900)
  }

  await page.setViewportSize({ width: 320, height: 900 })
  await page.addStyleTag({ content: 'html { font-size: 200%; }' })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('honors reduced motion without running a background animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  await expect(page.locator('.contact-link').first()).toHaveCSS(
    'transition-duration',
    '0s',
  )
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
})

test('copies email and announces success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset['copiedEmail'] = text
        },
      },
    })
  })
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveCount(1)
  await page.getByRole('button', { name: 'Copy email address' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied.')
  await expect(page.locator('html')).toHaveAttribute(
    'data-copied-email',
    profile.email,
  )
  await expect(
    page.getByRole('button', { name: 'Copy email address' }),
  ).toBeEnabled()
})

test('reports a denied clipboard permission and keeps the email link usable', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException('Permission denied', 'NotAllowedError')
        },
      },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Copy email address' }).click()
  await expect(page.getByRole('status')).toHaveText(
    `Copy failed. ${profile.email}`,
  )
  await expect(
    page.getByRole('button', { name: 'Copy email address' }),
  ).toBeEnabled()
  await expect(page.getByRole('link', { name: /^Email\b/ })).toHaveAttribute(
    'href',
    `mailto:${profile.email}`,
  )
  expect(
    errors.some((error) => error.includes('Could not copy the email address.')),
  ).toBe(true)
})

test('provides a fallback when the Clipboard API is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
  })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Copy email address' }),
  ).toBeHidden()
  await expect(page.getByRole('status')).toHaveText(`Email: ${profile.email}`)
  await expect(page.getByRole('link', { name: /^Email\b/ })).toBeVisible()
})

test('reloads the styled page and manifest offline after the first visit', async ({
  page,
  baseURL,
}) => {
  if (!baseURL)
    throw new Error('The production preview URL must be configured.')
  const origin = await createOfflineOrigin(baseURL)
  try {
    await page.goto(origin.url)
    await page.evaluate(() => navigator.serviceWorker.ready)
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true)
    origin.disconnect()
    await page.reload()

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      profile.name,
    )
    await expect(page.locator('html')).toHaveCSS(
      'background-color',
      'rgb(250, 250, 250)',
    )
    await expect(page.getByRole('link', { name: /^Email\b/ })).toBeVisible()
    const manifest = await page.evaluate(async () =>
      (await fetch('/manifest.webmanifest')).json(),
    )
    expect(manifest.name).toBe(profile.name)
    expect(manifest.background_color).toBe('#fafafa')
    await expect(
      page.evaluate(() => fetch('/uncached-network-probe')),
    ).rejects.toThrow()
  } finally {
    await origin.close()
  }
})

test('serves a real 404 with a route back home', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Page not found.',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  )
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    profile.name,
  )
})

test('has valid canonical, social, crawler, and install metadata', async ({
  page,
  request,
}) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    profile.siteUrl,
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${profile.siteUrl}social-card.png`,
  )
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )

  const schema = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.textContent ?? ''))
  expect(schema['@type']).toBe('Person')
  expect(schema.name).toBe(profile.name)
  expect(schema.sameAs).toEqual([
    'https://github.com/aleknik',
    'https://www.linkedin.com/in/aleknik',
  ])

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain(
    `Sitemap: ${profile.siteUrl}sitemap.xml`,
  )
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  expect(await sitemap.text()).toContain(`<loc>${profile.siteUrl}</loc>`)
  expect(await sitemap.text()).not.toContain('404')

  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    name: profile.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#222222',
    background_color: '#fafafa',
  })
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    manifest.theme_color,
  )
  const favicon = await request.get('/favicon.svg')
  expect(await favicon.text()).toContain('fill="#222222"')
  expect(await favicon.text()).toContain('fill="#fafafa"')
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src)
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image/png')
  }

  const socialImage = await request.get('/social-card.png')
  expect(socialImage.ok()).toBe(true)
  const png = await socialImage.body()
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(630)
})

test('passes WCAG 2.2 AA automated checks on both pages', async ({ page }) => {
  for (const path of ['/', '/this-page-does-not-exist/']) {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)
    const results = await new AxeBuilder({ page })
      .options({
        rules: { 'label-content-name-mismatch': { enabled: true } },
      })
      .withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa',
        'best-practice',
      ])
      .analyze()
    expect(results.violations, `accessibility violations on ${path}`).toEqual(
      [],
    )
  }
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('delivers the complete profile, navigation, and contact links as HTML', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      profile.name,
    )
    await expect(page.getByRole('link', { name: /^Email\b/ })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
    await expect(
      page.getByRole('button', { name: 'Copy email address' }),
    ).toBeHidden()
    await expect(
      page.getByRole('navigation', { name: 'Contact links' }),
    ).toBeInViewport()
  })
})
