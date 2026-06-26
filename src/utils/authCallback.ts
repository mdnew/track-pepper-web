export function parseAuthCallbackUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim()
  if (!trimmed) throw new Error('Paste the full link from your email.')

  const normalized = trimmed.includes('://') ? trimmed : `https://${trimmed}`
  const uri = new URL(normalized)

  const fragment = uri.hash.replace(/^#/, '')
  const hasAuthParams =
    uri.searchParams.has('access_token') ||
    uri.searchParams.has('code') ||
    fragment.includes('access_token=') ||
    fragment.includes('code=')

  if (!hasAuthParams) {
    throw new Error(
      'That link does not contain reset credentials. Copy the full URL.',
    )
  }

  return uri
}

export function getAuthParamsFromUrl(url: URL): Record<string, string> {
  if (url.hash) {
    return Object.fromEntries(new URLSearchParams(url.hash.replace(/^#/, '')))
  }
  return Object.fromEntries(url.searchParams.entries())
}
