import type { ReactNode } from 'react';
import { BackgroundBlock } from './layout-blocks/BackgroundBlock';

interface GlobalLayoutProps {
  children: ReactNode;
}

/**
 * Global layout – composes layout blocks in order.
 * Block order: background (z-index 0), then content. Future blocks (header, sidebar, main) added here.
 */
export function GlobalLayout({ children }: GlobalLayoutProps) {
  return (
    <>
      <BackgroundBlock />
      <div className="app-root-content-flex">
        {children}
      </div>
    </>
  );
}
