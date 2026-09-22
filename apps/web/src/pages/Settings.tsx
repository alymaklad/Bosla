import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type AiStatus } from '../api'
import { Card, Chip } from '../components/Card'
import { useApp } from '../context/AppContext'

const PROVIDER_LABEL: Record<AiStatus['provider'], string> = { anthropic: 'Anthropic (Claude)', groq: 'Groq' }

export function Settings() {
  const { user, signOut, refreshUser } = useApp()
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)

  useEffect(() => {
    api.aiStatus().then(setAiStatus).catch(() => {})
  }, [])

  if (!user) return null

  async function changeLanguage(language: 'en' | 'ar') {
    await api.setLanguage(language)
    await refreshUser()
  }

  async function removeAccount() {
    if (!window.confirm('Delete your account and all career, CV, habit, and chat data? This cannot be undone.')) return
    await api.deleteAccount()
    navigate('/')
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[26px] font-semibold">Profile &amp; settings</h1>

      <Card className="mt-5" title="Account">
        <dl className="space-y-2 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-text-3">Name</dt>
            <dd>{user.name || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-3">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-3">Where you are</dt>
            <dd className="capitalize">{user.persona ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-3">Language</dt>
            <dd>{user.language === 'ar' ? 'العربية' : 'English'}</dd>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => changeLanguage('en')} className="rounded-card border border-line px-2 py-1 text-[12px] hover:bg-page">English</button>
            <button type="button" onClick={() => changeLanguage('ar')} className="rounded-card border border-line px-2 py-1 text-[12px] hover:bg-page">العربية</button>
          </div>
        </dl>
      </Card>

      {aiStatus && (
        <Card className="mt-4" title="AI provider">
          <div className="flex items-center justify-between text-[14px]">
            <div>
              <div className="font-medium">{PROVIDER_LABEL[aiStatus.provider]}</div>
              <div className="text-[12px] text-text-3">{aiStatus.model}</div>
            </div>
            <Chip tone={aiStatus.configured ? 'indigo' : 'amber'} outline>
              {aiStatus.configured ? 'Connected' : 'No API key set'}
            </Chip>
          </div>
          {!aiStatus.configured && (
            <p className="mt-2 text-[12px] leading-5 text-text-3">
              Set {aiStatus.provider === 'groq' ? 'GROQ_API_KEY' : 'ANTHROPIC_API_KEY'} in the API's .env to
              enable discovery, matching, mentorship, and habit planning.
            </p>
          )}
        </Card>
      )}

      <Card className="mt-4" title="Data &amp; privacy">
        <p className="text-[13px] leading-5 text-text-2">
          Your career assessment and mentorship transcript can be exported as a PDF from the Matches page at any
          time.
        </p>
        <button type="button" onClick={removeAccount} className="mt-3 text-[12px] text-danger hover:underline">Delete my account and data</button>
      </Card>

      <button
        type="button"
        onClick={async () => {
          await signOut()
          navigate('/')
        }}
        className="mt-6 h-11 w-full rounded-card border border-line bg-white text-[15px] font-medium text-ink hover:bg-page"
      >
        Sign out
      </button>
    </main>
  )
}
