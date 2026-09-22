import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-page px-6 py-16 text-center">
      <img src="/brand/bosla-stacked.png" alt="Bosla" className="h-40 w-auto object-contain" />
      <h1 className="mt-6 max-w-md text-[32px] font-semibold leading-10">
        Find your direction. Build the habits to get there.
      </h1>
      <p className="mt-3 max-w-sm text-text-2">
        Bosla means compass. One conversation maps your career direction — then turns the next step into a habit
        you'll actually keep.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/signin?mode=signup"
          className="inline-flex h-11 items-center gap-2 rounded-card bg-ink px-5 text-[15px] font-medium text-white hover:bg-ink-hover"
        >
          Get started <ArrowRight size={16} />
        </Link>
        <Link
          to="/signin"
          className="inline-flex h-11 items-center rounded-card border border-line bg-white px-5 text-[15px] font-medium text-ink hover:bg-page"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
