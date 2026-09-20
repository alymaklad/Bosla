// New types for the career-discovery module. Modeled on what the Masar.ai notebook
// actually takes as input and produces as output (see cells 3, 4, 6), not invented —
// field names map onto the notebook's own variable names (major, interests, skill_level,
// cv_text) so porting the prompts stayed literal. Maps onto Bosla PRD §11.5 FR-CD-030–034.

/** What the notebook's Gradio form collected (Cell 8's `process_assessment_stream` args). */
export interface StudentInput {
  name: string | null
  /** Academic major / background. */
  major: string
  /** What they enjoy or are curious about. */
  interests: string
  /** e.g. "Beginner", "Intermediate", "Advanced" — the notebook treats this as free text. */
  skillLevel: string
  /** Extracted CV/resume text, already run through `extractTextFromPdf`, or null if none. */
  cvText: string | null
}

/** The combined Profile Summary + Gap Analysis the assessment agent produces (Cell 4). */
export interface AssessmentResult {
  /** The full markdown-formatted text, exactly as streamed — Bosla's UI renders this. */
  text: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** One entry in the exported PDF's transcript section. */
export interface ChatHistoryEntry {
  role: 'user' | 'assistant'
  content: string
}
