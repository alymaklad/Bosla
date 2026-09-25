import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type CareerMatch } from '../api'
import { PageLoading } from '../components/PageLoading'
import { ErrorToast } from '../components/ErrorToast'

export function Matches() {
  const [matches, setMatches] = useState<CareerMatch[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyChoice, setBusyChoice] = useState<string | null>(null)
  const [chooseError, setChooseError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.listMatches().then((list) => {
      setMatches(list)
      if (list.length > 0) {
        const chosen = list.find((m) => m.chosen)
        setSelectedId(chosen ? chosen.id : list[0].id)
      }
    }).catch(() => setMatches([]))
  }, [])

  async function choose(id: string) {
    setBusyChoice(id)
    try {
      await api.chooseDirection(id)
      navigate('/roadmap')
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : 'Could not choose this direction. Please retry.')
    } finally {
      setBusyChoice(null)
    }
  }

  if (matches === null) {
    return <PageLoading label="Loading your saved career matches…" />
  }

  if (matches && matches.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="material-symbols-outlined text-[36px] text-[#8A8F98]">explore</span>
        <h2 className="font-display text-[22px] font-semibold text-[#0F1115]">No matches found yet</h2>
        <p className="font-body text-[14px] text-[#5B6270]">
          Start a quick conversation with Bosla to map your strengths and recommend matching roles.
        </p>
        <button
          type="button"
          onClick={() => navigate('/onboarding/discovery')}
          className="mt-2 h-10 rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
        >
          Start discovery conversation
        </button>
      </div>
    )
  }

  const activeMatch = matches?.find((m) => m.id === selectedId) || matches?.[0]

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Top Onboarding Stepper Banner */}
      <div className="mb-8 rounded-lg border border-[#E6E7EA] bg-white p-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#5B6270]">
              Orientation flow
            </span>
            <span className="text-[#C6C6CB]">/</span>
            <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
              Step 4 of 4
            </span>
          </div>
          <div className="font-body text-[12px] text-[#5B6270]">
            Final synthesis based on your discovery conversation
          </div>
        </div>

        {/* Stepper Segments */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F1115] text-[10px] text-white">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <span className="font-body text-[13px] font-medium text-[#0F1115]">Consent</span>
            <div className="hidden h-[1px] flex-1 bg-[#0F1115] sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F1115] text-[10px] text-white">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <span className="font-body text-[13px] font-medium text-[#0F1115]">Career context</span>
            <div className="hidden h-[1px] flex-1 bg-[#0F1115] sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F1115] text-[10px] text-white">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <span className="font-body text-[13px] font-medium text-[#0F1115]">Conversation</span>
            <div className="hidden h-[1px] flex-1 bg-[#1E3A8A] sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-semibold text-white">
              4
            </div>
            <span className="font-body text-[13px] font-medium text-[#1E3A8A]">Matches</span>
          </div>
        </div>
      </div>

      {/* Page Title Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[32px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">
              Your top matches
            </h1>
            <p className="mt-1 font-body text-[16px] text-[#5B6270]">
              Ranked by fit. Every match shows why — and where we're less sure.
            </p>
          </div>
          <Link to="/onboarding/cv" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1E3A8A] px-3 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#F0F3FF]">
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            Manage career evidence
          </Link>
        </div>
      </div>

      {/* Grid Layout: 70% Content / 30% Contextual Rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Recommendations (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {matches?.map((m) => {
            const circumference = 2 * Math.PI * 28
            const strokeDashoffset = circumference * (1 - (m.fit_score ?? 0) / 100)

            return (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`relative rounded-lg border bg-white p-6 transition-all ${
                  selectedId === m.id
                    ? 'border-[#1E3A8A] shadow-sm'
                    : 'border-[#E6E7EA] hover:border-[#1E3A8A]'
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* SVG Radial Gauge */}
                    <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                      <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          fill="transparent"
                          r="28"
                          stroke="#E6E7EA"
                          strokeWidth="4.5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          fill="transparent"
                          r="28"
                          stroke="#1E3A8A"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          strokeWidth="4.5"
                        />
                      </svg>
                      <span className="absolute font-display text-[15px] font-bold text-[#1E3A8A]">
                        {m.fit_score}%
                      </span>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                          Rank {m.rank} {m.rank === 1 ? '· Prime Alignment' : ''}
                        </span>
                        {m.chosen && (
                          <span className="rounded bg-[#FEF3C7] px-2 py-0.5 font-body text-[11px] font-medium text-[#B45309]">
                            Active Roadmap
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-[22px] font-semibold text-[#0F1115]">
                        {m.title}
                      </h2>
                      <p className="font-body text-[13px] text-[#5B6270]">
                        {m.salary || 'Market compensation not yet verified'}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#76777B]">auto_awesome</span>
                </div>

                {/* Rationale Modules */}
                <div className="mb-5 space-y-3 border-t border-[#E6E7EA] pt-4">
                  <div className="rounded border border-[#E6E7EA] bg-[#FAFAF8] p-3.5">
                    <span className="font-body text-[13px] font-medium text-[#0F1115]">
                      Why this fits you:
                    </span>
                    <p className="mt-0.5 font-body text-[13px] text-[#45474B]">{m.why}</p>
                  </div>
                  <div className="rounded border border-[#E6E7EA] bg-[#FAFAF8] p-3.5">
                    <span className="font-body text-[13px] font-medium text-[#76777B]">
                      Less certain about:
                    </span>
                    <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
                      {m.uncertainty_note}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-3 border-t border-[#E6E7EA] pt-3">
                  <button
                    type="button"
                    disabled={busyChoice === m.id}
                    onClick={() => choose(m.id)}
                    className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-60"
                  >
                    {busyChoice === m.id ? 'Selecting…' : 'Choose this direction'}
                  </button>
                  <Link
                    to={`/matches/${m.id}`}
                    className="flex h-10 items-center gap-1.5 rounded-lg px-4 font-body text-[14px] font-medium text-[#1E3A8A] transition-colors hover:bg-[#E7EEFF]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chat_bubble_outline
                    </span>
                    <span>Ask a follow-up</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Context & Report (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Market Context Card */}
          <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
              <div>
                <span className="block font-body text-[11px] font-semibold uppercase tracking-wider text-[#5B6270]">
                  Active Benchmark
                </span>
                <h3 className="font-display text-[18px] font-semibold text-[#0F1115]">
                  Market context
                </h3>
              </div>
              <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                {activeMatch?.title}
              </span>
            </div>

            <div className="space-y-4">
              {activeMatch?.salary && activeMatch.location && activeMatch.source && activeMatch.as_of ? (
                <div>
                  <span className="font-body text-[12px] text-[#5B6270]">Salary range</span>
                  <div className="mt-0.5 font-display text-[24px] font-bold leading-tight text-[#0F1115]">
                    {activeMatch.salary}
                  </div>
                  <div className="mt-1 font-body text-[11px] text-[#76777B]">
                    {activeMatch.location} · Source: {activeMatch.source} · Updated {activeMatch.as_of}
                  </div>
                </div>
              ) : (
                <p className="font-body text-[12px] text-[#5B6270]">
                  Verified salary data is not available for this location.
                </p>
              )}

              <div className="h-[1px] bg-[#E6E7EA]" />

              {/* Metric 2 */}
              <div>
                <span className="font-body text-[12px] text-[#5B6270]">Remote potential</span>
                <div className="mt-1 font-display text-[16px] font-semibold text-[#0F1115]">
                  {activeMatch?.remote || 'Not verified'}
                </div>
              </div>

              <div className="h-[1px] bg-[#E6E7EA]" />

              {/* Metric 3 */}
              <div>
                <span className="font-body text-[12px] text-[#5B6270]">Local demand</span>
                <div className="mt-1 font-display text-[16px] font-semibold text-[#0F1115]">
                  {activeMatch?.demand || 'Not verified'}
                </div>
              </div>
            </div>
          </div>

          {/* Save Results & Export Card */}
          <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0F1115]">description</span>
              <h3 className="font-display text-[18px] font-semibold text-[#0F1115]">
                Save your results
              </h3>
            </div>
            <p className="mb-5 font-body text-[13px] text-[#5B6270]">
              Download your career summary including signal attribution and skill gaps.
            </p>
            <a
              href={api.reportPdfUrl()}
              download="bosla-career-report.pdf"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#0F1115] bg-white font-body text-[14px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download PDF report</span>
            </a>
          </div>

          {/* Assumption Validation Note */}
          <div className="rounded-lg border border-[#F59E0B]/30 bg-[#FEF3C7] p-4 text-[#B45309]">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[18px]">
                info
              </span>
              <div className="font-body text-[13px] leading-relaxed">
                Rankings incorporate self-assessed preferences. Completing the optional practice sets adjusts confidence intervals.
              </div>
            </div>
          </div>
          <ErrorToast message={chooseError} onDismiss={() => setChooseError(null)} />
        </div>
      </div>
    </main>
  )
}
