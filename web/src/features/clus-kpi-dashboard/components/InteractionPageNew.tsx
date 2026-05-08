import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from 'react';
import { AccordionGroup, AccordionButton, Accordion, Popover } from '@momentum-design/components/react';
import { AlertChip, Button, Icon } from '../momentum';
import { ck } from '../clus-kpi-theme';
import { agentData } from './AgentTable';
import { baseInteractions, type Interaction } from './RecentInteractions';
import { PageHeader } from './PageHeader';

interface Message {
  id: string;
  speaker: 'customer' | 'agent';
  agentName?: string; // Which agent is speaking
  text: string;
  timestamp: string;
  transactionId?: string;
  actions?: string[];
  knowledge?: string[];
  slotFilling?: {
    article: string;
    match: string;
    notHelpful: string;
    agent: string;
  };
}

const conversationData: Message[] = [
    {
    id: '1',
    speaker: 'agent',
    agentName: 'Technical Support Agent',
    text: 'Technical Support Agent here, how may I help you?',
    timestamp: '08:12 AM, Mar 11, 2025',
    transactionId: 'tx-tech-001',
    actions: [],
    knowledge: []
  },
  {
    id: '2',
    speaker: 'customer',
    text: 'Hi, I`\m having an issue with my internet. I keep getting extra charges for services I don’t use',
    timestamp: '08:12 AM, Mar 11, 2025',
    transactionId: 'tx-tech-001',
    actions: [],
    knowledge: []
  },
  {
    id: '3',
    speaker: 'agent',
    agentName: 'Technical Support Agent',
    text: 'I\'m sorry to hear that - let me look at your bill.',
    timestamp: '08:12 AM, Mar 11, 2025',
    actions: ['Acknowledged issue', 'Initiated account review'],
    knowledge: ['Account verification', 'Service diagnostics'],
    slotFilling: {
      article: 'Article identified',
      match: 'Partial match',
      notHelpful: '0.33',
      agent: '0.3'
    }
  },
  {
    id: '4',
    speaker: 'agent',
    agentName: 'Billing Specialist',
    text: 'Ahh I see the issue, you have subscribed to our basic package but frequently go over your allowance.',
    timestamp: '08:13 AM, Mar 11, 2025',
    transactionId: 'tx-billing-001',
    actions: ['Reviewed account plan', 'Identified upgrade opportunity'],
    knowledge: ['Plan details', 'Upgrade options']
  },
  {
    id: '5',
    speaker: 'customer',
    text: 'Oh that’s not good. What can I do?',
    timestamp: '08:14 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  },
  {
    id: '6',
    speaker: 'agent',
    agentName: 'Billing Specialist',
    text: 'We can upgrade to our premium service for only $4 a month extra. Would you like to?',
    timestamp: '08:13 AM, Mar 11, 2025',
    actions: ['Presented upgrade option', 'Quoted pricing'],
    knowledge: ['Premium plan benefits', 'Pricing structure']
  },
  {
    id: '7',
    speaker: 'customer',
    text: 'Yes please.',
    timestamp: '08:14 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  },
  {
    id: '8',
    speaker: 'agent',
    agentName: 'Customer Success Agent Specialist',
    text: 'Ok, I just need you to confirm your date of birth for me, please.',
    timestamp: '08:14 AM, Mar 11, 2025',
    transactionId: 'tx-success-001',
    actions: ['Requested verification', 'Plan confirmation process'],
    knowledge: ['Account verification protocols', 'Plan activation procedures']
  },
  {
    id: '9',
    speaker: 'customer',
    text: 'Sure. It\'s the first of January 1990',
    timestamp: '08:15 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  },
  {
    id: '10',
    speaker: 'agent',
    agentName: 'Customer Success Agent Specialist',
    text: 'Ok great. You should see the changes from your next bill. Is there anything else I can help you with?',
    timestamp: '08:15 AM, Mar 11, 2025',
    actions: ['Confirmed plan activation', 'Offered additional assistance'],
    knowledge: ['Plan activation confirmation', 'Follow-up procedures']
  },
  {
    id: '11',
    speaker: 'customer',
    text: 'Can you tell me how to add parental controls to my router?',
    timestamp: '08:16 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  },
    {
    id: '12',
    speaker: 'agent',
    agentName: 'Customer Success Agent Specialist',
    text: 'Sure',
    timestamp: '08:15 AM, Mar 11, 2025',
    actions: ['Confirmed plan activation', 'Offered additional assistance'],
    knowledge: ['Plan activation confirmation', 'Follow-up procedures']
  },
  {
    id: '13',
    speaker: 'agent',
    agentName: 'Product Specialist',
    text: 'I see you have the Digiview Router. Parental controls are available via our app, just scan the QR code on the back and go to \'Security and Privacy\'',
    timestamp: '08:17 AM, Mar 11, 2025',
    transactionId: 'tx-product-001',
    actions: ['Identified router model', 'Provided setup instructions'],
    knowledge: ['Router configuration', 'App setup procedures', 'Parental controls']
  },
  {
    id: '14',
    speaker: 'customer',
    text: 'Awesome, thank you.',
    timestamp: '08:17 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  },
  {
    id: '15',
    speaker: 'agent',
    agentName: 'Product Specialist',
    text: 'No problem, happy to help. Is there anything else I can assist you with today?',
    timestamp: '08:18 AM, Mar 11, 2025',
    actions: ['Confirmed resolution', 'Offered additional assistance'],
    knowledge: ['Closing procedures', 'Customer satisfaction verification']
  },
  {
    id: '16',
    speaker: 'customer',
    text: 'Nope, all good - bye!',
    timestamp: '08:18 AM, Mar 11, 2025',
    actions: [],
    knowledge: []
  }
];

interface Agent {
  name: string;
  type: string;
}

const INTERACTION_AUDIO_TOTAL_SEC = 240;

/** Compact play bar for one transcript segment (used in agent handoff headings). */
function InteractionSegmentPlayer({
  durationSeconds,
  segmentKey,
  activeSegmentKey,
  setActiveSegmentKey,
  openVolumeSegmentKey,
  setOpenVolumeSegmentKey,
  playbackVolume,
  onPlaybackVolumeChange,
}: {
  durationSeconds: number;
  segmentKey: string;
  activeSegmentKey: string | null;
  setActiveSegmentKey: Dispatch<SetStateAction<string | null>>;
  openVolumeSegmentKey: string | null;
  setOpenVolumeSegmentKey: Dispatch<SetStateAction<string | null>>;
  playbackVolume: number;
  onPlaybackVolumeChange: (value: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [segmentKey, durationSeconds]);

  useEffect(() => {
    if (activeSegmentKey !== segmentKey && isPlaying) {
      setIsPlaying(false);
    }
  }, [activeSegmentKey, segmentKey, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setCurrentTime((t) => {
        if (t >= durationSeconds) {
          setIsPlaying(false);
          setActiveSegmentKey((k) => (k === segmentKey ? null : k));
          return durationSeconds;
        }
        return t + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, durationSeconds, segmentKey, setActiveSegmentKey]);

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = rect.width > 0 ? x / rect.width : 0;
    setCurrentTime(Math.min(durationSeconds, Math.max(0, Math.floor(pct * durationSeconds))));
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setActiveSegmentKey((k) => (k === segmentKey ? null : k));
    } else {
      setActiveSegmentKey(segmentKey);
      setIsPlaying(true);
    }
  };

  const volumeTriggerId = `${useId().replace(/:/g, '')}-vol`;
  const isVolumePopoverOpen = openVolumeSegmentKey === segmentKey;

  return (
    <div
      className={`flex h-[32px] shrink-0 items-center gap-2 rounded-xl border px-3 ${ck.borderDefault}`}
      style={{ backgroundColor: 'var(--mds-color-theme-background-solid-tertiary-normal)' }}
    >
      <Button
        type="button"
        onClick={togglePlay}
        color="default"
        variant="tertiary"
        size={24}
        aria-label={isPlaying ? 'Pause segment' : 'Play segment'}
        prefixIcon={isPlaying ? 'pause-bold' : 'play-bold'}
      />
      <span className={`whitespace-nowrap text-xs tabular-nums ${ck.text}`}>
        {formatClock(currentTime)} / {formatClock(durationSeconds)}
      </span>
      <div className="min-w-[72px] max-w-[128px] flex-1">
        <div
          className={`relative h-1.5 w-full cursor-pointer rounded-full ${ck.borderDefault}`}
          style={{ backgroundColor: 'var(--mds-color-theme-outline-secondary-normal)' }}
          onClick={handleProgressClick}
          aria-label="Segment playback progress"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={currentTime}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{
              width: `${durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0}%`,
              backgroundColor: 'var(--mds-color-theme-text-accent-normal)',
            }}
          />
        </div>
      </div>
      <div className="relative inline-flex shrink-0 interaction-segment-volume-control">
        <Button
          id={volumeTriggerId}
          type="button"
          onClick={() =>
            setOpenVolumeSegmentKey((current) => (current === segmentKey ? null : segmentKey))
          }
          color="default"
          variant="tertiary"
          size={24}
          aria-label="Playback volume"
          aria-haspopup="dialog"
          aria-expanded={isVolumePopoverOpen}
          prefixIcon="speaker-off-bold"
        />
        <Popover
          triggerID={volumeTriggerId}
          placement="top"
          offset={4}
          visible={isVolumePopoverOpen}
          onHidden={() =>
            setOpenVolumeSegmentKey((current) => (current === segmentKey ? null : current))
          }
        >
          <div className="interaction-segment-volume-popover">
            <Icon name="speaker-turn-up-bold" size={16} lengthUnit="px" className={ck.textMuted} aria-hidden />
            <input
              type="range"
              min={0}
              max={100}
              value={playbackVolume}
              aria-label="Playback volume"
              className="interaction-segment-volume-range"
              onInput={(e) =>
                onPlaybackVolumeChange(Number((e.target as HTMLInputElement).value))
              }
            />
            <Icon name="speaker-turn-down-bold" size={16} lengthUnit="px" className={ck.textMuted} aria-hidden />
          </div>
        </Popover>
      </div>
    </div>
  );
}

function Avatar({ type }: { type: 'customer' | 'agent' }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        type === 'customer' ? ck.bgSubtle : ''
      }`}
      style={
        type === 'agent'
          ? { backgroundColor: 'var(--mds-color-theme-background-accent-normal)' }
          : undefined
      }
    >
      {type === 'customer' ? (
        <Icon name="primary-participant-bold" size={20} lengthUnit="px" className={ck.text} aria-hidden />
      ) : (
        <Icon
          name="bot-customer-assistant-bold"
          size={20}
          lengthUnit="px"
          className={ck.textOnAccent}
          aria-hidden
        />
      )}
    </div>
  );
}

export function InteractionPageNew({ 
  interactionId,
  agents = [
    { name: 'Technical Support Agent', type: 'Primary' },
    { name: 'Billing Specialist', type: 'Secondary' },
    { name: 'Customer Success Agent Specialist', type: 'Secondary' },
    { name: 'Product Specialist', type: 'Secondary' }
  ],
  onBack,
  hideHeader = false
}: { 
  interactionId: string;
  agents?: Agent[];
  onBack?: () => void;
  hideHeader?: boolean;
}) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  type DetailSection = 'slotFilling' | 'fulfillment' | 'serviceFlow' | 'fulfillmentOutput';

  const [expandedSections, setExpandedSections] = useState<Record<DetailSection, boolean>>({
    slotFilling: true,
    fulfillment: true,
    serviceFlow: true,
    fulfillmentOutput: true,
  });
  const [activeSegmentPlayerKey, setActiveSegmentPlayerKey] = useState<string | null>(null);
  const [segmentPlaybackVolume, setSegmentPlaybackVolume] = useState(80);
  const [openVolumeSegmentKey, setOpenVolumeSegmentKey] = useState<string | null>(null);

  useEffect(() => {
    if (!openVolumeSegmentKey) return;

    const handlePointerDownOutsideVolume = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedInsideVolumeControl = target.closest('.interaction-segment-volume-control') !== null;
      const clickedInsideVisibleVolumePopover = target.closest('mdc-popover[visible]') !== null;

      if (!clickedInsideVolumeControl && !clickedInsideVisibleVolumePopover) {
        setOpenVolumeSegmentKey(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutsideVolume);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutsideVolume);
    };
  }, [openVolumeSegmentKey]);

  const handleDetailSectionShown =
    (section: DetailSection) => (e: Event) => {
      const ce = e as CustomEvent<{ expanded: boolean }>;
      if (ce.detail == null || typeof ce.detail.expanded !== 'boolean') return;
      setExpandedSections((prev) => ({ ...prev, [section]: ce.detail.expanded }));
    };
  
  // Derive agent name from interaction ID if available
  const getInteraction = (): Interaction | undefined => {
    if (!interactionId) return undefined;
    
    // Parse interaction ID (format: int-00001)
    const match = interactionId.match(/int-(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      if (index >= 0) {
        const baseIndex = index % baseInteractions.length;
        return baseInteractions[baseIndex];
      }
    }
    return undefined;
  };

  const interaction = getInteraction();

  const displayAgents = useMemo(() => {
    // Extract unique agents from the conversation data in order of appearance
    const uniqueAgents: Agent[] = [];
    const seenAgents = new Set<string>();
    
    conversationData.forEach(message => {
      if (message.speaker === 'agent' && message.agentName && !seenAgents.has(message.agentName)) {
        seenAgents.add(message.agentName);
        uniqueAgents.push({
          name: message.agentName,
          type: uniqueAgents.length === 0 ? 'Primary' : 'Secondary'
        });
      }
    });
    
    return uniqueAgents.length > 0 ? uniqueAgents : agents;
  }, [agents]);

  const effectiveConversationData = useMemo(() => {
    // Just return the conversation data as-is since agent names are already correct
    return conversationData;
  }, []);

  const getAgentNameFromInteraction = () => {
    if (interaction) {
      if (interaction.agentCount === 1 && interaction.agentName) {
        return interaction.agentName;
      } else if (interaction.agentNames && interaction.agentNames.length > 0) {
        return interaction.agentNames[0];
      }
    }
    
    return agents[0]?.name || 'Agent_Helpdesk';
  };

  const agentName = getAgentNameFromInteraction();
  const status = agentData.find(a => a.agentName === agentName)?.availability || 'Live';
  const lastUpdated = 'Oct 24, 2025';
  const updatedBy = 'System';

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(selectedAgent === agentName ? null : agentName);
  };

  // Create a map of agent names to their sequence numbers
  const agentSequenceMap = useMemo(() => {
    const map = new Map<string, number>();
    let sequenceNumber = 1;
    
    // Track agents in order of their first appearance in the conversation
    effectiveConversationData.forEach(message => {
      if (message.speaker === 'agent' && message.agentName && !map.has(message.agentName)) {
        map.set(message.agentName, sequenceNumber);
        sequenceNumber++;
      }
    });
    
    return map;
  }, [effectiveConversationData]);

  // Determine which agent a customer message belongs to
  const getAgentForCustomerMessage = (messageIndex: number): string | null => {
    // Look backwards to find the most recent agent
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (effectiveConversationData[i].speaker === 'agent' && effectiveConversationData[i].agentName) {
        return effectiveConversationData[i].agentName!;
      }
    }
    // If no agent found before, look forward
    for (let i = messageIndex + 1; i < effectiveConversationData.length; i++) {
      if (effectiveConversationData[i].speaker === 'agent' && effectiveConversationData[i].agentName) {
        return effectiveConversationData[i].agentName!;
      }
    }
    return null;
  };

  const messageInSelectedAgentThread = (index: number, message: Message): boolean => {
    if (!selectedAgent) return true;
    if (message.speaker === 'agent') {
      return message.agentName === selectedAgent;
    }
    return getAgentForCustomerMessage(index) === selectedAgent;
  };

  /** Wall-clock span per agent segment, keyed by handoff header message index (for compact players). */
  const segmentDurationSecByHeaderIndex = useMemo(() => {
    const map = new Map<number, number>();
    const handoffs: number[] = [];
    effectiveConversationData.forEach((msg, idx) => {
      const isAgentHandoff =
        msg.speaker === 'agent' &&
        (idx === 0 ||
          effectiveConversationData[idx - 1].speaker !== 'agent' ||
          effectiveConversationData[idx - 1].agentName !== msg.agentName);
      if (isAgentHandoff && msg.agentName) {
        handoffs.push(idx);
      }
    });
    if (handoffs.length === 0) return map;

    const lengths = handoffs.map((start, s) => {
      const end =
        s + 1 < handoffs.length ? handoffs[s + 1] - 1 : effectiveConversationData.length - 1;
      return Math.max(1, end - start + 1);
    });
    const sumLen = lengths.reduce((a, b) => a + b, 0);

    handoffs.forEach((hi, s) => {
      map.set(hi, Math.max(15, Math.round((lengths[s] / sumLen) * INTERACTION_AUDIO_TOTAL_SEC)));
    });
    return map;
  }, [effectiveConversationData]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2">
        {hideHeader ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onBack}
              color="default"
              variant="tertiary"
              size={32}
              className={ck.textMuted}
              prefixIcon="arrow-left-bold"
            >
              Back to interactions
            </Button>
          </div>
        ) : (
          <PageHeader 
            agentName={agentName} 
            status={status as any}
            lastUpdated={lastUpdated}
            updatedBy={updatedBy}
            activeTab="Interactions"
            onTabChange={(tab) => {
               if (tab !== 'Interactions') {
                  window.location.hash = `/agent/${agentName}`;
               }
            }}
            onBack={onBack}
          />
        )}
      </div>

      <div
        className={`flex min-h-0 flex-1 overflow-hidden rounded-xl border ${ck.bgSurface} ${ck.text} ${ck.borderDefault}`}
      >
        {/* Left Side - Messages */}
        <div className={`flex min-h-0 flex-1 flex-col border-r ${ck.borderDefault}`}>

        {/* Search */}
        <div className={`p-4 border-b ${ck.borderDefault}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative w-[240px] max-w-full shrink-0">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${ck.textMuted}`}>
                <Icon name="search-bold" size={16} lengthUnit="px" aria-hidden />
              </span>
              <input
                type="text"
                placeholder="Search"
                className={`w-full bg-transparent border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none ${ck.borderDefault} ${ck.textMuted} focus:border-[var(--mds-color-theme-text-accent-normal)]`}
              />
            </div>
          </div>
        </div>

{/* Key Metrics removed */}

        {/* Agent Cards */}
        <div className="border-b border-[var(--mds-color-theme-outline-secondary-normal)] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {displayAgents.map((agent, index) => {
              const isAgentSelected = selectedAgent === agent.name;
              return (
              <div key={agent.name} className="flex items-center">
                <Button
                  type="button"
                  aria-pressed={isAgentSelected}
                  onClick={() => handleAgentClick(agent.name)}
                  color={isAgentSelected ? 'accent' : 'default'}
                  variant={isAgentSelected ? 'primary' : 'secondary'}
                  size={32}
                >
                  {agent.name}
                </Button>
                {index < displayAgents.length - 1 && (
                  <div className="px-2 flex-shrink-0">
                    <Icon
                      name="arrow-right-bold"
                      size={20}
                      lengthUnit="px"
                      className={ck.text}
                      aria-hidden
                    />
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
          {effectiveConversationData.map((message, index) => {
            if (!messageInSelectedAgentThread(index, message)) {
              return <Fragment key={message.id} />;
            }

            // Check if this is the first message from a new agent (agent handoff)
            const isAgentHandoff = message.speaker === 'agent' && 
              (index === 0 || 
                effectiveConversationData[index - 1].speaker !== 'agent' ||
                effectiveConversationData[index - 1].agentName !== message.agentName);
            
            // Get previous agent name for handoff display
            let previousAgent: string | null = null;
            if (isAgentHandoff && index > 0) {
              for (let i = index - 1; i >= 0; i--) {
                if (effectiveConversationData[i].speaker === 'agent' && effectiveConversationData[i].agentName) {
                  previousAgent = effectiveConversationData[i].agentName!;
                  break;
                }
              }
            }
            
            return (
              <div key={message.id}>
                {/* First agent header */}
                {isAgentHandoff && message.agentName && index === 0 && (
                  <div className="my-6 px-2.5">
                    <div className="bg-[var(--mds-color-theme-background-secondary-normal)] border border-[var(--mds-color-theme-outline-secondary-normal)] rounded-lg px-4 py-2 relative">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                          <span className={`mds-type-body-small-medium ${ck.text}`}>
                            {agentSequenceMap.get(message.agentName) || ''}.{' '}
                            {message.agentName.replace('Agent_', '')}
                          </span>
                        </div>
                        <InteractionSegmentPlayer
                          segmentKey={`h-${message.id}`}
                          durationSeconds={
                            segmentDurationSecByHeaderIndex.get(index) ??
                            Math.round(INTERACTION_AUDIO_TOTAL_SEC / Math.max(1, displayAgents.length))
                          }
                          activeSegmentKey={activeSegmentPlayerKey}
                          setActiveSegmentKey={setActiveSegmentPlayerKey}
                          openVolumeSegmentKey={openVolumeSegmentKey}
                          setOpenVolumeSegmentKey={setOpenVolumeSegmentKey}
                          playbackVolume={segmentPlaybackVolume}
                          onPlaybackVolumeChange={setSegmentPlaybackVolume}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Agent handoff header */}
                {isAgentHandoff && message.agentName && index > 0 && previousAgent && previousAgent !== message.agentName && (
                  <div className="my-6 px-2.5">
                    <div className="bg-[var(--mds-color-theme-background-secondary-normal)] border border-[var(--mds-color-theme-outline-secondary-normal)] rounded-lg px-4 py-2 relative">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
                          <span className={`mds-type-body-small-medium ${ck.text}`}>
                            {agentSequenceMap.get(previousAgent) || ''}. {previousAgent.replace('Agent_', '')}
                          </span>
                          <Icon
                            name="arrow-right-bold"
                            size={12}
                            lengthUnit="px"
                            className={ck.text}
                            aria-hidden
                          />
                          <span className={`mds-type-body-small-medium ${ck.text}`}>
                            {agentSequenceMap.get(message.agentName) || ''}. {message.agentName.replace('Agent_', '')}
                          </span>
                        </div>
                        <InteractionSegmentPlayer
                          segmentKey={`h-${message.id}`}
                          durationSeconds={
                            segmentDurationSecByHeaderIndex.get(index) ??
                            Math.round(INTERACTION_AUDIO_TOTAL_SEC / Math.max(1, displayAgents.length))
                          }
                          activeSegmentKey={activeSegmentPlayerKey}
                          setActiveSegmentKey={setActiveSegmentPlayerKey}
                          openVolumeSegmentKey={openVolumeSegmentKey}
                          setOpenVolumeSegmentKey={setOpenVolumeSegmentKey}
                          playbackVolume={segmentPlaybackVolume}
                          onPlaybackVolumeChange={setSegmentPlaybackVolume}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-2 py-1 px-0">
                  <div
                    className={`flex items-end gap-2 px-2.5 ${message.speaker === 'agent' ? 'justify-end' : ''}`}
                  >
                    {message.speaker === 'customer' && (
                      <div className="pb-2">
                        <Avatar type="customer" />
                      </div>
                    )}
                    
                    <div 
                      className={`flex flex-col gap-1.5 cursor-pointer transition-all max-w-[600px] ${
                        message.speaker === 'customer'
                          ? 'opacity-100'
                          : selectedMessage?.id === message.id
                            ? 'opacity-100'
                            : 'opacity-90 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div
                        className={
                          message.speaker === 'agent'
                            ? `min-w-0 w-fit max-w-[600px] box-border bg-[var(--mds-color-theme-background-solid-secondary-normal)] border px-2 py-0 ${ck.borderDefault} ${ck.chatBubbleAgent}`
                            : `min-w-0 w-fit max-w-[600px] box-border bg-[var(--mds-color-theme-background-solid-secondary-normal)] border px-2 py-0 ${ck.borderDefault} ${ck.chatBubbleCustomer}`
                        }
                      >
                        <p className={`my-0 mds-type-body-midsize-regular ${ck.text}`}>{message.text}</p>
                      </div>

                    </div>

                    {message.speaker === 'agent' && (
                      <div className="pb-2">
                        <Avatar type="agent" />
                      </div>
                   )}


                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>

      {/* Right Side - Details */}
      <div
        className={`w-[400px] shrink-0 border-l ${ck.bgSurface} ${ck.borderDefault} min-h-0 overflow-y-auto`}
      >
        {/* Interaction Details */}
        <div className={`p-4 border-b ${ck.borderDefault}`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${ck.textMuted}`}>Status</span>
              <span className="inline-flex items-center">
                <AlertChip
                  variant={
                    interaction?.statusType === 'failed'
                      ? 'error'
                      : interaction?.statusType === 'handoff'
                        ? 'warning'
                        : 'success'
                  }
                  label={
                    interaction ? interaction.statusSublabel || interaction.statusLabel : 'Completed'
                  }
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">Consumer ID</span>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)] text-right font-mono">abc123456-abc123456</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">Total Messages</span>
              <span className="inline-flex items-center">
                <AlertChip variant="neutral" label={String(interaction?.messages ?? 14)} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">Date/Time</span>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">{interaction?.timestamp ? `${interaction.timestamp}, Mar 11, 2025` : '08:12 AM—08:15AM, Mar 11, 2025'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon
                  name="favorite-bold"
                  size={14}
                  lengthUnit="px"
                  className="text-[var(--mds-color-theme-text-secondary-normal)]"
                  aria-hidden
                />
                <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">CSAT</span>
              </div>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">4.8/5</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon
                  name="clock-bold"
                  size={14}
                  lengthUnit="px"
                  className="text-[var(--mds-color-theme-text-secondary-normal)]"
                  aria-hidden
                />
                <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">Time to resolution</span>
              </div>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">{interaction?.duration || '12m 45s'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon
                  name="heart-bold"
                  size={14}
                  lengthUnit="px"
                  className="text-[var(--mds-color-theme-text-secondary-normal)]"
                  aria-hidden
                />
                <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">Sentiment</span>
              </div>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">Positive</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon
                  name="lightning-bold"
                  size={14}
                  lengthUnit="px"
                  className="text-[var(--mds-color-theme-text-secondary-normal)]"
                  aria-hidden
                />
                <span className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">First Response</span>
              </div>
              <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">45s</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--mds-color-theme-outline-secondary-normal)] flex items-center justify-between">
          <h2 className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">Actions</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              color="default"
              variant="secondary"
              size={24}
              prefixIcon="download-bold"
            >
              Download
            </Button>
            <Button
              type="button"
              color="default"
              variant="secondary"
              size={24}
              onClick={() =>
                setExpandedSections({
                  slotFilling: false,
                  fulfillment: false,
                  serviceFlow: false,
                  fulfillmentOutput: false,
                })
              }
            >
              Collapse all
            </Button>
          </div>
        </div>

        {selectedMessage ? (
          <div className="p-0">
            <AccordionGroup allowMultiple variant="borderless" size="small">
              <AccordionButton
                headerText="Slot filling"
                expanded={expandedSections.slotFilling}
                onShown={handleDetailSectionShown('slotFilling')}
                open-button-aria-label="Expand slot filling section"
                close-button-aria-label="Collapse slot filling section"
              >
                <div className="space-y-3 px-3">
                  {selectedMessage.slotFilling ? (
                    <>
                      <div className="border border-[var(--mds-color-theme-outline-secondary-normal)] rounded-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[var(--mds-color-theme-text-primary-normal)]">{selectedMessage.slotFilling.article}</span>
                          <Icon name="arrow-down-bold" size={16} lengthUnit="px" className="text-[var(--mds-color-theme-text-secondary-normal)]" aria-hidden />
                        </div>
                        <input
                          type="text"
                          value={selectedMessage.slotFilling.match}
                          readOnly
                          className="w-full bg-transparent border border-[var(--mds-color-theme-outline-secondary-normal)] rounded px-2 py-1 text-sm text-[var(--mds-color-theme-text-primary-normal)]"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--mds-color-theme-text-secondary-normal)] mb-1">• Not helpful: {selectedMessage.slotFilling.notHelpful}</p>
                        <p className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">• Agent: {selectedMessage.slotFilling.agent}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <input type="checkbox" className="w-3 h-3" />
                          <span className="text-xs text-[var(--mds-color-theme-text-secondary-normal)]">Agent handover</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">
                      No slot filling data for this message.
                    </p>
                  )}
                </div>
              </AccordionButton>

              <Accordion
                headerText="Fulfillment"
                expanded={expandedSections.fulfillment}
                onShown={handleDetailSectionShown('fulfillment')}
                open-button-aria-label="Expand fulfillment section"
                close-button-aria-label="Collapse fulfillment section"
              >
                <span slot="trailing-controls" className="inline-flex items-center">
                  <AlertChip variant="success" label="Success (4.1s)" />
                </span>
                <div className="text-sm text-[var(--mds-color-theme-text-secondary-normal)]">
                  Fulfillment completed in 4.1 seconds.
                </div>
              </Accordion>

              <AccordionButton
                headerText="Service and flow info"
                expanded={expandedSections.serviceFlow}
                onShown={handleDetailSectionShown('serviceFlow')}
                open-button-aria-label="Expand service and flow info"
                close-button-aria-label="Collapse service and flow info"
              >
                <div>
                  <p className="mt-0 mb-1 text-sm text-[var(--mds-color-theme-text-secondary-normal)]">• Copy</p>
                  <p className="mt-0 mb-0 text-sm text-[var(--mds-color-theme-text-secondary-normal)]">• Copy</p>
                </div>
              </AccordionButton>

              <AccordionButton
                headerText="Fulfillment output"
                expanded={expandedSections.fulfillmentOutput}
                onShown={handleDetailSectionShown('fulfillmentOutput')}
                open-button-aria-label="Expand fulfillment output"
                close-button-aria-label="Collapse fulfillment output"
              >
                <div className="px-3 pb-3 space-y-2">
                  <span className="block text-sm text-[var(--mds-color-theme-text-secondary-normal)]">• Transaction ID: 12345678</span>
                  <p className="mt-0 mb-0 text-sm text-[var(--mds-color-theme-text-secondary-normal)]">• Size: 1.5 MB</p>
                  <Button type="button" color="default" variant="secondary" size={24}>
                    View transaction
                  </Button>
                </div>
              </AccordionButton>
            </AccordionGroup>
          </div>
        ) : (
          <div className="p-4 text-center text-[var(--mds-color-theme-text-secondary-normal)] text-sm">
            Click on a message to view details
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
