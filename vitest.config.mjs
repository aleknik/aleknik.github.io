import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/email-contact.ts',
        'src/data/site.ts',
        'src/lib/icons.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
