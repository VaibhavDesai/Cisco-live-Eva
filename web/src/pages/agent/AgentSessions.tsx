import { useState } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import { Card } from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
import Dropdown from '../../components/shared/Dropdown';

const RECENT_SESSIONS = [
  { id: 'SES-001', time: '2 min ago', messages: 8, duration: '4m 32s', outcome: 'Resolved' },
  { id: 'SES-002', time: '15 min ago', messages: 12, duration: '6m 18s', outcome: 'Transferred' },
  { id: 'SES-003', time: '32 min ago', messages: 5, duration: '2m 45s', outcome: 'Resolved' },
  { id: 'SES-004', time: '1 hour ago', messages: 15, duration: '8m 12s', outcome: 'Resolved' },
  { id: 'SES-005', time: '2 hours ago', messages: 3, duration: '1m 23s', outcome: 'Abandoned' },
];

export default function AgentSessions() {
  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const { agents, currentAgent, selectAgent } = useApp();
  const sessionIdQuery = searchParams.get('sessionId')?.trim() ?? '';
  const sourceQuery = searchParams.get('source')?.trim() ?? '';
  const [searchTerm, setSearchTerm] = useState(sessionIdQuery);
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  if (!currentAgent || currentAgent.id !== agentId) {
    const agent = agents[agentId];
    if (agent) {
      selectAgent(agentId);
    } else {
      return <Navigate to="/agents" replace />;
    }
  }

  const agent = currentAgent || agents[agentId];
  if (!agent) return <Navigate to="/agents" replace />;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = RECENT_SESSIONS.filter(session => {
    const matchesSearch = !normalizedSearch || session.id.toLowerCase().includes(normalizedSearch);
    const matchesOutcome = outcomeFilter === 'all' || session.outcome.toLowerCase() === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  return (
    <div className="primary-content">
      <AgentHeader agent={agent} activeTab="sessions" showPublishButton={false} />

      <div className="secondary-content">
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
            <TableBody empty={filteredSessions.length === 0} colSpan={5}>
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
      </div>
    </div>
  );
}
