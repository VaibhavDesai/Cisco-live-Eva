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

export type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export interface ToastOptions {
  /** Unique id — auto-generated if omitted */
  id?: string;
  type?: ToastType;
  /** Optional leading icon override (defaults by type) */
  icon?: IconName;
  title?: string;
  message?: ReactNode;
  actions?: ToastAction[];
  /** Custom slot rendered between message and actions */
  slot?: ReactNode;
  /** Auto-dismiss delay in ms. `0` = persist. Default 5000 */
  duration?: number;
  dismissable?: boolean;
}

interface ToastEntry extends Required<Pick<ToastOptions, 'id' | 'type' | 'dismissable'>> {
  icon?: IconName;
  title?: string;
  message?: ReactNode;
  actions?: ToastAction[];
  slot?: ReactNode;
  duration: number;
  exiting?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ToastContextValue {
  notify: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

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
