import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons/Icon';
import { TooltipTonalBackdrop } from './TooltipTonalBackdrop';

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

/** Bubble position and alignment relative to the anchor */
export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

const ARROW_GAP = 8;

function computePosition(
  anchor: DOMRect,
  bubble: DOMRect,
  placement: TooltipPlacement,
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  const side = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const align = placement.split('-')[1] as 'start' | 'end' | undefined;

  switch (side) {
    case 'top':
      top = anchor.top - bubble.height - ARROW_GAP;
      break;
    case 'bottom':
      top = anchor.bottom + ARROW_GAP;
      break;
    case 'left':
      left = anchor.left - bubble.width - ARROW_GAP;
      break;
    case 'right':
      left = anchor.right + ARROW_GAP;
      break;
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = anchor.left;
    else if (align === 'end') left = anchor.right - bubble.width;
    else left = anchor.left + anchor.width / 2 - bubble.width / 2;
  }

  if (side === 'left' || side === 'right') {
    if (align === 'start') top = anchor.top;
    else if (align === 'end') top = anchor.bottom - bubble.height;
    else top = anchor.top + anchor.height / 2 - bubble.height / 2;
  }

  left = Math.max(4, Math.min(left, window.innerWidth - bubble.width - 4));
  top = Math.max(4, Math.min(top, window.innerHeight - bubble.height - 4));

  return { top, left };
}

/* ------------------------------------------------------------------ */
/*  Tooltip — hover/focus triggered, text-only                         */
/* ------------------------------------------------------------------ */

export interface TooltipAction {
  /** Label for the optional action pill */
  label: string;
  /** Called when the action button is pressed */
  onClick?: () => void;
}

export interface TooltipProps {
  /** Text or nodes shown inside the tooltip bubble */
  content: ReactNode;
  /** Preferred placement of the bubble relative to the child */
  placement?: TooltipPlacement;
  /** Delay in ms before the bubble appears; default 200 */
  delay?: number;
  /** Keeps the bubble open while hovering it (also implied when `action` is set) */
  interactive?: boolean;
  /** Optional pill button rendered under the main text */
  action?: TooltipAction;
  /** Single React element that receives hover/focus listeners */
  children: ReactElement;
  /** Extra classes on the bubble element */
  className?: string;
}

/**
 * Hover/focus-triggered tooltip that portals a positioned bubble to `document.body`.
 *
 * @example
 * <Tooltip content="Saved"><button type="button">Hover me</button></Tooltip>
 */
export function Tooltip({
  content,
  placement = 'bottom',
  delay = 200,
  interactive = false,
  action,
  children,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const isInteractive = interactive || !!action;

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    if (isInteractive) {
      timerRef.current = setTimeout(() => setVisible(false), 120);
    } else {
      setVisible(false);
    }
  }, [isInteractive]);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible || !anchorRef.current || !bubbleRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const bRect = bubbleRef.current.getBoundingClientRect();
    setPos(computePosition(rect, bRect, placement));
  }, [visible, placement]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childProps = children.props as any;
  const child = cloneElement(children, {
    ref: anchorRef,
    onMouseEnter: (e: MouseEvent) => {
      show();
      childProps.onMouseEnter?.(e);
    },
    onMouseLeave: (e: MouseEvent) => {
      hide();
      childProps.onMouseLeave?.(e);
    },
    onFocus: (e: FocusEvent) => {
      show();
      childProps.onFocus?.(e);
    },
    onBlur: (e: FocusEvent) => {
      hide();
      childProps.onBlur?.(e);
    },
  } as Record<string, unknown>);

  const bubbleHandlers = isInteractive
    ? {
        onMouseEnter: () => { clearTimeout(timerRef.current); },
        onMouseLeave: () => { hide(); },
      }
    : {};

  return (
    <>
      {child}
      {visible &&
        createPortal(
          <div
            ref={bubbleRef}
            className={`tooltip-bubble${isInteractive ? ' tooltip-interactive' : ''}${className ? ` ${className}` : ''}`}
            role="tooltip"
            data-placement={placement}
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            {...bubbleHandlers}
          >
            <TooltipTonalBackdrop />
            <div className="tooltip-body">
              <span className="tooltip-text">{content}</span>
              {action && (
                <button
                  type="button"
                  className="tooltip-action-btn"
                  onClick={() => { action.onClick?.(); dismiss(); }}
                >
                  {action.label}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  ToggleTip — click triggered, interactive (close + optional link)   */
/* ------------------------------------------------------------------ */

export interface ToggleTipLink {
  /** Anchor text shown in the optional link row */
  label: string;
  /** URL for a standard navigation link */
  href?: string;
  /** Called instead of navigation when `href` is omitted or prevented */
  onClick?: () => void;
}

export interface ToggleTipProps {
  /** Main rich text inside the popover */
  content: ReactNode;
  /** Optional trailing link with external icon */
  link?: ToggleTipLink;
  /** Preferred placement of the bubble relative to the child */
  placement?: TooltipPlacement;
  /** Element whose click toggles the bubble open/closed */
  children: ReactElement;
  /** Extra classes on the bubble element */
  className?: string;
}

/**
 * Click-triggered popover with optional link, close control, and outside/Escape dismissal.
 *
 * @example
 * <ToggleTip content="Details here"><button type="button">Info</button></ToggleTip>
 */
export const ToggleTip = forwardRef<HTMLDivElement, ToggleTipProps>(
  function ToggleTip(
    { content, link, placement = 'bottom', children, className = '' },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const toggle = useCallback(() => setOpen((v) => !v), []);
    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
      if (!open || !anchorRef.current || !bubbleRef.current) return;

      const update = () => {
        const rect = anchorRef.current!.getBoundingClientRect();
        const bRect = bubbleRef.current!.getBoundingClientRect();
        setPos(computePosition(rect, bRect, placement));
      };

      update();

      const handleOutside = (e: Event) => {
        if (
          bubbleRef.current &&
          !bubbleRef.current.contains(e.target as Node) &&
          !anchorRef.current?.contains(e.target as Node)
        ) {
          close();
        }
      };

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };

      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);

      return () => {
        document.removeEventListener('mousedown', handleOutside);
        document.removeEventListener('keydown', handleEsc);
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    }, [open, placement, close]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childProps = children.props as any;
    const child = cloneElement(children, {
      ref: anchorRef,
      onClick: (e: MouseEvent) => {
        toggle();
        childProps.onClick?.(e);
      },
    } as Record<string, unknown>);

    return (
      <>
        {child}
        {open &&
          createPortal(
            <div
              ref={(node) => {
                (bubbleRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }}
              className={`tooltip-bubble tooltip-interactive${className ? ` ${className}` : ''}`}
              role="status"
              data-placement={placement}
              style={{ position: 'fixed', top: pos.top, left: pos.left }}
            >
              <TooltipTonalBackdrop />
              <div className="toggletip-content">
                <span className="tooltip-text">{content}</span>
                {link && (
                  <a
                    className="toggletip-link"
                    href={link.href}
                    onClick={(e) => {
                      if (link.onClick) {
                        e.preventDefault();
                        link.onClick();
                      }
                    }}
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <Icon name="placeholder" weight="bold" size={14} />
                  </a>
                )}
              </div>
              <button
                type="button"
                className="toggletip-close"
                aria-label="Close"
                onClick={close}
              >
                <Icon name="cancel" weight="bold" size={16} />
              </button>
            </div>,
            document.body,
          )}
      </>
    );
  },
);
