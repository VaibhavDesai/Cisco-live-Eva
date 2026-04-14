import { useId } from 'react'

/**
 * Branded AI assistant mark with optional motion states for chat and assistant shells.
 * @param {Object} props - Component props; known fields are listed below and any additional keys are spread onto the root `div`.
 * @param {'static'|'processing'|'responding'} [props.state='static'] - Which SVG treatment to render (idle, busy, or responding).
 * @param {number|'small'|'medium'|'large'} [props.size=32] - Square size in px, or a named preset mapped to pixel values.
 * @param {'default'|'grayscale'} [props.variant='default'] - Color treatment; `grayscale` applies a muted stylesheet modifier.
 * @param {string} [props.className] - Optional extra classes merged into the root `div` class list.
 * @example
 * <AiSymbol state="processing" size="medium" />
 * <AiSymbol variant="grayscale" size={40} />
 */
function AiSymbol({ state = 'static', size = 32, variant = 'default', className, ...rest }) {
  const uid = useId().replace(/:/g, '')
  const px = typeof size === 'number' ? size : { small: 20, medium: 32, large: 48 }[size] || 32

  const cls = [
    'ai-symbol',
    state !== 'static' && `ai-symbol--${state}`,
    variant === 'grayscale' && 'ai-symbol--grayscale',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} style={{ width: px, height: px }} role="img" aria-label={`AI Assistant — ${state}`} {...rest}>
      {state === 'static' && (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={px} height={px}>
          <path d="M23.5 18C27.6421 18 31 14.6421 31 10.5C31 6.35786 27.6421 3 23.5 3C19.3579 3 16 6.35787 16 10.5C16 14.6421 19.3579 18 23.5 18Z" fill={`url(#${uid}_bl)`} />
          <path fillRule="evenodd" clipRule="evenodd" d="M16 8.42268C11.8118 8.42268 8.41667 11.8169 8.41667 16.0038C8.41667 20.1908 11.8118 23.585 16 23.585C20.1882 23.585 23.5833 20.1908 23.5833 16.0038C23.5833 11.8169 20.1882 8.42268 16 8.42268ZM3 16.0038C3 8.82619 8.8203 3.00757 16 3.00757C23.1797 3.00757 29 8.82619 29 16.0038C29 23.1815 23.1797 29.0001 16 29.0001C8.8203 29.0001 3 23.1815 3 16.0038Z" fill={`url(#${uid}_ring)`} />
          <path fillRule="evenodd" clipRule="evenodd" d="M28.9932 15.605C27.6241 17.0737 25.6723 17.9921 23.5061 17.9921C23.4435 17.9921 23.3811 17.9913 23.3188 17.9898C23.4916 17.3544 23.5838 16.6859 23.5838 15.9959C23.5838 11.9072 20.3469 8.57444 16.2959 8.4203C16.8915 6.34348 18.3602 4.63575 20.2794 3.71973C25.2391 5.44741 28.8305 10.0959 28.9932 15.605Z" fill={`url(#${uid}_il)`} />
          <path d="M23.4961 18C27.6382 18 30.9961 14.6421 30.9961 10.5C30.9961 6.35786 27.6382 3 23.4961 3C19.354 3 15.9961 6.35787 15.9961 10.5C15.9961 14.6421 19.354 18 23.4961 18Z" fill={`url(#${uid}_tl)`} />
          <defs>
            <linearGradient id={`${uid}_bl`} x1="16.2974" y1="3" x2="28.579" y2="15.2815" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0087EA" />
              <stop offset="1" stopColor="#63FFF7" />
            </linearGradient>
            <linearGradient id={`${uid}_ring`} x1="29" y1="3.00757" x2="3.00748" y2="29.0076" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0051AF" />
              <stop offset="0.666238" stopColor="#0087EA" />
              <stop offset="1" stopColor="#00BCEB" />
            </linearGradient>
            <linearGradient id={`${uid}_il`} x1="20.9454" y1="7.98988" x2="27.8983" y2="16.0316" gradientUnits="userSpaceOnUse">
              <stop stopColor="#74BF4B" stopOpacity="0" />
              <stop offset="1" stopColor="#74BF4B" />
            </linearGradient>
            <radialGradient id={`${uid}_tl`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30.9961 18) rotate(-135) scale(21.2132 21.2042)">
              <stop stopColor="#00BCEB" stopOpacity="0" />
              <stop offset="0.666962" stopColor="#00BCEB" stopOpacity="0" />
              <stop offset="1" stopColor="#00BCEB" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {state === 'processing' && (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={px} height={px}>
          <path fillRule="evenodd" clipRule="evenodd" d="M16 8.41511C11.8118 8.41511 8.41667 11.8093 8.41667 15.9963C8.41667 20.1832 11.8118 23.5774 16 23.5774C20.1882 23.5774 23.5833 20.1832 23.5833 15.9963C23.5833 11.8093 20.1882 8.41511 16 8.41511ZM3 15.9963C3 8.81862 8.8203 3 16 3C23.1797 3 29 8.81862 29 15.9963C29 23.1739 23.1797 28.9925 16 28.9925C8.8203 28.9925 3 23.1739 3 15.9963Z" fill={`url(#${uid}_p_ring)`} />
          <path className="ai-symbol__proc-orb" d="M16 5.74194C10.3348 5.74194 5.74231 10.3344 5.74231 15.9996C5.74231 21.6647 10.3348 26.2572 16 26.2572C19.728 26.2572 22.9916 24.2684 24.7875 21.2939" stroke={`url(#${uid}_p_arc)`} strokeWidth="8.19239" strokeLinecap="round" />
          <defs>
            <linearGradient id={`${uid}_p_ring`} x1="29" y1="3" x2="3.00748" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0051AF" />
              <stop offset="0.666238" stopColor="#0087EA" />
              <stop offset="1" stopColor="#00BCEB" />
            </linearGradient>
            <radialGradient id={`${uid}_p_arc`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15.2649 15.9996) rotate(90) scale(10.2576 9.5226)">
              <stop stopColor="#60FBF7" />
              <stop offset="1" stopColor="#12AFED" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {state === 'responding' && (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={px} height={px}>
          <circle className="ai-symbol__resp-right" cx="21.5" cy="15.5" r="7.5" transform="rotate(-180 21.5 15.5)" fill={`url(#${uid}_r_right)`} />
          <circle className="ai-symbol__resp-left" cx="7" cy="16" r="4" fill={`url(#${uid}_r_left)`} />
          <defs>
            <linearGradient id={`${uid}_r_right`} x1="29" y1="8" x2="14" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0051AF" />
              <stop offset="0.666238" stopColor="#0087EA" />
              <stop offset="1" stopColor="#00BCEB" />
            </linearGradient>
            <linearGradient id={`${uid}_r_left`} x1="3.15864" y1="12" x2="9.70878" y2="18.5501" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0087EA" />
              <stop offset="1" stopColor="#63FFF7" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  )
}

export default AiSymbol
