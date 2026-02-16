'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, X } from 'lucide-react'
import type { Profile } from '@/types/database'

export interface PhaseMember {
  user_id: string
  role: string
  name: string
}

export interface PhaseState {
  id: string // local temp id
  start_date: string
  end_date: string
  members: PhaseMember[]
}

interface PhaseEditorProps {
  phases: PhaseState[]
  onPhasesChange: (phases: PhaseState[]) => void
  users: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
}

let nextId = 1
export function generatePhaseId() {
  return `phase-${nextId++}`
}

export function PhaseEditor({ phases, onPhasesChange, users }: PhaseEditorProps) {
  function addPhase() {
    // Default: starts day after previous phase ends, or today
    const lastPhase = phases[phases.length - 1]
    let startDate = ''
    if (lastPhase?.end_date) {
      const d = new Date(lastPhase.end_date)
      d.setDate(d.getDate() + 1)
      startDate = d.toISOString().split('T')[0]
    }

    onPhasesChange([
      ...phases,
      {
        id: generatePhaseId(),
        start_date: startDate,
        end_date: '',
        members: [],
      },
    ])
  }

  function removePhase(phaseId: string) {
    onPhasesChange(phases.filter((p) => p.id !== phaseId))
  }

  function updatePhase(phaseId: string, field: 'start_date' | 'end_date', value: string) {
    onPhasesChange(
      phases.map((p) => (p.id === phaseId ? { ...p, [field]: value } : p))
    )
  }

  function addMember(phaseId: string, userId: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    onPhasesChange(
      phases.map((p) => {
        if (p.id !== phaseId) return p
        if (p.members.some((m) => m.user_id === userId)) return p
        return {
          ...p,
          members: [
            ...p.members,
            {
              user_id: userId,
              role: p.members.length === 0 ? 'lead' : 'member',
              name: user.full_name,
            },
          ],
        }
      })
    )
  }

  function removeMember(phaseId: string, userId: string) {
    onPhasesChange(
      phases.map((p) => {
        if (p.id !== phaseId) return p
        return { ...p, members: p.members.filter((m) => m.user_id !== userId) }
      })
    )
  }

  function toggleRole(phaseId: string, userId: string) {
    onPhasesChange(
      phases.map((p) => {
        if (p.id !== phaseId) return p
        return {
          ...p,
          members: p.members.map((m) =>
            m.user_id === userId
              ? { ...m, role: m.role === 'lead' ? 'member' : 'lead' }
              : m
          ),
        }
      })
    )
  }

  function getAvailableUsers(phase: PhaseState) {
    const phaseUserIds = phase.members.map((m) => m.user_id)
    return users.filter((u) => !phaseUserIds.includes(u.id))
  }

  function getPhaseLead(phase: PhaseState) {
    const lead = phase.members.find((m) => m.role === 'lead')
    return lead?.name
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>שלבי פרויקט וצוותים</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPhase}>
          <Plus className="size-4 me-1" />
          הוסף שלב
        </Button>
      </div>

      {phases.length === 0 && (
        <p className="text-sm text-muted-foreground">
          לחץ &quot;הוסף שלב&quot; כדי להגדיר שלבי פרויקט עם צוותים ותאריכים.
        </p>
      )}

      {phases.map((phase, index) => {
        const lead = getPhaseLead(phase)
        const available = getAvailableUsers(phase)

        return (
          <Card key={phase.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  שלב {index + 1}
                  {lead && <span className="text-muted-foreground font-normal"> — הצוות של {lead}</span>}
                </CardTitle>
                {phases.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => removePhase(phase.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">תאריך התחלה</Label>
                  <Input
                    type="date"
                    value={phase.start_date}
                    onChange={(e) => updatePhase(phase.id, 'start_date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">תאריך סיום</Label>
                  <Input
                    type="date"
                    value={phase.end_date}
                    onChange={(e) => updatePhase(phase.id, 'end_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Team */}
              {available.length > 0 && (
                <Select onValueChange={(val) => addMember(phase.id, val)} value="">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="הוסף חבר/ת צוות" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-4">
                            <AvatarImage src={u.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[8px]">
                              {u.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {u.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {phase.members.length > 0 && (
                <div className="space-y-1.5">
                  {phase.members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between rounded border p-1.5 pe-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.name}</span>
                        <Badge
                          variant={m.role === 'lead' ? 'default' : 'secondary'}
                          className="cursor-pointer text-[10px] px-1.5 py-0"
                          onClick={() => toggleRole(phase.id, m.user_id)}
                        >
                          {m.role === 'lead' ? 'מוביל/ה' : 'חבר/ה'}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-5"
                        onClick={() => removeMember(phase.id, m.user_id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {phases.length > 0 && (
        <p className="text-xs text-muted-foreground">
          לחץ על התג כדי להחליף בין מוביל/ה לחבר/ה. שם השלב נקבע לפי המוביל/ה.
        </p>
      )}
    </div>
  )
}
