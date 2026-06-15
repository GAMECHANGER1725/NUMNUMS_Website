'use client'

import { useState } from 'react'

const LOGO = `${process.env.NEXT_PUBLIC_BASEPATH ?? ''}/logo-t.png`

type Status = 'idle' | 'submitting' | 'success' | 'redirecting'

const DESCRIPTORS = [
  'Not likely at all',
  'Probably not',
  'Maybe so',
  'Very likely',
  'Absolutely!',
]

const GOOGLE_URL = 'https://g.page/r/CTvgBZl3A2CGEBM/review'
const WEBHOOK_URL = 'https://hook.eu1.make.com/ltgg54tqfiycktex9gv359ykxjpwj2sq'

function GrainSVG({ opacity = 0.2, filterId }: { opacity?: number; filterId: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ opacity, zIndex: 0 }}
      aria-hidden="true"
    >
      <filter id={filterId}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.78"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  )
}

function StarIcon({ filled, size = 22 }: { filled: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? '#FFD700' : 'none'}
        stroke={filled ? '#E6AC00' : '#CFC1BC'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarRating({
  rating,
  onRate,
}: {
  rating: number | null
  onRate: (n: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const effective = hovered ?? rating ?? 0

  return (
    <div className="flex flex-col items-center" style={{ gap: 10 }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const isFilled = n <= effective
          return (
            <button
              key={n}
              onClick={() => onRate(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating !== null && n <= rating}
              className="flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                width: 'clamp(50px, 11vw, 62px)',
                height: 'clamp(50px, 11vw, 62px)',
                background: isFilled ? '#C85478' : 'transparent',
                border: `2px solid ${isFilled ? '#C85478' : '#DDD0CA'}`,
                transform: isFilled ? 'scale(1.07)' : 'scale(1)',
                boxShadow: isFilled
                  ? '0 4px 18px rgba(200,84,120,0.30), 0 1px 4px rgba(200,84,120,0.18)'
                  : 'none',
                transition:
                  'background 0.18s ease, border-color 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
              }}
            >
              <StarIcon filled={isFilled} size={23} />
            </button>
          )
        })}
      </div>

      <p
        className="font-sans font-light"
        aria-live="polite"
        style={{
          fontSize: 15,
          letterSpacing: '0.04em',
          minHeight: 20,
          color:
            effective === 0
              ? 'transparent'
              : effective >= 4
              ? '#C85478'
              : '#5C3A22',
          transition: 'color 0.25s ease',
          userSelect: 'none',
        }}
      >
        {effective > 0 ? DESCRIPTORS[effective - 1] : '—'}
      </p>
    </div>
  )
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-screen w-screen overflow-hidden flex items-center justify-center relative"
      style={{ background: '#FFF8F2' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 80% 10%, rgba(200,84,120,0.07) 0%, transparent 70%)',
        }}
      />
      <GrainSVG filterId="grain-overlay" opacity={0.22} />
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        {children}
      </div>
    </div>
  )
}

function ThankYou() {
  return (
    <FullScreen>
      <div
        className="mb-8 mx-auto flex items-center justify-center rounded-full"
        style={{
          width: 72,
          height: 72,
          background: 'linear-gradient(135deg, #C85478 0%, #a83d5e 100%)',
          boxShadow: '0 8px 32px rgba(200,84,120,0.32)',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path
            d="M6.5 15.5l6 6L23.5 9"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        className="font-sans uppercase tracking-[0.2em] mb-3"
        style={{ fontSize: 10, color: '#C85478' }}
      >
        Thank you
      </p>
      <h2
        className="font-serif font-light italic leading-tight mb-4"
        style={{ fontSize: 'clamp(28px, 7vw, 40px)', color: '#2C1A0E' }}
      >
        We hear you.
      </h2>
      <p
        className="font-sans font-light"
        style={{ fontSize: 15, color: '#5C3A22', lineHeight: 1.75 }}
      >
        Your honesty helps us bake it better every single time.
      </p>
      <div
        className="mt-8 mx-auto"
        style={{ width: 40, height: 1, background: '#F5EBE0' }}
        aria-hidden="true"
      />
      <p
        className="mt-5 font-sans font-light"
        style={{ fontSize: 11, color: '#8B6A5A', letterSpacing: '0.06em' }}
      >
        Num Num's Bakery · Sydney, NSW
      </p>
    </FullScreen>
  )
}

function Redirecting({ hasFeedback }: { hasFeedback: boolean }) {
  return (
    <FullScreen>
      <div
        className="mb-6 mx-auto rounded-full"
        style={{
          width: 48,
          height: 48,
          border: '2px solid #F5EBE0',
          borderTopColor: '#C85478',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        className="font-sans uppercase tracking-[0.2em] mb-3"
        style={{ fontSize: 10, color: '#C85478' }}
      >
        One moment
      </p>
      <h2
        className="font-serif font-light italic"
        style={{ fontSize: 'clamp(24px, 6vw, 34px)', color: '#2C1A0E' }}
      >
        Taking you to Google…
      </h2>
      {hasFeedback ? (
        <p
          className="mt-3 font-sans font-light"
          style={{ fontSize: 14, color: '#C85478' }}
        >
          ✓ Your feedback has been copied — just paste it into Google Reviews.
        </p>
      ) : (
        <p
          className="mt-3 font-sans font-light"
          style={{ fontSize: 14, color: '#8B6A5A' }}
        >
          Your review makes a huge difference.
        </p>
      )}
    </FullScreen>
  )
}

export default function ReviewForm() {
  const [rating, setRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async () => {
    if (!rating || status === 'submitting') return
    setStatus('submitting')

    if (rating >= 4) {
      setStatus('redirecting')
      const text = feedback.trim()
      if (text) {
        navigator.clipboard.writeText(text).catch(() => { /* silent fallback */ })
      }
      setTimeout(() => {
        window.location.href = GOOGLE_URL
      }, 1800)
      return
    }

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || '(no comment)',
        }),
      })
    } catch {
      // Fail silently — still show thank-you
    }

    setStatus('success')
  }

  if (status === 'success') return <ThankYou />
  if (status === 'redirecting') return <Redirecting hasFeedback={!!feedback.trim()} />

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">

      {/* ────────────────────────────────────
          LEFT PANEL — desktop branding
      ──────────────────────────────────── */}
      <div
        className="hidden md:flex md:w-[44%] flex-col items-center justify-center p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: '#F5EBE0' }}
      >
        <GrainSVG filterId="grain-left" opacity={0.18} />

        {/* Pink radial blob top-right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 rounded-full"
          style={{
            width: 340,
            height: 340,
            background:
              'radial-gradient(circle, rgba(200,84,120,0.09) 0%, transparent 70%)',
          }}
        />
        {/* Warm blob bottom-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 rounded-full"
          style={{
            width: 260,
            height: 260,
            background:
              'radial-gradient(circle, rgba(92,58,34,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO}
            alt="Num Num's Bakery"
            style={{ objectFit: 'contain', width: 230, height: 'auto', marginBottom: 20 }}
          />

          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 2,
              background:
                'linear-gradient(90deg, transparent, #C85478, transparent)',
              borderRadius: 999,
              marginBottom: 20,
            }}
          />

          <p
            className="font-sans uppercase tracking-[0.22em] mb-4"
            style={{ fontSize: 10, color: '#C85478' }}
          >
            Share your experience
          </p>

          <h1
            className="font-serif font-light italic leading-tight"
            style={{
              fontSize: 'clamp(26px, 2.8vw, 38px)',
              color: '#2C1A0E',
              letterSpacing: '-0.01em',
              maxWidth: 300,
              lineHeight: 1.22,
            }}
          >
            How likely are you to refer us to friends &amp; family?
          </h1>

          <p
            className="font-sans font-light mt-5"
            style={{
              fontSize: 14,
              color: '#8B6A5A',
              lineHeight: 1.65,
              maxWidth: 280,
            }}
          >
            Your honest feedback helps us bake a little better every day.
          </p>
        </div>

        {/* Left panel footer */}
        <p
          className="absolute bottom-6 font-sans font-light"
          style={{ fontSize: 11, color: '#8B6A5A', letterSpacing: '0.07em' }}
        >
          Num Num's Bakery · Sydney, NSW
        </p>
      </div>

      {/* Vertical divider — desktop only */}
      <div
        className="hidden md:block w-px flex-shrink-0"
        style={{ background: '#E0D0C8' }}
        aria-hidden="true"
      />

      {/* ────────────────────────────────────
          RIGHT PANEL — form  /  MOBILE FULL
      ──────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:px-10 relative overflow-hidden"
        style={{ background: '#FFF8F2' }}
      >
        <GrainSVG filterId="grain-right" opacity={0.22} />

        {/* Gradient accent top-right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0"
          style={{
            width: 280,
            height: 280,
            background:
              'radial-gradient(circle at top right, rgba(200,84,120,0.055) 0%, transparent 70%)',
          }}
        />

        <div
          className="relative z-10 w-full flex flex-col items-center"
          style={{ maxWidth: 380, gap: 0 }}
        >
          {/* ── Mobile: logo + heading ── */}
          <div
            className="md:hidden flex flex-col items-center text-center"
            style={{ marginBottom: 16 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt="Num Num's Bakery"
              style={{ objectFit: 'contain', width: 210, height: 'auto', marginBottom: 10 }}
            />
            <div
              aria-hidden="true"
              style={{
                width: 32,
                height: 2,
                background:
                  'linear-gradient(90deg, transparent, #C85478, transparent)',
                borderRadius: 999,
                marginBottom: 10,
              }}
            />
            <p
              className="font-sans uppercase tracking-[0.2em]"
              style={{ fontSize: 11, color: '#C85478', marginBottom: 8 }}
            >
              Share your experience
            </p>
            <h1
              className="font-serif font-light italic leading-tight"
              style={{
                fontSize: 'clamp(24px, 6.5vw, 32px)',
                color: '#2C1A0E',
                lineHeight: 1.25,
              }}
            >
              How likely are you to refer us to friends &amp; family?
            </h1>
          </div>

          {/* ── Desktop: form heading ── */}
          <div
            className="hidden md:block text-center"
            style={{ marginBottom: 28 }}
          >
            <p
              className="font-sans uppercase tracking-[0.2em]"
              style={{ fontSize: 10, color: '#C85478', marginBottom: 6 }}
            >
              Rate your experience
            </p>
            <p
              className="font-sans font-light"
              style={{ fontSize: 15, color: '#5C3A22' }}
            >
              Scale of 1 to 5 — be honest, we can take it.
            </p>
          </div>

          {/* ── Stars ── */}
          <div style={{ marginBottom: 14 }}>
            <StarRating rating={rating} onRate={setRating} />
          </div>

          {/* ── Divider ── */}
          <div
            className="w-full"
            style={{ height: 1, background: '#F0E4D8', marginBottom: 14 }}
            aria-hidden="true"
          />

          {/* ── Textarea ── */}
          <div className="w-full flex flex-col" style={{ gap: 6, marginBottom: 12 }}>
            <label
              htmlFor="feedback"
              className="font-sans font-light uppercase tracking-[0.14em]"
              style={{ fontSize: 11, color: '#8B6A5A' }}
            >
              Tell us more{' '}
              <span
                style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}
              >
                (optional)
              </span>
            </label>

            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you love? What could we improve?"
              rows={4}
              className="w-full font-sans font-light rounded-xl focus:outline-none"
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: '#2C1A0E',
                background: '#fff',
                border: '1.5px solid #EDE0D4',
                padding: '12px 16px',
                boxShadow: '0 2px 10px rgba(44,26,14,0.04)',
                opacity: rating ? 1 : 0.4,
                transition: 'opacity 0.35s ease, border-color 0.18s ease, box-shadow 0.18s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C85478'
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(200,84,120,0.10), 0 2px 10px rgba(44,26,14,0.04)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE0D4'
                e.currentTarget.style.boxShadow =
                  '0 2px 10px rgba(44,26,14,0.04)'
              }}
            />
          </div>

          {/* ── Submit ── */}
          <button
            onClick={handleSubmit}
            disabled={!rating || status === 'submitting'}
            className="w-full font-sans font-light uppercase tracking-[0.18em] rounded-xl"
            style={{
              fontSize: 14,
              padding: '16px 20px',
              background: rating
                ? 'linear-gradient(135deg, #C85478 0%, #a83d5e 100%)'
                : '#EDE0D4',
              color: rating ? '#fff' : '#8B6A5A',
              cursor: rating ? 'pointer' : 'default',
              boxShadow: rating
                ? '0 4px 20px rgba(200,84,120,0.28), 0 1px 4px rgba(200,84,120,0.14)'
                : 'none',
              transition:
                'background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease',
              marginBottom: 16,
            }}
            onMouseEnter={(e) => {
              if (!rating) return
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow =
                '0 8px 28px rgba(200,84,120,0.34), 0 2px 6px rgba(200,84,120,0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = rating
                ? '0 4px 20px rgba(200,84,120,0.28), 0 1px 4px rgba(200,84,120,0.14)'
                : 'none'
            }}
            onMouseDown={(e) => {
              if (!rating) return
              e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'
            }}
            onMouseUp={(e) => {
              if (!rating) return
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Sending…
              </span>
            ) : rating && rating >= 4 ? (
              'Leave a Google Review →'
            ) : rating ? (
              'Share my thoughts →'
            ) : (
              'Select a rating above'
            )}
          </button>

          {/* Mobile footer */}
          <p
            className="md:hidden font-sans font-light text-center"
            style={{ fontSize: 13, color: '#8B6A5A', letterSpacing: '0.06em' }}
          >
            Num Num's Bakery · Sydney, NSW
          </p>
        </div>
      </div>
    </div>
  )
}
