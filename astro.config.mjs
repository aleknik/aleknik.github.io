import { defineConfig } from 'astro/config'
import { profile } from './src/data/site.ts'

export default defineConfig({
  site: profile.siteUrl,
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    server: { strictPort: true },
    preview: { strictPort: true },
  },
})
