/**
 * Server functions (TanStack Start). Each runs only on the server; the client
 * calls them like async functions over RPC.
 */
import { createServerFn } from '@tanstack/react-start'
import { ACCOUNT_ID, checkAdminPin, whopApi, whopEnvironment } from './whop-api'

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const clean = (s: unknown, max = 500) => String(s ?? '').trim().slice(0, max)

/* ───────────────────────── Estimate form → Whop lead ───────────────────────── */

export interface EstimateInput {
  name: string
  email: string
  phone: string
  zip: string
  address: string
  projectType: string
  message: string
  pageUrl?: string
}

/**
 * Creates the lead on the Whop account. Whop's legacy Leads API was folded into
 * Members: a person who joins without buying is a member with
 * most_recent_action "joined" (dashboard → Customers, filter "Leads").
 * We also record a standard `lead` conversion event carrying the contact
 * details so it shows in the pixel/attribution dashboard.
 */
export const submitEstimate = createServerFn({ method: 'POST' })
  .validator((d: EstimateInput) => {
    const data = {
      name: clean(d.name, 120),
      email: clean(d.email, 200).toLowerCase(),
      phone: clean(d.phone, 40),
      zip: clean(d.zip, 10),
      address: clean(d.address, 200),
      projectType: clean(d.projectType, 60),
      message: clean(d.message, 1000),
      pageUrl: clean(d.pageUrl, 500),
    }
    if (!data.name) throw new Error('Please enter your name')
    if (!isEmail(data.email)) throw new Error('Please enter a valid email')
    return data
  })
  .handler(async ({ data }) => {
    const member = await whopApi<{ id: string; user?: { id: string } }>('POST', '/members', {
      account_id: ACCOUNT_ID,
      email: data.email,
      name: data.name,
    })
    const [first, ...rest] = data.name.split(' ')
    const event = await whopApi<{ id: string }>('POST', '/events', {
      account_id: ACCOUNT_ID,
      event_name: 'lead',
      action_source: 'website',
      url: data.pageUrl || null,
      user: {
        email: data.email,
        name: data.name,
        first_name: first,
        last_name: rest.join(' ') || null,
        phone: data.phone || null,
        postal_code: data.zip || null,
        member_id: member.id,
        user_id: member.user?.id ?? null,
      },
    }).catch((e) => {
      // The lead itself is already saved; never fail the form over analytics.
      console.error('[whop] lead event failed', e)
      return null
    })
    console.log('[estimate] lead', member.id, data.projectType, data.zip, data.message.slice(0, 200))
    return { memberId: member.id, eventId: event?.id ?? null }
  })

/* ───────────────────── Card on file → Whop setup intent ───────────────────── */

export interface SaveCardInput {
  confirmationToken: string
  email: string
  name: string
  jobRef: string
  depositPaymentId?: string
  returnUrl: string
}

export interface SetupIntent {
  id: string
  status: 'processing' | 'succeeded' | 'canceled' | 'requires_action' | string
  client_secret?: string | null
  payment_method_id: string | null
  member_id: string | null
  payment_method_type?: string | null
  payment_instrument?: { brand?: string; last4?: string } | null
  metadata?: Record<string, string> | null
  created_at?: string
  last_setup_error?: { message?: string } | null
}

/** Confirms the Payments element's ctok_ into a setup intent (card saved for off-session use). */
export const saveCardOnFile = createServerFn({ method: 'POST' })
  .validator((d: SaveCardInput) => {
    if (!/^ctok_/.test(d.confirmationToken)) throw new Error('Missing confirmation token')
    if (!isEmail(clean(d.email))) throw new Error('A valid email is required')
    return {
      confirmationToken: d.confirmationToken,
      email: clean(d.email, 200).toLowerCase(),
      name: clean(d.name, 120),
      jobRef: clean(d.jobRef, 60),
      depositPaymentId: clean(d.depositPaymentId, 60),
      returnUrl: clean(d.returnUrl, 2000),
    }
  })
  .handler(async ({ data }) => {
    const si = await whopApi<SetupIntent>('POST', '/setup_intents', {
      account_id: ACCOUNT_ID,
      confirmation_token: data.confirmationToken,
      email: data.email,
      currency: 'usd',
      return_url: data.returnUrl.startsWith('https://') ? data.returnUrl : null,
      metadata: {
        purpose: 'final_balance',
        customer_email: data.email,
        customer_name: data.name,
        job_ref: data.jobRef,
        ...(data.depositPaymentId ? { deposit_payment_id: data.depositPaymentId } : {}),
      },
    })
    return pickSetup(si)
  })

export const getSetupIntent = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => {
    if (!/^sint_[A-Za-z0-9]+$/.test(d.id)) throw new Error('Bad setup intent id')
    return d
  })
  .handler(async ({ data }) => pickSetup(await whopApi<SetupIntent>('GET', `/setup_intents/${data.id}`)))

/**
 * Recovers a deposit after the checkout left the page (e.g. Whop showed its own
 * "payment is on its way" screen). Checkout metadata is copied onto the payment,
 * so we look it up by the job reference the browser generated.
 */
export const findDepositPayment = createServerFn({ method: 'POST' })
  .validator((d: { jobRef: string }) => {
    if (!/^JOB-[A-Z0-9]{4,12}$/.test(d.jobRef)) throw new Error('Bad job reference')
    return d
  })
  .handler(async ({ data }) => {
    type P = { id: string; status: string; customer_email?: string | null; billing_address?: { name?: string | null } | null; metadata?: Record<string, string> | null }
    const res = await whopApi<{ data: P[] }>('GET', `/payments?account_id=${ACCOUNT_ID}&first=50&direction=desc`)
    const p = res.data.find((x) => x.metadata?.job_ref === data.jobRef && x.metadata?.plan_key === 'deposit')
    return p ? { paymentId: p.id, status: p.status, email: p.customer_email ?? '', name: p.billing_address?.name ?? '' } : null
  })

function pickSetup(si: SetupIntent) {
  return {
    id: si.id,
    status: si.status,
    clientSecret: si.client_secret ?? null,
    paymentMethodId: si.payment_method_id,
    memberId: si.member_id,
    card: si.payment_instrument
      ? {
          brand: (si.payment_instrument as any).card?.brand ?? si.payment_instrument.brand ?? null,
          last4: (si.payment_instrument as any).card?.last4 ?? si.payment_instrument.last4 ?? null,
        }
      : null,
    methodType: si.payment_method_type ?? null,
    metadata: si.metadata ?? {},
    createdAt: si.created_at ?? null,
    error: si.last_setup_error?.message ?? null,
  }
}

/* ───────────────────────── Admin: final balance invoices ───────────────────────── */

export const adminListSavedCards = createServerFn({ method: 'POST' })
  .validator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    checkAdminPin(data.pin)
    const res = await whopApi<{ data: SetupIntent[] }>(
      'GET',
      `/setup_intents?account_id=${ACCOUNT_ID}&status=succeeded&first=25&direction=desc`,
    )
    return { environment: whopEnvironment(), cards: res.data.map(pickSetup) }
  })

export interface InvoiceInput {
  pin: string
  /** "auto" = charge the stored card now; "manual" = email the invoice with a pay link. */
  mode: 'auto' | 'manual'
  email: string
  customerName: string
  memberId?: string
  paymentMethodId?: string
  amount: number
  description: string
  jobRef: string
  dueInDays: number
  /** Job-site / billing address. Whop needs it to resolve invoice tax. */
  address: { line1: string; city: string; state: string; postal_code: string; country: string }
}

function invoicePayUrl(token: string | null | undefined) {
  if (!token) return null
  if (/^https?:\/\//.test(token)) return token
  return `${whopEnvironment() === 'production' ? 'https://whop.com' : 'https://sandbox.whop.com'}/checkout/${token}`
}

export const adminCreateFinalInvoice = createServerFn({ method: 'POST' })
  .validator((d: InvoiceInput) => {
    const amount = Math.round(Number(d.amount) * 100) / 100
    if (!(amount >= 1)) throw new Error('Amount must be at least $1.00')
    if (d.mode === 'auto' && !/^payt_/.test(d.paymentMethodId ?? '')) throw new Error('Auto-charge needs a saved card (payt_)')
    if (!d.memberId && !isEmail(clean(d.email))) throw new Error('Customer email required')
    const a = d.address ?? ({} as InvoiceInput['address'])
    const address = {
      line1: clean(a.line1, 200),
      city: clean(a.city, 100),
      state: clean(a.state, 100),
      postal_code: clean(a.postal_code, 20),
      country: clean(a.country, 2).toUpperCase() || 'US',
    }
    if (!address.line1 || !address.city || !address.postal_code) throw new Error('Billing address (street, city, ZIP) is required')
    return { ...d, address, amount, description: clean(d.description, 1000), jobRef: clean(d.jobRef, 60), dueInDays: Math.max(0, Math.min(60, Number(d.dueInDays) || 0)) }
  })
  .handler(async ({ data }) => {
    checkAdminPin(data.pin)
    const due = new Date(Date.now() + data.dueInDays * 86_400_000).toISOString()
    const customer = data.memberId ? { member_id: data.memberId } : { email_address: data.email, customer_name: data.customerName || null }

    const draft = await whopApi<{ id: string; status: string }>('POST', '/invoices', {
      account_id: ACCOUNT_ID,
      ...customer,
      billing_address: { ...data.address, state: data.address.state || null, name: data.customerName || null },
      items: [
        {
          variant: {
            title: 'Final balance',
            billing_type: 'one_time',
            initial_price: data.amount,
            currency: 'usd',
            visibility: 'hidden',
          },
          description: data.description || `Final balance for job ${data.jobRef}`,
        },
      ],
      ...(data.mode === 'auto' ? { payment_method_id: data.paymentMethodId } : { due_at: due }),
      memo: `Job ${data.jobRef}. Thank you for choosing us!`,
      metadata: { job_ref: data.jobRef, kind: 'final_balance' },
    })

    // auto: issue → Whop charges the stored card off-session right away.
    // manual: send → Whop emails the invoice with its hosted pay link.
    let finalized: any = draft
    let warning: string | null = null
    try {
      finalized = await whopApi<any>('POST', `/invoices/${draft.id}/${data.mode === 'auto' ? 'issue' : 'send'}`, {})
    } catch (e: any) {
      // e.g. the account must finish Whop verification before invoices can be issued.
      // The draft still exists on the account; surface why it wasn't issued yet.
      const step = data.mode === 'auto' ? `POST /invoices/${draft.id}/issue (auto-charge ${data.paymentMethodId})` : `POST /invoices/${draft.id}/send (email with pay link)`
      warning = `Invoice ${draft.id} was created on the Whop account as a draft. The next call, ${step}, was refused by Whop: "${e?.message ?? 'unknown error'}". Once the business finishes Whop verification, the same button completes this step with no code changes.`
    }
    return {
      id: finalized.id ?? draft.id,
      status: finalized.status ?? draft.status,
      number: finalized.number ?? null,
      checkoutLink: invoicePayUrl(finalized.checkout_link),
      amountDue: finalized.amount_due ?? null,
      mode: data.mode,
      warning,
    }
  })

export const adminGetInvoice = createServerFn({ method: 'POST' })
  .validator((d: { pin: string; id: string }) => d)
  .handler(async ({ data }) => {
    checkAdminPin(data.pin)
    const inv = await whopApi<any>('GET', `/invoices/${encodeURIComponent(data.id)}`)
    return { id: inv.id, status: inv.status, number: inv.number ?? null, checkoutLink: invoicePayUrl(inv.checkout_link), amountDue: inv.amount_due ?? null }
  })

/** Public config the client needs (no secrets). */
export const getPublicConfig = createServerFn({ method: 'GET' }).handler(async () => ({
  environment: whopEnvironment(),
  accountId: ACCOUNT_ID,
}))
