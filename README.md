# 🌾 Kisan Seva — Voice-Based Farmer Assistant

**Speak your question. Hear the answer.**

Kisan Seva is a speech-first AI assistant built for Indian farmers. A farmer speaks a
question out loud — about crop diseases, weather, or market prices — and hears instant,
practical advice spoken back in their own language (English, Hindi, or Kannada).
No typing needed, no apps to learn.

Built around the classic pipeline: **Farmer → Speaks Question → STT → AI/NLP → Advisory → TTS → Spoken Answer**.

---

## ✨ Features

### 🎙️ Voice Assistant (core pipeline)
- **Speech-to-Text** via the browser Web Speech API (`en-IN` / `hi-IN` / `kn-IN`)
- **AI / NLP** intent classification (crop disease · weather · price · general) with an LLM
- **Text-to-Speech** answers spoken back aloud in the farmer's chosen language
- Live 7-stage pipeline tracker, typed-question fallback, replay controls

### 📸 Photo Crop Doctor
- Snap or upload a photo of a sick plant leaf
- AI vision model identifies the crop + disease, severity and confidence
- Spoken remedy in the farmer's language

### 📻 Daily Voice Bulletin
- One tap plays a radio-style spoken briefing (~60 seconds)
- Live weather + tomorrow's rain chance + top mandi prices + a rotating farming tip

### 🌦️ Real Live Weather
- 3-source chain: **Open-Meteo → wttr.in → deterministic simulator** (never fails)
- Weather answers and the bulletin use real figures for any Karnataka district

### 🔐 Accounts & Personalisation
- Phone-number login/signup (Indian mobile format, `+91` friendly)
- 30-day httpOnly sessions, scrypt-hashed passwords (zero external auth deps)
- District + language from the profile auto-tune the assistant, bulletin and weather
- Every question is saved to the farmer's history

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + framer-motion |
| Database | Prisma ORM + SQLite |
| AI | z-ai-web-dev-sdk (LLM chat + vision) |
| Speech | Web Speech API (STT + TTS) |
| Weather | Open-Meteo / wttr.in |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env

# 3. Create the database schema
bun run db:push

# 4. Run the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — try the sample questions,
snap a leaf photo, or play the daily bulletin.

> **Note:** Speech recognition (STT) works best in Chrome/Edge. The typed-question
> fallback works everywhere.

### 🌍 Going live

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step guides: Railway, Render, Vercel
and Docker (a production `Dockerfile` is included).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ask/          # Voice Q&A: intent classification + spoken answer
│   │   ├── bulletin/     # Daily bulletin (weather + prices + tip)
│   │   ├── diagnose/     # Photo Crop Doctor (vision model)
│   │   ├── history/      # Recent advisories feed
│   │   └── auth/         # signup / login / logout / me
│   ├── login/            # Login + signup page
│   └── page.tsx          # Main single-page experience
├── components/           # Hero, voice assistant, photo doctor, bulletin…
└── lib/
    ├── auth.ts           # scrypt hashing + HMAC session tokens
    ├── speech.ts         # Web Speech API wrapper (en/hi/kn)
    ├── weather.ts        # 3-source live weather chain
    └── farm-data.ts      # Districts, languages, mandi price table
```

---

## 🔒 Privacy

- Mobile numbers stay private and are never shared
- Passwords are salted + hashed with scrypt
- Sessions use signed, httpOnly cookies

---

## 📄 License

Built as a demonstration project. Weather and mandi price data are indicative —
farmers should confirm with local authorities before making decisions.
