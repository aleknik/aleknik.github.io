import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'
import Hero from '../../src/components/Hero.astro'
import ContactLink from '../../src/components/ContactLink.astro'
import ContactSection from '../../src/components/ContactSection.astro'
import EmailContact from '../../src/components/EmailContact.astro'
import Icon from '../../src/components/Icon.astro'
import { contactLinks, emailContact, profile } from '../../src/data/site'
import { icons } from '../../src/lib/icons'

function parse(html: string) {
  const element = new Window().document.createElement('div')
  element.innerHTML = html
  return element
}

describe('static components', () => {
  it('introduces the person without promotional copy', async () => {
    const container = await AstroContainer.create()
    const content = parse(await container.renderToString(Hero))
    expect(content.querySelector('h1')?.textContent).toBe(profile.name)
    expect(content.querySelectorAll('p')).toHaveLength(2)
    expect(content.querySelector('.role')?.textContent).toBe(profile.role)
    expect(content.querySelector('.location')?.textContent).toBe(
      'Belgrade, Serbia',
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
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(anchor?.classList.contains('primary')).toBe(link.primary)
    expect(anchor?.hasAttribute('aria-label')).toBe(false)
    expect(content.textContent).toContain('(opens in a new tab)')
  })

  it('prioritizes LinkedIn and keeps email behind a native disclosure', async () => {
    const container = await AstroContainer.create()
    const content = parse(await container.renderToString(ContactSection))
    expect(content.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Contact links',
    )
    expect(content.querySelectorAll('a')).toHaveLength(2)
    expect(content.querySelectorAll('a[href]')).toHaveLength(1)
    expect(content.querySelector('a')?.getAttribute('href')).toBe(
      'https://www.linkedin.com/in/aleknik',
    )
    expect(content.querySelector('summary')?.textContent).toContain('Email')
    expect(content.querySelectorAll('button')).toHaveLength(1)
    expect(content.querySelectorAll('h2, h3')).toHaveLength(0)
  })

  it('never renders a raw address or mailto and provides an at/dot fallback', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(EmailContact)
    const control = parse(html)
    expect(html).not.toContain(atob(emailContact.encoded))
    expect(control.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(control.querySelector('[data-email-address]')?.textContent).toBe(
      emailContact.readable,
    )
    expect(control.querySelector('details')?.hasAttribute('open')).toBe(false)
    expect(control.querySelector('button')?.hasAttribute('hidden')).toBe(true)
    expect(control.querySelector('button')?.getAttribute('type')).toBe('button')
    expect(control.querySelector('button')?.textContent).toContain(
      'Copy address',
    )
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
