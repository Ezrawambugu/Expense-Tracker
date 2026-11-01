import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Phase 8A: Inter is self-hosted (the woff2 is copied into app/fonts) and
// loaded with next/font/local, so no external font request is made at runtime.
// The full stack in globals.css prefers the platform SF face on Apple devices
// and falls back to this Inter file, then system-ui.
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description:
    'Management Information System for small-organization expense management',
}

// Applies the stored theme before hydration so the first paint is never the
// wrong color. Wrapped in try/catch for private-mode storage failures.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
