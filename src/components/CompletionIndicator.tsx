import { colors } from '../theme/colors'
import './CompletionIndicator.css'

interface Props {
  completed: number
  total: number
  size?: number
}

export function CompletionIndicator({ completed, total, size = 32 }: Props) {
  const ratio = total === 0 ? 0 : completed / total

  if (completed === 0) {
    return (
      <div
        className="completion-indicator empty"
        style={{ width: size, height: size }}
      />
    )
  }

  if (completed >= total) {
    return (
      <div
        className="completion-indicator done"
        style={{ width: size, height: size }}
      >
        ✓
      </div>
    )
  }

  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - ratio)

  return (
    <div className="completion-indicator partial" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="completion-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.feedBg}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.feed}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="completion-count">{completed}</span>
    </div>
  )
}
