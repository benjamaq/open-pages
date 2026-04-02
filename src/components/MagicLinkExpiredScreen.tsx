'use client'

import Link from 'next/link'

const COPY = 'This link has expired. Please log in to access your dashboard.'

type Props = {
  /** Full-page layout (dashboard gate); false = overlay card on existing page */
  variant?: 'page' | 'overlay'
}

export default function MagicLinkExpiredScreen({ variant = 'page' }: Props) {
  const inner = (
    <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Link expired</h1>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{COPY}</p>
      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Log in
      </Link>
    </div>
  )

  if (variant === 'overlay') {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="magic-link-expired-title"
      >
        <div id="magic-link-expired-title" className="sr-only">
          Link expired
        </div>
        {inner}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen grid place-items-center p-6"
      style={{
        backgroundImage: "url('/white.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {inner}
    </div>
  )
}
