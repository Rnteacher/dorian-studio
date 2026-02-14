'use client'

import { UserContext } from '@/lib/hooks/use-user'
import type { Profile } from '@/types/database'

interface UserProviderProps {
  profile: Profile
  children: React.ReactNode
}

export function UserProvider({ profile, children }: UserProviderProps) {
  const isAdmin = profile.role === 'admin' || profile.role === 'staff'

  return (
    <UserContext.Provider value={{ user: profile, isAdmin }}>
      {children}
    </UserContext.Provider>
  )
}
