import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  normalizePhone,
} from '@/lib/auth'

const VALID_LANGUAGES = ['en', 'hi', 'kn'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const name = String(body?.name ?? '').trim()
    const password = String(body?.password ?? '')
    const district = String(body?.district ?? 'Bengaluru').trim() || 'Bengaluru'
    const language = (VALID_LANGUAGES as readonly string[]).includes(body?.language)
      ? (body.language as string)
      : 'en'
    const phone = normalizePhone(String(body?.phone ?? ''))

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: 'Please enter your full name (2–60 letters).' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json(
        { error: 'This mobile number is already registered. Please log in.' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: { name, phone, passwordHash: hashPassword(password), district, language },
    })

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, district: user.district, language: user.language },
    })
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions)
    return res
  } catch (e) {
    console.error('Signup error:', e)
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 })
  }
}
