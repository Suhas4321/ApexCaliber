import type { FC } from 'react'

interface ApexCaliberLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  variant?: 'lockup' | 'icon-only'
}

/** A simple trail reaching a peak remains legible in the compact navigation lockup. */
const ApexCaliberLogo: FC<ApexCaliberLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'lockup',
}) => {
  const dimensions = {
    sm: { mark: 'h-8 w-8', text: 'text-[15px]', gap: 'gap-2.5' },
    md: { mark: 'h-10 w-10', text: 'text-lg', gap: 'gap-3' },
    lg: { mark: 'h-14 w-14', text: 'text-2xl', gap: 'gap-3.5' },
  }[size]

  return (
    <span className={`inline-flex items-center ${dimensions.gap} ${className}`}>
      <span className={`grid ${dimensions.mark} shrink-0 place-items-center rounded-lg border border-[#00F59B] bg-[#00F59B]`}>
        <svg viewBox="0 0 40 40" fill="none" className="h-[78%] w-[78%]" aria-hidden="true">
          <path d="M4 30 12 23l4 3L25 8l11 22" stroke="#08090A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 33c4-7 8-3 12-9 2-3 3-6 2-10" stroke="#065F46" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 3.2" />
          <circle cx="25" cy="8" r="2.3" fill="#08090A" />
        </svg>
      </span>
      {showText && variant !== 'icon-only' && (
        <span
          className={`apex-logo-wordmark whitespace-nowrap font-plate ${dimensions.text} leading-none tracking-[-0.025em]`}
        >
          <span className="font-bold text-chalk">Apex</span>
          <span className="font-normal text-muted">Caliber</span>
        </span>
      )}
    </span>
  )
}

export default ApexCaliberLogo
