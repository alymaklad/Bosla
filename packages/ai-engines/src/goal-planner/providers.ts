// Ported from the Habit Tracking System (`src/main/ai/providers.ts`).
import type { AiProvider } from '../shared/types.js'
import { anthropicClient, DEFAULT_MODEL as ANTHROPIC_DEFAULT_MODEL, type AiClient } from './anthropicClient.js'
import { GROQ_DEFAULT_MODEL, groqClient } from './groqClient.js'

export interface ProviderInfo {
  id: AiProvider
  label: string
  defaultModel: string
  keyPlaceholder: string
  /** Shown under the model field in Settings. */
  note: string
  create(apiKey: string, model: string): AiClient
}

/**
 * Every provider the Goals planner can run on today.
 *
 * [Gap, ported from the Habit Tracking System] the source app only ships Anthropic and
 * Groq adapters — `research`/`fetchPage`/`judgeRelevance` depend on server-side
 * web-search/web-fetch tools (Anthropic) or a documented search-model fallback chain
 * (Groq's `groq/compound`); OpenAI and OpenRouter have no equivalent built-in tool, so
 * an `openai`/`openrouter` entry here needs its own research strategy (e.g. an external
 * search API) before it can satisfy `AiClient`, not a copy-paste of either adapter.
 * Bosla's decided provider roster (OpenAI, Anthropic, OpenRouter, Groq — PRD §22/§23)
 * is honoured in full by the simpler `career-discovery/aiClient.ts` in this package,
 * which has no research/browsing step and so needs no such gap.
 *
 * Adding a provider here is a new adapter satisfying `AiClient` plus one entry below;
 * nothing in the loop, `goalPlanner.ts`, or `intervenor.ts` changes.
 */
export const PROVIDERS: Partial<Record<AiProvider, ProviderInfo>> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    defaultModel: ANTHROPIC_DEFAULT_MODEL,
    keyPlaceholder: 'sk-ant-…',
    note: 'Uses Claude with built-in web search and link verification.',
    create: (apiKey, model) => anthropicClient({ apiKey, model })
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    defaultModel: GROQ_DEFAULT_MODEL,
    keyPlaceholder: 'gsk_…',
    note: 'Research runs on groq/compound (built-in search); this model drafts and reviews the plan. It needs JSON-schema support — openai/gpt-oss-120b, openai/gpt-oss-20b or qwen/qwen3.8-27b.',
    create: (apiKey, model) => groqClient({ apiKey, model })
  }
}

export const PROVIDER_IDS = Object.keys(PROVIDERS) as AiProvider[]

export function isProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && value in PROVIDERS
}
