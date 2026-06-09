'use client'

import { useAuthContext } from '@/contexts/auth-context'
import { ADMIN_ROLES, TRAINER_ROLES, type Role } from '@/constants/roles'

export function useAuth() {
  const { user, setUser, updateUser, logout, isAuthenticated } = useAuthContext()

  const role = user?.role as Role | undefined

  const isAdmin = role ? ADMIN_ROLES.includes(role) : false
  const isTrainer = role ? TRAINER_ROLES.includes(role) : false

  const hasRole = (...roles: Role[]) => !!role && roles.includes(role)

  return {
    user,
    setUser,
    updateUser,
    logout,
    isAuthenticated,
    role,
    isAdmin,
    isTrainer,
    hasRole,
  }
}
