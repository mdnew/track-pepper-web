import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import {
  formatDocumentTitle,
  resolveOgImage,
  resolvePageMeta,
} from '../config/pageMeta'
import { absoluteUrl, getSiteUrl, SITE_NAME } from '../config/site'

type MetaAttr = 'name' | 'property'

function setMeta(attr: MetaAttr, key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function setRobots(noIndex: boolean) {
  const selector = 'meta[name="robots"]'
  let element = document.head.querySelector(selector)

  if (noIndex) {
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute('name', 'robots')
      document.head.appendChild(element)
    }
    element.setAttribute('content', 'noindex, nofollow')
    return
  }

  element?.remove()
}

export function PageMetaTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = resolvePageMeta(pathname)
    const documentTitle = formatDocumentTitle(meta.title)
    const description = meta.description
    const imagePath = resolveOgImage(meta.image)
    const pagePath = meta.path ?? pathname
    const pageUrl = absoluteUrl(pagePath)
    const imageUrl = absoluteUrl(imagePath)

    document.title = documentTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:locale', 'en_US')
    setMeta('property', 'og:title', documentTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:alt', 'Pepper, the black lab puppy TrackPepper is named after')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', documentTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('name', 'twitter:image:alt', 'Pepper, the black lab puppy TrackPepper is named after')

    if (pageUrl) {
      setMeta('property', 'og:url', pageUrl)
      setLink('canonical', pageUrl)
    }

    setRobots(meta.noIndex ?? false)

    if (import.meta.env.DEV && !getSiteUrl()) {
      console.warn(
        'VITE_SITE_URL is not set. Open Graph image and URL tags may be incomplete for social previews.',
      )
    }
  }, [pathname])

  return null
}
