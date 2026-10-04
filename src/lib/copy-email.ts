type ClipboardWriter = Pick<Clipboard, 'writeText'>

export function enhanceCopyEmail(
  container: HTMLElement,
  clipboard: ClipboardWriter | undefined = navigator.clipboard,
): () => void {
  const button = container.querySelector('button')
  const status = container.querySelector('[role="status"]')
  const email = container.dataset['copyEmail']

  if (
    !(button instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement) ||
    !email
  ) {
    throw new Error(
      'CopyEmail requires a button, a status message, and an email address.',
    )
  }

  if (!clipboard) {
    status.textContent =
      'You can select the address in the Email card to copy it.'
    return () => {}
  }

  button.hidden = false

  const copy = async () => {
    if (button.disabled) return

    button.disabled = true
    status.textContent = 'Copying email address...'

    try {
      await clipboard.writeText(email)
      status.textContent = 'Email address copied. Say hello whenever you like.'
    } catch (error) {
      console.error('Could not copy the email address.', error)
      status.textContent =
        'Could not copy. Select the address in the Email card, or open your email app.'
    } finally {
      button.disabled = false
    }
  }

  button.addEventListener('click', copy)
  return () => button.removeEventListener('click', copy)
}
