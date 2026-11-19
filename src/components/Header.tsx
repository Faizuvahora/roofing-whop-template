import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { site } from '../site.config'
import { Icon, icons } from './ui'

const nav = [
  { href: '/#services', label: 'Services' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#financing', label: 'Financing' },
  { href: '/#area', label: 'Service area' },
  { href: '/#reviews', label: 'Reviews' },
]

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-accent text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden>
          <path d="M2 13 12 4l10 9M6 10.5V20h12v-9.5" />
        </svg>
      </span>
      <span className={`text-[17px] leading-tight font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>{site.company.name}</span>
    </Link>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="section flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-ink">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={site.company.phoneHref} className="hidden items-center gap-2 text-sm font-semibold sm:flex">
            <Icon d={icons.phone} className="size-4 text-accent" /> {site.company.phone}
          </a>
          <a href="/#estimate" className="btn-primary hidden !py-2.5 sm:inline-flex">Free estimate</a>
          <button className="grid size-10 place-items-center rounded-lg ring-1 ring-slate-200 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon d={open ? icons.x : icons.menu} className="size-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="section flex flex-col py-3 text-[15px] font-medium">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-2.5">{n.label}</a>
            ))}
            <a href={site.company.phoneHref} className="py-2.5 text-accent">Call {site.company.phone}</a>
            <a href="/#estimate" onClick={() => setOpen(false)} className="btn-primary mt-2">Request a free estimate</a>
          </nav>
        </div>
      )}
    </header>
  )
}
