import type { ReactNode } from 'react';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import AppHeader from '../../../components/shared/AppHeader';
import webexAiAgentStudioWordmark from '../../../assets/webex-ai-agent-studio-wordmark.svg';

export interface StudioHeaderProps {
  onAiClick?: () => void;
  centerContent?: ReactNode;
}

export default function Header({ onAiClick, centerContent }: StudioHeaderProps) {
  return (
    <AppHeader
      fixed
      wordmarkSvg={webexAiAgentStudioWordmark}
      wordmarkAlt="Webex AI Agent Studio"
      showSearch={false}
      centerContent={centerContent}
      alertCount={1}
      avatarSrc="https://i.pravatar.cc/64?img=12"
      avatarName="Austen Jones"
      onAiClick={onAiClick}
    >
      <ThemeToggle />
    </AppHeader>
  );
}
