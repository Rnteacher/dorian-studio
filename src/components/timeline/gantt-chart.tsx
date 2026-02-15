'use client'

import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isSameMonth, isToday } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ProjectEvent } from '@/types/database'

interface GanttProject {
  id: string
  name: string
  clientName?: string
  status: string
  start_date: string | null
  due_date: string | null
  events: ProjectEvent[]
}

interface GanttChartProps {
  projects: GanttProject[]
  singleProject?: boolean
}

const STATUS_BAR_COLORS: Record<string, string> = {
  active: 'bg-blue-400',
  on_hold: 'bg-amber-400',
  completed: 'bg-green-400',
  planning: 'bg-slate-400',
}

export function GanttChart({ projects, singleProject = false }: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDays = days.length

  // Navigation
  function goToPrev() {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }
  function goToNext() {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }
  function goToToday() {
    setCurrentMonth(new Date())
  }

  // Calculate bar position for a project
  function getBarStyle(startDate: string | null, dueDate: string | null) {
    if (!startDate && !dueDate) return null

    const start = startDate ? new Date(startDate) : monthStart
    const end = dueDate ? new Date(dueDate) : monthEnd

    // Clamp to month boundaries
    const clampedStart = start < monthStart ? monthStart : start
    const clampedEnd = end > monthEnd ? monthEnd : end

    if (clampedStart > monthEnd || clampedEnd < monthStart) return null

    const left = (differenceInDays(clampedStart, monthStart) / totalDays) * 100
    const width = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` }
  }

  // Find event dots for a project in this month
  function getEventDots(events: ProjectEvent[]) {
    return events
      .filter((e) => {
        const d = new Date(e.event_date)
        return d >= monthStart && d <= monthEnd
      })
      .map((e) => {
        const d = new Date(e.event_date)
        const left = (differenceInDays(d, monthStart) / totalDays) * 100
        return { ...e, left: `${left}%` }
      })
  }

  // Today line position
  const todayLeft = useMemo(() => {
    const today = new Date()
    if (!isSameMonth(today, currentMonth)) return null
    return `${(differenceInDays(today, monthStart) / totalDays) * 100}%`
  }, [currentMonth, monthStart, totalDays])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrev}>
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: he })}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          היום
        </Button>
      </div>

      {/* Timeline */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="flex border-b bg-muted/50">
          <div className={`${singleProject ? 'w-[120px]' : 'w-[200px]'} shrink-0 px-3 py-2 text-sm font-medium border-e`}>
            {singleProject ? 'סוג' : 'פרויקט'}
          </div>
          <div className="flex-1 flex relative">
            {days.map((day, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-[10px] py-1 border-e last:border-e-0 ${
                  isToday(day) ? 'bg-primary/10 font-bold' : ''
                } ${day.getDay() === 6 ? 'bg-muted/30' : ''}`}
              >
                <div>{format(day, 'd')}</div>
                {i === 0 || day.getDate() === 1 ? (
                  <div className="text-muted-foreground">{format(day, 'EEE', { locale: he })}</div>
                ) : (
                  <div className="text-muted-foreground">{format(day, 'EEEEE', { locale: he })}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Project rows */}
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            אין פרויקטים להצגה
          </div>
        ) : (
          projects.map((project) => {
            const barStyle = getBarStyle(project.start_date, project.due_date)
            const eventDots = getEventDots(project.events)
            const barColor = STATUS_BAR_COLORS[project.status] || 'bg-blue-400'

            return (
              <div key={project.id} className="flex border-b last:border-b-0 hover:bg-muted/20">
                {/* Project name */}
                <div className={`${singleProject ? 'w-[120px]' : 'w-[200px]'} shrink-0 px-3 py-3 border-e`}>
                  <div className="text-sm font-medium truncate">{project.name}</div>
                  {!singleProject && project.clientName && (
                    <div className="text-xs text-muted-foreground truncate">{project.clientName}</div>
                  )}
                </div>

                {/* Bar area */}
                <div className="flex-1 relative py-2 min-h-[48px]">
                  {/* Today line */}
                  {todayLeft && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                      style={{ left: todayLeft }}
                    />
                  )}

                  {/* Project bar */}
                  {barStyle && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute top-2 h-6 ${barColor} rounded-md opacity-80 hover:opacity-100 transition-opacity cursor-default`}
                          style={barStyle}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{project.name}</p>
                          {project.start_date && <p>התחלה: {format(new Date(project.start_date), 'd MMM yyyy', { locale: he })}</p>}
                          {project.due_date && <p>יעד: {format(new Date(project.due_date), 'd MMM yyyy', { locale: he })}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Event dots */}
                  {eventDots.map((evt) => (
                    <Tooltip key={evt.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute bottom-1 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-white cursor-default z-20 -translate-x-1/2"
                          style={{ left: evt.left }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{evt.title}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(evt.event_date), 'd MMM yyyy', { locale: he })}
                            {evt.event_time && ` · ${evt.event_time.slice(0, 5)}`}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
