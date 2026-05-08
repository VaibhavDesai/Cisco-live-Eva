import { useLayoutEffect, useRef, type ElementRef } from 'react';
import { AlertChip, Button, Tab, TabList } from '../momentum';
import { hideMomentumTabListBackwardArrow } from '../hideMomentumTabListOverflowArrows';
import { ck } from '../clus-kpi-theme';

/** Tab labels for the single-agent header (order matches `TabList` below). */
export type AgentPageTab =
  | 'Configuration'
  | 'Interactions'
  | 'Testing'
  | 'History'
  | 'Observability';

/** Stable ids for `Tab` / `TabList` (match Observability `TabList` pattern in ClusKpiDashboardRoot). */
type AgentTabId =
  | 'configuration'
  | 'interactions'
  | 'testing'
  | 'history'
  | 'observability';

const AGENT_TAB_ID_TO_LABEL: Record<AgentTabId, AgentPageTab> = {
  configuration: 'Configuration',
  interactions: 'Interactions',
  testing: 'Testing',
  history: 'History',
  observability: 'Observability',
};

/** Visible tab text (Figma WXCC-13953: “Sessions” vs internal `Interactions`). */
const AGENT_TAB_DISPLAY: Record<AgentPageTab, string> = {
  Configuration: 'Configuration',
  Interactions: 'Sessions',
  Testing: 'Testing',
  History: 'History',
  Observability: 'Analytics',
};

const AGENT_LABEL_TO_TAB_ID: Record<AgentPageTab, AgentTabId> = {
  Configuration: 'configuration',
  Interactions: 'interactions',
  Testing: 'testing',
  History: 'history',
  Observability: 'observability',
};

const AGENT_HEADER_TAB_IDS: AgentTabId[] = [
  'configuration',
  'interactions',
  'testing',
  'history',
  'observability',
];

/** Primary tabs only: Configuration, Interactions, History (test customer + simulated testing flows). */
const THREE_COLUMN_TAB_IDS: AgentTabId[] = ['configuration', 'interactions', 'history'];

export type PageHeaderTabPreset = 'agent' | 'testCustomer' | 'simulatedTesting';

function tabIdsForPreset(preset: PageHeaderTabPreset): AgentTabId[] {
  if (preset === 'testCustomer' || preset === 'simulatedTesting') {
    return THREE_COLUMN_TAB_IDS;
  }
  return AGENT_HEADER_TAB_IDS;
}

function normalizeActiveTabForPreset(
  tab: AgentPageTab | undefined,
  preset: PageHeaderTabPreset
): AgentPageTab {
  if (preset === 'testCustomer' || preset === 'simulatedTesting') {
    if (tab === 'Configuration' || tab === 'Interactions' || tab === 'History') {
      return tab;
    }
    return 'Configuration';
  }
  return tab ?? 'Observability';
}

interface PageHeaderProps {
  agentName?: string;
  status?: 'Live' | 'Testing' | 'Draft' | 'Disabled' | 'Published';
  /** When set, replaces the default “Last updated on … by …” line (Figma: tagline • relative time). */
  description?: string;
  lastUpdated?: string;
  updatedBy?: string;
  /** When set, replaces the default “Last updated…” line under the title. */
  lede?: string;
  activeTab?: AgentPageTab;
  onTabChange?: (tab: AgentPageTab) => void;
  onBack?: () => void;
  /** When `testCustomer` or `simulatedTesting`, only Configuration, Interactions, and History appear. */
  tabPreset?: PageHeaderTabPreset;
  /** Hide the Observability (Analytics) primary tab when this surface should not expose it. */
  showObservabilityTab?: boolean;
}

type StatusVariant = 'error' | 'informational' | 'neutral' | 'success' | 'warning';

function statusToAlertChip(
  status: NonNullable<PageHeaderProps['status']>
): { variant: StatusVariant; label: string } {
  const label = status === 'Published' ? 'Live' : status;
  if (status === 'Live' || status === 'Published') {
    return { variant: 'success', label };
  }
  if (status === 'Testing') {
    return { variant: 'warning', label };
  }
  if (status === 'Draft') {
    return { variant: 'neutral', label };
  }
  if (status === 'Disabled') {
    return { variant: 'error', label };
  }
  return { variant: 'neutral', label };
}

/** Two-letter initials for the gradient avatar (Figma AgentHeader). */
function agentNameToInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0];
    return w.slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase() || '?';
}

function isPublishedStyleStatus(status: NonNullable<PageHeaderProps['status']>): boolean {
  return status === 'Live' || status === 'Published';
}

export function PageHeader({
  agentName = 'Acme Bank Credit Card Assistant',
  status = 'Live',
  description,
  lastUpdated = '05/25/2025',
  updatedBy = 'Ayesh Reddy',
  lede,
  activeTab: activeTabProp,
  onTabChange,
  onBack: _onBack,
  tabPreset = 'agent',
  showObservabilityTab = true,
}: PageHeaderProps) {
  const preset = tabPreset ?? 'agent';
  const resolvedActiveTab = normalizeActiveTabForPreset(activeTabProp, preset);
  const visibleTabIds = tabIdsForPreset(preset).filter(
    (id) => showObservabilityTab || id !== 'observability'
  );
  const activeAgentTabId = AGENT_LABEL_TO_TAB_ID[resolvedActiveTab];

  const { variant: statusVariant, label: statusLabel } = statusToAlertChip(status);
  const agentTabListRef = useRef<ElementRef<typeof TabList> | null>(null);
  const showPublishedBadge = isPublishedStyleStatus(status);
  const subtitle =
    description?.trim() ||
    lede?.trim() ||
    `Last updated on ${lastUpdated} by ${updatedBy}`;

  useLayoutEffect(() => {
    const el = agentTabListRef.current;
    if (!el) return;

    const hide = () => hideMomentumTabListBackwardArrow(el);
    hide();
    const raf = requestAnimationFrame(hide);

    const root = el.shadowRoot;
    const mo =
      root &&
      new MutationObserver(() => {
        hide();
      });
    if (root) {
      mo?.observe(root, { childList: true, subtree: true });
    }

    const ro = new ResizeObserver(hide);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      mo?.disconnect();
      ro.disconnect();
    };
  }, [activeAgentTabId, preset]);

  return (
    <div className="clus-kpi-page-header flex w-full min-w-0 flex-col">
      {/* Top Section - Agent Info */}
      <div className="flex w-full min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className="clus-kpi-agent-header-avatar shrink-0"
            aria-hidden
          >
            {agentNameToInitials(agentName)}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="clus-kpi-agent-header-title-row mb-0 flex min-w-0 flex-nowrap items-center justify-start gap-2">
              <h1 className={`clus-project-title clus-project-title--agent ${ck.text}`}>{agentName}</h1>
              {showPublishedBadge ? (
                <span className="clus-kpi-agent-published-badge inline-flex shrink-0">Published</span>
              ) : (
                <span className="inline-flex shrink-0">
                  <AlertChip variant={statusVariant} label={statusLabel} />
                </span>
              )}
            </div>
            <p className="app-page-description clus-kpi-agent-header-description clus-project-description">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="clus-kpi-agent-header-actions flex shrink-0 items-center justify-end gap-2">
          <Button
            type="button"
            color="default"
            variant="secondary"
            size={40}
            prefixIcon="chat-bold"
          >
            Preview
          </Button>
          <Button
            type="button"
            color="default"
            variant="secondary"
            size={40}
            prefixIcon="more-bold"
            aria-label="More actions"
          />
        </div>
      </div>

      {/* Bottom Section — TabList + secondary Publish (same Tab pattern as Observability homepage) */}
      <div className="flex w-full min-w-0 self-stretch items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <TabList
            ref={agentTabListRef}
            data-aria-label={
              preset === 'testCustomer'
                ? 'AI customer configuration areas'
                : preset === 'simulatedTesting'
                  ? 'Agent configuration areas'
                  : 'Agent areas'
            }
            activeTabId={activeAgentTabId}
            onChange={(e: CustomEvent<{ tabId: string }>) => {
              const id = e.detail.tabId as AgentTabId;
              const label = AGENT_TAB_ID_TO_LABEL[id];
              if (label) onTabChange?.(label);
            }}
          >
            {visibleTabIds.map((id) => (
              <Tab
                key={id}
                tabId={id}
                text={AGENT_TAB_DISPLAY[AGENT_TAB_ID_TO_LABEL[id]]}
                variant="glass"
              />
            ))}
          </TabList>
        </div>
        <Button
          type="button"
          color="default"
          variant="secondary"
          size={32}
          className="shrink-0"
          prefixIcon="cloud-upload-bold"
        >
          Publish
        </Button>
      </div>
    </div>
  );
}