import { useState } from 'react'
import { Icon } from '../../../icons/Icon'

const TABS = [
  { id: 'project', label: 'Project' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

export default function ProjectPage() {
  const [activeTab, setActiveTab] = useState('project')

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
      </div>

      <div className="tabs tabs-line">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'project' && <div className="ai-project-tab-content" />}

      {activeTab === 'analytics' && (
        <div className="ai-project-tab-content">
          <div className="card" style={{ padding: 'var(--spacing-large)', textAlign: 'center' }}>
            <Icon name="analysis" size={32} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-x-small)' }}>
              Analytics dashboard coming soon
            </p>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="ai-project-tab-content">
          <div className="card" style={{ padding: 'var(--spacing-large)', textAlign: 'center' }}>
            <Icon name="settings" size={32} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-x-small)' }}>
              Project settings coming soon
            </p>
          </div>
        </div>
      )}
    </>
  )
}
