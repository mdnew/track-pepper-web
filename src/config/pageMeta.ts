import { format, parseISO } from 'date-fns'

import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME } from './site'

export interface PageMetaConfig {
  title: string
  description: string
  image?: string
  path?: string
  noIndex?: boolean
}

const LOGIN_DESCRIPTION =
  'Sign in or create a free TrackPepper account to share daily pet care schedules with your household.'

export function resolvePageMeta(pathname: string): PageMetaConfig {
  if (pathname === '/') {
    return {
      title: 'Track your pet\'s day together',
      description: DEFAULT_DESCRIPTION,
      path: '/',
    }
  }

  if (pathname === '/schedules') {
    return {
      title: 'Reference schedules by age',
      description:
        'Browse expert daily routines for dogs and cats at every life stage, from newborn puppies and kittens through senior pets.',
      path: '/schedules',
    }
  }

  if (pathname === '/about') {
    return {
      title: 'Meet Pepper',
      description:
        'TrackPepper started with Pepper, a black lab puppy. A family-built app to help everyone stay on the same page for feedings, potty breaks, and training.',
      image: '/assets/pepper.jpg',
      path: '/about',
    }
  }

  if (pathname === '/terms') {
    return {
      title: 'Terms of Service',
      description: 'Terms of Service for TrackPepper, the shared pet care schedule app.',
      path: '/terms',
    }
  }

  if (pathname === '/privacy') {
    return {
      title: 'Privacy Policy',
      description:
        'How TrackPepper collects, uses, and protects your information when you use our website and mobile app.',
      path: '/privacy',
    }
  }

  if (pathname === '/login' || pathname === '/auth') {
    return {
      title: 'Sign in',
      description: LOGIN_DESCRIPTION,
      path: '/login',
      noIndex: true,
    }
  }

  if (pathname === '/forgot-password' || pathname === '/reset-password') {
    return {
      title: 'Reset password',
      description: LOGIN_DESCRIPTION,
      noIndex: true,
    }
  }

  if (pathname === '/onboarding') {
    return {
      title: 'Set up your household',
      description: 'Create or join a TrackPepper household to start sharing your pet\'s schedule.',
      noIndex: true,
    }
  }

  if (pathname === '/settings') {
    return {
      title: 'Settings',
      description: DEFAULT_DESCRIPTION,
      noIndex: true,
    }
  }

  const dayMatch = pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})$/)
  if (dayMatch) {
    const date = parseISO(dayMatch[1])
    return {
      title: format(date, 'EEEE, MMMM d'),
      description: 'Daily pet care schedule and task checklist.',
      noIndex: true,
    }
  }

  if (pathname.startsWith('/day/')) {
    return {
      title: 'Daily schedule',
      description: 'Daily pet care schedule and task checklist.',
      noIndex: true,
    }
  }

  return {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  }
}

export function formatDocumentTitle(title: string): string {
  if (title === SITE_NAME) return SITE_NAME
  return `${title} | ${SITE_NAME}`
}

export function resolveOgImage(image?: string): string {
  return image ?? DEFAULT_OG_IMAGE
}
