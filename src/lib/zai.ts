import ZAI from 'z-ai-web-dev-sdk'

/**
 * Resolves the ZAI client for AI features (voice answers + photo diagnosis).
 *
 * Priority:
 *  1. `.z-ai-config` file (local dev / sandbox — handled by the SDK's `ZAI.create()`)
 *  2. Environment variables (production, e.g. Render):
 *       - ZAI_API_KEY   (required)
 *       - ZAI_BASE_URL  (optional; default https://api.z.ai/api/paas/v4 —
 *                        Z.ai's OpenAI-compatible endpoint; any OpenAI-compatible
 *                        provider works, e.g. https://api.openai.com/v1)
 *
 * The resolved client is cached per server instance, so the lookup runs once.
 */
let cached: Promise<InstanceType<typeof ZAI>> | null = null

export function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!cached) {
    cached = (async () => {
      // 1) Config-file mode (local dev / sandbox)
      try {
        return await ZAI.create()
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
      return new ZAI({ baseUrl, apiKey })
    })()
  }
  return cached
}

/** Text-chat model. Set ZAI_MODEL to override (e.g. glm-4.5-air, gpt-4o-mini). Omitted = server default. */
export function chatModel(): string | undefined {
  return process.env.ZAI_MODEL || undefined
}

/** Vision model for the Photo Crop Doctor. Set ZAI_VISION_MODEL to override. */
export function visionModel(): string {
  return process.env.ZAI_VISION_MODEL || 'glm-5v-turbo'
}
