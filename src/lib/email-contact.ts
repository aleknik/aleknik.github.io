type ClipboardWriter = Pick<Clipboard, 'writeText'>

export function enhanceEmailContact(
  details: HTMLDetailsElement,
  clipboard: ClipboardWriter | undefined = navigator.clipboard,
): () => void {
  const address = details.querySelector('[data-email-address]')
  const link = details.querySelector('[data-email-link]')
  const button = details.querySelector('[data-email-copy]')
  const status = details.querySelector('[role="status"]')
  const encoded = details.dataset['email']

  if (
    !(address instanceof HTMLElement) ||
    !(link instanceof HTMLAnchorElement) ||
    !(button instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement) ||
    !encoded
  ) {
    throw new Error(
      'EmailContact requires an encoded address, address text, link, button, and status.',
    )
  }

  let email: string | undefined
  const reveal = () => {
    if (!details.open || email) return

    try {
      const decoded = atob(encoded)
      if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(decoded)) {
        throw new Error('Invalid email address.')
      }
      email = decoded
      address.textContent = email
      link.href = `mailto:${email}`
      link.hidden = false
      button.hidden = !clipboard
    } catch (error) {
      console.error('Could not reveal the email address.', error)
      status.textContent =
        'Please use the written address or connect on LinkedIn.'
    }
  }

  const copy = async () => {
    if (!email || !clipboard || button.disabled) return
    button.disabled = true
    status.textContent = 'Copying...'
    try {
      await clipboard.writeText(email)
      status.textContent = 'Copied.'
    } catch (error) {
      console.error('Could not copy the email address.', error)
      status.textContent = 'Copy failed. Select the address above instead.'
    } finally {
      button.disabled = false
    }
  }

  details.addEventListener('toggle', reveal)
  button.addEventListener('click', copy)
  reveal()
  return () => {
    details.removeEventListener('toggle', reveal)
    button.removeEventListener('click', copy)
  }
}
