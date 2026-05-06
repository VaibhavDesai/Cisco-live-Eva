import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EvaCanvasSurface from './canvas/EvaCanvasSurface';

/* Pathnames that signal "canvas should be open." We support multiple
   sibling routes so the canvas can be mounted under different parents
   without forcing a sidebar tab switch:
     - `/agents/eva-canvas` — opens over the AI Agents page (variations
       'landing' and 'form-bases', and 'dashboard' when the user is on
       /agents directly).
     - `/eva-canvas` — opens over the Dashboard page (variation
       'dashboard' when the user is on / and EvaChatExperience is
       rendered through Dashboard.tsx). Keeping the canvas under the
       Dashboard root means the "Dashboard" sidebar item stays
       highlighted while the canvas is open, instead of jumping to
       "AI Agents" mid-flow. */
export const EVA_CANVAS_AGENTS_PATH = '/agents/eva-canvas';
export const EVA_CANVAS_DASHBOARD_PATH = '/eva-canvas';
export const EVA_CANVAS_PATHS: readonly string[] = [
  EVA_CANVAS_AGENTS_PATH,
  EVA_CANVAS_DASHBOARD_PATH,
];

const isCanvasPath = (pathname: string): boolean =>
  EVA_CANVAS_PATHS.includes(pathname);

/* One-shot sessionStorage flag set by the canvas's "New thread" button.
   The chat experience reads it on the next path change back to /agents and
   spawns a fresh thread. Using sessionStorage keeps EvaCanvasOverlay
   decoupled from EvaChatExperience — no shared store, no cross-component
   imperative handle, just a tiny rendezvous point. The flag is consumed
   (cleared) by the reader. */
export const EVA_CANVAS_NEW_THREAD_FLAG = 'eva-canvas-request-new-thread';

/* Origin path the user was on when they opened the canvas. The canvas
   route lives under /agents (so EvaCanvasOverlay can slide in over
   <Agents>), but the chat-based experience can also be reached from
   /dashboard via the "Chat-based in Dashboard" design variation. When
   that user clicks "Canvas view" we still navigate to /agents/eva-canvas,
   which unmounts the Dashboard route. Clicking "Chat view" must then
   send them back to /dashboard so the original underlying view (and its
   restored EvaChatExperience state) is what they see — not the Agents
   page. We persist the origin in sessionStorage and consume it on close. */
export const EVA_CANVAS_ORIGIN_PATH_KEY = 'eva-canvas-origin-path';

/* Map a canvas path to its sensible parent route. Used as a fallback
   when no origin has been saved (e.g. the user deep-linked or refreshed
   mid-canvas) so the user still lands somewhere coherent — under the
   same sidebar tab the canvas was sitting beside. */
const fallbackOriginFor = (canvasPath: string): string => {
  if (canvasPath === EVA_CANVAS_DASHBOARD_PATH) return '/';
  return '/agents';
};

/* Read the origin path the canvas opener saved, falling back to the
   parent of `currentCanvasPath` when nothing was saved. Filters out
   canvas paths themselves to avoid getting stuck in a closed loop. */
const readCanvasOriginPath = (currentCanvasPath: string): string => {
  try {
    const raw = window.sessionStorage.getItem(EVA_CANVAS_ORIGIN_PATH_KEY);
    if (raw && !isCanvasPath(raw)) return raw;
  } catch {
    /* sessionStorage may be unavailable; fall through to default. */
  }
  return fallbackOriginFor(currentCanvasPath);
};

const consumeCanvasOriginPath = (currentCanvasPath: string): string => {
  const path = readCanvasOriginPath(currentCanvasPath);
  try {
    window.sessionStorage.removeItem(EVA_CANVAS_ORIGIN_PATH_KEY);
  } catch {
    /* ignore */
  }
  return path;
};

/**
 * Sliding-reveal overlay that hosts the canvas surface above the rest of /agents.
 *
 * The component is always mounted while /agents is mounted (so the entrance
 * and exit animations both have a stable starting frame), but the heavy
 * `EvaCanvasSurface` only mounts while the overlay is open OR closing.
 * Once the close transition finishes, the surface unmounts so its zoom/pan
 * listeners and sessionStorage subscriptions stop running on idle.
 *
 * The animation is a `clip-path` reveal — the canvas surface stays full-size
 * and stationary, and the visible region grows leftward from the right side
 * panel area (closed) to the entire main pane (open). It reads as the side
 * panel "morphing" into the canvas, instead of a panel sliding in from the
 * right.
 *
 * Open/close is driven entirely by `location.pathname`:
 *   - `/agents/eva-canvas` or `/eva-canvas` (see EVA_CANVAS_PATHS) →
 *       clip-path inset(0), pointer-events on, focus inside
 *   - any other →
 *       clip-path inset(0 0 0 100%) (fully collapsed at the right edge),
 *       pointer-events off, focus out
 *
 * Buttons inside the canvas (Chat view, Create new agent) drive `navigate(...)`
 * back to whichever route the user came from (saved in
 * EVA_CANVAS_ORIGIN_PATH_KEY by the opener), which flips this overlay
 * closed naturally and keeps the sidebar tab put.
 */
export default function EvaCanvasOverlay() {
  const location = useLocation();
  const navigate = useNavigate();

  const isOpenPath = isCanvasPath(location.pathname);

  /* `mounted` keeps the heavy canvas surface in the tree while the close
     transition runs. We flip it true the moment the path opens, and false
     only after `transitionend` fires — so the surface unmounts once the
     panel is fully off-screen and there's nothing to see. */
  const [mounted, setMounted] = useState(isOpenPath);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpenPath) {
      setMounted(true);
    }
  }, [isOpenPath]);

  /* When the overlay sweeps closed, wait for the clip-path transition to
     finish before unmounting. We listen on the overlay element directly so
     this isn't tied to any specific transition duration in CSS. WebKit
     reports the property as `-webkit-clip-path`; both branches are
     accepted to cover Chromium/Firefox AND older Safari. */
  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return undefined;
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'clip-path' && event.propertyName !== '-webkit-clip-path') {
        return;
      }
      if (!isOpenPath) {
        setMounted(false);
      }
    };
    node.addEventListener('transitionend', handleTransitionEnd);
    return () => node.removeEventListener('transitionend', handleTransitionEnd);
  }, [isOpenPath]);

  const handleBack = () => {
    /* Return to whichever route the user opened the canvas from
       (falling back to the parent of the current canvas path). This
       preserves the chat-based build state when the canvas was opened
       from the Dashboard route under the "Chat-based in Dashboard"
       variation — going to /agents instead would land the user on
       EvaAgentsTable's landing screen and look like the build flow was
       wiped. */
    navigate(consumeCanvasOriginPath(location.pathname));
  };

  const handleNewThread = () => {
    try {
      window.sessionStorage.setItem(EVA_CANVAS_NEW_THREAD_FLAG, '1');
    } catch {
      /* sessionStorage may be disabled (private mode / quota); fall through
         silently — worst case the user just lands back on chat without a
         new thread spawned, which is an acceptable degradation. */
    }
    handleBack();
  };

  return (
    <div
      ref={overlayRef}
      className={`eva-canvas-overlay${isOpenPath ? ' eva-canvas-overlay--open' : ''}`}
      aria-hidden={!isOpenPath}
      /* `inert` removes the entire subtree from the focus and accessibility
         tree while the overlay is closed, so keyboard users don't tab into
         the off-screen canvas. Supported natively in React 19+. */
      inert={!isOpenPath}
    >
      {mounted && (
        <EvaCanvasSurface onBack={handleBack} onNewThread={handleNewThread} />
      )}
    </div>
  );
}
