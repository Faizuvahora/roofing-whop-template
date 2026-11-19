/**
 * All payment UI is Whop Payment Elements. Card data never touches this app.
 *  - PlanCheckout:  <Checkout> + <ExpressCheckoutElement> (Apple/Google Pay) + <CheckoutElement>
 *                   (full hosted checkout: cards, BNPL/financing like Klarna, Afterpay, Splitit for eligible merchants)
 *  - CardOnFile:    <Payments mode="setup"> + <PaymentElement> + <AddressElement> + <BrandingElement>
 *                   → confirmation token → server creates a Whop setup intent (card saved off-session)
 */
import {
  AddressElement,
  BrandingElement,
  Checkout,
  CheckoutElement,
  ExpressCheckoutElement,
  PaymentElement,
  Payments,
  WhopElements,
  usePayments,
  useWhop,
} from '@whop/elements-react'
import { loadWhop } from '@whop/elements'
import { useEffect, useState, type ReactNode } from 'react'
import { WHOP_ACCOUNT_ID, WHOP_ENV } from '../lib/plans'
import { getSetupIntent, saveCardOnFile } from '../server/functions'
import { Icon, icons } from './ui'

export function WhopProvider({ children }: { children: ReactNode }) {
  const [elements, setElements] = useState<ReturnType<typeof loadWhop> | null>(null)
  useEffect(() => setElements(loadWhop()), [])
  return (
    <WhopElements elements={elements} environment={WHOP_ENV} locale="en" onLoadError={(e) => console.error('[whop elements] failed to load', e)}>
      {children}
    </WhopElements>
  )
}

export function SandboxBadge() {
  if (WHOP_ENV !== 'sandbox') return null
  return (
    <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
      <b>Test mode (Whop sandbox).</b> Use card <code className="font-semibold">4242 4242 4242 4242</code>, any future expiry, any CVC and ZIP. No real money moves.
    </div>
  )
}

const Loading = ({ label = 'Loading secure checkout…' }: { label?: string }) => (
  <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
    <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-accent" /> {label}
  </div>
)

/* ───────────────────────── Plan checkout ───────────────────────── */
export function PlanCheckout(props: {
  planId: string
  buyerEmail?: string
  returnUrl: string
  metadata: Record<string, string>
  onPaid: (paymentId: string) => void
}) {
  // A checkout's entry slot holds exactly one of CheckoutElement | ExpressCheckoutElement,
  // so the one-tap wallet button and the full checkout each get their own <Checkout>.
  const shared = {
    plan: props.planId,
    returnUrl: props.returnUrl,
    metadata: props.metadata,
    onComplete: (p: { result: string; paymentId?: string }) => {
      if (p.result === 'payment' && p.paymentId) props.onPaid(p.paymentId)
    },
  }
  return (
    <div className="space-y-4">
      <Checkout {...shared}>
        <ExpressCheckoutElement layout="auto" fallback={null} />
      </Checkout>
      <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-slate-400 uppercase">
        <span className="h-px flex-1 bg-slate-200" /> Apple Pay / Google Pay above · or card & financing below <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Checkout {...shared}>
        <CheckoutElement buyerEmail={props.buyerEmail} fallback={<Loading />} />
      </Checkout>
    </div>
  )
}

/* ───────────────────────── Card on file (setup intent) ───────────────────────── */
export type SavedCard = Awaited<ReturnType<typeof saveCardOnFile>>

export function CardOnFile(props: {
  name: string
  email: string
  jobRef: string
  depositPaymentId?: string
  returnUrl: string
  onSaved: (card: SavedCard) => void
}) {
  return (
    <Payments accountId={WHOP_ACCOUNT_ID} mode="setup" currency="usd" setupFutureUsage="off_session" returnUrl={props.returnUrl}>
      <CardOnFileForm {...props} />
    </Payments>
  )
}

function CardOnFileForm({ name, email, jobRef, depositPaymentId, returnUrl, onSaved }: Parameters<typeof CardOnFile>[0]) {
  const payments = usePayments()
  const whop = useWhop()
  const [complete, setComplete] = useState(false)
  const [addressOk, setAddressOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!payments) return
    setBusy(true)
    setError(null)
    try {
      const { confirmationToken } = await payments.createConfirmationToken({ billingDetails: { name, email } })
      let si = await saveCardOnFile({ data: { confirmationToken, email, name, jobRef, depositPaymentId, returnUrl } })
      if (si.status === 'requires_action' && si.clientSecret && whop) {
        const next = await whop.payments.handleNextAction({ clientSecret: si.clientSecret, returnUrl })
        if (next.redirected) return
        si = await getSetupIntent({ data: { id: si.id } })
      }
      // Setups can finish asynchronously; poll briefly for the saved method.
      for (let i = 0; i < 6 && si.status === 'processing'; i++) {
        await new Promise((r) => setTimeout(r, 1500))
        si = await getSetupIntent({ data: { id: si.id } })
      }
      if (si.status !== 'succeeded') throw new Error(si.error ?? `Card could not be saved (status: ${si.status})`)
      onSaved(si)
    } catch (e: any) {
      if (e?.code === 'payment_request_cancelled') setError(null)
      else setError(e?.message ?? 'Could not save the card')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement onChange={(e) => setComplete(e.complete)} fallback={<Loading label="Loading secure card form…" />} />
      <AddressElement onChange={(e) => setAddressOk(e.complete)} />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button className="btn-primary w-full !py-3.5 text-base" disabled={!complete || !addressOk || busy || !payments} onClick={save}>
        <Icon d={icons.lock} className="size-4" /> {busy ? 'Saving card…' : 'Save card on file'}
      </button>
      <p className="text-center text-xs text-slate-500">You won’t be charged now. The card is only used for your final balance after the walkthrough.</p>
      <BrandingElement />
    </div>
  )
}
