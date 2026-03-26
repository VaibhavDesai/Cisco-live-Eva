import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/shared/Table';
import Badge from '../components/shared/Badge';
import { Card } from '../components/shared/Card';

const KNOWLEDGE_SOURCES = [
  { id: 1, name: 'Product Documentation', type: 'Website', articles: '2,847', status: 'Active', lastSync: '1 hour ago' },
  { id: 2, name: 'FAQ Database', type: 'Database', articles: '156', status: 'Active', lastSync: '3 hours ago' },
  { id: 3, name: 'Support Articles', type: 'Website', articles: '1,234', status: 'Active', lastSync: '2 hours ago' },
  { id: 4, name: 'Internal Wiki', type: 'Confluence', articles: '892', status: 'Syncing', lastSync: 'In progress' },
  { id: 5, name: 'API Documentation', type: 'Website', articles: '423', status: 'Active', lastSync: '5 hours ago' },
  { id: 6, name: 'Training Materials', type: 'PDF', articles: '89', status: 'Active', lastSync: '1 day ago' },
];

const KNOWLEDGE_BASES = [
  { 
    id: 1, 
    name: 'Customer Support KB', 
    description: 'Knowledge base for customer support agents',
    sources: ['Product Documentation', 'FAQ Database', 'Support Articles'],
    totalArticles: 4237,
    agents: 3,
    lastUpdated: '2 hours ago'
  },
  { 
    id: 2, 
    name: 'Technical Support KB', 
    description: 'Technical documentation and troubleshooting guides',
    sources: ['API Documentation', 'Internal Wiki'],
    totalArticles: 1315,
    agents: 2,
    lastUpdated: '4 hours ago'
  },
  { 
    id: 3, 
    name: 'Sales Enablement KB', 
    description: 'Product info and competitive analysis for sales team',
    sources: ['Product Documentation', 'Training Materials'],
    totalArticles: 2936,
    agents: 1,
    lastUpdated: '1 day ago'
  },
];

export default function Knowledge() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sources');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge</h1>
          <p className="page-subtitle">Manage knowledge sources and collections</p>
        </div>
        <Button>{activeSection === 'sources' ? '+ Add Source' : '+ Create Knowledge Base'}</Button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <div 
          className={`tab ${activeSection === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveSection('sources')}
        >
          Sources
        </div>
        <div 
          className={`tab ${activeSection === 'knowledgebase' ? 'active' : ''}`}
          onClick={() => setActiveSection('knowledgebase')}
        >
          Knowledge Base
        </div>
      </div>

      <div className="secondary-content">

        {/* Sources Tab */}
        {activeSection === 'sources' && (
          <>
            <div className="filter-bar">
              <input type="text" placeholder="Search sources..." />
              <Dropdown
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'website', label: 'Website' },
                  { value: 'database', label: 'Database' },
                  { value: 'confluence', label: 'Confluence' },
                  { value: 'pdf', label: 'PDF' }
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
              />
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
                {KNOWLEDGE_SOURCES.map(source => (
                  <TableRow key={source.id}>
                    <TableCell><strong>{source.name}</strong></TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell>{source.articles}</TableCell>
                    <TableCell>
                      <Badge variant={source.status === 'Active' ? 'success' : 'warning'}>
                        {source.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.lastSync}</TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Knowledge Base Tab */}
        {activeSection === 'knowledgebase' && (
          <>
            <div className="filter-bar">
              <input type="text" placeholder="Search knowledge bases..." />
            </div>

            <div className="kb-grid">
              {KNOWLEDGE_BASES.map(kb => (
                <Card key={kb.id} className="kb-card">
                  <div className="kb-card-header">
                    <div className="kb-icon">📚</div>
                    <div className="kb-info">
                      <h3 className="kb-name">{kb.name}</h3>
                      <p className="kb-description">{kb.description}</p>
                    </div>
                  </div>
                  
                  <div className="kb-sources">
                    <span className="kb-sources-label">Sources:</span>
                    <div className="kb-sources-list">
                      {kb.sources.map((source, i) => (
                        <span key={i} className="kb-source-tag">{source}</span>
                      ))}
                    </div>
                  </div>

                  <div className="kb-stats">
                    <div className="kb-stat">
                      <span className="kb-stat-value">{kb.totalArticles.toLocaleString()}</span>
                      <span className="kb-stat-label">Articles</span>
                    </div>
                    <div className="kb-stat">
                      <span className="kb-stat-value">{kb.agents}</span>
                      <span className="kb-stat-label">Agents</span>
                    </div>
                    <div className="kb-stat">
                      <span className="kb-stat-value">{kb.sources.length}</span>
                      <span className="kb-stat-label">Sources</span>
                    </div>
                  </div>

                  <div className="kb-footer">
                    <span className="kb-updated">Updated {kb.lastUpdated}</span>
                    <div className="kb-actions">
                      <Button variant="secondary" size="sm">Edit</Button>
                      <Button size="sm" onClick={() => navigate(`/knowledge/${kb.id}`)}>View</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
