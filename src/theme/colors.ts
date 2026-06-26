export const colors = {
  background: '#FFF8F0',
  card: '#FFFFFF',
  header: '#3D2C1E',
  headerSubtitle: '#C9A87C',
  textPrimary: '#2C1A0E',
  textSecondary: '#7A5C3C',
  divider: '#C9A87C',
  potty: '#52B77A',
  feed: '#F5A623',
  sleep: '#6B8CFF',
  play: '#C06BF5',
  train: '#F56B6B',
  wind: '#999999',
  night: '#1E1A2E',
  pottyBg: '#F0FAF3',
  feedBg: '#FFF5E6',
  sleepBg: '#F0F4FF',
  playBg: '#FEF6FF',
  trainBg: '#FFF0F0',
  windBg: '#F5F5F5',
  nightBg: '#1E1A2E',
  nightText: '#E8E4FF',
  nightMuted: '#A09CC9',
} as const

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    potty: colors.potty,
    feed: colors.feed,
    sleep: colors.sleep,
    play: colors.play,
    train: colors.train,
    wind: colors.wind,
    night: colors.night,
  }
  return map[category] ?? colors.wind
}

export function categoryBackground(category: string): string {
  const map: Record<string, string> = {
    potty: colors.pottyBg,
    feed: colors.feedBg,
    sleep: colors.sleepBg,
    play: colors.playBg,
    train: colors.trainBg,
    wind: colors.windBg,
    night: colors.nightBg,
  }
  return map[category] ?? colors.windBg
}
