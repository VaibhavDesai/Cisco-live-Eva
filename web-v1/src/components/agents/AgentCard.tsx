import Badge from '../shared/Badge';
import Button from '../shared/Button';

export default function AgentCard({ agent, onSelect, onConfigure }) {
  const getBadgeVariant = (statusClass) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  return (
    <div className="agent-card" onClick={onSelect}>
      <div className="agent-card-header">
        <div 
          className="agent-card-avatar" 
          style={{ background: agent.gradient }}
        >
          {agent.initials}
        </div>
        <div className="agent-card-info">
          <div className="agent-card-name">{agent.name}</div>
          <div className="agent-card-description">{agent.description}</div>
        </div>
      </div>
      <div className="agent-card-stats">
        <div className="agent-card-stat">
          <div className="agent-card-stat-value">{agent.sessions}</div>
          <div className="agent-card-stat-label">Sessions</div>
        </div>
        <div className="agent-card-stat">
          <div className="agent-card-stat-value">{agent.successRate}</div>
          <div className="agent-card-stat-label">Success Rate</div>
        </div>
      </div>
      <div className="agent-card-footer">
        <Badge variant={getBadgeVariant(agent.statusClass)}>
          {agent.status}
        </Badge>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
        >
          Configure
        </Button>
      </div>
    </div>
  );
}
