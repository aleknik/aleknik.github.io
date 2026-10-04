import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { profile } from '../src/data/site.ts'

const publicDirectory = new URL('../public/', import.meta.url)
const mark = await readFile(new URL('favicon.svg', publicDirectory))
const icons = [
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['mstile-150x150.png', 150],
] as const

await Promise.all(
  icons.map(async ([name, size]) => {
    const image = await sharp(mark)
      .resize(size, size)
      .flatten({ background: '#222222' })
      .png()
      .toBuffer()
    await writeFile(new URL(`icons/${name}`, publicDirectory), image)
  }),
)

const png = await readFile(new URL('icons/favicon-32x32.png', publicDirectory))
const icoHeader = Buffer.alloc(22)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)
icoHeader[6] = 32
icoHeader[7] = 32
icoHeader.writeUInt16LE(1, 10)
icoHeader.writeUInt16LE(32, 12)
icoHeader.writeUInt32LE(png.length, 14)
icoHeader.writeUInt32LE(22, 18)
await writeFile(
  new URL('favicon.ico', publicDirectory),
  Buffer.concat([icoHeader, png]),
)

const socialCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fafafa"/>
  <text x="96" y="280" font-family="Georgia, Times New Roman, serif" font-size="76" fill="#222222">${profile.name}</text>
  <g font-family="Arial, Helvetica, sans-serif" fill="#686868">
    <text x="100" y="346" font-size="28">${profile.role} in ${profile.city}, ${profile.country}.</text>
    <text x="100" y="542" font-size="20">aleknik.com</text>
  </g>
</svg>`

await sharp(Buffer.from(socialCard))
  .png()
  .toFile(new URL('social-card.png', publicDirectory).pathname)

console.log(
  'Generated favicons, install icons, and the 1200 x 630 social card.',
)
