// Provider registry for the career-discovery chat client — mirrors the pattern
// goal-planner/providers.ts already establishes (registry + `create(apiKey, model)`
// factory), extended to all four of Bosla's decided providers (PRD §22/§23) since none
// of them needs a provider-specific tool here.
import type { AiProvider } from '../../shared/types.js'
import type { AiChatClient } from '../aiClient.js'
import { anthropicChatClient } from './anthropicAdapter.js'
import { openAiCompatibleClient } from './openaiCompatible.js'

export interface CareerAiProviderInfo {
  id: AiProvider
  label: string
  defaultModel: string
  create(apiKey: string, model?: string): AiChatClient
}

export const CAREER_AI_PROVIDERS: Record<AiProvider, CareerAiProviderInfo> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-5.1',
    create: (apiKey, model) => openAiCompatibleClient({ apiKey, model: model ?? 'gpt-5.1' })
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-sonnet-5',
    create: (apiKey, model) => anthropicChatClient({ apiKey, model: model ?? 'claude-sonnet-5' })
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openai/gpt-oss-120b',
    create: (apiKey, model) =>
      openAiCompatibleClient({
        apiKey,
        model: model ?? 'openai/gpt-oss-120b',
        baseURL: 'https://openrouter.ai/api/v1'
      })
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    defaultModel: 'openai/gpt-oss-120b',
    create: (apiKey, model) =>
      openAiCompatibleClient({
        apiKey,
        model: model ?? 'openai/gpt-oss-120b',
        baseURL: 'https://api.groq.com/openai/v1'
      })
  }
}

export const CAREER_AI_PROVIDER_IDS = Object.keys(CAREER_AI_PROVIDERS) as AiProvider[]
