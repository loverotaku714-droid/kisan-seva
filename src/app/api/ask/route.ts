import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import {
  LANGUAGE_NAMES,
  LANGUAGE_LABELS,
  SIMULATED_PRICES,
  detectDistrict,
  type Language,
} from '@/lib/farm-data'
import { getWeather } from '@/lib/weather'
import { getSessionUser } from '@/lib/auth'

export const maxDuration = 60

const VALID_CATEGORIES = ['crop_disease', 'weather', 'price', 'general'] as const
const VALID_LANGUAGES = ['en', 'hi', 'kn'] as const

function buildPriceTable(): string {
  return Object.entries(SIMULATED_PRICES)
    .map(([crop, v]) => `- ${crop}: ₹${v.min}–₹${v.max}/quintal (trend: ${v.trend})`)
    .join('\n')
}

function buildSystemPrompt(question: string, lang: Language, weather: Awaited<ReturnType<typeof getWeather>>): string {
  return `You are "Kisan Seva", a friendly voice-based assistant built for Indian farmers.
A farmer asked a question that was transcribed from speech. Your job has TWO steps:

STEP 1 — Classify the question into exactly ONE category:
- "crop_disease": crop diseases, pests, plant health, seeds, fertilizer, irrigation practices, general farming how-to
- "weather": rain, temperature, humidity, wind, weather-based irrigation or spraying decisions
- "price": crop market prices, mandi rates, selling decisions
- "general": greetings, help, or anything not covered above

STEP 2 — Write the answer that will be converted to SPEECH:
- Answer ONLY in ${LANGUAGE_NAMES[lang]} (the farmer selected ${LANGUAGE_LABELS[lang]}).
- Keep it SHORT and spoken-style: 2 to 4 short sentences, under 60 words. It will be read aloud.
- Use simple village-level words. No markdown, no bullets, no emojis, no symbols like * or #. Plain text only.
- Give practical, actionable advice. If a pesticide/fertilizer is mentioned, also advise checking with the local agriculture officer for exact dosage.
- Never mention that you are an AI model or that data is simulated.

Reference context for this demo (Karnataka region):
- ${weather.source === 'open-meteo' ? 'LIVE' : 'Estimated'} weather for ${weather.district} today: ${weather.outlook}, around ${weather.tempC}°C (max ${weather.tempMaxC}°C, min ${weather.tempMinC}°C), humidity ${weather.humidity}%, rain chance ${weather.rainChance}% today and ${weather.rainChanceTomorrow}% tomorrow, wind ${weather.windKmph} km/h. Use these numbers when the farmer asks about weather.
- Simulated mandi prices (₹ per quintal):
${buildPriceTable()}
If the crop is not in the list, give general price guidance and suggest visiting the local mandi or the eNAM portal.

Respond with ONLY a valid JSON object, no code fences, in this exact format:
{"category":"crop_disease|weather|price|general","answer":"your spoken-style answer"}`
}

function parseLlmJson(raw: string): { category: string; answer: string } {
  let text = raw.trim()
  // strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  const parsed = JSON.parse(text)
  const category = String(parsed.category || 'general').toLowerCase()
  return {
    category: (VALID_CATEGORIES as readonly string[]).includes(category) ? category : 'general',
    answer: String(parsed.answer || '').trim(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const question: string = String(body?.text ?? '').trim()
    const language: Language = (VALID_LANGUAGES as readonly string[]).includes(body?.language)
      ? (body.language as Language)
      : 'en'

    if (!question) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
    }
    if (question.length > 500) {
      return NextResponse.json({ error: 'Question is too long (max 500 characters)' }, { status: 400 })
    }

    const weather = await getWeather(detectDistrict(question))
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: buildSystemPrompt(question, language, weather) },
        { role: 'user', content: question },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    let category = 'general'
    let answer = ''

    try {
      const parsed = parseLlmJson(raw)
      category = parsed.category
      answer = parsed.answer
    } catch {
      // fallback: use raw text as the answer
      answer = raw.trim().replace(/^["']|["']$/g, '').slice(0, 600)
      category = 'general'
    }

    if (!answer) {
      answer =
        language === 'hi'
          ? 'क्षमा करें, मैं अभी आपका उत्तर नहीं दे पाया। कृपया दोबारा पूछें।'
          : language === 'kn'
            ? 'ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರ ನೀಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಕೇಳಿ.'
            : 'Sorry, I could not prepare an answer right now. Please ask again.'
    }

    // persist to database (best-effort; don't fail the request if DB write fails)
    const sessionUser = await getSessionUser(req.cookies.get('kisan_session')?.value)
    let savedId: string | null = null
    try {
      const saved = await db.query.create({
        data: { question, answer, category, language, userId: sessionUser?.id ?? null },
      })
      savedId = saved.id
    } catch (e) {
      console.error('DB write failed:', e)
    }

    return NextResponse.json({ id: savedId, category, answer, language })
  } catch (e) {
    console.error('Ask API error:', e)
    return NextResponse.json(
      { error: 'The assistant is busy right now. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
