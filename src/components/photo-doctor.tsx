'use client'

import { useRef, useState } from 'react'
import {
  Camera,
  ImagePlus,
  Loader2,
  RotateCcw,
  ScanSearch,
  Stethoscope,
  Volume2,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { speak, stopSpeaking } from '@/lib/speech'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'ready' | 'analyzing' | 'result' | 'error'

interface Diagnosis {
  crop: string
  disease: string
  severity: 'healthy' | 'mild' | 'moderate' | 'severe'
  remedy: string
  confidence: number
}

const SEVERITY_META: Record<Diagnosis['severity'], { label: string; className: string }> = {
  healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800 border-green-300' },
  mild: { label: 'Mild', className: 'bg-lime-100 text-lime-900 border-lime-300' },
  moderate: { label: 'Moderate', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  severe: { label: 'Severe', className: 'bg-red-100 text-red-800 border-red-300' },
}

export function PhotoDoctor() {
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [note, setNote] = useState('')
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cancelSpeakRef = useRef<(() => void) | null>(null)

  const reset = () => {
    stopSpeaking()
    cancelSpeakRef.current = null
    setSpeaking(false)
    setPreview(null)
    setFileName('')
    setNote('')
    setDiagnosis(null)
    setPhase('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast({
        title: 'Unsupported file',
        description: 'Please choose a JPG, PNG or WebP photo of the plant.',
        variant: 'destructive',
      })
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: 'Photo too large',
        description: 'Please use a photo smaller than 4 MB.',
        variant: 'destructive',
      })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(String(reader.result))
      setFileName(file.name)
      setDiagnosis(null)
      setPhase('ready')
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!preview) return
    stopSpeaking()
    cancelSpeakRef.current = null
    setSpeaking(false)
    setDiagnosis(null)
    setPhase('analyzing')

    // strip the data URL prefix → raw base64
    const base64 = preview.split(',')[1] ?? ''

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: preview.slice(5, preview.indexOf(';')) || 'image/jpeg',
          note: note.trim(),
          language: 'en',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Diagnosis failed')

      setDiagnosis(data as Diagnosis)
      setPhase('result')
    } catch (e) {
      setPhase('error')
      toast({
        title: 'Crop Doctor unavailable',
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
        variant: 'destructive',
      })
    }
  }

  const hearRemedy = () => {
    if (!diagnosis) return
    if (speaking) {
      stopSpeaking()
      cancelSpeakRef.current = null
      setSpeaking(false)
      return
    }
    const text = `For your ${diagnosis.crop}: ${diagnosis.disease}. ${diagnosis.remedy}`
    setSpeaking(true)
    cancelSpeakRef.current = speak(text, 'en', () => setSpeaking(false))
  }

  const analyzing = phase === 'analyzing'

  return (
    <Card id="doctor" className="scroll-mt-24 border-2 border-green-900/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          Crop Doctor — Photo Diagnosis
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Show the problem instead of describing it — take a photo of the sick leaf and the AI
          plant doctor identifies the disease and speaks the remedy.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: photo capture */}
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
            aria-label="Choose a plant photo"
          />

          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-green-900/15">
              <img
                src={preview}
                alt={fileName ? `Selected plant photo: ${fileName}` : 'Selected plant photo'}
                className="max-h-72 w-full bg-secondary object-contain"
              />
              <button
                type="button"
                onClick={reset}
                disabled={analyzing}
                aria-label="Remove photo"
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-green-900/20 bg-secondary/50 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold text-foreground">Take or choose a photo</span>
              <span className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                On a phone this opens the camera. On a computer it opens your photo files. A
                close-up of the leaf in daylight works best.
              </span>
            </button>
          )}

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note — e.g. which crop, how long since symptoms started…"
            className="min-h-11 rounded-xl border-green-900/20 bg-white text-sm"
            maxLength={300}
            aria-label="Optional note about the plant"
          />

          <div className="flex gap-2">
            {preview && !analyzing && (
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="min-h-12 gap-2 rounded-xl border-green-900/20 bg-white px-4"
              >
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
                Change photo
              </Button>
            )}
            <Button
              type="button"
              onClick={analyze}
              disabled={!preview || analyzing}
              className="min-h-12 flex-1 gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Examining the leaf…
                </>
              ) : (
                <>
                  <ScanSearch className="h-5 w-5" aria-hidden="true" />
                  Diagnose
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT: diagnosis result */}
        <div aria-live="polite">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Doctor&apos;s Report
          </p>
          <div
            className={cn(
              'flex min-h-64 flex-col rounded-xl border-2 p-4 transition-colors',
              phase === 'result' && diagnosis
                ? 'border-primary/25 bg-gradient-to-br from-secondary to-white'
                : 'border-dashed border-green-900/15 bg-transparent'
            )}
          >
            {analyzing ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  The AI doctor is looking at your photo — checking leaves, spots and colours…
                </p>
                <Progress value={66} className="max-w-48" aria-hidden="true" />
              </div>
            ) : phase === 'result' && diagnosis ? (
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-3 py-1 text-xs font-semibold',
                      SEVERITY_META[diagnosis.severity].className
                    )}
                  >
                    {SEVERITY_META[diagnosis.severity].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Confidence {diagnosis.confidence}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Crop</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{diagnosis.crop}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Diagnosis</p>
                  <p className="text-lg leading-snug font-bold text-primary">{diagnosis.disease}</p>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">Spoken remedy</p>
                  <p className="text-sm leading-relaxed font-medium text-foreground">{diagnosis.remedy}</p>
                </div>
                <div className="border-t border-green-900/10 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={hearRemedy}
                    className="min-h-10 gap-2 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                    aria-label={speaking ? 'Stop remedy playback' : 'Play the remedy aloud'}
                  >
                    {speaking ? (
                      <span className="flex items-end gap-0.5" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="wave-bar w-0.5 rounded-full bg-primary"
                            style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {speaking ? 'Stop' : 'Hear the remedy'}
                  </Button>
                </div>
              </div>
            ) : phase === 'error' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-medium text-destructive">
                  The photo could not be diagnosed.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 rounded-lg"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Try another photo
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <ScanSearch className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                <p className="max-w-xs text-sm text-muted-foreground">
                  The doctor&apos;s report will appear here — the disease found, how serious it is,
                  and a spoken remedy you can play aloud.
                </p>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            AI identification is indicative, not a lab test. Always confirm treatment and dosage
            with your local agriculture officer.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
