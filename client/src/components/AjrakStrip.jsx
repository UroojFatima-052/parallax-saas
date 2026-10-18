import { useId } from 'react'

function AjrakStrip({ direction = 'horizontal', className = '' }) {
  const patternId = `ajrak-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const vertical = direction === 'vertical'
  const tileWidth = vertical ? 10 : 14
  const tileHeight = vertical ? 14 : 10

  return (
    <svg
      className={className}
      width={vertical ? 10 : '100%'}
      height={vertical ? '100%' : 10}
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} width={tileWidth} height={tileHeight} patternUnits="userSpaceOnUse">
          <rect width={tileWidth} height={tileHeight} className="fill-deep" />
          <polygon points={vertical ? '5,2 9,7 5,12 1,7' : '7,1 12,5 7,9 2,5'} className="fill-rose" />
          <circle cx={vertical ? 5 : 7} cy={vertical ? 7 : 5} r="1.2" className="fill-paper" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

export default AjrakStrip