import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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

  return (
    <div className="w-[260px] h-full overflow-y-auto bg-[rgba(0,0,0,0.4)] border-r border-[rgba(255,255,255,0.1)] backdrop-blur-sm">
      <div className="p-4 space-y-6">
        {/* Agents Section */}
        {!hideAgents && (
          <div>
            <h3 className="text-white mb-3">Agents</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search for an agent"
                value={agentSearchQuery}
                onChange={(e) => setAgentSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded text-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-[rgba(255,255,255,0.4)] transition-colors"
              />
              {visibleAgents.map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Checkbox
                      checked={selectedAgents.has(agent)}
                      onCheckedChange={() => toggleSelection(selectedAgents, agent, setSelectedAgents)}
                      className="border-gray-600"
                    />
                    <span className="text-sm">{agent}</span>
                  </label>
                  {onAgentClick && (
                    <button
                      onClick={() => onAgentClick(agent)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[rgba(255,255,255,0.1)] rounded"
                      title={`View ${agent} details`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>
              ))}
              {agentNames.length > 5 && (
                <button
                  onClick={() => setShowAllAgents(!showAllAgents)}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
                >
                  {showAllAgents ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Type Section */}
        {!hideType && (
          <div>
            <h3 className="text-white mb-3">Type</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Checkbox
                  checked={selectedTypes.has('Autonomous')}
                  onCheckedChange={() => toggleSelection(selectedTypes, 'Autonomous', setSelectedTypes)}
                  className="border-gray-600"
                />
                <span className="text-sm">Autonomous</span>
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Checkbox
                  checked={selectedTypes.has('Scripted')}
                  onCheckedChange={() => toggleSelection(selectedTypes, 'Scripted', setSelectedTypes)}
                  className="border-gray-600"
                />
                <span className="text-sm">Scripted</span>
              </label>
            </div>
          </div>
        )}

        {/* Status Section */}
        {!hideStatus && (
          <div>
            <h3 className="text-white mb-3">Status</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Checkbox
                  checked={selectedStatuses.has('Live')}
                  onCheckedChange={() => toggleSelection(selectedStatuses, 'Live', setSelectedStatuses)}
                  className="border-gray-600"
                />
                <span className="text-sm">Live</span>
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Checkbox
                  checked={selectedStatuses.has('Draft')}
                  onCheckedChange={() => toggleSelection(selectedStatuses, 'Draft', setSelectedStatuses)}
                  className="border-gray-600"
                />
                <span className="text-sm">Draft</span>
              </label>
            </div>
          </div>
        )}

        {/* Channels Section */}
        <div>
          <h3 className="text-white mb-3">Channels</h3>
          <div className="space-y-2">
            {visibleChannels.map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedChannels.has(channel)}
                  onCheckedChange={() => toggleSelection(selectedChannels, channel, setSelectedChannels)}
                  className="border-gray-600"
                />
                <span className="text-sm">{channel}</span>
              </label>
            ))}
            <button
              onClick={() => setShowAllChannels(!showAllChannels)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
            >
              {showAllChannels ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          </div>
        </div>

        {/* Languages Section */}
        <div>
          <h3 className="text-white mb-3">Languages</h3>
          <div className="space-y-2">
            {visibleLanguages.map((language) => (
              <label
                key={language}
                className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedLanguages.has(language)}
                  onCheckedChange={() => toggleSelection(selectedLanguages, language, setSelectedLanguages)}
                  className="border-gray-600"
                />
                <span className="text-sm">{language}</span>
              </label>
            ))}
            <button
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
            >
              {showAllLanguages ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          </div>
        </div>

        {/* Timezones Section */}
        <div>
          <h3 className="text-white mb-3">Timezones</h3>
          <div className="space-y-2">
            {timezones.map((timezone) => (
              <label
                key={timezone}
                className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedTimezones.has(timezone)}
                  onCheckedChange={() => toggleSelection(selectedTimezones, timezone, setSelectedTimezones)}
                  className="border-gray-600"
                />
                <span className="text-sm">{timezone}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}