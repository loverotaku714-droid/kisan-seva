'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  Leaf,
  CloudSun,
  IndianRupee,
  Sprout,
  AudioLines,
  BrainCircuit,
  AudioWaveform,
  User,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getSpeechRecognition,
  speak,
  stopSpeaking,
  STT_LOCALES,
  type SpeechRecognitionLike,
} from '@/lib/speech'
import { useAssistantStore } from '@/lib/assistant-store'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'listening' | 'stt' | 'ai' | 'speaking' | 'done' | 'error'

interface AnswerData {
  category: string
  answer: string
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
]

const CATEGORY_META: Record<string, { label: string; icon: typeof Leaf; className: string }> = {
  crop_disease: { label: 'Crop Disease Advice', icon: Leaf, className: 'bg-green-100 text-green-800 border-green-300' },
  weather: { label: 'Weather Info', icon: CloudSun, className: 'bg-amber-100 text-amber-800 border-amber-300' },
  price: { label: 'Market Price', icon: IndianRupee, className: 'bg-yellow-100 text-yellow-900 border-yellow-400' },
  general: { label: 'General', icon: Sprout, className: 'bg-lime-100 text-lime-900 border-lime-300' },
}

const PIPELINE_STEPS = [
  { icon: User, title: 'Farmer', desc: 'Speaks the question' },
  { icon: AudioLines, title: 'Speech-to-Text', desc: 'Voice converted to text' },
  { icon: BrainCircuit, title: 'AI / NLP Processing', desc: 'Understanding the intent' },
  { icon: Leaf, title: 'Advice Category', desc: 'Disease · Weather · Price' },
  { icon: Sparkles, title: 'AI Generated Answer', desc: 'Advice is composed' },
  { icon: Volume2, title: 'Text-to-Speech', desc: 'Answer converted to voice' },
  { icon: AudioWaveform, title: 'Voice Answer', desc: 'Farmer hears the advice' },
]

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  en: [
    'Why are my tomato leaves turning yellow?',
    'Will it rain in Mandya tomorrow?',
    'What is today\'s onion price in the market?',
  ],
  hi: [
    'मेरे टमाटर की पत्तियां पीली क्यों हो रही हैं?',
    'कल मंड्या में बारिश होगी क्या?',
    'आज प्याज का भाव क्या है?',
  ],
  kn: [
    'ನನ್ನ ಟೊಮ್ಯಾಟೊ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ ಏಕೆ?',
    'ನಾಳೆ ಮಂಡ್ಯದಲ್ಲಿ ಮಳೆಯಾಗುತ್ತದಾ?',
    'ಇಂದು ಈರುಳ್ಳಿ ಬೆಲೆ ಎಷ್ಟು?',
  ],
}

const STATUS_TEXT: Record<Status, string> = {
  idle: 'Tap the mic and speak your question',
  listening: 'Listening… speak now',
  stt: 'Converting your speech to text…',
  ai: 'AI is understanding & preparing advice…',
  speaking: 'Speaking the answer aloud…',
  done: 'Done! Ask another question anytime',
  error: 'Something went wrong — please try again',
}

const busy = (s: Status) => s === 'listening' || s === 'stt' || s === 'ai' || s === 'speaking'

export function VoiceAssistant() {
  const { toast } = useToast()
  const [language, setLanguage] = useState('en')
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer] = useState<AnswerData | null>(null)
  const [typed, setTyped] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [sttSupported, setSttSupported] = useState(true)

  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const cancelSpeakRef = useRef<(() => void) | null>(null)
  const finalRef = useRef('')
  const statusRef = useRef<Status>('idle')
  const langRef = useRef('en')

  const pendingQuestion = useAssistantStore((s) => s.pendingQuestion)
  const pendingLanguage = useAssistantStore((s) => s.pendingLanguage)
  const consumePending = useAssistantStore((s) => s.consumePending)
  const markAnswered = useAssistantStore((s) => s.markAnswered)

  useEffect(() => {
    setSttSupported(getSpeechRecognition() !== null)
    return () => {
      recRef.current?.abort()
      stopSpeaking()
    }
  }, [])

  const setStat = (s: Status) => {
    statusRef.current = s
    setStatus(s)
  }

  const processQuestion = useCallback(
    async (q: string, lang?: string) => {
      const useLang = lang ?? langRef.current
      const question = q.trim()
      if (!question || busy(statusRef.current)) return

      stopSpeaking()
      cancelSpeakRef.current = null
      setTranscript(question)
      setAnswer(null)
      setStat('ai')
      langRef.current = useLang
      setLanguage(useLang)

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: question, language: useLang }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Request failed')

        setAnswer({ category: data.category, answer: data.answer })
        markAnswered()

        if (autoSpeak) {
          setStat('speaking')
          cancelSpeakRef.current = speak(data.answer, useLang, () => {
            if (statusRef.current === 'speaking') setStat('done')
          })
        } else {
          setStat('done')
        }
      } catch (e) {
        setStat('error')
        toast({
          title: 'Assistant unavailable',
          description: e instanceof Error ? e.message : 'Please try again in a moment.',
          variant: 'destructive',
        })
      }
    },
    [autoSpeak, markAnswered, toast]
  )

  // Handle questions sent from other sections (sample chips / advisory cards)
  useEffect(() => {
    if (pendingQuestion) {
      const q = pendingQuestion
      const lang = pendingLanguage
      consumePending()
      processQuestion(q, lang)
    }
  }, [pendingQuestion, pendingLanguage, consumePending, processQuestion])

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      toast({
        title: 'Voice input not supported',
        description:
          'Your browser does not support speech recognition. Please use the text box below, or try Chrome / Edge.',
        variant: 'destructive',
      })
      return
    }
    if (busy(statusRef.current) && statusRef.current !== 'listening') return

    stopSpeaking()
    finalRef.current = ''
    setTranscript('')
    setAnswer(null)

    const rec = new Ctor()
    recRef.current = rec
    rec.lang = STT_LOCALES[langRef.current] ?? 'en-IN'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => setStat('listening')

    rec.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      setTranscript(final || interim)
      if (final.trim()) finalRef.current = final.trim()
    }

    rec.onerror = (event) => {
      if (event.error === 'aborted') return
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission was denied. Allow mic access and try again.',
        'service-not-allowed': 'Microphone is blocked by the browser settings.',
        'no-speech': 'No speech was heard. Tap the mic and speak a little louder.',
        network: 'Network problem during recognition. Check your connection.',
        'audio-capture': 'No microphone was found on this device.',
      }
      setStat('error')
      toast({
        title: 'Could not hear you',
        description: messages[event.error] ?? 'Speech recognition failed. Please try again.',
        variant: 'destructive',
      })
    }

    rec.onend = () => {
      recRef.current = null
      const q = finalRef.current.trim()
      if (q && (statusRef.current === 'listening' || statusRef.current === 'stt')) {
        processQuestion(q)
      } else if (!q && statusRef.current === 'listening') {
        setStat('idle')
        toast({
          title: 'Nothing heard',
          description: 'Tap the mic and speak clearly near the phone.',
        })
      }
    }

    setStat('stt')
    try {
      rec.start()
    } catch {
      setStat('idle')
    }
  }, [processQuestion, toast])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    if (statusRef.current === 'listening') setStat('idle')
  }, [])

  const handleMicClick = () => {
    if (statusRef.current === 'listening') stopListening()
    else startListening()
  }

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = typed.trim()
    if (!q) return
    setTyped('')
    processQuestion(q)
  }

  const changeLanguage = (value: string) => {
    if (statusRef.current === 'listening') {
      recRef.current?.abort()
      recRef.current = null
    }
    langRef.current = value
    setLanguage(value)
  }

  const activeStep =
    status === 'listening'
      ? 0
      : status === 'stt'
        ? 1
        : status === 'ai'
          ? 2
          : status === 'speaking'
            ? 5
            : status === 'done'
              ? PIPELINE_STEPS.length
              : -1

  const CategoryIcon = answer ? (CATEGORY_META[answer.category] ?? CATEGORY_META.general).icon : Sprout
  const catMeta = answer ? (CATEGORY_META[answer.category] ?? CATEGORY_META.general) : null

  return (
    <Card id="assistant" className="scroll-mt-24 border-2 border-green-900/10 shadow-lg">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mic className="h-5 w-5" aria-hidden="true" />
              </span>
              Ask Your Question
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Speak or type in your language — the AI understands crop problems, weather and prices,
              then answers by voice.
            </CardDescription>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language-select" className="text-xs font-medium text-muted-foreground">
              My language
            </Label>
            <Select value={language} onValueChange={changeLanguage}>
              <SelectTrigger id="language-select" className="w-40" aria-label="Select language">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        {/* LEFT: mic + transcript + input */}
        <div className="flex flex-col gap-6">
          {/* Mic zone */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-green-900/15 bg-secondary/50 px-4 py-8">
            <div className="relative flex items-center justify-center">
              {status === 'listening' && (
                <>
                  <span className="mic-ring absolute h-28 w-28 rounded-full border-2 border-red-400" aria-hidden="true" />
                  <span className="mic-ring mic-ring-delay-1 absolute h-28 w-28 rounded-full border-2 border-red-400" aria-hidden="true" />
                  <span className="mic-ring mic-ring-delay-2 absolute h-28 w-28 rounded-full border-2 border-red-400" aria-hidden="true" />
                </>
              )}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={busy(status) && status !== 'listening'}
                aria-label={status === 'listening' ? 'Stop listening' : 'Start speaking'}
                aria-pressed={status === 'listening'}
                className={cn(
                  'relative z-10 flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                  status === 'listening'
                    ? 'scale-105 bg-red-500 shadow-red-500/40 hover:bg-red-600'
                    : 'bg-primary shadow-primary/30 hover:scale-105 hover:bg-primary/90',
                  busy(status) && status !== 'listening' && 'cursor-not-allowed opacity-70'
                )}
              >
                {status === 'listening' ? (
                  <MicOff className="h-11 w-11" aria-hidden="true" />
                ) : busy(status) ? (
                  <Loader2 className="h-11 w-11 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="h-11 w-11" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Wave bars */}
            <div className="flex h-6 items-center gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full bg-primary/60',
                    (status === 'listening' || status === 'speaking') && 'wave-bar'
                  )}
                  style={{
                    height: `${10 + (i % 3) * 8}px`,
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>

            <p
              className={cn(
                'text-center text-sm font-medium',
                status === 'listening' && 'text-red-600',
                status === 'error' && 'text-destructive',
                status !== 'listening' && status !== 'error' && 'text-muted-foreground'
              )}
              role="status"
              aria-live="polite"
            >
              {STATUS_TEXT[status]}
            </p>

            {!sttSupported && (
              <p className="max-w-sm text-center text-xs text-amber-700">
                ⚠ Voice input needs Chrome or Edge. You can still type your question below — the
                spoken answer works everywhere.
              </p>
            )}
          </div>

          {/* Transcript */}
          <div aria-live="polite">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              You asked
            </p>
            <div
              className={cn(
                'min-h-16 rounded-xl border px-4 py-3 text-base leading-relaxed',
                transcript
                  ? 'border-green-900/15 bg-white font-medium text-foreground'
                  : 'border-dashed border-green-900/15 bg-transparent text-muted-foreground'
              )}
            >
              {transcript || 'Your question will appear here after speaking or typing…'}
            </div>
          </div>

          {/* Text fallback */}
          <form onSubmit={handleTypedSubmit} className="flex gap-2">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'अपना सवाल यहाँ लिखें…'
                  : language === 'kn'
                    ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ…'
                    : 'Type your question here…'
              }
              className="min-h-12 flex-1 rounded-xl border-green-900/20 bg-white text-base"
              maxLength={500}
              aria-label="Type your question"
            />
            <Button
              type="submit"
              size="lg"
              className="min-h-12 gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              disabled={busy(status) || !typed.trim()}
            >
              {status === 'ai' ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </form>

          {/* Sample questions */}
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {(SAMPLE_QUESTIONS[language] ?? SAMPLE_QUESTIONS.en).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    if (!busy(statusRef.current)) processQuestion(q)
                  }}
                  disabled={busy(status)}
                  className="rounded-full border border-green-900/15 bg-secondary px-3.5 py-2 text-left text-xs font-medium text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-50 sm:text-sm"
                >
                  “{q}”
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: pipeline + answer */}
        <div className="flex flex-col gap-6">
          {/* Pipeline tracker — mirrors the lab-notebook flow */}
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              System Pipeline (live)
            </p>
            <ol className="relative space-y-1" aria-label="Processing pipeline">
              {PIPELINE_STEPS.map((step, i) => {
                const StepIcon = step.icon
                const isDone = status === 'done' || i < activeStep
                const isActive = i === activeStep
                return (
                  <li
                    key={step.title}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300',
                      isActive && 'bg-primary/10 ring-1 ring-primary/30',
                      isDone && !isActive && 'opacity-90'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isDone
                            ? 'border-green-600 bg-green-100 text-green-700'
                            : 'border-green-900/15 bg-white text-muted-foreground'
                      )}
                      aria-hidden="true"
                    >
                      {isDone && !isActive ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Answer card */}
          <div aria-live="polite">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Voice Answer
            </p>
            <div
              className={cn(
                'rounded-xl border-2 p-4 transition-colors',
                answer ? 'border-primary/25 bg-gradient-to-br from-secondary to-white' : 'border-dashed border-green-900/15 bg-transparent'
              )}
            >
              {status === 'ai' && !answer ? (
                <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  AI is processing your question…
                </div>
              ) : answer ? (
                <div className="space-y-3">
                  {catMeta && (
                    <Badge variant="outline" className={cn('gap-1.5 px-3 py-1 text-xs font-semibold', catMeta.className)}>
                      <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {catMeta.label}
                    </Badge>
                  )}
                  <p className="text-base leading-relaxed font-medium text-foreground">{answer.answer}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-green-900/10 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (status === 'speaking') {
                          stopSpeaking()
                          cancelSpeakRef.current = null
                          setStat('done')
                        } else {
                          setStat('speaking')
                          cancelSpeakRef.current = speak(answer.answer, language, () => {
                            if (statusRef.current === 'speaking') setStat('done')
                          })
                        }
                      }}
                      className="min-h-10 gap-2 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                      aria-label={status === 'speaking' ? 'Stop playback' : 'Play answer aloud again'}
                    >
                      {status === 'speaking' ? (
                        <>
                          <span className="flex items-end gap-0.5" aria-hidden="true">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="wave-bar w-0.5 rounded-full bg-primary"
                                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </span>
                          Stop
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Play again
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-speak"
                        checked={autoSpeak}
                        onCheckedChange={setAutoSpeak}
                        aria-label="Speak answers automatically"
                      />
                      <Label htmlFor="auto-speak" className="text-xs text-muted-foreground">
                        Auto-speak
                      </Label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  The AI&apos;s answer will appear here and be spoken aloud through your speaker.
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Weather answers use live Open-Meteo data · Market price values are simulated for
              demonstration. Always confirm with your local agriculture officer before acting.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
