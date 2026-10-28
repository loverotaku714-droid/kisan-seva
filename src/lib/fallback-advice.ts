import { SIMULATED_PRICES, type Language } from '@/lib/farm-data'
import type { getWeather } from '@/lib/weather'

/**
 * Rule-based fallback advisor — used when the AI provider is unavailable
 * (quota exhausted, provider outage, key not configured). Farmers must
 * ALWAYS get something useful; these answers are spoken-style and data-backed
 * (live weather + mandi price table), just less conversational than AI.
 */

type Weather = Awaited<ReturnType<typeof getWeather>>
export type FallbackCategory = 'crop_disease' | 'weather' | 'price' | 'general'

/**
 * Keyword matching with word boundaries.
 * A trailing '*' means "prefix match at a word start" (stems like irrigat*,
 * rain*); plain words must appear as whole words, so "price" no longer
 * matches "rice" and "cotton" never loses to a substring accident.
 */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function hasWord(q: string, word: string): boolean {
  // Normalize punctuation (?, ., ।, quotes...) to spaces so trailing
  // punctuation never breaks whole-word matching. Unicode-aware: \p{M} keeps
  // Devanagari/Kannada matras & anusvaras (they are marks, not letters —
  // without it, "मंडी" would be shredded to "म ड").
  const norm = q.replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
  if (word.endsWith('*')) {
    return new RegExp(`(^|\\s)${escapeRe(word.slice(0, -1))}`).test(norm)
  }
  return ` ${norm} `.includes(` ${word} `)
}

const DISEASE_WORDS = [
  'disease', 'pest*', 'insect*', 'fungus', 'fungal', 'blight', 'rust', 'rot*',
  'wilt*', 'yellow*', 'spot*', 'leaf', 'leaves', 'spray', 'aphid*', 'borer*', 'mildew',
  'रोग', 'कीड़*', 'इल्ली', 'फंगस', 'धब्ब*', 'पत्ती', 'छिड़काव', 'बीमार',
  'ರೋಗ', 'ಕೀಟ*', 'ಚಿಗಟ', 'ಎಲೆ*', 'ಕಲೆ*', 'ಸಿಂಪರಣೆ', 'ಕಾಯಿಲೆ',
]
const PRICE_WORDS = [
  'price', 'rate*', 'mandi*', 'market*', 'sell', 'selling', 'quintal', 'cost',
  'दाम', 'भाव', 'कीमत', 'मंडी', 'बेच',
  'ಬೆಲೆ', 'ದರ', 'ಮಾರುಕಟ್ಟೆ', 'ಮಾರಾಟ',
]
const WEATHER_WORDS = [
  'rain*', 'weather', 'temperature', 'humidity', 'wind', 'irrigat*',
  'मौसम', 'बारिश*', 'बरखा', 'तापमान', 'गर्मी', 'सिंचाई',
  'ಮಳೆ*', 'ವಾತಾವರಣ', 'ಹವಾಮಾನ', 'ತಾಪಮಾನ', 'ನೀರುಹಾಕು*',
]

/**
 * Crop aliases (farmer words incl. Hindi/Kannada) → keys in SIMULATED_PRICES.
 * '*' = prefix match ("tomato*" covers tomatoes); plain = whole word
 * ("tur" must not match "turn" or "turmeric").
 */
const CROP_ALIASES: Record<string, string[]> = {
  tomato: ['tomato*', 'टमाटर', 'ಟೊಮ್ಯಾಟೊ', 'ಟೊಮೇಟೊ'],
  onion: ['onion*', 'प्याज', 'प्याज़', 'कांदा', 'ಈರುಳ್ಳಿ'],
  potato: ['potato*', 'आलू', 'आलु', 'ಆಲೂಗಡ್ಡೆ', 'ಆಲೂ'],
  rice: ['rice', 'paddy', 'धान', 'चावल', 'ಭತ್ತ', 'ಅಕ್ಕಿ'],
  ragi: ['ragi', 'finger millet', 'रागी', 'ರಾಗಿ'],
  jowar: ['jowar', 'sorghum', 'ज्वार', 'ಜೋಳ'],
  maize: ['maize*', 'corn', 'मक्का', 'ಮೆಕ್ಕೆ'],
  cotton: ['cotton*', 'कपास', 'ಹತ್ತಿ'],
  groundnut: ['groundnut*', 'peanut*', 'मूंगफली', 'मूँगफली', 'ಶೇಂಗಾ'],
  tur: ['tur', 'toor', 'arhar', 'तूर', 'अरहर', 'ತೊಗರಿ'],
  'red gram': ['red gram'],
  'green chilli': ['chilli*', 'chili*', 'pepper', 'मिर्च', 'ಮೆಣಸಿನಕಾಯಿ'],
}

export function classifyFallback(question: string): FallbackCategory {
  const q = question.toLowerCase()
  if (WEATHER_WORDS.some((w) => hasWord(q, w))) return 'weather'
  if (PRICE_WORDS.some((w) => hasWord(q, w))) return 'price'
  if (DISEASE_WORDS.some((w) => hasWord(q, w))) return 'crop_disease'
  return 'general'
}

function findCrop(question: string): string | null {
  const q = question.toLowerCase()
  for (const [crop, aliases] of Object.entries(CROP_ALIASES)) {
    if (aliases.some((a) => hasWord(q, a))) return crop
  }
  // direct key match (e.g. "red gram", "green chilli" typed verbatim)
  for (const crop of Object.keys(SIMULATED_PRICES)) {
    if (hasWord(q, crop)) return crop
  }
  return null
}

const TREND_TEXT: Record<Language, Record<string, string>> = {
  en: { up: 'prices are going up', down: 'prices are coming down', stable: 'prices are steady' },
  hi: { up: 'दाम बढ़ रहे हैं', down: 'दाम घट रहे हैं', stable: 'दाम स्थिर हैं' },
  kn: { up: 'ಬೆಲೆ ಏರುತ್ತಿದೆ', down: 'ಬೆಲೆ ಇಳಿಯುತ್ತಿದೆ', stable: 'ಬೆಲೆ ಸ್ಥಿರವಾಗಿದೆ' },
}

export function buildFallbackAnswer(
  question: string,
  language: Language,
  weather: Weather,
): { category: FallbackCategory; answer: string } {
  const category = classifyFallback(question)

  if (category === 'weather') {
    const answer =
      language === 'hi'
        ? `${weather.district} में आज का मौसम: ${weather.outlook}। तापमान लगभग ${weather.tempC} डिग्री, नमी ${weather.humidity} प्रतिशत। आज बारिश की संभावना ${weather.rainChance} प्रतिशत और कल ${weather.rainChanceTomorrow} प्रतिशत है। बारिश की संभावना ज्यादा हो तो छिड़काव टालें और सिंचाई से पहले मौसम देखें।`
        : language === 'kn'
          ? `${weather.district} ನಲ್ಲಿ ಇಂದಿನ ಹವಾಮಾನ: ${weather.outlook}। ತಾಪಮಾನ ಸುಮಾರು ${weather.tempC} ಡಿಗ್ರಿ, ಆರ್ದ್ರತೆ ${weather.humidity} ಪ್ರತಿಶತ। ಇಂದು ಮಳೆಯ ಸಾಧ್ಯತೆ ${weather.rainChance} ಪ್ರತಿಶತ ಮತ್ತು ನಾಳೆ ${weather.rainChanceTomorrow} ಪ್ರತಿಶತ। ಮಳೆಯ ಸಾಧ್ಯತೆ ಹೆಚ್ಚಾಗಿದ್ದರೆ ಸಿಂಪರಣೆ ತಡೆಹಿಡಿಯಿರಿ ಮತ್ತು ನೀರುಹಾಕುವ ಮೊದಲು ಹವಾಮಾನ ನೋಡಿ.`
          : `Today in ${weather.district}: ${weather.outlook}. Temperature around ${weather.tempC} degrees, humidity ${weather.humidity} percent. Rain chance is ${weather.rainChance} percent today and ${weather.rainChanceTomorrow} percent tomorrow. If rain chance is high, postpone spraying and check the weather before irrigating.`
    return { category: 'weather', answer }
  }

  if (category === 'price') {
    const crop = findCrop(question)
    if (crop) {
      const p = SIMULATED_PRICES[crop]
      const cropName = crop.charAt(0).toUpperCase() + crop.slice(1)
      const trend = TREND_TEXT[language][p.trend]
      const answer =
        language === 'hi'
          ? `${cropName} का आज मंडी भाव ${p.min} से ${p.max} रुपये प्रति क्विंटल है और ${trend}। अच्छे दाम के लिए फसल को साफ और सूखा रखकर बेचें। सही रेट जानने के लिए अपनी नजदीकी मंडी या ईनाम पोर्टल जरूर देखें।`
          : language === 'kn'
            ? `${cropName} ಬೆಳೆಯ ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ದರ ${p.min} ರಿಂದ ${p.max} ರೂಪಾಯಿ ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್, ಮತ್ತು ${trend}। ಉತ್ತಮ ಬೆಲೆಗಾಗಿ ಬೆಳೆಯನ್ನು ಚೆನ್ನಾಗಿ ಒಣಗಿಸಿ ಮತ್ತು ಸ್ವಚ್ಛವಾಗಿ ಮಾರಾಟ ಮಾಡಿ। ನಿಖರವಾದ ದರಕ್ಕೆ ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಇ-ನಾಮ್ ಪೋರ್ಟಲ್ ನೋಡಿ।`
            : `${cropName} mandi price today is ${p.min} to ${p.max} rupees per quintal and ${trend}. For a better rate, keep the produce clean and dry before selling. Please check your nearest mandi or the eNAM portal for the exact rate.`
      return { category: 'price', answer }
    }
    const top = Object.entries(SIMULATED_PRICES).slice(0, 4)
    const answer =
      language === 'hi'
        ? `आज के मुख्य भाव: ${top.map(([c, p]) => `${c} ${p.min}-${p.max} रुपये`).join(', ')} प्रति क्विंटल। फसल का नाम बताइए तो मैं पूरा भाव बता दूं। अपनी मंडी का सही रेट वहीं पर मिलेगा।`
        : language === 'kn'
          ? `ಇಂದಿನ ಮುಖ್ಯ ದರಗಳು: ${top.map(([c, p]) => `${c} ${p.min}-${p.max} ರೂಪಾಯಿ`).join(', ')} ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್। ಬೆಳೆಯ ಹೆಸರು ಹೇಳಿ, ಪೂರ್ಣ ದರ ಹೇಳುತ್ತೇನೆ। ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ನಿಖರವಾದ ದರ ದೊರೆಯುತ್ತದೆ।`
          : `Today's main rates: ${top.map(([c, p]) => `${c} ${p.min}-${p.max} rupees`).join(', ')} per quintal. Tell me the crop name and I will give you the full rate. Your nearest mandi has the exact price.`
    return { category: 'price', answer }
  }

  if (category === 'crop_disease') {
    const answer =
      language === 'hi'
        ? 'पहले पीली या सड़ी हुई पत्तियों को तोड़कर खेत से दूर फेंकें, ताकि बीमारी फैले नहीं। नीम के तेल का छिड़काव करें और पौधों के ऊपर पानी देने से बचें। सही दवा और मात्रा के लिए अपने नजदीकी कृषि अधिकारी या किसान केंद्र से सलाह लें।'
        : language === 'kn'
          ? 'ಮೊದಲು ಹಳದಿ ಅಥವಾ ಕೊಳೆತ ಎಲೆಗಳನ್ನು ಕಟ್ ಮಾಡಿ ತೋಟದಿಂದ ದೂರ ಎಸೆಯಿರಿ, ಇದರಿಂದ ರೋಗ ಹರಡುವುದಿಲ್ಲ. ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪರಣೆ ಮಾಡಿ ಮತ್ತು ಸಸ್ಯಗಳ ಮೇಲೆ ನೀರು ಹಾಕಬೇಡಿ. ಸರಿಯಾದ ಔಷಧ ಮತ್ತು ಪ್ರಮಾಣಕ್ಕೆ ಹತ್ತಿರದ ಕೃಷಿ ಅಧಿಕಾರಿ ಅಥವಾ ಕೃಷಿ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.'
          : 'First pick off the yellow or rotten leaves and throw them away from the field so the disease does not spread. Spray neem oil and avoid watering the plants from above. For the exact medicine and dose, please contact your nearest agriculture officer or Krishi Kendra.'
    return { category: 'crop_disease', answer }
  }

  const answer =
    language === 'hi'
      ? 'नमस्ते किसान भाई! मैं फसल की बीमारी, मौसम और मंडी भाव के बारे में बता सकता हूं। अपना सवाल बोलकर पूछिए, जैसे टमाटर का भाव क्या है या आज बारिश होगी या नहीं।'
      : language === 'kn'
        ? 'ನಮಸ್ಕಾರ ರೈತರೇ! ನಾನು ಬೆಳೆ ರೋಗ, ಹವಾಮಾನ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ದರಗಳ ಬಗ್ಗೆ ಹೇಳಬಲ್ಲೆ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ, ಉದಾಹರಣೆಗೆ ಟೊಮ್ಯಾಟೊ ಬೆಲೆ ಎಷ್ಟು ಅಥವಾ ಇಂದು ಮಳೆ ಬರುತ್ತಾ.'
        : 'Namaste farmer! I can help with crop diseases, weather, and mandi prices. Just speak your question, for example: what is the tomato price, or will it rain today?'
  return { category: 'general', answer }
}
