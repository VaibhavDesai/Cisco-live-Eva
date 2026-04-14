import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';
import Button from './Button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Visual tone and default icon mapping for a toast */
export type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  /** Button label text */
  label: string;
  /** Invoked when the action is activated */
  onClick: () => void;
  /** Visual variant for the action button */
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export interface ToastOptions {
  /** Stable toast id; generated when omitted */
  id?: string;
  /** Semantic tone controlling icon and styling */
  type?: ToastType;
  /** Leading icon override; defaults from `type` when omitted */
  icon?: IconName;
  /** Bold headline above the message */
  title?: string;
  /** Body content under the title */
  message?: ReactNode;
  /** Optional footer action buttons */
  actions?: ToastAction[];
  /** Custom region between the message block and actions */
  slot?: ReactNode;
  /** Auto-dismiss delay in ms; `0` keeps the toast until dismissed */
  duration?: number;
  /** When false, hides the dismiss control */
  dismissable?: boolean;
}

interface ToastEntry extends Required<Pick<ToastOptions, 'id' | 'type' | 'dismissable'>> {
  /** Leading icon override */
  icon?: IconName;
  /** Bold headline */
  title?: string;
  /** Body content */
  message?: ReactNode;
  /** Footer action buttons */
  actions?: ToastAction[];
  /** Slot between message and actions */
  slot?: ReactNode;
  /** Auto-dismiss duration in ms */
  duration: number;
  /** When true, plays exit animation before removal */
  exiting?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ToastContextValue {
  /** Enqueues a toast and returns its id */
  notify: (options: ToastOptions) => string;
  /** Removes a toast by id */
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Accesses `notify` and `dismiss` from the nearest `ToastProvider`.
 * @example
 * const { notify } = useToast();
 * notify({ title: 'Saved', message: 'Your changes were applied.' });
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Icon config per type                                               */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<string, IconName | undefined> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning',
  error: 'error-legacy',
};

const TYPE_ICON_CLASS: Record<string, string> = {
  info: 'toast-icon-info',
  success: 'toast-icon-success',
  warning: 'toast-icon-warning',
  error: 'toast-icon-error',
};

/* ------------------------------------------------------------------ */
/*  Individual Toast                                                   */
/* ------------------------------------------------------------------ */

function ToastItem({
  entry,
  onDismiss,
}: {
  entry: ToastEntry;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (entry.duration > 0 && !entry.exiting) {
      timerRef.current = setTimeout(() => onDismiss(entry.id), entry.duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [entry.id, entry.duration, entry.exiting, onDismiss]);

  const iconName = entry.icon ?? TYPE_ICONS[entry.type];
  const iconClass = TYPE_ICON_CLASS[entry.type] ?? '';
  const typeClass = entry.type !== 'default' ? `toast-${entry.type}` : '';

  return (
    <div
      className={`toast${typeClass ? ` ${typeClass}` : ''}${entry.exiting ? ' toast-exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content">
        {iconName && (
          <span className={`toast-icon${iconClass ? ` ${iconClass}` : ''}`}>
            <Icon name={iconName} weight="bold" size={24} />
          </span>
        )}
        <div className="toast-body">
          {entry.title && <span className="toast-header">{entry.title}</span>}
          {entry.message && <span className="toast-message">{entry.message}</span>}
        </div>
        {entry.dismissable && (
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(entry.id)}
            aria-label="Dismiss"
          >
            <Icon name="cancel" weight="bold" size={16} />
          </button>
        )}
      </div>

      {entry.slot && <div className="toast-slot">{entry.slot}</div>}

      {entry.actions && entry.actions.length > 0 && (
        <div className="toast-actions">
          {entry.actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? 'secondary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider + Container                                               */
/* ------------------------------------------------------------------ */

let idCounter = 0;

/**
 * Supplies toast helpers to descendants and portals the toast stack to `document.body`.
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const notify = useCallback(
    (opts: ToastOptions): string => {
      const id = opts.id ?? `toast-${++idCounter}`;
      const entry: ToastEntry = {
        id,
        type: opts.type ?? 'default',
        icon: opts.icon,
        title: opts.title,
        message: opts.message,
        actions: opts.actions,
        slot: opts.slot,
        duration: opts.duration ?? 5000,
        dismissable: opts.dismissable ?? true,
      };
      setToasts((prev) => [...prev, entry]);
      return id;
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((entry) => (
            <ToastItem key={entry.id} entry={entry} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
