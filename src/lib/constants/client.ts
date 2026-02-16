export const CLIENT_STATUS_OPTIONS = [
  { value: 'initial_contact', label: 'פנייה ראשונית' },
  { value: 'in_evaluation', label: 'בתהליך התאמה' },
  { value: 'active_project', label: 'פרויקט פעיל' },
  { value: 'completed', label: 'הושלם' },
  { value: 'not_suitable', label: 'לא התאים' },
] as const

export const INTERACTION_TYPE_OPTIONS = [
  { value: 'meeting', label: 'פגישה' },
  { value: 'call', label: 'שיחה' },
  { value: 'email', label: 'מייל' },
  { value: 'note', label: 'הערה' },
  { value: 'other', label: 'אחר' },
] as const

export const FUTURE_POTENTIAL_OPTIONS = [
  { value: 'one_time', label: 'חד פעמי' },
  { value: 'long_term', label: 'שותפות ארוכת טווח' },
  { value: 'unknown', label: 'לא ידוע' },
] as const

export const CLIENT_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  CLIENT_STATUS_OPTIONS.map((o) => [o.value, o.label])
)

export const INTERACTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  INTERACTION_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

export const FUTURE_POTENTIAL_LABEL: Record<string, string> = Object.fromEntries(
  FUTURE_POTENTIAL_OPTIONS.map((o) => [o.value, o.label])
)

export const CLIENT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  initial_contact: 'outline',
  in_evaluation: 'secondary',
  active_project: 'default',
  completed: 'secondary',
  not_suitable: 'destructive',
}
