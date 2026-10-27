/**
 * Simulated reference data for the demo prototype.
 * NOTE: Weather & price values are SIMULATED for demonstration purposes only.
 */

export type Language = 'en' | 'hi' | 'kn'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  kn: 'Kannada (ಕನ್ನಡ)',
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'simple English',
  hi: 'simple Hindi written in Devanagari script',
  kn: 'simple Kannada written in Kannada script',
}

/** Deterministic string hash */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

export interface SimWeather {
  district: string
  tempC: number
  humidity: number
  rainChance: number
  windKmph: number
  outlook: 'Light rain likely' | 'Partly cloudy' | 'Mostly sunny' | 'Cloudy with showers'
}

/** Deterministic weather simulation per district per day */
export function simulateWeather(district: string): SimWeather {
  const key = `${district.trim().toLowerCase()}|${new Date().toISOString().slice(0, 10)}`
  const h = hashStr(key)
  const outlooks: SimWeather['outlook'][] = [
    'Light rain likely',
    'Partly cloudy',
    'Mostly sunny',
    'Cloudy with showers',
  ]
  return {
    district: district || 'Bengaluru',
    tempC: 24 + (h % 10),
    humidity: 48 + ((h >> 3) % 40),
    rainChance: (h >> 5) % 100,
    windKmph: 5 + ((h >> 7) % 16),
    outlook: outlooks[(h >> 9) % 4],
  }
}

/** Canonical Karnataka districts (for signup select, bulletin, etc.) */
export const KARNATAKA_DISTRICTS = [
  'Bengaluru', 'Mysuru', 'Mandya', 'Hassan', 'Tumakuru', 'Belagavi', 'Kalaburagi',
  'Davanagere', 'Shivamogga', 'Hubballi', 'Dharwad', 'Ballari', 'Chitradurga',
  'Kolar', 'Chikkaballapur', 'Kodagu', 'Raichur', 'Bidar', 'Vijayapura',
  'Haveri', 'Gadag', 'Koppal', 'Yadgir',
]

/** Try to detect a known Karnataka district mentioned in the question */
const DISTRICTS = [
  'Bengaluru', 'Bangalore', 'Mysuru', 'Mysore', 'Mandya', 'Hassan', 'Tumakuru',
  'Tumkur', 'Belagavi', 'Belgaum', 'Kalaburagi', 'Gulbarga', 'Davanagere',
  'Shivamogga', 'Shimoga', 'Hubballi', 'Hubli', 'Dharwad', 'Ballari', 'Bellary',
  'Chitradurga', 'Kolar', 'Chikkaballapur', 'Coorg', 'Kodagu', 'Raichur',
  'Bidar', 'Bijapur', 'Vijayapura', 'Haveri', 'Gadag', 'Koppal', 'Yadgir',
]

export function detectDistrict(text: string): string {
  const lower = text.toLowerCase()
  for (const d of DISTRICTS) {
    if (lower.includes(d.toLowerCase())) {
      // normalise alternate spellings
      if (d === 'Bangalore') return 'Bengaluru'
      if (d === 'Mysore') return 'Mysuru'
      if (d === 'Tumkur') return 'Tumakuru'
      if (d === 'Belgaum') return 'Belagavi'
      if (d === 'Gulbarga') return 'Kalaburagi'
      if (d === 'Shimoga') return 'Shivamogga'
      if (d === 'Hubli') return 'Hubballi'
      if (d === 'Bellary') return 'Ballari'
      if (d === 'Bijapur') return 'Vijayapura'
      return d
    }
  }
  return 'Bengaluru'
}

/** Simulated mandi price reference (₹ per quintal) */
export const SIMULATED_PRICES: Record<string, { min: number; max: number; trend: 'up' | 'down' | 'stable' }> = {
  tomato: { min: 1200, max: 1800, trend: 'up' },
  onion: { min: 1400, max: 2200, trend: 'stable' },
  potato: { min: 900, max: 1400, trend: 'down' },
  rice: { min: 2000, max: 2500, trend: 'stable' },
  ragi: { min: 1900, max: 2300, trend: 'up' },
  jowar: { min: 1700, max: 2100, trend: 'stable' },
  maize: { min: 1600, max: 1900, trend: 'up' },
  cotton: { min: 5800, max: 6600, trend: 'up' },
  groundnut: { min: 4800, max: 5400, trend: 'stable' },
  tur: { min: 6600, max: 7400, trend: 'stable' },
  'red gram': { min: 6600, max: 7400, trend: 'stable' },
  'green chilli': { min: 3800, max: 4600, trend: 'down' },
  carrot: { min: 1000, max: 1500, trend: 'stable' },
  beans: { min: 2200, max: 2800, trend: 'up' },
  banana: { min: 1200, max: 1700, trend: 'stable' },
  coconut: { min: 1500, max: 2000, trend: 'up' },
  arecanut: { min: 28000, max: 33000, trend: 'up' },
}
