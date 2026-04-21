import type { Anchor } from './types';

const MAX_DEPTH = 6;
const REVIEW_ATTR = 'data-review-ui';

export const isReviewUiNode = (node: Node | null): boolean => {
  if (!node) return false;
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);
  while (el) {
    if (el.hasAttribute?.(REVIEW_ATTR)) return true;
    el = el.parentElement;
  }
  return false;
};

const cssEscape = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
};

const indexOfSameTag = (el: Element): number => {
  const parent = el.parentElement;
  if (!parent) return 1;
  let i = 1;
  for (const child of Array.from(parent.children)) {
    if (child === el) return i;
    if (child.tagName === el.tagName) i += 1;
  }
  return i;
};

const segmentFor = (el: Element): string => {
  const testId = el.getAttribute('data-testid');
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;
  if (el.id) return `#${cssEscape(el.id)}`;
  const tag = el.tagName.toLowerCase();
  return `${tag}:nth-of-type(${indexOfSameTag(el)})`;
};

const isUniqueEnough = (selector: string): boolean => {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
};

export const buildSelector = (el: Element): string => {
  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && depth < MAX_DEPTH) {
    const segment = segmentFor(current);
    parts.unshift(segment);
    const candidate = parts.join(' > ');
    if (isUniqueEnough(candidate)) return candidate;
    if (segment.startsWith('#') || segment.startsWith('[data-testid=')) {
      return candidate;
    }
    current = current.parentElement;
    depth += 1;
  }
  return parts.join(' > ');
};

const labelFor = (el: Element): string | null => {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria.slice(0, 80);
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) return text.slice(0, 80);
  const tag = el.tagName.toLowerCase();
  return tag || null;
};

export interface GetAnchorInput {
  clientX: number;
  clientY: number;
}

export const getAnchor = (el: Element, point: GetAnchorInput): Anchor => {
  const rect = el.getBoundingClientRect();
  const xRatio = rect.width > 0 ? (point.clientX - rect.left) / rect.width : 0.5;
  const yRatio = rect.height > 0 ? (point.clientY - rect.top) / rect.height : 0.5;
  return {
    selector: buildSelector(el),
    xRatio: Math.min(Math.max(xRatio, 0), 1),
    yRatio: Math.min(Math.max(yRatio, 0), 1),
    label: labelFor(el),
  };
};

export interface ResolvedPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  orphan: boolean;
}

export const resolveAnchor = (anchor: {
  selector: string;
  x_ratio: number;
  y_ratio: number;
}): ResolvedPosition | null => {
  let el: Element | null = null;
  try {
    el = document.querySelector(anchor.selector);
  } catch {
    el = null;
  }
  if (!el) {
    return {
      x: window.innerWidth - 64,
      y: window.innerHeight - 64,
      width: 0,
      height: 0,
      orphan: true,
    };
  }
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width * anchor.x_ratio,
    y: rect.top + rect.height * anchor.y_ratio,
    width: rect.width,
    height: rect.height,
    orphan: false,
  };
};
