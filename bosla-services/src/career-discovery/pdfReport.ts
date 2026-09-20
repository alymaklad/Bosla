// Ported from the Masar.ai notebook, Cell 6/7 ("Document Compilation Microservice"),
// `generate_pdf_report` / `sanitize_text_for_reportlab` / `build_fallback_pdf`. Same
// structure, same colors, same section order and fallback-on-error behavior; ReportLab's
// PLATYPUS flowables (`SimpleDocTemplate`, `Paragraph`, `HRFlowable`) are replaced with
// pdfkit's imperative drawing API, which is the substitution this port makes — the
// notebook's markdown-bold sanitizing is reimplemented as inline bold-run rendering
// instead of `<b>` HTML tags, since pdfkit has no HTML paragraph flowable to hand it to.
import PDFDocument from 'pdfkit'
import type { ChatHistoryEntry } from './types.js'

// Colors carried over from the notebook's ReportLab styles, verbatim.
const COLOR_TITLE = '#1E3A8A'
const COLOR_H1 = '#1E40AF'
const COLOR_BODY = '#1F2937'

/**
 * Splits `**bold**` markdown into plain/bold runs so they can be drawn as separate
 * `pdfkit` text() calls on the same flowing line — the closest imperative-API analog to
 * ReportLab's `<b>` tag inside a `Paragraph`. Unlike the notebook's regex-based HTML
 * escaping (which only needs to protect against ReportLab's XML parser), this returns
 * structured runs because pdfkit has no markup parser to hand a string to at all.
 */
function splitBoldRuns(text: string): { text: string; bold: boolean }[] {
  const runs: { text: string; bold: boolean }[] = []
  const re = /\*\*(.*?)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false })
    runs.push({ text: m[1] ?? '', bold: true })
    last = re.lastIndex
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false })
  return runs.length > 0 ? runs : [{ text, bold: false }]
}

function writeMarkdownParagraph(
  doc: PDFKit.PDFDocument,
  text: string,
  opts: { font: string; boldFont: string; size: number; color: string }
): void {
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      doc.moveDown(0.4)
      continue
    }
    for (const run of splitBoldRuns(line)) {
      if (!run.text) continue
      doc
        .font(run.bold ? opts.boldFont : opts.font)
        .fontSize(opts.size)
        .fillColor(opts.color)
        .text(run.text, { continued: true })
    }
    doc.text('', { continued: false })
  }
}

export interface PdfReportInput {
  studentName: string | null
  assessmentText: string | null
  chatHistory: ChatHistoryEntry[]
}

/** Renders the chat transcript the same way the notebook stringified `chat_history` before sanitizing it. */
function renderChatHistory(history: ChatHistoryEntry[]): string {
  if (history.length === 0) return ''
  return history.map((h) => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${h.content}`).join('\n\n')
}

/**
 * Builds the "Masar AI — Career & Mentorship Report" PDF and resolves with its bytes.
 *
 * [Bosla PRD §11.5 FR-CD-034] "The saveable/downloadable summary shall be exportable as
 * a formatted PDF report, mirroring Masar.ai's confirmed report-compilation agent."
 * Returns a Buffer rather than writing a fixed filename to disk (the notebook's
 * `Masar_AI_Career_Report.pdf`) — Bosla's real backend decides where a generated report
 * is stored (object storage, per Bosla PRD §23 "Object storage" row), this module's job
 * ends at producing correct bytes.
 */
export async function generatePdfReport(input: PdfReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 40, right: 40 } })
      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const safeName = input.studentName?.trim() || 'Student'

      // --- Header ---
      doc.font('Helvetica-Bold').fontSize(22).fillColor(COLOR_TITLE).text('Masar AI — Career & Mentorship Report')
      doc.moveDown(0.3)
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_BODY).text('Candidate: ', { continued: true })
      doc.font('Helvetica').text(safeName)
      doc.moveDown(0.4)
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .lineWidth(1.5)
        .strokeColor(COLOR_TITLE)
        .stroke()
      doc.moveDown(0.8)

      // --- Section 1: Assessment ---
      doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR_H1).text('1. Career Assessment & Skill Gap Roadmap')
      doc.moveDown(0.4)
      if (input.assessmentText?.trim()) {
        writeMarkdownParagraph(doc, input.assessmentText, {
          font: 'Helvetica',
          boldFont: 'Helvetica-Bold',
          size: 9.5,
          color: COLOR_BODY
        })
      } else {
        doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COLOR_BODY).text('No assessment data recorded.')
      }
      doc.moveDown(0.6)

      // --- Section 2: Mentorship transcript ---
      doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR_H1).text('2. Interactive Mentorship Q&A Transcript')
      doc.moveDown(0.4)
      const chatText = renderChatHistory(input.chatHistory)
      if (chatText.trim()) {
        writeMarkdownParagraph(doc, chatText, {
          font: 'Helvetica',
          boldFont: 'Helvetica-Bold',
          size: 9.5,
          color: COLOR_BODY
        })
      } else {
        doc
          .font('Helvetica-Oblique')
          .fontSize(9.5)
          .fillColor(COLOR_BODY)
          .text('No Q&A mentorship session was recorded for this report.')
      }

      doc.end()
    } catch (err) {
      // Mirrors the notebook's `build_fallback_pdf` intent (never let styling errors lose
      // the report) — reject with the original error rather than silently producing a
      // blank PDF; the caller decides whether to retry with a plainer render.
      reject(err)
    }
  })
}
