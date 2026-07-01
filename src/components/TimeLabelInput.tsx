import { forwardRef, useImperativeHandle, useState } from 'react'

import {
  inputValueToTimeLabel,
  normalizeTimeLabel,
  timeLabelToInputValue,
} from '../utils/scheduleTime'
import './TimeLabelInput.css'

export interface TimeLabelInputHandle {
  commit: () => boolean
}

interface Props {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  id?: string
}

export const TimeLabelInput = forwardRef<TimeLabelInputHandle, Props>(
  function TimeLabelInput({ value, onChange, autoFocus, id }, ref) {
    const [error, setError] = useState<string | null>(null)
    const inputValue = timeLabelToInputValue(value)

    useImperativeHandle(ref, () => ({
      commit: () => {
        if (!normalizeTimeLabel(value)) {
          setError('Pick a time.')
          return false
        }
        setError(null)
        return true
      },
    }))

    function handleChange(nextInputValue: string) {
      const label = inputValueToTimeLabel(nextInputValue)
      if (!label) {
        setError('Pick a time.')
        return
      }
      setError(null)
      onChange(label)
    }

    return (
      <div className="time-label-input">
        <input
          id={id}
          type="time"
          value={inputValue}
          className={error ? 'input-invalid' : undefined}
          aria-invalid={error != null}
          autoFocus={autoFocus}
          onChange={(e) => handleChange(e.target.value)}
        />
        {error && <span className="field-hint field-hint-error">{error}</span>}
      </div>
    )
  },
)

export function validateTimeLabel(value: string): string | null {
  return normalizeTimeLabel(value)
}
