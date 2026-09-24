import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DocumentSourceType, type OcrStatus, type PersonalDocument } from '../api'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { OnboardingHeader } from '../components/OnboardingHeader'
import { PageLoading } from '../components/PageLoading'

const DOCUMENT_TYPES: { value: DocumentSourceType; label: string; icon: string }[] = [
  { value: 'cv', label: 'CV', icon: 'description' }, { value: 'resume', label: 'Resume', icon: 'article' },
  { value: 'recommendation', label: 'Recommendation letter', icon: 'mail' }, { value: 'certificate', label: 'Certificate', icon: 'workspace_premium' },
  { value: 'project', label: 'Project documentation', icon: 'folder_open' }, { value: 'thoughts', label: 'Thoughts / notes', icon: 'edit_note' },
  { value: 'journal', label: 'Daily journal', icon: 'menu_book' }, { value: 'other', label: 'Other career evidence', icon: 'attach_file' },
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
  const [loading, setLoading] = useState(true)
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function refreshDocuments() {
    try { setDocuments(await api.listDocuments()) } catch { /* optional during onboarding */ }
  }

  useEffect(() => {
    let active = true
    void Promise.allSettled([api.listDocuments(), api.ocrStatus()]).then(([documentsResult, ocrResult]) => {
      if (!active) return
      if (documentsResult.status === 'fulfilled') setDocuments(documentsResult.value)
      if (ocrResult.status === 'fulfilled') setOcrStatus(ocrResult.value)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <PageLoading label="Loading your private context…" />

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

  async function clearAllDocuments() {
    setError(null)
    setClearing(true)
    try {
      await api.deleteAllDocuments()
      setDocuments([])
      setLastPreview(null)
      setNotice(null)
      setConfirmingClear(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear your saved sources.')
      setConfirmingClear(false)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased">
      <OnboardingHeader currentStep={2} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-12 pt-24">
        <section className="mb-7 rounded-2xl border border-[#DCE3F2] bg-[#F7F9FF] p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="max-w-2xl">
              <span className="rounded-full bg-[#E1E9FF] px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-[#1E3A8A]">Career context</span>
              <h1 className="mt-3 font-display text-[30px] font-bold tracking-tight text-[#0F1115]">Build a fuller picture of your career</h1>
              <p className="mt-2 font-body text-[14px] leading-relaxed text-[#45474B]">Add documents, project work, personal reflections, and a public GitHub profile. Bosla uses relevant excerpts to personalize guidance; your conversation still determines your matches.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#DCE3F2] bg-white px-4 py-3">
              <span className="material-symbols-outlined text-[20px] text-[#1E3A8A]">folder_shared</span>
              <div><p className="font-body text-[18px] font-semibold text-[#0F1115]">{documents.length}</p><p className="font-body text-[11px] text-[#5B6270]">source{documents.length === 1 ? '' : 's'} indexed</p></div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-[#DCE3F2] pt-5 sm:grid-cols-3">
            <p className="flex items-center gap-2 font-body text-[12px] text-[#45474B]"><span className="material-symbols-outlined text-[17px] text-[#1E3A8A]">category</span>Choose a source category</p>
            <p className="flex items-center gap-2 font-body text-[12px] text-[#45474B]"><span className="material-symbols-outlined text-[17px] text-[#1E3A8A]">lock</span>Private to your Bosla account</p>
            <p className="flex items-center gap-2 font-body text-[12px] text-[#45474B]"><span className="material-symbols-outlined text-[17px] text-[#1E3A8A]">forum</span>Return to your conversation anytime</p>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-[#E6E7EA] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Add documents</h2><p className="mt-1 font-body text-[12px] text-[#5B6270]">PDF, DOCX, or TXT · up to 10 MB each</p></div>
              <label className="font-body text-[11px] font-medium text-[#45474B]">Category
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentSourceType)} className="mt-1 block h-9 cursor-pointer rounded-lg border border-[#D8DCE3] bg-white px-2 font-body text-[12px] text-[#0F1115] outline-none transition-colors hover:border-[#1E3A8A] focus:border-[#1E3A8A]">
                  {DOCUMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
            <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
            <div onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); event.stopPropagation() }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files) }} className="group mt-5 cursor-pointer rounded-xl border-2 border-dashed border-[#CDD6EA] bg-[#F9FAFF] p-7 text-center transition-all hover:border-[#1E3A8A] hover:bg-[#F2F5FF]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7EEFF] text-[#1E3A8A] transition-transform group-hover:scale-105"><span className="material-symbols-outlined text-[26px]">upload_file</span></div>
              <p className="font-body text-[15px] font-semibold text-[#0F1115]">{busy ? 'Extracting and indexing documents…' : `Drop ${labelFor(documentType).toLowerCase()} files here`}</p>
              <p className="mt-1 font-body text-[12px] text-[#5B6270]">or choose files from your device</p>
              <button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }} className="mt-4 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#1E3A8A] bg-white px-3 font-body text-[12px] font-semibold text-[#1E3A8A] transition-colors hover:bg-[#E8EDF9] disabled:cursor-not-allowed disabled:opacity-60"><span className="material-symbols-outlined text-[16px]">add</span>Browse files</button>
            </div>
            <div className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 font-body text-[12px] ${ocrStatus?.configured ? 'bg-[#F0FDF4] text-[#166534]' : 'bg-[#F8FAFC] text-[#5B6270]'}`}>
              <span className="material-symbols-outlined mt-0.5 text-[16px]">{ocrStatus?.configured ? 'verified' : 'info'}</span>
              <p>{ocrStatus?.configured ? `${ocrStatus.provider} is configured for scanned PDFs. Text-based documents are extracted directly.` : 'Text-based documents are extracted directly. Add an OCR provider to read scanned PDFs.'}</p>
            </div>
          </section>

          <section className="rounded-xl border border-[#E6E7EA] bg-white p-6">
            <div className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-[23px] text-[#1E3A8A]">account_tree</span><div><h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Import a GitHub profile</h2><p className="mt-1 font-body text-[12px] leading-relaxed text-[#5B6270]">Bring in public profile details and relevant files from recent non-fork projects. Bosla never executes code or accesses private repositories.</p></div></div>
            <div className="mt-6"><label htmlFor="github-profile" className="font-body text-[11px] font-medium text-[#45474B]">Public profile URL</label><div className="mt-1.5 flex gap-2"><input id="github-profile" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void importGithub() } }} placeholder="https://github.com/your-name" className="h-10 min-w-0 flex-1 rounded-lg border border-[#D8DCE3] px-3 font-body text-[13px] outline-none transition-colors focus:border-[#1E3A8A]" /><button type="button" disabled={!githubUrl.trim() || githubBusy} onClick={() => void importGithub()} className="h-10 cursor-pointer rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-semibold text-white transition-colors hover:bg-[#252936] disabled:cursor-not-allowed disabled:opacity-50">{githubBusy ? 'Importing…' : 'Import'}</button></div></div>
            <div className="mt-5 rounded-lg bg-[#F8FAFC] p-3 font-body text-[12px] leading-relaxed text-[#5B6270]">For a reliable MVP import, Bosla checks up to 12 recent public projects and up to 80 supported files in total.</div>
          </section>
        </div>

        <div className="mt-5 space-y-5">
          {notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 font-body text-[13px] text-[#1E3A8A]"><span className="material-symbols-outlined text-[18px]">check_circle</span>{notice}</p>}
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 font-body text-[13px] leading-relaxed text-[#B91C1C]"><span className="material-symbols-outlined text-[18px]">error</span>{error}</p>}

          {lastPreview?.text && <section className="rounded-xl border border-[#E6E7EA] bg-white p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-[16px] font-semibold text-[#0F1115]">Latest extracted text</h2><p className="mt-1 font-body text-[12px] text-[#5B6270]">A preview of what Bosla can retrieve for your guidance.</p></div><span className="rounded-full bg-[#E8EDF9] px-2.5 py-1 font-body text-[11px] font-medium text-[#1E3A8A]">{lastPreview.extraction_method === 'ocr' ? 'Read with OCR' : 'Read directly'}</span></div><div className="max-h-44 overflow-y-auto rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-3 font-mono text-[12px] leading-5 text-[#45474B]">{lastPreview.text}</div></section>}

          <section className="rounded-xl border border-[#E6E7EA] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Your saved context</h2><p className="mt-1 font-body text-[12px] text-[#5B6270]">Remove any source at any time.</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#F0F1F3] px-2.5 py-1 font-body text-[11px] font-medium text-[#45474B]">{documents.length} item{documents.length === 1 ? '' : 's'}</span>{documents.length > 0 && <button type="button" onClick={() => setConfirmingClear(true)} className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E6E7EA] px-2.5 font-body text-[12px] font-medium text-[#45474B] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"><span className="material-symbols-outlined text-[17px]">delete_sweep</span>Clear all</button>}</div></div>{documents.length > 0 ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{documents.map((document) => <li key={document.id} className="flex items-center gap-3 rounded-lg border border-[#E6E7EA] p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#1E3A8A]"><span className="material-symbols-outlined text-[19px]">{document.source_url ? 'code' : DOCUMENT_TYPES.find((item) => item.value === document.source_type)?.icon ?? 'description'}</span></span><div className="min-w-0 flex-1"><p className="truncate font-body text-[13px] font-semibold text-[#0F1115]">{document.filename}</p><p className="mt-0.5 font-body text-[11px] text-[#5B6270]">{labelFor(document.source_type)} · {document.chunk_count} retrieval chunk{document.chunk_count === 1 ? '' : 's'}</p></div><button type="button" onClick={() => void removeDocument(document.id)} className="cursor-pointer rounded-md p-1.5 text-[#5B6270] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]" aria-label={`Remove ${document.filename}`}><span className="material-symbols-outlined text-[18px]">close</span></button></li>)}</ul> : <div className="mt-4 rounded-lg border border-dashed border-[#D8DCE3] px-4 py-6 text-center"><span className="material-symbols-outlined text-[24px] text-[#8A8F98]">folder_open</span><p className="mt-2 font-body text-[13px] font-medium text-[#45474B]">No sources saved yet</p><p className="mt-1 font-body text-[12px] text-[#5B6270]">Start with a document or public GitHub profile.</p></div>}</section>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><p className="font-body text-[12px] text-[#5B6270]">You can add more context later from discovery.</p><button type="button" onClick={() => navigate('/onboarding/discovery')} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-semibold text-white transition-colors hover:bg-[#252936]"><span>Continue to conversation</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></button></div>
        </div>
      </main>
      <ConfirmDialog
        open={confirmingClear}
        title="Clear all saved context?"
        description={`This removes all ${documents.length} saved source${documents.length === 1 ? '' : 's'}, including uploaded documents and imported GitHub files.`}
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        note="Bosla will stop using these sources to personalize guidance. Your conversations, matches, and roadmap are not affected."
        busy={clearing}
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => void clearAllDocuments()}
      />
      <footer className="border-t border-[#E6E7EA] py-6 text-center font-body text-[11px] text-[#5B6270]">Your documents are indexed only for your own Bosla guidance. You can remove them at any time.</footer>
    </div>
  )
}
