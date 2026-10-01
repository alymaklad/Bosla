import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { GoogleAutoSync } from '../hooks/useGoogleAutoSync'
import { MobileTabs } from './MobileTabs'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { OfflineBanner } from './OfflineBanner'
import { TourProvider } from '../tour/TourProvider'

/** App shell with persistent navigation and a floating mentor shortcut. */
export function Shell() {
  const { user, loading } = useApp()
  const navigate = useNavigate()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />

  return (
    <TourProvider>
    <div className="h-dvh overflow-hidden bg-[#FAFAF8]">
      <GoogleAutoSync />
      <Sidebar />
      <TopBar />

      {/* Main Canvas offset by 240px sidebar on desktop and 56px top bar */}
      <div className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto pb-40 md:ml-64 md:pb-12">
        <OfflineBanner inline />
        <Outlet />
      </div>

      <MobileTabs />

      {/* Floating 'Ask Bosla' Trigger Button */}
      <button
        type="button"
        onClick={() => navigate('/mentor')}
        aria-label="Ask Bosla guidance AI"
        data-tour="ask-bosla"
        className="custom-floating-shadow fixed bottom-[88px] right-4 z-50 flex h-12 items-center gap-2.5 rounded-full bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-all hover:bg-[#1C1F26] active:opacity-90 md:bottom-8 md:right-8"
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
    </TourProvider>
  )
}
