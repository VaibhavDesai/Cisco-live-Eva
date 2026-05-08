import { useState } from 'react';
import SharedButton from '../../../components/shared/Button';
import { Checkbox } from '../../../components/shared/Checkbox';
import { Input } from '../../../components/shared/FormInput';
import { Icon } from '../../../icons/Icon';
import { ck } from '../clus-kpi-theme';

interface FilterBarProps {
  agentNames: string[];
  hideAgents?: boolean;
  hideType?: boolean;
  hideStatus?: boolean;
  onAgentClick?: (agentName: string) => void;
}

export function FilterBar({ agentNames, hideAgents = false, hideType = false, hideStatus = false, onAgentClick }: FilterBarProps) {
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedTimezones, setSelectedTimezones] = useState<Set<string>>(new Set());

  // Filter agents by search query
  const filteredAgents = agentNames.filter(agent => 
    agent.toLowerCase().includes(agentSearchQuery.toLowerCase())
  );
  
  // Get first 5 agent names
  const visibleAgents = showAllAgents ? filteredAgents : filteredAgents.slice(0, 5);

  const channels = [
    'Voice',
    'All digital',
    'SMS',
    'Whatsapp',
    'Messenger',
    'Instagram',
    'Facebook',
    'Twitter',
    'Email',
    'Chat'
  ];
  
  const visibleChannels = showAllChannels ? channels : channels.slice(0, 5);

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Russian',
    'Dutch',
    'Swedish'
  ];
  
  const visibleLanguages = showAllLanguages ? languages : languages.slice(0, 5);

  const timezones = [
    'UTC+0 (GMT)',
    'UTC-5 (EST)',
    'UTC-8 (PST)',
    'UTC+1 (CET)'
  ];

  const toggleSelection = (set: Set<string>, value: string, setter: (set: Set<string>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setter(newSet);
  };

  const shouldIgnoreAgentRowClick = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(el.closest('.checkbox') || el.closest('input[type="checkbox"]'));
  };

  return (
    <div
      className={`w-[260px] shrink-0 h-full overflow-y-auto border-r bg-[var(--mds-color-theme-background-solid-secondary-normal)] ${ck.borderDefault}`}
    >
      <div className="p-4 space-y-6">
        {/* Agents Section */}
        {!hideAgents && (
          <div>
            <h3 className={`mb-3 ${ck.text}`}>Agents</h3>
            <div className="space-y-2">
              <div className="w-full clus-kpi-search-wrap">
                <Input
                  aria-label="Search for an agent"
                  placeholder="Search for an agent"
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  leadingIcon="search"
                  clearable
                  onClear={() => setAgentSearchQuery('')}
                  className="clus-kpi-search-input"
                />
              </div>
              {visibleAgents.map((agent) => (
                <div
                  key={agent}
                  className={`flex items-center gap-2 transition-colors group ${ck.textMuted} hover:text-[var(--mds-color-theme-text-primary-normal)]`}
                >
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    role={onAgentClick ? 'button' : undefined}
                    tabIndex={onAgentClick ? 0 : undefined}
                    onClick={(e) => {
                      if (!onAgentClick || shouldIgnoreAgentRowClick(e.target)) return;
                      onAgentClick(agent);
                    }}
                    onKeyDown={(e) => {
                      if (!onAgentClick) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onAgentClick(agent);
                      }
                    }}
                    aria-label={onAgentClick ? `Filter dashboard by ${agent}` : undefined}
                  >
                    <Checkbox
                      label={agent}
                      checked={selectedAgents.has(agent)}
                      onChange={() => {
                        toggleSelection(selectedAgents, agent, setSelectedAgents);
                        onAgentClick?.(agent);
                      }}
                    />
                  </div>
                  {onAgentClick && (
                    <SharedButton
                      type="button"
                      variant="tertiary"
                      size="sm"
                      aria-label={`View ${agent} details`}
                      onClick={() => onAgentClick(agent)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="pop-out" weight="bold" size={16} />
                    </SharedButton>
                  )}
                </div>
              ))}
              {agentNames.length > 5 && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setShowAllAgents(!showAllAgents)}
                  >
                    {showAllAgents ? 'Show less' : 'Show more'}
                    <Icon name={showAllAgents ? 'arrow-up' : 'arrow-down'} weight="bold" size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Type Section */}
        {!hideType && (
          <div>
            <h3 className={`mb-3 ${ck.text}`}>Type</h3>
            <div className="space-y-2">
              <Checkbox
                label="Autonomous"
                checked={selectedTypes.has('Autonomous')}
                onChange={() => toggleSelection(selectedTypes, 'Autonomous', setSelectedTypes)}
              />
              <Checkbox
                label="Scripted"
                checked={selectedTypes.has('Scripted')}
                onChange={() => toggleSelection(selectedTypes, 'Scripted', setSelectedTypes)}
              />
            </div>
          </div>
        )}

        {/* Status Section */}
        {!hideStatus && (
          <div>
            <h3 className={`mb-3 ${ck.text}`}>Status</h3>
            <div className="space-y-2">
              <Checkbox
                label="Live"
                checked={selectedStatuses.has('Live')}
                onChange={() => toggleSelection(selectedStatuses, 'Live', setSelectedStatuses)}
              />
              <Checkbox
                label="Draft"
                checked={selectedStatuses.has('Draft')}
                onChange={() => toggleSelection(selectedStatuses, 'Draft', setSelectedStatuses)}
              />
            </div>
          </div>
        )}

        {/* Channels Section */}
        <div>
          <h3 className={`mb-3 ${ck.text}`}>Channels</h3>
          <div className="space-y-2">
            {visibleChannels.map((channel) => (
              <Checkbox
                key={channel}
                label={channel}
                checked={selectedChannels.has(channel)}
                onChange={() => toggleSelection(selectedChannels, channel, setSelectedChannels)}
              />
            ))}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="link-button"
                onClick={() => setShowAllChannels(!showAllChannels)}
              >
                {showAllChannels ? 'Show less' : 'Show more'}
                <Icon name={showAllChannels ? 'arrow-up' : 'arrow-down'} weight="bold" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Languages Section */}
        <div>
          <h3 className={`mb-3 ${ck.text}`}>Languages</h3>
          <div className="space-y-2">
            {visibleLanguages.map((language) => (
              <Checkbox
                key={language}
                label={language}
                checked={selectedLanguages.has(language)}
                onChange={() => toggleSelection(selectedLanguages, language, setSelectedLanguages)}
              />
            ))}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="link-button"
                onClick={() => setShowAllLanguages(!showAllLanguages)}
              >
                {showAllLanguages ? 'Show less' : 'Show more'}
                <Icon name={showAllLanguages ? 'arrow-up' : 'arrow-down'} weight="bold" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Timezones Section */}
        <div>
          <h3 className={`mb-3 ${ck.text}`}>Timezones</h3>
          <div className="space-y-2">
            {timezones.map((timezone) => (
              <Checkbox
                key={timezone}
                label={timezone}
                checked={selectedTimezones.has(timezone)}
                onChange={() => toggleSelection(selectedTimezones, timezone, setSelectedTimezones)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}