'use client'

import { PersonCard } from './person-card'
import type { Task, Profile } from '@/types/database'

interface PersonData {
  profile: Profile
  nowTasks: { task: Task; projectName: string }[]
}

interface LiveBoardViewProps {
  people: PersonData[]
}

export function LiveBoardView({ people }: LiveBoardViewProps) {
  if (people.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">אין אף אחד שעובד כרגע</p>
        <p className="text-sm mt-1">
          כשחברי צוות יוסיפו משימות לרשימת &quot;עכשיו&quot;, הם יופיעו כאן
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {people.map((person) => (
        <PersonCard
          key={person.profile.id}
          profile={person.profile}
          nowTasks={person.nowTasks}
        />
      ))}
    </div>
  )
}
