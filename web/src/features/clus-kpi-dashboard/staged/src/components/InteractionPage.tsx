import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  speaker: 'customer' | 'agent';
  text: string;
  timestamp: string;
  actions?: string[];
  knowledge?: string[];
}

const conversationData: Message[] = [
  {
    id: '1',
    speaker: 'customer',
    text: 'Hi, I need to schedule an appointment with a doctor.',
    timestamp: '00:00',
    actions: [],
    knowledge: []
  },
  {
    id: '2',
    speaker: 'agent',
    text: 'Hello! I\'d be happy to help you schedule an appointment. May I have your name and date of birth?',
    timestamp: '00:03',
    actions: ['Greeted customer', 'Requested patient information'],
    knowledge: ['Patient verification protocol', 'HIPAA compliance guidelines']
  },
  {
    id: '3',
    speaker: 'customer',
    text: 'Sure, my name is Sarah Johnson and my date of birth is March 15, 1985.',
    timestamp: '00:12',
    actions: [],
    knowledge: []
  },
  {
    id: '4',
    speaker: 'agent',
    text: 'Thank you, Sarah. I found your record in our system. What type of appointment are you looking to schedule?',
    timestamp: '00:18',
    actions: ['Verified patient identity', 'Retrieved patient record'],
    knowledge: ['Patient database access', 'Account verification procedures']
  },
  {
    id: '5',
    speaker: 'customer',
    text: 'I need a general check-up. It\'s been over a year since my last visit.',
    timestamp: '00:25',
    actions: [],
    knowledge: []
  },
  {
    id: '6',
    speaker: 'agent',
    text: 'I can help you with that. We have availability with Dr. Martinez next Tuesday at 2:30 PM or Thursday at 10:00 AM. Which would work better for you?',
    timestamp: '00:32',
    actions: ['Checked appointment availability', 'Offered time slots'],
    knowledge: ['Provider schedules', 'Appointment booking system', 'General check-up requirements']
  },
  {
    id: '7',
    speaker: 'customer',
    text: 'Tuesday at 2:30 works perfectly for me.',
    timestamp: '00:42',
    actions: [],
    knowledge: []
  },
  {
    id: '8',
    speaker: 'agent',
    text: 'Great! I\'ve scheduled your general check-up with Dr. Martinez for Tuesday, November 28th at 2:30 PM. You\'ll receive a confirmation email shortly. Is there anything else I can help you with?',
    timestamp: '00:48',
    actions: ['Created appointment', 'Sent confirmation email'],
    knowledge: ['Appointment confirmation procedures', 'Email notification system']
  },
  {
    id: '9',
    speaker: 'customer',
    text: 'No, that\'s all. Thank you so much!',
    timestamp: '01:02',
    actions: [],
    knowledge: []
  },
  {
    id: '10',
    speaker: 'agent',
    text: 'You\'re welcome, Sarah! We look forward to seeing you on Tuesday. Have a great day!',
    timestamp: '01:05',
    actions: ['Closed interaction successfully'],
    knowledge: ['Closing protocol', 'Customer service best practices']
  }
];

interface Agent {
  name: string;
  type: string;
}

export function InteractionPage({ 
  interactionId,
  agents = [
    { name: 'Agent_Helpdesk', type: 'Primary' },
    { name: 'Agent_Support', type: 'Secondary' },
    { name: 'Agent_Technical', type: 'Specialist' }
  ],
  onBack
}: { 
  interactionId: string;
  agents?: Agent[];
  onBack?: () => void;
}) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalDuration = 68; // 1:08 in seconds

  // Key metrics for the interaction
  const keyMetrics = [
    { label: 'CSAT', value: '4.5', unit: '/5' },
    { label: 'Turns', value: '10', unit: '' },
    { label: 'Duration', value: '1:08', unit: '' },
    { label: 'Resolution', value: '100', unit: '%' },
    { label: 'Response Time', value: '2.3', unit: 's' },
    { label: 'Transfers', value: '0', unit: '' }
  ];

  // Generate speaker bars based on messages
  const speakerBars = conversationData.map(msg => {
    const timeInSeconds = parseInt(msg.timestamp.split(':')[0]) * 60 + parseInt(msg.timestamp.split(':')[1]);
    const nextMsg = conversationData[conversationData.indexOf(msg) + 1];
    const endTime = nextMsg ? parseInt(nextMsg.timestamp.split(':')[0]) * 60 + parseInt(nextMsg.timestamp.split(':')[1]) : totalDuration;
    
    return {
      speaker: msg.speaker,
      start: timeInSeconds,
      end: endTime,
      percentage: (timeInSeconds / totalDuration) * 100,
      width: ((endTime - timeInSeconds) / totalDuration) * 100
    };
  });

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control actual audio playback
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.floor(percentage * totalDuration);
    setCurrentTime(Math.max(0, Math.min(totalDuration, newTime)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Back button */}
      <button
        onClick={onBack ? onBack : () => window.history.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </button>

      {/* Interaction ID */}
      <h1 className="text-white text-2xl mb-6">Interaction {interactionId}</h1>

      {/* Agent Cards */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4">
        {agents.map((agent, index) => (
          <div key={agent.name} className="flex items-center gap-4">
            <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-lg p-4 min-w-[200px]">
              <div className="text-white font-medium mb-1">{agent.name}</div>
              <div className="text-gray-400 text-sm">{agent.type}</div>
            </div>
            {index < agents.length - 1 && (
              <ArrowRight className="w-6 h-6 text-gray-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="bg-black/40 border border-[rgba(255,255,255,0.1)] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
              <div className="text-2xl text-white">{metric.value}<span className="text-lg text-gray-400">{metric.unit}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recording & Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Player */}
          <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-lg p-6">
            <h2 className="text-white mb-4">Recording</h2>
            
            {/* Timeline with speaker bars */}
            <div 
              className="relative h-16 bg-black/40 rounded-lg mb-4 overflow-hidden cursor-pointer hover:bg-black/50 transition-colors" 
              onClick={handleTimelineClick}
            >
              {speakerBars.map((bar, index) => (
                <div
                  key={index}
                  className={`absolute h-full pointer-events-none ${
                    bar.speaker === 'customer' ? 'bg-blue-500/60' : 'bg-green-500/60'
                  }`}
                  style={{
                    left: `${bar.percentage}%`,
                    width: `${bar.width}%`
                  }}
                />
              ))}
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 w-3 h-3 bg-white rounded-full shadow-lg" />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/60 rounded" />
                <span className="text-sm text-gray-400">Customer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/60 rounded" />
                <span className="text-sm text-gray-400">Agent</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-white" />
                    <div className="w-1 h-4 bg-white" />
                  </div>
                ) : (
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                )}
              </button>
              <div className="flex-1 text-sm text-gray-400">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-lg p-6">
            <h2 className="text-white mb-4">Transcript</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {conversationData.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`flex ${message.speaker === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] p-4 cursor-pointer transition-all ${
                      message.speaker === 'customer' ? 'rounded-lg' : 'rounded-[12px_12px_0px_12px]'
                    } ${
                      selectedMessage?.id === message.id
                        ? message.speaker === 'customer'
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-green-500/20 border border-green-500/50'
                        : message.speaker === 'customer'
                          ? 'bg-blue-900/30 border border-blue-700/30 hover:border-blue-500/50'
                          : 'bg-green-900/30 border border-green-700/30 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium text-sm ${
                        message.speaker === 'customer' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {message.speaker === 'customer' ? 'Customer' : 'Agent'}
                      </span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-300">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Interaction Details */}
        <div className="space-y-6">
          <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-lg p-6 sticky top-6">
            <h2 className="text-white mb-4">Interaction Details</h2>
            
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Actions Section */}
                <div>
                  <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">Actions</h3>
                  {selectedMessage.actions && selectedMessage.actions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMessage.actions.map((action, index) => (
                        <div
                          key={index}
                          className="bg-black/40 border border-[rgba(255,255,255,0.1)] rounded-lg p-3"
                        >
                          <div className="text-sm text-gray-300">{action}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">No actions for this message</div>
                  )}
                </div>

                {/* Knowledge Section */}
                <div>
                  <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">Knowledge</h3>
                  {selectedMessage.knowledge && selectedMessage.knowledge.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMessage.knowledge.map((item, index) => (
                        <div
                          key={index}
                          className="bg-black/40 border border-[rgba(255,255,255,0.1)] rounded-lg p-3"
                        >
                          <div className="text-sm text-gray-300">{item}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">No knowledge items for this message</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">
                Click on a message in the transcript to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}