'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sprout, Phone, Lock, Eye, EyeOff, User, MapPin, Languages,
  ArrowLeft, Loader2, Mic, Volume2, LogIn, UserPlus, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore, type AuthUser } from '@/lib/auth-store'
import { KARNATAKA_DISTRICTS, LANGUAGE_LABELS, type Language } from '@/lib/farm-data'

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setUser, refresh } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // login fields
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // signup fields
  const [name, setName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [district, setDistrict] = useState('Bengaluru')
  const [language, setLanguage] = useState<Language>('en')

  // Already signed in? Go home.
  useEffect(() => {
    refresh().then(() => {
      const u = useAuthStore.getState().user
      if (u) router.replace('/')
    })
  }, [refresh, router])

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.')
        return
      }
      finishSuccess(data.user as AuthUser, `Welcome back, ${data.user.name}!`)
    } catch {
      setError('Network problem. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: signupPhone, password: signupPassword, district, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not create your account. Please try again.')
        return
      }
      finishSuccess(data.user as AuthUser, `Welcome to Kisan Seva, ${data.user.name}!`)
    } catch {
      setError('Network problem. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function finishSuccess(u: AuthUser, message: string) {
    setUser(u)
    toast({ title: message, description: 'Your assistant is ready — spoken answers in your language.' })
    router.push('/')
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="leaf-pattern absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative space-y-6 p-10 xl:p-14">
          <a href="/" className="inline-flex items-center gap-2.5" aria-label="Kisan Seva home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-green-950 shadow-sm">
              <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight">Kisan Seva</span>
              <span className="block text-[11px] font-medium text-white/70">
                Voice-Based Farmer Assistant
              </span>
            </span>
          </a>

          <h1 className="pt-6 text-4xl leading-[1.15] font-extrabold tracking-tight">
            Your personal
            <br />
            <span className="text-yellow-300">farm advisor.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/85">
            Create a free account and Kisan Seva remembers your district and language — so every
            answer, weather update and daily bulletin is tuned for your farm.
          </p>

          <ul className="max-w-md space-y-3 pt-2 text-sm font-medium">
            <li className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <MapPin className="h-4.5 w-4.5 shrink-0 text-yellow-300" aria-hidden="true" />
              Weather &amp; bulletin auto-set to your district
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <Languages className="h-4.5 w-4.5 shrink-0 text-yellow-300" aria-hidden="true" />
              Answers spoken in English, Hindi or Kannada
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <Mic className="h-4.5 w-4.5 shrink-0 text-yellow-300" aria-hidden="true" />
              Your questions saved, so advice builds over time
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <Volume2 className="h-4.5 w-4.5 shrink-0 text-yellow-300" aria-hidden="true" />
              One tap for your daily spoken farming bulletin
            </li>
          </ul>
        </div>

        <p className="relative flex items-center gap-2 p-10 text-xs text-white/70 xl:p-14">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Your mobile number stays private and is never shared.
        </p>
      </section>

      {/* Right form panel */}
      <section className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Kisan Seva
          </a>

          {/* Compact brand for mobile (brand panel is hidden) */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-foreground">Kisan Seva</span>
              <span className="block text-[11px] font-medium text-muted-foreground">
                Voice-Based Farmer Assistant
              </span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {mode === 'login' ? 'Welcome back' : 'Create your free account'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {mode === 'login'
              ? 'Log in with your mobile number and password.'
              : 'Takes less than a minute — no documents needed.'}
          </p>

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as 'login' | 'signup')
              setError('')
            }}
            className="mt-6"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="login" className="gap-2 rounded-lg text-sm font-semibold">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-2 rounded-lg text-sm font-semibold">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* -------- LOGIN -------- */}
            <TabsContent value="login">
              <form onSubmit={submitLogin} className="mt-6 space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="login-phone" className="text-sm font-semibold">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="h-12 rounded-xl pl-10 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-12 rounded-xl px-10 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Logging in…
                    </>
                  ) : (
                    'Log In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* -------- SIGN UP -------- */}
            <TabsContent value="signup">
              <form onSubmit={submitSignup} className="mt-6 space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold">
                    Your Name
                  </Label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Ramesh Patil"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl pl-10 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-sm font-semibold">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="signup-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="h-12 rounded-xl pl-10 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="h-12 rounded-xl px-10 text-base"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-district" className="text-sm font-semibold">
                      Your District
                    </Label>
                    <Select value={district} onValueChange={setDistrict}>
                      <SelectTrigger id="signup-district" className="h-12 w-full rounded-xl text-base">
                        <MapPin className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {KARNATAKA_DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d} className="text-base">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-language" className="text-sm font-semibold">
                      Answer Language
                    </Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                      <SelectTrigger id="signup-language" className="h-12 w-full rounded-xl text-base">
                        <Languages className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
                          <SelectItem key={l} value={l} className="text-base">
                            {LANGUAGE_LABELS[l]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
            {user ? 'You are logged in on this device.' : 'No account needed to try it out — '}
            {!user && (
              <a href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
                continue as guest
              </a>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}
