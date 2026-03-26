import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Button from '../components/shared/Button';
import { Card, CardTitle } from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/shared/Table';

export default function Dashboard() {
  const navigate = useNavigate();
  const { agents, setIsCreateModalOpen, selectAgent } = useApp();

  const agentList = Object.values(agents);

  const handleAgentClick = (agentId) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const getBadgeVariant = (statusClass) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  return (
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your AI agents and resources</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Create Agent</Button>
      </div>

      <div className="secondary-content">
        {/* Stats Grid */}
        <div className="grid grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Agents</div>
            <div className="stat-value">{agentList.length}</div>
            <div className="stat-change positive">↑ 2 this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Published</div>
            <div className="stat-value">{agentList.filter(a => a.status === 'Published').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sessions (7d)</div>
            <div className="stat-value">15,432</div>
            <div className="stat-change positive">↑ 12%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Success Rate</div>
            <div className="stat-value">94.2%</div>
            <div className="stat-change positive">↑ 2.1%</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-2">
          {/* Top Agents */}
          <Card>
            <div className="card-header">
              <CardTitle>Top Performing Agents</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => navigate('/agents')}>
                View All
              </Button>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Agent</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Sessions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {agentList.slice(0, 3).map(agent => (
                  <TableRow key={agent.id} onClick={() => handleAgentClick(agent.id)}>
                    <TableCell><strong>{agent.name}</strong></TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(agent.statusClass)}>{agent.status}</Badge>
                    </TableCell>
                    <TableCell>{agent.sessions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="card-header">
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Customer Support Bot updated</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>2 hours ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Sales Assistant published</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>5 hours ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>IT Support Agent created</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>1 day ago</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
