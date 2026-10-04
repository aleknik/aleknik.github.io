export const profile = {
  name: 'Aleksandar Nikolic',
  handle: 'aleknik',
  role: 'Software engineer',
  city: 'Belgrade',
  country: 'Serbia',
  email: 'nikolic95@gmail.com',
  siteUrl: 'https://aleknik.com/',
  description: 'Aleksandar Nikolic - software engineer in Belgrade, Serbia.',
} as const

export interface ContactLink {
  name: string
  href: string
  external: boolean
}

export const contactLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/aleknik',
    external: true,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aleknik',
    external: true,
  },
  {
    name: 'Email',
    href: `mailto:${profile.email}`,
    external: false,
  },
] as const satisfies readonly ContactLink[]

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  alternateName: profile.handle,
  url: profile.siteUrl,
  jobTitle: profile.role,
  description: profile.description,
  email: `mailto:${profile.email}`,
  homeLocation: {
    '@type': 'Place',
    name: `${profile.city}, ${profile.country}`,
  },
  sameAs: contactLinks.filter((link) => link.external).map((link) => link.href),
}
