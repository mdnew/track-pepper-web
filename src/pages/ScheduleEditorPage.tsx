import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ConfirmDialog } from '../components/ConfirmDialog'
import { ScheduleBlock, SectionDivider } from '../components/ScheduleBlock'
import {
  TimeLabelInput,
  validateTimeLabel,
  type TimeLabelInputHandle,
} from '../components/TimeLabelInput'
import { ErrorBanner } from '../components/ui'
import { petsService } from '../services/pets'
import { scheduleService } from '../services/schedule'
import { useAuth } from '../context/AuthContext'
import type { Pet, SchedulePlan, ScheduleTask, TaskCategory } from '../types'
import { CATEGORY_DEFAULTS, TASK_CATEGORIES } from '../types'
import { applySpeciesTheme, speciesTheme } from '../theme/speciesTheme'
import { formatPetSummaryWithPlan } from '../utils/petAge'
import { resolvePlanForPet } from '../utils/schedulePlan'
import { formatApiError } from '../utils/formatApiError'
import { sortTasksChronologically } from '../utils/scheduleTime'
import '../pages/SettingsPage.css'

type TaskDraft = {
  id: string
  timeLabel: string
  category: TaskCategory
  title: string
  subtitle: string
  icon: string
  section: string
}

function toDraft(task: ScheduleTask): TaskDraft {
  return {
    id: task.id,
    timeLabel: task.timeLabel,
    category: task.category as TaskCategory,
    title: task.title,
    subtitle: task.subtitle ?? '',
    icon: task.icon,
    section: task.section,
  }
}

function draftToTask(draft: TaskDraft, petId: string): ScheduleTask {
  return {
    id: draft.id,
    planId: null,
    petId,
    sortOrder: 0,
    timeLabel: draft.timeLabel,
    category: draft.category,
    title: draft.title,
    subtitle: draft.subtitle || null,
    icon: draft.icon,
    section: draft.section,
    isCustom: true,
  }
}

function newTaskDraft(): TaskDraft {
  const defaults = CATEGORY_DEFAULTS.potty
  return {
    id: `new-${crypto.randomUUID()}`,
    timeLabel: '8:00 AM',
    category: 'potty',
    title: defaults.title,
    subtitle: '',
    icon: defaults.icon,
    section: defaults.section,
  }
}

function sortDrafts(tasks: TaskDraft[]): TaskDraft[] {
  return sortTasksChronologically(
    tasks.map((task, index) => ({
      ...draftToTask(task, ''),
      sortOrder: index,
    })),
  ).map(toDraft)
}

function TaskEditForm({
  task,
  onUpdate,
  onCategoryChange,
  onDelete,
  onDone,
  onCancel,
}: {
  task: TaskDraft
  onUpdate: (patch: Partial<TaskDraft>) => void
  onCategoryChange: (category: TaskCategory) => void
  onDelete: () => void
  onDone: () => void
  onCancel: () => void
}) {
  const timeInputRef = useRef<TimeLabelInputHandle>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleDone() {
    if (!timeInputRef.current?.commit()) return
    onDone()
  }

  function handleDeleteClick() {
    if (task.id.startsWith('new-')) {
      onDelete()
      return
    }
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
    onDelete()
    setShowDeleteConfirm(false)
  }

  const taskLabel = task.title.trim() || 'This task'

  return (
    <>
      <div className="schedule-editor-item">
      <div className="schedule-editor-row">
        <label>
          Time
          <TimeLabelInput
            ref={timeInputRef}
            value={task.timeLabel}
            onChange={(timeLabel) => onUpdate({ timeLabel })}
            autoFocus
          />
        </label>
        <label>
          Category
          <select
            value={task.category}
            onChange={(e) => onCategoryChange(e.target.value as TaskCategory)}
          >
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Title
        <input
          value={task.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </label>
      <label>
        Subtitle (optional)
        <input
          value={task.subtitle}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
        />
      </label>
      <div className="editable-setting-actions">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleDone}>
          Done
        </button>
      </div>
      <button
        type="button"
        className="btn-outline btn-outline-danger schedule-editor-delete"
        onClick={handleDeleteClick}
      >
        Delete task
      </button>
    </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete task?"
        message={`"${taskLabel}" will be removed from this schedule.`}
        confirmLabel="Delete task"
        confirmingLabel="Deleting…"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export function ScheduleEditorPage() {
  const { petId } = useParams<{ petId: string }>()
  const navigate = useNavigate()
  const { activeHouseholdId, user } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [plan, setPlan] = useState<SchedulePlan | null>(null)
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isCustomized, setIsCustomized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!petId || !activeHouseholdId) return
    setLoading(true)
    setError(null)
    try {
      const pets = await petsService.getPets(activeHouseholdId)
      const nextPet = pets.find((item) => item.id === petId) ?? null
      if (!nextPet) {
        setError('Pet not found.')
        return
      }

      const plans = await scheduleService.getPlans()
      const resolvedPlan = resolvePlanForPet(plans, nextPet, new Date())

      let nextTasks: ScheduleTask[]
      let nextPlan = resolvedPlan
      const customTasks = await scheduleService.getValidCustomTasksForPet(petId)
      if (customTasks) {
        nextTasks = customTasks
        setIsCustomized(true)
      } else {
        const draft = await scheduleService.copyPlanToCustomDraft(
          nextPet,
          plans,
          new Date(),
        )
        nextTasks = draft.tasks
        nextPlan = draft.plan ?? resolvedPlan
        setIsCustomized(false)
      }

      setPet(nextPet)
      setPlan(nextPlan)
      setTasks(sortTasksChronologically(nextTasks).map(toDraft))
      setEditingTaskId(null)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }, [petId, activeHouseholdId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    applySpeciesTheme(speciesTheme(pet?.species ?? 'dog'))
  }, [pet?.species])

  function updateTask(id: string, patch: Partial<TaskDraft>) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    )
  }

  function handleCategoryChange(id: string, category: TaskCategory) {
    const defaults = CATEGORY_DEFAULTS[category]
    updateTask(id, {
      category,
      title: defaults.title,
      icon: defaults.icon,
      section: defaults.section,
    })
  }

  function finishEdit() {
    setTasks((prev) => sortDrafts(prev))
    setEditingTaskId(null)
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
    if (editingTaskId === id) setEditingTaskId(null)
    if (deleteConfirmTaskId === id) setDeleteConfirmTaskId(null)
  }

  function requestDeleteTask(id: string) {
    if (id.startsWith('new-')) {
      removeTask(id)
      return
    }
    setDeleteConfirmTaskId(id)
  }

  function cancelEdit(id: string) {
    if (id.startsWith('new-')) {
      removeTask(id)
    }
    setEditingTaskId(null)
  }

  function startAddTask() {
    const draft = newTaskDraft()
    setTasks((prev) => [...prev, draft])
    setEditingTaskId(draft.id)
  }

  async function handleSave() {
    if (!petId || !user || !pet) return
    if (tasks.some((task) => !task.title.trim())) {
      setError('Each task needs a title.')
      return
    }
    if (tasks.some((task) => !validateTimeLabel(task.timeLabel))) {
      setError('Each task needs a time.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await scheduleService.saveCustomSchedule(
        petId,
        plan?.id ?? null,
        tasks.map((task, index) => ({
          id: task.id,
          planId: null,
          petId,
          sortOrder: index,
          timeLabel: validateTimeLabel(task.timeLabel.trim()) ?? task.timeLabel.trim(),
          category: task.category,
          title: task.title.trim(),
          subtitle: task.subtitle.trim() || null,
          icon: task.icon,
          section: task.section,
          isCustom: true,
        })),
        user.id,
      )
      setIsCustomized(true)
      setEditingTaskId(null)
      setMessage('Schedule saved.')
      await load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!petId) return

    setResetting(true)
    setError(null)
    setMessage(null)
    try {
      await scheduleService.resetScheduleToDefault(petId)
      setEditingTaskId(null)
      setShowResetConfirm(false)
      setMessage('Schedule reset to default.')
      await load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setResetting(false)
    }
  }

  let currentSection: string | null = null
  const taskElements: React.ReactNode[] = []

  if (pet && petId) {
    tasks.forEach((task, index) => {
      if (task.section !== currentSection) {
        currentSection = task.section
        taskElements.push(
          <SectionDivider
            key={`section-${task.section}-${index}`}
            label={task.section}
          />,
        )
      }

      if (editingTaskId === task.id) {
        taskElements.push(
          <TaskEditForm
            key={task.id}
            task={task}
            onUpdate={(patch) => updateTask(task.id, patch)}
            onCategoryChange={(category) => handleCategoryChange(task.id, category)}
            onDelete={() => removeTask(task.id)}
            onDone={finishEdit}
            onCancel={() => cancelEdit(task.id)}
          />,
        )
      } else {
        taskElements.push(
          <ScheduleBlock
            key={task.id}
            task={draftToTask(task, petId)}
            species={pet.species}
            readOnly
            onEdit={() => setEditingTaskId(task.id)}
            onDelete={() => requestDeleteTask(task.id)}
            onToggle={() => undefined}
          />,
        )
      }
    })
  }

  return (
    <div className="page-with-header">
      <header className="app-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          ‹
        </button>
        <h1>Edit schedule</h1>
        <div className="header-spacer" />
      </header>

      <main className="settings-page">
        {loading ? (
          <div className="settings-loading">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {error && <ErrorBanner message={error} />}
            {message && <div className="success-banner">{message}</div>}

            {pet && (
              <>
                <section className="settings-card">
                  <h2>Tasks</h2>
                  <p className="schedule-editor-pet-line">
                    {formatPetSummaryWithPlan(pet, plan)}
                    {isCustomized ? ' · customized' : ''}
                  </p>
                  <p className="settings-help">
                    Tap Edit on a task to change its time or description, then
                    click Save schedule below. Changes apply to every day,
                    including today. Use Reset to default to restore the
                    age-based schedule.
                  </p>

                  <div className="schedule-editor-preview">{taskElements}</div>

                  {!editingTaskId && (
                    <button
                      type="button"
                      className="btn-outline add-pet-button"
                      onClick={startAddTask}
                    >
                      Add task
                    </button>
                  )}
                </section>

                <div className="schedule-editor-footer">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={saving || tasks.length === 0 || editingTaskId != null}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving…' : 'Save schedule'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={resetting || editingTaskId != null}
                    onClick={() => setShowResetConfirm(true)}
                  >
                    {resetting ? 'Resetting…' : 'Reset to default'}
                  </button>
                  <Link to="/settings" className="schedule-editor-back">
                    Back to settings
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset to default?"
        message="This restores the original age-based schedule. Your custom tasks will be removed."
        confirmLabel="Reset to default"
        confirmingLabel="Resetting…"
        confirming={resetting}
        onCancel={() => {
          if (!resetting) setShowResetConfirm(false)
        }}
        onConfirm={handleReset}
      />
      <ConfirmDialog
        open={deleteConfirmTaskId != null}
        title="Delete task?"
        message={
          deleteConfirmTaskId == null
            ? ''
            : `"${
                tasks.find((task) => task.id === deleteConfirmTaskId)?.title.trim() ||
                'This task'
              }" will be removed from this schedule.`
        }
        confirmLabel="Delete task"
        onCancel={() => setDeleteConfirmTaskId(null)}
        onConfirm={() => {
          if (deleteConfirmTaskId) removeTask(deleteConfirmTaskId)
        }}
      />
    </div>
  )
}
