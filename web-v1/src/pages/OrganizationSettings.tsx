import { useState } from 'react';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import { Card, CardTitle } from '../components/shared/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/shared/Table';
import Badge from '../components/shared/Badge';

const TEAM_MEMBERS = [
  { id: 1, name: 'Sarah Admin', email: 'sarah@acme.com', initials: 'SA', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', role: 'Admin', status: 'Active', lastActive: '2 minutes ago' },
  { id: 2, name: 'Marcus Developer', email: 'marcus@acme.com', initials: 'MD', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)', role: 'Developer', status: 'Active', lastActive: '1 hour ago' },
  { id: 3, name: 'Jennifer Viewer', email: 'jennifer@acme.com', initials: 'JV', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', role: 'Viewer', status: 'Active', lastActive: '3 hours ago' },
  { id: 4, name: 'Tom Newman', email: 'tom@acme.com', initials: 'TN', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', role: 'Developer', status: 'Offline', lastActive: '2 days ago' },
  { id: 5, name: 'alex@acme.com', email: 'alex@acme.com', initials: '?', gradient: 'var(--border-color)', role: 'Developer', status: 'Pending', lastActive: '—', invited: 'Jan 25, 2026' },
];

const API_KEYS = [
  { id: 1, name: 'Production API Key', key: 'sk_live_****************************a1b2', created: 'Jan 15, 2026', lastUsed: '2 minutes ago', status: 'Active' },
  { id: 2, name: 'Development API Key', key: 'sk_test_****************************c3d4', created: 'Jan 10, 2026', lastUsed: '1 hour ago', status: 'Active' },
  { id: 3, name: 'Staging Environment', key: 'sk_test_****************************e5f6', created: 'Dec 20, 2025', lastUsed: '3 days ago', status: 'Active' },
];

const AUDIT_LOGS = [
  { id: 1, action: 'API Key Created', user: 'Sarah Admin', timestamp: 'Jan 15, 2026, 2:30 PM', ip: '192.168.1.100' },
  { id: 2, action: 'Team Member Invited', user: 'Sarah Admin', timestamp: 'Jan 14, 2026, 11:15 AM', ip: '192.168.1.100' },
  { id: 3, action: 'Agent Published', user: 'Marcus Developer', timestamp: 'Jan 13, 2026, 4:45 PM', ip: '192.168.1.102' },
  { id: 4, action: 'Password Changed', user: 'Jennifer Viewer', timestamp: 'Jan 12, 2026, 9:00 AM', ip: '192.168.1.105' },
  { id: 5, action: 'Login from new device', user: 'Tom Newman', timestamp: 'Jan 10, 2026, 3:20 PM', ip: '10.0.0.55' },
];

export default function OrganizationSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const [timezone, setTimezone] = useState('pt');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'team', label: 'Team Members' },
    { id: 'api', label: 'API Keys' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
  ];

  return (
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Manage your organization preferences and team</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '24px' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeSection === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* General Section */}
      {activeSection === 'general' && (
        <div className="secondary-content">
          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Organization Details</CardTitle>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Organization Name
              </label>
              <input 
                type="text" 
                defaultValue="Renergize Healthcare" 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }} 
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Organization ID
              </label>
              <div style={{ 
                padding: '10px 14px', 
                background: 'var(--bg-primary)', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontFamily: 'monospace', 
                color: 'var(--text-secondary)' 
              }}>
                org_renergize_hc_8f2a
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Dropdown
                label="Default Timezone"
                options={[
                  { value: 'pt', label: 'Pacific Time (PT)' },
                  { value: 'et', label: 'Eastern Time (ET)' },
                  { value: 'utc', label: 'UTC' }
                ]}
                value={timezone}
                onChange={setTimezone}
              />
            </div>
            <Button>Save Changes</Button>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Notifications</CardTitle>
            <div className="settings-notification-list">
              <div className="settings-notification-item">
                <div className="settings-notification-info">
                  <div className="settings-notification-title">Email Notifications</div>
                  <div className="settings-notification-desc">Receive alerts via email</div>
                </div>
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-checkmark"></span>
                </label>
              </div>
              <div className="settings-notification-item">
                <div className="settings-notification-info">
                  <div className="settings-notification-title">Weekly Reports</div>
                  <div className="settings-notification-desc">Get weekly usage summaries</div>
                </div>
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-checkmark"></span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Team Members Section */}
      {activeSection === 'team' && (
        <div className="secondary-content">
          <div className="filter-bar" style={{ marginBottom: '16px' }}>
            <input type="text" placeholder="Search team members..." />
            <Dropdown
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'developer', label: 'Developer' },
                { value: 'viewer', label: 'Viewer' }
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
            />
            <Button style={{ marginLeft: 'auto' }}>+ Invite Member</Button>
          </div>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>User</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Last Active</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {TEAM_MEMBERS.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: member.gradient, 
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: member.initials === '?' ? 'var(--text-secondary)' : 'var(--color-theme-common-text-primary-normal)',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {member.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{member.invited ? member.email : member.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {member.invited ? `Invited ${member.invited}` : member.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'Admin' ? 'info' : member.role === 'Developer' ? 'success' : 'warning'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ 
                      color: member.status === 'Active' ? 'var(--success-color)' : 
                             member.status === 'Pending' ? 'var(--warning-color)' : 'var(--text-muted)'
                    }}>
                      ● {member.status}
                    </span>
                  </TableCell>
                  <TableCell>{member.lastActive}</TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm">
                      {member.status === 'Pending' ? 'Resend' : 'Edit'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* API Keys Section */}
      {activeSection === 'api' && (
        <div className="secondary-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                Use API keys to authenticate requests to the AI Agent API.
              </p>
            </div>
            <Button>+ Create API Key</Button>
          </div>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>API Key</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Last Used</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {API_KEYS.map(apiKey => (
                <TableRow key={apiKey.id}>
                  <TableCell><strong>{apiKey.name}</strong></TableCell>
                  <TableCell>
                    <code style={{ 
                      background: 'var(--bg-primary)', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      {apiKey.key}
                    </code>
                  </TableCell>
                  <TableCell>{apiKey.created}</TableCell>
                  <TableCell>{apiKey.lastUsed}</TableCell>
                  <TableCell>
                    <Badge variant="success">{apiKey.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" size="sm">Copy</Button>
                      <Button variant="secondary" size="sm" style={{ color: 'var(--danger-color)' }}>Revoke</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '12px' }}>API Usage</CardTitle>
            <div className="api-usage-stats">
              <div className="api-usage-stat">
                <span className="api-usage-value">24,521</span>
                <span className="api-usage-label">Requests this month</span>
              </div>
              <div className="api-usage-stat">
                <span className="api-usage-value">50,000</span>
                <span className="api-usage-label">Monthly limit</span>
              </div>
              <div className="api-usage-stat">
                <span className="api-usage-value">49%</span>
                <span className="api-usage-label">Usage</span>
              </div>
            </div>
            <div className="api-usage-bar">
              <div className="api-usage-fill" style={{ width: '49%' }}></div>
            </div>
          </Card>
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="secondary-content">
          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Two-Factor Authentication</CardTitle>
            <div className="settings-notification-item" style={{ paddingTop: 0 }}>
              <div className="settings-notification-info">
                <div className="settings-notification-title">Enable 2FA</div>
                <div className="settings-notification-desc">Add an extra layer of security to your account</div>
              </div>
              <Button variant="secondary">Enable</Button>
            </div>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Session Management</CardTitle>
            <div className="settings-notification-list">
              <div className="settings-notification-item">
                <div className="settings-notification-info">
                  <div className="settings-notification-title">Session Timeout</div>
                  <div className="settings-notification-desc">Automatically log out after inactivity</div>
                </div>
                <Dropdown
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '240', label: '4 hours' },
                    { value: '1440', label: '24 hours' }
                  ]}
                  value={sessionTimeout}
                  onChange={setSessionTimeout}
                />
              </div>
              <div className="settings-notification-item">
                <div className="settings-notification-info">
                  <div className="settings-notification-title">Active Sessions</div>
                  <div className="settings-notification-desc">You have 2 active sessions</div>
                </div>
                <Button variant="secondary" size="sm">Manage</Button>
              </div>
            </div>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Audit Log</CardTitle>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>IP Address</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {AUDIT_LOGS.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <code style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.ip}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Billing Section */}
      {activeSection === 'billing' && (
        <div className="secondary-content">
          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Current Plan</CardTitle>
            <div className="billing-plan">
              <div className="billing-plan-info">
                <div className="billing-plan-name">Pro Plan</div>
                <div className="billing-plan-price">$99<span>/month</span></div>
                <div className="billing-plan-features">
                  <div>✓ Unlimited agents</div>
                  <div>✓ 50,000 API requests/month</div>
                  <div>✓ Priority support</div>
                  <div>✓ Advanced analytics</div>
                </div>
              </div>
              <div className="billing-plan-actions">
                <Button variant="secondary">Change Plan</Button>
              </div>
            </div>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '20px' }}>Usage This Month</CardTitle>
            <div className="usage-list">
              <div className="usage-item">
                <div className="usage-header">
                  <span className="usage-label">Sessions</span>
                  <span className="usage-value">15,432 / Unlimited</span>
                </div>
                <div className="usage-bar">
                  <div className="usage-fill sessions" style={{ width: '55%' }}></div>
                </div>
              </div>
              <div className="usage-item">
                <div className="usage-header">
                  <span className="usage-label">API Calls</span>
                  <span className="usage-value">127,892 / Unlimited</span>
                </div>
                <div className="usage-bar">
                  <div className="usage-fill api" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="usage-item">
                <div className="usage-header">
                  <span className="usage-label">Knowledge Storage</span>
                  <span className="usage-value">2.4 GB / 50 GB</span>
                </div>
                <div className="usage-bar">
                  <div className="usage-fill storage" style={{ width: '4.8%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Payment Method</CardTitle>
            <div className="payment-method">
              <div className="payment-card">
                <div className="payment-card-icon">💳</div>
                <div className="payment-card-info">
                  <div className="payment-card-type">Visa ending in 4242</div>
                  <div className="payment-card-exp">Expires 12/2027</div>
                </div>
                <Badge variant="success">Default</Badge>
              </div>
              <Button variant="secondary" size="sm">Update</Button>
            </div>
          </Card>

          <div className="section-divider"></div>

          <Card>
            <CardTitle style={{ marginBottom: '16px' }}>Billing History</CardTitle>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Invoice</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>INV-2026-001</strong></TableCell>
                  <TableCell>Jan 1, 2026</TableCell>
                  <TableCell>$99.00</TableCell>
                  <TableCell><Badge variant="success">Paid</Badge></TableCell>
                  <TableCell><Button variant="secondary" size="sm">Download</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>INV-2025-012</strong></TableCell>
                  <TableCell>Dec 1, 2025</TableCell>
                  <TableCell>$99.00</TableCell>
                  <TableCell><Badge variant="success">Paid</Badge></TableCell>
                  <TableCell><Button variant="secondary" size="sm">Download</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>INV-2025-011</strong></TableCell>
                  <TableCell>Nov 1, 2025</TableCell>
                  <TableCell>$99.00</TableCell>
                  <TableCell><Badge variant="success">Paid</Badge></TableCell>
                  <TableCell><Button variant="secondary" size="sm">Download</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
