import type { PetSpecies } from '../types'

export type RecommendationCategory = 'food' | 'gear' | 'care'

export interface Recommendation {
  id: string
  title: string
  description: string
  href: string
  species: PetSpecies | 'all'
  category: RecommendationCategory
}

export const AFFILIATE_DISCLOSURE =
  'Some links are Amazon affiliate links — we may earn a small commission at no extra cost to you.'

export const recommendations: Recommendation[] = [
  {
    id: 'puppy-food',
    title: 'Puppy Food We Use',
    description:
      'The kibble Pepper eats for everyday meals. Always check with your vet for your puppy’s specific needs.',
    href: 'https://amzn.to/4wc4je3',
    species: 'dog',
    category: 'food',
  },
  {
    id: 'nerf-fetch-ball',
    title: 'Nerf Dog Trackshot Ball',
    description:
      'The squeaky fetch ball Pepper loves — lightweight, durable, and easy to spot in the yard.',
    href: 'https://amzn.to/4akJsgf',
    species: 'dog',
    category: 'gear',
  },
  {
    id: 'jasonwell-dog-pool',
    title: 'Jasonwell Foldable Dog Pool',
    description:
      'The 79" splash pool Pepper loves — folds flat for storage, no inflation needed, great for backyard cool-offs.',
    href: 'https://amzn.to/4f6TGn3',
    species: 'dog',
    category: 'gear',
  },
  {
    id: 'bene-bac-probiotic',
    title: 'PetAg Bene-Bac Probiotic',
    description:
      'The probiotic powder we use to help keep Pepper regular — useful after diet changes, antibiotics, or travel.',
    href: 'https://amzn.to/4wc4LJh',
    species: 'dog',
    category: 'care',
  },
]

export function recommendationsForSpecies(
  species: PetSpecies | null | undefined,
): Recommendation[] {
  if (!species) return recommendations

  return recommendations.filter(
    (item) => item.species === 'all' || item.species === species,
  )
}

export function recommendationsForPetSpeciesList(
  speciesList: PetSpecies[],
): Recommendation[] {
  if (speciesList.length === 0) return recommendations

  const allowed = new Set(speciesList)
  return recommendations.filter(
    (item) => item.species === 'all' || allowed.has(item.species),
  )
}

export function categoryLabel(category: RecommendationCategory): string {
  switch (category) {
    case 'food':
      return 'Food'
    case 'gear':
      return 'Gear'
    case 'care':
      return 'Care'
  }
}

export function categoryIcon(category: RecommendationCategory): string {
  switch (category) {
    case 'food':
      return '🍽️'
    case 'gear':
      return '🎒'
    case 'care':
      return '💚'
  }
}
