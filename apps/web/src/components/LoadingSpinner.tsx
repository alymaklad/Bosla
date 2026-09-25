interface LoadingSpinnerProps {
  size?: number
}

/** A gentle, non-rotating loading mark shared by page and inline states. */
export function LoadingSpinner({ size = 20 }: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className="bosla-loader-mark inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img src="/brand/bosla-loader.png" alt="" className="h-full w-full object-contain" />
    </span>
  )
}
