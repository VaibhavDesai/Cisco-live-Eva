import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import { Card, CardTitle } from '../components/shared/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/shared/Table';
import Badge from '../components/shared/Badge';

const KNOWLEDGE_BASES = {
  1: { 
    id: 1, 
    name: 'Customer Support KB', 
    description: 'Knowledge base for customer support agents containing product documentation, FAQs, and support articles.',
    sources: [
      { id: 1, name: 'Product Documentation', type: 'Website', articles: 2847, status: 'Active', lastSync: '1 hour ago' },
      { id: 2, name: 'FAQ Database', type: 'Database', articles: 156, status: 'Active', lastSync: '3 hours ago' },
      { id: 3, name: 'Support Articles', type: 'Website', articles: 1234, status: 'Active', lastSync: '2 hours ago' },
    ],
    totalArticles: 4237,
    agents: ['Customer Support Agent', 'Website Chat Bot', 'Email Assistant'],
    lastUpdated: '2 hours ago',
    createdAt: 'Jan 15, 2026'
  },
  2: { 
    id: 2, 
    name: 'Technical Support KB', 
    description: 'Technical documentation and troubleshooting guides for IT support team.',
    sources: [
      { id: 4, name: 'API Documentation', type: 'Website', articles: 423, status: 'Active', lastSync: '5 hours ago' },
      { id: 5, name: 'Internal Wiki', type: 'Confluence', articles: 892, status: 'Syncing', lastSync: 'In progress' },
    ],
    totalArticles: 1315,
    agents: ['Tech Support Bot', 'Developer Assistant'],
    lastUpdated: '4 hours ago',
    createdAt: 'Jan 10, 2026'
  },
  3: { 
    id: 3, 
    name: 'Sales Enablement KB', 
    description: 'Product information and competitive analysis for sales team.',
    sources: [
      { id: 1, name: 'Product Documentation', type: 'Website', articles: 2847, status: 'Active', lastSync: '1 hour ago' },
      { id: 6, name: 'Training Materials', type: 'PDF', articles: 89, status: 'Active', lastSync: '1 day ago' },
    ],
    totalArticles: 2936,
    agents: ['Sales Assistant'],
    lastUpdated: '1 day ago',
    createdAt: 'Jan 5, 2026'
  },
};

const RECENT_QUERIES = [
  { id: 1, query: 'How do I reset my password?', matches: 12, avgScore: 0.94, time: '2 min ago' },
  { id: 2, query: 'Return policy for electronics', matches: 8, avgScore: 0.89, time: '5 min ago' },
  { id: 3, query: 'Shipping times to Canada', matches: 5, avgScore: 0.87, time: '12 min ago' },
  { id: 4, query: 'Product warranty information', matches: 15, avgScore: 0.92, time: '18 min ago' },
  { id: 5, query: 'How to track my order', matches: 9, avgScore: 0.91, time: '25 min ago' },
];

const TOP_ARTICLES = [
  { id: 1, title: 'Getting Started Guide', source: 'Product Documentation', views: 1234, helpful: 94 },
  { id: 2, title: 'Password Reset Instructions', source: 'FAQ Database', views: 987, helpful: 91 },
  { id: 3, title: 'Return & Refund Policy', source: 'Support Articles', views: 876, helpful: 88 },
  { id: 4, title: 'Shipping Information', source: 'FAQ Database', views: 654, helpful: 92 },
  { id: 5, title: 'Account Settings Overview', source: 'Product Documentation', views: 543, helpful: 89 },
];

export default function KnowledgeBaseDetail() {
  const { kbId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  const kb = KNOWLEDGE_BASES[kbId];
  
  const sourceOptions = useMemo(() => {
    if (!kb) return [];
    return [
      { value: 'all', label: 'All Sources' },
      ...kb.sources.map(s => ({ value: String(s.id), label: s.name }))
    ];
  }, [kb]);
  
  if (!kb) {
    return (
      <div className="primary-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Knowledge Base Not Found</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate('/knowledge')}>← Back to Knowledge</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="primary-content">
      {/* Header */}
      <div className="kb-detail-header">
        <button className="back-link" onClick={() => navigate('/knowledge')}>
          ← Back to Knowledge
        </button>
        <div className="kb-detail-title-row">
          <div className="kb-detail-icon">📚</div>
          <div className="kb-detail-info">
            <h1 className="kb-detail-name">{kb.name}</h1>
            <p className="kb-detail-description">{kb.description}</p>
          </div>
          <div className="kb-detail-actions">
            <Button variant="secondary">Sync All Sources</Button>
            <Button>Edit Knowledge Base</Button>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="subtabs">
        <div 
          className={`subtab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </div>
        <div 
          className={`subtab ${activeSection === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveSection('sources')}
        >
          Sources
        </div>
        <div 
          className={`subtab ${activeSection === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveSection('articles')}
        >
          Articles
        </div>
        <div 
          className={`subtab ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          Analytics
        </div>
      </div>

      <div className="secondary-content">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-label">Total Articles</div>
                <div className="stat-value">{kb.totalArticles.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Sources</div>
                <div className="stat-value">{kb.sources.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Connected Agents</div>
                <div className="stat-value">{kb.agents.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Match Score</div>
                <div className="stat-value">0.91</div>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '24px' }}>
              {/* Connected Agents */}
              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Connected Agents</CardTitle>
                <div className="kb-agents-list">
                  {kb.agents.map((agent, i) => (
                    <div key={i} className="kb-agent-item">
                      <div className="kb-agent-avatar">🤖</div>
                      <div className="kb-agent-info">
                        <div className="kb-agent-name">{agent}</div>
                        <div className="kb-agent-status">Active</div>
                      </div>
                      <Button variant="secondary" size="sm">View</Button>
                    </div>
                  ))}
                </div>
                <button className="test-add-scenario-btn" style={{ marginTop: '12px' }}>+ Connect Agent</button>
              </Card>

              {/* Recent Queries */}
              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Recent Queries</CardTitle>
                <div className="kb-queries-list">
                  {RECENT_QUERIES.slice(0, 5).map(query => (
                    <div key={query.id} className="kb-query-item">
                      <div className="kb-query-text">"{query.query}"</div>
                      <div className="kb-query-meta">
                        <span>{query.matches} matches</span>
                        <span>Score: {query.avgScore}</span>
                        <span>{query.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card>
              <CardTitle style={{ marginBottom: '16px' }}>Details</CardTitle>
              <div className="kb-details-grid">
                <div className="kb-detail-row">
                  <span className="kb-detail-label">Created</span>
                  <span className="kb-detail-value">{kb.createdAt}</span>
                </div>
                <div className="kb-detail-row">
                  <span className="kb-detail-label">Last Updated</span>
                  <span className="kb-detail-value">{kb.lastUpdated}</span>
                </div>
                <div className="kb-detail-row">
                  <span className="kb-detail-label">Embedding Model</span>
                  <span className="kb-detail-value">text-embedding-3-large</span>
                </div>
                <div className="kb-detail-row">
                  <span className="kb-detail-label">Chunk Size</span>
                  <span className="kb-detail-value">512 tokens</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Sources Section */}
        {activeSection === 'sources' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                <input type="text" placeholder="Search sources..." />
              </div>
              <Button>+ Add Source</Button>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Source</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Articles</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Last Sync</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {kb.sources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell><strong>{source.name}</strong></TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell>{source.articles.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={source.status === 'Active' ? 'success' : 'warning'}>
                        {source.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.lastSync}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" size="sm">Sync</Button>
                        <Button variant="secondary" size="sm">Remove</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Articles Section */}
        {activeSection === 'articles' && (
          <>
            <div className="filter-bar">
              <input type="text" placeholder="Search articles..." />
              <Dropdown
                options={sourceOptions}
                value={sourceFilter}
                onChange={setSourceFilter}
              />
            </div>

            <Card>
              <CardTitle style={{ marginBottom: '16px' }}>Top Articles</CardTitle>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Article</TableHeader>
                    <TableHeader>Source</TableHeader>
                    <TableHeader>Views</TableHeader>
                    <TableHeader>Helpful %</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TOP_ARTICLES.map(article => (
                    <TableRow key={article.id}>
                      <TableCell><strong>{article.title}</strong></TableCell>
                      <TableCell>{article.source}</TableCell>
                      <TableCell>{article.views.toLocaleString()}</TableCell>
                      <TableCell>
                        <span style={{ color: article.helpful >= 90 ? 'var(--success-color)' : 'var(--text-primary)' }}>
                          {article.helpful}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">Preview</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <>
            <div className="grid grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-label">Queries (7d)</div>
                <div className="stat-value">2,847</div>
                <div className="stat-change positive">↑ 12%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Match Score</div>
                <div className="stat-value">0.91</div>
                <div className="stat-change positive">↑ 0.03</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Zero Results</div>
                <div className="stat-value">3.2%</div>
                <div className="stat-change positive">↓ 0.8%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Response Time</div>
                <div className="stat-value">124ms</div>
                <div className="stat-change positive">↓ 18ms</div>
              </div>
            </div>

            <div className="grid grid-2">
              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Query Volume (Last 7 Days)</CardTitle>
                <div className="analytics-chart">
                  {[
                    { day: 'Mon', queries: 380 },
                    { day: 'Tue', queries: 420 },
                    { day: 'Wed', queries: 395 },
                    { day: 'Thu', queries: 450 },
                    { day: 'Fri', queries: 480 },
                    { day: 'Sat', queries: 320 },
                    { day: 'Sun', queries: 402 },
                  ].map((day) => (
                    <div key={day.day} className="chart-bar-group">
                      <div className="chart-bars">
                        <div 
                          className="chart-bar chart-bar-accent" 
                          style={{ height: `${(day.queries / 500) * 100}%` }}
                          title={`${day.queries} queries`}
                        />
                      </div>
                      <span className="chart-label">{day.day}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardTitle style={{ marginBottom: '16px' }}>Top Search Terms</CardTitle>
                <div className="analytics-list">
                  {[
                    { term: 'password reset', count: 234, percentage: 18 },
                    { term: 'return policy', count: 187, percentage: 14 },
                    { term: 'shipping', count: 156, percentage: 12 },
                    { term: 'order status', count: 143, percentage: 11 },
                    { term: 'warranty', count: 98, percentage: 8 },
                  ].map((item, i) => (
                    <div key={item.term} className="analytics-list-item">
                      <div className="analytics-list-info">
                        <span className="analytics-list-rank">#{i + 1}</span>
                        <span className="analytics-list-name">{item.term}</span>
                      </div>
                      <div className="analytics-list-stats">
                        <div className="analytics-progress-bar">
                          <div 
                            className="analytics-progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="analytics-list-count">{item.count}</span>
                        <span className="analytics-list-percent">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
