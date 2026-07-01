import { format } from 'date-fns'

import type { Completion, PetSpecies, ScheduleTask } from '../types'
import { categoryBackground, categoryColor, colors } from '../theme/colors'
import './ScheduleBlock.css'

interface Props {
  task: ScheduleTask
  species?: PetSpecies
  completion?: Completion | null
  loading?: boolean
  readOnly?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggle: (completed: boolean) => void
}

export function ScheduleBlock({
  task,
  species = 'dog',
  completion,
  loading,
  readOnly = false,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const isNight = task.category === 'night'
  const isCompleted = completion != null
  const borderColor = categoryColor(task.category, species)
  const bgColor = categoryBackground(task.category, species)
  const textColor = isNight ? colors.nightText : 'var(--text-primary)'
  const timeColor = isNight ? colors.nightMuted : 'var(--text-secondary)'
  const attributionColor = isNight
    ? colors.nightMuted
    : species === 'cat'
      ? 'var(--progress-accent)'
      : colors.potty

  return (
    <div
      className="schedule-block"
      style={{
        backgroundColor: bgColor,
        borderLeftColor: borderColor,
      }}
    >
      {task.timeLabel && (
        <div className="schedule-time" style={{ color: timeColor }}>
          {task.timeLabel}
        </div>
      )}
      <span className="schedule-icon">{task.icon}</span>
      <div className="schedule-content">
        <div className="schedule-title" style={{ color: textColor }}>
          {task.title}
        </div>
        {task.subtitle && (
          <div
            className="schedule-subtitle"
            style={{ color: isNight ? textColor : 'var(--text-secondary)' }}
          >
            {task.subtitle}
          </div>
        )}
        {completion && (
          <div className="schedule-attribution" style={{ color: attributionColor }}>
            Checked by {completion.completedByName ?? 'someone'} at{' '}
            {format(completion.completedAt, 'h:mm a')}
          </div>
        )}
      </div>
      <div className="schedule-check">
        {readOnly ? (
          <div className="schedule-actions">
            <button type="button" className="schedule-edit-btn" onClick={onEdit}>
              Edit
            </button>
            {onDelete && (
              <button
                type="button"
                className="schedule-delete-btn"
                onClick={onDelete}
                aria-label={`Delete ${task.title}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )}
          </div>
        ) : loading ? (
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
  return <div className="section-divider">{label}</div>
}

export function CurrentTimeLine({
  time,
  species = 'dog',
}: {
  time: Date
  species?: PetSpecies
}) {
  const label = format(time, 'h:mm a')
  const accent = species === 'cat' ? 'var(--progress-accent)' : colors.train
  return (
    <div className="current-time-line">
      <span className="current-time-label" style={{ color: accent }}>
        {label}
      </span>
      <div className="current-time-rule" style={{ backgroundColor: accent }} />
      <div className="current-time-dot" style={{ backgroundColor: accent }} />
    </div>
  )
}
