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
  groom: '#9A7ACC',
  vet: '#CC7A7A',
  enrich: '#5AB88A',
  note: '#8890B0',
  pottyBg: '#F0FAF3',
  feedBg: '#FFF5E6',
  sleepBg: '#F0F4FF',
  playBg: '#FEF6FF',
  trainBg: '#FFF0F0',
  windBg: '#F5F5F5',
  nightBg: '#1E1A2E',
  groomBg: '#F5F0FF',
  vetBg: '#FFF0F0',
  enrichBg: '#F0FAF5',
  noteBg: '#F5F5F8',
  nightText: '#E8E4FF',
  nightMuted: '#A09CC9',
  catFeed: '#5B68A8',
  catFeedBg: '#EEF0FA',
  catPlay: '#4A8FB8',
  catPlayBg: '#E5F2F8',
  catSleep: '#5A5A9A',
  catSleepBg: '#EBEBF5',
  catGroom: '#7A62A8',
  catGroomBg: '#F0EBFA',
  catVet: '#B85C5C',
  catVetBg: '#FAEEEE',
  catEnrich: '#4A9A72',
  catEnrichBg: '#E8F5EF',
  catNote: '#5C5878',
  catNoteBg: '#F0F0F5',
} as const

export function categoryColor(category: string, species: 'dog' | 'cat' = 'dog'): string {
  if (species === 'cat') {
    const catMap: Record<string, string> = {
      feed: colors.catFeed,
      play: colors.catPlay,
      sleep: colors.catSleep,
      groom: colors.catGroom,
      vet: colors.catVet,
      enrich: colors.catEnrich,
      note: colors.catNote,
    }
    return catMap[category] ?? colors.catNote
  }

  const map: Record<string, string> = {
    potty: colors.potty,
    feed: colors.feed,
    sleep: colors.sleep,
    play: colors.play,
    train: colors.train,
    wind: colors.wind,
    night: colors.night,
    groom: colors.groom,
    vet: colors.vet,
    enrich: colors.enrich,
    note: colors.note,
  }
  return map[category] ?? colors.wind
}

export function categoryBackground(category: string, species: 'dog' | 'cat' = 'dog'): string {
  if (species === 'cat') {
    const catMap: Record<string, string> = {
      feed: colors.catFeedBg,
      play: colors.catPlayBg,
      sleep: colors.catSleepBg,
      groom: colors.catGroomBg,
      vet: colors.catVetBg,
      enrich: colors.catEnrichBg,
      note: colors.catNoteBg,
    }
    return catMap[category] ?? colors.catNoteBg
  }

  const map: Record<string, string> = {
    potty: colors.pottyBg,
    feed: colors.feedBg,
    sleep: colors.sleepBg,
    play: colors.playBg,
    train: colors.trainBg,
    wind: colors.windBg,
    night: colors.nightBg,
    groom: colors.groomBg,
    vet: colors.vetBg,
    enrich: colors.enrichBg,
    note: colors.noteBg,
  }
  return map[category] ?? colors.windBg
}
