import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'
import Brand from '../../src/components/Brand.astro'
import ContactCard from '../../src/components/ContactCard.astro'
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
  it('includes the visible brand handle in the home link name', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Brand)
    expect(parse(html).querySelector('a')?.getAttribute('aria-label')).toBe(
      `${profile.handle}. ${profile.name}, home`,
    )
  })

  it.each(contactLinks)('renders the $name contact card', async (link) => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ContactCard, {
      props: { link, index: 0 },
    })
    const card = parse(html)
    const anchor = card.querySelector('a')

    expect(anchor?.getAttribute('href')).toBe(link.href)
    expect(card.querySelector('h3')?.textContent).toBe(link.name)
    expect(card.textContent).toContain(link.description)
    expect(card.textContent).toContain(link.label)
    expect(anchor?.getAttribute('target')).toBe(link.external ? '_blank' : null)
    expect(anchor?.getAttribute('rel')).toBe(
      link.external ? 'noopener noreferrer' : null,
    )
    expect(anchor?.hasAttribute('aria-label')).toBe(false)
    expect(card.textContent?.includes('(opens in a new tab)')).toBe(
      link.external,
    )
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
      props: { name: 'mail' },
    })
    expect(parse(html).querySelector('svg')?.getAttribute('width')).toBe('24')
  })
})
