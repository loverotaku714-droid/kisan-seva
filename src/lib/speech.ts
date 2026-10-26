'use client'

/**
 * Web Speech API helpers — Speech-to-Text (STT) & Text-to-Speech (TTS)
 * Types for browsers (Chrome/Edge expose webkitSpeechRecognition).
 */

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionResultListLike {
  length: number
  [index: number]: SpeechRecognitionResultLike
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  const ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | SpeechRecognitionCtor
    | undefined
  return ctor ?? null
}

export const STT_LOCALES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
}

/** Speak text aloud; returns a cancel function. onEnd fires when finished. */
export function speak(text: string, lang: string, onEnd?: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return () => {}
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const locale = STT_LOCALES[lang] ?? 'en-IN'
  utterance.lang = locale
  utterance.rate = 0.95
  utterance.pitch = 1

  // pick the best matching voice for the locale
  const voices = window.speechSynthesis.getVoices()
  const exact = voices.find((v) => v.lang === locale)
  const partial = voices.find((v) => v.lang.startsWith(lang))
  const voice = exact ?? partial
  if (voice) utterance.voice = voice

  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utterance)

  return () => {
    window.speechSynthesis.cancel()
    onEnd?.()
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
