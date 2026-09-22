// Ported from the Masar.ai notebook, Cell 4 ("Combined Assessment Microservice — Unified
// Fast Chain"): one LangChain prompt that produces the Student Profile Summary AND the
// Industry Alignment & Gap Analysis in a single pass. The prompt text below is the
// notebook's `unified_assessment_template`, verbatim — only the templating mechanism
// changed (Python `.format()` -> a plain template literal).
import type { AiChatClient } from './aiClient.js'
import type { StudentInput } from './types.js'

/**
 * The notebook's `unified_assessment_template`, character-for-character (including its
 * emoji section headers — Bosla's renderer can strip them later if the design system
 * wants plain headings; the PRD does not specify either way, so nothing is assumed here).
 */
function buildAssessmentPrompt(input: StudentInput): { system: string; user: string } {
  const major = input.major.trim() || 'Undecided / General Student'
  const interests = input.interests.trim() || 'Exploring open options'
  const skillLevel = input.skillLevel.trim() || 'Beginner / Exploring'
  const cvText = input.cvText?.trim() || 'No CV provided.'

  const system = `You are Masar AI (مسار), an expert career guidance system.
Based on the student's inputs, create a structured evaluation containing two clear sections: Student Profile Summary and Industry Alignment & Gap Analysis.`

  const user = `### Student Inputs:
- Academic Major / Background: ${major}
- What they enjoy or are curious about: ${interests}
- General Skill Level: ${skillLevel}
- Extracted Resume / CV Content: ${cvText}

---
### Output Format Requirements:

# 👤 PART 1: STUDENT PROFILE SUMMARY
1. **Current Background**: Summarize their education or current stage.
2. **Exploratory Interests**: Highlight what excites them or what they want to learn.
3. **Core Strengths & Potential**: Identify potential strengths based on their inputs.

---

# 🎯 PART 2: CAREER DIRECTIONS & GAP ANALYSIS
1. **Top 3 Recommended Career Directions**:
   - Provide 3 distinct, highly tailored career paths. Explain *why* each fits them.
2. **Skill Gap Analysis**:
   - Identify specific technical skills, modern tools, or industry frameworks they are missing.
   - Highlight any soft skill or domain knowledge gaps.
3. **High-Impact Development Priorities**:
   - List 3 to 4 immediate, actionable priorities to bridge these skill gaps.`

  return { system, user }
}

/**
 * Streams the assessment live, matching the notebook's `process_assessment_stream`
 * (Cell 8) — the UI accumulates chunks into one growing block of text as they arrive.
 *
 * [Bosla PRD §11.5 FR-CD-031] "An assessment/skill-gap agent shall evaluate the
 * combined conversational + CV evidence against career/market profiles in a structured
 * pass, producing the career-profile output specified in FR-CD-010–011." Note: this
 * agent's output is markdown prose (matching the notebook exactly); mapping it onto the
 * PRD's structured `CareerRecommendation` schema (3–5 discrete profiles with per-profile
 * uncertainty notes, §21) is a Bosla-specific parsing/prompting step still to be done —
 * this port preserves Masar.ai's confirmed behavior, it doesn't silently redesign it.
 */
export async function* runAssessment(input: StudentInput, ai: AiChatClient): AsyncGenerator<string> {
  const { system, user } = buildAssessmentPrompt(input)
  yield* ai.stream(
    [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    { temperature: 0.7 }
  )
}

/** Non-streaming convenience wrapper — collects the full assessment text. */
export async function runAssessmentComplete(input: StudentInput, ai: AiChatClient): Promise<string> {
  let out = ''
  for await (const chunk of runAssessment(input, ai)) out += chunk
  return out
}
