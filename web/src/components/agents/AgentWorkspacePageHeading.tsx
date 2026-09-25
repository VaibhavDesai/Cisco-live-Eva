import type { ReactNode } from 'react';

interface AgentWorkspacePageHeadingProps {
  title: string;
  titleAccessory?: ReactNode;
  description?: string;
  actions?: ReactNode;
  id?: string;
}

export default function AgentWorkspacePageHeading({
  title,
  titleAccessory,
  description,
  actions,
  id,
}: AgentWorkspacePageHeadingProps) {
  return (
    <header className="agent-workspace-page-heading">
      <div className="agent-workspace-page-heading__copy">
        <h1 id={id}>{title}{titleAccessory}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="agent-workspace-page-heading__actions">{actions}</div>}
    </header>
  );
}
