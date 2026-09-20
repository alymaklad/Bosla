// Barrel export for the career-discovery module — ported from the Masar.ai notebook
// (`Final project (Masar) .ipynb`, all 8 cells): CV ingestion, the unified assessment +
// skill-gap agent, the anti-simulation mentorship-chat agent, and PDF report export.
// Bosla PRD §11.5 (FR-CD-030–034) and §9.2.
//
// What changed from the notebook, and why:
//  - Qwen2.5-7B (local, 4-bit quantized, GPU-required) -> the Bosla-decided multi-provider
//    client (OpenAI, Anthropic, OpenRouter, Groq — PRD §22/§23). A 7B local model has no
//    place in a web/mobile backend's request path; this was the explicit call made
//    when scoping this integration.
//  - PyPDF2 -> `pdf-parse` (Node has no PyPDF2 equivalent; same truncate-at-3000-chars behavior).
//  - ReportLab PLATYPUS -> `pdfkit` (same section layout, colors and fonts, ported by hand
//    since pdfkit has no HTML/markup flowable to hand a sanitized string to).
//  - Gradio's `process_assessment_stream` / `process_chat_stream` -> plain async
//    generators (`runAssessment`, `runMentorshipChatTurn`). Gradio itself is UI glue
//    for the notebook's own demo server, not portable to Bosla's React web MVP (PRD
//    §12.1) — the streaming *behavior* is what's preserved, not the UI framework.
//
// What's still Bosla-specific integration work, not done here:
//  - Persisting a `StudentInput` / assessment / chat history against Bosla's own
//    PostgreSQL schema (PRD §21 `CareerProfile`, `CareerRecommendation`).
//  - Mapping the assessment agent's free-form markdown output onto the PRD's structured
//    3–5 `CareerRecommendation` entries with per-recommendation uncertainty notes
//    (FR-CD-010/011) — this port preserves Masar.ai's confirmed single-block output
//    exactly; restructuring it into discrete profiles is new prompt-engineering work.
//  - Wiring API keys/provider selection to Bosla's actual settings store.
export * from './types.js'
export * from './aiClient.js'
export * from './providers/registry.js'
export * from './cvIngestion.js'
export * from './assessmentAgent.js'
export * from './mentorshipAgent.js'
export * from './pdfReport.js'
