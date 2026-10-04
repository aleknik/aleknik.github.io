import { describe, expect, it } from 'vitest'
import { contactLinks, personSchema, profile } from '../../src/data/site'

describe('public profile content', () => {
  it('preserves the original identity and contact destinations', () => {
    expect(profile.name).toBe('Aleksandar Nikolic')
    expect(`${profile.city}, ${profile.country}`).toBe('Belgrade, Serbia')
    expect(contactLinks.map(({ href }) => href)).toEqual([
      'https://github.com/aleknik',
      'https://www.linkedin.com/in/aleknik',
      'mailto:nikolic95@gmail.com',
    ])
  })

  it('provides unique names and appropriate destinations without card copy', () => {
    expect(new Set(contactLinks.map(({ name }) => name)).size).toBe(
      contactLinks.length,
    )
    for (const link of contactLinks) {
      expect(link.name.length).toBeGreaterThan(0)
      expect(link).not.toHaveProperty('description')
      expect(link).not.toHaveProperty('icon')
      expect(new URL(link.href).protocol).toBe(
        link.external ? 'https:' : 'mailto:',
      )
    }
  })

  it('uses the canonical HTTPS custom domain', () => {
    expect(profile.siteUrl).toBe('https://aleknik.com/')
  })

  it('publishes a consistent Person schema without invented credentials', () => {
    expect(personSchema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      url: profile.siteUrl,
      email: `mailto:${profile.email}`,
      homeLocation: { '@type': 'Place', name: 'Belgrade, Serbia' },
      sameAs: [
        'https://github.com/aleknik',
        'https://www.linkedin.com/in/aleknik',
      ],
    })
    expect(personSchema).not.toHaveProperty('worksFor')
    expect(personSchema).not.toHaveProperty('award')
  })
})
