export default {
  plugins: ['prettier-plugin-astro'],
  singleQuote: true,
  semi: false,
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
}
