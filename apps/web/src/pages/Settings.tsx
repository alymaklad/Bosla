import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type AiStatus, type GoogleSyncStatus } from '../api'
import { useApp } from '../context/AppContext'

type SettingsTab = 'account' | 'privacy' | 'integrations' | 'ai'

export function Settings() {
  const { user, signOut } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>(searchParams.has('google') ? 'integrations' : 'privacy')
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleSyncStatus | null>(null)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [googleMessage, setGoogleMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.aiStatus().then(setAiStatus).catch(() => {})
    api.googleSyncStatus().then(setGoogleStatus).catch(() => {})
  }, [])

  if (!user) return null

  async function removeAccount() {
    if (
      !window.confirm(
        'Delete your account and all career, CV, habit, and chat data? This cannot be undone.',
      )
    )
      return
    try {
      await api.deleteAccount()
      navigate('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete account. Please try again.')
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const data = await api.dashboard()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bosla-export-${user?.id ?? 'user'}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const initial = (user.name || user.email || 'A').slice(0, 1).toUpperCase()
  const displayName = user.name || user.email.split('@')[0]
  const personaLabels: Record<string, string> = {
    student: 'Secondary-school student',
    university: 'University student',
    graduate: 'Recent graduate',
    switcher: 'Shifting career',
  }
  const personaTrack = user.persona ? personaLabels[user.persona] || user.persona : 'Direction not selected'

  async function syncGoogle() {
    setSyncingGoogle(true)
    setGoogleMessage(null)
    try {
      const result = await api.syncGoogle()
      setGoogleMessage(`Synced ${result.occurrences} habit occurrences. Imported ${result.imported_completions} completion update${result.imported_completions === 1 ? '' : 's'}.`)
      setGoogleStatus(await api.googleSyncStatus())
    } catch (err) {
      setGoogleMessage(err instanceof Error ? err.message : 'Google sync failed. Please retry.')
    } finally {
      setSyncingGoogle(false)
    }
  }

  async function disconnectGoogle() {
    if (!window.confirm('Disconnect Google Calendar and Tasks? Existing Google events and tasks will remain.')) return
    setGoogleMessage(null)
    try {
      await api.disconnectGoogle()
      setGoogleStatus(await api.googleSyncStatus())
      setGoogleMessage('Google Calendar and Tasks disconnected.')
    } catch (err) {
      setGoogleMessage(err instanceof Error ? err.message : 'Could not disconnect Google.')
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Top Profile Overview Card */}
      <div className="mb-8 flex flex-col justify-between gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#0F1115] font-display text-[26px] font-bold text-white">
            {initial}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[22px] font-bold text-[#0F1115]">{displayName}</h1>
              <span className="rounded bg-[#E7EEFF] px-2.5 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                {personaTrack}
              </span>
            </div>
            <p className="font-body text-[14px] text-[#5B6270]">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
            className="flex items-center gap-2 rounded-lg border border-[#E6E7EA] bg-white px-4 py-2 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Settings 2-Column Framework */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Sub-Navigation Menu (3 cols) */}
        <nav className="space-y-1 rounded-lg border border-[#E6E7EA] bg-white p-2 lg:col-span-3">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 font-body text-[13px] font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                : 'text-[#5B6270] hover:bg-[#FAFAF8] hover:text-[#0F1115]'
            }`}
          >
            <span>Data &amp; privacy</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 font-body text-[13px] font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                : 'text-[#5B6270] hover:bg-[#FAFAF8] hover:text-[#0F1115]'
            }`}
          >
            <span>Calendar &amp; Tasks</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 font-body text-[13px] font-medium transition-colors ${
              activeTab === 'account'
                ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                : 'text-[#5B6270] hover:bg-[#FAFAF8] hover:text-[#0F1115]'
            }`}
          >
            <span>Account Details</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 font-body text-[13px] font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                : 'text-[#5B6270] hover:bg-[#FAFAF8] hover:text-[#0F1115]'
            }`}
          >
            <span>AI &amp; Models</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </nav>

        {/* Right Content Panel (9 cols) */}
        <div className="space-y-6 lg:col-span-9">
          {activeTab === 'privacy' && (
            <>
              {/* Section Title Header */}
              <div className="border-b border-[#E6E7EA] pb-4">
                <h2 className="font-display text-[20px] font-semibold text-[#0F1115]">
                  Data &amp; privacy
                </h2>
                <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                  Export or delete the profile, career, and habit data stored for your account.
                </p>
              </div>

              {/* Data Sovereignty Card */}
              <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
                <div className="border-b border-[#E6E7EA] pb-4">
                  <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">
                    Data Sovereignty &amp; Export
                  </h3>
                  <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                    Bosla operates with strict boundaries. Your career answers and habit logs belong to you.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 py-5">
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={exportData}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#0F1115] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>{exporting ? 'Preparing export…' : 'Export my data'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={removeAccount}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DC2626] bg-white px-4 font-body text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#FFDAD6]/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Delete my account</span>
                  </button>
                </div>

                <p className="font-body text-[11px] text-[#8A8F98]">
                  Export format includes JSON habit logs, assessment parameters, and PDF roadmap synthesis.
                </p>
              </section>

            </>
          )}

          {activeTab === 'account' && (
            <>
              <div className="border-b border-[#E6E7EA] pb-4">
                <h2 className="font-display text-[20px] font-semibold text-[#0F1115]">
                  Account Details
                </h2>
                <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                  Manage your personal details and authentication methods.
                </p>
              </div>

              <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
                <dl className="space-y-3 font-body text-[14px]">
                  <div className="flex justify-between border-b border-[#E6E7EA] pb-3">
                    <dt className="text-[#5B6270]">Full Name</dt>
                    <dd className="font-medium text-[#0F1115]">{user.name || '—'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[#E6E7EA] pb-3">
                    <dt className="text-[#5B6270]">Email Address</dt>
                    <dd className="font-medium text-[#0F1115]">{user.email}</dd>
                  </div>
                  <div className="flex justify-between border-b border-[#E6E7EA] pb-3">
                    <dt className="text-[#5B6270]">Current Persona</dt>
                    <dd className="font-medium capitalize text-[#0F1115]">{user.persona ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between pt-1">
                    <dt className="text-[#5B6270]">Consent Status</dt>
                    <dd className="font-medium text-[#16A34A]">
                      {user.consent_given ? 'Consent verified' : 'Pending'}
                    </dd>
                  </div>
                </dl>
              </section>
            </>
          )}

          {activeTab === 'integrations' && (
            <>
              <div className="border-b border-[#E6E7EA] pb-4">
                <h2 className="font-display text-[20px] font-semibold text-[#0F1115]">Google Calendar &amp; Tasks</h2>
                <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                  Mirror scheduled habits to Calendar and synchronize completion in both directions with Google Tasks.
                </p>
              </div>
              <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1E3A8A]">event_available</span>
                      <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">Google workspace sync</h3>
                    </div>
                    <p className="mt-2 max-w-xl font-body text-[13px] leading-relaxed text-[#5B6270]">
                      Calendar is a write-only reminder mirror. Google Tasks completion is synchronized with Bosla using a conflict-safe last-sync marker.
                    </p>
                    {googleStatus?.last_sync_at && (
                      <p className="mt-2 font-body text-[11px] text-[#76777B]">
                        Last synced {new Date(googleStatus.last_sync_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 font-body text-[11px] font-medium ${googleStatus?.connected ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                    {googleStatus?.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {!googleStatus?.configured && googleStatus && (
                  <div className="mt-5 rounded-lg border border-[#F59E0B]/30 bg-[#FEF3C7] p-3 font-body text-[12px] text-[#92400E]">
                    Google sync is unavailable until the server credentials, redirect URI, and token encryption key are configured.
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#E6E7EA] pt-5">
                  {!googleStatus?.connected ? (
                    <button
                      type="button"
                      disabled={!googleStatus?.configured}
                      onClick={() => window.location.assign(api.googleSyncStartUrl())}
                      className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Connect Google
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={syncingGoogle}
                        onClick={syncGoogle}
                        className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white disabled:opacity-50"
                      >
                        {syncingGoogle ? 'Syncing…' : 'Sync now'}
                      </button>
                      <button
                        type="button"
                        onClick={disconnectGoogle}
                        className="h-10 rounded-lg border border-[#DC2626] px-4 font-body text-[13px] font-medium text-[#DC2626]"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
                {googleMessage && <p className="mt-4 font-body text-[12px] text-[#45474B]">{googleMessage}</p>}
              </section>
            </>
          )}

          {activeTab === 'ai' && (
            <>
              <div className="border-b border-[#E6E7EA] pb-4">
                <h2 className="font-display text-[20px] font-semibold text-[#0F1115]">
                  AI &amp; Models
                </h2>
                <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                  Connected LLM providers powering discovery conversations and plan synthesis.
                </p>
              </div>

              <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
                <div className="flex items-center justify-between font-body text-[14px]">
                  <div>
                    <div className="font-display text-[16px] font-semibold text-[#0F1115]">
                      {aiStatus?.provider === 'groq' ? 'Groq Llama 3' : 'Anthropic Claude'}
                    </div>
                    <div className="font-body text-[12px] text-[#5B6270]">
                      {aiStatus?.model || 'claude-3-7-sonnet / llama-3.3-70b'}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-medium ${
                      aiStatus?.configured
                        ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {aiStatus?.configured ? 'Connected' : 'Default Sandbox'}
                  </span>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
