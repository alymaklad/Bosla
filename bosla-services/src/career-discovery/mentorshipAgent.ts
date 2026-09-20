// Ported from the Masar.ai notebook, Cell 5/6 ("Mentorship Chat Microservice — Final
// Anti-Simulation Polish"), `run_agent3_chat_stream`. The system prompt's "STRICT
// BEHAVIORAL RULES" and the stop-marker list are carried over verbatim — this is the
// notebook's specific, tuned defense against the model roleplaying both sides of the
// conversation, not a generic chat wrapper.
import { filterOnMarkers, type AiChatClient, type ChatMessage } from './aiClient.js'

/** The exact markers the notebook filters on — both in the provider's own `stop` list
 *  and again client-side, since a chunk boundary can still leak a partial marker. */
export const SIMULATION_MARKERS = ['Human:', 'User:', '---', 'assistant:', 'Hello, I am']

function buildMentorshipSystemPrompt(assessmentContext: string): string {
  const safeContext = assessmentContext.trim() ? assessmentContext : 'Student Profile: Name unknown.'
  return `You are Masar AI (مسار), an expert and concise career mentor.

### Student Background Context:
${safeContext}

---
### STRICT BEHAVIORAL RULES:
1. Address the student directly. Never use placeholders like [Student Name].
2. **CRITICAL:** Output ONLY your direct answer to the user's message.
3. **NEVER** simulate the user, write "Hello, I am...", or invent a fake follow-up question for the user.
4. Keep responses structured, professional, and under 250 words. Stop immediately after your closing sentence.`
}

/**
 * Streams one mentorship-chat turn, filtered against the notebook's confirmed
 * anti-simulation markers.
 *
 * [Bosla PRD §11.5 FR-CD-032/033] "A mentorship-chat agent shall power the follow-up
 * chat as a stateful conversation grounded in the user's completed assessment... Chat
 * and assessment responses shall stream token-by-token." Statefulness here is the
 * caller's responsibility: pass the full prior turns in `history` (as the notebook's
 * Gradio `chat_history` state did) — this function itself holds no session state,
 * consistent with every other module in this package being a plain function over
 * explicit inputs, not a service with hidden state.
 */
export async function* runMentorshipChatTurn(args: {
  userMessage: string
  assessmentContext: string
  history?: ChatMessage[]
  ai: AiChatClient
}): AsyncGenerator<string> {
  const { userMessage, assessmentContext, history = [], ai } = args
  const messages: ChatMessage[] = [
    { role: 'system', content: buildMentorshipSystemPrompt(assessmentContext) },
    ...history,
    { role: 'user', content: userMessage }
  ]

  const raw = ai.stream(messages, { stop: SIMULATION_MARKERS, temperature: 0.6, maxTokens: 600 })
  yield* filterOnMarkers(raw, SIMULATION_MARKERS)
}

/** Non-streaming convenience wrapper. */
export async function runMentorshipChatTurnComplete(args: {
  userMessage: string
  assessmentContext: string
  history?: ChatMessage[]
  ai: AiChatClient
}): Promise<string> {
  let out = ''
  for await (const chunk of runMentorshipChatTurn(args)) out += chunk
  return out
}
