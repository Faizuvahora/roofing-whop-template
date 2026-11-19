import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { Icon, icons } from '../components/ui'
import { CardOnFile, PlanCheckout, SandboxBadge, WhopProvider, type SavedCard } from '../components/WhopCheckout'
import { getPlan, isPlanKey, usd } from '../lib/plans'
import { track } from '../lib/track'
import { site } from '../site.config'
import { findDepositPayment, getSetupIntent } from '../server/functions'

type Search = { payment?: string; status?: string; setup?: string; setup_intent_id?: string; job?: string }

export const Route = createFileRoute('/book/$plan')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    job: typeof s.job === 'string' ? s.job : undefined,
    payment: typeof s.payment === 'string' ? s.payment : undefined,
    status: typeof s.status === 'string' ? s.status : undefined,
    setup: typeof s.setup === 'string' ? s.setup : undefined,
    setup_intent_id: typeof s.setup_intent_id === 'string' ? s.setup_intent_id : undefined,
  }),
  loader: ({ params }) => {
    if (!isPlanKey(params.plan)) throw notFound()
    return { planKey: params.plan }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${getPlan(loaderData.planKey).shortTitle} · ${site.company.name}` : site.company.name }],
  }),
  component: BookPage,
})

type Step = 'details' | 'pay' | 'card' | 'done'
type Job = { name: string; email: string; phone: string; jobRef: string; paymentId?: string; card?: SavedCard }
const JOB_KEY = 'roof-job'

function loadJob(): Job | null {
  try { return JSON.parse(localStorage.getItem(JOB_KEY) ?? 'null') } catch { return null }
}
function saveJob(j: Job) {
  try { localStorage.setItem(JOB_KEY, JSON.stringify(j)) } catch {}
}
function clearJob() {
  try { localStorage.removeItem(JOB_KEY) } catch {}
}

function BookPage() {
  const { planKey } = Route.useLoaderData()
  const search = Route.useSearch()
  const plan = useMemo(() => getPlan(planKey), [planKey])
  const isDeposit = planKey === 'deposit'

  const [step, setStep] = useState<Step>(isDeposit ? 'details' : 'pay')
  const [job, setJob] = useState<Job>({ name: '', email: '', phone: '', jobRef: '' })
  const [origin, setOrigin] = useState('')
  const [returnError, setReturnError] = useState<string | null>(null)

  // Restore progress after an off-site step (3DS / bank) returns to this page.
  useEffect(() => {
    setOrigin(window.location.origin)
    let saved = loadJob()
    // ?job=JOB-XXXX resumes a specific deposit (also used as the checkout return URL).
    if (isDeposit && search.job && saved?.jobRef !== search.job) {
      saved = { name: '', email: '', phone: '', jobRef: search.job }
      saveJob(saved)
    }
    const setupId = search.setup_intent_id ?? search.setup
    if (search.status && search.status !== 'succeeded') setReturnError(`Payment ${search.status}. Please try again.`)
    if (isDeposit && saved) {
      if (setupId?.startsWith('sint_') && search.status !== 'failed') {
        getSetupIntent({ data: { id: setupId } }).then((card) => {
          const j = { ...saved, card }
          setJob(j); saveJob(j); setStep(card.status === 'succeeded' ? 'done' : 'card')
        })
        return
      }
      if (search.payment?.startsWith('pay_') && search.status === 'succeeded') {
        const j = { ...saved, paymentId: search.payment }
        setJob(j); saveJob(j); setStep('card')
        return
      }
      setJob(saved)
      if (saved.card?.status === 'succeeded') { setStep('done'); return }
      if (saved.paymentId) { setStep('card'); return }
      // Checkout may have finished on a Whop-hosted page: ask Whop whether this job was paid.
      if (saved.jobRef) {
        const base = saved
        findDepositPayment({ data: { jobRef: base.jobRef } })
          .then((p) => {
            if (p && p.status === 'paid') {
              const j = { ...base, paymentId: p.paymentId, email: base.email || p.email, name: base.name || p.name }
              setJob(j); saveJob(j); setStep('card')
            }
          })
          .catch(() => {})
      }
    } else if (!isDeposit && search.payment?.startsWith('pay_') && search.status === 'succeeded') {
      setJob((j) => ({ ...j, paymentId: search.payment }))
      setStep('done')
    }
  }, [])

  const pageUrl = origin ? `${origin}/book/${planKey}${isDeposit && job.jobRef ? `?job=${job.jobRef}` : ''}` : ''

  function startOver() {
    clearJob()
    window.location.href = `/book/${planKey}`
  }

  function startDeposit(e: React.FormEvent) {
    e.preventDefault()
    const j = { ...job, jobRef: job.jobRef || `JOB-${Math.random().toString(36).slice(2, 8).toUpperCase()}` }
    setJob(j); saveJob(j)
    track('deposit_started', { plan_id: plan.planId, value: plan.price, currency: 'USD', job_ref: j.jobRef })
    setStep('pay')
  }

  function onPaid(paymentId: string) {
    const j = { ...job, paymentId }
    setJob(j); saveJob(j)
    setStep(isDeposit ? 'card' : 'done')
  }

  const steps = isDeposit
    ? [['details', 'Your details'], ['pay', `Pay ${usd(plan.price)} deposit`], ['card', 'Card on file'], ['done', 'Confirmed']]
    : [['pay', 'Checkout'], ['done', 'Confirmed']]
  const stepIdx = steps.findIndex(([k]) => k === step)

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-slate-50 py-10 sm:py-14">
        <div className="section grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Order summary */}
          <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8 lg:sticky lg:top-24">
            <Link to="/" hash="pricing" className="text-sm font-medium text-slate-500 hover:text-ink">← Back</Link>
            <p className="eyebrow mt-6">{isDeposit ? 'Reserve your project' : 'Book online'}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{plan.title}</h1>
            <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {plan.bullets.map((b) => (
                <li key={b} className="flex gap-2"><Icon d={icons.check} className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {b}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-baseline justify-between border-t border-slate-200 pt-5">
              <span className="text-sm text-slate-600">{isDeposit ? 'Due today (deposit)' : 'Total'}</span>
              <span className="text-2xl font-extrabold">{usd(plan.price)}</span>
            </div>
            {isDeposit && <p className="mt-2 text-xs text-slate-500">Remaining balance is invoiced after your final walkthrough and charged to the card you keep on file, or paid online.</p>}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <Icon d={icons.lock} className="size-4" /> Secure checkout powered by Whop · financing options shown at checkout
            </div>
          </aside>

          {/* Steps */}
          <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
            <ol className="mb-6 flex flex-wrap gap-2 text-xs font-semibold">
              {steps.map(([k, label], i) => (
                <li key={k} className={`rounded-full px-3 py-1.5 ${i < stepIdx ? 'bg-emerald-50 text-emerald-700' : i === stepIdx ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}. {label}
                </li>
              ))}
            </ol>
            <div className="mb-5"><SandboxBadge /></div>
            {returnError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{returnError}</p>}

            {step === 'details' && (
              <form onSubmit={startDeposit} className="grid gap-4">
                <div>
                  <label className="label" htmlFor="bk-name">Full name *</label>
                  <input id="bk-name" className="field" required autoComplete="name" value={job.name} onChange={(e) => setJob({ ...job, name: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="bk-email">Email *</label>
                    <input id="bk-email" type="email" className="field" required autoComplete="email" value={job.email} onChange={(e) => setJob({ ...job, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor="bk-phone">Phone</label>
                    <input id="bk-phone" type="tel" className="field" autoComplete="tel" value={job.phone} onChange={(e) => setJob({ ...job, phone: e.target.value })} />
                  </div>
                </div>
                <button className="btn-primary !py-3.5 text-base">Continue to secure checkout <Icon d={icons.arrow} className="size-4" /></button>
              </form>
            )}

            {step === 'pay' && pageUrl && (
              <WhopProvider>
                <PlanCheckout
                  key={plan.planId}
                  planId={plan.planId}
                  buyerEmail={job.email || undefined}
                  returnUrl={pageUrl}
                  metadata={{ plan_key: planKey, ...(job.jobRef ? { job_ref: job.jobRef } : {}) }}
                  onPaid={onPaid}
                />
              </WhopProvider>
            )}

            {step === 'card' && pageUrl && (
              <div>
                <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  ✓ Deposit received{job.paymentId ? <> · <code>{job.paymentId}</code></> : null}. Last step: keep a card on file for the final balance.
                </div>
                {(
                  <div className="mb-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="cf-name">Full name *</label>
                      <input id="cf-name" className="field" value={job.name} onChange={(e) => setJob({ ...job, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor="cf-email">Email *</label>
                      <input id="cf-email" type="email" className="field" value={job.email} onChange={(e) => setJob({ ...job, email: e.target.value })} />
                    </div>
                  </div>
                )}
                <WhopProvider>
                  <CardOnFile
                    name={job.name}
                    email={job.email}
                    jobRef={job.jobRef}
                    depositPaymentId={job.paymentId}
                    returnUrl={pageUrl}
                    onSaved={(card) => {
                      const j = { ...job, card }
                      setJob(j); saveJob(j); setStep('done')
                    }}
                  />
                </WhopProvider>
              </div>
            )}

            {step === 'done' && (
              <div className="py-6 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Icon d={icons.check} className="size-7" /></span>
                <h2 className="mt-5 text-2xl font-bold">{isDeposit ? 'Your project is reserved!' : 'You’re booked!'}</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-600">
                  {isDeposit
                    ? `We’ll call within one business day to schedule your install. Your ${usd(plan.price)} deposit is paid and your card is on file for the final balance.`
                    : 'Payment received. We’ll reach out shortly to schedule your visit. A receipt is on its way to your email.'}
                </p>
                <dl className="mx-auto mt-6 max-w-md divide-y divide-slate-100 rounded-2xl bg-slate-50 px-5 text-left text-sm">
                  {job.jobRef && <Row k="Job reference" v={job.jobRef} />}
                  {job.paymentId && <Row k="Payment" v={job.paymentId} />}
                  {job.card && <Row k="Setup intent" v={job.card.id} />}
                  {job.card?.paymentMethodId && <Row k="Saved payment method" v={job.card.paymentMethodId} />}
                  {job.card?.card?.last4 && <Row k="Card" v={`${job.card.card.brand ?? 'Card'} •••• ${job.card.card.last4}`} />}
                </dl>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link to="/" className="btn-ghost">Back to home</Link>
                  {isDeposit && <button className="btn-ghost" onClick={startOver}>Start a new booking</button>}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{k}</dt>
      <dd className="truncate font-mono text-xs leading-5 font-medium">{v}</dd>
    </div>
  )
}
