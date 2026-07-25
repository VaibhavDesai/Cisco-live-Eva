import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AiConversation from '../../../components/shared/ai/AiConversation';
import AiWelcome from '../../../components/shared/ai/AiWelcome';
import AiSymbol from '../../../components/shared/ai/AiSymbol';
import Icon from '../../../components/shared/Icon';
import { sendEvaChat, type ChatMessage } from '../../../api/ciscoAi';
import { CISCO_LIVE_AGENTS } from '../../../demo/ciscoLiveDemo';

interface PanelMessage {
  role: 'user' | 'ai';
  text: string;
  warning?: boolean;
}

type CiscoLiveAgent = (typeof CISCO_LIVE_AGENTS)[number];

const SUGGESTIONS = [
  'Summarize this agent\u2019s configuration',
  'How do I add a guardrail?',
  'What does containment rate measure?',
  'Draft a welcome message for my agent',
];

const SYSTEM_PROMPT =
  'You are the Webex AI Agent Studio assistant. Help the user configure, understand, and operate their AI agents (profile, channels, instructions, knowledge, actions, guardrails, and observability). Be concise, practical, and friendly.';

/* Parses the agent id out of an `/agents/:id/...` route (the panel lives outside
   the router's <Routes>, so it can't use useParams). Mirrors Sidebar.parseAgentId. */
function parseAgentId(pathname: string): string | null {
  const match = pathname.match(/^\/agents\/([^/]+)/);
  if (!match || match[1] === 'eva-canvas') return null;
  return match[1];
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/* Reconstructs the home-page creation conversation that produced this agent so
   the side panel opens as a continuation of that chat rather than a cold start.
   Derived from the seeded demo data so the recap stays truthful per agent. */
function buildCreationTranscript(agent: CiscoLiveAgent): PanelMessage[] {
  const goals = agent.goals.map(goal => `\u2022 ${goal}`).join('\n');
  const knowledge = agent.knowledgeBases.join(', ');
  const actions = agent.actions.slice(0, 4).join(', ');
  const guardrail = agent.customGuardrails[0];

  const proposal = [
    `Perfect \u2014 I\u2019ve drafted \u201c${agent.name}\u201d for you. Here\u2019s what it can do:`,
    goals,
    `Knowledge I connected: ${knowledge}.`,
    `Actions available: ${actions}.`,
    guardrail ? `Guardrail added: ${guardrail.name} \u2014 ${lowerFirst(guardrail.description)}` : '',
    `Welcome message: \u201c${agent.welcomeMessage}\u201d`,
    'You can refine any of this from the Configure sections on the left.',
  ]
    .filter(Boolean)
    .join('\n');

  const transcript: PanelMessage[] = [
    { role: 'user', text: `I want to build an agent that ${lowerFirst(agent.description)}` },
    { role: 'ai', text: proposal },
  ];

  if (guardrail) {
    transcript.push(
      { role: 'user', text: `Add a guardrail for ${guardrail.name.toLowerCase()}.` },
      { role: 'ai', text: `Added \u2014 \u201c${guardrail.name}\u201d. ${guardrail.description}` },
    );
  }

  return transcript;
}

export interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AiAssistantPanel({ open, onClose }: AiAssistantPanelProps) {
  const location = useLocation();
  const agentId = parseAgentId(location.pathname);
  const demoAgent = agentId ? CISCO_LIVE_AGENTS.find(candidate => candidate.id === agentId) : undefined;

  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [processing, setProcessing] = useState(false);

  /* Seed the panel with the mocked creation conversation for the active demo
     agent (and re-seed when switching agents). Non-demo/agent-less routes fall
     back to the generic welcome. */
  useEffect(() => {
    setMessages(demoAgent ? buildCreationTranscript(demoAgent) : []);
    // Keyed on agentId only so an in-progress chat within one agent is preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Close on Escape while the panel is open.
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || processing) return;

      const nextMessages: PanelMessage[] = [...messages, { role: 'user', text: trimmed }];
      setMessages(nextMessages);
      setProcessing(true);

      try {
        const history: ChatMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...nextMessages.map(
            (message): ChatMessage => ({
              role: message.role === 'ai' ? 'assistant' : 'user',
              content: message.text,
            }),
          ),
        ];
        const reply = await sendEvaChat(history);
        setMessages(prev => [...prev, { role: 'ai', text: reply || 'I did not get a response. Please try again.' }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'The assistant is unavailable right now.';
        setMessages(prev => [...prev, { role: 'ai', text: message, warning: true }]);
      } finally {
        setProcessing(false);
      }
    },
    [messages, processing],
  );

  return (
    <aside
      className={`ai-side-panel${open ? ' ai-side-panel--open' : ''}`}
      role="dialog"
      aria-label="AI Assistant"
      aria-hidden={!open}
    >
      <header className="ai-side-panel__header">
        <div className="ai-side-panel__title">
          <AiSymbol size={24} state="static" />
          <span>AI Assistant</span>
        </div>
        <div className="ai-side-panel__header-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="ai-side-panel__icon-btn"
              aria-label="New chat"
              onClick={() => setMessages([])}
            >
              <Icon name="plus-bold" size={20} />
            </button>
          )}
          <button
            type="button"
            className="ai-side-panel__icon-btn"
            aria-label="Close AI Assistant"
            onClick={onClose}
          >
            <Icon name="cancel-bold" size={20} />
          </button>
        </div>
      </header>

      <div className="ai-side-panel__body">
        <AiConversation
          messages={messages}
          onSend={handleSend}
          processing={processing}
          suggestions={[]}
          welcomeScreen={
            messages.length === 0 ? (
              <AiWelcome firstTime suggestions={SUGGESTIONS} onSelectSuggestion={handleSend} />
            ) : null
          }
        />
      </div>
    </aside>
  );
}
