'use client'

import { create } from 'zustand'

export interface AuthUser {
  id: string
  name: string
  phone: string
  district: string
  language: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

/** Global auth state so the header reacts instantly after login/signup/logout. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  refresh: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      set({ user: data.user ?? null, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  setUser: (user) => set({ user, loading: false }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ user: null })
    }
  },
}))
