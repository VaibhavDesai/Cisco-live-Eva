import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import { Card } from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
import Dropdown from '../../components/shared/Dropdown';
import { Banner } from '../../components/shared/Banner';
import { Icon } from '../../icons';
import {
  getCiscoLiveSessions,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  type CiscoLiveSession,
  type CiscoLiveSessionOutcome,
} from '../../demo/ciscoLiveDemo';

function outcomeVariant(outcome: CiscoLiveSessionOutcome) {
  if (outcome === 'Resolved') return 'success';
  if (outcome === 'Transferred') return 'success';
  return 'info';
}

function SessionDetail({
  session,
  backLabel,
  onBack,
  onReviewGuardrail,
}: {
  session: CiscoLiveSession;
  backLabel: string;
  onBack: () => void;
  onReviewGuardrail: () => void;
}) {
  return (
    <div className="agent-session-detail-page">
      <div className="agent-session-detail-topbar">
        <Button variant="tertiary" size="sm" onClick={onBack}>
          <Icon name="arrow-left" weight="bold" size="sm" />
          {backLabel}
        </Button>
        <span>Session details</span>
      </div>

      <header className="agent-session-detail-header">
        <div>
          <div className="agent-session-detail-title-row">
            <h1>{session.topic}</h1>
            <Badge variant={outcomeVariant(session.outcome)}>{session.outcome}</Badge>
            {session.guardrailTriggered && <Badge variant="warning">Guardrail triggered</Badge>}
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
            <Badge variant="default">{session.channel}</Badge>
          </div>

          <div className="agent-session-transcript" aria-label="Session conversation transcript">
            {session.transcript.length > 0 ? session.transcript.map((event) => {
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

          {session.guardrail ? (
            <Card className="agent-session-policy-card">
              <div className="agent-session-policy-card__header">
                <span aria-hidden="true"><Icon name="shield" weight="bold" size="md" /></span>
                <div>
                  <h2>{session.guardrail.name}</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="agent-session-policy-card__review"
                  onClick={onReviewGuardrail}
                >
                  Review guardrail
                </Button>
              </div>
              <dl className="agent-session-policy-list">
                <div><dt>Policy</dt><dd>{session.guardrail.policy}</dd></div>
                <div><dt>Detected</dt><dd>{session.guardrail.detected}</dd></div>
                <div><dt>Action</dt><dd>{session.guardrail.action}</dd></div>
              </dl>
            </Card>
          ) : (
            <Card className="agent-session-policy-card agent-session-policy-card--quiet">
              <Icon name="check-circle" weight="bold" size="md" />
              <div><h2>No policy intervention</h2><p>The session completed within the configured boundaries.</p></div>
            </Card>
          )}

          <Card className="agent-session-systems-card">
            <div className="agent-session-panel-heading">
              <div><h2>Connected systems</h2><p>Systems used in this session</p></div>
            </div>
            <ul>
              {session.connectedSystems.map((system) => (
                <li key={system}><Icon name="check-circle" weight="bold" size="sm" />{system}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function AgentSessions() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agents, currentAgent, selectAgent } = useApp();
  const sessionIdQuery = searchParams.get('sessionId')?.trim() ?? '';
  const sourceQuery = searchParams.get('source')?.trim() ?? '';
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [guardrailOnly, setGuardrailOnly] = useState(false);
  const [transfersOnly, setTransfersOnly] = useState(false);

  const agent = agentId ? agents[agentId] : undefined;

  useEffect(() => {
    if (agent && currentAgent?.id !== agent.id) {
      selectAgent(agent.id);
    }
  }, [agent, currentAgent?.id, selectAgent]);

  if (!agent) return <Navigate to="/agents" replace />;

  const agentSessions = getCiscoLiveSessions(agent.id);
  const sessions = agentSessions.length > 0 ? agentSessions : getCiscoLiveSessions(CISCO_LIVE_PRIMARY_AGENT_ID);
  const activeSession = sessionIdQuery
    ? sessions.find((session) => session.id.toLowerCase() === sessionIdQuery.toLowerCase())
    : undefined;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = !normalizedSearch || [session.id, session.customer, session.topic]
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesOutcome = outcomeFilter === 'all' || session.outcome.toLowerCase() === outcomeFilter;
    const matchesGuardrail = !guardrailOnly || session.guardrailTriggered;
    const matchesTransfer = !transfersOnly || session.transferred;
    return matchesSearch && matchesOutcome && matchesGuardrail && matchesTransfer;
  });

  const openSession = (sessionId: string) => {
    navigate(`/agents/${agent.id}/sessions?sessionId=${encodeURIComponent(sessionId)}&source=sessions`);
  };

  return (
    <div className="primary-content">
      <AgentHeader
        agent={agent}
        activeTab="sessions"
        showPublishButton={false}
        showTabs={false}
      />

      <div className={`agent-sessions-page${activeSession ? '' : ' secondary-content'}`}>
        {activeSession ? (
          <SessionDetail
            session={activeSession}
            backLabel={sourceQuery === 'observability' ? 'Back to agent overview' : 'All sessions'}
            onBack={() => navigate(
              sourceQuery === 'observability'
                ? `/agents/${agent.id}`
                : `/agents/${agent.id}/sessions`,
            )}
            onReviewGuardrail={() => navigate(`/agents/${agent.id}/configure?section=Security&tier=advanced`)}
          />
        ) : (
          <>
            <div className="agent-sessions-heading">
              <div>
                <h1>Sessions</h1>
                <p>Review interactions, handoffs, errors, and policy triggers for this agent.</p>
              </div>
              <Button variant="secondary" size="sm">
                <Icon name="refresh" weight="bold" size="sm" />
                Refresh
              </Button>
            </div>

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
