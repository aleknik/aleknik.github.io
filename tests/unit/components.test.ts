import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'
import Hero from '../../src/components/Hero.astro'
import ContactLink from '../../src/components/ContactLink.astro'
import ContactSection from '../../src/components/ContactSection.astro'
import CopyEmail from '../../src/components/CopyEmail.astro'
import Icon from '../../src/components/Icon.astro'
import { contactLinks, profile } from '../../src/data/site'
import { icons } from '../../src/lib/icons'

function parse(html: string) {
  const element = new Window().document.createElement('div')
  element.innerHTML = html
  return element
}

describe('static components', () => {
  it('introduces the person with only a name and one factual sentence', async () => {
    const container = await AstroContainer.create()
    const content = parse(await container.renderToString(Hero))
    expect(content.querySelector('h1')?.textContent).toBe(profile.name)
    expect(content.querySelectorAll('p')).toHaveLength(1)
    expect(content.querySelector('p')?.textContent).toBe(
      'Software engineer in Belgrade, Serbia.',
    )
  })

  it.each(contactLinks)('renders a plain $name contact link', async (link) => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ContactLink, {
      props: { link },
    })
    const content = parse(html)
    const anchor = content.querySelector('a')

    expect(anchor?.getAttribute('href')).toBe(link.href)
    expect(anchor?.textContent).toContain(link.name)
    expect(content.querySelectorAll('p, h2, h3')).toHaveLength(0)
    expect(anchor?.getAttribute('target')).toBe(link.external ? '_blank' : null)
    expect(anchor?.getAttribute('rel')).toBe(
      link.external ? 'noopener noreferrer' : null,
    )
    expect(anchor?.hasAttribute('aria-label')).toBe(false)
    expect(content.textContent?.includes('(opens in a new tab)')).toBe(
      link.external,
    )
  })

  it('offers three contacts and only one copy control', async () => {
    const container = await AstroContainer.create()
    const content = parse(await container.renderToString(ContactSection))
    expect(content.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Contact links',
    )
    expect(content.querySelectorAll('a')).toHaveLength(3)
    expect(content.querySelectorAll('button')).toHaveLength(1)
    expect(content.querySelectorAll('h2, h3')).toHaveLength(0)
  })

  it('hides the copy control until JavaScript can enhance it', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(CopyEmail, {
      props: { email: profile.email },
    })
    const control = parse(html)

    expect(
      control
        .querySelector('[data-copy-email]')
        ?.getAttribute('data-copy-email'),
    ).toBe(profile.email)
    expect(control.querySelector('button')?.hasAttribute('hidden')).toBe(true)
    expect(control.querySelector('button')?.getAttribute('type')).toBe('button')
    expect(control.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Copy email address',
    )
    expect(control.querySelector('button')?.textContent?.trim()).toBe('')
    expect(
      control.querySelector('[role="status"]')?.getAttribute('aria-live'),
    ).toBe('polite')
  })

  it.each(Object.keys(icons))(
    'keeps the %s icon decorative and out of the tab order',
    async (name) => {
      const container = await AstroContainer.create()
      const html = await container.renderToString(Icon, {
        props: { name, size: 18 },
      })
      const svg = parse(html).querySelector('svg')

      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.getAttribute('focusable')).toBe('false')
      expect(svg?.getAttribute('width')).toBe('18')
      expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy()
    },
  )

  it('gives icons a consistent default size', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Icon, {
      props: { name: 'arrow-right' },
    })
    expect(parse(html).querySelector('svg')?.getAttribute('width')).toBe('24')
  })
})
