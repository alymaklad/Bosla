// A general-purpose, provider-agnostic streaming chat client for the career-discovery
// module — a NEW, simpler interface than the goal-planner's `AiClient`
// (research/finalize/critique/fetchPage/judgeRelevance), because Masar.ai's pipeline
// needs none of that: the notebook's Cells 4–6 are plain "system + user prompt in,
// streamed text out" calls (LangChain's `.stream()`), nothing more.
//
// Deliberately covers the full Bosla-decided provider roster — OpenAI, Anthropic,
// OpenRouter, Groq (Bosla PRD §22/§23) — because none of the four needs a
// provider-specific tool (no web search, no web fetch), unlike the goal-planner's
// Anthropic/Groq-only `AiClient`. See goal-planner/providers.ts for why that one is
// narrower.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionOptions {
  /** Stop generating the moment any of these strings appears — the anti-simulation
   *  guardrail the notebook's Agent 3 (Cell 6) relies on (`safe_llm = llm.bind(stop=[...])`). */
  stop?: string[]
  temperature?: number
  maxTokens?: number
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly kind: 'auth' | 'rate_limit' | 'network' | 'malformed' | 'other'
  ) {
    super(message)
    this.name = 'AiError'
  }
}

/**
 * The port every provider adapter satisfies. `stream` is the primitive (the notebook's
 * UI streams every response token-by-token, Cells 8's `process_assessment_stream` and
 * `process_chat_stream`); `complete` is `stream` collected into one string for callers
 * that don't need incremental output (e.g. the PDF report).
 */
export interface AiChatClient {
  stream(messages: ChatMessage[], opts?: CompletionOptions): AsyncGenerator<string>
  complete(messages: ChatMessage[], opts?: CompletionOptions): Promise<string>
}

/** Shared helper so every adapter's `complete` is "collect what `stream` yields", not a separate code path. */
export async function collectStream(gen: AsyncGenerator<string>): Promise<string> {
  let out = ''
  for await (const chunk of gen) out += chunk
  return out
}

/**
 * Applies a `stop` sequence to an already-streaming source, the way the notebook's
 * Agent 3 drops any chunk containing a simulation marker (`"Human:", "User:", "Hello, I am"`)
 * rather than trusting the provider's own `stop` parameter alone — some providers only
 * stop at a token boundary, which can still leak a partial marker mid-chunk.
 */
export async function* filterOnMarkers(gen: AsyncGenerator<string>, markers: string[]): AsyncGenerator<string> {
  if (markers.length === 0) {
    yield* gen
    return
  }
  for await (const chunk of gen) {
    if (markers.some((m) => chunk.includes(m))) return
    yield chunk
  }
}
