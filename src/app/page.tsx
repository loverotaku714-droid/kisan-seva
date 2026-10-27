import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { VoiceAssistant } from '@/components/voice-assistant'
import { PhotoDoctor } from '@/components/photo-doctor'
import { VoiceBulletin } from '@/components/voice-bulletin'
import { HowItWorks } from '@/components/how-it-works'
import { AdvisoryCards } from '@/components/advisory-cards'
import { RecentAdvisories } from '@/components/recent-advisories'
import { SiteFooter } from '@/components/site-footer'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />

        {/* Interactive assistant section */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Your Voice Assistant
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                The full pipeline from the project notebook, live in your browser — speech in,
                spoken advice out.
              </p>
            </div>
            <VoiceAssistant />
          </div>
        </section>

        {/* Beyond voice: photo diagnosis + daily bulletin */}
        <section className="bg-secondary/40 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Beyond Voice — Show &amp; Listen
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Snap a photo of a sick leaf for an instant AI diagnosis, and tune in to a daily
                spoken bulletin with live weather and market prices.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <PhotoDoctor />
              <VoiceBulletin />
            </div>
          </div>
        </section>

        <HowItWorks />
        <AdvisoryCards />
        <RecentAdvisories />
      </main>
      <SiteFooter />
    </div>
  )
}
