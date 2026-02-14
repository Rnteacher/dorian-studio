import type { Task, TaskNow, TaskStatus, Profile, ProjectMember } from './database'

export interface MemberWithProfile extends ProjectMember {
  profiles: Profile
}

export interface NowItemWithTask extends TaskNow {
  tasks: Task
}

export interface DragData {
  type: 'task'
  task: Task
  container: TaskStatus | 'now-list'
}

export type TaskFilter = 'all' | 'mine'
