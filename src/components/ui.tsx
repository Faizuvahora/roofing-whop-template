import type { ReactNode } from 'react'

export function Icon({ d, className = 'size-6' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  )
}

export const icons = {
  check: 'M20 6 9 17l-5-5',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  pin: 'M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm0 3h20',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'M18 6 6 18M6 6l12 12',
}

export function SectionHeading({ eyebrow, title, sub, center }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-base text-pretty text-slate-600 sm:text-lg">{sub}</p>}
    </div>
  )
}

export function Stars({ n, className = 'size-4' }: { n: number; className?: string }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i < n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path d={icons.star} />
        </svg>
      ))}
    </div>
  )
}
