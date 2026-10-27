'use client'

import { useEffect, useRef, useState } from 'react'
import { CloudSun, Loader2, Play, Radio, Square, Thermometer, Droplets, Wind, IndianRupee, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { speak, stopSpeaking } from '@/lib/speech'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'loading' | 'playing' | 'done'

interface BulletinData {
  district: string
  text: string
  tip: string
  weather: {
    tempC: number
    humidity: number
    windKmph: number
    rainChance: number
    rainChanceTomorrow: number
    outlook: string
    source: 'open-meteo' | 'simulated'
  }
  prices: Array<{ crop: string; min: number; max: number; trend: string }>
}

export function VoiceBulletin() {
  const { toast } = useToast()
  const [district, setDistrict] = useState('Mandya')
  const [phase, setPhase] = useState<Phase>('idle')
  const [bulletin, setBulletin] = useState<BulletinData | null>(null)

  const cancelSpeakRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      cancelSpeakRef.current?.()
    }
  }, [])

  const play = async () => {
    if (phase === 'loading') return
    if (phase === 'playing') {
      cancelSpeakRef.current?.()
      cancelSpeakRef.current = null
      setPhase('done')
      return
    }

    setPhase('loading')
    try {
      const res = await fetch(`/api/bulletin?district=${encodeURIComponent(district.trim() || 'Mandya')}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not load the bulletin')

      setBulletin(data as BulletinData)
      setPhase('playing')
      cancelSpeakRef.current = speak(data.text, 'en', () => {
        setPhase((prev) => (prev === 'playing' ? 'done' : prev))
      })
    } catch (e) {
      setPhase('idle')
      toast({
        title: 'Bulletin unavailable',
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
        variant: 'destructive',
      })
    }
  }

  const playing = phase === 'playing'

  return (
    <Card id="bulletin" className="scroll-mt-24 border-2 border-green-900/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/25 text-yellow-700">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </span>
          Daily Voice Bulletin
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Your personal farm radio — one tap plays today&apos;s weather, top mandi prices and a
          practical farming tip, spoken aloud like a morning broadcast.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Radio console */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-green-900/15 bg-gradient-to-b from-secondary/70 to-secondary/30 px-4 py-7">
          <div className="flex w-full max-w-sm items-center gap-2">
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Your district (e.g. Mandya)"
              className="min-h-11 flex-1 rounded-xl border-green-900/20 bg-white text-sm"
              maxLength={60}
              aria-label="District for the bulletin"
            />
            <Button
              type="button"
              onClick={play}
              disabled={phase === 'loading'}
              className={cn(
                'min-h-11 gap-2 rounded-xl px-4 font-semibold shadow-lg transition-colors',
                playing
                  ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-600'
                  : 'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90'
              )}
              aria-label={playing ? 'Stop the bulletin' : 'Play the daily bulletin'}
            >
              {phase === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : playing ? (
                <Square className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5" aria-hidden="true" />
              )}
              {playing ? 'Stop' : 'Play'}
            </Button>
          </div>

          {/* Equalizer */}
          <div className="flex h-10 items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <span
                key={i}
                className={cn(
                  'w-1.5 rounded-full bg-primary/50',
                  phase === 'loading' && 'opacity-40',
                  playing && 'wave-bar'
                )}
                style={{
                  height: `${10 + (i % 4) * 7}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.9s',
                }}
              />
            ))}
          </div>

          <p className="text-center text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
            {phase === 'loading'
              ? 'Tuning in — preparing your bulletin…'
              : playing
                ? 'On air — listen to your bulletin…'
                : phase === 'done'
                  ? 'Broadcast finished — tap Play to hear it again'
                  : 'Tap Play and listen like a radio broadcast'}
          </p>
        </div>

        {/* Live data chips */}
        {bulletin && (
          <div aria-live="polite" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold',
                  bulletin.weather.source === 'simulated'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-green-100 text-green-800 border-green-300'
                )}
              >
                {bulletin.weather.source === 'simulated' ? 'Estimated weather' : 'LIVE weather'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {bulletin.district} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: Thermometer, label: `${bulletin.weather.tempC}°C now`, sub: `Rain ${bulletin.weather.rainChance}%` },
                { icon: CloudSun, label: bulletin.weather.outlook, sub: `Tomorrow rain ${bulletin.weather.rainChanceTomorrow}%` },
                { icon: Droplets, label: `${bulletin.weather.humidity}% humidity`, sub: `Wind ${bulletin.weather.windKmph} km/h` },
              ].map((chip, i) => {
                const Icon = chip.icon
                return (
                  <div key={i} className="rounded-xl border border-green-900/10 bg-white px-3 py-2.5">
                    <Icon className="mb-1 h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="truncate text-xs font-semibold text-foreground">{chip.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{chip.sub}</p>
                  </div>
                )
              })}
              <div className="rounded-xl border border-yellow-400/40 bg-yellow-50 px-3 py-2.5">
                <IndianRupee className="mb-1 h-4 w-4 text-yellow-700" aria-hidden="true" />
                <p className="truncate text-xs font-semibold text-foreground">
                  {bulletin.prices[0] ? `${bulletin.prices[0].crop} ₹${bulletin.prices[0].min}–₹${bulletin.prices[0].max}` : 'Prices in bulletin'}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">per quintal · mandi</p>
              </div>
            </div>

            <div className="rounded-xl border border-green-900/10 bg-white p-4">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Bulletin transcript
              </p>
              <p className="text-sm leading-relaxed font-medium text-foreground">{bulletin.text}</p>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-lime-50 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-lime-700" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-lime-900">
                  <span className="font-semibold">Today&apos;s tip:</span> {bulletin.tip}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Weather from Open-Meteo live forecasts when available (automatic fallback if offline) ·
          Market prices are demo values · Always confirm with your local agriculture officer.
        </p>
      </CardContent>
    </Card>
  )
}
