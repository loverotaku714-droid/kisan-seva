import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { LANGUAGE_NAMES, LANGUAGE_LABELS, type Language } from '@/lib/farm-data'

export const maxDuration = 90

const VALID_LANGUAGES = ['en', 'hi', 'kn'] as const
const MAX_BASE64_LENGTH = 6 * 1024 * 1024 // ~6 MB base64 ≈ 4.5 MB image
const VALID_SEVERITY = ['healthy', 'mild', 'moderate', 'severe'] as const

interface DiagnosisResult {
  crop: string
  disease: string
  severity: string
  remedy: string
  confidence: number
}

function parseVisionJson(raw: string): DiagnosisResult {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  const parsed = JSON.parse(text) as Record<string, unknown>

  const severity = String(parsed.severity || 'moderate').toLowerCase()
  const confidenceRaw = Number(parsed.confidence)
  return {
    crop: String(parsed.crop || 'Unknown crop').trim().slice(0, 60),
    disease: String(parsed.disease || 'Unidentified problem').trim().slice(0, 120),
    severity: ((VALID_SEVERITY as readonly string[]).includes(severity) ? severity : 'moderate') as
      | 'healthy'
      | 'mild'
      | 'moderate'
      | 'severe',
    remedy: String(parsed.remedy || '').trim().slice(0, 600),
    confidence: Number.isFinite(confidenceRaw) ? Math.min(100, Math.max(0, Math.round(confidenceRaw))) : 70,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const imageBase64: string = String(body?.imageBase64 ?? '').trim()
    const mimeType: string = ['image/jpeg', 'image/png', 'image/webp'].includes(body?.mimeType)
      ? body.mimeType
      : 'image/jpeg'
    const note: string = String(body?.note ?? '').trim().slice(0, 300)
    const language: Language = (VALID_LANGUAGES as readonly string[]).includes(body?.language)
      ? (body.language as Language)
      : 'en'

    if (!imageBase64) {
      return NextResponse.json({ error: 'Please attach a photo of the plant.' }, { status: 400 })
    }
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: 'Photo is too large. Please use a smaller photo (under 4 MB).' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.createVision({
      model: 'glm-5v-turbo',
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `You are the Kisan Seva Crop Doctor, an expert plant pathologist helping Indian farmers. ` +
                `A farmer sent a photo of a plant (usually a leaf). ${note ? `The farmer added this note: "${note}". ` : ''}` +
                `Look at the photo carefully and respond with ONLY a valid JSON object, no code fences, in this exact format:\n` +
                `{"crop":"crop name","disease":"most likely disease or problem","severity":"healthy|mild|moderate|severe","remedy":"your spoken-style remedy","confidence":85}\n\n` +
                `Rules:\n` +
                `- "crop": best guess of the crop shown.\n` +
                `- "disease": the most likely disease, pest or nutrient problem (if the leaf looks healthy, say "No visible disease").\n` +
                `- "severity": one of healthy, mild, moderate, severe.\n` +
                `- "remedy": 2 to 3 SHORT spoken-style sentences in ${LANGUAGE_NAMES[language]} (the farmer selected ${LANGUAGE_LABELS[language]}). ` +
                `Give practical, actionable treatment steps. If a pesticide or fertilizer is suggested, also advise confirming dosage with the local agriculture officer. ` +
                `No markdown, no bullets, no emojis — plain text that will be read aloud.\n` +
                `- "confidence": integer 0-100 for the disease identification.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    let result: DiagnosisResult
    try {
      result = parseVisionJson(raw)
    } catch {
      return NextResponse.json(
        { error: 'The Crop Doctor could not read this photo clearly. Please try a sharper, well-lit close-up of the leaf.' },
        { status: 422 }
      )
    }

    if (!result.remedy) {
      result.remedy =
        language === 'hi'
          ? 'क्षमा करें, अभी सलाह तैयार नहीं हो पाई। कृपया दोबारा स्पष्ट फोटो भेजें।'
          : language === 'kn'
            ? 'ಕ್ಷಮಿಸಿ, ಈಗ ಸಲಹೆ ಸಿದ್ಧವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಳುಹಿಸಿ.'
            : 'Sorry, I could not prepare a remedy right now. Please send a clearer photo and try again.'
    }

    // persist to database (best-effort) so it appears in Recent Advisories
    try {
      await db.query.create({
        data: {
          question: `[Photo] ${result.crop} leaf — ${note || 'crop doctor diagnosis'}`.slice(0, 500),
          answer: `${result.disease}: ${result.remedy}`.slice(0, 2000),
          category: 'crop_disease',
          language,
        },
      })
    } catch (e) {
      console.error('DB write failed (diagnose):', e)
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Diagnose API error:', e)
    return NextResponse.json(
      { error: 'The Crop Doctor is busy right now. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
