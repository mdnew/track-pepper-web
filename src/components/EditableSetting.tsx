import { useEffect, useState } from 'react'
import './EditableSetting.css'

interface EditableTextSettingProps {
  label: string
  value: string
  onSave: (value: string) => Promise<void>
  saving?: boolean
  emptyLabel?: string
}

export function EditableTextSetting({
  label,
  value,
  onSave,
  saving = false,
  emptyLabel = 'Not set',
}: EditableTextSettingProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await onSave(draft.trim())
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="editable-setting">
        <div className="editable-setting-header">
          <p className="read-only-label">{label}</p>
          <button
            type="button"
            className="edit-icon-btn"
            onClick={startEdit}
            aria-label={`Edit ${label}`}
          >
            <EditIcon />
          </button>
        </div>
        <p className="read-only-value">{value.trim() || emptyLabel}</p>
      </div>
    )
  }

  return (
    <form className="editable-setting-form" onSubmit={handleSave}>
      <label>
        {label}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      </label>
      <div className="editable-setting-actions">
        <button type="button" className="btn-outline" onClick={cancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || !draft.trim()}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

interface EditablePasswordSettingProps {
  onSave: (password: string) => Promise<void>
  saving?: boolean
}

export function EditablePasswordSetting({
  onSave,
  saving = false,
}: EditablePasswordSettingProps) {
  const [editing, setEditing] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function cancel() {
    setNewPassword('')
    setConfirmPassword('')
    setEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) return
    if (newPassword !== confirmPassword) return
    await onSave(newPassword)
    setNewPassword('')
    setConfirmPassword('')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="editable-setting">
        <div className="editable-setting-header">
          <p className="read-only-label">Password</p>
          <button
            type="button"
            className="edit-icon-btn"
            onClick={() => setEditing(true)}
            aria-label="Change password"
          >
            <EditIcon />
          </button>
        </div>
        <p className="read-only-value">••••••••</p>
      </div>
    )
  }

  return (
    <form className="editable-setting-form" onSubmit={handleSave}>
      <label>
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>
      <div className="editable-setting-actions">
        <button type="button" className="btn-outline" onClick={cancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={
            saving ||
            newPassword.length < 6 ||
            newPassword !== confirmPassword
          }
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function EditIconButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="edit-icon-btn"
      onClick={onClick}
      aria-label={label}
    >
      <EditIcon />
    </button>
  )
}
