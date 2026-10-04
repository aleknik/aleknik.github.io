// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enhanceCopyEmail } from '../../src/lib/copy-email'

const email = 'hello@example.com'

function createControl() {
  const container = document.createElement('div')
  container.dataset['copyEmail'] = email
  const button = document.createElement('button')
  button.type = 'button'
  button.hidden = true
  button.textContent = 'Copy email address'
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  container.append(button, status)
  document.body.append(container)
  return { container, button, status }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('email clipboard enhancement', () => {
  it('reveals the control and writes the exact email address', async () => {
    const { container, button, status } = createControl()
    const writeText = vi.fn().mockResolvedValue(undefined)
    enhanceCopyEmail(container, { writeText })

    expect(button.hidden).toBe(false)
    button.click()

    await vi.waitFor(() =>
      expect(status.textContent).toContain('Email address copied.'),
    )
    expect(writeText).toHaveBeenCalledExactlyOnceWith(email)
    expect(button.disabled).toBe(false)
  })

  it('uses the browser clipboard by default', async () => {
    const { container, button, status } = createControl()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    enhanceCopyEmail(container)
    button.click()

    await vi.waitFor(() =>
      expect(status.textContent).toContain('Email address copied.'),
    )
    expect(writeText).toHaveBeenCalledWith(email)
  })

  it('announces pending work and prevents concurrent writes', async () => {
    const { container, button, status } = createControl()
    const pending = Promise.withResolvers<void>()
    const writeText = vi.fn(() => pending.promise)
    enhanceCopyEmail(container, { writeText })
    button.click()

    expect(button.disabled).toBe(true)
    expect(status.textContent).toBe('Copying email address...')
    button.dispatchEvent(new Event('click'))
    expect(writeText).toHaveBeenCalledTimes(1)

    pending.resolve()
    await vi.waitFor(() => expect(button.disabled).toBe(false))
  })

  it('reports permission failures and keeps the control usable', async () => {
    const { container, button, status } = createControl()
    const error = new DOMException('Permission denied', 'NotAllowedError')
    const writeText = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    enhanceCopyEmail(container, { writeText })
    button.click()

    await vi.waitFor(() =>
      expect(status.textContent).toContain('Could not copy.'),
    )
    expect(status.textContent).toContain('Select the address')
    expect(log).toHaveBeenCalledExactlyOnceWith(
      'Could not copy the email address.',
      error,
    )
    expect(button.disabled).toBe(false)

    button.click()
    await vi.waitFor(() =>
      expect(status.textContent).toContain('Email address copied.'),
    )
    expect(writeText).toHaveBeenCalledTimes(2)
  })

  it('gives manual-copy guidance when the Clipboard API is unavailable', () => {
    const { container, button, status } = createControl()
    vi.stubGlobal('navigator', {})
    const cleanup = enhanceCopyEmail(container)

    expect(button.hidden).toBe(true)
    expect(status.textContent).toContain('select the address')
    expect(cleanup).not.toThrow()
  })

  it('removes its listener during cleanup', () => {
    const { container, button } = createControl()
    const writeText = vi.fn().mockResolvedValue(undefined)
    const cleanup = enhanceCopyEmail(container, { writeText })
    cleanup()
    button.click()
    expect(writeText).not.toHaveBeenCalled()
  })

  it.each(['button', '[role="status"]'])(
    'rejects markup without %s',
    (selector) => {
      const { container } = createControl()
      container.querySelector(selector)?.remove()
      expect(() => enhanceCopyEmail(container)).toThrow('CopyEmail requires')
    },
  )

  it('rejects a missing email address', () => {
    const { container } = createControl()
    delete container.dataset['copyEmail']
    expect(() => enhanceCopyEmail(container)).toThrow('CopyEmail requires')
  })
})
