import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { OnboardingHeader } from '../components/OnboardingHeader'

export function CvUpload() {
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{
    text: string
    truncated: boolean
    ok: boolean
    error: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function onFile(f: File) {
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB. Please choose a smaller PDF.')
      return
    }
    setFile(f)
    setBusy(true)
    setError(null)
    try {
      const res = await api.uploadCv(f)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload this CV. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function removeFile() {
    setFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased">
      <OnboardingHeader currentStep={2} />

      {/* Main Canvas */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col py-12 px-6 pt-24">
        {/* Header Title & Sub-line */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="rounded bg-[#E7EEFF] px-2 py-0.5 font-body text-[11px] uppercase text-[#1E3A8A]">
              Orientation Input
            </span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0F1115]">
            Add your CV (optional)
          </h1>
          <p className="mt-1 font-body text-[14px] text-[#45474B]">
            It helps us ground the recommendation in what you've actually done.
          </p>
        </div>

        <div className="space-y-6">
          {/* Main Content Card */}
          <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />

            {/* Large Dashed Drop Zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const f = e.dataTransfer.files?.[0]
                if (f) onFile(f)
              }}
              className="group cursor-pointer rounded-lg border-2 border-dashed border-[#E6E7EA] bg-[#F9F9FF] p-8 text-center transition-colors hover:border-[#1E3A8A]"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7EEFF] text-[#1E3A8A] transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[26px]">upload_file</span>
              </div>
              <p className="font-body text-[16px] font-medium text-[#0F1115]">
                {busy ? 'Extracting text…' : 'Drop a PDF here or browse'}
              </p>
              <p className="mt-1 font-body text-[12px] text-[#5B6270]">PDF up to 10 MB</p>
            </div>

            {/* File Attached & Extracted Text Card */}
            {file && (
              <div className="mt-6 border-t border-[#E6E7EA] pt-6">
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[#E6E7EA] bg-[#F0F3FF] p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="material-symbols-outlined flex-shrink-0 text-[#1E3A8A] fill-icon"
                      data-icon="description"
                    >
                      description
                    </span>
                    <div className="truncate">
                      <p className="truncate font-body text-[14px] font-medium text-[#0F1115]">
                        {file.name}
                      </p>
                      <p className="font-body text-[11px] text-[#5B6270]">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label="Remove attached file"
                    className="rounded p-1 text-[#5B6270] transition-colors hover:bg-[#E7EEFF] hover:text-[#0F1115]"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Read-only preview box: Extracted text */}
                {result?.ok && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-body text-[12px] font-medium uppercase tracking-wider text-[#5B6270]">
                        Extracted text
                      </span>
                      <span className="font-body text-[11px] text-[#1E3A8A]">Verified OCR output</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-[#E6E7EA] bg-[#F9F9FF] p-3 font-mono text-[12px] leading-5 select-text text-[#45474B]">
                      {result.text}
                    </div>
                    {result.truncated && (
                      <p className="mt-2 text-right font-body text-[11px] text-[#5B6270]">
                        Truncated to 7,000 characters.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && <p className="mt-3 text-[13px] text-[#DC2626]">{error}</p>}
          </section>

          {/* Scanned PDF Warning Notice */}
          {result && !result.ok && (
            <section
              className="flex items-start gap-3 rounded-lg border border-[#F59E0B] bg-[#FEF3C7]/40 p-4"
              role="status"
            >
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[20px] text-[#B45309] fill-icon">
                warning
              </span>
              <div className="space-y-0.5">
                <h2 className="font-body text-[14px] font-medium text-[#B45309]">
                  Scanned PDF notice
                </h2>
                <p className="font-body text-[14px] text-[#653E00]">
                  {result.error === 'no_extractable_text'
                    ? "We couldn't read text from this PDF — it may be a scanned image. Try another file or skip."
                    : `Could not read this file (${result.error}). Try another file or skip.`}
                </p>
              </div>
            </section>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/onboarding/discovery')}
              className="h-10 rounded-lg border border-[#0F1115] bg-white px-5 font-body text-[14px] font-medium text-[#0F1115] transition-colors hover:bg-[#F0F3FF]"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => navigate('/onboarding/discovery')}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0F1115] px-6 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>

      {/* Quiet Brand Baseline Footer */}
      <footer className="border-t border-[#E6E7EA] py-6 text-center font-body text-[11px] text-[#5B6270]">
        Bosla Career Navigation Platform · Encrypted storage and automated PII scrubbing applied
      </footer>
    </div>
  )
}
