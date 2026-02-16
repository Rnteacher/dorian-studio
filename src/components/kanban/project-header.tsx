'use client'

import { ExternalLink, FolderOpen, Info } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FilterToggle } from './filter-toggle'
import type { Project, Client, Profile, ClientContact } from '@/types/database'
import type { TaskFilter, MemberWithProfile } from '@/types/kanban'

interface ProjectHeaderProps {
  project: Project
  client: Client
  contacts: ClientContact[]
  members: MemberWithProfile[]
  filter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  onInfoToggle: () => void
}

export function ProjectHeader({
  project,
  client,
  contacts,
  members,
  filter,
  onFilterChange,
  onInfoToggle,
}: ProjectHeaderProps) {
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{client.name}</span>
            {primaryContact && (
              <>
                <span>·</span>
                <span>{primaryContact.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <FilterToggle value={filter} onChange={onFilterChange} />

        <div className="flex -space-x-2 space-x-reverse">
          {members.slice(0, 5).map((m) => {
            const initials = m.profiles.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2) ?? ''

            return (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={m.profiles.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{m.profiles.full_name}</TooltipContent>
              </Tooltip>
            )
          })}
          {members.length > 5 && (
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-[10px]">
                +{members.length - 5}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onInfoToggle}>
              <Info className="h-4 w-4 me-1" />
              מידע
            </Button>
          </TooltipTrigger>
          <TooltipContent>מידע על הפרויקט</TooltipContent>
        </Tooltip>

        {project.google_drive_url ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href={project.google_drive_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FolderOpen className="h-4 w-4 me-1" />
              Drive
              <ExternalLink className="h-3 w-3 ms-1" />
            </a>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                <FolderOpen className="h-4 w-4 me-1" />
                Drive
              </Button>
            </TooltipTrigger>
            <TooltipContent>חסר קישור Drive</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
