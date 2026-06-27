import {
  AFFILIATE_DISCLOSURE,
  categoryIcon,
  categoryLabel,
  type Recommendation,
} from '../config/recommendations'
import './Recommendations.css'

interface RecommendationsProps {
  items: Recommendation[]
  title?: string
  compact?: boolean
}

export function Recommendations({
  items,
  title = 'Our recommendations',
  compact = false,
}: RecommendationsProps) {
  if (items.length === 0) return null

  return (
    <section
      className={['recommendations', compact ? 'recommendations-compact' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <h2 className="recommendations-title">{title}</h2>
      <ul className="recommendations-list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              className="recommendation-card"
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              <span className="recommendation-icon" aria-hidden>
                {categoryIcon(item.category)}
              </span>
              <span className="recommendation-body">
                <span className="recommendation-category">
                  {categoryLabel(item.category)}
                </span>
                <span className="recommendation-name">{item.title}</span>
                <span className="recommendation-description">
                  {item.description}
                </span>
              </span>
              <span className="recommendation-arrow" aria-hidden>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="recommendations-disclosure">{AFFILIATE_DISCLOSURE}</p>
    </section>
  )
}
