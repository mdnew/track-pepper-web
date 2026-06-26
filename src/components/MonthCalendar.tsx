import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import { CompletionIndicator } from './CompletionIndicator'
import { colors } from '../theme/colors'
import './MonthCalendar.css'

interface Props {
  focusedMonth: Date
  completionCounts: Map<string, number>
  totalTasks: number
  onMonthChange: (month: Date) => void
  onDaySelect: (day: Date) => void
}

function formatKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function MonthCalendar({
  focusedMonth,
  completionCounts,
  totalTasks,
  onMonthChange,
  onDaySelect,
}: Props) {
  const monthStart = startOfMonth(focusedMonth)
  const monthEnd = endOfMonth(focusedMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button
          type="button"
          className="month-nav"
          onClick={() => onMonthChange(addMonths(focusedMonth, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2>{format(focusedMonth, 'MMMM yyyy')}</h2>
        <button
          type="button"
          className="month-nav"
          onClick={() => onMonthChange(addMonths(focusedMonth, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="month-weekdays">
        {weekDays.map((d) => (
          <div key={d} className="month-weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="month-grid">
        {days.map((day) => {
          const key = formatKey(day)
          const completed = completionCounts.get(key) ?? 0
          const isToday = isSameDay(day, today)
          const isOutside = !isSameMonth(day, focusedMonth)

          return (
            <button
              key={key}
              type="button"
              className={`month-day ${isOutside ? 'outside' : ''}`}
              onClick={() => onDaySelect(day)}
            >
              <span
                className={`month-day-number ${isToday ? 'today' : ''}`}
                style={{
                  color: isOutside
                    ? 'rgb(122 92 60 / 45%)'
                    : isToday
                      ? colors.header
                      : colors.textPrimary,
                }}
              >
                {day.getDate()}
              </span>
              <CompletionIndicator completed={completed} total={totalTasks} size={26} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
