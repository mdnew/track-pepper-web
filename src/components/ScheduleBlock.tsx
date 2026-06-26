import { format } from 'date-fns'

import type { Completion, ScheduleTask } from '../types'
import { categoryBackground, categoryColor, colors } from '../theme/colors'
import './ScheduleBlock.css'

interface Props {
  task: ScheduleTask
  completion?: Completion | null
  loading?: boolean
  onToggle: (completed: boolean) => void
}

export function ScheduleBlock({ task, completion, loading, onToggle }: Props) {
  const isNight = task.category === 'night'
  const isCompleted = completion != null
  const borderColor = categoryColor(task.category)
  const bgColor = categoryBackground(task.category)
  const textColor = isNight ? colors.nightText : colors.textPrimary
  const timeColor = isNight ? colors.nightMuted : colors.textSecondary

  return (
    <div
      className="schedule-block"
      style={{
        backgroundColor: bgColor,
        borderLeftColor: borderColor,
      }}
    >
      <div className="schedule-time" style={{ color: timeColor }}>
        {task.timeLabel}
      </div>
      <span className="schedule-icon">{task.icon}</span>
      <div className="schedule-content">
        <div className="schedule-title" style={{ color: textColor }}>
          {task.title}
        </div>
        {task.subtitle && (
          <div className="schedule-subtitle" style={{ color: textColor }}>
            {task.subtitle}
          </div>
        )}
        {completion && (
          <div
            className="schedule-attribution"
            style={{ color: isNight ? colors.nightMuted : colors.potty }}
          >
            Checked by {completion.completedByName ?? 'someone'} at{' '}
            {format(completion.completedAt, 'h:mm a')}
          </div>
        )}
      </div>
      <div className="schedule-check">
        {loading ? (
          <div className="mini-spinner" />
        ) : (
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => onToggle(e.target.checked)}
            style={{ accentColor: borderColor }}
          />
        )}
      </div>
    </div>
  )
}

export function SectionDivider({ label }: { label: string }) {
  return <div className="section-divider">— {label} —</div>
}

export function CurrentTimeLine({ time }: { time: Date }) {
  const label = format(time, 'h:mm a')
  return (
    <div className="current-time-line">
      <span className="current-time-label">{label}</span>
      <div className="current-time-rule" />
      <div className="current-time-dot" />
    </div>
  )
}
