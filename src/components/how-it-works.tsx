'use client'

import { motion } from 'framer-motion'
import {
  User,
  AudioLines,
  BrainCircuit,
  Leaf,
  CloudSun,
  IndianRupee,
  Sparkles,
  Volume2,
  AudioWaveform,
  ArrowDown,
} from 'lucide-react'

const steps = [
  {
    icon: User,
    title: '1. Farmer',
    desc: 'The farmer speaks a question naturally — no typing, no menus.',
    tone: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    icon: AudioLines,
    title: '2. Speech-to-Text (STT)',
    desc: 'The microphone audio is transcribed into written text in real time.',
    tone: 'bg-lime-100 text-lime-900 border-lime-300',
  },
  {
    icon: BrainCircuit,
    title: '3. AI / NLP Processing',
    desc: 'The intent of the question is detected and routed to the right expert domain.',
    tone: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    icon: Leaf,
    title: '4. Advice Branches',
    desc: 'Crop Disease Advice · Weather · Market Price — three specialist domains.',
    tone: 'bg-teal-100 text-teal-900 border-teal-300',
    branches: [
      { icon: Leaf, label: 'Crop Disease Advice' },
      { icon: CloudSun, label: 'Weather' },
      { icon: IndianRupee, label: 'Price' },
    ],
  },
  {
    icon: Sparkles,
    title: '5. AI Generated Answer',
    desc: 'A short, farmer-friendly advisory is composed in the chosen language.',
    tone: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    icon: Volume2,
    title: '6. Text-to-Speech (TTS)',
    desc: 'The written answer is converted into natural spoken audio.',
    tone: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    icon: AudioWaveform,
    title: '7. Voice Answer',
    desc: 'The farmer hears the advice aloud — the loop is complete.',
    tone: 'bg-yellow-100 text-yellow-900 border-yellow-400',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-secondary/60 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Seven simple steps take a farmer from a spoken question to a spoken answer — exactly the
            pipeline sketched in the project notebook.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.1 }}
                className="flex flex-col rounded-2xl border border-green-900/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${step.tone}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>

                {step.branches && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {step.branches.map((b) => {
                      const BIcon = b.icon
                      return (
                        <div
                          key={b.label}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-green-900/20 bg-secondary/70 px-2 py-2.5 text-center"
                        >
                          <BIcon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                          <span className="text-[11px] leading-tight font-semibold text-foreground">
                            {b.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* connector arrow (desktop: implied flow; mobile: vertical) */}
                {i < steps.length - 1 && (
                  <div
                    className="mt-3 flex items-center gap-1.5 text-muted-foreground/60 lg:hidden"
                    aria-hidden="true"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            )
          })}

          {/* CTA tile filling the grid */}
          <motion.a
            href="#assistant"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center transition-colors hover:bg-primary/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
              <AudioWaveform className="h-6 w-6" />
            </span>
            <span className="text-base font-bold text-primary">Try the live pipeline</span>
            <span className="text-sm text-muted-foreground">
              Scroll to the assistant and ask your first question.
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  )
}
