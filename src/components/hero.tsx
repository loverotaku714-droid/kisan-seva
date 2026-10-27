'use client'

import { motion } from 'framer-motion'
import { Mic, Leaf, CloudSun, IndianRupee, AudioLines, BrainCircuit, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scrollToAssistant } from '@/lib/assistant-store'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

const stats = [
  { value: '3', label: 'Advisory Domains' },
  { value: '3', label: 'Languages' },
  { value: '24×7', label: 'Availability' },
  { value: '100%', label: 'Hands-free' },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="leaf-pattern absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
              <AudioLines className="h-3.5 w-3.5" aria-hidden="true" />
              NLP · Speech Processing · AI
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Speak your question.
            <br />
            <span className="text-yellow-300">Hear the answer.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Kisan Vani is a voice-based assistant for farmers. Ask anything out loud — about crop
            diseases, weather, or market prices — and get instant advice spoken back in your own
            language. No typing needed, no apps to learn.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Button
              onClick={() => scrollToAssistant()}
              size="lg"
              className="min-h-12 gap-2 rounded-xl bg-yellow-400 px-6 text-base font-bold text-green-950 shadow-lg hover:bg-yellow-300"
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
              Start Speaking
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 rounded-xl border-white/40 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </motion.div>

          <motion.dl variants={fadeUp} className="grid max-w-lg grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-xl font-extrabold text-yellow-300">{s.value}</dd>
                <dd className="mt-0.5 text-[11px] font-medium tracking-wide text-white/80 uppercase">
                  {s.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Pipeline mini-preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative mx-auto w-full max-w-md"
          aria-hidden="true"
        >
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400 text-green-950 shadow-xl">
                <span className="mic-ring absolute inset-0 rounded-full border-2 border-yellow-300" />
                <span className="mic-ring mic-ring-delay-1 absolute inset-0 rounded-full border-2 border-yellow-300" />
                <span className="mic-ring mic-ring-delay-2 absolute inset-0 rounded-full border-2 border-yellow-300" />
                <Mic className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-2.5 text-sm font-medium">
              <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2.5">
                <AudioLines className="h-4.5 w-4.5 shrink-0 text-yellow-300" />
                Speech-to-Text — your words, written down
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2.5">
                <BrainCircuit className="h-4.5 w-4.5 shrink-0 text-yellow-300" />
                AI / NLP — understands what you need
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/15 px-2 py-3 text-center text-xs">
                  <Leaf className="h-4.5 w-4.5 text-lime-300" />
                  Crop Care
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/15 px-2 py-3 text-center text-xs">
                  <CloudSun className="h-4.5 w-4.5 text-yellow-200" />
                  Weather
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/15 px-2 py-3 text-center text-xs">
                  <IndianRupee className="h-4.5 w-4.5 text-amber-300" />
                  Prices
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2.5">
                <Volume2 className="h-4.5 w-4.5 shrink-0 text-yellow-300" />
                Text-to-Speech — advice spoken aloud
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
