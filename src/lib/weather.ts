/**
 * Real live weather with a 3-source fallback chain:
 *   1. Open-Meteo forecast API (free, no key)
 *   2. wttr.in JSON API (free, no key) — used when Open-Meteo quota is exhausted
 *   3. Deterministic simulator (farm-data.ts) — offline safety net
 * Includes a 30-minute in-memory cache, so the assistant NEVER fails just
 * because one weather provider is unreachable.
 */

import { simulateWeather, type SimWeather } from '@/lib/farm-data'

export interface LiveWeather extends SimWeather {
  state?: string
  tempMaxC: number
  tempMinC: number
  rainChanceTomorrow: number
  source: 'open-meteo' | 'wttr.in' | 'simulated'
  fetchedAt: string
}

interface CacheEntry {
  data: LiveWeather
  expiresAt: number
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const cache = new Map<string, CacheEntry>()

/** Collapse any weather description into the 4 canonical outlook values */
function canonicalOutlook(desc: string, rainChance: number): SimWeather['outlook'] {
  const d = desc.toLowerCase()
  if (d.includes('thunder') || d.includes('drizzle') || d.includes('rain') || d.includes('shower') || d.includes('snow') || d.includes('sleet') || d.includes('hail')) {
    return 'Light rain likely'
  }
  if (d.includes('cloud') || d.includes('overcast') || d.includes('haze') || d.includes('fog') || d.includes('mist') || d.includes('smoke')) {
    return rainChance >= 45 ? 'Cloudy with showers' : 'Partly cloudy'
  }
  return rainChance >= 45 ? 'Cloudy with showers' : 'Mostly sunny'
}

/** WMO weather interpretation codes → canonical outlook */
function wmoOutlook(code: number, rainChance: number): SimWeather['outlook'] {
  if (code === 0) return rainChance >= 45 ? 'Cloudy with showers' : 'Mostly sunny'
  if (code === 1 || code === 2) return 'Partly cloudy'
  if (code === 3) return rainChance >= 45 ? 'Cloudy with showers' : 'Partly cloudy'
  if (code === 45 || code === 48) return 'Partly cloudy'
  if ((code >= 51 && code <= 67) || (code >= 71 && code <= 77) || (code >= 80 && code <= 86) || code >= 95) {
    return 'Light rain likely'
  }
  return 'Partly cloudy'
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'kisan-seva-demo' } })
  } catch {
    return null
  }
}

/* ---------------------------- Source 1: Open-Meteo --------------------------- */

async function getOpenMeteo(district: string): Promise<LiveWeather | null> {
  const geoRes = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(district)}&count=1&language=en&country_code=IN`
  )
  if (!geoRes || !geoRes.ok) return null
  const geoJson = (await geoRes.json()) as {
    results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string }>
  }
  const hit = geoJson.results?.[0]
  if (!hit) return null

  const params = new URLSearchParams({
    latitude: String(hit.latitude),
    longitude: String(hit.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '2',
    timezone: 'auto',
  })
  const fcRes = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!fcRes || !fcRes.ok) return null
  const fc = (await fcRes.json()) as {
    error?: boolean
    current?: {
      temperature_2m: number
      relative_humidity_2m: number
      wind_speed_10m: number
      weather_code: number
    }
    daily?: {
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_probability_max: number[]
    }
  }
  if (fc.error || !fc.current || !fc.daily) return null

  const rainToday = Math.round(fc.daily.precipitation_probability_max?.[0] ?? 0)
  return {
    district: hit.name,
    state: hit.admin1,
    tempC: Math.round(fc.current.temperature_2m),
    humidity: Math.round(fc.current.relative_humidity_2m),
    windKmph: Math.round(fc.current.wind_speed_10m),
    outlook: wmoOutlook(fc.current.weather_code ?? -1, rainToday),
    rainChance: rainToday,
    tempMaxC: Math.round(fc.daily.temperature_2m_max?.[0] ?? fc.current.temperature_2m),
    tempMinC: Math.round(fc.daily.temperature_2m_min?.[0] ?? fc.current.temperature_2m),
    rainChanceTomorrow: Math.round(fc.daily.precipitation_probability_max?.[1] ?? 0),
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  }
}

/* ----------------------------- Source 2: wttr.in ----------------------------- */

async function getWttr(district: string): Promise<LiveWeather | null> {
  const res = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(district)}?format=j1`)
  if (!res || !res.ok) return null
  const json = (await res.json()) as {
    current_condition?: Array<{
      temp_C: string
      humidity: string
      windspeedKmph: string
      weatherDesc?: Array<{ value: string }>
      precipMM?: string
    }>
    weather?: Array<{
      maxtempC: string
      mintempC: string
      hourly?: Array<{ chanceofrain: string }>
    }>
    nearest_area?: Array<{ areaName?: Array<{ value: string }>; adminArea?: Array<{ value: string }> }>
  }

  const cur = json.current_condition?.[0]
  const today = json.weather?.[0]
  const tomorrow = json.weather?.[1]
  if (!cur) return null

  const desc = cur.weatherDesc?.[0]?.value ?? ''
  const rainToday = today?.hourly?.length
    ? Math.max(...today.hourly.map((h) => Number(h.chanceofrain) || 0))
    : Math.round((Number(cur.precipMM) || 0) > 0.2 ? 70 : 10)
  const rainTomorrow = tomorrow?.hourly?.length
    ? Math.max(...tomorrow.hourly.map((h) => Number(h.chanceofrain) || 0))
    : rainToday

  return {
    district: json.nearest_area?.[0]?.areaName?.[0]?.value ?? district,
    state: json.nearest_area?.[0]?.adminArea?.[0]?.value,
    tempC: Math.round(Number(cur.temp_C) || 0),
    humidity: Math.round(Number(cur.humidity) || 0),
    windKmph: Math.round(Number(cur.windspeedKmph) || 0),
    outlook: canonicalOutlook(desc, rainToday),
    rainChance: Math.min(100, rainToday),
    tempMaxC: Math.round(Number(today?.maxtempC) || Number(cur.temp_C) + 3),
    tempMinC: Math.round(Number(today?.mintempC) || Number(cur.temp_C) - 5),
    rainChanceTomorrow: Math.min(100, rainTomorrow),
    source: 'wttr.in',
    fetchedAt: new Date().toISOString(),
  }
}

/* ------------------------------ Source 3: fallback --------------------------- */

function getSimulated(district: string): LiveWeather {
  const sim = simulateWeather(district)
  return {
    ...sim,
    tempMaxC: sim.tempC + 4,
    tempMinC: sim.tempC - 6,
    rainChanceTomorrow: (sim.rainChance + 20) % 100,
    source: 'simulated',
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Get live weather for a district. Tries Open-Meteo → wttr.in → simulator.
 * Never throws: on total failure it returns deterministic simulated weather
 * tagged with source 'simulated'.
 */
export async function getWeather(district: string): Promise<LiveWeather> {
  const key = district.trim().toLowerCase() || 'bengaluru'
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) return cached.data

  let data: LiveWeather | null = null
  try {
    data = await getOpenMeteo(district)
  } catch {
    data = null
  }
  if (!data) {
    try {
      data = await getWttr(district)
    } catch {
      data = null
    }
  }
  if (!data) data = getSimulated(district)

  // cache live data 30 min; simulated data only 5 min so we retry providers soon
  const ttl = data.source === 'simulated' ? 5 * 60 * 1000 : CACHE_TTL_MS
  cache.set(key, { data, expiresAt: now + ttl })
  return data
}
