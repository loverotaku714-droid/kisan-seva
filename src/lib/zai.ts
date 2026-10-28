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
 * Plain OpenAI-compatible chat call.
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

/** Env-mode adapter: provider-agnostic client (Gemini, OpenAI, OpenRouter, Z.ai open platform...). */
function envClient(baseUrl: string, apiKey: string): ZaiClient {
  const call = (body: Record<string, unknown>) => openAiCompatibleChat(baseUrl, apiKey, body)
  return {
    chat: {
      completions: {
        create: call,
        createVision: call,
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
