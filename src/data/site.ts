export const profile = {
  name: 'Aleksandar Nikolić',
  firstName: 'Aleksandar',
  lastName: 'Nikolić',
  handle: 'aleknik',
  role: 'Software engineer',
  city: 'Belgrade',
  country: 'Serbia',
  siteUrl: 'https://aleknik.com/',
  description: 'Aleksandar Nikolić - software engineer in Belgrade, Serbia.',
} as const

export interface ContactLink {
  name: string
  label: string
  href: string
  primary: boolean
}

export const contactLinks = [
  {
    name: 'LinkedIn',
    label: 'Connect on LinkedIn',
    href: 'https://www.linkedin.com/in/aleknik',
    primary: true,
  },
  {
    name: 'GitHub',
    label: 'GitHub',
    href: 'https://github.com/aleknik',
    primary: false,
  },
] as const satisfies readonly ContactLink[]

export const emailContact = {
  encoded: 'bmlrb2xpYzk1QGdtYWlsLmNvbQ==',
  readable: 'nikolic95 at gmail dot com',
} as const

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  alternateName: profile.handle,
  url: profile.siteUrl,
  jobTitle: profile.role,
  description: profile.description,
  homeLocation: {
    '@type': 'Place',
    name: `${profile.city}, ${profile.country}`,
  },
  sameAs: contactLinks.map((link) => link.href),
}
