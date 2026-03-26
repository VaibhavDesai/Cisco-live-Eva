import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Surfaces React render errors instead of a blank root (common when a dependency throws).
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const e = this.state.error;
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#1a0a0a',
            color: '#fff',
            fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h1 style={{ marginBottom: 16, fontSize: 18 }}>Something went wrong</h1>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>{e.message}</p>
          <code style={{ fontSize: 12, opacity: 0.75 }}>{e.stack ?? ''}</code>
        </div>
      );
    }
    return this.props.children;
  }
}
