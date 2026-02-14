'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types/database'

interface UserContextType {
  user: Profile
  isAdmin: boolean
}

export const UserContext = createContext<UserContextType | null>(null)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
