/**
 * Thin server-only client for the Whop REST API (v1).
 * Never import this from client components — it reads the secret API key.
 *
 * Runtime env (set with `whop apps secrets set` for the hosted site, or ../.env locally):
 *   WHOP_ENV            "sandbox" (default) | "production"
 *   WHOP_SANDBOX_API_KEY / WHOP_PROD_API_KEY   account API key for that environment
 *   ADMIN_PIN           PIN that unlocks the /admin billing page
 */
import plans from '../whop.plans.json'

type Env = Record<string, string | undefined>

function env(): Env {
  return (globalThis as { process?: { env: Env } }).process?.env ?? {}
}

export function whopEnvironment(): 'sandbox' | 'production' {
  return env().WHOP_ENV === 'production' ? 'production' : 'sandbox'
}

function apiBase() {
  return whopEnvironment() === 'production' ? 'https://api.whop.com/api/v1' : 'https://sandbox-api.whop.com/api/v1'
}

function apiKey() {
  const e = env()
  const key = whopEnvironment() === 'production' ? e.WHOP_PROD_API_KEY : e.WHOP_SANDBOX_API_KEY
  if (!key) throw new Error(`Server is missing the ${whopEnvironment()} Whop API key`)
  return key
}

/** The Whop business (biz_) that owns the plans in src/whop.plans.json. */
export const ACCOUNT_ID: string = plans.accountId

export class WhopApiError extends Error {
  constructor(public status: number, message: string, public body: unknown) {
    super(message)
  }
}

export async function whopApi<T = any>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
  opts: { idempotencyKey?: string } = {},
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = json?.error?.message ?? `Whop API ${res.status}`
    console.error(`[whop] ${method} ${path} → ${res.status}`, text.slice(0, 500))
    throw new WhopApiError(res.status, msg, json)
  }
  return json as T
}

export function checkAdminPin(pin: string) {
  const expected = env().ADMIN_PIN
  if (!expected) throw new Error('ADMIN_PIN is not configured on the server')
  if (pin !== expected) throw new Error('Wrong admin PIN')
}
