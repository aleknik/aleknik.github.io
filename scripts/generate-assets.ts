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
      .flatten({ background: '#101e34' })
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
  <rect width="1200" height="630" fill="#080e18"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#101b2c" stroke="#243249"/>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="100" y="143" font-size="20" fill="#87b4ff">${profile.role}</text>
    <text x="94" y="275" font-size="88" font-weight="600" fill="#edf2fa">${profile.firstName}</text>
    <text x="94" y="370" font-size="88" font-weight="600" fill="#87b4ff">${profile.lastName}</text>
    <text x="100" y="435" font-size="24" fill="#a0aec3">${profile.city}, ${profile.country}</text>
    <text x="100" y="525" font-size="20" fill="#a0aec3">aleknik.com</text>
  </g>
  <g transform="translate(710 145) scale(6)">
    <path d="M32 16 17 48h16l-3-7h-3l5-11 8 18h8L34 16Z" fill="#87b4ff"/>
  </g>
</svg>`

await sharp(Buffer.from(socialCard))
  .png()
  .toFile(new URL('social-card.png', publicDirectory).pathname)

console.log(
  'Generated favicons, install icons, and the 1200 x 630 social card.',
)
