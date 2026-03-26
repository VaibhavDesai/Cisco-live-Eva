import { useParams, Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import { Card } from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';

const CHANGELOG = [
  {
    version: 'v2.4.0',
    status: 'Published',
    current: true,
    date: 'Jan 28, 2026, 3:45 PM',
    author: 'Sarah Chen',
    changes: [
      'Updated system prompt for better clarity',
      'Added new capability: Schedule Callback',
      'Fixed response formatting issue'
    ]
  },
  {
    version: 'v2.3.0',
    status: 'Previous',
    date: 'Jan 25, 2026, 11:20 AM',
    author: 'Marcus Developer',
    changes: [
      'Improved knowledge base integration',
      'Enhanced error handling'
    ]
  },
  {
    version: 'v2.2.0',
    status: 'Previous',
    date: 'Jan 20, 2026, 2:15 PM',
    author: 'Sarah Chen',
    changes: [
      'Added transfer to agent capability',
      'Updated response templates'
    ]
  },
];

export default function AgentHistory() {
  const { agentId } = useParams();
  const { agents, currentAgent, selectAgent } = useApp();

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

  return (
    <div className="primary-content">
      <AgentHeader agent={agent} activeTab="history" showPublishButton={false} />

      <div className="secondary-content">
        <Card style={{ padding: 0 }}>
          {CHANGELOG.map((entry, index) => (
            <div
              key={entry.version}
              className="changelog-entry"
              style={{
                borderBottom: index < CHANGELOG.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{entry.version}</span>
                    {entry.current && (
                      <>
                        <Badge variant="success">Published</Badge>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Published by {entry.author} • {entry.date}
                  </div>
                </div>
                <Button variant="secondary" size="sm">View Details</Button>
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {entry.changes.map((change, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{change}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
