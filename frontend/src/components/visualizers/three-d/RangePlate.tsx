import React from 'react'
import { motion } from 'motion/react'

interface RangePlateProps {
  startIndex: number
  endIndex: number
  itemWidth?: number
  gap?: number
  label?: string
  reduceMotion?: boolean
}

export const RangePlate: React.FC<RangePlateProps> = ({
  startIndex,
  endIndex,
  itemWidth = 44,
  gap = 14,
  label = 'Window',
  reduceMotion = false,
}) => {
  const s = Math.min(startIndex, endIndex)
  const e = Math.max(startIndex, endIndex)

  const left = s * (itemWidth + gap)
  const width = (e - s + 1) * itemWidth + (e - s) * gap

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="absolute top-0 pointer-events-none rounded-xl border border-cyan/35 bg-cyan/10 backdrop-blur-xs shadow-lg"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${itemWidth}px`,
        transform: 'translateZ(15px)',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border border-cyan/40 bg-[#08090A]/90 text-2xs font-mono font-bold text-cyan whitespace-nowrap">
        {label} [{s}..{e}]
      </div>
    </motion.div>
  )
}
