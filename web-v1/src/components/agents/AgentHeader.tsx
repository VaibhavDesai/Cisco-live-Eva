import { useNavigate } from 'react-router-dom';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import Tabs, { Tab } from '../shared/Tabs';
import { useApp } from '../../contexts/AppContext';

export default function AgentHeader({ agent, activeTab, showPublishButton = true, headerRight = null }) {
  const navigate = useNavigate();
  const { toggleAgentPublish, showToast, flowVersion, setFlowVersion } = useApp();

  const getBadgeVariant = (statusClass) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  const tabs = [
    { id: 'configure', label: 'Configuration', path: '/configure' },
    { id: 'sessions', label: 'Sessions', path: '/sessions' },
    { id: 'history', label: 'History', path: '/history' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' },
  ];

  const handlePublishToggle = () => {
    const action = agent.status === 'Published' ? 'unpublished' : 'published';
    toggleAgentPublish(agent.id);
    showToast(`Agent ${action} successfully`, 'success');
  };

  return (
    <>
      <div className="agent-header" style={{ marginBottom: '16px' }}>
        <div 
          className="agent-avatar" 
          style={{ background: agent.gradient }}
        >
          {agent.initials}
        </div>
        <div className="agent-info">
          <div className="agent-name-row">
            <span className="agent-name">{agent.name}</span>
            <Badge variant={getBadgeVariant(agent.statusClass)}>
              {agent.status}
            </Badge>
          </div>
          <div className="agent-meta">{agent.meta}</div>
        </div>
        <div className="action-flow-switcher" style={{ marginRight: '8px' }}>
          <button
            className={`action-flow-switcher-btn${flowVersion === 'v1' ? ' active' : ''}`}
            type="button"
            onClick={() => setFlowVersion('v1')}
          >
            V1
          </button>
          <button
            className={`action-flow-switcher-btn${flowVersion === 'v2' ? ' active' : ''}`}
            type="button"
            onClick={() => setFlowVersion('v2')}
          >
            V2
          </button>
        </div>
        {headerRight}
        {showPublishButton && (
          <Button 
            variant={agent.status === 'Published' ? 'secondary' : 'primary'}
            onClick={handlePublishToggle}
          >
            {agent.status === 'Published' ? 'Unpublish' : 'Publish'}
          </Button>
        )}
      </div>

      <Tabs variant="glass" aria-label="Agent navigation" style={{ marginBottom: '16px' }}>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => navigate(`/agents/${agent.id}${tab.path}`)}
          >
            {tab.label}
          </Tab>
        ))}
      </Tabs>
    </>
  );
}
