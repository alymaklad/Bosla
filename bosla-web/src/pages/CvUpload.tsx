import { FileText, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export function CvUpload() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ text: string; truncated: boolean; ok: boolean; error: string | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function onFile(file: File) {
    setBusy(true)
    try {
      const res = await api.uploadCv(file)
      setResult(res)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-[26px] font-semibold">Have a CV? Upload it.</h1>
      <p className="mt-1 text-text-2">Optional — it gives Bosla more to work with, but you can skip this.</p>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-6 flex h-32 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-white text-text-2 hover:border-ink hover:text-ink"
      >
        <Upload size={24} />
        <span className="text-[14px] font-medium">{busy ? 'Extracting…' : 'Click to upload a PDF résumé'}</span>
      </button>

      {result && (
        <div className="mt-4 rounded-card border border-line p-4">
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
                <FileText size={16} /> Extracted {result.truncated ? '(truncated to fit)' : ''}
              </div>
              <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[12px] leading-5 text-text-2">
                {result.text.slice(0, 600)}
                {result.text.length > 600 ? '…' : ''}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-danger">
              {result.error === 'no_extractable_text'
                ? "This looks like a scanned PDF with no selectable text — Bosla can't read it. You can skip this step and continue."
                : `Could not read this file (${result.error}). You can skip this step and continue.`}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/onboarding/discovery')}
          className="h-11 flex-1 rounded-card border border-line bg-white text-[15px] font-medium text-ink hover:bg-page"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => navigate('/onboarding/discovery')}
          className="h-11 flex-1 rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
