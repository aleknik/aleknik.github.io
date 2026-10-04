import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { contactLinks, emailContact, profile } from '../../src/data/site'
import { createOfflineOrigin } from './helpers/offline-origin'

const email = Buffer.from(emailContact.encoded, 'base64').toString('utf8')

test('keeps email out of initial markup and reveals it only on request', async ({
  page,
  request,
}) => {
  const source = await request.get('/')
  const html = await source.text()
  expect(html).not.toContain(email)
  expect(html).not.toContain(encodeURIComponent(email))
  expect(html).not.toContain(' at ')
  expect(html).not.toContain(' dot ')
  await page.goto('/')
  await expect(page.locator('details')).not.toHaveAttribute('open')
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0)
  expect(await page.content()).not.toContain(email)
  await page.locator('summary').click()
  await expect(page.locator('[data-email-address]')).toHaveText(email)
  await expect(
    page.getByRole('link', { name: 'Open email app' }),
  ).toHaveAttribute('href', `mailto:${email}`)
  await page.locator('summary').click()
  await expect(page.locator('[data-email-address]')).toBeHidden()
  await page.locator('summary').click()
  await expect(page.locator('[data-email-address]')).toHaveText(email)
})

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
  await expect(page).toHaveTitle('Aleksandar Nikolić | Software Engineer')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    profile.name,
  )
  await expect(page.locator('.surname')).toHaveText('Nikolić')
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.locator('#about .role')).toHaveText('Software engineer')
  await expect(page.locator('#about .location')).toHaveText('Belgrade, Serbia')

  const contacts = page.getByRole('navigation', { name: 'Contact links' })
  await expect(contacts.getByRole('link')).toHaveCount(1)
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0)
  for (const link of contactLinks) {
    const anchor = contacts.getByRole('link', {
      name: `${link.label} (opens in a new tab)`,
      exact: true,
    })
    await expect(anchor).toHaveAttribute('href', link.href)
    await expect(anchor).toHaveAttribute('target', '_blank')
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await expect(contacts.getByRole('link').first()).toHaveAttribute(
    'href',
    contactLinks[0].href,
  )
  await expect(contacts.locator('.primary')).toHaveAccessibleName(
    'Connect on LinkedIn (opens in a new tab)',
  )
  await expect(contacts.locator('.primary')).toHaveCSS(
    'background-color',
    'rgb(33, 96, 207)',
  )

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
    'rgb(8, 14, 24)',
  )
  await expect(page.locator('html')).toHaveCSS('color', 'rgb(237, 242, 250)')
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
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
      name: 'Connect on LinkedIn (opens in a new tab)',
      exact: true,
    }),
  ).toBeFocused()
  await page.keyboard.press(nextLink)
  await expect(page.locator('summary')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-email-address]')).toHaveText(email)
  await page.keyboard.press(nextLink)
  await expect(page.getByRole('link', { name: 'Open email app' })).toBeFocused()

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
    await expect(page.locator('summary')).toBeInViewport()
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

test('aligns the header, profile text, contacts, and footer to one left edge', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.primary')).toHaveCSS(
    'justify-content',
    'flex-start',
  )
  await expect(page.locator('.primary')).toHaveCSS('text-align', 'left')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const edges = await page.evaluate(() =>
      [
        'header a',
        '.role',
        'h1 > span:first-child',
        '.surname',
        '.location',
        '.primary',
        'summary',
        'footer small',
      ].map((selector) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error(`Missing alignment target: ${selector}`)
        return { selector, left: element.getBoundingClientRect().left }
      }),
    )
    const reference = edges.find(({ selector }) => selector === '.role')
    if (!reference) throw new Error('Missing profile alignment reference.')
    for (const edge of edges) {
      expect(
        Math.abs(edge.left - reference.left),
        `${edge.selector} must align with the role at ${width}px`,
      ).toBeLessThanOrEqual(0.5)
    }
  }
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
  await page.locator('summary').click()
  await expect(page.getByRole('status')).toHaveCount(1)
  await page.getByRole('button', { name: 'Copy address' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied.')
  await expect(page.locator('html')).toHaveAttribute('data-copied-email', email)
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeEnabled()
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
  await page.locator('summary').click()
  await page.getByRole('button', { name: 'Copy address' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Copy failed. Select the address above instead.',
  )
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeEnabled()
  await expect(
    page.getByRole('link', { name: 'Open email app' }),
  ).toHaveAttribute('href', `mailto:${email}`)
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
  await page.locator('summary').click()
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeHidden()
  await expect(page.locator('[data-email-address]')).toHaveText(email)
  await expect(
    page.getByRole('link', { name: 'Open email app' }),
  ).toHaveAttribute('href', `mailto:${email}`)
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
      'rgb(8, 14, 24)',
    )
    await page.locator('summary').click()
    await expect(
      page.getByRole('link', { name: 'Open email app' }),
    ).toHaveAttribute('href', `mailto:${email}`)
    const manifest = await page.evaluate(async () =>
      (await fetch('/manifest.webmanifest')).json(),
    )
    expect(manifest.name).toBe(profile.name)
    expect(manifest.background_color).toBe('#080e18')
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
  await expect(page).toHaveTitle(`Page not found | ${profile.name}`)
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
  await expect(page.locator('meta[name="author"]')).toHaveAttribute(
    'content',
    profile.name,
  )
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    profile.description,
  )
  for (const selector of [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]) {
    await expect(page.locator(selector)).toHaveAttribute(
      'content',
      `${profile.name} | Software Engineer`,
    )
  }
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    `${profile.name}, software engineer based in ${profile.city}, ${profile.country}`,
  )
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
  expect(schema.sameAs).toEqual(['https://www.linkedin.com/in/aleknik'])
  expect(schema).not.toHaveProperty('email')

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
    theme_color: '#080e18',
    background_color: '#080e18',
  })
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    manifest.theme_color,
  )
  const favicon = await request.get('/favicon.svg')
  expect(await favicon.text()).toContain('fill="#101e34"')
  expect(await favicon.text()).toContain('fill="#87b4ff"')
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
    if (path === '/') {
      await page.locator('summary').click()
      const expanded = await new AxeBuilder({ page }).analyze()
      expect(expanded.violations, 'Expanded email accessibility').toEqual([])
    }
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
    await page.locator('summary').click()
    await expect(page.locator('[data-email-address]')).toContainText(
      'Email requires JavaScript.',
    )
    await expect(page.locator('[data-email-address]')).toContainText(
      'connect on LinkedIn instead.',
    )
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Copy address' }),
    ).toBeHidden()
    await expect(
      page.getByRole('navigation', { name: 'Contact links' }),
    ).toBeInViewport()
  })
})
