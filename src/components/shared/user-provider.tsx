'use client'

import { UserContext } from '@/lib/hooks/use-user'
import type { Profile } from '@/types/database'

interface UserProviderProps {
  profile: Profile
  children: React.ReactNode
}

export function UserProvider({ profile, children }: UserProviderProps) {
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'staff'
  const isSuperAdmin = profile.role === 'super_admin'

  return (
    <UserContext.Provider value={{ user: profile, isAdmin, isSuperAdmin }}>
      {children}
    </UserContext.Provider>
  )
}
