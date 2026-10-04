import type { APIRoute } from 'astro'
import { profile } from '../data/site'

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nSitemap: ${profile.siteUrl}sitemap.xml\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  )
