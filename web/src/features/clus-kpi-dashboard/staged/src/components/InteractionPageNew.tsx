import { Fragment, useEffect, useMemo, useState } from 'react';
import { AccordionGroup, AccordionButton, Accordion } from '@momentum-design/components/react';
import { ChevronDown, Star, Clock, Heart, Zap, ArrowRightLeft, MoreHorizontal, Eye, FlaskConical, FileText, Ban, ArrowLeft } from 'lucide-react';
import { AlertChip, Button } from '../../../momentum';
import { ck } from '../../../clus-kpi-theme';
import { agentData } from './AgentTable';
import { baseInteractions, Interaction } from './RecentInteractions';
import { PageHeader } from './PageHeader';
import svgPaths from '../imports/svg-a9hcy74n3g';
import audioSvgPaths from '../imports/svg-gqj7elh1jk';
import handoffSvgPaths from '../imports/svg-jfhb59xspc';

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

function Microphone() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 28 28">
      <path d={svgPaths.p28858080} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function ParticipantIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
      <path d={svgPaths.p11e2ce00} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
      <path d={svgPaths.p3fdf3300} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p5755900} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p1f76880} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p8805a80} fill="white" fillOpacity="0.95" />
      <path d={svgPaths.p6f8b980} fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function Avatar({ type }: { type: 'customer' | 'agent' }) {
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{
      backgroundColor: type === 'customer' ? '#545454' : '#08599C'
    }}>
      {type === 'customer' ? <ParticipantIcon /> : <BotIcon />}
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 240; // 4:00 in seconds

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
  const [activeTab, setActiveTab] = useState('Interactions');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(Math.floor(percentage * totalDuration));
  };

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6">
        {hideHeader ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to interactions</span>
            </button>
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

      <div className="flex min-h-0 flex-1 overflow-hidden border border-gray-800 rounded-xl bg-black text-white">
        {/* Left Side - Messages */}
        <div className="flex min-h-0 flex-1 flex-col border-r border-[rgba(255,255,255,0.1)]">

        {/* Search and Audio Player */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[260px] relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d={svgPaths.p36e6200} fill="white" fillOpacity="0.95" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[rgba(255,255,255,0.7)] focus:outline-none focus:border-[rgba(255,255,255,0.7)]"
              />
            </div>
            
            {/* Audio Player */}
            <div className="bg-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 flex items-center gap-3 min-w-[450px]">
              {/* Play/Pause Button */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:opacity-80 transition-opacity"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                    <rect x="3" y="2" width="4" height="12" rx="1" />
                    <rect x="9" y="2" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                    <path d="M4 2.5L13 8L4 13.5V2.5Z" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <span className="text-sm text-[rgba(255,255,255,0.95)] whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>

              {/* Progress Bar */}
              <div 
                className="flex-1 relative h-1 bg-[rgba(255,255,255,0.2)] rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute h-full bg-[rgba(255,255,255,0.6)] rounded-full transition-all"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>

              {/* Speaker Icon */}
              <button className="hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                  <path d="M8 3.5L5 6H2v4h3l3 2.5V3.5z" />
                  <path d="M10.5 5.5c.5.5.8 1.2.8 2s-.3 1.5-.8 2M12 4c1 1 1.5 2.3 1.5 4s-.5 3-1.5 4" stroke="white" fill="none" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Speed Icon */}
              <button className="hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 4v4l3 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

{/* Key Metrics removed */}

        {/* Agent Cards */}
        <div className="border-b border-[rgba(255,255,255,0.1)] px-5 py-4">
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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
                    <div className="bg-[rgba(255,255,255,0.11)] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-[8px] relative">
                      <div className="flex gap-2 items-center justify-center">
                        <span className="mds-type-body-small-medium text-[rgba(255,255,255,0.95)]">
                          {agentSequenceMap.get(message.agentName) || ''}. {message.agentName.replace('Agent_', '')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Agent handoff header */}
                {isAgentHandoff && message.agentName && index > 0 && previousAgent && previousAgent !== message.agentName && (
                  <div className="my-6 px-2.5">
                    <div className="bg-[rgba(255,255,255,0.11)] border border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-[8px] relative">
                      <div className="flex gap-2 items-center justify-center">
                        <span className="mds-type-body-small-medium text-[rgba(255,255,255,0.95)]">
                          {agentSequenceMap.get(previousAgent) || ''}. {previousAgent.replace('Agent_', '')}
                        </span>
                        <div className="shrink-0 w-4 h-4">
                          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 11">
                            <path d={handoffSvgPaths.p76fb300} fill="white" fillOpacity="0.95" />
                          </svg>
                        </div>
                        <span className="mds-type-body-small-medium text-[rgba(255,255,255,0.95)]">
                          {agentSequenceMap.get(message.agentName) || ''}. {message.agentName.replace('Agent_', '')}
                        </span>
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
                        className={`min-w-0 w-fit max-w-[600px] box-border border border-[rgba(255,255,255,0.2)] bg-[#1a1a1a] p-2 ${
                          message.speaker === 'agent' ? ck.chatBubbleAgent : ck.chatBubbleCustomer
                        }`}
                      >
                        <p className="my-0 mds-type-body-midsize-regular text-[rgba(255,255,255,0.95)]">{message.text}</p>
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
      <div className="w-[400px] shrink-0 min-h-0 overflow-y-auto border-l border-[rgba(255,255,255,0.1)] bg-black">
        {/* Interaction Details */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgba(255,255,255,0.5)]">Status</span>
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
              <span className="text-sm text-[rgba(255,255,255,0.5)]">Consumer ID</span>
              <span className="text-sm text-[rgba(255,255,255,0.95)] text-right font-mono">abc123456-abc123456</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgba(255,255,255,0.5)]">Total Messages</span>
              <span className="inline-flex items-center">
                <AlertChip variant="neutral" label={String(interaction?.messages ?? 14)} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[rgba(255,255,255,0.5)]">Date/Time</span>
              <span className="text-sm text-[rgba(255,255,255,0.95)]">{interaction?.timestamp ? `${interaction.timestamp}, Mar 11, 2025` : '08:12 AM—08:15AM, Mar 11, 2025'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
                <span className="text-sm text-[rgba(255,255,255,0.5)]">CSAT</span>
              </div>
              <span className="text-sm text-[rgba(255,255,255,0.95)]">4.8/5</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
                <span className="text-sm text-[rgba(255,255,255,0.5)]">Time to resolution</span>
              </div>
              <span className="text-sm text-[rgba(255,255,255,0.95)]">{interaction?.duration || '12m 45s'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
                <span className="text-sm text-[rgba(255,255,255,0.5)]">Sentiment</span>
              </div>
              <span className="text-sm text-[rgba(255,255,255,0.95)]">Positive</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
                <span className="text-sm text-[rgba(255,255,255,0.5)]">First Response</span>
              </div>
              <span className="text-sm text-[rgba(255,255,255,0.95)]">45s</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
          <h2 className="text-sm text-[rgba(255,255,255,0.95)]">Actions</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              color="default"
              variant="tertiary"
              size={32}
              prefixIcon="download-bold"
            >
              Download
            </Button>
            <Button
              type="button"
              color="default"
              variant="tertiary"
              size={32}
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
                <div className="space-y-3 px-3 pb-3">
                  {selectedMessage.slotFilling ? (
                    <>
                      <div className="border border-[rgba(255,255,255,0.1)] rounded-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[rgba(255,255,255,0.95)]">{selectedMessage.slotFilling.article}</span>
                          <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.7)]" />
                        </div>
                        <input
                          type="text"
                          value={selectedMessage.slotFilling.match}
                          readOnly
                          className="w-full bg-transparent border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-sm text-[rgba(255,255,255,0.95)]"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-[rgba(255,255,255,0.7)] mb-1">• Not helpful: {selectedMessage.slotFilling.notHelpful}</p>
                        <p className="text-sm text-[rgba(255,255,255,0.7)]">• Agent: {selectedMessage.slotFilling.agent}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <input type="checkbox" className="w-3 h-3" />
                          <span className="text-xs text-[rgba(255,255,255,0.5)]">Agent handover</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[rgba(255,255,255,0.5)]">No slot filling data for this message.</p>
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
                <div className="px-3 pb-3 text-sm text-[rgba(255,255,255,0.7)]">Fulfillment completed in 4.1 seconds.</div>
              </Accordion>

              <AccordionButton
                headerText="Service and flow info"
                expanded={expandedSections.serviceFlow}
                onShown={handleDetailSectionShown('serviceFlow')}
                open-button-aria-label="Expand service and flow info"
                close-button-aria-label="Collapse service and flow info"
              >
                <div className="px-3 pb-3">
                  <p className="text-sm text-[rgba(255,255,255,0.7)]">• Copy</p>
                  <p className="text-sm text-[rgba(255,255,255,0.7)]">• Copy</p>
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[rgba(255,255,255,0.7)]">• Transaction ID: 12345678</span>
                    <Button type="button" color="accent" variant="tertiary" size={28}>
                      View transaction
                    </Button>
                  </div>
                  <p className="mt-0 mb-0 text-sm text-[rgba(255,255,255,0.7)]">• Size: 1.5 MB</p>
                </div>
              </AccordionButton>
            </AccordionGroup>
          </div>
        ) : (
          <div className="p-4 text-center text-[rgba(255,255,255,0.5)] text-sm">
            Click on a message to view details
          </div>
        )}
      </div>
    </div>
    </div>
  );
}