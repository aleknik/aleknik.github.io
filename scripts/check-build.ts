import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { emailContact } from '../src/data/site.ts'

const output = new URL('../dist/', import.meta.url)
const assetDirectory = new URL('_astro/', output)
const assets = await readdir(assetDirectory)

async function compressedSize(names: string[]) {
  const sizes = await Promise.all(
    names.map(
      async (name) =>
        gzipSync(await readFile(new URL(name, assetDirectory))).byteLength,
    ),
  )
  return sizes.reduce((total, size) => total + size, 0)
}

const document = await readFile(new URL('index.html', output), 'utf8')
const html = gzipSync(document).byteLength
const css = await compressedSize(assets.filter((name) => name.endsWith('.css')))
const externalJavascript = await compressedSize(
  assets.filter((name) => name.endsWith('.js')),
)
let inlineJavascript = 0
for (const [, attributes, content] of document.matchAll(
  /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
)) {
  if (content && !attributes?.includes('application/ld+json')) {
    inlineJavascript += gzipSync(content).byteLength
  }
}
const javascript = externalJavascript + inlineJavascript
const fonts = await compressedSize(
  assets.filter((name) => /\.(woff2?|ttf|otf)$/.test(name)),
)
const brand = gzipSync(
  await readFile(new URL('favicon.svg', output)),
).byteLength
const budgets = [
  { name: 'HTML', size: html, limit: 4 * 1024 },
  { name: 'CSS', size: css, limit: 4 * 1024 },
  { name: 'Browser JavaScript', size: javascript, limit: 2 * 1024 },
  { name: 'Fonts', size: fonts, limit: 0 },
  { name: 'Brand SVG', size: brand, limit: 1024 },
  {
    name: 'Total page assets',
    size: html + css + externalJavascript + fonts + brand,
    limit: 8 * 1024,
  },
]

for (const { name, size, limit } of budgets) {
  console.log(`${name}: ${(size / 1024).toFixed(2)} / ${limit / 1024} KiB gzip`)
  if (size > limit) {
    throw new Error(
      `${name} exceeds its performance budget (${size} > ${limit} bytes).`,
    )
  }
}

for (const file of [
  '404.html',
  'CNAME',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'sw.js',
  'social-card.png',
]) {
  await readFile(new URL(file, output))
}

const email = Buffer.from(emailContact.encoded, 'base64').toString('utf8')
const forbidden = [email, encodeURIComponent(email)]
for (const file of await readdir(output, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!file.isFile()) continue
  const content = await readFile(join(file.parentPath, file.name))
  if (forbidden.some((value) => content.includes(value))) {
    throw new Error(
      `Raw email address leaked into the published asset: ${file.name}`,
    )
  }
}
console.log('Email privacy: no raw or URL-encoded address in published assets.')
