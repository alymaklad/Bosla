import { Sparkles } from 'lucide-react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MobileTabs } from './MobileTabs'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Post-onboarding shell: sidebar + top bar + mobile tabs + the persistent "Ask Bosla" entry point. */
export function Shell() {
  const { user, loading } = useApp()
  const navigate = useNavigate()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <TopBar />
        <Outlet />
      </div>
      <MobileTabs />
      <button
        type="button"
        onClick={() => navigate('/matches')}
        className="fixed bottom-20 right-5 z-20 flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(15,17,21,.06),0_8px_24px_rgba(15,17,21,.18)] hover:bg-ink-hover md:bottom-6 md:right-6"
      >
        <Sparkles size={18} />
        Ask Bosla
      </button>
    </div>
  )
}
