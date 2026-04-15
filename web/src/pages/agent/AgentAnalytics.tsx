import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { Card, CardTitle } from '../../components/shared/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
import Dropdown from '../../components/shared/Dropdown';

const TOP_INTENTS = [
  { name: 'Order Status', count: 342, percentage: 28 },
  { name: 'Product Information', count: 256, percentage: 21 },
  { name: 'Return Request', count: 198, percentage: 16 },
  { name: 'Account Help', count: 167, percentage: 14 },
  { name: 'Technical Support', count: 134, percentage: 11 },
  { name: 'Other', count: 123, percentage: 10 },
];

const HOURLY_DATA = [
  { hour: '12am', sessions: 12 },
  { hour: '4am', sessions: 8 },
  { hour: '8am', sessions: 45 },
  { hour: '12pm', sessions: 78 },
  { hour: '4pm', sessions: 92 },
  { hour: '8pm', sessions: 56 },
];

const DAILY_TRENDS = [
  { day: 'Mon', sessions: 145, resolved: 128 },
  { day: 'Tue', sessions: 162, resolved: 148 },
  { day: 'Wed', sessions: 158, resolved: 142 },
  { day: 'Thu', sessions: 171, resolved: 156 },
  { day: 'Fri', sessions: 189, resolved: 172 },
  { day: 'Sat', sessions: 98, resolved: 89 },
  { day: 'Sun', sessions: 76, resolved: 71 },
];

const TEST_SCENARIOS = [
  { id: 1, name: 'Order Status Inquiry', status: 'passed', lastRun: '2 hours ago', duration: '1.2s' },
  { id: 2, name: 'Product Return Flow', status: 'passed', lastRun: '2 hours ago', duration: '2.8s' },
  { id: 3, name: 'Account Password Reset', status: 'failed', lastRun: '2 hours ago', duration: '0.9s' },
  { id: 4, name: 'Transfer to Human Agent', status: 'passed', lastRun: '2 hours ago', duration: '1.5s' },
  { id: 5, name: 'Multi-turn Conversation', status: 'passed', lastRun: '2 hours ago', duration: '4.2s' },
];

const RECENT_LOGS = [
  { id: 1, timestamp: '14:32:15', level: 'info', message: 'Session started: SES-001', source: 'SessionManager' },
  { id: 2, timestamp: '14:32:16', level: 'info', message: 'Intent detected: order_status (confidence: 0.94)', source: 'NLU' },
  { id: 3, timestamp: '14:32:17', level: 'info', message: 'Calling MCP: Customer Data Lookup', source: 'CapabilityEngine' },
  { id: 4, timestamp: '14:32:18', level: 'success', message: 'MCP response received (234ms)', source: 'CapabilityEngine' },
  { id: 5, timestamp: '14:32:19', level: 'info', message: 'Generating response...', source: 'ResponseGenerator' },
  { id: 6, timestamp: '14:32:20', level: 'success', message: 'Response sent to user', source: 'SessionManager' },
  { id: 7, timestamp: '14:32:45', level: 'warning', message: 'High latency detected: 850ms', source: 'PerformanceMonitor' },
  { id: 8, timestamp: '14:33:01', level: 'error', message: 'Knowledge base query timeout', source: 'KnowledgeEngine' },
];

export default function AgentAnalytics() {
  const { agentId } = useParams();
  const { agents, currentAgent, selectAgent } = useApp();
  const [activeSection, setActiveSection] = useState('analytics');
  const [logLevelFilter, setLogLevelFilter] = useState('all');

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
      <AgentHeader agent={agent} activeTab="analytics" showPublishButton={false}>
        <Tabs variant="line" aria-label="Analytics sections">
          <Tab active={activeSection === 'analytics'} onClick={() => setActiveSection('analytics')}>Analytics</Tab>
          <Tab active={activeSection === 'testing'} onClick={() => setActiveSection('testing')}>Testing</Tab>
        </Tabs>
      </AgentHeader>

      <div className="secondary-content">
        {activeSection === 'analytics' && (
          <>
            <div className="grid grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-label">Total Sessions</div>
                <div className="stat-value">1,234</div>
                <div className="stat-change positive">↑ 18% vs last month</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Resolution Rate</div>
                <div className="stat-value">87.2%</div>
                <div className="stat-change positive">↑ 3.4%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Handle Time</div>
                <div className="stat-value">4m 28s</div>
                <div className="stat-change positive">↓ 12s faster</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">CSAT Score</div>
                <div className="stat-value">4.6/5</div>
                <div className="stat-change positive">↑ 0.2</div>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '24px' }}>
              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Weekly Session Trend</CardTitle>
                <div className="analytics-chart">
                  {DAILY_TRENDS.map((day) => (
                    <div key={day.day} className="chart-bar-group">
                      <div className="chart-bars">
                        <div
                          className="chart-bar chart-bar-primary"
                          style={{ height: `${(day.sessions / 200) * 100}%` }}
                          title={`${day.sessions} sessions`}
                        />
                        <div
                          className="chart-bar chart-bar-secondary"
                          style={{ height: `${(day.resolved / 200) * 100}%` }}
                          title={`${day.resolved} resolved`}
                        />
                      </div>
                      <span className="chart-label">{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot primary"></span> Sessions</span>
                  <span className="legend-item"><span className="legend-dot secondary"></span> Resolved</span>
                </div>
              </Card>

              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Top Intents</CardTitle>
                <div className="analytics-list">
                  {TOP_INTENTS.map((intent, i) => (
                    <div key={intent.name} className="analytics-list-item">
                      <div className="analytics-list-info">
                        <span className="analytics-list-rank">#{i + 1}</span>
                        <span className="analytics-list-name">{intent.name}</span>
                      </div>
                      <div className="analytics-list-stats">
                        <div className="analytics-progress-bar">
                          <div
                            className="analytics-progress-fill"
                            style={{ width: `${intent.percentage}%` }}
                          />
                        </div>
                        <span className="analytics-list-count">{intent.count}</span>
                        <span className="analytics-list-percent">{intent.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-2">
              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Hourly Activity</CardTitle>
                <div className="analytics-chart hourly">
                  {HOURLY_DATA.map((hour) => (
                    <div key={hour.hour} className="chart-bar-group">
                      <div className="chart-bars">
                        <div
                          className="chart-bar chart-bar-accent"
                          style={{ height: `${(hour.sessions / 100) * 100}%` }}
                          title={`${hour.sessions} sessions`}
                        />
                      </div>
                      <span className="chart-label">{hour.hour}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Outcome Breakdown</CardTitle>
                <div className="outcome-breakdown">
                  <div className="outcome-item">
                    <div className="outcome-header">
                      <span className="outcome-dot resolved"></span>
                      <span className="outcome-label">Resolved</span>
                      <span className="outcome-value">876</span>
                    </div>
                    <div className="outcome-bar">
                      <div className="outcome-fill resolved" style={{ width: '71%' }}></div>
                    </div>
                    <span className="outcome-percent">71%</span>
                  </div>
                  <div className="outcome-item">
                    <div className="outcome-header">
                      <span className="outcome-dot transferred"></span>
                      <span className="outcome-label">Transferred</span>
                      <span className="outcome-value">234</span>
                    </div>
                    <div className="outcome-bar">
                      <div className="outcome-fill transferred" style={{ width: '19%' }}></div>
                    </div>
                    <span className="outcome-percent">19%</span>
                  </div>
                  <div className="outcome-item">
                    <div className="outcome-header">
                      <span className="outcome-dot abandoned"></span>
                      <span className="outcome-label">Abandoned</span>
                      <span className="outcome-value">124</span>
                    </div>
                    <div className="outcome-bar">
                      <div className="outcome-fill abandoned" style={{ width: '10%' }}></div>
                    </div>
                    <span className="outcome-percent">10%</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {activeSection === 'testing' && (
          <>
            <div className="grid grid-2" style={{ marginBottom: '24px' }}>
              <Card style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                <CardTitle style={{ marginBottom: '16px' }}>Test Chat</CardTitle>
                <div className="test-chat-container">
                  <div className="test-chat-messages">
                    <div className="test-message user">
                      <div className="test-message-content">What's the status of my order #12345?</div>
                    </div>
                    <div className="test-message agent">
                      <div className="test-message-content">
                        I'd be happy to help you check the status of order #12345. Let me look that up for you.
                        <br /><br />
                        Your order is currently <strong>Out for Delivery</strong> and is expected to arrive today by 5:00 PM.
                      </div>
                      <div className="test-message-meta">
                        <span className="test-meta-item">⚡ Customer Data Lookup</span>
                        <span className="test-meta-item">🎯 Intent: order_status (0.94)</span>
                        <span className="test-meta-item">⏱️ 1.2s</span>
                      </div>
                    </div>
                  </div>
                  <div className="test-chat-input">
                    <input type="text" placeholder="Type a test message..." />
                    <button className="test-send-btn">Send</button>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <CardTitle>Test Scenarios</CardTitle>
                  <button className="test-run-all-btn">▶ Run All</button>
                </div>
                <div className="test-scenarios-list">
                  {TEST_SCENARIOS.map(scenario => (
                    <div key={scenario.id} className="test-scenario-item">
                      <div className="test-scenario-status">
                        <span className={`test-status-dot ${scenario.status}`}></span>
                      </div>
                      <div className="test-scenario-info">
                        <div className="test-scenario-name">{scenario.name}</div>
                        <div className="test-scenario-meta">
                          Last run {scenario.lastRun} · {scenario.duration}
                        </div>
                      </div>
                      <button className="test-scenario-run">▶</button>
                    </div>
                  ))}
                </div>
                <button className="test-add-scenario-btn">+ Add Test Scenario</button>
              </Card>
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <CardTitle>Logs</CardTitle>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Levels' },
                      { value: 'info', label: 'Info' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'error', label: 'Error' }
                    ]}
                    value={logLevelFilter}
                    onChange={setLogLevelFilter}
                  />
                  <button className="log-clear-btn">Clear</button>
                </div>
              </div>
              <div className="logs-container">
                {RECENT_LOGS.map(log => (
                  <div key={log.id} className={`log-entry log-${log.level}`}>
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                    <span className="log-source">[{log.source}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
