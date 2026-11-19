import { useEffect, useState } from 'react'

type Entry = NonNullable<Window['__whopEvents']>[number]

/**
 * Live list of custom whop.track events. Hidden unless the URL has ?debug=1,
 * which makes pixel events easy to show in a screen recording.
 */
export function EventDebugPanel() {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<Entry[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('debug')) {
      try { sessionStorage.setItem('whop-debug', '1') } catch {}
    }
    let on = params.has('debug')
    try { on ||= sessionStorage.getItem('whop-debug') === '1' } catch {}
    setOpen(on)
    setEvents([...(window.__whopEvents ?? [])])
    const onEvt = () => setEvents([...(window.__whopEvents ?? [])])
    window.addEventListener('whop:tracked', onEvt)
    return () => window.removeEventListener('whop:tracked', onEvt)
  }, [])

  if (!open) return null
  const pixel = typeof window !== 'undefined' && typeof window.whop?.track === 'function'
  return (
    <div className="fixed right-3 bottom-3 z-50 w-[min(340px,calc(100vw-24px))] rounded-2xl bg-slate-900/95 p-3 text-xs text-slate-100 shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">whop.track events</span>
        <span className={`rounded-full px-2 py-0.5 ${pixel ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          pixel {pixel ? 'loaded' : 'not loaded'}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="text-slate-400">No custom events yet. Scroll to Services, start a deposit, or send an estimate.</p>
      ) : (
        <ul className="max-h-60 space-y-1.5 overflow-auto">
          {events.slice().reverse().map((e, i) => (
            <li key={i} className="rounded-lg bg-white/5 px-2 py-1.5">
              <div className="flex justify-between gap-2">
                <code className="font-semibold text-orange-300">{e.name}</code>
                <span className="text-slate-400">{new Date(e.at).toLocaleTimeString()}</span>
              </div>
              <code className="block truncate text-slate-300">{JSON.stringify(e.props)}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
