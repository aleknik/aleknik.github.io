// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enhanceEmailContact } from '../../src/lib/email-contact'

const email = 'hello@example.com'

function createControl() {
  const details = document.createElement('details')
  details.dataset['email'] = btoa(email)
  details.innerHTML =
    '<summary>Email</summary><p data-email-address>hello at example dot com</p><a data-email-link hidden>Open email app</a><button data-email-copy hidden>Copy address</button><p role="status"></p>'
  document.body.append(details)
  const address = details.querySelector('p')!
  const link = details.querySelector('a')!
  const button = details.querySelector('button')!
  const status = details.querySelector('[role="status"]')!
  const open = () => {
    details.open = true
    details.dispatchEvent(new Event('toggle'))
  }
  return { details, address, link, button, status, open }
}

afterEach(() => document.body.replaceChildren())

describe('progressively enhanced email contact', () => {
  it('keeps the address obfuscated until opened and then reveals a working link', () => {
    const { details, address, link, button, open } = createControl()
    enhanceEmailContact(details, { writeText: vi.fn() })
    expect(address.textContent).toBe('hello at example dot com')
    expect(link.hasAttribute('href')).toBe(false)
    expect(button.hidden).toBe(true)
    open()
    expect(address.textContent).toBe(email)
    expect(link.getAttribute('href')).toBe(`mailto:${email}`)
    expect(link.hidden).toBe(false)
    expect(button.hidden).toBe(false)
    details.open = false
    details.dispatchEvent(new Event('toggle'))
    open()
    expect(address.textContent).toBe(email)
  })

  it('handles a disclosure opened before the enhancement loads', () => {
    const { details, link } = createControl()
    details.open = true
    enhanceEmailContact(details, { writeText: vi.fn() })
    expect(link.getAttribute('href')).toBe(`mailto:${email}`)
  })

  it('copies the address using the browser clipboard', async () => {
    const { details, button, status, open } = createControl()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    enhanceEmailContact(details)
    button.dispatchEvent(new Event('click'))
    expect(writeText).not.toHaveBeenCalled()
    open()
    button.click()
    await vi.waitFor(() => expect(status.textContent).toBe('Copied.'))
    expect(writeText).toHaveBeenCalledExactlyOnceWith(email)
    expect(button.disabled).toBe(false)
  })

  it('prevents concurrent clipboard writes', async () => {
    const { details, button, status, open } = createControl()
    const pending = Promise.withResolvers<void>()
    const writeText = vi.fn(() => pending.promise)
    enhanceEmailContact(details, { writeText })
    open()
    button.click()
    expect(status.textContent).toBe('Copying...')
    expect(button.disabled).toBe(true)
    button.dispatchEvent(new Event('click'))
    expect(writeText).toHaveBeenCalledTimes(1)
    pending.resolve()
    await vi.waitFor(() => expect(button.disabled).toBe(false))
  })

  it('reports clipboard failure and permits retry', async () => {
    const { details, button, status, link, open } = createControl()
    const error = new DOMException('Permission denied', 'NotAllowedError')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const writeText = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined)
    enhanceEmailContact(details, { writeText })
    open()
    button.click()
    await vi.waitFor(() =>
      expect(status.textContent).toBe(
        'Copy failed. Select the address above instead.',
      ),
    )
    expect(log).toHaveBeenCalledWith('Could not copy the email address.', error)
    expect(link.getAttribute('href')).toBe(`mailto:${email}`)
    button.click()
    await vi.waitFor(() => expect(status.textContent).toBe('Copied.'))
  })

  it('keeps manual copy and mailto available without the Clipboard API', () => {
    const { details, button, link, address, status, open } = createControl()
    vi.stubGlobal('navigator', {})
    enhanceEmailContact(details)
    open()
    expect(button.hidden).toBe(true)
    expect(address.textContent).toBe(email)
    expect(link.getAttribute('href')).toBe(`mailto:${email}`)
    button.dispatchEvent(new Event('click'))
    expect(status.textContent).toBe('')
  })

  it.each(['not base64!', btoa('javascript:alert(1)')])(
    'reports invalid encoded contact data: %s',
    (encoded) => {
      const { details, address, link, status, open } = createControl()
      details.dataset['email'] = encoded
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      enhanceEmailContact(details, { writeText: vi.fn() })
      open()
      expect(link.hasAttribute('href')).toBe(false)
      expect(address.textContent).toBe('hello at example dot com')
      expect(status.textContent).toContain('connect on LinkedIn')
      expect(log).toHaveBeenCalled()
    },
  )

  it.each([
    '[data-email-address]',
    '[data-email-link]',
    '[data-email-copy]',
    '[role="status"]',
  ])('rejects missing markup: %s', (selector) => {
    const { details } = createControl()
    details.querySelector(selector)!.remove()
    expect(() => enhanceEmailContact(details)).toThrow('EmailContact requires')
  })

  it('rejects a missing encoded address', () => {
    const { details } = createControl()
    delete details.dataset['email']
    expect(() => enhanceEmailContact(details)).toThrow('EmailContact requires')
  })

  it('removes listeners on cleanup', () => {
    const { details, open, link, button } = createControl()
    const writeText = vi.fn()
    const cleanup = enhanceEmailContact(details, { writeText })
    cleanup()
    open()
    button.dispatchEvent(new Event('click'))
    expect(link.hasAttribute('href')).toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })
})
