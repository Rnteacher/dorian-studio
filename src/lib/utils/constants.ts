import type { TaskStatus, ProjectRole, UserRole } from '@/types/database'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'לביצוע',
  doing: 'בעבודה',
  done: 'הושלם',
  frozen: 'מוקפא',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  doing: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  frozen: 'bg-amber-100 text-amber-700',
}

export const ROLE_LABELS: Record<UserRole | ProjectRole, string> = {
  admin: 'מנהל מערכת',
  staff: 'צוות מערכת',
  lead: 'מוביל פרויקט',
  member: 'חבר צוות',
  viewer: 'צופה',
}

export const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'doing', 'done', 'frozen']

export const NAV_LABELS = {
  myProjects: 'הפרויקטים שלי',
  liveBoard: 'לוח חי',
  clients: 'לקוחות',
  taskBoard: 'לוח משימות',
  calendar: 'לוח שנה',
  team: 'צוות',
  now: 'עכשיו',
  login: 'התחברות',
  logout: 'התנתקות',
  newClient: 'לקוח חדש',
  newProject: 'פרויקט חדש',
  newTask: 'משימה חדשה',
  newContact: 'איש קשר חדש',
  newEvent: 'אירוע חדש',
  allTasks: 'כולם',
  myTasks: 'שלי',
  archive: 'ארכיון',
  save: 'שמור',
  cancel: 'ביטול',
  delete: 'מחק',
  edit: 'עריכה',
  close: 'סגור',
  openDrive: 'פתח תיקיית Drive',
  missingDrive: 'חסר קישור Drive',
} as const
