'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Plus, MapPin, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { EventForm } from './event-form'
import { GanttChart } from '@/components/timeline/gantt-chart'
import { createEventAction, updateEventAction, deleteEventAction } from '@/lib/actions/events'
import type { ProjectEvent, Project } from '@/types/database'

interface ProjectCalendarProps {
  project: Project
  initialEvents: ProjectEvent[]
  canEdit: boolean
}

export function ProjectCalendar({
  project,
  initialEvents,
  canEdit,
}: ProjectCalendarProps) {
  const [events, setEvents] = useState<ProjectEvent[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ProjectEvent | null>(null)

  // Dates that have events
  const eventDates = useMemo(() => {
    const dates = new Set<string>()
    for (const event of events) {
      dates.add(event.event_date)
    }
    return dates
  }, [events])

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return events
      .filter((e) => e.event_date === dateStr)
      .sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? ''))
  }, [events, selectedDate])

  const selectedDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : ''

  // Gantt data for single project
  const ganttProjects = useMemo(() => [{
    id: project.id,
    name: project.name,
    status: project.status,
    start_date: project.start_date,
    due_date: project.due_date,
    events,
  }], [project, events])

  async function handleSave(data: {
    title: string
    description: string
    event_date: string
    event_time: string
    location: string
  }) {
    try {
      if (editingEvent) {
        await updateEventAction(editingEvent.id, project.id, data)
        setEvents((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id ? { ...e, ...data } : e
          )
        )
      } else {
        const result = await createEventAction(project.id, data)
        setEvents((prev) => [...prev, result as unknown as ProjectEvent])
      }
    } catch {
      toast.error('שגיאה בשמירת אירוע')
    }
  }

  async function handleDelete(eventId: string) {
    try {
      await deleteEventAction(eventId, project.id)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch {
      toast.error('שגיאה במחיקת אירוע')
    }
  }

  // Custom day rendering to show dots
  const modifiers = useMemo(() => {
    const dates: Date[] = []
    for (const dateStr of eventDates) {
      dates.push(new Date(dateStr + 'T00:00:00'))
    }
    return { hasEvent: dates }
  }, [eventDates])

  const modifiersClassNames = {
    hasEvent: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ציר זמן ואירועים</h1>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 me-1" />
            אירוע חדש
          </Button>
        )}
      </div>

      {/* Gantt timeline for this project */}
      <GanttChart projects={ganttProjects} singleProject />

      <Separator />

      {/* Event calendar picker */}
      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={he}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </div>

        <div className="flex-1 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground">
            {selectedDate
              ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })
              : 'בחר תאריך'}
          </h2>

          {selectedDateEvents.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              אין אירועים ביום זה
            </p>
          )}

          {selectedDateEvents.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setEditingEvent(event)
                setFormOpen(true)
              }}
            >
              <CardContent className="p-4">
                <h3 className="font-medium">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {event.event_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.event_time.slice(0, 5)}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <EventForm
        event={editingEvent}
        defaultDate={selectedDateStr}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingEvent(null)
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        canEdit={canEdit}
      />
    </div>
  )
}
