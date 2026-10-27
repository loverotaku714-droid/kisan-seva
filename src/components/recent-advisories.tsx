'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, CloudSun, IndianRupee, Sprout, History, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAssistantStore } from '@/lib/assistant-store'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  question: string
  answer: string
  category: string
  language: string
  createdAt: string
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Leaf; className: string }> = {
  crop_disease: { label: 'Crop Care', icon: Leaf, className: 'bg-green-100 text-green-800 border-green-300' },
  weather: { label: 'Weather', icon: CloudSun, className: 'bg-amber-100 text-amber-800 border-amber-300' },
  price: { label: 'Price', icon: IndianRupee, className: 'bg-yellow-100 text-yellow-900 border-yellow-400' },
  general: { label: 'General', icon: Sprout, className: 'bg-lime-100 text-lime-900 border-lime-300' },
}

const LANG_LABEL: Record<string, string> = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

export function RecentAdvisories() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const lastAnswerAt = useAssistantStore((s) => s.lastAnswerAt)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/history', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      // silent — history is non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, lastAnswerAt])

  return (
    <section id="recent" className="scroll-mt-20 bg-secondary/60 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Recent Advisories
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Every question asked through Kisan Vani is logged here — building a growing knowledge
              record of what farmers in the field are asking.
            </p>
          </motion.div>
          <Button
            variant="outline"
            onClick={load}
            className="min-h-11 shrink-0 gap-2 rounded-xl border-green-900/20 bg-white text-primary hover:bg-accent"
            aria-label="Refresh advisory history"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/70" aria-hidden="true" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-green-900/15 bg-white/60 px-6 py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-base font-semibold text-foreground">No questions yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Be the first — scroll up to the assistant and ask about your crop, the weather, or
                today&apos;s prices.
              </p>
            </div>
          ) : (
            <div className="nice-scroll grid max-h-[34rem] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
              {items.map((item, i) => {
                const meta = CATEGORY_META[item.category] ?? CATEGORY_META.general
                const Icon = meta.icon
                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.35, delay: Math.min(i, 4) * 0.06 }}
                    className="flex flex-col rounded-2xl border border-green-900/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-0.5 text-xs font-semibold', meta.className)}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {meta.label}
                      </Badge>
                      <Badge variant="outline" className="border-green-900/15 px-2.5 py-0.5 text-xs text-muted-foreground">
                        {LANG_LABEL[item.language] ?? item.language}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-foreground">“{item.question}”</p>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </motion.article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
