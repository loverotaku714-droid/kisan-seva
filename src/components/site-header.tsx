'use client'

import { Sprout, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scrollToAssistant } from '@/lib/assistant-store'

export function SiteHeader() {
  const navItems = [
    { label: 'Assistant', href: '#assistant' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Advisories', href: '#advisories' },
    { label: 'Recent', href: '#recent' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-900/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Kisan Vani home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-foreground">Kisan Vani</span>
            <span className="block text-[11px] font-medium text-muted-foreground">
              Voice-Based Farmer Assistant
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
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
    </header>
  )
}
