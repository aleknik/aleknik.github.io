import type { IconName } from '../lib/icons'

export const profile = {
  name: 'Aleksandar Nikolic',
  firstName: 'Aleksandar',
  lastName: 'Nikolic',
  handle: 'aleknik',
  role: 'Software engineer',
  city: 'Belgrade',
  country: 'Serbia',
  email: 'nikolic95@gmail.com',
  siteUrl: 'https://aleknik.com/',
  description:
    'Aleksandar Nikolic is a software engineer based in Belgrade, Serbia. Explore his code, connect on LinkedIn, or get in touch.',
} as const

export interface ContactLink {
  name: string
  href: string
  icon: IconName
  description: string
  label: string
  external: boolean
}

export const contactLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/aleknik',
    icon: 'github',
    description:
      'A window into my code. Explore repositories and follow along.',
    label: `@${profile.handle}`,
    external: true,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aleknik',
    icon: 'linkedin',
    description: 'The professional side of things. Find me here and connect.',
    label: `in/${profile.handle}`,
    external: true,
  },
  {
    name: 'Email',
    href: `mailto:${profile.email}`,
    icon: 'mail',
    description:
      'An idea, a question, or just a hello. My inbox is a good place to start.',
    label: profile.email,
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
