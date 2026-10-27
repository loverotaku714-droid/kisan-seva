import { NextRequest, NextResponse } from 'next/server'
import { SIMULATED_PRICES, detectDistrict } from '@/lib/farm-data'
import { getWeather } from '@/lib/weather'

export const maxDuration = 30

/** One practical, timeless farming tip per day (rotates by day-of-year). */
const TIPS = [
  'Check the underside of leaves early in the morning — pests hide there before the sun gets hot.',
  'Water your plants at the roots early morning or evening, not in the hot afternoon.',
  'Rotate your crops each season to keep the soil healthy and reduce pests naturally.',
  'Add compost or well-rotted farmyard manure before sowing to feed the soil, not just the plant.',
  'Remove and burn badly diseased plants so the problem does not spread to healthy ones.',
  'Keep a small notebook of what you sow, spray and harvest — it helps you plan better each season.',
  'Store seeds in a cool, dry place in airtight containers to protect them from fungus and insects.',
  'Spray pesticides in the evening to protect honeybees, and always wear a cloth over your nose and mouth.',
]

function pickTip(district: string): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const idx = (dayOfYear + district.length) % TIPS.length
  return TIPS[idx]
}

function topPrices(n = 3) {
  return Object.entries(SIMULATED_PRICES)
    .filter(([crop]) => ['tomato', 'onion', 'cotton'].includes(crop))
    .map(([crop, v]) => ({ crop, min: v.min, max: v.max, trend: v.trend }))
    .slice(0, n)
}

export async function GET(req: NextRequest) {
  try {
    const districtParam = req.nextUrl.searchParams.get('district')?.trim() || ''
    const district = detectDistrict(districtParam || 'Mandya')

    const weather = await getWeather(district)

    const greetingTime = new Date().getHours()
    const greeting = greetingTime < 12 ? 'Good morning' : greetingTime < 17 ? 'Good afternoon' : 'Good evening'

    const prices = topPrices()
    const priceText = prices
      .map((p) => `${p.crop} around ₹${p.min} to ₹${p.max} per quintal`)
      .join(', ')
    const tip = pickTip(district)

    const text =
      `${greeting}! Here is your Kisan Seva bulletin for ${weather.district}. ` +
      `Right now it is ${weather.outlook.toLowerCase()} with a temperature of about ${weather.tempC} degrees. ` +
      `Humidity is ${weather.humidity} percent, and the chance of rain today is ${weather.rainChance} percent` +
      (weather.rainChanceTomorrow >= 40
        ? `, rising to ${weather.rainChanceTomorrow} percent tomorrow, so plan your spraying and irrigation accordingly. `
        : `, and around ${weather.rainChanceTomorrow} percent tomorrow. `) +
      `In the market, ${priceText}. ` +
      `Today's tip: ${tip} ` +
      `Wishing you a good farming day ahead!`

    return NextResponse.json({
      district: weather.district,
      text,
      tip,
      weather,
      prices,
      generatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Bulletin API error:', e)
    return NextResponse.json(
      { error: 'Could not prepare the bulletin right now. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
