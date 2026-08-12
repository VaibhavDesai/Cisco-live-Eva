import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader, AgentWorkspacePageHeading } from '../../components/agents';
import { Card } from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
import Dropdown from '../../components/shared/Dropdown';
import { Banner } from '../../components/shared/Banner';
import ConfigurationCategoryIcon from '../../components/shared/ConfigurationCategoryIcon';
import { Icon } from '../../icons';
import {
  getCiscoLiveSessions,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  type CiscoLiveActionControlDecision,
  type CiscoLiveSession,
  type CiscoLiveSessionOutcome,
} from '../../demo/ciscoLiveDemo';

function outcomeVariant(outcome: CiscoLiveSessionOutcome) {
  if (outcome === 'Resolved') return 'success';
  if (outcome === 'Transferred') return 'success';
  return 'info';
}

function actionControlTimingLabel(timing: 'pre_tool' | 'post_tool') {
  return timing === 'pre_tool' ? 'Before action runs (pre-tool)' : 'After action returns (post-action)';
}

function actionControlBehaviorLabel(behavior: 'observe' | 'steer' | 'deny') {
  return behavior.charAt(0).toUpperCase() + behavior.slice(1);
}

function actionControlDecisionLabel(actionControl: CiscoLiveActionControlDecision): string {
  if (actionControl.timing === 'post_tool' && actionControl.toolExecuted) {
    if (!actionControl.matched) return `${actionControl.actionName} completed · Standard path continued`;
    if (actionControl.result === 'steered') return `${actionControl.actionName} completed · Next path steered`;
    if (actionControl.result === 'denied') return `${actionControl.actionName} completed · Next step stopped`;
    return `${actionControl.actionName} completed · Match observed`;
  }
  return actionControl.toolExecuted
    ? `${actionControl.actionName} continued`
    : `${actionControl.actionName} skipped`;
}

function getSessionActionControlDecision(session: CiscoLiveSession): CiscoLiveActionControlDecision | null {
  const decisions = session.transcript.flatMap(event => (
    event.kind === 'action_control' && event.actionControl ? [event.actionControl] : []
  ));
  return decisions.find(decision => decision.matched) ?? decisions[0] ?? null;
}

function sessionHasMatchedActionControl(session: CiscoLiveSession): boolean {
  return session.transcript.some(event => (
    event.kind === 'action_control' && Boolean(event.actionControl?.matched)
  ));
}

function actionControlEvidenceLabel(decision: CiscoLiveActionControlDecision) {
  const evidence = decision.evidence.find(item => {
    if (item.operator !== 'greater_than' && item.operator !== 'less_than') return false;
    return typeof item.actual === 'number'
      && typeof item.expected === 'number'
      && (item.operator === 'less_than' ? item.actual < item.expected : item.actual > item.expected);
  }) ?? decision.evidence[0];
  if (!evidence) return 'No matching evidence recorded';

  const formatValue = (value: number | string | string[]) => {
    if (Array.isArray(value)) return value.join(', ');
    return typeof value === 'number' ? value.toLocaleString() : value;
  };
  const expected = formatValue(evidence.expected);
  const actual = formatValue(evidence.actual);
  const operator = evidence.operator === 'greater_than'
    ? '>'
    : evidence.operator === 'less_than'
      ? '<'
    : evidence.operator === 'equals'
      ? '='
      : 'is one of';

  return (
    <>
      <code className="galileo-action-control-summary__variable" translate="no">
        {`{{${evidence.field}}}`}
      </code>
      {` ${actual} ${operator} ${expected}`}
    </>
  );
}

function actionControlTimeWindowLabel(decision: CiscoLiveActionControlDecision) {
  const evidence = decision.timeWindowEvidence;
  if (!evidence) return null;
  const formatTime = (value: string) => {
    const [hourValue, minuteValue] = value.split(':').map(Number);
    if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return value;
    const displayHour = hourValue % 12 || 12;
    return `${displayHour}:${String(minuteValue).padStart(2, '0')} ${hourValue >= 12 ? 'PM' : 'AM'}`;
  };
  return (
    <>
      <code className="galileo-action-control-summary__variable" translate="no">
        {'{{event_time}}'}
      </code>
      {` ${evidence.actual} falls between ${formatTime(evidence.expected.start)} and ${formatTime(evidence.expected.end)}`}
    </>
  );
}

function SessionDetail({
  session,
  backLabel,
  onBack,
  onReviewGuardrail,
  onReviewActionControl,
}: {
  session: CiscoLiveSession;
  backLabel: string;
  onBack: () => void;
  onReviewGuardrail: (guardrailId: string) => void;
  onReviewActionControl: () => void;
}) {
  const actionControl = getSessionActionControlDecision(session);
  const actionControlResultLabel = !actionControl?.matched
    ? 'Conditions not matched'
    : actionControl.result === 'steered'
      ? 'Steered to the configured action'
      : actionControl.result === 'denied'
        ? 'Action denied'
        : 'Observed';

  return (
    <div className="agent-session-detail-page">
      <div className="agent-session-detail-topbar">
        <Button variant="tertiary" size="sm" onClick={onBack}>
          <Icon name="arrow-left" weight="bold" size="sm" />
          {backLabel}
        </Button>
      </div>

      <header className="agent-session-detail-header">
        <div>
          <div className="agent-session-detail-title-row">
            <h1>{session.id}</h1>
            <Badge
              variant={outcomeVariant(session.outcome)}
              className="agent-session-chip agent-session-chip--action"
            >
              <ConfigurationCategoryIcon type="action" />
              {session.outcome}
            </Badge>
          </div>
          <p>{session.summary}</p>
        </div>
      </header>

      <div className="agent-session-detail-grid">
        <Card className="agent-session-transcript-card">
          <div className="agent-session-panel-heading">
            <div>
              <h2>Conversation transcript</h2>
              <p>{session.messages} messages • {session.duration}</p>
            </div>
            <Badge variant="default" className="agent-session-chip">{session.channel}</Badge>
          </div>

          <div className="agent-session-transcript" aria-label="Session conversation transcript">
            {session.transcript.length > 0 ? session.transcript.map((event) => {
              if (event.kind === 'action_control') {
                return (
                  <Banner
                    key={event.id}
                    type="info"
                    icon="automation"
                    title={`${event.title} · ${event.time}`}
                    subtitle={(
                      <span className="agent-session-guardrail-banner__body">
                        <span>{event.text}</span>
                        {event.detail && (
                          <span className="agent-session-guardrail-banner__detail">{event.detail}</span>
                        )}
                      </span>
                    )}
                    dismissable={false}
                    className="agent-session-action-control-banner"
                  />
                );
              }

              if (event.kind === 'guardrail') {
                return (
                  <Banner
                    key={event.id}
                    type="warning"
                    icon="shield"
                    title={`${event.title} · ${event.time}`}
                    subtitle={(
                      <span className="agent-session-guardrail-banner__body">
                        <span>{event.text}</span>
                        {event.detail && (
                          <span className="agent-session-guardrail-banner__detail">{event.detail}</span>
                        )}
                      </span>
                    )}
                    dismissable={false}
                    className="agent-session-guardrail-banner"
                  />
                );
              }

              if (event.kind === 'system' || event.kind === 'handoff') {
                return (
                  <article key={event.id} className={`agent-session-system-event agent-session-system-event--${event.kind}`}>
                    <span aria-hidden="true">
                      <Icon name={event.kind === 'handoff' ? 'headset' : 'check-circle'} weight="bold" size="sm" />
                    </span>
                    <div>
                      <div className="agent-session-event-meta">
                        <strong>{event.title ?? event.speaker}</strong>
                        <time>{event.time}</time>
                      </div>
                      <p>{event.text}</p>
                    </div>
                  </article>
                );
              }

              return (
                <article key={event.id} className={`agent-session-message agent-session-message--${event.kind}`}>
                  <div className="agent-session-message__meta">
                    <strong>{event.speaker}</strong>
                    <time>{event.time}</time>
                  </div>
                  <p>{event.text}</p>
                  {event.annotations && event.annotations.length > 0 && (
                    <div className="agent-session-message__annotations" aria-label="Message evidence">
                      {event.annotations.map((annotation) => (
                        <span
                          key={`${event.id}-${annotation.kind}-${annotation.label}`}
                          className={`agent-session-message__annotation agent-session-message__annotation--${annotation.kind}`}
                        >
                          <ConfigurationCategoryIcon
                            type={annotation.kind === 'memory'
                              ? 'memory'
                              : annotation.kind === 'integration'
                                ? 'action'
                                : 'guardrail'}
                          />
                          {annotation.label}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            }) : (
              <div className="agent-session-transcript-empty">
                <Icon name="transcript" weight="regular" size="lg" />
                <strong>Session summary</strong>
                <p>{session.summary}</p>
              </div>
            )}
          </div>
        </Card>

        <aside className="agent-session-detail-sidebar" aria-label="Session metadata and policy evaluation">
          <Card className="agent-session-metadata-card">
            <div className="agent-session-panel-heading">
              <div>
                <h2>Session metadata</h2>
                <p>Captured from the live interaction</p>
              </div>
            </div>
            <dl className="agent-session-metadata-list">
              <div><dt>Session ID</dt><dd>{session.id}</dd></div>
              <div><dt>Consumer</dt><dd>{session.customer}</dd></div>
              <div><dt>Consumer ID</dt><dd>{session.consumerId}</dd></div>
              <div><dt>Started</dt><dd>{session.startedAt}</dd></div>
              <div><dt>Channel</dt><dd>{session.channel}</dd></div>
              <div><dt>Outcome</dt><dd>{session.outcome}</dd></div>
            </dl>
          </Card>

          {actionControl && (
            <Card className="agent-session-policy-card agent-session-policy-card--action-control">
              <div className="agent-session-policy-card__header">
                <ConfigurationCategoryIcon type="action-control" size={20} />
                <div>
                  <h2>{actionControl.unlockedActionNames[0] ?? actionControl.controlTitle}</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="agent-session-policy-card__review"
                  onClick={onReviewActionControl}
                >
                  Review control
                </Button>
              </div>
              <dl className="agent-session-policy-list">
                <div><dt>Attached action</dt><dd>{actionControl.actionName}</dd></div>
                <div><dt>Timing</dt><dd>{actionControlTimingLabel(actionControl.timing)}</dd></div>
                <div><dt>Behavior</dt><dd>{actionControlBehaviorLabel(actionControl.behavior)}</dd></div>
                <div><dt>Evaluated input</dt><dd>{actionControlEvidenceLabel(actionControl)}</dd></div>
                {actionControl.timeWindowEvidence && (
                  <div><dt>Event time</dt><dd>{actionControlTimeWindowLabel(actionControl)}</dd></div>
                )}
                <div><dt>Decision</dt><dd>{actionControlDecisionLabel(actionControl)}</dd></div>
                <div><dt>Unlocked action</dt><dd>{actionControl.unlockedActionNames.join(', ') || 'None'}</dd></div>
                <div><dt>Result</dt><dd>{actionControlResultLabel}</dd></div>
              </dl>
            </Card>
          )}

          {session.guardrail && (
            <Card className="agent-session-policy-card">
              <div className="agent-session-policy-card__header">
                <ConfigurationCategoryIcon type="guardrail" size={20} />
                <div>
                  <h2>{session.guardrail.name}</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="agent-session-policy-card__review"
                  onClick={() => onReviewGuardrail(session.guardrail!.id)}
                >
                  Review guardrail
                </Button>
              </div>
              <dl className="agent-session-policy-list">
                <div><dt>Policy</dt><dd>{session.guardrail.policy}</dd></div>
                <div><dt>Detected</dt><dd>{session.guardrail.detected}</dd></div>
                <div><dt>Action</dt><dd>{session.guardrail.action}</dd></div>
                <div><dt>Result</dt><dd>{session.guardrail.result}</dd></div>
              </dl>
            </Card>
          )}

          {!actionControl && !session.guardrail && (
            <Card className="agent-session-policy-card agent-session-policy-card--quiet">
              <Icon name="check-circle" weight="bold" size="md" />
              <div><h2>No policy intervention</h2><p>The session completed within the configured boundaries.</p></div>
            </Card>
          )}

        </aside>
      </div>
    </div>
  );
}

export default function AgentSessions() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agents, agentDrafts, currentAgent, selectAgent } = useApp();
  const sessionIdQuery = searchParams.get('sessionId')?.trim() ?? '';
  const sourceQuery = searchParams.get('source')?.trim() ?? '';
  const canonicalSessionId = sessionIdQuery.toLowerCase() === 'ses-gt-1045'
    ? 'SES-GT-1042'
    : sessionIdQuery;
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [guardrailOnly, setGuardrailOnly] = useState(false);
  const [actionControlOnly, setActionControlOnly] = useState(false);
  const [transfersOnly, setTransfersOnly] = useState(false);

  const agent = agentId ? agents[agentId] : undefined;

  useEffect(() => {
    if (agent && currentAgent?.id !== agent.id) {
      selectAgent(agent.id);
    }
  }, [agent, currentAgent?.id, selectAgent]);

  if (!agent) return <Navigate to="/agents" replace />;
  if (sessionIdQuery.toLowerCase() === 'ses-gt-1045') {
    return (
      <Navigate
        to={`/agents/${encodeURIComponent(agent.id)}/sessions?sessionId=SES-GT-1042&source=${encodeURIComponent(sourceQuery || 'sessions')}`}
        replace
      />
    );
  }

  const actionValues = agentDrafts[agent.id]?.familyConfiguration.actions?.values;
  const agentSessions = getCiscoLiveSessions(agent.id, actionValues);
  const sessions = agentSessions.length > 0 ? agentSessions : getCiscoLiveSessions(CISCO_LIVE_PRIMARY_AGENT_ID);
  const activeSession = canonicalSessionId
    ? sessions.find((session) => session.id.toLowerCase() === canonicalSessionId.toLowerCase())
    : undefined;
  const sessionBackNavigation = sourceQuery === 'observability'
    ? {
        label: 'Back to observability',
        path: `/observability?agent=${encodeURIComponent(agent.name)}`,
      }
    : sourceQuery === 'overview'
      ? {
          label: 'Back to overview',
          path: `/agents/${encodeURIComponent(agent.id)}`,
        }
      : {
          label: 'All sessions',
          path: `/agents/${encodeURIComponent(agent.id)}/sessions`,
        };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = !normalizedSearch || [session.id, session.customer, session.topic]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesOutcome = outcomeFilter === 'all' || session.outcome.toLowerCase() === outcomeFilter;
    const matchesGuardrail = !guardrailOnly || session.guardrailTriggered;
    const matchesActionControl = !actionControlOnly || sessionHasMatchedActionControl(session);
    const matchesTransfer = !transfersOnly || session.transferred;
    return matchesSearch && matchesOutcome && matchesGuardrail && matchesActionControl && matchesTransfer;
  });

  const openSession = (sessionId: string) => {
    navigate(`/agents/${agent.id}/sessions?sessionId=${encodeURIComponent(sessionId)}&source=sessions`);
  };

  return (
    <div className="primary-content agent-workspace-page">
      <AgentHeader
        agent={agent}
        activeTab="sessions"
        showPublishButton={false}
        showTabs={false}
      />

      {!activeSession && (
        <AgentWorkspacePageHeading
          title="Sessions"
          description="Review interactions, handoffs, errors, guardrail events, and agent control decisions for this agent."
          actions={(
            <Button variant="secondary" size="sm">
              <Icon name="refresh" weight="bold" size="sm" />
              Refresh
            </Button>
          )}
        />
      )}

      <div className={`agent-sessions-page${activeSession ? '' : ' secondary-content'}`}>
        {activeSession ? (
          <SessionDetail
            session={activeSession}
            backLabel={sessionBackNavigation.label}
            onBack={() => navigate(sessionBackNavigation.path)}
            onReviewGuardrail={(guardrailId) => navigate(
              `/agents/${agent.id}/configure?section=Security&tier=advanced&guardrailId=${encodeURIComponent(guardrailId)}`,
            )}
            onReviewActionControl={() => navigate(
              `/agents/${agent.id}/configure?section=Action`,
            )}
          />
        ) : (
          <>
            {sourceQuery === 'observability' && (
              <div className="agent-sessions-preview-callout">
                <div>
                  <strong>Opened from operational status</strong>
                  <p>The session linked to the latest policy event is highlighted.</p>
                </div>
                <Badge variant="info">Agent 360</Badge>
              </div>
            )}

            <div className="agent-sessions-layout">
              <Card className="agent-sessions-filter-card">
                <h2>Refine results</h2>
                <label className="agent-sessions-filter-field">
                  <span>Search</span>
                  <div className="agent-sessions-search-input">
                    <Icon name="search" weight="regular" size="sm" />
                    <input
                      type="search"
                      placeholder="Session ID, customer, or topic"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </label>
                <label className="agent-sessions-filter-field">
                  <span>Outcome</span>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All outcomes' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'transferred', label: 'Transferred' },
                      { value: 'in progress', label: 'In progress' },
                    ]}
                    value={outcomeFilter}
                    onChange={setOutcomeFilter}
                  />
                </label>
                <fieldset className="agent-sessions-metadata-filters">
                  <legend>Metadata</legend>
                  <label>
                    <input type="checkbox" checked={guardrailOnly} onChange={(event) => setGuardrailOnly(event.target.checked)} />
                    <span>Guardrail triggered</span>
                  </label>
                  <label>
                    <input type="checkbox" checked={actionControlOnly} onChange={(event) => setActionControlOnly(event.target.checked)} />
                    <span>Agent control matched</span>
                  </label>
                  <label>
                    <input type="checkbox" checked={transfersOnly} onChange={(event) => setTransfersOnly(event.target.checked)} />
                    <span>Human transfer</span>
                  </label>
                </fieldset>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setOutcomeFilter('all');
                    setGuardrailOnly(false);
                    setActionControlOnly(false);
                    setTransfersOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              </Card>

              <Card className="agent-sessions-table-card">
                <div className="agent-sessions-table-heading">
                  <div><h2>Recent sessions</h2><p>{filteredSessions.length} of {sessions.length} sessions</p></div>
                </div>
                <Table className="agent-sessions-table" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Channel</TableHeader>
                      <TableHeader>Session ID</TableHeader>
                      <TableHeader>Customer</TableHeader>
                      <TableHeader>Messages</TableHeader>
                      <TableHeader>Updated</TableHeader>
                      <TableHeader>Outcome</TableHeader>
                      <TableHeader>Metadata</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody
                    empty={filteredSessions.length === 0}
                    emptyTitle="No sessions found"
                    emptyDescription="Change or clear the filters to see more sessions."
                    colSpan={7}
                  >
                    {filteredSessions.map((session) => (
                      <TableRow
                        key={session.id}
                        onClick={() => openSession(session.id)}
                        selected={sourceQuery === 'observability' && session.id === sessionIdQuery}
                      >
                        <TableCell><span className="agent-session-channel"><Icon name={session.channel === 'Voice' ? 'phone' : 'chat'} weight="regular" size="sm" />{session.channel}</span></TableCell>
                        <TableCell><strong>{session.id}</strong><small>{session.topic}</small></TableCell>
                        <TableCell>{session.customer}</TableCell>
                        <TableCell>{session.messages}</TableCell>
                        <TableCell>{session.updated}</TableCell>
                        <TableCell><Badge variant={outcomeVariant(session.outcome)}>{session.outcome}</Badge></TableCell>
                        <TableCell>
                          <span className="agent-session-metadata-icons">
                            {sessionHasMatchedActionControl(session) && (
                              <span className="agent-session-metadata-icons__action-control" title="Agent control matched">
                                <Icon name="automation" weight="bold" size="sm" />
                              </span>
                            )}
                            {session.guardrailTriggered && <span title="Guardrail triggered"><Icon name="shield" weight="bold" size="sm" /></span>}
                            {session.transferred && <span title="Human transfer"><Icon name="headset" weight="bold" size="sm" /></span>}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
