// Ported from the Masar.ai notebook, Cell 3 ("Ingestion Microservice — PDF Resume
// Extractor"), `extract_text_from_pdf`. Same behavior: extract text, strip to a
// reasonable size so it doesn't blow out the assessment prompt, never throw on a bad
// file — return empty text and let the caller decide what "no CV" means.
// `pypdf.PdfReader` -> `pdf-parse` is the only substitution; the truncation constant
// (3000 chars) and the "no crash on a bad file" behavior are carried over exactly.
import pdfParse from 'pdf-parse'

/** Matches the notebook's `if len(cleaned_text) > 3000` truncation exactly. */
export const CV_TEXT_MAX_CHARS = 3000

export interface CvExtractionResult {
  text: string
  truncated: boolean
  /** False when the buffer wasn't a readable PDF, or had no extractable text. */
  ok: boolean
  error: string | null
}

/**
 * Extracts raw text from an uploaded PDF resume/CV.
 *
 * [Bosla PRD §11.5 FR-CD-030] "the system shall ingest an uploaded CV/resume PDF,
 * extracting and normalizing its text as evidence for the discovery profile." The PRD's
 * edge case for a scanned-image PDF with no extractable text is `ok: false` here — the
 * caller (Bosla's upload flow) is expected to prompt the user rather than silently
 * proceed on empty extraction, per that PRD requirement.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<CvExtractionResult> {
  try {
    const parsed = await pdfParse(buffer)
    const cleaned = parsed.text.trim()

    if (!cleaned) {
      return { text: '', truncated: false, ok: false, error: 'no_extractable_text' }
    }

    const truncated = cleaned.length > CV_TEXT_MAX_CHARS
    const text = truncated
      ? `${cleaned.slice(0, CV_TEXT_MAX_CHARS)}\n...[Truncated for brevity]`
      : cleaned

    return { text, truncated, ok: true, error: null }
  } catch (err) {
    return {
      text: '',
      truncated: false,
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
