import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MobileTabs } from './MobileTabs'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Post-onboarding shell: persistent sidebar + 56px top bar + mobile tabs + floating "Ask Bosla" trigger. */
export function Shell() {
  const { user, loading } = useApp()
  const navigate = useNavigate()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Sidebar />
      <TopBar />

      {/* Main Canvas offset by 240px sidebar on desktop and 56px top bar */}
      <div className="min-h-screen pb-20 pt-16 md:ml-64 md:pb-12">
        <Outlet />
      </div>

      <MobileTabs />

      {/* Floating 'Ask Bosla' Trigger Button */}
      <button
        type="button"
        onClick={() => navigate('/matches')}
        aria-label="Ask Bosla guidance AI"
        className="custom-floating-shadow fixed bottom-8 right-8 z-50 flex h-12 items-center gap-2.5 rounded-full bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-all hover:bg-[#1C1F26] active:opacity-90"
      >
        <span
          className="material-symbols-outlined text-[20px] text-[#F59E0B]"
          data-icon="spark"
        >
          auto_awesome
        </span>
        <span className="tracking-wide">Ask Bosla</span>
      </button>
    </div>
  )
}
