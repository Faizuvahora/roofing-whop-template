import { useState } from 'react'
import { site } from '../site.config'
import { submitEstimate } from '../server/functions'
import { track } from '../lib/track'
import { Icon, SectionHeading, icons } from './ui'

const empty = { name: '', email: '', phone: '', zip: '', address: '', projectType: site.estimateForm.projectTypes[0] as string, message: '' }

export function EstimateForm() {
  const [form, setForm] = useState(empty)
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; msg?: string; ref?: string }>({ status: 'idle' })
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'sending' })
    try {
      const res = await submitEstimate({ data: { ...form, pageUrl: window.location.href } })
      track('estimate_requested', { project_type: form.projectType, zip: form.zip || null, lead_id: res.memberId })
      setState({ status: 'done', ref: res.memberId })
      setForm(empty)
    } catch (err) {
      setState({ status: 'error', msg: err instanceof Error ? err.message : 'Something went wrong. Please call us.' })
    }
  }

  const ef = site.estimateForm
  return (
    <section id="estimate" className="bg-slate-50 py-20">
      <div className="section grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Free estimate" title={ef.headline} sub={ef.sub} />
          <ul className="mt-8 space-y-4 text-sm">
            {['No-pressure, written quote', 'Insurance claim guidance included', 'Response within one business day'].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Icon d={icons.check} className="size-4" /></span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Prefer to talk?</p>
            <a href={site.company.phoneHref} className="mt-1 flex items-center gap-2 text-xl font-bold">
              <Icon d={icons.phone} className="size-5 text-accent" /> {site.company.phone}
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {state.status === 'done' ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Icon d={icons.check} className="size-7" /></span>
              <h3 className="mt-5 text-2xl font-bold">Request received!</h3>
              <p className="mx-auto mt-2 max-w-sm text-slate-600">Thanks! A project manager from {site.company.shortName} will reach out within one business day.</p>
              <p className="mt-4 text-xs text-slate-400">Reference: {state.ref}</p>
              <button className="btn-ghost mt-6" onClick={() => setState({ status: 'idle' })}>Send another request</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="ef-name">Full name *</label>
                <input id="ef-name" className="field" required autoComplete="name" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label" htmlFor="ef-email">Email *</label>
                <input id="ef-email" type="email" className="field" required autoComplete="email" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label" htmlFor="ef-phone">Phone</label>
                <input id="ef-phone" type="tel" className="field" autoComplete="tel" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label" htmlFor="ef-address">Street address</label>
                <input id="ef-address" className="field" autoComplete="street-address" value={form.address} onChange={set('address')} />
              </div>
              <div>
                <label className="label" htmlFor="ef-zip">ZIP</label>
                <input id="ef-zip" className="field" inputMode="numeric" maxLength={10} autoComplete="postal-code" value={form.zip} onChange={set('zip')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="ef-type">What do you need?</label>
                <select id="ef-type" className="field" value={form.projectType} onChange={set('projectType')}>
                  {ef.projectTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="ef-msg">Tell us about your roof</label>
                <textarea id="ef-msg" rows={4} className="field resize-y" placeholder="Age of roof, leaks, storm damage, timeline…" value={form.message} onChange={set('message')} />
              </div>
              {state.status === 'error' && <p className="text-sm text-red-600 sm:col-span-2" role="alert">{state.msg}</p>}
              <div className="sm:col-span-2">
                <button className="btn-primary w-full !py-3.5 text-base" disabled={state.status === 'sending'}>
                  {state.status === 'sending' ? 'Sending…' : 'Request my free estimate'}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">We’ll only use your info to contact you about this estimate.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
