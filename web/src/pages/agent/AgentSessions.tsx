import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import { Card } from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
import Dropdown from '../../components/shared/Dropdown';
import Button from '../../components/shared/Button';
import { Icon } from '../../icons';

const RECENT_SESSIONS = [
  { id: 'SES-001', time: '2 min ago', messages: 8, duration: '4m 32s', outcome: 'Resolved' },
  { id: 'SES-002', time: '15 min ago', messages: 12, duration: '6m 18s', outcome: 'Transferred' },
  { id: 'SES-003', time: '32 min ago', messages: 5, duration: '2m 45s', outcome: 'Resolved' },
  { id: 'SES-004', time: '1 hour ago', messages: 15, duration: '8m 12s', outcome: 'Resolved' },
  { id: 'SES-005', time: '2 hours ago', messages: 3, duration: '1m 23s', outcome: 'Abandoned' },
];

const SESSION_DETAIL_COPY: Record<string, {
  topic: string;
  customer: string;
  summary: string;
  startedAt: string;
  channel: string;
  transcript: Array<{ speaker: string; time: string; text: string; kind?: 'system' }>;
}> = {
  'SES-002': {
    topic: 'Order change routed to a specialist',
    customer: 'Kristin M.',
    summary: 'The agent gathered the order context, recognized that the address change required human review, and transferred the customer with a summary attached.',
    startedAt: 'Today, 9:36 AM',
    channel: 'Voice',
    transcript: [
      { speaker: 'Customer', time: '9:36 AM', text: 'I need to change the delivery address for an order that is already on the way.' },
      { speaker: 'Order Management Agent', time: '9:37 AM', text: 'I can help gather the order details. I will confirm what can be changed before making any promise.' },
      { speaker: 'Customer', time: '9:39 AM', text: 'The carrier says the address is locked. Can someone review it?' },
      { speaker: 'Handoff', time: '9:42 AM', text: 'Transferred to an order specialist with the order context and conversation summary attached.', kind: 'system' },
    ],
  },
};

export default function AgentSessions() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agents, agentDrafts, currentAgent, selectAgent } = useApp();
  const sessionIdQuery = searchParams.get('sessionId')?.trim() ?? '';
  const sourceQuery = searchParams.get('source')?.trim() ?? '';
  const [searchTerm, setSearchTerm] = useState(sessionIdQuery);
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const agent = agentId ? agents[agentId] : undefined;

  useEffect(() => {
    if (agentId && agent && currentAgent?.id !== agentId) {
      selectAgent(agentId);
    }
  }, [agent, agentId, currentAgent?.id, selectAgent]);

  if (!agent) return <Navigate to="/agents" replace />;

  const isNewAgentWithoutSessions = Boolean(
    agentId && agentDrafts[agentId] && (!agent.sessions || agent.sessions === '—'),
  );
  const showingObservabilityDemo = sourceQuery === 'observability';
  const hasSessionDataset = !isNewAgentWithoutSessions || showingObservabilityDemo;
  const availableSessions = hasSessionDataset ? RECENT_SESSIONS : [];
  const activeSession = sessionIdQuery
    ? availableSessions.find(session => session.id.toLowerCase() === sessionIdQuery.toLowerCase())
    : undefined;
  const activeSessionDetail = activeSession ? SESSION_DETAIL_COPY[activeSession.id] : undefined;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = availableSessions.filter(session => {
    const matchesSearch = !normalizedSearch || session.id.toLowerCase().includes(normalizedSearch);
    const matchesOutcome = outcomeFilter === 'all' || session.outcome.toLowerCase() === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  return (
    <div className="primary-content">
      <AgentHeader agent={agent} activeTab="sessions" showPublishButton={false} />

      <div className={`secondary-content${activeSession ? ' agent-session-detail-page' : ''}`}>
        {activeSession ? (
          <>
            <div className="agent-session-detail-topbar">
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => navigate(
                  sourceQuery === 'observability'
                    ? `/agents/${agent.id}/studio`
                    : `/agents/${agent.id}/sessions`,
                )}
              >
                <Icon name="arrow-left" weight="bold" size="sm" />
                {sourceQuery === 'observability' ? 'Back to agent overview' : 'All sessions'}
              </Button>
              <span>Session details</span>
            </div>

            <header className="agent-session-detail-header">
              <div>
                <div className="agent-session-detail-title-row">
                  <h1>{activeSessionDetail?.topic ?? `Session ${activeSession.id}`}</h1>
                  <Badge variant={activeSession.outcome === 'Transferred' ? 'success' : 'info'}>
                    {activeSession.outcome}
                  </Badge>
                </div>
                <p>{activeSessionDetail?.summary ?? 'Review the interaction outcome and transcript.'}</p>
              </div>
            </header>

            <div className="agent-session-detail-grid">
              <Card className="agent-session-detail-card agent-session-transcript-card">
                <div className="agent-session-panel-heading">
                  <div>
                    <h2>Conversation transcript</h2>
                    <p>{activeSession.messages} messages · {activeSession.duration}</p>
                  </div>
                  <Badge variant="default">{activeSessionDetail?.channel ?? 'Voice'}</Badge>
                </div>
                <div className="agent-session-transcript" role="log" aria-label="Session conversation transcript">
                  {(activeSessionDetail?.transcript ?? []).map(event => (
                    <article
                      key={`${event.time}-${event.speaker}`}
                      className={event.kind === 'system' ? 'agent-session-transcript-event agent-session-transcript-event--system' : 'agent-session-transcript-event'}
                    >
                      <div>
                        <strong>{event.speaker}</strong>
                        <time>{event.time}</time>
                      </div>
                      <p>{event.text}</p>
                    </article>
                  ))}
                </div>
              </Card>

              <Card className="agent-session-detail-card agent-session-metadata-card">
                <div className="agent-session-panel-heading">
                  <div>
                    <h2>Session metadata</h2>
                    <p>Captured from the interaction</p>
                  </div>
                </div>
                <dl className="agent-session-metadata-list">
                  <div><dt>Session ID</dt><dd>{activeSession.id}</dd></div>
                  <div><dt>Customer</dt><dd>{activeSessionDetail?.customer ?? 'Customer'}</dd></div>
                  <div><dt>Started</dt><dd>{activeSessionDetail?.startedAt ?? activeSession.time}</dd></div>
                  <div><dt>Channel</dt><dd>{activeSessionDetail?.channel ?? 'Voice'}</dd></div>
                  <div><dt>Outcome</dt><dd>{activeSession.outcome}</dd></div>
                </dl>
              </Card>
            </div>
          </>
        ) : (
        <Card>
          {sourceQuery === 'preview' && (
            <div className="agent-sessions-preview-callout">
              <div>
                <strong>Preview interaction</strong>
                <p>
                  {sessionIdQuery
                    ? `Showing the session lookup for ${sessionIdQuery}. Metadata appears here once the preview is ingested.`
                    : 'Showing sessions after your preview. Metadata appears here once the preview is ingested.'}
                </p>
              </div>
              {sessionIdQuery && <Badge variant="info">{sessionIdQuery}</Badge>}
            </div>
          )}
          {showingObservabilityDemo && (
            <div className="agent-sessions-preview-callout">
              <div>
                <strong>Observability session</strong>
                <p>
                  {sessionIdQuery
                    ? `Showing ${sessionIdQuery} from the same dashboard demo dataset used in Agent Studio.`
                    : 'Showing the dashboard demo sessions available from Agent Studio.'}
                </p>
              </div>
              {sessionIdQuery && <Badge variant="info">{sessionIdQuery}</Badge>}
            </div>
          )}
          <div className="filter-bar agent-sessions-filter-bar">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            <Dropdown
              options={[
                { value: 'all', label: 'All Outcomes' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'transferred', label: 'Transferred' },
                { value: 'abandoned', label: 'Abandoned' }
              ]}
              value={outcomeFilter}
              onChange={setOutcomeFilter}
            />
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Session ID</TableHeader>
                <TableHeader>Time</TableHeader>
                <TableHeader>Messages</TableHeader>
                <TableHeader>Duration</TableHeader>
                <TableHeader>Outcome</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody
              empty={filteredSessions.length === 0}
              emptyTitle={hasSessionDataset ? 'No matching sessions' : 'No sessions yet'}
              emptyDescription={
                hasSessionDataset
                  ? 'Try changing your search or outcome filter.'
                  : 'Sessions will appear here after the deployed agent begins receiving traffic.'
              }
              colSpan={5}
            >
              {filteredSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell><strong>{session.id}</strong></TableCell>
                  <TableCell>{session.time}</TableCell>
                  <TableCell>{session.messages}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>
                    <span style={{
                      color: session.outcome === 'Resolved' ? 'var(--success-color)' :
                             session.outcome === 'Transferred' ? 'var(--accent-color)' : 'var(--warning-color)'
                    }}>
                      {session.outcome}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        )}
      </div>
    </div>
  );
}
