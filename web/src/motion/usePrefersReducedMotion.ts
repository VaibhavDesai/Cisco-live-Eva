import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

function getSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
