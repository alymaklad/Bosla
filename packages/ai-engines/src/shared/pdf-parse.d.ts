// `pdf-parse` ships no types. Minimal ambient declaration covering the single call
// cvIngestion.ts makes.
declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: unknown
    version: string
  }
  function pdfParse(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>
  export = pdfParse
}
