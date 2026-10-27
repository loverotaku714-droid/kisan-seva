import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login — Kisan Seva',
  description:
    'Log in or create your free Kisan Seva account to personalise your voice assistant with your district and preferred language.',
}

export default function LoginPage() {
  return <LoginForm />
}
