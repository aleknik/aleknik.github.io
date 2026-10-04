import type { APIRoute } from 'astro'
import { profile } from '../data/site'

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      id: '/',
      name: profile.name,
      short_name: profile.handle,
      description: profile.description,
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#24483c',
      background_color: '#f6f7f2',
      icons: [
        {
          src: '/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
