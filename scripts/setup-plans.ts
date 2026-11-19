/**
 * Creates (or reuses) one Whop product + one-time plan for every entry in
 * `site.plans` and writes their IDs to src/whop.plans.json.
 *
 *   npm run setup:plans            # sandbox (default)
 *   npm run setup:plans -- --prod  # production
 *
 * Reads WHOP_SANDBOX_API_KEY / WHOP_SANDBOX_COMPANY_ID (or WHOP_PROD_*) from
 * ../.env or ./.env. Safe to re-run: plans whose title + price are unchanged
 * are reused; anything that changed gets a fresh plan.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { site, type PlanKey } from '../src/site.config.ts'

for (const p of ['.env', '../.env']) if (existsSync(p)) process.loadEnvFile(p)

const prod = process.argv.includes('--prod')
const env = prod ? 'production' : 'sandbox'
const API = prod ? 'https://api.whop.com/api/v1' : 'https://sandbox-api.whop.com/api/v1'
const KEY = prod ? process.env.WHOP_PROD_API_KEY : process.env.WHOP_SANDBOX_API_KEY
const ACCOUNT = prod ? process.env.WHOP_PROD_COMPANY_ID : process.env.WHOP_SANDBOX_COMPANY_ID
if (!KEY || !ACCOUNT) throw new Error(`Missing ${prod ? 'WHOP_PROD' : 'WHOP_SANDBOX'}_API_KEY / _COMPANY_ID in .env`)

const OUT = resolve('src/whop.plans.json')
type Entry = { productId: string; planId: string; price: number; title: string }
type Out = { environment: string; accountId: string; plans: Partial<Record<PlanKey, Entry>> }
const prev: Out | null = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null
const out: Out = { environment: env, accountId: ACCOUNT, plans: prev?.environment === env && prev.accountId === ACCOUNT ? prev.plans : {} }

async function whop<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json as T
}

for (const [key, plan] of Object.entries(site.plans) as [PlanKey, (typeof site.plans)[PlanKey]][]) {
  const existing = out.plans[key]
  if (existing && existing.price === plan.price && existing.title === plan.title) {
    console.log(`✓ ${key}: reusing ${existing.planId}`)
    continue
  }
  const product = await whop<{ id: string }>('/products', {
    account_id: ACCOUNT,
    title: plan.title.slice(0, 80),
    headline: plan.shortTitle,
    description: plan.description,
    visibility: 'visible',
    metadata: { template_plan_key: key },
  })
  const variant = await whop<{ id: string }>('/variants', {
    account_id: ACCOUNT,
    product_id: product.id,
    title: plan.shortTitle.slice(0, 30),
    billing_type: 'one_time',
    initial_price: plan.price,
    adaptive_pricing_enabled: false, // always charge USD (no local-currency repricing)
    currency: 'usd',
    visibility: 'visible',
  })
  out.plans[key] = { productId: product.id, planId: variant.id, price: plan.price, title: plan.title }
  console.log(`+ ${key}: ${product.id} / ${variant.id} ($${plan.price})`)
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(`\nWrote ${OUT} (${env})`)
