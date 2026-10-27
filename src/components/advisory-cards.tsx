'use client'

import { motion } from 'framer-motion'
import { Leaf, CloudSun, IndianRupee, MessageCircleQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssistantStore, scrollToAssistant } from '@/lib/assistant-store'

const cards = [
  {
    key: 'crop_disease',
    icon: Leaf,
    title: 'Crop Disease Advice',
    desc: 'Describe what you see on the plant — yellow leaves, spots, wilting — and get identification hints plus treatment and prevention guidance for common crops.',
    tone: 'border-green-300 bg-green-50',
    chip: 'bg-green-600',
    samples: [
      { text: 'Why are my tomato leaves turning yellow?' },
      { text: 'How do I control leaf rust in my wheat crop?' },
    ],
  },
  {
    key: 'weather',
    icon: CloudSun,
    title: 'Weather Info',
    desc: 'Ask about rain chances, temperature and wind for your district, and get practical advice on irrigation and spraying windows for the day.',
    tone: 'border-amber-300 bg-amber-50',
    chip: 'bg-amber-500',
    samples: [{ text: 'Will it rain in Mandya tomorrow?' }, { text: 'Is it safe to spray pesticide today?' }],
  },
  {
    key: 'price',
    icon: IndianRupee,
    title: 'Market Prices',
    desc: 'Get indicative mandi price ranges and trends for major crops so you can decide the right day to sell your harvest.',
    tone: 'border-yellow-400 bg-yellow-50',
    chip: 'bg-yellow-600',
    samples: [{ text: 'What is today\'s onion price in the market?' }, { text: 'Give me the cotton rate this week' }],
  },
]

export function AdvisoryCards() {
  const askQuestion = useAssistantStore((s) => s.askQuestion)

  const handleAsk = (question: string) => {
    askQuestion(question)
    scrollToAssistant()
  }

  return (
    <section id="advisories" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three Expert Domains
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every question is routed by the AI to one of the three advisory branches from the
            project design. Tap any example to try it instantly.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.article
                key={card.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className={`flex flex-col rounded-2xl border-2 p-6 shadow-sm transition-shadow hover:shadow-md ${card.tone}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm ${card.chip}`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>

                <div className="mt-4 space-y-2">
                  {card.samples.map((s) => (
                    <Button
                      key={s.text}
                      variant="outline"
                      onClick={() => handleAsk(s.text)}
                      className="min-h-11 w-full justify-start gap-2 rounded-xl border-green-900/15 bg-white/80 text-left text-xs font-medium text-foreground hover:border-primary/40 hover:bg-white sm:text-sm"
                    >
                      <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{s.text}</span>
                    </Button>
                  ))}
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
