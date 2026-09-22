import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type CareerMatch } from '../api'
import { FitRing } from '../components/Card'

export function Matches() {
  const [matches, setMatches] = useState<CareerMatch[] | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.listMatches().then(setMatches)
  }, [])

  if (matches && matches.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] font-medium">No matches yet.</p>
        <button
          type="button"
          onClick={() => navigate('/onboarding/discovery')}
          className="h-10 rounded-card bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-hover"
        >
          Start the discovery conversation
        </button>
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold">Your career matches</h1>
          <p className="mt-1 text-text-2">Ranked by fit — every score comes with its reasoning.</p>
        </div>
        <a
          href={api.reportPdfUrl()}
          className="inline-flex h-9 items-center gap-2 rounded-card border border-line bg-white px-3 text-[13px] font-medium text-ink hover:bg-page"
        >
          <Download size={14} /> Save PDF
        </a>
      </div>

      <ul className="mt-6 space-y-3">
        {matches?.map((m) => (
          <li key={m.id}>
            <Link
              to={`/matches/${m.id}`}
              className="flex gap-4 rounded-card border border-line bg-white p-4 transition-colors hover:border-ink"
            >
              <FitRing value={m.fit_score} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold">{m.title}</h2>
                  {m.chosen && (
                    <span className="rounded-chip bg-indigo-tint px-1.5 py-0.5 text-[11px] font-semibold text-indigo-brand">
                      Chosen
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-5 text-text-2">{m.why}</p>
                <p className="mt-1 text-[12px] italic text-text-3">Uncertainty: {m.uncertainty_note}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
