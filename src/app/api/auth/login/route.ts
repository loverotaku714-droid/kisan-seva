import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  normalizePhone,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = String(body?.password ?? '')
    const phone = normalizePhone(String(body?.phone ?? ''))

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Please enter your mobile number and password.' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { phone } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Mobile number or password is incorrect.' }, { status: 401 })
    }

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, district: user.district, language: user.language },
    })
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions)
    return res
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Could not log you in. Please try again.' }, { status: 500 })
  }
}
