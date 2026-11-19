import { site, type PlanKey } from '../site.config'
import whopPlans from '../whop.plans.json'

export const WHOP_ENV = whopPlans.environment as 'sandbox' | 'production'
export const WHOP_ACCOUNT_ID = whopPlans.accountId

export const PLAN_KEYS = Object.keys(site.plans) as PlanKey[]

export function isPlanKey(k: string): k is PlanKey {
  return (PLAN_KEYS as string[]).includes(k)
}

export function getPlan(key: PlanKey) {
  const cfg = site.plans[key]
  const ids = (whopPlans.plans as Partial<Record<PlanKey, { planId: string; productId: string }>>)[key]
  if (!ids) throw new Error(`Plan "${key}" has no Whop ID. Run \`npm run setup:plans\`.`)
  return { key, ...cfg, planId: ids.planId, productId: ids.productId }
}

export const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 })
