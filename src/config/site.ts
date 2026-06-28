const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')

export const SITE_NAME = 'TrackPepper'

export const DEFAULT_DESCRIPTION =
  'A shared daily schedule for your puppy or kitten. Check off feedings, potty breaks, naps, and training as a family, synced in real time across phones and the web.'

export const DEFAULT_OG_IMAGE = '/assets/og-screenshot.png'

export const DEFAULT_OG_IMAGE_ALT =
  'TrackPepper app showing a shared daily pet care schedule with tasks checked off'

export function getSiteUrl(): string {
  if (configuredSiteUrl) return configuredSiteUrl
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl()
  if (!base) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
