import { type ReactNode } from 'react';

export type AppHeaderVariant = 'desktop' | 'mobile';

export interface AppHeaderProps {
  /** Leading utilities: menu, logo */
  leading?: ReactNode;
  /** Center: search / title */
  middle?: ReactNode;
  /** Trailing: icons, avatar */
  trailing?: ReactNode;
  variant?: AppHeaderVariant;
  className?: string;
}

/**
 * Momentum App Header layout (`46-2309`) — composable 64px shell.
 */
export function AppHeader({
  leading,
  middle,
  trailing,
  variant = 'desktop',
  className = '',
}: AppHeaderProps) {
  if (variant === 'mobile') {
    return (
      <header
        className={`app-header app-header--mobile ${className}`.trim()}
        role="banner"
      >
        <div className="app-header__row">
          <div className="app-header__leading">{leading}</div>
          <div className="app-header__trailing">{trailing}</div>
        </div>
        {middle != null ? <div className="app-header__middle">{middle}</div> : null}
      </header>
    );
  }

  return (
    <header className={`app-header ${className}`.trim()} role="banner">
      <div className="app-header__leading">{leading}</div>
      {middle != null ? <div className="app-header__middle">{middle}</div> : null}
      <div className="app-header__trailing">{trailing}</div>
    </header>
  );
}
