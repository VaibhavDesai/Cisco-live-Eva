import { useState } from 'react';
import Button from '../components/shared/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../components/shared/Card';
import Dropdown from '../components/shared/Dropdown';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/shared/Table';
import Badge from '../components/shared/Badge';

const CONNECTIONS = [
  { id: 1, name: 'Salesforce CRM', type: 'CRM', status: 'Connected', lastSync: '5 min ago' },
  { id: 2, name: 'Zendesk', type: 'Ticketing', status: 'Connected', lastSync: '10 min ago' },
  { id: 3, name: 'Slack', type: 'Messaging', status: 'Connected', lastSync: '2 min ago' },
  { id: 4, name: 'ServiceNow', type: 'ITSM', status: 'Disconnected', lastSync: '2 days ago' },
];

const AVAILABLE_INTEGRATIONS = [
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', logo: '☁️', description: 'Connect to Salesforce CRM for customer data sync and lead management', updated: '2 days ago' },
  { id: 'zendesk', name: 'Zendesk', category: 'Ticketing', logo: '🎫', description: 'Integrate with Zendesk for ticket management and customer support workflows', updated: '1 week ago' },
  { id: 'slack', name: 'Slack', category: 'Messaging', logo: '💬', description: 'Send notifications and enable conversational AI directly in Slack channels', updated: '3 days ago' },
  { id: 'teams', name: 'Microsoft Teams', category: 'Messaging', logo: '👥', description: 'Deploy AI agents to Microsoft Teams for enterprise collaboration', updated: '5 days ago' },
  { id: 'servicenow', name: 'ServiceNow', category: 'ITSM', logo: '⚙️', description: 'Automate IT service management with ServiceNow integration', updated: '1 week ago' },
  { id: 'jira', name: 'Jira', category: 'Project Management', logo: '📋', description: 'Create and manage Jira issues directly from AI agent conversations', updated: '4 days ago' },
];

export default function Connections() {
  const [activeTab, setActiveTab] = useState('connected');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Connections</h1>
          <p className="page-subtitle">Manage integrations and external services</p>
        </div>
        <Button>+ Add Connection</Button>
      </div>

      <div className="tabs" style={{ marginBottom: '24px' }}>
        <div 
          className={`tab ${activeTab === 'connected' ? 'active' : ''}`}
          onClick={() => setActiveTab('connected')}
        >
          Connected ({CONNECTIONS.filter(c => c.status === 'Connected').length})
        </div>
        <div 
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available
        </div>
      </div>

      <div className="secondary-content">
        {activeTab === 'connected' && (
          <>
            <div className="filter-bar">
              <input type="text" placeholder="Search connections..." />
              <Dropdown
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'crm', label: 'CRM' },
                  { value: 'ticketing', label: 'Ticketing' },
                  { value: 'messaging', label: 'Messaging' }
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Connection</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Last Sync</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {CONNECTIONS.map(conn => (
                  <TableRow key={conn.id}>
                    <TableCell><strong>{conn.name}</strong></TableCell>
                    <TableCell>{conn.type}</TableCell>
                    <TableCell>
                      <Badge variant={conn.status === 'Connected' ? 'success' : 'warning'}>
                        {conn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conn.lastSync}</TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {activeTab === 'available' && (
          <div className="grid grid-3" style={{ gap: '16px' }}>
            {AVAILABLE_INTEGRATIONS.map(integration => (
              <Card key={integration.id} className="connection-card">
                <CardHeader>
                  <div className="connection-card-logo">{integration.logo}</div>
                  <div className="card-header-text">
                    <span className="card-title">{integration.name}</span>
                    <span className="card-subtitle">{integration.category}</span>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="card-body-text">{integration.description}</p>
                </CardBody>
                <CardFooter>
                  <span className="connection-card-updated">Updated {integration.updated}</span>
                  <Button variant="secondary" size="sm">Connect</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
