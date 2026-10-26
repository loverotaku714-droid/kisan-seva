'use client'

import { create } from 'zustand'

/**
 * Shared store so sample-question buttons anywhere on the page
 * can send a question into the Voice Assistant widget.
 */
interface AssistantState {
  /** Question waiting to be processed by the assistant */
  pendingQuestion: string | null
  pendingLanguage: string
  /** Timestamp bumped whenever a new answer arrives — used to refresh history */
  lastAnswerAt: number
  askQuestion: (question: string, language?: string) => void
  consumePending: () => void
  markAnswered: () => void
}

export const useAssistantStore = create<AssistantState>((set) => ({
  pendingQuestion: null,
  pendingLanguage: 'en',
  lastAnswerAt: 0,
  askQuestion: (question, language = 'en') =>
    set({ pendingQuestion: question, pendingLanguage: language }),
  consumePending: () => set({ pendingQuestion: null }),
  markAnswered: () => set({ lastAnswerAt: Date.now() }),
}))

export function scrollToAssistant() {
  document.getElementById('assistant')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
