import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased selection:bg-[#E7EEFF] selection:text-[#1E3A8A]">
      {/* Sticky Header / Brand Indicator */}
      <header className="sticky top-0 z-50 w-full bg-[#FAFAF8]/90 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/brand/bosla-horizontal.png"
              alt="Bosla"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/signin"
              className="font-body text-[14px] font-medium text-[#1E3A8A] transition-colors hover:text-[#1D3989]"
            >
              Sign in
            </Link>
            <Link
              to="/signin?mode=signup"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0F1115] px-4 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Canvas */}
      <main className="mx-auto flex w-full flex-grow flex-col items-center justify-center px-6 py-12 md:py-16 max-w-[1280px]">
        {/* Hero Group */}
        <div className="flex max-w-[680px] flex-col items-center text-center">
          {/* Stacked Bosla Logo at 160px height */}
          <div className="mb-10 flex items-center justify-center">
            <img
              src="/brand/bosla-stacked.png"
              alt="Bosla compass-rose brandmark and wordmark"
              className="h-[160px] w-auto select-none object-contain"
            />
          </div>

          {/* Main Headline in Space Grotesk tight tracking */}
          <h1 className="mb-4 font-display text-[38px] font-bold leading-[46px] tracking-[-0.03em] text-[#0F1115] md:text-[44px] md:leading-[52px]">
            Find your direction.
          </h1>

          {/* Sub-line in IBM Plex Sans 16px text secondary */}
          <p className="mb-8 max-w-[640px] font-body text-[16px] leading-relaxed text-[#45474B]">
            An AI career companion that replaces exhausting questionnaires with a conversation — then turns it into a roadmap and daily habits.
          </p>

          {/* Action Group */}
          <div className="flex items-center justify-center gap-5">
            <Link
              to="/signin?mode=signup"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
            >
              Get started
            </Link>
            <Link
              to="/signin"
              className="font-body text-[14px] font-medium text-[#1E3A8A] transition-colors hover:text-[#1D3989]"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Feature Grid / Three Horizontal Cards */}
        <section aria-label="Key features" className="mt-16 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <article className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115]">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#1E3A8A]">
                <span className="material-symbols-outlined text-[20px]" data-icon="chat">
                  chat
                </span>
              </div>
              <h2 className="mb-2 font-display text-[18px] font-semibold tracking-[-0.01em] text-[#0F1115]">
                Talk, don't test
              </h2>
              <p className="font-body text-[14px] leading-normal text-[#45474B]">
                Adaptive conversation that uncovers what you actually enjoy and where your natural strengths lie.
              </p>
            </div>
          </article>

          {/* Card 2 */}
          <article className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115]">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#1E3A8A]">
                <span className="material-symbols-outlined text-[20px]" data-icon="insights">
                  insights
                </span>
              </div>
              <h2 className="mb-2 font-display text-[18px] font-semibold tracking-[-0.01em] text-[#0F1115]">
                See why it fits
              </h2>
              <p className="font-body text-[14px] leading-normal text-[#45474B]">
                Explainable recommendations with quantified uncertainty and concrete signal attribution.
              </p>
            </div>
          </article>

          {/* Card 3 */}
          <article className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115]">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#1E3A8A]">
                <span className="material-symbols-outlined text-[20px]" data-icon="repeat">
                  repeat
                </span>
              </div>
              <h2 className="mb-2 font-display text-[18px] font-semibold tracking-[-0.01em] text-[#0F1115]">
                Turn steps into habits
              </h2>
              <p className="font-body text-[14px] leading-normal text-[#45474B]">
                Roadmaps break down into measurable daily habits with streaks and milestone XP tracking.
              </p>
            </div>
          </article>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-8 text-center">
        <p className="font-body text-[14px] text-[#8A8F98]">
          Bosla means compass.
        </p>
      </footer>
    </div>
  )
}
