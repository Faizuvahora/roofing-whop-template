import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Logo } from '../components/Header'
import { adminCreateFinalInvoice, adminGetInvoice, adminListSavedCards } from '../server/functions'
import { usd } from '../lib/plans'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Billing · Admin' }, { name: 'robots', content: 'noindex' }] }),
  component: Admin,
})

type Cards = Awaited<ReturnType<typeof adminListSavedCards>>
type Card = Cards['cards'][number]
type Invoice = Awaited<ReturnType<typeof adminCreateFinalInvoice>>

function Admin() {
  const [pin, setPin] = useState('')
  const [data, setData] = useState<Cards | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true); setErr(null)
    try { setData(await adminListSavedCards({ data: { pin } })) } catch (x: any) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="section flex h-16 items-center justify-between">
          <Logo />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Billing admin</span>
        </div>
      </header>
      <main className="section py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bill a final balance</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Customers who paid a deposit keep a card on file (a Whop setup intent). Create the final-balance invoice here with the Whop Invoices API. You can
          <b> auto-charge</b> the stored card, or <b>email the invoice</b> so the customer pays online.
        </p>

        {!data ? (
          <form onSubmit={load} className="mt-8 flex max-w-sm gap-2">
            <input className="field" type="password" placeholder="Admin PIN" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
            <button className="btn-dark shrink-0" disabled={!pin || busy}>{busy ? '…' : 'Unlock'}</button>
          </form>
        ) : (
          <Billing pin={pin} data={data} reload={load} />
        )}
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        <Link to="/" className="mt-10 inline-block text-sm text-slate-500 hover:text-ink">← Back to site</Link>
      </main>
    </div>
  )
}

function Billing({ pin, data, reload }: { pin: string; data: Cards; reload: () => void }) {
  const [sel, setSel] = useState<Card | null>(data.cards[0] ?? null)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [email, setEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [amount, setAmount] = useState('8650')
  const [description, setDescription] = useState('Roof replacement: final balance after walkthrough (materials + labor, less $500 deposit)')
  const [dueInDays, setDueInDays] = useState('7')
  const [address, setAddress] = useState({ line1: '2100 S Lamar Blvd', city: 'Austin', state: 'TX', postal_code: '78704', country: 'US' })
  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [k]: e.target.value }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  const effEmail = sel?.metadata?.customer_email ?? email
  const jobRef = sel?.metadata?.job_ref ?? `JOB-${Date.now().toString(36).toUpperCase()}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null); setInvoice(null)
    try {
      setInvoice(
        await adminCreateFinalInvoice({
          data: {
            pin,
            mode,
            email: effEmail,
            customerName: sel?.metadata?.customer_name ?? customerName,
            memberId: sel?.memberId ?? undefined,
            paymentMethodId: mode === 'auto' ? sel?.paymentMethodId ?? undefined : undefined,
            amount: Number(amount),
            description,
            jobRef,
            dueInDays: Number(dueInDays),
            address,
          },
        }),
      )
    } catch (x: any) { setErr(x.message) } finally { setBusy(false) }
  }

  async function refresh() {
    if (!invoice) return
    try { const r = await adminGetInvoice({ data: { pin, id: invoice.id } }); setInvoice({ ...invoice, ...r }) } catch (x: any) { setErr(x.message) }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Cards on file</h2>
          <button className="text-xs font-semibold text-accent" onClick={reload}>Refresh</button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Succeeded setup intents · {data.environment}</p>
        <ul className="mt-4 space-y-2">
          {data.cards.length === 0 && <li className="text-sm text-slate-500">No saved cards yet. Complete a deposit checkout first.</li>}
          {data.cards.map((c) => (
            <li key={c.id}>
              <button onClick={() => { setSel(c); setMode('auto') }} className={`w-full rounded-2xl px-4 py-3 text-left ring-1 transition ${sel?.id === c.id ? 'bg-orange-50 ring-accent' : 'ring-slate-200 hover:bg-slate-50'}`}>
                <div className="flex justify-between gap-2 text-sm font-semibold">
                  <span className="truncate">{c.metadata?.customer_name || c.metadata?.customer_email || c.memberId || 'Customer'}</span>
                  <span>{c.card?.last4 ? `${c.card.brand ?? 'Card'} •••• ${c.card.last4}` : c.methodType}</span>
                </div>
                <div className="mt-1 flex justify-between gap-2 font-mono text-[11px] text-slate-500">
                  <span className="truncate">{c.metadata?.job_ref ?? c.id}</span>
                  <span>{c.paymentMethodId}</span>
                </div>
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => { setSel(null); setMode('manual') }} className={`w-full rounded-2xl px-4 py-3 text-left text-sm ring-1 ${!sel ? 'bg-orange-50 ring-accent' : 'ring-slate-200 hover:bg-slate-50'}`}>
              + Bill a customer by email (no card on file)
            </button>
          </li>
        </ul>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold">Final balance invoice</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4">
          {!sel && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Customer email</label><input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className="label">Customer name</label><input className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            </div>
          )}
          {sel && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              Billing <b>{sel.metadata?.customer_name || effEmail}</b> {effEmail && <>({effEmail})</>} · job <code>{jobRef}</code>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Amount (USD)</label><input className="field" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><label className="label">Due in (days, manual only)</label><input className="field" inputMode="numeric" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} disabled={mode === 'auto'} /></div>
          </div>
          <fieldset className="grid gap-3 sm:grid-cols-6">
            <legend className="label sm:col-span-6">Job site / billing address (used for invoice tax)</legend>
            <input className="field sm:col-span-6" placeholder="Street" value={address.line1} onChange={setAddr('line1')} required />
            <input className="field sm:col-span-2" placeholder="City" value={address.city} onChange={setAddr('city')} required />
            <input className="field sm:col-span-1" placeholder="State" value={address.state} onChange={setAddr('state')} />
            <input className="field sm:col-span-2" placeholder="ZIP" value={address.postal_code} onChange={setAddr('postal_code')} required />
            <input className="field sm:col-span-1" placeholder="Country" value={address.country} onChange={setAddr('country')} maxLength={2} />
          </fieldset>
          <div><label className="label">Line item description</label><textarea className="field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            {([
              ['auto', 'Auto-charge card on file', 'Charges the saved payment method now (off-session).'],
              ['manual', 'Send for manual payment', 'Emails the invoice with a Whop pay link.'],
            ] as const).map(([v, t, d]) => (
              <label key={v} className={`cursor-pointer rounded-2xl p-4 ring-1 ${mode === v ? 'bg-orange-50 ring-accent' : 'ring-slate-200'} ${v === 'auto' && !sel?.paymentMethodId ? 'pointer-events-none opacity-50' : ''}`}>
                <input type="radio" name="mode" className="sr-only" checked={mode === v} onChange={() => setMode(v)} />
                <span className="block text-sm font-semibold">{t}</span>
                <span className="mt-1 block text-xs text-slate-500">{d}</span>
              </label>
            ))}
          </fieldset>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary !py-3.5" disabled={busy}>
            {busy ? 'Creating…' : mode === 'auto' ? `Charge ${usd(Number(amount) || 0)} to card on file` : `Email ${usd(Number(amount) || 0)} invoice`}
          </button>
        </form>

        {invoice && (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
            <p className="font-semibold">Invoice {invoice.number ?? invoice.id} created · status: {invoice.status}</p>
            <p className="mt-1 font-mono text-xs">{invoice.id}</p>
            {invoice.warning && <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">{invoice.warning}</p>}
            {invoice.checkoutLink && <a className="mt-2 block font-semibold underline" href={invoice.checkoutLink} target="_blank" rel="noreferrer">Open hosted payment link ↗</a>}
            <button className="mt-3 text-xs font-semibold underline" onClick={refresh}>Refresh status</button>
          </div>
        )}
      </section>
    </div>
  )
}
