'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutList, CalendarDays } from 'lucide-react'

interface ProjectTabsProps {
  projectId: string
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname()
  const basePath = `/projects/${projectId}`
  const isCalendar = pathname.endsWith('/calendar')

  const tabs = [
    {
      label: 'לוח משימות',
      href: basePath,
      icon: LayoutList,
      active: !isCalendar,
    },
    {
      label: 'לוח שנה',
      href: `${basePath}/calendar`,
      icon: CalendarDays,
      active: isCalendar,
    },
  ]

  return (
    <div className="flex gap-1 border-b mb-4">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab.active
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
