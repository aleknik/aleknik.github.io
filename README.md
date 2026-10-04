# Aleksandar Nikolic

A small, fast personal site at [aleknik.com](https://aleknik.com/). Built with Astro,
TypeScript, and scoped CSS. The full page is rendered at build time: there is no
React runtime, hydration, canvas animation, analytics, or third-party asset request.

## Development

Use Node.js 24 LTS (see [.nvmrc](.nvmrc)) and npm 11 or newer.

```sh
nvm use
npm ci
npm run dev
```

To inspect the production site, including its service worker:

```sh
npm run build
npm run preview
```

## Structure

- [src/data/site.ts](src/data/site.ts): the profile, contact destinations, and
  structured data. Update personal content here.
- [src/components/](src/components/): reusable, statically rendered UI components
  with scoped styles.
- [src/layouts/PageLayout.astro](src/layouts/PageLayout.astro): document metadata,
  local font preload, shared navigation, and offline registration.
- [src/styles/global.css](src/styles/global.css): design tokens, typography,
  shared controls, focus states, and reduced-motion support.
- [src/lib/](src/lib/): typed icons and the progressively enhanced email-copy
  control. Clipboard failures are announced and logged; the email link always works.
- [src/pages/](src/pages/): homepage, real 404 page, sitemap, robots file, and
  install manifest.
- [scripts/](scripts/): asset generation, offline caching, and build-size checks.
- [tests/](tests/): unit/component tests and production-browser tests.

All content and navigation work with JavaScript disabled. External links announce
that they open a new tab; email links open the visitor's email client. The copy
control appears only when the Clipboard API is available.

### Branding

Edit [public/favicon.svg](public/favicon.svg), then run `npm run assets` to rebuild
the PNG/ICO icons and 1200 x 630 social preview. The social preview uses the profile
data and its layout is defined in [scripts/generate-assets.ts](scripts/generate-assets.ts).
Commit the generated assets together with their source changes.

The variable Manrope font is bundled locally, preloaded, and limited to its Latin
subset. Its [SIL Open Font License](public/manrope-license.txt) is copied from the
Fontsource package by the asset generator and distributed with the site.

## Validation

```sh
npm run format       # Format source and documentation
npm run check        # Strict TypeScript and Astro template checks
npm run test:unit    # Vitest component/unit tests with coverage
npx playwright install chromium firefox webkit
npm run test:e2e     # Build, enforce size budgets, test the production output
npm run verify      # Formatting, types, unit tests, build, and browser tests
npm audit           # Check dependency advisories
```

Playwright starts an isolated production preview on `127.0.0.1:4322`. It does not
reuse a development server or replace an existing preview (Astro's `--ignore-lock`
flag allows the test server to run alongside it). Tests cover Chromium, Firefox, WebKit, Android-sized
Chrome, and iPhone-sized Safari:

- Factual content, email/social destinations, and absence of page errors.
- Keyboard/skip navigation, in-page links, reduced motion, 320-1440px layouts,
  and 200% text sizing.
- Clipboard success, permission denial, missing APIs, and Chromium's native clipboard.
- Fully functional HTML without JavaScript.
- Offline reloads, locally cached fonts, and the install manifest.
- Canonical/social metadata, crawler files, image sizes, and 404 recovery.
- Automated WCAG 2.2 AA checks on the homepage and 404 page using axe, including
  explicit label-in-name checks for screen readers and voice control.
- Mobile-sized LCP below 2.5 seconds and CLS below 0.1 with 4x CPU throttling,
  150ms latency, and a 1.6 Mbps download connection.

Offline tests disconnect a dedicated local origin and also assert that uncached
requests fail. This verifies actual network failure without WebKit's unreliable
offline-emulation switch. Keyboard tests use Safari's Option-Tab shortcut on macOS.
Playwright and its browser revisions are pinned for reproducibility.

If macOS blocks Firefox's test subprocess with a sandbox/permission error, do not
disable OS or browser security. Run the local Chromium/WebKit projects explicitly
and use the required Linux CI job to verify the complete Firefox-inclusive matrix:

```sh
npx playwright test --project=chromium --project=webkit --project=mobile-chromium --project=mobile-webkit
```

Unit tests require 100% statement, branch, function, and line coverage for the
client-side email logic and shared data/icon modules. Astro components are tested
using Astro's container API, in addition to the browser checks. Automated
accessibility checks supplement, rather than replace, manual keyboard and visual review.

The build enforces these gzip budgets:

| Asset group        | Maximum |
| ------------------ | ------: |
| Homepage HTML      |   8 KiB |
| Shared CSS         |   8 KiB |
| Browser JavaScript |   4 KiB |
| Local font         |  32 KiB |
| Brand SVG          |   1 KiB |
| Total page assets  |  52 KiB |

Offline/install assets and the social preview are not render-blocking page assets.
The JavaScript budget includes inline scripts; the total counts them only once,
as part of the HTML.
The service worker starts after page load, precaches the homepage and local
resources, and cleans up outdated caches. It keeps the existing `/sw.js` URL so
previous installations can update. Development does not register a service worker.

Reports live in ignored `coverage/`, `playwright-report/`, and `test-results/`
directories. Run `npx playwright show-report` to inspect browser results.

## Deployment

[GitHub Actions](.github/workflows/deploy.yml) validates pull requests and pushes
to `master` or `main`. Only successful push/manual runs deploy to GitHub Pages.
Formatting, types, unit coverage, all browser tests, performance budgets, and the
dependency audit must pass first. CI uploads test reports for troubleshooting.

Commit and push source changes; do not commit `dist/` or deploy around the checks.
The [CNAME](public/CNAME) keeps the `aleknik.com` custom domain. GitHub Pages is
configured to deploy using GitHub Actions; the existing domain proxy handles HTTPS.

## License

[MIT](LICENSE).
