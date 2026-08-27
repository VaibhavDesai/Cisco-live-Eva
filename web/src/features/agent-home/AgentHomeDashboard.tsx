import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../../components/shared/Button';
import Badge, { type BadgeVariant } from '../../components/shared/Badge';
import { Banner } from '../../components/shared/Banner';
import { Card } from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';
import { AiSymbol } from '../../components/shared';
import { Icon, type IconName } from '../../icons';
import EvaHeroAnimation from '../eva/EvaHeroAnimation';
import AgentHomeFirstTimeFlows, {
  type AgentHomeDemoMessage,
  type AgentHomeFirstTimeFlow,
  type AgentHomeTemplateSetup,
} from './AgentHomeFirstTimeFlows';
import type { AgentHomeTemplateId } from './agentHomeTemplateCatalog';
import type {
  AgentHomeAction,
  AgentHomeMetric,
  AgentHomeSnapshot,
  DemoHomeMode,
  FleetAgentSummary,
  WorkflowActivity,
} from './agentHomeModel';

const WORKFLOW_ICON: Record<WorkflowActivity['kind'], 'shield' | 'headset' | 'automation'> = {
  guardrail: 'shield',
  handoff: 'headset',
  action: 'automation',
};

const statusBadgeVariant = (tone: AgentHomeSnapshot['attentionItems'][number]['statusTone']): BadgeVariant => {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'default';
};

const noticeType = (tone: AgentHomeSnapshot['dataState']['notices'][number]['tone']) => (
  tone === 'danger' ? 'error' : tone
);

const RECURRING_HEALTH_ROWS = [
  { id: 'vip-reservation', label: 'EAGLE Green VIP Reservation', value: 95.8, tone: 'healthy' },
  { id: 'servicenow', label: 'EAGLE Green ServiceNow agent', value: 93.6, tone: 'healthy' },
  { id: 'logistic', label: 'EAGLE Green logistic agent', value: 84.8, tone: 'healthy' },
  { id: 'ticket-management', label: 'EAGLE Green ticket management', value: 74.2, tone: 'warning' },
] as const;

const RECURRING_SESSION_ROWS = [
  { id: 'vip-reservation', label: 'EAGLE Green VIP Reservation', sessions: 2_814 },
  { id: 'servicenow', label: 'EAGLE Green ServiceNow agent', sessions: 206 },
  { id: 'logistic', label: 'EAGLE Green logistic agent', sessions: 43 },
  { id: 'ticket-management', label: 'EAGLE Green ticket management', sessions: 16 },
] as const;

const RECURRING_TOTAL_USAGE_COLOR = '#643abd';

const VIEW_KNOWLEDGE_ACTION: AgentHomeAction = {
  id: 'view-knowledge-sync',
  label: 'View Knowledge',
  href: '/knowledge/col-2',
  intent: 'navigate',
  requiresConfirmation: false,
};

const VIEW_INSTRUCTION_ACTION: AgentHomeAction = {
  id: 'view-vip-instruction',
  label: 'View Instruction',
  href: '/agents/golftop-vip-reservations/configure?section=Instructions',
  intent: 'navigate',
  requiresConfirmation: false,
};

const VIEW_ACTION_ACTION: AgentHomeAction = {
  id: 'view-servicenow-action',
  label: 'View Action',
  href: '/agents/golftop-servicenow-coordinator/configure?section=Action',
  intent: 'navigate',
  requiresConfirmation: false,
};

interface AgentHomeExistingAgent {
  id: string;
  name: string;
  initials: string;
  status: string;
  sessions: string;
}

export interface AgentHomeDashboardProps {
  mode: DemoHomeMode;
  creationAudience?: DemoHomeMode;
  showGreeting?: boolean;
  onFirstTimeFlowChange?: (flow: AgentHomeFirstTimeFlow) => void;
  snapshot: AgentHomeSnapshot;
  onAction: (action: AgentHomeAction) => void;
  onStartFromScratch: () => void;
  onUseTemplate: (templateId: AgentHomeTemplateId, setup?: AgentHomeTemplateSetup) => void;
  onSendDemoMessage: (
    templateId: AgentHomeTemplateId,
    history: AgentHomeDemoMessage[],
    text: string,
  ) => Promise<string>;
  onOpenFleetAgent: (agent: FleetAgentSummary) => void;
  onOpenWorkflowActivity: (activity: WorkflowActivity) => void;
  existingAgents?: readonly AgentHomeExistingAgent[];
}

function HomeNotices({ snapshot }: { snapshot: AgentHomeSnapshot }) {
  if (snapshot.dataState.notices.length === 0) return null;

  return (
    <div className="agent-home__notices" aria-label="Agent home status">
      {snapshot.dataState.notices.map(notice => (
        <Banner
          key={notice.id}
          type={noticeType(notice.tone)}
          title={notice.title}
          subtitle={notice.description}
          dismissable={false}
          className="agent-home__notice"
        />
      ))}
    </div>
  );
}

function FirstTimeHome({
  snapshot,
  onAction,
  onStartFromScratch,
  creationAudience = 'first-time',
  existingAgents = [],
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction' | 'onStartFromScratch' | 'creationAudience' | 'existingAgents'>) {
  const primaryAction = snapshot.actions[0];
  const permissionMissing = snapshot.dataState.permission === 'missing';
  const isRecurringCreation = creationAudience === 'recurring';
  const startWithAssistant = snapshot.quickStarts.find(item => item.id === 'start-with-assistant');
  const chooseTemplate = snapshot.quickStarts.find(item => item.id === 'choose-template');
  const mostUsedAgents = [...existingAgents]
    .map(agent => ({
      ...agent,
      sessionCount: Number(agent.sessions.replace(/[^0-9.]/g, '')) || 0,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name))
    .slice(0, 5);

  const openExistingAgent = (agent: AgentHomeExistingAgent) => onAction({
    id: `open-current-agent-${agent.id}`,
    label: `Open ${agent.name}`,
    href: `/agents/${encodeURIComponent(agent.id)}`,
    intent: 'navigate',
    requiresConfirmation: false,
  });

  const viewAllAgents = () => onAction({
    id: 'open-agent-library',
    label: 'View all agents',
    href: '/agents',
    intent: 'navigate',
    requiresConfirmation: false,
  });

  if (permissionMissing) {
    if (!primaryAction) return null;

    return (
      <Card className="agent-home__permission-card">
        <div aria-hidden="true"><Icon name="secure-lock" weight="bold" size="lg" /></div>
        <div>
          <h2>AI Agent Studio access is required</h2>
          <p>An administrator must approve the required license or role before setup can begin.</p>
        </div>
        <Button variant="primary" onClick={() => onAction(primaryAction)}>{primaryAction.label}</Button>
      </Card>
    );
  }

  return (
    <section className="agent-home__first-actions" aria-labelledby="agent-home-quick-start-title">
      <h2 id="agent-home-quick-start-title" className="sr-only">Quick start</h2>
      <div className="agent-home__first-action-grid">
        <Card
          className="agent-home__first-action-card agent-home__first-action-card--builder eva-landing-task-card"
          role="group"
          aria-labelledby="agent-home-build-card-title"
        >
          <div className="eva-landing-task-card__header">
            <span className="eva-landing-task-card__icon" aria-hidden="true">
              <Icon name="magic-pen" weight="bold" size={24} />
            </span>
            <strong id="agent-home-build-card-title">
              {isRecurringCreation
                ? 'Create your next agent in about 2 minutes'
                : 'Let\'s build your first agent — it only takes 2 minutes'}
            </strong>
          </div>
          <p className="eva-landing-task-card__start-options-intro">
            Create AI agents for your teams, customers, and collaboration services.
          </p>
          <div className="eva-landing-task-card__start-options" role="group" aria-label="Agent creation options">
            <button
              type="button"
              className="eva-landing-task-card__start-option eva-landing-task-card__start-option--primary"
              disabled={!chooseTemplate}
              onClick={() => chooseTemplate && onAction(chooseTemplate.action)}
            >
              <Icon name="guide" weight="bold" size={20} aria-hidden="true" />
              <span>Browse template</span>
              <small>Start with a ready-made agent</small>
            </button>
            <button
              type="button"
              className="eva-landing-task-card__start-option"
              disabled={!startWithAssistant}
              onClick={() => startWithAssistant && onAction(startWithAssistant.action)}
            >
              <Icon name="magic-pen" weight="bold" size={20} aria-hidden="true" />
              <span>Create with guide</span>
              <small>Build with guided setup</small>
            </button>
            <button
              type="button"
              className="eva-landing-task-card__start-option"
              onClick={onStartFromScratch}
            >
              <Icon name="plus" weight="bold" size={20} aria-hidden="true" />
              <span>Start from scratch</span>
              <small>Create an empty agent</small>
            </button>
          </div>
        </Card>

        {isRecurringCreation && (
          <Card
            className="agent-home__first-action-card agent-home__first-action-card--agents eva-landing-task-card"
            role="region"
            aria-labelledby="agent-home-most-used-title"
          >
            <div className="eva-landing-task-card__header agent-home__most-used-header">
              <span className="eva-landing-task-card__icon" aria-hidden="true">
                <Icon name="apps" weight="bold" size={24} />
              </span>
              <strong id="agent-home-most-used-title">Your agents</strong>
            </div>
            {mostUsedAgents.length > 0 ? (
              <ul className="agent-home__most-used-list">
                {mostUsedAgents.map(agent => {
                  const usageLabel = `${agent.sessionCount.toLocaleString()} ${agent.sessionCount === 1 ? 'session' : 'sessions'}`;

                  return (
                    <li key={agent.id}>
                      <button
                        type="button"
                        className="agent-home__most-used-agent"
                        aria-label={`Open ${agent.name}, ${agent.status}, ${usageLabel}`}
                        onClick={() => openExistingAgent(agent)}
                      >
                        <span className="agent-home__most-used-avatar" aria-hidden="true">{agent.initials}</span>
                        <span className="agent-home__most-used-copy">
                          <strong>{agent.name}</strong>
                          <span>
                            <span className={`agent-home__most-used-status${agent.status.toLowerCase().includes('publish') ? ' agent-home__most-used-status--published' : ''}`}>
                              <i aria-hidden="true" />
                              {agent.status}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{usageLabel}</span>
                          </span>
                        </span>
                        <Icon name="arrow-right" weight="bold" size="sm" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="agent-home__most-used-empty">Your agents will appear here after you create one.</p>
            )}
            <div className="eva-landing-task-card__footer-actions">
              <button
                type="button"
                className="eva-landing-task-card__action"
                onClick={viewAllAgents}
              >
                View all agents
                <Icon name="arrow-right" weight="bold" size="sm" />
              </button>
            </div>
          </Card>
        )}

      </div>
    </section>
  );
}

function MetricDrillDown({
  metric,
  onAction,
}: {
  metric: AgentHomeMetric;
  onAction: AgentHomeDashboardProps['onAction'];
}) {
  return (
    <button type="button" onClick={() => onAction(metric.drillDown)}>
      {metric.drillDown.label}
      <span className="sr-only"> for {metric.label}; {metric.timeWindow}; {metric.freshness}</span>
      <span aria-hidden="true"><Icon name="arrow-right" weight="bold" size="sm" /></span>
    </button>
  );
}

function HealthGaugeMetricCard({
  metric,
  onAction,
}: {
  metric: AgentHomeMetric;
  onAction: AgentHomeDashboardProps['onAction'];
}) {
  const visualization = metric.visualization;
  if (!visualization || visualization.kind !== 'health-gauge') return null;

  const hasData = metric.numericValue !== null && visualization.signalCount > 0;
  const gaugeValue = metric.numericValue ?? 0;
  const reading = hasData ? metric.value.replace('%', '') : '—';
  const fallback = '—';
  const gap = visualization.gap === null
    ? fallback
    : `${visualization.gap >= 0 ? '+' : ''}${visualization.gap.toFixed(1)}`;

  return (
    <Card className="agent-home__metric-card agent-home__metric-card--health">
      <span>{metric.label}</span>
      <div
        className="agent-home__health-gauge"
        role="img"
        aria-label={`${metric.label} ${metric.value}. ${metric.scope}.`}
      >
        <svg viewBox="0 0 208 108" aria-hidden="true">
          <path
            className="agent-home__health-gauge-track"
            d="M 12 104 A 92 92 0 0 1 196 104"
            fill="none"
            pathLength="100"
          />
          {hasData && (
            <path
              className="agent-home__health-gauge-value"
              d="M 12 104 A 92 92 0 0 1 196 104"
              fill="none"
              pathLength="100"
              strokeDasharray={`${gaugeValue} 100`}
            />
          )}
        </svg>
        <span className="agent-home__health-gauge-reading" aria-hidden="true">
          <strong>{reading}</strong>
          {hasData && <span>%</span>}
        </span>
      </div>
      <span className="agent-home__health-gauge-scope">{metric.scope}</span>
      <dl className="agent-home__health-gauge-stats" aria-label="Aggregate health details">
        <div>
          <dt>Target</dt>
          <dd>{hasData ? `${visualization.target}%` : fallback}</dd>
        </div>
        <div>
          <dt>Gap</dt>
          <dd className={hasData && (visualization.gap ?? 0) >= 0 ? 'agent-home__health-stat--positive' : undefined}>
            {hasData ? gap : fallback}
          </dd>
        </div>
        <div>
          <dt>Signals</dt>
          <dd>{hasData ? visualization.signalCount : fallback}</dd>
        </div>
      </dl>
      <small>{metric.timeWindow} · {metric.freshness}</small>
      <MetricDrillDown metric={metric} onAction={onAction} />
    </Card>
  );
}

function AgentSessionBarsMetricCard({
  metric,
  onAction,
}: {
  metric: AgentHomeMetric;
  onAction: AgentHomeDashboardProps['onAction'];
}) {
  const visualization = metric.visualization;
  if (!visualization || visualization.kind !== 'agent-session-bars') return null;

  const largestAgentTotal = Math.max(1, ...visualization.agents.map(agent => agent.sessions));

  return (
    <Card className="agent-home__metric-card agent-home__metric-card--sessions">
      <span>{metric.label}</span>
      <div className="agent-home__session-total">
        <strong>{metric.value}</strong>
        <span>Total</span>
      </div>
      <ul className="agent-home__session-bars" aria-label="Sessions by agent">
        {visualization.agents.map(agent => (
          <li key={agent.agentId}>
            <div className="agent-home__session-bar-label">
              <span title={agent.name}>{agent.label}</span>
              <strong>
                {agent.sessions.toLocaleString()}
                <span className="sr-only"> sessions</span>
              </strong>
            </div>
            <div className="agent-home__session-bar-track" aria-hidden="true">
              <span style={{ width: `${(agent.sessions / largestAgentTotal) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <small>{metric.timeWindow} · {metric.freshness}</small>
      <MetricDrillDown metric={metric} onAction={onAction} />
    </Card>
  );
}

const formatCompactTokens = (value: number): string => {
  const millions = value / 1_000_000;
  return `${millions.toFixed(Number.isInteger(millions) ? 0 : 1)}M`;
};

const formatUsd = (value: number): string => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
}).format(value);

function TokenUsageMetricCard({
  metric,
  onAction,
}: {
  metric: AgentHomeMetric;
  onAction: AgentHomeDashboardProps['onAction'];
}) {
  const visualization = metric.visualization;
  if (!visualization || visualization.kind !== 'token-usage-donut') return null;

  const tokenSummary = `${formatCompactTokens(visualization.usedTokens)} / ${formatCompactTokens(visualization.tokenLimit)}`;
  const estimatedCost = formatUsd(visualization.estimatedCostUsd);

  return (
    <Card className="agent-home__metric-card agent-home__metric-card--usage">
      <div className="agent-home__usage-heading">
        <span>{metric.label}</span>
      </div>
      <div className="agent-home__usage-body">
        <div
          className="agent-home__usage-donut"
          role="img"
          aria-label={`${visualization.usagePercent}% of the simulated token budget used. ${tokenSummary} tokens. Estimated cost ${estimatedCost}.`}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle
              className="agent-home__usage-donut-track"
              cx="50"
              cy="50"
              r="40"
              pathLength="100"
            />
            <circle
              className="agent-home__usage-donut-value"
              cx="50"
              cy="50"
              r="40"
              pathLength="100"
              strokeDasharray={`${visualization.usagePercent} 100`}
            />
          </svg>
          <span className="agent-home__usage-donut-reading" aria-hidden="true">
            <strong>{visualization.usagePercent}</strong>
            <span>%</span>
          </span>
        </div>
        <dl className="agent-home__usage-stats">
          <div>
            <dt>Tokens</dt>
            <dd>{tokenSummary}</dd>
          </div>
          <div>
            <dt>Est. cost</dt>
            <dd>{estimatedCost}</dd>
          </div>
        </dl>
      </div>
      <small>{metric.timeWindow} · {metric.freshness}</small>
      <MetricDrillDown metric={metric} onAction={onAction} />
    </Card>
  );
}

function AttentionMetricCard({
  metric,
  expanded,
  onToggle,
}: {
  metric: AgentHomeMetric;
  expanded: boolean;
  onToggle: () => void;
}) {
  const actionable = (metric.numericValue ?? 0) > 0;

  return (
    <Card
      className={`agent-home__metric-card agent-home__metric-card--disclosure${actionable ? ' agent-home__metric-card--actionable' : ''}`}
      clickable
      selected={expanded}
      aria-label={`${metric.label}: ${metric.value}. ${metric.scope}. ${metric.timeWindow}. ${metric.freshness}. ${expanded ? 'Hide details' : 'View details'}.`}
      aria-expanded={expanded}
      aria-controls="agent-home-attention-detail"
      onClick={onToggle}
    >
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <span>{metric.scope}</span>
      <small>{metric.timeWindow} · {metric.freshness}</small>
      <span className="agent-home__metric-action" aria-hidden="true">
        {expanded ? 'Hide details' : 'View details'}
        <Icon name={expanded ? 'arrow-up' : 'arrow-down'} weight="bold" size="sm" />
      </span>
    </Card>
  );
}

function Metrics({
  snapshot,
  onAction,
  attentionOpen,
  onToggleAttention,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction'> & {
  attentionOpen: boolean;
  onToggleAttention: () => void;
}) {
  return (
    <section aria-labelledby="agent-home-metrics-title">
      <div className="agent-home__section-heading">
        <div>
          <h2 id="agent-home-metrics-title">Last 24 hours</h2>
        </div>
      </div>
      <div className="agent-home__metrics">
        {snapshot.metrics.map(metric => {
          if (metric.visualization?.kind === 'health-gauge') {
            return <HealthGaugeMetricCard key={metric.id} metric={metric} onAction={onAction} />;
          }

          if (metric.visualization?.kind === 'agent-session-bars') {
            return <AgentSessionBarsMetricCard key={metric.id} metric={metric} onAction={onAction} />;
          }

          if (metric.visualization?.kind === 'token-usage-donut') {
            return <TokenUsageMetricCard key={metric.id} metric={metric} onAction={onAction} />;
          }

          if (metric.id === 'needs-review') {
            return (
              <AttentionMetricCard
                key={metric.id}
                metric={metric}
                expanded={attentionOpen}
                onToggle={onToggleAttention}
              />
            );
          }

          return (
            <Card key={metric.id} className="agent-home__metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <span>{metric.scope}</span>
              <small>{metric.timeWindow} · {metric.freshness}</small>
              <MetricDrillDown metric={metric} onAction={onAction} />
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function RecurringFocusCardHeader({
  icon,
  title,
  titleId,
}: {
  icon: IconName;
  title: string;
  titleId: string;
}) {
  return (
    <>
      <div className="agent-home__focus-card-header">
        <span aria-hidden="true"><Icon name={icon} weight="regular" size={24} /></span>
        <h3 id={titleId}>{title}</h3>
      </div>
      <div className="agent-home__focus-card-divider" />
    </>
  );
}

function RecurringHealthCard({
  snapshot,
  onAction,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction'>) {
  const metric = snapshot.metrics.find(candidate => candidate.id === 'agent-health');
  const observabilityAction = metric?.drillDown
    ?? snapshot.actions.find(action => action.id === 'open-observability');
  const healthUnavailable = metric?.numericValue === null;

  return (
    <Card
      className="agent-home__focus-card agent-home__focus-card--health"
      aria-labelledby="agent-home-health-title"
    >
      <RecurringFocusCardHeader
        icon="multiline-chart"
        title="Glimpse of my agents health status (4)"
        titleId="agent-home-health-title"
      />
      <div className="agent-home__focus-card-body">
        <ul className="agent-home__focus-health-list" aria-label="Agent health status">
          {RECURRING_HEALTH_ROWS.map(row => {
            const value = healthUnavailable ? null : row.value;
            return (
              <li key={row.id}>
                <div className="agent-home__focus-progress-label">
                  <span>
                    {row.label}
                    {row.tone === 'warning' && (
                      <span className="agent-home__focus-warning" aria-label="Needs attention">
                        <Icon name="warning" weight="regular" size={16} />
                      </span>
                    )}
                  </span>
                  <strong>{value === null ? '—' : `${value.toFixed(1)}%`}</strong>
                </div>
                <div
                  className={`agent-home__focus-progress-track agent-home__focus-progress-track--${row.tone}`}
                  role="img"
                  aria-label={`${row.label}: ${value === null ? 'health unavailable' : `${value.toFixed(1)} percent`}`}
                >
                  <span style={{ width: `${value ?? 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="agent-home__focus-card-actions">
          {observabilityAction && (
            <button
              type="button"
              className="agent-home__focus-pill"
              onClick={() => onAction(observabilityAction)}
            >
              View Observability
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function RecurringSessionsCard({
  snapshot,
  onAction,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction'>) {
  const metric = snapshot.metrics.find(candidate => candidate.id === 'sessions');
  const hasActivity = snapshot.dataState.hasActivity && (metric?.numericValue ?? 0) > 0;
  const sessionAction = metric?.drillDown
    ?? snapshot.actions.find(action => action.id === 'open-observability');
  const allAgentsAction = snapshot.actions.find(action => action.id === 'open-agent-library');
  const largestTotal = RECURRING_SESSION_ROWS[0].sessions;

  return (
    <Card
      className="agent-home__focus-card agent-home__focus-card--sessions"
      aria-labelledby="agent-home-sessions-title"
    >
      <RecurringFocusCardHeader
        icon="donut-chart"
        title="Session usage across agents"
        titleId="agent-home-sessions-title"
      />
      <div className="agent-home__focus-card-body">
        <div className="agent-home__focus-session-total">
          <span>Total</span>
          <div>
            <strong>{hasActivity ? '3,079' : '0'}</strong>
            {hasActivity && <span>↑ +12%</span>}
          </div>
        </div>
        <ul className="agent-home__focus-session-list" aria-label="Sessions by agent">
          {RECURRING_SESSION_ROWS.map(row => {
            const sessions = hasActivity ? row.sessions : 0;
            return (
              <li key={row.id}>
                <div className="agent-home__focus-progress-label">
                  <span title={row.label}>{row.label}</span>
                  <strong>{sessions.toLocaleString()}</strong>
                </div>
                <div
                  className="agent-home__focus-progress-track agent-home__focus-progress-track--sessions"
                  role="img"
                  aria-label={`${row.label}: ${sessions.toLocaleString()} sessions`}
                >
                  <span style={{ width: `${(sessions / largestTotal) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="agent-home__focus-card-actions">
          {allAgentsAction && (
            <button
              type="button"
              className="agent-home__focus-pill"
              onClick={() => onAction(allAgentsAction)}
            >
              All agents
            </button>
          )}
          {sessionAction && (
            <button
              type="button"
              className="agent-home__focus-pill"
              onClick={() => onAction(sessionAction)}
            >
              View sessions
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function RecurringUsageCard({
  snapshot,
  onAction,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction'>) {
  const metric = snapshot.metrics.find(candidate => candidate.id === 'usage');
  const visualization = metric?.visualization?.kind === 'token-usage-donut'
    ? metric.visualization
    : null;
  const hasActivity = snapshot.dataState.hasActivity && (metric?.numericValue ?? 0) > 0;
  const percent = hasActivity ? visualization?.usagePercent ?? 0 : 0;
  const tokenSummary = visualization
    ? `${formatCompactTokens(hasActivity ? visualization.usedTokens : 0)} / ${formatCompactTokens(visualization.tokenLimit)}`
    : 'Usage unavailable';

  return (
    <Card
      className="agent-home__focus-card agent-home__focus-card--usage"
      clickable={Boolean(metric?.drillDown)}
      aria-label="Usage and billing. Open usage details."
      onClick={() => metric?.drillDown && onAction(metric.drillDown)}
    >
      <RecurringFocusCardHeader
        icon="diamond"
        title="Usage & billing"
        titleId="agent-home-usage-title"
      />
      <div className="agent-home__focus-usage-total" aria-labelledby="agent-home-usage-title">
        <div
          className="agent-home__focus-usage-donut"
          role="img"
          aria-label={`Total usage: ${percent}%, ${tokenSummary} tokens`}
        >
          <svg viewBox="0 0 112 112" aria-hidden="true">
            <circle className="agent-home__focus-usage-track" cx="56" cy="56" r="48" pathLength="100" />
            <circle
              className="agent-home__focus-usage-value"
              cx="56"
              cy="56"
              r="48"
              pathLength="100"
              stroke={RECURRING_TOTAL_USAGE_COLOR}
              strokeDasharray={`${percent} ${100 - percent}`}
            />
          </svg>
          <span aria-hidden="true"><strong>{percent}%</strong><small>Usage</small></span>
        </div>
        <div className="agent-home__focus-usage-copy">
          <span>Total usage</span>
          <strong>{tokenSummary}</strong>
          <small>Across all AI agents</small>
        </div>
      </div>
    </Card>
  );
}

function RecurringBuildAgentCard({
  onBrowseTemplates,
  onStartFromScratch,
}: {
  onBrowseTemplates: () => void;
  onStartFromScratch: () => void;
}) {
  return (
    <Card className="agent-home__focus-card agent-home__focus-card--build-agent">
      <RecurringFocusCardHeader
        icon="magic-pen"
        title="Build a new AI agent"
        titleId="agent-home-build-agent-title"
      />
      <div className="agent-home__focus-build-agent-body" aria-labelledby="agent-home-build-agent-title">
        <p>Start with a ready-made template or build from scratch.</p>
        <div className="agent-home__focus-card-actions">
          <button
            type="button"
            className="agent-home__focus-pill agent-home__focus-pill--ai"
            onClick={onBrowseTemplates}
          >
            Browse template
          </button>
          <button
            type="button"
            className="agent-home__focus-pill"
            onClick={onStartFromScratch}
          >
            From Scratch
          </button>
        </div>
      </div>
    </Card>
  );
}

function RecurringReviewCard({
  snapshot,
  onAction,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction'>) {
  const attentionItem = snapshot.attentionItems[0];
  const reviewSessionAction = attentionItem?.actions.find(action => action.id === 'review-session')
    ?? snapshot.actions.find(action => action.id === 'review-session');
  const recommendations = [
    {
      id: 'large-reservation',
      icon: 'alternate-response' as IconName,
      title: attentionItem?.title ?? 'Nothing needs review',
      description: attentionItem?.description
        ?? 'Current session signals are within their expected operating boundaries.',
      action: attentionItem ? reviewSessionAction : undefined,
      actionLabel: 'View Session',
    },
    {
      id: 'sharepoint-sync',
      icon: 'apps' as IconName,
      title: 'Recent Sharepoint sync failed',
      description: 'Engineering Wiki knowledge base sync failed, Review the content issues or adjust your settings...',
      action: VIEW_KNOWLEDGE_ACTION,
      actionLabel: 'View Knowledge',
    },
    {
      id: 'instruction-update',
      icon: 'document' as IconName,
      title: 'Alex updated the Instruction for VIP Reserva...',
      description: 'Updated handoff rules and adjusted agent goal',
      action: VIEW_INSTRUCTION_ACTION,
      actionLabel: 'View Instruction',
    },
    {
      id: 'action-update',
      icon: 'mcp' as IconName,
      title: 'Create ticket MCP has update version availab...',
      description: 'Salesforce released new version for actions',
      action: VIEW_ACTION_ACTION,
      actionLabel: 'View Action',
    },
  ];

  return (
    <Card
      id="agent-home-attention-detail"
      className="agent-home__focus-card agent-home__focus-card--review"
      role="region"
      aria-label="Recommended for review details"
    >
      <RecurringFocusCardHeader
        icon="checkbox-group"
        title="Recommended for review"
        titleId="agent-home-review-title"
      />
      <div className="agent-home__focus-review-body">
        <ol className="agent-home__focus-review-list" aria-labelledby="agent-home-review-title">
          {recommendations.map(item => (
            <li key={item.id}>
              <span className="agent-home__focus-review-icon" aria-hidden="true">
                <Icon name={item.icon} weight="regular" size={16} />
              </span>
              <div>
                <strong title={item.title}>{item.title}</strong>
                <p>{item.description}</p>
                {item.action && (
                  <button type="button" onClick={() => onAction(item.action)}>
                    {item.actionLabel}
                    <Icon name="arrow-right" weight="regular" size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

function WorkflowTimeline({
  snapshot,
  onOpenWorkflowActivity,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onOpenWorkflowActivity'>) {
  return (
    <div id="agent-home-workflow" className="agent-home__workflow" aria-label="Workflow activity">
      <div className="agent-home__workflow-heading">
        <div>
          <span className="agent-home__section-kicker">Connected workflow</span>
          <h3>From safe handoff to fulfillment</h3>
        </div>
        <Badge variant="info">3 agents</Badge>
      </div>
      <ol>
        {snapshot.workflowActivity.map(activity => (
          <li key={activity.id}>
            <span className="agent-home__workflow-marker" aria-hidden="true">
              <Icon name={WORKFLOW_ICON[activity.kind]} weight="bold" size="sm" />
            </span>
            <div>
              <div className="agent-home__workflow-item-heading">
                <strong>{activity.title}</strong>
                <time>{activity.timestamp}</time>
              </div>
              <p>{activity.description}</p>
              <button type="button" onClick={() => onOpenWorkflowActivity(activity)}>
                {activity.sessionId ? `Open ${activity.sessionId}` : 'Open activity'}
                <span aria-hidden="true"><Icon name="arrow-right" weight="bold" size="sm" /></span>
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Attention({
  snapshot,
  onAction,
  onOpenWorkflowActivity,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction' | 'onOpenWorkflowActivity'>) {
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const attentionItem = snapshot.attentionItems[0];

  if (!attentionItem) {
    return (
      <Card className="agent-home__all-clear-card">
        <span aria-hidden="true"><Icon name="check-circle" weight="bold" size="lg" /></span>
        <div><h2>Nothing needs review</h2><p>Current signals are within their expected operating boundaries.</p></div>
      </Card>
    );
  }

  const reviewAction = attentionItem.actions.find(action => action.id === 'review-session');

  return (
    <Card
      id="agent-home-attention-detail"
      className="agent-home__attention-card"
      role="region"
      aria-label="Recommended review details"
    >
      <div className="agent-home__attention-heading">
        <span className="agent-home__attention-icon" aria-hidden="true">
          <Icon name="shield" weight="bold" size="md" />
        </span>
        <div>
          <span className="agent-home__section-kicker">Recommended review</span>
          <h2>{attentionItem.title}</h2>
        </div>
        <Badge variant={statusBadgeVariant(attentionItem.statusTone)}>{attentionItem.statusLabel}</Badge>
      </div>
      <p>{attentionItem.description}</p>
      <dl className="agent-home__attention-meta">
        <div><dt>Agent</dt><dd>{attentionItem.agentName}</dd></div>
        <div><dt>Session</dt><dd>{attentionItem.sessionId}</dd></div>
        <div><dt>Priority</dt><dd>{attentionItem.severity === 'review' ? 'Review' : attentionItem.severity}</dd></div>
      </dl>
      <div className="agent-home__attention-actions">
        {reviewAction && (
          <Button variant="primary" size="sm" onClick={() => onAction(reviewAction)}>
            Review session
            <Icon name="arrow-right" weight="bold" size="sm" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={workflowOpen}
          aria-controls="agent-home-workflow"
          onClick={() => setWorkflowOpen(open => !open)}
        >
          {workflowOpen ? 'Hide workflow' : 'Watch workflow'}
          <Icon name={workflowOpen ? 'arrow-up' : 'arrow-down'} weight="bold" size="sm" />
        </Button>
      </div>
      {workflowOpen && snapshot.workflowActivity.length > 0 && (
        <WorkflowTimeline snapshot={snapshot} onOpenWorkflowActivity={onOpenWorkflowActivity} />
      )}
    </Card>
  );
}

function Fleet({
  snapshot,
  onAction,
  onOpenFleetAgent,
}: Pick<AgentHomeDashboardProps, 'snapshot' | 'onAction' | 'onOpenFleetAgent'>) {
  const observabilityAction = snapshot.actions.find(action => action.id === 'open-observability');

  if (snapshot.fleet.length === 0) return null;

  return (
    <section aria-labelledby="agent-home-fleet-title">
      <div className="agent-home__section-heading">
        <div>
          <h2 id="agent-home-fleet-title">Your agents</h2>
        </div>
        <div className="agent-home__section-actions">
          {observabilityAction && (
            <Button variant="secondary" size="sm" onClick={() => onAction(observabilityAction)}>
              Open observability
              <Icon name="multiline-chart" weight="bold" size="sm" />
            </Button>
          )}
        </div>
      </div>
      <div className="agent-home__fleet" role="list" aria-label="Published agent fleet">
        {snapshot.fleet.map(agent => (
          <Card key={agent.agentId} className="agent-home__fleet-row" role="listitem">
            <button className="agent-home__fleet-identity" type="button" onClick={() => onOpenFleetAgent(agent)}>
              <span aria-hidden="true">{agent.initials}</span>
              <span><strong>{agent.name}</strong><small>{agent.lastUpdate}</small></span>
            </button>
            <div><span>Lifecycle</span><strong>{agent.lifecycle.label}</strong></div>
            <div><span>Health</span><strong className="agent-home__healthy"><i aria-hidden="true" />{agent.health.label}</strong></div>
            <div><span>Activity</span><strong>{agent.activity.label}</strong></div>
            <div><span>Usage</span><strong>{agent.usage.sessions.toLocaleString()} sessions</strong></div>
            <div><span>Success</span><strong>{agent.usage.successRate === null ? '—' : `${agent.usage.successRate.toFixed(1)}%`}</strong></div>
            <button className="agent-home__fleet-open" type="button" onClick={() => onOpenFleetAgent(agent)} aria-label={`Open ${agent.name}`}>
              <Icon name="arrow-right" weight="bold" size="sm" />
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function RecurringHome(props: Pick<
  AgentHomeDashboardProps,
  'snapshot' | 'onAction' | 'onStartFromScratch' | 'onOpenFleetAgent' | 'onOpenWorkflowActivity'
> & {
  onBrowseTemplates: () => void;
}) {
  const { snapshot, onAction, onStartFromScratch, onBrowseTemplates } = props;

  if (snapshot.dataState.loading) {
    return (
      <div className="agent-home__loading">
        <Spinner size="large" aria-label="Loading agent activity" />
        <p>Refreshing agent activity…</p>
      </div>
    );
  }

  if (snapshot.dataState.permission === 'missing') {
    const requestAction = snapshot.actions.find(action => action.intent === 'request-access');
    return requestAction ? (
      <Card className="agent-home__permission-card">
        <div aria-hidden="true"><Icon name="secure-lock" weight="bold" size="lg" /></div>
        <div><h2>Agent operations access is required</h2><p>Request a monitoring role to view portfolio health and activity.</p></div>
        <Button variant="primary" onClick={() => onAction(requestAction)}>Request access</Button>
      </Card>
    ) : null;
  }

  return (
    <div className="agent-home__recurring">
      <section className="agent-home__focus" aria-labelledby="agent-home-focus-title">
        <div className="agent-home__focus-heading">
          <h2 id="agent-home-focus-title">Focus today</h2>
          <span>Last 24 hours</span>
        </div>
        <div className="agent-home__focus-grid">
          <div className="agent-home__focus-primary">
            <div className="agent-home__focus-top-cards">
              <RecurringHealthCard snapshot={snapshot} onAction={onAction} />
              <RecurringSessionsCard snapshot={snapshot} onAction={onAction} />
            </div>
            <div className="agent-home__focus-bottom-cards">
              <RecurringUsageCard snapshot={snapshot} onAction={onAction} />
              <RecurringBuildAgentCard
                onBrowseTemplates={onBrowseTemplates}
                onStartFromScratch={onStartFromScratch}
              />
            </div>
          </div>
          <RecurringReviewCard
            snapshot={snapshot}
            onAction={onAction}
          />
        </div>
      </section>
    </div>
  );
}

export default function AgentHomeDashboard({
  mode,
  creationAudience = 'first-time',
  showGreeting = true,
  onFirstTimeFlowChange,
  snapshot,
  onAction,
  onStartFromScratch,
  onUseTemplate,
  onSendDemoMessage,
  onOpenFleetAgent,
  onOpenWorkflowActivity,
  existingAgents = [],
}: AgentHomeDashboardProps) {
  const [firstTimeFlow, setFirstTimeFlow] = useState<AgentHomeFirstTimeFlow>('home');
  const scrollRegionRef = useRef<HTMLDivElement>(null);

  const changeFirstTimeFlow = useCallback((nextFlow: AgentHomeFirstTimeFlow) => {
    setFirstTimeFlow(nextFlow);
    onFirstTimeFlowChange?.(nextFlow);
  }, [onFirstTimeFlowChange]);

  useEffect(() => {
    changeFirstTimeFlow('home');
  }, [changeFirstTimeFlow, mode]);

  useEffect(() => {
    scrollRegionRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [firstTimeFlow, mode]);

  const figmaDisplayDate = 'March 31, 2026';
  const showingFirstTimeFlow = firstTimeFlow !== 'home';
  const showingFigmaFirstTimeHome = mode === 'first-time'
    && snapshot.dataState.permission !== 'missing';
  const showingFigmaRecurringHome = mode === 'recurring';
  const showingRecurringCreation = (mode === 'first-time' && creationAudience === 'recurring')
    || (mode === 'recurring' && showingFirstTimeFlow);

  const handleFirstTimeAction = (action: AgentHomeAction) => {
    if (action.intent === 'show-templates') {
      changeFirstTimeFlow('templates');
      return;
    }
    if (action.intent === 'try-demo') {
      changeFirstTimeFlow('demo-select');
      return;
    }
    onAction(action);
  };
  const createFromScratchAction = snapshot.actions.find(action => action.intent === 'start-intake');

  return (
    <section
      className={`agent-home agent-home--${mode}${showingRecurringCreation ? ' agent-home--recurring-create' : ''}${showingFirstTimeFlow ? ' agent-home--flow' : ''}`}
      aria-labelledby={showingFirstTimeFlow ? undefined : 'agent-home-title'}
      aria-label={showingFirstTimeFlow
        ? (showingRecurringCreation ? 'Create another agent' : 'First-time agent setup')
        : undefined}
    >
      <div ref={scrollRegionRef} className="agent-home__scroll-region">
        {showingFirstTimeFlow ? (
          <AgentHomeFirstTimeFlows
            flow={firstTimeFlow}
            onFlowChange={changeFirstTimeFlow}
            onCreateFromScratch={createFromScratchAction
              ? onStartFromScratch
              : undefined}
            onUseTemplate={onUseTemplate}
            onSendDemoMessage={onSendDemoMessage}
          />
        ) : (
          showingFigmaFirstTimeHome ? (
            <div className="agent-home__first-time-summary">
              {showGreeting && (
                <header className="agent-home__figma-greeting">
                  <div className="agent-home__figma-greeting-leading">
                    <span className="agent-home__figma-symbol" aria-hidden="true"><EvaHeroAnimation /></span>
                    <span className="agent-home__figma-greeting-name">{snapshot.header.eyebrow}</span>
                    <h1 id="agent-home-title" className="sr-only">{snapshot.header.eyebrow}</h1>
                  </div>
                  <div className="agent-home__figma-greeting-context">
                    <time dateTime="2026-03-31">{figmaDisplayDate}</time>
                    <strong>Today is International Coffee Day</strong>
                  </div>
                </header>
              )}
              <HomeNotices snapshot={snapshot} />
              <FirstTimeHome
                snapshot={snapshot}
                creationAudience={creationAudience}
                existingAgents={existingAgents}
                onAction={handleFirstTimeAction}
                onStartFromScratch={onStartFromScratch}
              />
            </div>
          ) : showingFigmaRecurringHome ? (
            <div className="agent-home__recurring-summary">
              {showGreeting && (
                <header className="agent-home__figma-greeting agent-home__figma-greeting--recurring">
                  <div className="agent-home__figma-greeting-leading">
                    <span className="agent-home__figma-symbol" aria-hidden="true"><EvaHeroAnimation /></span>
                    <span className="agent-home__figma-greeting-name">Hi Jackie</span>
                    <h1 id="agent-home-title" className="sr-only">Hi Jackie</h1>
                  </div>
                  <div className="agent-home__figma-greeting-context agent-home__figma-greeting-context--date-only">
                    <time dateTime="2026-03-31">{figmaDisplayDate}</time>
                  </div>
                </header>
              )}
              <HomeNotices snapshot={snapshot} />
              <RecurringHome
                snapshot={snapshot}
                onAction={onAction}
                onStartFromScratch={onStartFromScratch}
                onBrowseTemplates={() => changeFirstTimeFlow('templates')}
                onOpenFleetAgent={onOpenFleetAgent}
                onOpenWorkflowActivity={onOpenWorkflowActivity}
              />
            </div>
          ) : (
            <>
              <header className="agent-home__header">
                <div className="agent-home__identity">
                  <span className="agent-home__symbol" aria-hidden="true"><AiSymbol size={52} /></span>
                  <div>
                    <span className="agent-home__eyebrow">{snapshot.header.eyebrow}</span>
                    <h1 id="agent-home-title">{snapshot.header.title}</h1>
                    <p>{snapshot.header.description}</p>
                  </div>
                </div>
              </header>

              <HomeNotices snapshot={snapshot} />

              <FirstTimeHome
                snapshot={snapshot}
                creationAudience={creationAudience}
                existingAgents={existingAgents}
                onAction={handleFirstTimeAction}
                onStartFromScratch={onStartFromScratch}
              />
            </>
          )
        )}
      </div>

    </section>
  );
}
