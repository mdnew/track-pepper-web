import type { PetSpecies } from '../types'

export interface SpeciesTheme {
  species: PetSpecies
  background: string
  card: string
  header: string
  headerSubtitle: string
  textPrimary: string
  textSecondary: string
  divider: string
  progressAccent: string
  progressBg: string
  tipBg: string
  tipBorder: string
  tipText: string
  introBg: string
  introBorder: string
  fontDisplay: string
  fontBody: string
  emoji: string
}

export const dogTheme: SpeciesTheme = {
  species: 'dog',
  background: '#FAF6EF',
  card: '#FFFFFF',
  header: '#2E1F0F',
  headerSubtitle: '#F5E4C8',
  textPrimary: '#2E1F0F',
  textSecondary: '#5C3D1E',
  divider: '#C8791A',
  progressAccent: '#3DA06B',
  progressBg: '#EBF7F0',
  tipBg: '#FEF3E2',
  tipBorder: '#C8791A',
  tipText: '#5C3D1E',
  introBg: '#FFFFFF',
  introBorder: '#F5E4C8',
  fontDisplay: "'Fraunces', Georgia, serif",
  fontBody: "'DM Sans', 'Lato', system-ui, sans-serif",
  emoji: '🐶',
}

export const catTheme: SpeciesTheme = {
  species: 'cat',
  background: '#F3F2FA',
  card: '#FFFFFF',
  header: '#4A4570',
  headerSubtitle: '#D8D4EC',
  textPrimary: '#1E1C35',
  textSecondary: '#5C5878',
  divider: '#8B93C9',
  progressAccent: '#5B68A8',
  progressBg: '#E4E2F2',
  tipBg: '#EEECFA',
  tipBorder: '#B8BCD8',
  tipText: '#3D3866',
  introBg: '#FFFFFF',
  introBorder: '#D8D4EC',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'Inter', 'Lato', system-ui, sans-serif",
  emoji: '🐱',
}

export function speciesTheme(species: PetSpecies): SpeciesTheme {
  return species === 'cat' ? catTheme : dogTheme
}

export function applySpeciesTheme(theme: SpeciesTheme) {
  const root = document.documentElement
  root.dataset.species = theme.species
  root.style.setProperty('--background', theme.background)
  root.style.setProperty('--card', theme.card)
  root.style.setProperty('--header', theme.header)
  root.style.setProperty('--header-subtitle', theme.headerSubtitle)
  root.style.setProperty('--text-primary', theme.textPrimary)
  root.style.setProperty('--text-secondary', theme.textSecondary)
  root.style.setProperty('--divider', theme.divider)
  root.style.setProperty('--progress-accent', theme.progressAccent)
  root.style.setProperty('--progress-bg', theme.progressBg)
  root.style.setProperty('--tip-bg', theme.tipBg)
  root.style.setProperty('--tip-border', theme.tipBorder)
  root.style.setProperty('--tip-text', theme.tipText)
  root.style.setProperty('--intro-bg', theme.introBg)
  root.style.setProperty('--intro-border', theme.introBorder)
  root.style.setProperty('--font-display', theme.fontDisplay)
  root.style.fontFamily = theme.fontBody
}
