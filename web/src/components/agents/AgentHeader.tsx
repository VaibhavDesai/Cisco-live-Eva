import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import Tabs, { Tab } from '../shared/Tabs';
import { useApp } from '../../contexts/AppContext';
import {
  getAgentDisplayType,
  getAgentDisplayTypeClass,
} from '../../features/agent-creation/agentDisplayType';

export default function AgentHeader({ agent, activeTab, showPublishButton = true, showTabs = true, headerRight = null, statusContent = null, children = null }) {
  const navigate = useNavigate();
  const { toggleAgentPublish, showToast } = useApp();
  const stickyRef = useRef(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const scrollRoot = el.closest('.primary-content');
    if (!scrollRoot) return;

    const syncStickyState = () => setIsStuck(scrollRoot.scrollTop > 0);
    syncStickyState();
    scrollRoot.addEventListener('scroll', syncStickyState, { passive: true });

    return () => scrollRoot.removeEventListener('scroll', syncStickyState);
  }, []);

  const getBadgeVariant = (statusClass) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  const tabs = [
    { id: 'configure', label: 'Configuration', path: '/configure' },
    { id: 'sessions', label: 'Sessions', path: '/sessions' },
    { id: 'analytics', label: 'Testing', path: '/analytics' },
    { id: 'history', label: 'History', path: '/history' },
  ];

  const handlePublishToggle = () => {
    const action = agent.status === 'Published' ? 'unpublished' : 'published';
    toggleAgentPublish(agent.id);
    showToast(`Agent ${action} successfully`, 'success');
  };

  return (
    <div ref={stickyRef} className={`agent-header-sticky${isStuck ? ' agent-header-stuck' : ''}`}>
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
            <Badge
              variant="default"
              className={`agent-type-badge ${getAgentDisplayTypeClass(getAgentDisplayType(agent))}`}
            >
              {getAgentDisplayType(agent)}
            </Badge>
            {statusContent ?? (
              <Badge variant={getBadgeVariant(agent.statusClass)}>
                {agent.status}
              </Badge>
            )}
          </div>
          <div className="agent-meta">{agent.meta}</div>
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

      {showTabs && (
        <Tabs variant="glass" aria-label="Agent navigation" style={{ marginBottom: children ? '16px' : '0' }}>
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
      )}

      {children}
    </div>
  );
}
