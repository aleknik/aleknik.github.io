# Aleksandar Nikolić

A small, fast personal site at [aleknik.com](https://aleknik.com/). Built with Astro,
TypeScript, and scoped CSS. The full page is rendered at build time: there is no
React runtime, hydration, canvas animation, analytics, or third-party asset request.
The dark-blue profile keeps the copy short, uses a static geometric monogram, and
makes LinkedIn the primary way to connect, with email as the only secondary option.
The responsive profile pairs a typographic introduction with a decorative monogram
on wide screens, then switches to a compact single column and full-width primary
contact button on phones. Quiet borders, shared alignment, and balanced vertical
spacing keep both layouts consistent. Contact controls have at least 44px touch
targets; color transitions respect reduced-motion preferences.

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
  skip navigation, the shared footer, and offline registration.
- [src/styles/global.css](src/styles/global.css): design tokens, typography,
  shared page insets, controls, focus states, and reduced-motion support. The
  header, profile content, and footer use the same responsive left alignment.
- [src/lib/](src/lib/): typed icons and progressively enhanced email disclosure.
  Decode and clipboard failures are announced and logged.
- [src/pages/](src/pages/): homepage, real 404 page, sitemap, robots file, and
  install manifest.
- [scripts/](scripts/): asset generation, offline caching, and build-size checks.
- [tests/](tests/): unit/component tests and production-browser tests.

Content and social links work with JavaScript disabled. External links announce
that they open a new tab. Email uses a native disclosure; JavaScript reveals the
address and enables click-to-email and clipboard copy after opening it.

### Email harvesting deterrence

The full address and `mailto` link are not rendered into initial HTML, metadata,
structured data, or script bundles. An encoded payload is decoded only when a
visitor opens **Email me**. Without JavaScript, the disclosure explains that email
requires JavaScript and directs visitors to LinkedIn. No extra service, tracking,
or CAPTCHA is used.

This is obfuscation, not encryption or spam prevention: a capable scraper can
decode the payload or parse the written fallback. Previously public copies and
Git history also remain public. A separate revocable email alias or a server-backed
contact form with rate limits would offer stronger protection, but requires a
mail/form service outside this GitHub Pages site.

[Cloudflare's documentation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/)
describes a similar approach and notes that scripts, metadata, and most attributes
are not covered by its automatic obfuscation. This site does not depend on that
proxy feature. The build checks every output asset for raw and URL-encoded address
leaks, and browser tests verify there is no usable email link before disclosure.

To change the address, update the `emailContact.encoded` base64 value in
[src/data/site.ts](src/data/site.ts).

### Branding

Edit [public/favicon.svg](public/favicon.svg), then run `npm run assets` to rebuild
the PNG/ICO icons and 1200 x 630 social preview. The social preview uses the profile
data and its layout is defined in [scripts/generate-assets.ts](scripts/generate-assets.ts).
Commit the generated assets together with their source changes.

No font files are downloaded. The page uses system sans-serif typography and a
monospace role label. There is no animated background or rendering loop.

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

- Factual, concise content, a dark-blue palette, LinkedIn priority, no font downloads,
  contact destinations, and absence of page errors.
- Keyboard/skip navigation, existing section bookmarks, reduced motion, 320-1440px layouts
  including both sides of responsive breakpoints, consistent left alignment,
  full-width mobile contacts, 44px touch targets, expanded email at 200% text sizing,
  and header reflow with wider fallback fonts.
- User-triggered email reveal, no raw address in initial output, written no-JS fallback,
  clipboard success, permission denial, missing APIs, and Chromium's native clipboard.
- Fully functional HTML without JavaScript.
- Offline reloads, cached styles, and the install manifest.
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
| Homepage HTML      |   4 KiB |
| Shared CSS         |   4 KiB |
| Browser JavaScript |   2 KiB |
| Downloaded fonts   |   0 KiB |
| Brand SVG          |   1 KiB |
| Total page assets  |   8 KiB |

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
