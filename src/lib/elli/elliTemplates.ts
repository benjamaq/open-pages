/**
 * Elli post-supplement template generator
 */
export function getPostSupplementTemplate(
  supplementName: string,
  condition?: string,
  userName?: string
): string {
  const name = userName || 'there'
  const suppDisplay = supplementName || 'your supplement'
  if (condition) {
    return `Hey ${name}, I've added ${suppDisplay} to your stack for ${condition}. I'll start tracking how it affects you from today. Check in daily so I can build your personal evidence.`
  }
  return `Hey ${name}, I've added ${suppDisplay} to your stack. I'll start tracking how it affects you from today. Check in daily so I can build your personal evidence.`
}

