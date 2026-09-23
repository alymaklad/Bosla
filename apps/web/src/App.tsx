import { Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Shell } from './components/Shell'
import { useApp } from './context/AppContext'
import { Consent } from './pages/Consent'
import { CvUpload } from './pages/CvUpload'
import { Discovery } from './pages/Discovery'
import { HabitWizard } from './pages/HabitWizard'
import { Landing } from './pages/Landing'
import { MatchDetail } from './pages/MatchDetail'
import { Matches } from './pages/Matches'
import { Mentor } from './pages/Mentor'
import { Progress } from './pages/Progress'
import { Roadmap } from './pages/Roadmap'
import { Settings } from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { TodayHabits } from './pages/TodayHabits'
import { WeeklyReview } from './pages/WeeklyReview'

export default function App() {
  const { loading } = useApp()
  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/onboarding/consent" element={<Consent />} />
      <Route path="/onboarding/cv" element={<CvUpload />} />
      <Route path="/onboarding/discovery" element={<Discovery />} />

      <Route element={<Shell />}>
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/habit-wizard" element={<HabitWizard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<TodayHabits />} />
        <Route path="/habits/review" element={<WeeklyReview />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
