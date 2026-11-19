import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import appCss from '../styles.css?url'
import { site } from '../site.config'
import { EventDebugPanel } from '../components/EventDebugPanel'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.company.name}: Roof Repair, Replacement & Inspections in ${site.company.address}` },
      { name: 'description', content: site.hero.sub },
      { name: 'theme-color', content: site.theme.ink },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${site.theme.accent}"/><path d="M6 17 16 8l10 9M10 14.5V25h12V14.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/></svg>`)}`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const vars = {
    '--accent': site.theme.accent,
    '--accent-dark': site.theme.accentDark,
    '--ink': site.theme.ink,
  } as CSSProperties
  return (
    <html lang="en" style={vars}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <EventDebugPanel />
        <Scripts />
      </body>
    </html>
  )
}
