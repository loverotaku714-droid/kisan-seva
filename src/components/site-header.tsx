'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, Mic, LogOut, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scrollToAssistant } from '@/lib/assistant-store'
import { useAuthStore } from '@/lib/auth-store'

export function SiteHeader() {
  const router = useRouter()
  const { user, loading, refresh, logout } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  const navItems = [
    { label: 'Assistant', href: '#assistant' },
    { label: 'Crop Doctor', href: '#doctor' },
    { label: 'Bulletin', href: '#bulletin' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Recent', href: '#recent' },
  ]

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-900/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Kisan Seva home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-foreground">Kisan Seva</span>
            <span className="block text-[11px] font-medium text-muted-foreground">
              Voice-Based Farmer Assistant
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : user ? (
            <>
              <span
                className="flex h-10 items-center gap-2 rounded-xl border border-green-900/15 bg-accent/60 px-3 text-sm"
                title={`Logged in as ${user.name} · ${user.district}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate font-semibold text-foreground sm:inline">
                  {user.name}
                </span>
              </span>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="outline"
                className="min-h-11 gap-2 rounded-xl px-3 text-sm font-semibold shadow-sm"
                aria-label={`Log out of Kisan Seva`}
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden md:inline">Log Out</span>
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="min-h-11 gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm"
              aria-label="Log in to Kisan Seva"
            >
              <a href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Login</span>
                <span className="sm:hidden">Login</span>
              </a>
            </Button>
          )}

          <Button
            onClick={() => scrollToAssistant()}
            className="min-h-11 gap-2 rounded-xl bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90"
            aria-label="Jump to voice assistant"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ask by Voice</span>
            <span className="sm:hidden">Ask</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
