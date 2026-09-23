import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DocumentSourceType, type PersonalDocument } from '../api'
import { OnboardingHeader } from '../components/OnboardingHeader'

const DOCUMENT_TYPES: { value: DocumentSourceType; label: string }[] = [
  { value: 'cv', label: 'CV' }, { value: 'resume', label: 'Resume' },
  { value: 'recommendation', label: 'Recommendation letter' }, { value: 'certificate', label: 'Certificate' },
  { value: 'project', label: 'Project documentation' }, { value: 'thoughts', label: 'Thoughts / notes' },
  { value: 'journal', label: 'Daily journal' }, { value: 'other', label: 'Other career evidence' },
]

function labelFor(type: DocumentSourceType) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? 'Document'
}

export function CvUpload() {
  const [busy, setBusy] = useState(false)
  const [documents, setDocuments] = useState<PersonalDocument[]>([])
  const [documentType, setDocumentType] = useState<DocumentSourceType>('cv')
  const [githubUrl, setGithubUrl] = useState('')
  const [githubBusy, setGithubBusy] = useState(false)
  const [lastPreview, setLastPreview] = useState<PersonalDocument | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function refreshDocuments() {
    try { setDocuments(await api.listDocuments()) } catch { /* optional during onboarding */ }
  }

  useEffect(() => {
    let active = true
    api.listDocuments().then((items) => {
      if (active) setDocuments(items)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files)
    if (!selected.length || busy) return
    if (selected.some((file) => file.size > 10 * 1024 * 1024)) {
      setError('Each document must be 10 MB or smaller.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      let newest: PersonalDocument | null = null
      for (const file of selected) newest = await api.uploadDocument(file, documentType)
      setLastPreview(newest)
      await refreshDocuments()
      setNotice(`${selected.length} document${selected.length === 1 ? '' : 's'} added to your private career context.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add these documents. Please retry.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function importGithub() {
    const profileUrl = githubUrl.trim()
    if (!profileUrl || githubBusy) return
    setGithubBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await api.importGithubProfile(profileUrl)
      await refreshDocuments()
      setGithubUrl('')
      setNotice(`${result.sources_indexed} GitHub source${result.sources_indexed === 1 ? '' : 's'} indexed from your profile and ${result.repositories_imported} project${result.repositories_imported === 1 ? '' : 's'}.${result.files_skipped ? ` ${result.files_skipped} files were skipped.` : ''}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that GitHub profile.')
    } finally {
      setGithubBusy(false)
    }
  }

  async function removeDocument(id: string) {
    setError(null)
    try {
      await api.deleteDocument(id)
      setDocuments((current) => current.filter((document) => document.id !== id))
      if (lastPreview?.id === id) setLastPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this document.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased">
      <OnboardingHeader currentStep={2} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-12 pt-24">
        <div className="mb-8">
          <span className="rounded bg-[#E7EEFF] px-2 py-0.5 font-body text-[11px] uppercase text-[#1E3A8A]">Career evidence</span>
          <h1 className="mt-3 font-display text-[28px] font-bold tracking-tight text-[#0F1115]">Add what tells your story</h1>
          <p className="mt-1 font-body text-[14px] leading-relaxed text-[#45474B]">Add a CV, certificates, project notes, or a public GitHub profile. Bosla retrieves relevant excerpts to personalize guidance, while the conversation still determines your matches.</p>
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-display text-[17px] font-semibold text-[#0F1115]">Documents</h2><p className="mt-1 font-body text-[12px] text-[#5B6270]">PDF, DOCX, or TXT · up to 10 MB each</p></div>
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentSourceType)} className="h-9 rounded-lg border border-[#E6E7EA] bg-white px-2 font-body text-[12px] text-[#0F1115] outline-none focus:border-[#1E3A8A]">
                {DOCUMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
            <div onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); event.stopPropagation() }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files) }} className="group cursor-pointer rounded-lg border-2 border-dashed border-[#E6E7EA] bg-[#F9F9FF] p-7 text-center transition-colors hover:border-[#1E3A8A]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7EEFF] text-[#1E3A8A] group-hover:scale-105"><span className="material-symbols-outlined text-[26px]">upload_file</span></div>
              <p className="font-body text-[15px] font-medium text-[#0F1115]">{busy ? 'Extracting and indexing documents…' : `Drop ${labelFor(documentType).toLowerCase()} files here or browse`}</p>
              <p className="mt-1 font-body text-[12px] text-[#5B6270]">Scanned PDFs use OCR when a configured fallback is available.</p>
            </div>
          </section>

          <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-[22px] text-[#0F1115]">code</span><div className="min-w-0 flex-1"><h2 className="font-display text-[17px] font-semibold text-[#0F1115]">Import a GitHub profile</h2><p className="mt-1 font-body text-[12px] leading-relaxed text-[#5B6270]">Bosla reads public profile details plus recent, non-fork project documentation and supported text files. It never executes code or accesses private repositories.</p><div className="mt-3 flex gap-2"><input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void importGithub() } }} placeholder="https://github.com/owner" className="h-10 min-w-0 flex-1 rounded-lg border border-[#E6E7EA] px-3 font-body text-[13px] outline-none focus:border-[#1E3A8A]" /><button type="button" disabled={!githubUrl.trim() || githubBusy} onClick={() => void importGithub()} className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white hover:bg-[#1C1F26] disabled:opacity-50">{githubBusy ? 'Importing…' : 'Import'}</button></div><p className="mt-2 font-body text-[11px] leading-relaxed text-[#5B6270]">For a reliable MVP import, Bosla checks up to 12 recent public projects and up to 80 supported files in total.</p></div></div>
          </section>

          {notice && <p className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 font-body text-[13px] text-[#1E3A8A]">{notice}</p>}
          {error && <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 font-body text-[13px] text-[#B91C1C]">{error}</p>}

          {lastPreview?.text && <section className="rounded-lg border border-[#E6E7EA] bg-white p-5"><div className="mb-2 flex items-center justify-between"><span className="font-body text-[12px] font-medium uppercase tracking-wider text-[#5B6270]">Latest extracted text</span><span className="font-body text-[11px] text-[#1E3A8A]">{lastPreview.extraction_method === 'ocr' ? 'OCR fallback' : 'Native extraction'}</span></div><div className="max-h-40 overflow-y-auto rounded-lg border border-[#E6E7EA] bg-[#F9F9FF] p-3 font-mono text-[12px] leading-5 text-[#45474B]">{lastPreview.text}</div></section>}

          {documents.length > 0 && <section className="rounded-lg border border-[#E6E7EA] bg-white p-5"><h2 className="mb-3 font-display text-[17px] font-semibold text-[#0F1115]">Added to your private context</h2><ul className="divide-y divide-[#E6E7EA]">{documents.map((document) => <li key={document.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="material-symbols-outlined text-[19px] text-[#1E3A8A]">{document.source_url ? 'code' : 'description'}</span><div className="min-w-0 flex-1"><p className="truncate font-body text-[13px] font-medium text-[#0F1115]">{document.filename}</p><p className="font-body text-[11px] text-[#5B6270]">{labelFor(document.source_type)} · {document.chunk_count} retrieval chunk{document.chunk_count === 1 ? '' : 's'}</p></div><button type="button" onClick={() => void removeDocument(document.id)} className="rounded p-1 text-[#5B6270] hover:bg-[#FEF2F2] hover:text-[#B91C1C]" aria-label={`Remove ${document.filename}`}><span className="material-symbols-outlined text-[18px]">close</span></button></li>)}</ul></section>}

          <div className="flex items-center justify-between gap-4 pt-3"><button type="button" onClick={() => navigate('/onboarding/discovery')} className="h-10 rounded-lg border border-[#0F1115] bg-white px-5 font-body text-[14px] font-medium text-[#0F1115] hover:bg-[#F0F3FF]">Skip for now</button><button type="button" onClick={() => navigate('/onboarding/discovery')} className="flex h-10 items-center gap-2 rounded-lg bg-[#0F1115] px-6 font-body text-[14px] font-medium text-white hover:bg-[#1C1F26]"><span>Continue to conversation</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></button></div>
        </div>
      </main>
      <footer className="border-t border-[#E6E7EA] py-6 text-center font-body text-[11px] text-[#5B6270]">Your documents are indexed only for your own Bosla guidance. You can remove them at any time.</footer>
    </div>
  )
}
