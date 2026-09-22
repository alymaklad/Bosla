// One adapter, three providers: OpenAI, OpenRouter, and Groq all expose an
// OpenAI-compatible `/chat/completions` API, so this single implementation covers three
// of Bosla's four decided providers (PRD §22/§23) — only the base URL and API key
// differ. Anthropic is the odd one out (its own SDK/wire format), see anthropicAdapter.ts.
import OpenAI from 'openai'
import { AiError, type AiChatClient, type ChatMessage, type CompletionOptions } from '../aiClient.js'

export interface OpenAiCompatibleOptions {
  apiKey: string
  model: string
  /** Omit for OpenAI itself; set for OpenRouter (`https://openrouter.ai/api/v1`) or Groq (`https://api.groq.com/openai/v1`). */
  baseURL?: string
}

function translate(err: unknown): AiError {
  if (err instanceof AiError) return err
  if (err instanceof OpenAI.AuthenticationError) {
    return new AiError('The AI provider rejected the API key.', 'auth')
  }
  if (err instanceof OpenAI.RateLimitError) {
    return new AiError('The AI provider is rate-limiting requests. Try again shortly.', 'rate_limit')
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return new AiError('Could not reach the AI provider. Check the connection.', 'network')
  }
  if (err instanceof OpenAI.APIError) {
    return new AiError(`AI provider error ${err.status}: ${err.message}`, 'other')
  }
  return new AiError(err instanceof Error ? err.message : String(err), 'other')
}

export function openAiCompatibleClient(opts: OpenAiCompatibleOptions): AiChatClient {
  const client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL })

  async function* stream(messages: ChatMessage[], copts?: CompletionOptions): AsyncGenerator<string> {
    try {
      const res = await client.chat.completions.create({
        model: opts.model,
        messages,
        stream: true,
        temperature: copts?.temperature ?? 0.7,
        ...(copts?.maxTokens !== undefined ? { max_tokens: copts.maxTokens } : {}),
        ...(copts?.stop && copts.stop.length > 0 ? { stop: copts.stop } : {})
      })
      for await (const part of res) {
        const delta = part.choices[0]?.delta?.content
        if (delta) yield delta
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
