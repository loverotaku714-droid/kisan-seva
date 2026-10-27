import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get('kisan_session')?.value)
  return NextResponse.json({ user })
}
