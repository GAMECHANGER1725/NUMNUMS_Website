'use client'

import { useRef, useState } from 'react'

const LOGO = `${process.env.NEXT_PUBLIC_BASEPATH ?? ''}/logo-icon.webp`

type Status = 'idle' | 'submitting' | 'success' | 'redirecting'

/** The customer's words, not ours — plain, in the brand voice. */
const ANSWERS = [
  'Not great.',
  'Could have been better.',
  'It was fine.',
  'Really good.',
  'Loved it.',
]

const GOOGLE_URL = 'https://g.page/r/CTvgBZl3A2CGEBM/review'
const WEBHOOK_URL = 'https://hook.eu1.make.com/ltgg54tqfiycktex9gv359ykxjpwj2sq'
const SIGNOFF = "Num Num's Bakery · Sydney, NSW"

function Grain() {
  return (
    <svg className="grain" aria-hidden="true">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  )
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
      <path
        d="M12 3.2l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.22l-5.1 2.68.97-5.68L3.75 9.2l5.7-.83z"
        fill={filled ? '#fff' : 'none'}
        stroke={filled ? '#fff' : '#BFA79C'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="stage">
      <Grain />
      <div className="card rise">{children}</div>
    </main>
  )
}

function ThankYou() {
  return (
    <Shell>
      <div className="seal" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
          <path d="M6.5 15.5l6 6L23.5 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="eyebrow">Sent</p>
      <h1 className="question">We hear you.</h1>
      <p className="subline">
        Thank you for telling us — it&apos;s how the next cake gets better.
      </p>
      <p className="footer">{SIGNOFF}</p>
    </Shell>
  )
}

function Redirecting({ copied }: { copied: boolean }) {
  return (
    <Shell>
      <div className="spinner spinner-lg" aria-hidden="true" />
      <p className="eyebrow">One moment</p>
      <h1 className="question">Taking you to Google</h1>
      <p className="subline" role="status">
        {copied
          ? 'Your note is on the clipboard — paste it straight into the review box.'
          : 'Thank you for backing a small local bakery.'}
      </p>
      <p className="footer">{SIGNOFF}</p>
    </Shell>
  )
}

export default function ReviewForm() {
  const [rating, setRating] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [sweeping, setSweeping] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [copied, setCopied] = useState(false)
  const sweepTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shown = hovered ?? rating ?? 0

  const pick = (n: number) => {
    setRating(n)
    // Stagger the fill only on a committed choice, so it reads as one sweep
    // across the strip. Hover stays instant.
    setSweeping(true)
    if (sweepTimer.current) clearTimeout(sweepTimer.current)
    sweepTimer.current = setTimeout(() => setSweeping(false), 600)
  }

  const handleSubmit = async () => {
    if (!rating || status === 'submitting' || status === 'redirecting') return
    const text = feedback.trim()

    if (rating >= 4) {
      // Older in-app webviews (Instagram, Facebook on Android) have no
      // navigator.clipboard at all. Unguarded, the throw skips the redirect
      // below and strands the customer on the spinner forever.
      try {
        if (text && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {})
          setCopied(true)
        }
      } catch { /* clipboard unavailable — redirect anyway */ }
      setStatus('redirecting')
      setTimeout(() => { window.location.href = GOOGLE_URL }, 1800)
      return
    }

    setStatus('submitting')
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          rating: String(rating),
          feedback: text || '(no comment)',
        }).toString(),
      })
    } catch { /* still thank them — a failed post is not worth an error screen */ }
    setStatus('success')
  }

  if (status === 'success') return <ThankYou />
  if (status === 'redirecting') return <Redirecting copied={copied} />

  return (
    <Shell>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src={LOGO} alt="" width={72} height={72} />
      <p className="eyebrow">Num Num&apos;s Bakery</p>

      <h1 className="question">How did we do?</h1>
      <p className="subline">One tap. That&apos;s the whole thing.</p>

      <div
        className={`strip${sweeping ? ' sweeping' : ''}`}
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} out of 5 — ${ANSWERS[n - 1]}`}
            className={`chip${n <= shown ? ' on' : ''}`}
            style={{ '--i': n - 1 } as React.CSSProperties}
            onClick={() => pick(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(n)}
            onBlur={() => setHovered(null)}
          >
            <Star filled={n <= shown} />
          </button>
        ))}
      </div>

      <p className={`answer${shown ? ' shown' : ''}`} aria-live="polite">
        {shown ? ANSWERS[shown - 1] : ''}
      </p>

      <div className={`reveal${rating ? ' open' : ''}`} aria-hidden={!rating}>
        <div>
          <div className="rule" />
          <label className="field-label" htmlFor="feedback">
            Tell us more <span>(optional)</span>
          </label>
          <textarea
            id="feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Anything you'd like us to know? A line or two is plenty."
            tabIndex={rating ? 0 : -1}
          />
        </div>
      </div>

      <button
        type="button"
        className="submit"
        onClick={handleSubmit}
        disabled={!rating || status === 'submitting'}
      >
        {status === 'submitting' ? (
          <span className="submit-busy">
            <span className="spinner" />
            Sending
          </span>
        ) : !rating ? (
          'Pick a rating to continue'
        ) : (
          'Send my review'
        )}
      </button>

      <p className="footer">{SIGNOFF}</p>
    </Shell>
  )
}
