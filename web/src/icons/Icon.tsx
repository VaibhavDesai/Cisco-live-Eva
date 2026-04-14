import React, { CSSProperties, useEffect, useState } from 'react';
import type { IconName, IconWeight } from './types';
import { resolveMomentumIconLoader } from './momentumRawIconLoaders';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/** In-memory cache so repeat icons don’t refetch chunks */
const svgCache = new Map<string, string>();

async function loadSvgRaw(id: string): Promise<string> {
  if (svgCache.has(id)) return svgCache.get(id)!;
  const loader = resolveMomentumIconLoader(id);
  if (!loader) {
    svgCache.set(id, '');
    return '';
  }
  try {
    let raw = await loader();
    if (raw && !raw.includes('fill=')) {
      raw = raw.replace('<svg ', '<svg fill="currentColor" ');
    }
    svgCache.set(id, raw);
    return raw;
  } catch {
    svgCache.set(id, '');
    return '';
  }
}

export interface IconProps {
  /** Base icon name (e.g. 'search', 'camera', 'chat') */
  name: IconName;
  /** Icon weight variant */
  weight?: IconWeight;
  /** Preset or custom pixel size */
  size?: IconSize;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Accessible label — sets role="img" when provided */
  ariaLabel?: string;
  /** Icon color (currentColor); paths in Momentum SVGs typically inherit */
  color?: string;
}

/**
 * Renders Momentum icons as inlined SVG (Vite `?raw` imports).
 * Avoids Lit `mdc-icon` / `IconProvider`, which can fail to paint with React 19.
 */
export function Icon({
  name,
  weight = 'bold',
  size = 'md',
  className,
  style,
  ariaLabel,
  color,
}: IconProps) {
  const resolvedSize = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 20);
  const id = `${name}-${weight}`;
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSvgRaw(id).then((raw) => {
      if (!cancelled) setSvg(raw);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const mergedStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: resolvedSize,
    height: resolvedSize,
    color: color ?? 'currentColor',
    lineHeight: 0,
    ...style,
  };

  if (svg === null) {
    return (
      <span
        className={className}
        style={mergedStyle}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
      />
    );
  }

  if (!svg) {
    return (
      <span
        className={className}
        style={mergedStyle}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
      />
    );
  }

  return (
    <span
      className={className}
      style={mergedStyle}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <span
        className="mds-icon-inline-svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </span>
  );
}
