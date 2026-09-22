// Anthropic adapter for the career-discovery chat client — Bosla's 4th decided provider
// (PRD §22/§23). Separate from openaiCompatible.ts because Anthropic's Messages API is
// its own wire format (`system` is a top-level field, not a message with `role: 'system'`).
import Anthropic from '@anthropic-ai/sdk'
import { AiError, type AiChatClient, type ChatMessage, type CompletionOptions } from '../aiClient.js'

export interface AnthropicChatOptions {
  apiKey: string
  model: string
}

function translate(err: unknown): AiError {
  if (err instanceof AiError) return err
  if (err instanceof Anthropic.AuthenticationError) {
    return new AiError('The AI provider rejected the API key.', 'auth')
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new AiError('The AI provider is rate-limiting requests. Try again shortly.', 'rate_limit')
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new AiError('Could not reach the AI provider. Check the connection.', 'network')
  }
  if (err instanceof Anthropic.APIError) {
    return new AiError(`AI provider error ${err.status}: ${err.message}`, 'other')
  }
  return new AiError(err instanceof Error ? err.message : String(err), 'other')
}

function splitSystem(messages: ChatMessage[]): { system: string; rest: Anthropic.MessageParam[] } {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  const rest = messages
    .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))
  return { system, rest }
}

export function anthropicChatClient(opts: AnthropicChatOptions): AiChatClient {
  const client = new Anthropic({ apiKey: opts.apiKey })

  async function* stream(messages: ChatMessage[], copts?: CompletionOptions): AsyncGenerator<string> {
    const { system, rest } = splitSystem(messages)
    try {
      const s = client.messages.stream({
        model: opts.model,
        max_tokens: copts?.maxTokens ?? 4000,
        temperature: copts?.temperature ?? 0.7,
        system,
        ...(copts?.stop && copts.stop.length > 0 ? { stop_sequences: copts.stop } : {}),
        messages: rest
      })
      for await (const event of s) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text
        }
      }
    } catch (err) {
      throw translate(err)
    }
  }

  return {
    stream,
    async complete(messages, copts) {
      let out = ''
      for await (const chunk of stream(messages, copts)) out += chunk
      return out
    }
  }
}
