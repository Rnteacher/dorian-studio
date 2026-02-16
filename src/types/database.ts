export type UserRole = 'super_admin' | 'admin' | 'staff'
export type ProjectRole = 'lead' | 'member' | 'viewer'
export type TaskStatus = 'todo' | 'doing' | 'done' | 'frozen'
export type ClientStatus = 'initial_contact' | 'in_evaluation' | 'active_project' | 'completed' | 'not_suitable'
export type InteractionType = 'meeting' | 'call' | 'email' | 'note' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  notes: string
  brief: string
  status: ClientStatus
  budget_range: string
  payment_terms: string
  is_paid: boolean
  interest_areas: string
  referral_source: string
  future_potential: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientContact {
  id: string
  client_id: string
  name: string
  email: string
  phone: string
  role_title: string
  is_primary: boolean
  notes: string
  created_at: string
}

export interface ClientInteraction {
  id: string
  client_id: string
  interaction_date: string
  interaction_type: InteractionType
  summary: string
  created_by: string | null
  created_at: string
}

export interface ClientFeedback {
  id: string
  client_id: string
  project_id: string | null
  content: string
  rating: number | null
  created_by: string | null
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string
  status: string
  google_drive_url: string
  start_date: string | null
  due_date: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ProjectPhase {
  id: string
  project_id: string
  start_date: string
  end_date: string
  order_index: number
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  phase_id: string | null
  created_at: string
}

export interface ProjectNote {
  id: string
  project_id: string
  user_id: string
  content: string
  is_private: boolean
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  order_index: number
  assignee_id: string | null
  due_date: string | null
  is_archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskNow {
  id: string
  user_id: string
  task_id: string
  order_index: number
  added_at: string
}

export interface ProjectEvent {
  id: string
  project_id: string
  title: string
  description: string
  event_date: string
  event_time: string | null
  location: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  is_active: boolean
  priority: number
  starts_at: string
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  project_id: string | null
  entity_type: string
  entity_id: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
        Relationships: []
      }
      clients: {
        Row: Client
        Insert: Partial<Client> & { name: string }
        Update: Partial<Client>
        Relationships: []
      }
      client_contacts: {
        Row: ClientContact
        Insert: Partial<ClientContact> & { client_id: string; name: string }
        Update: Partial<ClientContact>
        Relationships: [
          {
            foreignKeyName: 'client_contacts_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      client_interactions: {
        Row: ClientInteraction
        Insert: Partial<ClientInteraction> & { client_id: string }
        Update: Partial<ClientInteraction>
        Relationships: [
          {
            foreignKeyName: 'client_interactions_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_interactions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      client_feedback: {
        Row: ClientFeedback
        Insert: Partial<ClientFeedback> & { client_id: string }
        Update: Partial<ClientFeedback>
        Relationships: [
          {
            foreignKeyName: 'client_feedback_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_feedback_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_feedback_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      projects: {
        Row: Project
        Insert: Partial<Project> & { client_id: string; name: string }
        Update: Partial<Project>
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      project_phases: {
        Row: ProjectPhase
        Insert: Partial<ProjectPhase> & { project_id: string; start_date: string; end_date: string }
        Update: Partial<ProjectPhase>
        Relationships: [
          {
            foreignKeyName: 'project_phases_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      project_members: {
        Row: ProjectMember
        Insert: Partial<ProjectMember> & { project_id: string; user_id: string }
        Update: Partial<ProjectMember>
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'project_phases'
            referencedColumns: ['id']
          }
        ]
      }
      project_notes: {
        Row: ProjectNote
        Insert: Partial<ProjectNote> & { project_id: string; user_id: string; content: string }
        Update: Partial<ProjectNote>
        Relationships: [
          {
            foreignKeyName: 'project_notes_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_notes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      tasks: {
        Row: Task
        Insert: Partial<Task> & { project_id: string; title: string }
        Update: Partial<Task>
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      task_now: {
        Row: TaskNow
        Insert: Partial<TaskNow> & { user_id: string; task_id: string }
        Update: Partial<TaskNow>
        Relationships: [
          {
            foreignKeyName: 'task_now_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_now_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
      }
      project_events: {
        Row: ProjectEvent
        Insert: Partial<ProjectEvent> & { project_id: string; title: string; event_date: string }
        Update: Partial<ProjectEvent>
        Relationships: [
          {
            foreignKeyName: 'project_events_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      announcements: {
        Row: Announcement
        Insert: Partial<Announcement> & { title: string }
        Update: Partial<Announcement>
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      activity_log: {
        Row: ActivityLog
        Insert: Partial<ActivityLog> & { entity_type: string; entity_id: string; action: string }
        Update: Partial<ActivityLog>
        Relationships: [
          {
            foreignKeyName: 'activity_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_log_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      project_role: ProjectRole
      task_status: TaskStatus
      client_status: ClientStatus
      interaction_type: InteractionType
    }
    CompositeTypes: Record<string, never>
  }
}
