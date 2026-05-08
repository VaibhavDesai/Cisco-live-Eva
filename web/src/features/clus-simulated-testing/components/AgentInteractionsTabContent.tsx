import { useState } from 'react';
import {
  Button,
  Checkbox,
  Icon,
  Input,
  Option,
  Select,
  Selectlistbox,
  Text,
} from '@momentum-design/components/react';
import { AgentTabPanelHeader } from './AgentTabPanelHeader';

type InteractionRow = {
  channel: string;
  sessionId: string;
  consumerId: string;
  interactionId: string;
  messages: number;
  updatedAt: string;
  isTestSession: boolean;
  handoverHappened: boolean;
  errorOccurred: boolean;
  guardrailTriggered: boolean;
};

type InteractionFilters = {
  sessionId: string;
  consumerId: string;
  interactionId: string;
  channel: string;
  lastUpdated: string;
  hideTestSessions: boolean;
  handoverHappened: boolean;
  errorOccurred: boolean;
  guardrailTriggered: boolean;
};

const CHANNEL_OPTIONS = [
  { value: '', label: 'Select channels to display' },
  { value: 'Web', label: 'Web' },
  { value: 'Messenger', label: 'Messenger' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Email', label: 'Email' },
];

const INTERACTION_ROWS: InteractionRow[] = [
  {
    channel: 'Web',
    sessionId: '191da6fd-6df3-476d-979e-4cf1fe36b616',
    consumerId: 'cons-44102',
    interactionId: 'int-90001',
    messages: 3,
    updatedAt: '17 Apr 26, 10:51 AM',
    isTestSession: false,
    handoverHappened: false,
    errorOccurred: false,
    guardrailTriggered: false,
  },
  {
    channel: 'Messenger',
    sessionId: '7c2a9e41-0b12-4f8e-9d33-1a8f6e2c4d90',
    consumerId: 'cons-88231',
    interactionId: 'int-90002',
    messages: 1,
    updatedAt: '17 Apr 26, 9:12 AM',
    isTestSession: true,
    handoverHappened: true,
    errorOccurred: false,
    guardrailTriggered: false,
  },
  {
    channel: 'SMS',
    sessionId: '3f88c1dd-52aa-4b10-8c7e-6e5d4c3b2a10',
    consumerId: 'cons-11904',
    interactionId: 'int-90003',
    messages: 25,
    updatedAt: '16 Apr 26, 4:30 PM',
    isTestSession: false,
    handoverHappened: true,
    errorOccurred: true,
    guardrailTriggered: true,
  },
  {
    channel: 'Email',
    sessionId: 'b04e9c7a-1d44-4a2f-b6c8-9a0e1f2d3c4b',
    consumerId: 'cons-55678',
    interactionId: 'int-90004',
    messages: 17,
    updatedAt: '16 Apr 26, 11:05 AM',
    isTestSession: false,
    handoverHappened: false,
    errorOccurred: false,
    guardrailTriggered: false,
  },
];

const createDefaultFilters = (): InteractionFilters => ({
  sessionId: '',
  consumerId: '',
  interactionId: '',
  channel: '',
  lastUpdated: '',
  hideTestSessions: false,
  handoverHappened: false,
  errorOccurred: false,
  guardrailTriggered: false,
});

const includesFilter = (value: string, query: string): boolean =>
  query.trim() === '' || value.toLowerCase().includes(query.trim().toLowerCase());

export type AgentInteractionsTabContentProps = {
  /** Use alternate panel copy for AI customer training flows (vs service agent). */
  panelContext?: 'agent' | 'aiTrainingCustomer';
};

export function AgentInteractionsTabContent({
  panelContext = 'agent',
}: AgentInteractionsTabContentProps = {}) {
  const [pendingFilters, setPendingFilters] = useState<InteractionFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<InteractionFilters>(() => createDefaultFilters());

  const applyMetadataToggle = (
    key: 'hideTestSessions' | 'handoverHappened' | 'errorOccurred' | 'guardrailTriggered',
  ) => {
    setPendingFilters((prevPending) => {
      const nextValue = !prevPending[key];
      const nextFilters = { ...prevPending, [key]: nextValue };
      setAppliedFilters((prevApplied) => ({ ...prevApplied, [key]: nextValue }));
      return nextFilters;
    });
  };

  const visibleRows = INTERACTION_ROWS.filter((row) => {
    const sessionMatch = includesFilter(row.sessionId, appliedFilters.sessionId);
    const consumerMatch = includesFilter(row.consumerId, appliedFilters.consumerId);
    const interactionMatch = includesFilter(row.interactionId, appliedFilters.interactionId);
    const channelMatch =
      appliedFilters.channel === '' || row.channel.toLowerCase() === appliedFilters.channel.toLowerCase();
    const lastUpdatedMatch = includesFilter(row.updatedAt, appliedFilters.lastUpdated);
    const testMatch = !appliedFilters.hideTestSessions || !row.isTestSession;
    const handoverMatch = !appliedFilters.handoverHappened || row.handoverHappened;
    const errorMatch = !appliedFilters.errorOccurred || row.errorOccurred;
    const guardrailMatch = !appliedFilters.guardrailTriggered || row.guardrailTriggered;
    return (
      sessionMatch &&
      consumerMatch &&
      interactionMatch &&
      channelMatch &&
      lastUpdatedMatch &&
      testMatch &&
      handoverMatch &&
      errorMatch &&
      guardrailMatch
    );
  });

  return (
    <section className="agent-interactions-panel surf-shop-main-card">
      <div className="surf-shop-main-header-row">
        <AgentTabPanelHeader
          className="min-w-0 flex-1"
          title="Interactions"
          description={
            panelContext === 'aiTrainingCustomer'
              ? 'Sessions where this AI customer role-played with your agents—includes practice runs, reviews, and escalations.'
              : 'Interactions capture all exchanges with your AI agent, including sessions, handovers, and errors.'
          }
          trailing={
            <Button color="default" variant="secondary" size={32} prefixIcon="refresh-bold" type="button">
              Refresh
            </Button>
          }
        />
      </div>

      <div className="surf-shop-content-grid">
        <section className="surf-shop-filter-panel">
          <h3 className="surf-shop-panel-title">Refine Results</h3>

          <div className="surf-shop-filter-fields mt-16">
            <Input
              className="surf-shop-filter-input-wrap"
              label="Session ID"
              placeholder="Session ID"
              value={pendingFilters.sessionId}
              onInput={(event) =>
                setPendingFilters((prev) => ({ ...prev, sessionId: (event.target as { value: string }).value }))
              }
            />
            <Input
              className="surf-shop-filter-input-wrap"
              label="Consumer ID"
              placeholder="Consumer ID"
              value={pendingFilters.consumerId}
              onInput={(event) =>
                setPendingFilters((prev) => ({ ...prev, consumerId: (event.target as { value: string }).value }))
              }
            />
            <Input
              className="surf-shop-filter-input-wrap"
              label="Interaction ID"
              placeholder="Interaction ID"
              value={pendingFilters.interactionId}
              onInput={(event) =>
                setPendingFilters((prev) => ({ ...prev, interactionId: (event.target as { value: string }).value }))
              }
            />
            <Select
              label=""
              dataAriaLabel="Select channels to display"
              value={pendingFilters.channel}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  channel: (event.target as { value: string }).value,
                }))
              }
              className="surf-shop-filter-input-wrap agent-interactions-channel-select"
            >
              <Selectlistbox>
                {CHANNEL_OPTIONS.map((opt) => (
                  <Option
                    key={opt.value || 'all'}
                    value={opt.value}
                    label={opt.label}
                    selected={pendingFilters.channel === opt.value}
                  />
                ))}
              </Selectlistbox>
            </Select>
            <Input
              className="surf-shop-filter-input-wrap"
              label="Last updated"
              placeholder="Last updated"
              value={pendingFilters.lastUpdated}
              onInput={(event) =>
                setPendingFilters((prev) => ({ ...prev, lastUpdated: (event.target as { value: string }).value }))
              }
            />
          </div>

          <div className="mt-16">
            <Text type="body-small-regular" className="text-secondary">
              Metadata
            </Text>
          </div>
          <div className="surf-shop-metadata mt-8">
            <Checkbox
              label="Hide test sessions"
              checked={pendingFilters.hideTestSessions}
              onChange={() => applyMetadataToggle('hideTestSessions')}
            />
            <Checkbox
              label="Agent handover happened"
              checked={pendingFilters.handoverHappened}
              onChange={() => applyMetadataToggle('handoverHappened')}
            />
            <Checkbox
              label="Error occurred"
              checked={pendingFilters.errorOccurred}
              onChange={() => applyMetadataToggle('errorOccurred')}
            />
            <Checkbox
              label="Guardrail triggered"
              checked={pendingFilters.guardrailTriggered}
              onChange={() => applyMetadataToggle('guardrailTriggered')}
            />
          </div>

          <div className="flex-row-gap-8 mt-16">
            <Button
              color="accent"
              variant="primary"
              size={32}
              type="button"
              onClick={() => setAppliedFilters({ ...pendingFilters })}
            >
              Submit
            </Button>
            <Button
              color="default"
              variant="secondary"
              size={32}
              type="button"
              onClick={() => {
                const reset = createDefaultFilters();
                setPendingFilters(reset);
                setAppliedFilters(reset);
              }}
            >
              Clear
            </Button>
          </div>
        </section>

        <div className="agent-history-table-wrap">
          <table className="agent-history-table">
            <thead>
              <tr>
                <th>Channels</th>
                <th>Session ID</th>
                <th>Messages</th>
                <th>Updated at</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.sessionId}>
                  <td>
                    <div className="surf-shop-channel-cell">
                      <Icon name="chat-bold" size={14} lengthUnit="px" aria-hidden />
                      <span>{row.channel}</span>
                    </div>
                  </td>
                  <td className="agent-interactions-session-cell">{row.sessionId}</td>
                  <td>{row.messages}</td>
                  <td>{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
