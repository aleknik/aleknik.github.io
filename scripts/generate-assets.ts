import { copyFile, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { profile } from '../src/data/site.ts'

const publicDirectory = new URL('../public/', import.meta.url)
await copyFile(
  new URL(
    '../node_modules/@fontsource-variable/manrope/LICENSE',
    import.meta.url,
  ),
  new URL('manrope-license.txt', publicDirectory),
)
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
      .flatten({ background: '#24483c' })
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
  <rect width="1200" height="630" fill="#f6f7f2"/>
  <rect x="800" y="40" width="360" height="550" rx="28" fill="#24483c"/>
  <g fill="none" stroke="#91b889" opacity=".35">
    <circle cx="980" cy="300" r="140"/>
    <circle cx="980" cy="300" r="100"/>
    <path d="M820 300h320M980 90v420"/>
  </g>
  <g transform="translate(810 124) scale(5.3)">
    <path d="M32 16 17 48h16l-3-7h-3l5-11 8 18h8L34 16Z" fill="#d6efb5"/>
  </g>
  <g font-family="Arial, Helvetica, sans-serif" fill="#222b27">
    <text x="72" y="108" font-size="28" font-weight="700">${profile.handle}.</text>
    <text x="68" y="260" font-size="90" font-weight="700" letter-spacing="-5">${profile.firstName}</text>
    <text x="68" y="358" font-size="90" font-weight="700" letter-spacing="-5">${profile.lastName}.</text>
    <text x="72" y="436" font-size="28" fill="#60685f">${profile.role}. Based in ${profile.city}, ${profile.country}.</text>
    <text x="72" y="550" font-size="24" fill="#24483c">Code. Conversation. Connection.</text>
    <text x="844" y="546" font-size="22" fill="#d6efb5">aleknik.com</text>
  </g>
</svg>`

await sharp(Buffer.from(socialCard))
  .png()
  .toFile(new URL('social-card.png', publicDirectory).pathname)

console.log(
  'Generated favicons, install icons, and the 1200 x 630 social card.',
)
