import { fileURLToPath } from 'node:url'
import { generateSW } from 'workbox-build'

const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const { count, size, warnings } = await generateSW({
  globDirectory: outputDirectory,
  swDest: `${outputDirectory}sw.js`,
  globPatterns: [
    'index.html',
    '_astro/*.{js,css,woff2}',
    'favicon.svg',
    'icons/android-chrome-192x192.png',
    'icons/android-chrome-512x512.png',
    'icons/apple-touch-icon.png',
    'manifest.webmanifest',
    'manrope-license.txt',
  ],
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  sourcemap: false,
})

if (warnings.length > 0) {
  throw new Error(`Service worker build failed:\n${warnings.join('\n')}`)
}

console.log(`Offline cache: ${count} files, ${(size / 1024).toFixed(1)} KiB.`)
