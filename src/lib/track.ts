/**
 * Custom Whop pixel events. On *.whop.site Whop injects the pixel and exposes
 * `window.whop` before app code runs (page views + checkout events are
 * automatic). These are the template's custom events:
 *   estimate_requested · service_viewed · deposit_started
 *
 * Every call is also mirrored to `window.__whopEvents` and the console so you
 * can verify events live (add ?debug=1 to the URL to open the event panel).
 */
export type CustomEvent = 'estimate_requested' | 'service_viewed' | 'deposit_started'

type Props = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    whop?: { track?: (name: string, props?: Props) => void }
    __whopEvents?: { name: string; props: Props; at: string; sent: boolean }[]
  }
}

export function track(name: CustomEvent, props: Props = {}) {
  if (typeof window === 'undefined') return
  let sent = false
  try {
    if (typeof window.whop?.track === 'function') {
      window.whop.track(name, props)
      sent = true
    }
  } catch (err) {
    console.warn('[whop.track] failed', err)
  }
  const entry = { name, props, at: new Date().toISOString(), sent }
  ;(window.__whopEvents ??= []).push(entry)
  window.dispatchEvent(new CustomEvent('whop:tracked', { detail: entry }))
  console.info(`[whop.track] ${name}`, props, sent ? '(sent to Whop pixel)' : '(pixel not loaded — local preview)')
}

/** Fire once per key per page load (e.g. one service_viewed per service). */
const fired = new Set<string>()
export function trackOnce(key: string, name: CustomEvent, props: Props = {}) {
  if (fired.has(key)) return
  fired.add(key)
  track(name, props)
}
