/** Keep multipart uploads below the Vercel Function request-body limit. */
export const DIRECT_UPLOAD_LIMIT = 4_000_000
export const MAX_PDF_INPUT_BYTES = 10 * 1024 * 1024

export interface PreparedDocument {
  file: File
  originalFilename?: string
  note?: string
}

async function canvasJpeg(canvas: HTMLCanvasElement, quality: number): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not compress this PDF page.')), 'image/jpeg', quality)
  })
  return blob.arrayBuffer()
}

export async function prepareDocument(file: File): Promise<PreparedDocument> {
  if (file.size <= DIRECT_UPLOAD_LIMIT) return { file }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('This file is too large for the current upload service. DOCX, TXT, and MD files must be under 4 MB.')
  }
  if (file.size > MAX_PDF_INPUT_BYTES) {
    throw new Error('PDFs must be 10 MB or smaller. Split or compress this file before uploading.')
  }

  const [pdfjs, { PDFDocument }, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdf-lib'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  try {
    const source = await task.promise
    if (!source.numPages) throw new Error('This PDF has no readable pages.')

    // Keep searchable text when every substantive page already has a text layer.
    const textPages: string[] = []
    let textBearingPages = 0
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index)
      const content = await page.getTextContent()
      const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ').trim()
      if (text.length >= 30) textBearingPages += 1
      textPages.push(text)
      page.cleanup()
    }
    if (textBearingPages >= Math.max(1, Math.ceil(source.numPages * 0.8))) {
      const textFile = new File([textPages.join('\n\n')], file.name.replace(/\.pdf$/i, '.txt'), { type: 'text/plain' })
      if (textFile.size > DIRECT_UPLOAD_LIMIT) {
        throw new Error('The extracted text is too large to upload. Split this PDF into smaller documents.')
      }
      return { file: textFile, originalFilename: file.name, note: 'Text extracted locally from the PDF before upload.' }
    }

    // Image-only PDFs need OCR. Re-encode pages locally so the private PDF never
    // exceeds the request limit on its way to the server.
    for (const [scale, quality] of [[1.7, 0.8], [1.3, 0.65], [1, 0.52]]) {
      const output = await PDFDocument.create()
      for (let index = 1; index <= source.numPages; index += 1) {
        const page = await source.getPage(index)
        const base = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(scale, 2600 / Math.max(base.width, base.height)) })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error('Your browser could not prepare this PDF for OCR.')
        await page.render({ canvas, canvasContext: context, viewport, background: 'rgb(255,255,255)' }).promise
        const image = await output.embedJpg(await canvasJpeg(canvas, quality))
        const outputPage = output.addPage([base.width, base.height])
        outputPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height })
        canvas.width = 0
        canvas.height = 0
        page.cleanup()
      }
      const bytes = await output.save({ useObjectStreams: true })
      if (bytes.length <= DIRECT_UPLOAD_LIMIT) {
        return {
          file: new File([bytes as BlobPart], file.name, { type: 'application/pdf' }),
          note: 'Scanned PDF optimized locally for OCR before upload.',
        }
      }
    }
    throw new Error('This scanned PDF is still too large after optimization. Split it into smaller PDFs and try again.')
  } catch (err) {
    if (err instanceof Error && /password/i.test(err.message)) {
      throw new Error('This PDF is password-protected. Remove its password before uploading.')
    }
    throw err
  } finally {
    await task.destroy()
  }
}
