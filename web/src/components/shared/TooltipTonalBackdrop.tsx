import { useId } from 'react';

/**
 * Figma Popover - Tonal shell (.Popover Base). Inlined so --fill-0 / --stroke-0
 * on an ancestor (.tooltip-bubble, .popover-surface--tonal, .slider-tooltip) resolve.
 */
export function TooltipTonalBackdrop() {
  const rid = useId().replace(/:/g, '');
  const maskId = `ttm-${rid}`;

  return (
    <span className="tooltip-tonal-backdrop" aria-hidden>
      <svg
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        overflow="visible"
        viewBox="0 0 295 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Background">
          <mask id={maskId} fill="white">
            <path d="M0 8C0 3.58172 3.58172 0 8 0H287C291.418 0 295 3.58172 295 8V36C295 40.4183 291.418 44 287 44H7.99999C3.58172 44 0 40.4183 0 36V8Z" />
          </mask>
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H287C291.418 0 295 3.58172 295 8V36C295 40.4183 291.418 44 287 44H7.99999C3.58172 44 0 40.4183 0 36V8Z"
            fill="var(--fill-0, black)"
          />
          <path
            d="M8 0V1H287V0V-1H8V0ZM295 8H294V36H295H296V8H295ZM287 44V43H7.99999V44V45H287V44ZM0 36H1V8H0H-1V36H0ZM7.99999 44V43C4.134 43 1 39.866 1 36H0H-1C-1 40.9706 3.02943 45 7.99999 45V44ZM295 36H294C294 39.866 290.866 43 287 43V44V45C291.971 45 296 40.9706 296 36H295ZM287 0V1C290.866 1 294 4.13401 294 8H295H296C296 3.02944 291.971 -1 287 -1V0ZM8 0V-1C3.02944 -1 -1 3.02944 -1 8H0H1C1 4.13401 4.13401 1 8 1V0Z"
            fill="var(--stroke-0, white)"
            fillOpacity={0.2}
            mask={`url(#${maskId})`}
          />
        </g>
      </svg>
    </span>
  );
}
