import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AjrakPattern from './AjrakPattern.jsx'

const TILE_SIZE = 64
const CARD_RADIUS = 24

let introPlayedThisLoad = false

function shouldPlayIntro() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return !prefersReducedMotion && !introPlayedThisLoad
}

function AuthLayout({ caption, subcaption, highlight = null, children }) {
  const [phase, setPhase] = useState(() => (shouldPlayIntro() ? 'tile' : 'done'))
  const [tileBox, setTileBox] = useState(null)
  const asideRef = useRef(null)
  const playsIntro = useRef(phase !== 'done')

  useEffect(() => {
    if (!playsIntro.current) return
    introPlayedThisLoad = true

    setTileBox({
      left: window.innerWidth / 2 - TILE_SIZE / 2,
      top: window.innerHeight / 2 - TILE_SIZE / 2 - 24,
      width: TILE_SIZE,
      height: TILE_SIZE,
      borderRadius: 12,
    })

    const timers = [
      setTimeout(() => {
        const target = asideRef.current.getBoundingClientRect()
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches
        setTileBox({
          left: target.left,
          top: target.top,
          width: target.width,
          height: target.height,
          borderRadius: isDesktop
            ? `${CARD_RADIUS}px 0 0 ${CARD_RADIUS}px`
            : `${CARD_RADIUS}px ${CARD_RADIUS}px 0 0`,
        })
        setPhase('grow')
      }, 1700),
      setTimeout(() => setPhase('reveal'), 2700),
      setTimeout(() => setPhase('done'), 3300),
    ]

    return () => timers.forEach(clearTimeout)
  }, [])

  const cardHidden = phase === 'tile' || phase === 'grow'

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div
        className={`grid w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-white shadow-xl shadow-teal/10 transition-opacity duration-300 lg:h-[640px] lg:grid-cols-[0.9fr_1.1fr] ${
          cardHidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <aside ref={asideRef} className="relative h-28 overflow-hidden bg-teal lg:h-auto">
          <AjrakPattern highlight={highlight} className="absolute inset-0 h-full w-full" />

          <div className="absolute inset-x-0 top-0 border-b-[3px] border-rose bg-teal px-6 py-3.5">
            <Link to="/login" className="font-display text-xl font-semibold text-paper">
              Tessera
            </Link>
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden border-t-[3px] border-rose bg-teal px-6 py-5 lg:block">
            <p className="font-display text-lg font-medium leading-snug text-paper">{caption}</p>
            <p className="mt-1 text-sm text-peach">{subcaption}</p>
          </div>
        </aside>

        <main
          className={`flex flex-col overflow-y-auto border-t-4 border-rose bg-white px-6 py-8 transition duration-500 sm:px-10 ${
            cardHidden ? 'translate-x-8 opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="mx-auto my-auto w-full max-w-sm">{children}</div>
        </main>
      </div>

      {phase !== 'done' && tileBox && (
        <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
          <div
            className={`fixed overflow-hidden bg-teal transition-all duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
              phase === 'tile' ? 'animate-tile-pop' : ''
            } ${phase === 'reveal' ? 'opacity-0' : 'opacity-100'}`}
            style={tileBox}
          >
            <AjrakPattern className="h-full w-full" />
          </div>

          <p
            className={`fixed inset-x-0 text-center font-display text-3xl font-semibold text-deep transition-opacity duration-300 ${
              phase === 'tile' ? 'animate-fade-up' : 'opacity-0'
            }`}
            style={{ top: window.innerHeight / 2 + TILE_SIZE / 2 - 8 }}
          >
            Tessera
          </p>
        </div>
      )}
    </div>
  )
}

export default AuthLayout