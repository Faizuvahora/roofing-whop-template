import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { site, type PlanKey } from '../site.config'
import { getPlan, usd } from '../lib/plans'
import { trackOnce } from '../lib/track'
import { Logo } from './Header'
import { Icon, SectionHeading, Stars, icons } from './ui'

/* ─────────────────────────────── Hero ─────────────────────────────── */
export function Hero() {
  const insp = getPlan('inspection')
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 22px)' }}
      />
      <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-accent/30 blur-3xl" />
      <div className="section relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-orange-200 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-orange-400" /> {site.hero.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">{site.hero.headline}</h1>
          <p className="mt-5 max-w-xl text-base text-pretty text-slate-300 sm:text-lg">{site.hero.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#estimate" className="btn-primary !px-6 !py-3.5 text-base">
              Request a free estimate <Icon d={icons.arrow} className="size-4" />
            </a>
            <Link to="/book/$plan" params={{ plan: 'inspection' }} className="btn !bg-white/10 !px-6 !py-3.5 text-base text-white ring-1 ring-white/20 hover:!bg-white/15">
              Book an inspection · {usd(insp.price)}
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {site.hero.stats.map((s) => (
              <div key={s.label}>
                <dt className="text-2xl font-bold sm:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs text-slate-400 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-3xl bg-white p-6 text-ink shadow-2xl ring-1 ring-black/5 sm:p-8">
          <p className="eyebrow">How it works</p>
          <ol className="mt-4 space-y-5">
            {[
              ['Inspect', `Certified inspection for ${usd(insp.price)}, credited toward repairs.`],
              ['Reserve', `Lock your crew and pricing with a ${usd(getPlan('deposit').price)} deposit. Your card stays on file.`],
              ['Build', 'Most replacements finish in a single day, with a full clean-up.'],
              ['Pay the balance', 'Final invoice after your walkthrough. Auto-pay or pay online.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-bold text-accent">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/book/$plan" params={{ plan: 'deposit' }} className="btn-dark mt-6 w-full">Reserve my project</Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── Trust bar ─────────────────────────────── */
export function TrustBar() {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="section flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm font-semibold text-slate-500">
        {site.trust.map((t) => (
          <span key={t} className="inline-flex items-center gap-2">
            <Icon d={icons.shield} className="size-4 text-accent" /> {t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────── Services ─────────────────────────────── */
function ServiceCard({ s }: { s: (typeof site.services)[number] }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackOnce(`service:${s.id}`, 'service_viewed', { service_id: s.id, service_name: s.name, trigger: 'scroll' })
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [s.id, s.name])

  const plan = 'plan' in s && s.plan ? getPlan(s.plan as PlanKey) : null
  return (
    <article ref={ref} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className="grid size-12 place-items-center rounded-xl bg-orange-50 text-accent">
        <Icon d={s.icon} />
      </span>
      <h3 className="mt-5 text-lg font-bold">{s.name}</h3>
      <p className="mt-2 text-sm text-slate-600">{s.blurb}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {s.details.map((d) => (
          <li key={d} className="flex items-start gap-2">
            <Icon d={icons.check} className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {d}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        {plan ? (
          <Link
            to="/book/$plan"
            params={{ plan: plan.key }}
            onClick={() => trackOnce(`service-click:${s.id}`, 'service_viewed', { service_id: s.id, service_name: s.name, trigger: 'click' })}
            className="btn-ghost w-full group-hover:ring-accent"
          >
            {plan.key === 'deposit' ? `Reserve · ${usd(plan.price)} deposit` : `Book · ${usd(plan.price)}`}
          </Link>
        ) : (
          <a href="#estimate" className="btn-ghost w-full">Get an estimate</a>
        )}
      </div>
    </article>
  )
}

export function Services() {
  return (
    <section id="services" className="section py-20">
      <SectionHeading eyebrow="Services" title="Everything your roof needs, from one crew" sub="Repairs, replacements and inspections from certified installers, with up-front pricing." />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {site.services.map((s) => <ServiceCard key={s.id} s={s} />)}
      </div>
    </section>
  )
}

/* ─────────────────────────────── Pricing ─────────────────────────────── */
export function Pricing() {
  const keys: PlanKey[] = ['inspection', 'deposit', 'flatRate']
  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="section">
        <SectionHeading center eyebrow="Up-front pricing" title="Book online in two minutes" sub="Pay securely through Whop checkout with card, Apple Pay, Google Pay or financing." />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {keys.map((k) => {
            const p = getPlan(k)
            const featured = k === 'deposit'
            return (
              <div key={k} className={`relative flex flex-col rounded-3xl bg-white p-7 ring-1 ${featured ? 'shadow-xl ring-2 ring-accent' : 'ring-slate-200'}`}>
                {featured && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">Replacement projects</span>}
                <h3 className="text-lg font-bold">{p.shortTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{usd(p.price)}</span>
                  <span className="text-sm text-slate-500">{k === 'deposit' ? 'deposit' : k === 'flatRate' ? 'flat rate' : 'one-time'}</span>
                </p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Icon d={icons.check} className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {b}
                    </li>
                  ))}
                </ul>
                <Link to="/book/$plan" params={{ plan: k }} className={`mt-8 w-full ${featured ? 'btn-primary' : 'btn-dark'}`}>
                  {k === 'deposit' ? 'Pay deposit' : 'Book now'}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── Financing ─────────────────────────────── */
export function Financing() {
  const f = site.financing
  return (
    <section id="financing" className="section py-20">
      <div className="grid overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-orange-800 text-white lg:grid-cols-2">
        <div className="p-8 sm:p-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-orange-200 uppercase">Financing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{f.headline}</h2>
          <p className="mt-4 text-orange-50/90">{f.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#estimate" className="btn bg-white text-orange-700 hover:bg-orange-50">Get a quote</a>
            <Link to="/book/$plan" params={{ plan: 'deposit' }} className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/15">See checkout options</Link>
          </div>
          <p className="mt-6 text-xs text-orange-100/70">{f.disclaimer}</p>
        </div>
        <div className="grid gap-3 bg-black/10 p-8 sm:grid-cols-2 sm:p-12">
          {f.points.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <Icon d={icons.check} className="mt-0.5 size-5 shrink-0" />
              <span className="text-sm font-medium">{p}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            {['Klarna', 'Afterpay', 'Splitit', 'Affirm', 'Apple Pay', 'Google Pay'].map((b) => (
              <span key={b} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── Service area ─────────────────────────────── */
export function ServiceArea() {
  const a = site.serviceArea
  const [zip, setZip] = useState('')
  const [checked, setChecked] = useState(false)
  const valid = /^\d{5}$/.test(zip)
  return (
    <section id="area" className="bg-slate-50 py-20">
      <div className="section grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Service area" title={a.headline} sub={a.sub} />
          <form
            className="mt-8 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setChecked(true)
            }}
          >
            <input className="field" inputMode="numeric" maxLength={5} placeholder={a.zipPlaceholder} value={zip} onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setChecked(false) }} aria-label="ZIP code" />
            <button className="btn-dark shrink-0" disabled={!valid}>Check ZIP</button>
          </form>
          {checked && valid && (
            <p className="mt-3 text-sm text-slate-700">
              We most likely cover <b>{zip}</b>. <a href="#estimate" className="font-semibold text-accent underline">Request your free estimate</a> and we’ll confirm.
            </p>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {a.cities.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-slate-200">
              <Icon d={icons.pin} className="size-4 shrink-0 text-accent" /> {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ─────────────────────────────── Reviews ─────────────────────────────── */
export function Reviews() {
  const avg = site.reviews.reduce((s, r) => s + r.rating, 0) / site.reviews.length
  return (
    <section id="reviews" className="section py-20">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Reviews" title="Homeowners trust us with the roof over their heads" />
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3 ring-1 ring-slate-200">
          <span className="text-3xl font-extrabold">{avg.toFixed(1)}</span>
          <div>
            <Stars n={Math.round(avg)} />
            <p className="text-xs text-slate-500">{site.hero.stats[0]?.value} roofs completed</p>
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {site.reviews.map((r) => (
          <figure key={r.name} className="flex flex-col rounded-2xl border border-slate-200 p-6">
            <Stars n={r.rating} />
            <blockquote className="mt-4 flex-1 text-[15px] text-slate-700">“{r.text}”</blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-semibold">{r.name}</span> <span className="text-slate-500">· {r.city}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">{site.reviewsNote}</p>
    </section>
  )
}

/* ─────────────────────────────── Footer ─────────────────────────────── */
export function Footer() {
  const c = site.company
  return (
    <footer className="bg-ink text-slate-400">
      <div className="section grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm">{site.company.tagline} {c.license}.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Contact</p>
          <a className="mt-3 block hover:text-white" href={c.phoneHref}>{c.phone}</a>
          <a className="mt-1 block hover:text-white" href={`mailto:${c.email}`}>{c.email}</a>
          <p className="mt-1">{c.address}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Book online</p>
          {(['inspection', 'deposit', 'flatRate'] as const).map((k) => (
            <Link key={k} to="/book/$plan" params={{ plan: k }} className="mt-2 block hover:text-white">{getPlan(k).shortTitle}</Link>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="section flex flex-col justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {c.name}. Payments secured by Whop.</p>
          <p>Since {c.founded} · {c.address}</p>
        </div>
      </div>
    </footer>
  )
}
