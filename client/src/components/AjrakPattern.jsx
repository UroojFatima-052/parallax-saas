import { useEffect, useState } from 'react'

const SIZE = 64
const CORNERS = [
  [4, 4],
  [60, 4],
  [4, 60],
  [60, 60],
]

function AjrakPattern({ cols = 6, rows = 10, highlight = null, className = '' }) {
  const tileCount = cols * rows
  const [litTile, setLitTile] = useState(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      setLitTile(Math.floor(Math.random() * tileCount))
    }, 1300)

    return () => clearInterval(interval)
  }, [tileCount])

  return (
    <svg
      viewBox={`0 0 ${cols * SIZE} ${rows * SIZE}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: tileCount }, (_, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const isLit = index === litTile || index === highlight

        return (
          <g key={index} transform={`translate(${col * SIZE}, ${row * SIZE})`}>
            <rect
              x="4"
              y="4"
              width="56"
              height="56"
              fill="none"
              strokeWidth="3"
              className={`transition-colors duration-700 ${isLit ? 'stroke-peach' : 'stroke-rose'}`}
            />
            <polygon points="32,10 54,32 32,54 10,32" className="fill-rose" />
            <polygon
              points="32,20 44,32 32,44 20,32"
              className={`transition-colors duration-700 ${isLit ? 'fill-peach' : 'fill-teal'}`}
            />
            <circle cx="32" cy="32" r="4" className="fill-paper" />
            {CORNERS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" className="fill-paper" />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export default AjrakPattern