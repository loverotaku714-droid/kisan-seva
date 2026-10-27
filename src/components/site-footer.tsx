import { Sprout, BrainCircuit, AudioLines, Mic } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-green-950 text-green-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-green-950">
                <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <p className="text-base font-bold">Kisan Seva</p>
                <p className="text-xs text-green-200/80">Voice-Based Farmer Assistant</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-green-100/70">
              A speech-first assistant that lets any farmer ask questions out loud and hear expert
              advice back — bridging the literacy and typing gap with the power of voice.
            </p>
          </div>

          <nav aria-label="Footer sections">
            <p className="text-sm font-bold tracking-wide text-yellow-300 uppercase">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-green-100/80">
              <li><a className="transition-colors hover:text-yellow-300" href="#assistant">Voice Assistant</a></li>
              <li><a className="transition-colors hover:text-yellow-300" href="#how-it-works">How It Works</a></li>
              <li><a className="transition-colors hover:text-yellow-300" href="#advisories">Advisory Domains</a></li>
              <li><a className="transition-colors hover:text-yellow-300" href="#recent">Recent Advisories</a></li>
            </ul>
          </nav>

          <div>
            <p className="text-sm font-bold tracking-wide text-yellow-300 uppercase">
              Built With
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-green-100/80">
              <li className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden="true" />
                NLP — intent detection &amp; answers
              </li>
              <li className="flex items-center gap-2">
                <AudioLines className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden="true" />
                Speech Processing — STT &amp; TTS
              </li>
              <li className="flex items-center gap-2">
                <Mic className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden="true" />
                AI — advisory generation
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-green-800/60 pt-6">
          <p className="text-xs leading-relaxed text-green-200/60">
            Demo prototype · Weather and market-price values are simulated for demonstration only ·
            Always consult your local agriculture officer before acting on advice · Inspired by the
            project notebook — AIMS &amp; RC, Bengaluru
          </p>
          <p className="mt-2 text-xs text-green-200/60">
            © {new Date().getFullYear()} Kisan Seva · Voice-Based Farmer Assistant
          </p>
        </div>
      </div>
    </footer>
  )
}
