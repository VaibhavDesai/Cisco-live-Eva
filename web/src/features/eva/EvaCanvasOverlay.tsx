import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EvaCanvasSurface from './canvas/EvaCanvasSurface';

/* Pathname that signals "canvas should be open." Mounted alongside `/agents`
   so the chat/form view stays mounted underneath while the canvas slides
   in/out as an overlay. Kept in sync with the route definition in App.tsx. */
const CANVAS_PATH = '/agents/eva-canvas';

/* One-shot sessionStorage flag set by the canvas's "New thread" button.
   The chat experience reads it on the next path change back to /agents and
   spawns a fresh thread. Using sessionStorage keeps EvaCanvasOverlay
   decoupled from EvaChatExperience — no shared store, no cross-component
   imperative handle, just a tiny rendezvous point. The flag is consumed
   (cleared) by the reader. */
export const EVA_CANVAS_NEW_THREAD_FLAG = 'eva-canvas-request-new-thread';

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
 *   - `/agents/eva-canvas` → clip-path inset(0), pointer-events on, focus inside
 *   - any other            → clip-path inset(0 0 0 100%) (fully collapsed at
 *                            the right edge), pointer-events off, focus out
 *
 * Buttons inside the canvas (Chat view, Create new agent) drive `navigate(...)`
 * back to `/agents`, which flips this overlay closed naturally.
 */
export default function EvaCanvasOverlay() {
  const location = useLocation();
  const navigate = useNavigate();

  const isOpenPath = location.pathname === CANVAS_PATH;

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
    navigate('/agents');
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
