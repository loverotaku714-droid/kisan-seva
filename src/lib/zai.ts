import ZAI from 'z-ai-web-dev-sdk'

/**
 * Resolves the ZAI client for AI features (voice answers + photo diagnosis).
 *
 * Priority:
 *  1. `.z-ai-config` file (local dev / sandbox — Z.ai internal gateway via SDK)
 *  2. Environment variables (production, e.g. Render) — STANDARD OpenAI-compatible
 *     protocol via plain fetch, so any provider works:
 *       - ZAI_API_KEY   (required)
 *       - ZAI_BASE_URL  (optional; default https://api.z.ai/api/paas/v4)
 *                       e.g. Gemini: https://generativelanguage.googleapis.com/v1beta/openai
 *       - ZAI_MODEL / ZAI_VISION_MODEL (optional model overrides)
 *
 * The resolved client is cached per server instance, so the lookup runs once.
 */

export interface ChatResponseLike {
  choices?: Array<{ message?: { content?: string } }>
}

/** Minimal client shape used by /api/ask and /api/diagnose. */
export interface ZaiClient {
  chat: {
    completions: {
      create(body: Record<string, unknown>): Promise<ChatResponseLike>
      createVision(body: Record<string, unknown>): Promise<ChatResponseLike>
    }
  }
}

/**
 * Plain OpenAI-compatible chat call (single attempt, no retries).
 * Note: we strip SDK-specific fields (`thinking`, `stream`) because providers like
 * Google's OpenAI-compat endpoint reject unknown body fields, and we always use the
 * standard /chat/completions path (multimodal `image_url` content included), which
 * every OpenAI-compatible provider supports.
 */
async function openAiCompatibleChat(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<ChatResponseLike> {
  const payload = { ...body }
  delete payload.thinking
  delete payload.stream
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300)
    throw new Error(`AI_PROVIDER_ERROR: status ${res.status} ${detail}`)
  }
  return (await res.json()) as ChatResponseLike
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Gemini free tier: the newest flash model frequently answers 503 "high demand".
 * We transparently fail over to older-but-stable flash models so farmers always
 * get an answer. All Gemini flash models are multimodal, so this is safe for
 * both text chat and photo diagnosis.
 */
const GEMINI_FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']

function parseStatus(err: Error): number {
  return Number(err.message.match(/status (\d{3})/)?.[1] ?? 0)
}

/**
 * Build the ordered model list for one request:
 * primary model first; for Gemini also the free-tier fallback models (deduped).
 */
function modelChain(primary: string | undefined, baseUrl: string): (string | undefined)[] {
  const isGemini = /generativelanguage\.googleapis\.com/i.test(baseUrl)
  const list = [primary, ...(isGemini ? GEMINI_FALLBACK_MODELS : [])]
  const chain = [...new Set(list.filter((m): m is string => Boolean(m)))]
  return chain.length > 0 ? chain : [undefined]
}

/**
 * Resilient chat: retries transient errors on the same model once, then walks
 * down the model chain. Fatal errors (bad key 401/403, malformed body 400)
 * fail fast; unknown-model 404 jumps straight to the next model.
 */
async function resilientChat(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
  maxModels: number,
): Promise<ChatResponseLike> {
  const primary = typeof body.model === 'string' ? body.model : undefined
  const chain = modelChain(primary, baseUrl).slice(0, maxModels)
  let lastError = new Error('AI_PROVIDER_ERROR: no model attempted')

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i]
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await openAiCompatibleChat(baseUrl, apiKey, { ...body, model })
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
        const status = parseStatus(lastError)
        // Config errors won't be fixed by another model — fail fast.
        if (status === 400 || status === 401 || status === 403) throw lastError
        // Unknown model — skip straight to the next one in the chain.
        if (status === 404) break
        // Transient (429/5xx): retry same model once after a short backoff.
        if (attempt === 0) await sleep(1000)
      }
    }
    if (i < chain.length - 1) await sleep(400)
  }
  throw lastError
}

/** Env-mode adapter: provider-agnostic client (Gemini, OpenAI, OpenRouter, Z.ai open platform...). */
function envClient(baseUrl: string, apiKey: string): ZaiClient {
  return {
    chat: {
      completions: {
        // Text answers: short generations, allow walking further down the chain.
        create: (body) => resilientChat(baseUrl, apiKey, body, 4),
        // Photo diagnosis: image payloads are slow — keep the budget tighter.
        createVision: (body) => resilientChat(baseUrl, apiKey, body, 3),
      },
    },
  }
}

let cached: Promise<ZaiClient> | null = null

export function getZAI(): Promise<ZaiClient> {
  if (!cached) {
    cached = (async () => {
      // 1) Config-file mode (local dev / sandbox)
      try {
        return (await ZAI.create()) as unknown as ZaiClient
      } catch {
        // no valid .z-ai-config — fall through to env mode
      }

      // 2) Env mode (production hosting)
      const apiKey = process.env.ZAI_API_KEY
      const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4'
      if (!apiKey) {
        throw new Error(
          'AI_NOT_CONFIGURED: set ZAI_API_KEY (optionally ZAI_BASE_URL / ZAI_MODEL) in the environment, or provide a .z-ai-config file.'
        )
      }
      return envClient(baseUrl, apiKey)
    })()
  }
  return cached
}

/** Text-chat model. Set ZAI_MODEL to override (e.g. glm-4.5-air, gemini-3.8-flash). Omitted = server default. */
export function chatModel(): string | undefined {
  return process.env.ZAI_MODEL || undefined
}

/** Vision model for the Photo Crop Doctor. Set ZAI_VISION_MODEL to override. */
export function visionModel(): string {
  return process.env.ZAI_VISION_MODEL || 'glm-5v-turbo'
}
