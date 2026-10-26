import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.query.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('History API error:', e)
    return NextResponse.json({ items: [] })
  }
}
