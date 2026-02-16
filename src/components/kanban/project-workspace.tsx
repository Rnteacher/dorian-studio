'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { useUser } from '@/lib/hooks/use-user'
import { KANBAN_COLUMNS } from '@/lib/utils/constants'
import { getNewOrderIndex, needsRebalancing } from '@/lib/utils/order-index'
import { createTaskAction, updateTaskAction, moveTaskAction, archiveTaskAction, rebalanceColumnAction } from '@/lib/actions/tasks'
import { addToNowAction, removeFromNowAction, reorderNowAction } from '@/lib/actions/now'
import { ProjectHeader } from './project-header'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { TaskDialog } from './task-dialog'
import { NowSidebar } from '@/components/now/now-sidebar'
import { NowItem } from '@/components/now/now-item'
import { ProjectInfoPanel, type PhaseWithLead } from './project-info-panel'
import type { Task, TaskStatus, Project, Client, ClientContact, ProjectNote, Profile } from '@/types/database'
import type { MemberWithProfile, NowItemWithTask, TaskFilter } from '@/types/kanban'

interface NoteWithProfile extends ProjectNote {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

interface ProjectWorkspaceProps {
  project: Project
  client: Client
  contacts: ClientContact[]
  members: MemberWithProfile[]
  initialTasks: Task[]
  initialNowItems: NowItemWithTask[]
  phases: PhaseWithLead[]
  notes: NoteWithProfile[]
  userId: string
}

export function ProjectWorkspace({
  project,
  client,
  contacts,
  members,
  initialTasks,
  initialNowItems,
  phases,
  notes,
  userId,
}: ProjectWorkspaceProps) {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [nowItems, setNowItems] = useState<NowItemWithTask[]>(initialNowItems)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [preDragStatus, setPreDragStatus] = useState<TaskStatus | null>(null)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)

  const memberProfiles = useMemo(
    () => members.map((m) => m.profiles),
    [members]
  )

  // Group tasks by status, apply filter
  const tasksByStatus = useMemo(() => {
    const filtered = filter === 'mine'
      ? tasks.filter((t) => t.assignee_id === user.id)
      : tasks

    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      doing: [],
      done: [],
      frozen: [],
    }

    for (const task of filtered) {
      if (!task.is_archived && grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }

    // Sort by order_index
    for (const status of KANBAN_COLUMNS) {
      grouped[status].sort((a, b) => a.order_index - b.order_index)
    }

    return grouped
  }, [tasks, filter, user.id])

  // Sort now items
  const sortedNowItems = useMemo(
    () => [...nowItems].sort((a, b) => a.order_index - b.order_index),
    [nowItems]
  )

  // DnD sensors — improved for cross-container drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Find which container (column or now-list) an item belongs to
  const findContainer = useCallback((id: string): TaskStatus | 'now-list' | null => {
    // Check now items
    if (id.startsWith('now-')) return 'now-list'
    if (id === 'now-list') return 'now-list'

    // Check columns
    for (const status of KANBAN_COLUMNS) {
      if (id === `column-${status}`) return status
      if (tasksByStatus[status].some((t) => t.id === id)) return status
    }

    return null
  }, [tasksByStatus])

  // --- DnD Handlers ---

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current
    if (data?.type === 'task') {
      const task = data.task as Task
      setActiveTask(task)
      setPreDragStatus(task.status)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !activeTask) return

    const activeContainer = findContainer(active.id as string)
    const overContainer = findContainer(over.id as string)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    // Any interaction with now-list — don't change status during dragOver
    if (overContainer === 'now-list' || activeContainer === 'now-list') {
      return
    }

    // Moving between kanban columns — optimistic status update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTask.id
          ? { ...t, status: overContainer as TaskStatus }
          : t
      )
    )
    setActiveTask((prev) =>
      prev ? { ...prev, status: overContainer as TaskStatus } : null
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    const draggedTaskId = active.id as string
    setActiveTask(null)

    if (!over) {
      // Drag cancelled — restore original status
      if (preDragStatus) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === draggedTaskId ? { ...t, status: preDragStatus } : t
          )
        )
      }
      setPreDragStatus(null)
      return
    }
    setPreDragStatus(null)

    const activeId = active.id as string
    const overId = over.id as string
    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer) return

    // --- Case 1: Reorder within Now list ---
    if (activeContainer === 'now-list' && overContainer === 'now-list') {
      const nowItemId = activeId.replace('now-', '')
      const overNowId = overId.replace('now-', '')

      const oldIndex = sortedNowItems.findIndex((i) => i.id === nowItemId)
      const newIndex = sortedNowItems.findIndex((i) => i.id === overNowId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = [...sortedNowItems]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const newOrder = getNewOrderIndex(
        reordered.filter((_, i) => i !== newIndex),
        newIndex
      )

      // Optimistic
      setNowItems((prev) =>
        prev.map((i) =>
          i.id === nowItemId ? { ...i, order_index: newOrder } : i
        )
      )

      try {
        await reorderNowAction(nowItemId, project.id, newOrder)
      } catch {
        toast.error('שגיאה בסידור מחדש')
        setNowItems(initialNowItems)
      }
      return
    }

    // --- Case 2: From kanban to Now list ---
    // Move task to "doing" status automatically
    if (activeContainer !== 'now-list' && overContainer === 'now-list') {
      const task = tasks.find((t) => t.id === activeId)
      if (!task) return

      // Check if already in now
      if (nowItems.some((i) => i.task_id === task.id)) {
        // Restore original status if dragOver changed it
        if (preDragStatus && task.status !== preDragStatus) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status: preDragStatus } : t
            )
          )
        }
        toast.info('המשימה כבר ברשימת עכשיו')
        return
      }

      // Optimistic: change status to "doing" + auto-assign
      const updatedTask = {
        ...task,
        status: 'doing' as TaskStatus,
        assignee_id: task.assignee_id || user.id,
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updatedTask : t))
      )

      const orderIndex = getNewOrderIndex(sortedNowItems, sortedNowItems.length)

      try {
        const result = await addToNowAction(task.id, project.id, orderIndex)
        if (result) {
          setNowItems((prev) => [
            ...prev,
            {
              ...(result as unknown as NowItemWithTask),
              tasks: updatedTask,
            },
          ])
        }
      } catch {
        toast.error('שגיאה בהוספה לעכשיו')
        setTasks(initialTasks)
      }
      return
    }

    // --- Case 3: From now-list back to kanban column ---
    // Just remove from now, don't change task status
    if (activeContainer === 'now-list' && overContainer !== 'now-list') {
      const nowItemId = activeId.replace('now-', '')
      const nowItem = sortedNowItems.find((i) => i.id === nowItemId)
      if (!nowItem) return

      // Optimistic remove from now
      setNowItems((prev) => prev.filter((i) => i.id !== nowItemId))

      try {
        await removeFromNowAction(nowItemId, project.id)
      } catch {
        toast.error('שגיאה בהסרה מעכשיו')
        setNowItems(initialNowItems)
      }
      return
    }

    // --- Case 4: Reorder within same kanban column or move between columns ---
    const task = tasks.find((t) => t.id === activeId)
    if (!task) return

    const targetStatus = overContainer as TaskStatus
    const columnTasks = tasksByStatus[targetStatus].filter(
      (t) => t.id !== task.id
    )

    // Find target position
    let targetIndex = columnTasks.length // default: end
    if (overId !== `column-${targetStatus}`) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId)
      if (overIndex !== -1) targetIndex = overIndex
    }

    const newOrder = getNewOrderIndex(columnTasks, targetIndex)

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: targetStatus, order_index: newOrder }
          : t
      )
    )

    // Also update now items if task status changed
    if (task.status !== targetStatus) {
      setNowItems((prev) =>
        prev.map((i) =>
          i.task_id === task.id
            ? { ...i, tasks: { ...i.tasks, status: targetStatus } }
            : i
        )
      )
    }

    try {
      await moveTaskAction(task.id, project.id, targetStatus, newOrder)

      // Check if column needs rebalancing
      const updatedColumn = [...columnTasks]
      updatedColumn.splice(targetIndex, 0, { ...task, order_index: newOrder })
      if (needsRebalancing(updatedColumn)) {
        await rebalanceColumnAction(
          project.id,
          targetStatus,
          updatedColumn.map((t) => t.id)
        )
      }
    } catch {
      toast.error('שגיאה בהעברת משימה')
      setTasks(initialTasks)
    }
  }

  // --- Task CRUD handlers ---

  async function handleAddTask(status: TaskStatus, title: string) {
    const columnTasks = tasksByStatus[status]
    const orderIndex = getNewOrderIndex(columnTasks, columnTasks.length)

    try {
      const result = await createTaskAction(project.id, title, status, orderIndex)
      setTasks((prev) => [...prev, result as unknown as Task])
    } catch {
      toast.error('שגיאה ביצירת משימה')
    }
  }

  async function handleSaveTask(
    taskId: string,
    updates: {
      title?: string
      description?: string
      assignee_id?: string | null
      due_date?: string | null
      status?: TaskStatus
    }
  ) {
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )

    // Update now items too
    setNowItems((prev) =>
      prev.map((i) =>
        i.task_id === taskId
          ? { ...i, tasks: { ...i.tasks, ...updates } as Task }
          : i
      )
    )

    try {
      await updateTaskAction(taskId, project.id, updates)
    } catch {
      toast.error('שגיאה בעדכון משימה')
      setTasks(initialTasks)
    }
  }

  async function handleArchiveTask(taskId: string) {
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_archived: true } : t))
    )
    setNowItems((prev) => prev.filter((i) => i.task_id !== taskId))

    try {
      await archiveTaskAction(taskId, project.id)
    } catch {
      toast.error('שגיאה בארכוב משימה')
      setTasks(initialTasks)
      setNowItems(initialNowItems)
    }
  }

  async function handleRemoveFromNow(nowItemId: string) {
    // Optimistic
    setNowItems((prev) => prev.filter((i) => i.id !== nowItemId))

    try {
      await removeFromNowAction(nowItemId, project.id)
    } catch {
      toast.error('שגיאה בהסרה מעכשיו')
      setNowItems(initialNowItems)
    }
  }

  // Determine active overlay type
  const activeNowItem = activeTask
    ? sortedNowItems.find((i) => i.task_id === activeTask.id)
    : null

  return (
    <div className="space-y-4">
      <ProjectHeader
        project={project}
        client={client}
        contacts={contacts}
        members={members}
        filter={filter}
        onFilterChange={setFilter}
        onInfoToggle={() => setInfoPanelOpen(true)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {/* Kanban columns (RTL: appear on the right) */}
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                members={memberProfiles}
                onAddTask={handleAddTask}
                onTaskClick={(task) => {
                  setEditingTask(task)
                  setDialogOpen(true)
                }}
              />
            ))}
          </div>

          {/* Now sidebar (RTL: appears on the left) */}
          <NowSidebar
            items={sortedNowItems}
            onRemove={handleRemoveFromNow}
          />
        </div>

        <DragOverlay>
          {activeTask && !activeNowItem && (
            <TaskCard
              task={activeTask}
              members={memberProfiles}
              onClick={() => {}}
              isDragOverlay
            />
          )}
          {activeTask && activeNowItem && (
            <NowItem
              item={activeNowItem}
              onRemove={() => {}}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        task={editingTask}
        members={memberProfiles}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        onSave={handleSaveTask}
        onArchive={handleArchiveTask}
      />

      <ProjectInfoPanel
        open={infoPanelOpen}
        onOpenChange={setInfoPanelOpen}
        project={project}
        client={client}
        contacts={contacts}
        notes={notes}
        phases={phases}
        userId={userId}
      />
    </div>
  )
}
