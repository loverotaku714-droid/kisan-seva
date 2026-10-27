/**
 * Lightweight auth for Kisan Seva — no external dependencies.
 * - Passwords: scrypt with random salt (stored as "salt:hash" hex)
 * - Sessions: HMAC-SHA256-signed JSON token in an httpOnly cookie (30 days)
 */
import crypto from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'kisan_session'
const SESSION_DAYS = 30
const SECRET = process.env.AUTH_SECRET || 'kisan-seva-local-dev-secret'

export interface SessionUser {
  id: string
  name: string
  phone: string
  district: string
  language: string
}

/* ---------------- passwords ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

/* ---------------- session token ---------------- */

function sign(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_DAYS * 86400_000 })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined | null): string | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      uid?: string
      exp?: number
    }
    if (!data.uid || !data.exp || Date.now() > data.exp) return null
    return data.uid
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 86400,
}

/* ---------------- current user ---------------- */

/** Resolve the logged-in farmer from a request's session cookie (or null). */
export async function getSessionUser(token: string | undefined | null): Promise<SessionUser | null> {
  const uid = readSessionToken(token)
  if (!uid) return null
  try {
    const user = await db.user.findUnique({ where: { id: uid } })
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      district: user.district,
      language: user.language,
    }
  } catch {
    return null
  }
}

/* ---------------- validation helpers ---------------- */

/** Normalise an Indian mobile number to 10 digits, or return null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}
