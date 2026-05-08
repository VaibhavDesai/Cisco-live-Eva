import { useState } from 'react';
import { Text } from '@momentum-design/components/react';
import { Button, Tab, TabList } from '../momentum';
import { AgentTabPanelHeader } from './AgentTabPanelHeader';

type HistorySubTab = 'version-history' | 'change-logs';

type VersionRow = {
  id: string;
  comment: string;
  aiEngine: string;
  updatedAt: string;
  isActive: boolean;
};

const VERSION_ROWS: VersionRow[] = [
  {
    id: 'v4',
    comment: 'v4',
    aiEngine: '1.0.0',
    updatedAt: "17 Apr' 26, 9:17 AM by newstartup_imi",
    isActive: true,
  },
  {
    id: 'v3',
    comment: 'v3',
    aiEngine: '1.0.0',
    updatedAt: "17 Apr' 26, 8:35 AM by newstartup_imi",
    isActive: false,
  },
  {
    id: 'v1',
    comment: 'v1',
    aiEngine: '1.0.0',
    updatedAt: "17 Apr' 26, 8:16 AM by newstartup_imi",
    isActive: false,
  },
];

export type AgentHistoryTabContentProps = {
  panelContext?: 'agent' | 'aiTrainingCustomer';
};

export function AgentHistoryTabContent({
  panelContext = 'agent',
}: AgentHistoryTabContentProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<HistorySubTab>('version-history');

  return (
    <section className="agent-history-panel">
      <AgentTabPanelHeader
        className="mb-3"
        title="History"
        description={
          panelContext === 'aiTrainingCustomer'
            ? 'See changes made to this AI customer persona and its training configuration.'
            : 'See all the changes made to the agent.'
        }
      />

      <div className="agent-history-subtabs">
        <TabList
          data-aria-label="History views"
          activeTabId={activeSubTab}
          onChange={(e: CustomEvent<{ tabId: string }>) => {
            const id = e.detail.tabId;
            if (id === 'version-history' || id === 'change-logs') {
              setActiveSubTab(id);
            }
          }}
        >
          <Tab tabId="version-history" text="Version history" variant="pill" />
          <Tab tabId="change-logs" text="Change logs" variant="pill" />
        </TabList>
      </div>

      {activeSubTab === 'version-history' && (
        <div className="agent-history-table-wrap">
          <table className="agent-history-table">
            <thead>
              <tr>
                <th>Comment</th>
                <th>AI engine</th>
                <th>Updated at</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              {VERSION_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="agent-history-comment-cell">
                      {row.isActive && (
                        <span className="agent-history-active-dot" aria-label="Active version" title="Active version" />
                      )}
                      <span>{row.comment}</span>
                    </div>
                  </td>
                  <td>{row.aiEngine}</td>
                  <td className="agent-history-updated-cell">{row.updatedAt}</td>
                  <td className="agent-history-controls-cell">
                    <Button
                      type="button"
                      color="default"
                      variant="tertiary"
                      size={28}
                      prefixIcon="arrow-down-bold"
                      aria-label={`Actions for ${row.comment}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'change-logs' && (
        <div className="agent-history-change-logs-placeholder">
          <Text type="body-midsize-regular" className="text-secondary">
            Change logs will appear here.
          </Text>
        </div>
      )}
    </section>
  );
}
