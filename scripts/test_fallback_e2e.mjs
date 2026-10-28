// E2E validation of the REAL shipped fallback-advice module (bundled via esbuild)
import { classifyFallback, buildFallbackAnswer } from './fb_bundle.mjs'

// Minimal fake weather object matching getWeather's shape
const weather = {
  district: 'Mysuru', source: 'open-meteo', outlook: 'Partly cloudy',
  tempC: 25, tempMaxC: 29, tempMinC: 19, humidity: 52,
  rainChance: 10, rainChanceTomorrow: 30, windKmph: 11,
}

const cases = [
  // [question, lang, expectedCategory, mustContainSubstring]
  ['What is the tomato price?', 'en', 'price', 'Tomato'],
  ['what is the cotton rate today', 'en', 'price', 'Cotton'],
  ['should I sell my onion now', 'en', 'price', 'Onion'],
  ['will it rain today?', 'en', 'weather', 'Mysuru'],
  ['how is the weather', 'en', 'weather', 'rain chance'],
  ['my leaves have yellow spots', 'en', 'crop_disease', 'neem'],
  ['there are pests on my crop', 'en', 'crop_disease', 'neem'],
  ['hello who are you', 'en', 'general', 'Namaste'],
  ['what is the tur price?', 'en', 'price', 'Tur'],
  ['ಟೊಮ್ಯಾಟೊ ಬೆಲೆ ಎಷ್ಟು?', 'kn', 'price', '1200'],
  ['ಈಗ ಮಳೆ ಬರುತ್ತಾ ಇಲ್ಲವೇ?', 'kn', 'weather', 'Mysuru'],
  ['ಬೆಳೆಗೆ ಕೀಟ ಬಂದಿದೆ', 'kn', 'crop_disease', 'ಬೇವಿನ'],
  ['टमाटर का दाम क्या है?', 'hi', 'price', '1200'],
  ['आज बारिश होगी?', 'hi', 'weather', 'Mysuru'],
  ['फसल में कीड़े लग गए हैं', 'hi', 'crop_disease', 'नीम'],
  ['onion bhav kya hai', 'en', 'price', '1400'],   // farmer-style Hinglish
]

let pass = 0
for (const [q, lang, wantCat, frag] of cases) {
  const cat = classifyFallback(q)
  const { answer } = buildFallbackAnswer(q, lang, weather)
  const ok = cat === wantCat && answer.includes(frag)
  if (ok) { pass++; console.log(`PASS [${lang}] (${cat}) ${q}`) }
  else console.log(`FAIL [${lang}] got=${cat} want=${wantCat} | "${q}"\n   answer: ${answer.slice(0, 90)}`)
}
console.log(`\n${pass}/${cases.length} passed`)
process.exit(pass === cases.length ? 0 : 1)
