import { Dashboard } from './components/Dashboard'
import { MobileTabs } from './components/MobileTabs'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'

export default function App() {
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <TopBar />
        <Dashboard />
      </div>
      <MobileTabs />
    </div>
  )
}
