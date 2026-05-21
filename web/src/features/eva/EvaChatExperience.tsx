import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import Button from '../../components/shared/Button';
import { AccordionGroup, AccordionItem, AiFooter, AiResponseMessage, AiThreadPanel, AiUserMessage, Badge, Banner, Card, Dropdown, Input, MenuItem, MenuOverlay, Modal, ModalBody, ModalFooter, ModalHeader, Radio, RadioGroup, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, TextLink, Toggle, useMenu } from '../../components/shared';
import { AgentCard } from '../../components/agents';
import { Icon } from '../../icons';
import EvaHeroAnimation from './EvaHeroAnimation';
import {
  EVA_CANVAS_AGENTS_PATH,
  EVA_CANVAS_DASHBOARD_PATH,
  EVA_CANVAS_NEW_THREAD_FLAG,
  EVA_CANVAS_ORIGIN_PATH_KEY,
  EVA_CANVAS_PATHS,
} from './EvaCanvasOverlay';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft, EvaFieldSuggestion, EvaMessage, EvaTemplateId } from './types';
import { formatRelative } from '../../pages/knowledge/utils';
import { getElevenLabsConversationSignedUrl, getVoicePreviewErrorMessage, optimizeInstructions, sendEvaChat } from '../../api/ciscoAi';
import {
  FIELD_SUGGESTION_RESPONSE_RULES,
  extractFieldSuggestionAndProse,
  getFieldSuggestionLabel,
} from './evaSuggestion';
import {
  CHANNEL_PHONE_NUMBER_OPTIONS,
  DIGITAL_CHANNEL_DETAILS,
  DIGITAL_CHANNEL_OPTIONS,
  EVA_CHANNEL_SELECTION_OPTIONS,
  EVA_ACTION_ROWS,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_AUTO_START_VOICE_PREVIEW_KEY,
  EVA_PLANNING_ROWS,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  EVA_STEP_ORDER,
  INSTRUCTION_EXAMPLES,
  INSTRUCTION_TIPS,
  PROFILE_LANGUAGE_OPTIONS,
  PROFILE_TIMEZONE_OPTIONS,
  PROFILE_VOICE_OPTIONS,
  STARTER_PROMPTS,
  buildGuidanceMessage,
  buildInstructionPrompt,
  buildWelcomeMessage,
  isOrchestrationIntent,
  normalizeEvaChannelSelections,
  normalizeEvaDigitalChannelSelections,
  readEvaSessionState,
  sensitivityToValue,
  summarizeInstructionPrompt,
  valueToSensitivity,
  type EvaChannelSelection,
  type EvaChannelType,
  type EvaConversationalOnboardingStep,
  type EvaConversationStep,
  type EvaDigitalChannel,
  type EvaDirection,
  type EvaEnforcement,
  type EvaLandingMode,
  type EvaSecurityTier,
  type EvaSensitivity,
  type EvaSessionState,
  type EvaThread,
} from './evaFormConfig';

const gradient = 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass-light))';

type EvaVoiceCallStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';

type EvaVoicePreviewSocketMessage = {
  type?: string;
  audio_event?: { audio_base_64?: string };
  ping_event?: { event_id?: number };
  conversation_initiation_metadata_event?: {
    agent_output_audio_format?: string;
    conversation_id?: string;
  };
  agent_response_event?: {
    agent_response?: string;
  };
  agent_response_correction_event?: {
    corrected_agent_response?: string;
    agent_response?: string;
  };
  user_transcription_event?: {
    user_transcript?: string;
  };
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatPreviewTranscriptTime(timestamp?: string) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function downsampleTo16Khz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }
    output[i] = count > 0 ? sum / count : 0;
  }
  return output;
}

function float32ToPcm16Base64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return arrayBufferToBase64(buffer);
}

/* System prompt for the Cisco LLM fallback in the main Eva chat. Used
   when the user's message doesn't match any deterministic intent
   (template starter, section jump, orchestration request, etc.) so the
   reply still feels like Eva and stays anchored to the agent-design
   workflow rather than wandering into general chitchat. */
/* System prompt for the Cisco LLM call in the chat-based variation. We
   mirror the form-builder behavior here: free-typed input always goes
   to the LLM, and when the user describes a real agent the LLM emits
   a JSON `options` block listing 3–4 concrete starter prompts. Those
   become clickable follow-up chips below the reply. Each option must
   contain a template trigger keyword so a click trips the deterministic
   template router in `handleLlmFollowupClick` and launches the guided
   build flow. The keyword list mirrors the matcher in that handler. */
const EVA_SYSTEM_PROMPT = `You are AI Assistant, a conversational AI assistant inside Webex AI Agent Studio. You help product designers and admins design AI agents — defining purpose, knowledge sources, available actions, security policies, voice, and language settings.

Available starter templates (and the trigger keywords that launch the guided build flow): Receptionist (keywords: "receptionist", "appointment", "reminder", "support"), Customer Concierge (keywords: "concierge", "customer", "request"), Help Desk (keywords: "help desk", "employee", "password", "PTO"), Order Management (keywords: "order", "tracking", "delivery", "returns"), Sales enablement (keyword: "sales").

Guidelines:
- Keep replies concise (2–4 sentences). Be specific and actionable.
- When the user describes an agent that fits one of the templates, recommend that template AND offer 3–4 concrete variations as clickable options. Each option's wording MUST contain the template's trigger keyword so clicking it launches the guided build flow.
- Format the options as a JSON code block at the very end of your reply, like this:
\`\`\`json
{ "options": ["Customer support agent for insurance claims", "Customer support agent for policy questions", "Customer support agent for appointment scheduling"] }
\`\`\`
- Each option must be under 8 words and read naturally as a user message.
- Do NOT include the JSON block when you are just answering a question, debating trade-offs, or chitchatting. Only emit it when you are recommending a template.
- For pure questions ("what's the difference between X and Y", "how do guardrails work"), just answer directly with no JSON.
- Never invent UI commands or features. If the user asks how to do something specific in the product and you're not sure, say so and suggest they explore the Profile, Knowledge, Action, or Security panels.
- If the user clearly wants the multi-agent canvas (mentions "canvas", "orchestrate", "multi-agent", "delegate", "collaboration", "collaborative agents", or agents collaborating), suggest opening the canvas view rather than answering inline.
- Stay in scope. If the user asks about anything unrelated to designing AI agents in this product, politely steer back.`;

/* Context-aware system prompt for the chat-based variation's guided
   build flow. Once the user has picked a starter template the layout
   becomes a step-by-step waterfall (Profile → Channel → Instruction →
   Knowledge → Action → Security → Review). Inside that flow the user
   often asks Eva for help with the field they're looking at — e.g.
   "suggest a welcome message" while on Profile, or "tighten the
   guardrails on PII" while on Security. Earlier the waterfall handler
   would either swallow the question (treating it as the field's value)
   or nudge them to the next step; we now route those to the LLM with
   a step-aware system prompt so Eva can give a real suggestion.

   The prompt embeds the current draft (name, description, welcome,
   instructions, knowledge, actions, channel, guardrails) so the LLM
   can ground its answer in what the user already configured instead
   of inventing details. When asking Eva to draft text for a field,
   the LLM should return the suggestion in plain prose so the user
   can copy/paste — we deliberately don't ask for JSON here. */
function buildWaterfallSystemPrompt(args: {
  evaStep: EvaConversationStep;
  agentName: string;
  agentDescription: string;
  welcomeMessage: string;
  instructionPrompt: string;
  selectedKnowledgeBases: string[];
  selectedActions: string[];
  channelSummary: string;
  languageSummary: string;
  customRules: string[];
}): string {
  const stepLabels: Record<EvaConversationStep, string> = {
    profile: 'Profile (agent name, description, language, welcome message)',
    channels: 'Channel (digital channel + address, or voice phone number)',
    instructions: 'Instructions (the system prompt that guides the agent)',
    knowledge: 'Knowledge (knowledge bases the agent can ground answers in)',
    actions: 'Actions (MCP tools / integrations the agent can invoke)',
    security: 'Security (standard or advanced guardrails, sensitivity, enforcement)',
    preview: 'Preview / Test (simulate a user session before creation)',
    testing: 'Testing and Observability (score launch readiness and reporting)',
    review: 'Review (final summary before the agent is created)',
  };

  return `You are AI Assistant, a conversational AI assistant inside Webex AI Agent Studio. The user is in the middle of configuring an AI agent through a step-by-step build flow and has asked you a question or for help.

Current step: ${stepLabels[args.evaStep]}.

Current draft state:
- Agent name: ${args.agentName || '(not set)'}
- Description: ${args.agentDescription || '(not set)'}
- Welcome message: ${args.welcomeMessage || '(not set)'}
- Channel: ${args.channelSummary}
- Language: ${args.languageSummary}
- Knowledge bases selected: ${args.selectedKnowledgeBases.length > 0 ? args.selectedKnowledgeBases.join(', ') : '(none yet)'}
- Actions selected: ${args.selectedActions.length > 0 ? args.selectedActions.join(', ') : '(none yet)'}
- Instructions: ${args.instructionPrompt ? args.instructionPrompt.slice(0, 500) : '(not set)'}
- Custom guardrails: ${args.customRules.length > 0 ? args.customRules.join('; ') : '(none)'}

Guidelines:
- Keep replies concise (2–4 sentences) and ground them in the draft state above.
- If the user asks "what should I pick" / "what's a good X", give a concrete recommendation tailored to their current draft, not generic advice.
- If the user signals they're done with this step ("looks good", "continue", "next"), confirm briefly and tell them they can advance via the same composer.
- Don't pretend you can change fields for them — explain what they should change and where (Profile / Knowledge / Action / Security panels).
- Stay in scope: agent design only. Politely steer off-topic asks back to the current step.

${FIELD_SUGGESTION_RESPONSE_RULES}`;
}

/* Pulls a fenced JSON `options` array out of an LLM reply and returns
   the prose stripped of that block. Returns just the prose if no valid
   block is present so plain Q&A replies render unchanged. Same shape
   as the helper in `EvaFormBuilder` — keeping them in sync ensures
   both variations parse identical recommendation payloads. */
function extractFollowupsAndProse(content: string): { prose: string; followups?: string[] } {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { prose: content.trim() };
  try {
    const parsed = JSON.parse(match[1].trim()) as { options?: unknown };
    if (
      Array.isArray(parsed.options) &&
      parsed.options.length > 0 &&
      parsed.options.every((option): option is string => typeof option === 'string' && option.trim().length > 0)
    ) {
      const prose = content.replace(/```json[\s\S]*?```/, '').trim();
      return {
        prose: prose || 'Pick one of these to keep going:',
        followups: parsed.options.map(option => option.trim()),
      };
    }
  } catch {
    /* Malformed JSON — fall through and just render the raw reply. */
  }
  return { prose: content.trim() };
}

/* Number of items rendered in the right-rail Progress card. Kept in sync with
   `progressStepSource` below; centralizing it lets the planning ticker time
   its reveal cadence without re-deriving the array inside the component. */
const TOTAL_PROGRESS_STEPS = 9;

const evaStepOrder: EvaConversationStep[] = EVA_STEP_ORDER;

const evaPlanningRows = EVA_PLANNING_ROWS;
const starterPrompts = STARTER_PROMPTS;

const CONTINUE_TO_STUDIO_LABEL = 'Continue in AI Agent Studio';
const RETAIL_VOICE_LABEL = 'Voice';
const RETAIL_DIGITAL_LABEL = 'Digital';
const RETAIL_VIDEO_LABEL = 'Video';
const RETAIL_CONFIRM_CHANNELS_LABEL = 'Continue to agent details';
const RETAIL_AGENT_NAME_LABEL = 'Acme Electronics agent';
const RETAIL_CUSTOM_AGENT_NAME_LABEL = 'Type a different name';
const RETAIL_AGENT_NAME_CUSTOM_LABEL = 'Use typed name';
const RETAIL_EDIT_WELCOME_LABEL = 'Edit welcome message';
const RETAIL_WELCOME_CUSTOM_LABEL = 'Use edited message';
const RETAIL_CONTINUE_TO_ACTIONS_LABEL = 'Confirm knowledge bases';
const RETAIL_CONTINUE_TO_FINAL_LABEL = 'Confirm actions';
const COMPLETE_RETAIL_AGENT_LABEL = 'Create agent';
const ENTER_AGENT_STUDIO_LABEL = 'Configure advanced settings';
const PREVIEW_RETAIL_AGENT_LABEL = 'Preview agent';
const SKIP_RETAIL_PREVIEW_LABEL = 'Skip';
const CONNECT_RETAIL_PHONE_LABEL = 'Connect phone number';
const CONNECT_RETAIL_PHONE_LATER_LABEL = 'Connect phone number later';
const RETAIL_TRANSITION_PROMPT = 'transition';
const STUDIO_TRANSITION_MS = 420;

const RETAIL_PHONE_NUMBER_OPTIONS = [
  {
    value: '+1 415 555 0198',
    countryCode: '+1',
    flag: '🇺🇸',
    localNumber: '415 555 0198',
    label: '+1 415 555 0198',
    meta: 'San Francisco store',
  },
  {
    value: '+1 512 555 0142',
    countryCode: '+1',
    flag: '🇺🇸',
    localNumber: '512 555 0142',
    label: '+1 512 555 0142',
    meta: 'Austin store',
  },
  {
    value: '+1 408 555 0177',
    countryCode: '+1',
    flag: '🇺🇸',
    localNumber: '408 555 0177',
    label: '+1 408 555 0177',
    meta: 'San Jose store',
  },
];
type RetailPrototypeStep =
  | 'idle'
  | 'discovering'
  | 'channel'
  | 'phone'
  | 'agent-name'
  | 'welcome'
  | 'knowledge'
  | 'actions'
  | 'ready-to-preview'
  | 'previewing'
  | 'ready-to-create';

const RETAIL_RECEPTIONIST_AGENT_NAME = 'Acme Electronics agent';
const RETAIL_RECEPTIONIST_DESCRIPTION = 'Voice agent for Acme Electronics in San Jose';
const RETAIL_RECOMMENDED_WELCOME_MESSAGES = [
  {
    recommended: true,
    shortReason: 'Warm and friendly',
    tone: '',
    reason: 'Works well for a store receptionist because it names the tasks customers are most likely to ask about.',
    text: 'Hi, thanks for calling Acme Electronics in San Jose. I can help with store hours, directions, product availability, and common questions. How can I help?',
  },
  {
    shortReason: 'Concise and professional',
    tone: 'Concise and professional.',
    reason: 'Good when Matt wants a shorter greeting that still mentions inventory and routing.',
    text: 'Welcome to Acme Electronics San Jose. I can check product availability, answer common store questions, and route you to the right person.',
  },
  {
    shortReason: 'Support-focused',
    tone: 'Operational and support-focused.',
    reason: 'Best when warranty questions and manager escalation are the main call drivers.',
    text: 'Thanks for contacting Acme Electronics. I can help with today’s inventory, store hours, warranty questions, and escalation to Matt for manager support.',
  },
];
const RETAIL_DISCOVERY_ROWS = [
  {
    title: 'Store website',
    detail: 'Found San Jose hours, location, parking details, FAQs, warranty policy, and escalation rules.',
  },
  {
    title: 'Inventory system',
    detail: 'Connected and checked inventory for laptops, monitors, routers, headsets, and accessories.',
  },
  {
    title: 'Organization profile',
    detail: 'Confirmed Matt’s store details, Pacific time zone, English support language, and manager escalation path.',
  },
];

const RETAIL_RECOMMENDED_KNOWLEDGE_BASES = [
  {
    name: 'Product catalog',
    description: 'Answer availability from approved catalog details.',
  },
  {
    name: 'Returns policy',
    description: 'Answer returns, warranties, refunds, and receipts.',
  },
  {
    name: 'Store handbook',
    description: 'Use pickup, hours, parking, and escalation guidance.',
  },
];

const RETAIL_RECOMMENDED_ACTIONS = [
  {
    name: 'Check payment status',
    provider: 'Stripe',
    providerLogo: 'stripe',
    providerLogoLabel: 'S',
    description: 'Handle payments and refunds.',
  },
  {
    name: 'Sync product updates',
    provider: 'Shopify',
    providerLogo: 'shopify',
    providerLogoLabel: 'S',
    description: 'Sync catalog and inventory.',
  },
  {
    name: 'Track delivery status',
    provider: 'FedEx',
    providerLogo: 'fedex',
    providerLogoLabel: '',
    description: 'Track orders and delivery updates.',
  },
];

const RETAIL_CHANNEL_OPTIONS = [
  {
    label: RETAIL_VOICE_LABEL,
    icon: 'phone',
    title: 'Voice',
    description: 'Answer incoming store calls, check inventory, and answer FAQs.',
  },
  {
    label: RETAIL_DIGITAL_LABEL,
    icon: 'chat',
    title: 'Digital',
    description: 'Start with chat messaging for store questions and product availability.',
  },
  {
    label: RETAIL_VIDEO_LABEL,
    icon: 'video',
    title: 'Video',
    description: 'Support video conversations with product guidance and store answers.',
  },
];

const matchEvaTemplateFromText = (text: string): typeof EVA_TEMPLATES[number] | null => {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('concierge') || normalized.includes('candidate') || normalized.includes('hiring') || normalized.includes('interview') || normalized.includes('feedback')) {
    return EVA_TEMPLATES.find(template => template.id === 'knowledge-assistant') ?? null;
  }
  if (normalized.includes('incident') || normalized.includes('outage') || normalized.includes('jira')) {
    return EVA_TEMPLATES.find(template => template.id === 'workflow-automation') ?? null;
  }
  if (
    normalized.includes('property') ||
    normalized.includes('tenant') ||
    normalized.includes('maintenance') ||
    normalized.includes('servicenow')
  ) {
    return EVA_TEMPLATES.find(template => template.id === 'policy-compliance') ?? null;
  }
  if (normalized.includes('sales')) {
    return EVA_TEMPLATES.find(template => template.id === 'sales-enablement') ?? null;
  }
  if (normalized.includes('receptionist') || normalized.includes('appointment') || normalized.includes('reminder') || normalized.includes('customer') || normalized.includes('support')) {
    return EVA_TEMPLATES.find(template => template.id === 'customer-support') ?? null;
  }
  if (normalized.includes('help desk') || normalized.includes('employee') || normalized.includes('password') || normalized.includes('pto')) {
    return EVA_TEMPLATES.find(template => template.id === 'policy-compliance') ?? null;
  }
  if (normalized.includes('order') || normalized.includes('tracking') || normalized.includes('delivery') || normalized.includes('return')) {
    return EVA_TEMPLATES.find(template => template.id === 'workflow-automation') ?? null;
  }
  return null;
};

const cleanAgentNameCandidate = (candidate: string) => {
  const cleaned = candidate
    .replace(/^(an?|the)\s+/i, '')
    .replace(/\s+(please|pls)$/i, '')
    .replace(/[.?!,;:]+$/g, '')
    .trim();

  if (!cleaned) return '';
  return /\bagent\b/i.test(cleaned) ? cleaned : `${cleaned} agent`;
};

const extractAgentNameFromCreateRequest = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const patterns = [
    /\b(?:i\s+want|i'd\s+like|i\s+would\s+like|help\s+me|can\s+you|please)?\s*(?:to\s+)?(?:create|build|make|set\s+up|setup)\s+(?:me\s+)?(?:an?\s+)?(.+?)$/i,
    /\b(?:need|want)\s+(?:an?\s+)?(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1] ? cleanAgentNameCandidate(match[1]) : '';
    if (candidate && !/^(agent|ai agent)$/i.test(candidate)) return candidate;
  }

  return '';
};

const isCreateAgentIntent = (normalized: string) => (
  normalized.includes('create') ||
  normalized.includes('build') ||
  normalized.includes('make') ||
  normalized.includes('set up') ||
  normalized.includes('setup')
) && normalized.includes('agent');

type EvaReadinessCheckStatus = 'pass' | 'warning' | 'fail';

interface EvaReadinessCheck {
  label: string;
  status: EvaReadinessCheckStatus;
  detail: string;
}

interface EvaReadinessReport {
  score: number;
  summary: string;
  checks: EvaReadinessCheck[];
  recommendations: string[];
}

type EvaTestingScenarioMethod = 'manual' | 'generate';

type EvaTestingScenarioStep =
  | 'choose-method'
  | 'manual-basic'
  | 'manual-instructions'
  | 'manual-variables'
  | 'generate-count'
  | 'generate-creativity'
  | 'generate-instructions'
  | 'evaluation-description'
  | 'ready';

interface EvaTestingScenarioDraft {
  method: EvaTestingScenarioMethod | null;
  name: string;
  description: string;
  instructions: string;
  expectedOutcome: string;
  variables: string;
  generateTestCaseCount: string;
  creativityLevel: string;
  generateCustomInstructions: string;
  evaluationDescription: string;
}

type EvaTestingScenarioField = Exclude<keyof EvaTestingScenarioDraft, 'method'>;

const MANUAL_TESTING_STEPS: EvaTestingScenarioStep[] = [
  'manual-basic',
  'manual-instructions',
  'manual-variables',
  'evaluation-description',
];

const GENERATED_TESTING_STEPS: EvaTestingScenarioStep[] = [
  'generate-count',
  'generate-creativity',
  'generate-instructions',
  'evaluation-description',
];

const TESTING_SCENARIO_STEP_COPY: Record<
  EvaTestingScenarioStep,
  { label: string; question: string; helper: string; placeholder: string }
> = {
  'choose-method': {
    label: 'Scenario creation method',
    question: 'How do you want to build this test scenario?',
    helper: 'Choose Create manually to define the scenario yourself, or Generate a scenario to let AI draft one.',
    placeholder: 'Choose Create manually or Generate a scenario',
  },
  'manual-basic': {
    label: 'Basic information',
    question: 'Fill out the basic information: scenario name and description.',
    helper: 'This matches the Basic information card in Add test scenario.',
    placeholder: 'Example: Knowledge retrieval grounding | A customer asks about claim status and needs a grounded answer.',
  },
  'manual-instructions': {
    label: 'Instructions and expected outcome',
    question: 'Now add the instructions and expected outcome.',
    helper: 'Define what the agent should do and what success looks like.',
    placeholder: 'Example: Ask for claim status, then ask what documents are required next. Expected: grounded answer, no unsupported promises, escalation offered.',
  },
  'manual-variables': {
    label: 'Test variables',
    question: 'Add any test variables, or type Skip.',
    helper: 'Variables come from the Variables tab and can be used by the scenario runner.',
    placeholder: 'Example: customer_type=premium, policy_status=active',
  },
  'generate-count': {
    label: 'Number of test cases',
    question: 'How many test cases should AI generate?',
    helper: 'Maximum 10 test cases per generation.',
    placeholder: 'Example: 2',
  },
  'generate-creativity': {
    label: 'Creativity level',
    question: 'Choose a creativity level: Low, Mid, or High.',
    helper: 'Higher creativity generates more diverse and exploratory scenarios.',
    placeholder: 'Example: Mid',
  },
  'generate-instructions': {
    label: 'Custom instructions',
    question: 'Describe what you want the AI-generated scenarios to evaluate.',
    helper: 'These instructions guide the generated scenario set.',
    placeholder: 'Example: Focus on knowledge grounding, handoff behavior, and policy-question accuracy.',
  },
  'evaluation-description': {
    label: 'Evaluation description',
    question: 'Review or edit the evaluation description before running the test.',
    helper: 'This is the description attached to the evaluation run.',
    placeholder: 'Example: Comprehensive agent test covering scenario behavior, guardrails, observability, and knowledge/action coverage.',
  },
  ready: {
    label: 'Ready to run',
    question: 'Scenario setup is complete. Run this test to generate the passing report.',
    helper: 'The run will evaluate scenario quality, guardrails, observability, and knowledge/action coverage.',
    placeholder: 'Click Run this test',
  },
};

const emptyTestingScenarioDraft: EvaTestingScenarioDraft = {
  method: null,
  name: '',
  description: '',
  instructions: '',
  expectedOutcome: '',
  variables: '',
  generateTestCaseCount: '2',
  creativityLevel: 'Mid',
  generateCustomInstructions: '',
  evaluationDescription: '',
};

type GuidedPolicyOverview = {
  blocked: { text: string }[];
  allowed: { text: string }[];
  edgeCases: { text: string }[];
};

type GuidedCustomProfile = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  overview: GuidedPolicyOverview;
};

function ClampedDesc({ text, expanded, onToggle }: { text: string; expanded: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="custom-profile-card__body">
      <p ref={ref} className={`custom-profile-card__desc${expanded ? ' custom-profile-card__desc--expanded' : ''}`}>{text}</p>
      {(overflows || expanded) && (
        <TextLink variant="inline" size="sm" onClick={(e) => { e.preventDefault(); onToggle(); }}>
          {expanded ? 'Collapse' : 'View all'}
        </TextLink>
      )}
    </div>
  );
}

function ProfileLogicSummary({ overview }: { overview: GuidedPolicyOverview }) {
  const hasOverview = overview.blocked.length > 0 || overview.allowed.length > 0 || overview.edgeCases.length > 0;

  if (!hasOverview) return null;

  const logicCounts = [
    {
      key: 'blocked',
      icon: 'blocked',
      iconColor: 'var(--danger-color)',
      label: `${overview.blocked.length} blocked`,
    },
    {
      key: 'allows',
      icon: 'check-circle',
      iconColor: 'var(--success-color, var(--accent-color))',
      label: `${overview.allowed.length} allow${overview.allowed.length === 1 ? '' : 's'}`,
    },
    {
      key: 'edge',
      icon: 'search',
      iconColor: 'var(--warning-color, var(--accent-color))',
      label: `${overview.edgeCases.length} edge case${overview.edgeCases.length === 1 ? '' : 's'}`,
    },
  ] as const;

  return (
    <div className="custom-profile-card__logic-wrap">
      <div className="custom-profile-card__logic" aria-label="Custom profile rule summary">
        {logicCounts.map(item => (
          <span key={item.key} className="custom-profile-card__logic-item">
            <Icon name={item.icon} size={14} className="custom-profile-card__logic-icon" color={item.iconColor} />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const defaultGuidedCustomProfile: GuidedCustomProfile = {
  id: 'custom-identity-verification-bypass',
  name: 'ID verification bypass detect',
  description: 'Detects attempts to bypass identity verification while allowing legitimate verification-related requests.',
  enabled: true,
  createdBy: 'System',
  createdAt: 'Last edited Mar 18, 2026',
  overview: {
    blocked: [
      { text: 'Skip verification requests' },
      { text: 'Prior verification claims' },
      { text: 'Social engineering attempts' },
    ],
    allowed: [
      { text: 'Verification questions' },
      { text: 'General service inquiries' },
    ],
    edgeCases: [],
  },
};

const guidedCustomProfileLimit = 3;
const guidedCustomProfileDescriptions = [
  defaultGuidedCustomProfile.description,
  'Detects escalation-specific requests and ensures urgent customer issues follow approved handoff rules.',
  'Detects policy exception requests and keeps agent responses aligned to approved business workflows.',
] as const;

const summarizeGuardrailChipLabel = (label: string) => {
  if (label === defaultGuidedCustomProfile.description) return defaultGuidedCustomProfile.name;
  if (/escalate urgent customer/i.test(label)) return 'Escalation rules';
  if (label.length <= 42) return label;
  return `${label.slice(0, 39).trim()}...`;
};

type EvaRecommendationFixCategory =
  | 'testing'
  | 'guardrails'
  | 'knowledge'
  | 'actions'
  | 'preview'
  | 'instructions'
  | 'general';

function getReadinessRecommendationFixMeta(recommendation: string): {
  category: EvaRecommendationFixCategory;
  actionLabel: string;
  title: string;
  fieldLabel: string;
  placeholder: string;
  targetStep: EvaConversationStep;
} {
  const normalized = recommendation.toLowerCase();

  if (normalized.includes('guardrail') || normalized.includes('security') || normalized.includes('privacy')) {
    return {
      category: 'guardrails',
      actionLabel: 'Update guardrail',
      title: 'Update guardrail',
      fieldLabel: 'Guardrail adjustment',
      placeholder: 'Example: Enable PII redaction and block policy claims without approved knowledge grounding.',
      targetStep: 'security',
    };
  }

  if (normalized.includes('knowledge') || normalized.includes('rag') || normalized.includes('ground')) {
    return {
      category: 'knowledge',
      actionLabel: 'Update knowledge',
      title: 'Update knowledge sources',
      fieldLabel: 'Knowledge update',
      placeholder: 'Example: Add the billing policy KB and mark claim-status articles as approved grounding sources.',
      targetStep: 'knowledge',
    };
  }

  if (normalized.includes('action') || normalized.includes('tool') || normalized.includes('case')) {
    return {
      category: 'actions',
      actionLabel: 'Update action',
      title: 'Update action setup',
      fieldLabel: 'Action update',
      placeholder: 'Example: Enable case creation and document required create/update traces.',
      targetStep: 'actions',
    };
  }

  if (normalized.includes('preview') || normalized.includes('conversation') || normalized.includes('response')) {
    return {
      category: 'preview',
      actionLabel: 'Run preview',
      title: 'Run preview validation',
      fieldLabel: 'Preview adjustment',
      placeholder: 'Example: Captured a transcript covering fallback, escalation, and grounded answer behavior.',
      targetStep: 'preview',
    };
  }

  if (normalized.includes('instruction') || normalized.includes('prompt')) {
    return {
      category: 'instructions',
      actionLabel: 'Update instructions',
      title: 'Update instructions',
      fieldLabel: 'Instruction update',
      placeholder: 'Example: Added explicit escalation criteria and evidence requirements for answers.',
      targetStep: 'instructions',
    };
  }

  if (normalized.includes('scenario') || normalized.includes('transcript') || normalized.includes('test')) {
    return {
      category: 'testing',
      actionLabel: 'Update scenario',
      title: 'Update test scenario',
      fieldLabel: 'Scenario update',
      placeholder: 'Example: Added concrete scenarios and a representative preview transcript.',
      targetStep: 'testing',
    };
  }

  return {
    category: 'general',
    actionLabel: 'Address fix',
    title: 'Address recommendation',
    fieldLabel: 'What changed?',
    placeholder: 'Describe the update you made to address this recommendation.',
    targetStep: 'testing',
  };
}

export default function EvaChatExperience({
  resetSessionOnInitialMount = false,
}: {
  resetSessionOnInitialMount?: boolean;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, addAgent, aiEngines, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const { setVariation } = useDesignVariation();
  const restoredEvaSessionRef = useRef<EvaSessionState | null | undefined>(undefined);
  if (restoredEvaSessionRef.current === undefined) {
    if (resetSessionOnInitialMount && location.pathname === '/') {
      try {
        window.sessionStorage.removeItem(EVA_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(EVA_AUTO_START_VOICE_PREVIEW_KEY);
      } catch {
        /* sessionStorage may be unavailable; fall back to a fresh in-memory landing. */
      }
      restoredEvaSessionRef.current = null;
    } else {
      restoredEvaSessionRef.current = readEvaSessionState();
    }
  }
  const restoredEvaSession = restoredEvaSessionRef.current;
  const [landingMode, setLandingMode] = useState<EvaLandingMode>(restoredEvaSession?.landingMode ?? 'build');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<EvaTemplateId | null>(restoredEvaSession?.selectedTemplateId ?? null);
  const [draft, setDraft] = useState<EvaAgentDraft>(restoredEvaSession?.draft ?? EVA_TEMPLATES[0].draft);
  const [messages, setMessages] = useState<EvaMessage[]>(restoredEvaSession?.messages ?? []);
  const [guidanceVisible, setGuidanceVisible] = useState(restoredEvaSession?.guidanceVisible ?? false);
  const [evaThinking, setEvaThinking] = useState(false);
  /* Separate "thinking" flag for the in-flow LLM call inside the
     guided build waterfall. When the user asks Eva for help mid-step
     (e.g. "suggest a welcome message" while on Profile) we don't want
     to flip `evaThinking` because that would hide the build flow and
     show the planning hero instead. `waterfallThinking` only disables
     the AiFooter and renders an inline "Eva is thinking..." bubble
     under the user's message — the build flow itself stays visible. */
  const [waterfallThinking, setWaterfallThinking] = useState(false);
  const [orchestrationSuggested, setOrchestrationSuggested] = useState(restoredEvaSession?.orchestrationSuggested ?? false);
  /* Tracks whether the user is in a free-form chat with the Cisco LLM
     (i.e. they asked a question that didn't match any deterministic
     intent and we routed the message to /api/chat). Without this flag
     the layout snaps back to the landing hero the moment evaThinking
     flips to false, which would erase the LLM's reply from view. */
  const [freeChatActive, setFreeChatActive] = useState(restoredEvaSession?.freeChatActive ?? false);
  const [conversationalOnboardingStep, setConversationalOnboardingStep] = useState<EvaConversationalOnboardingStep>(
    restoredEvaSession?.conversationalOnboardingStep ?? 'idle',
  );
  const [retailPrototypeStep, setRetailPrototypeStep] = useState<RetailPrototypeStep>('idle');
  const [retailSelectedChannel, setRetailSelectedChannel] = useState<string | null>(null);
  const [retailSelectedChannels, setRetailSelectedChannels] = useState<string[]>([RETAIL_VOICE_LABEL]);
  const [retailSelectedPhoneNumber, setRetailSelectedPhoneNumber] = useState<string | null>(null);
  const [phoneNumberDeferred, setPhoneNumberDeferred] = useState(restoredEvaSession?.phoneNumberDeferred ?? false);
  const [retailDiscoveryProgress, setRetailDiscoveryProgress] = useState(0);
  const [retailAgentNameInput, setRetailAgentNameInput] = useState(RETAIL_RECEPTIONIST_AGENT_NAME);
  const [retailAgentNameInputVisible, setRetailAgentNameInputVisible] = useState(false);
  const [retailWelcomeInput, setRetailWelcomeInput] = useState(RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].text);
  const [retailWelcomeInputVisible, setRetailWelcomeInputVisible] = useState(false);
  const [retailPhoneDropdownOpen, setRetailPhoneDropdownOpen] = useState(false);
  const [retailPhoneSearch, setRetailPhoneSearch] = useState('');
  /* Local-only flag — when the user clicks the "View other options"
     follow-up chip on an LLM reply, we re-reveal the four starter
     template cards inline below the dialogue so they can pivot into
     a templated build flow without re-typing. The flag is reset on
     any new user message, on template selection, and on starting a
     new thread, mirroring the form-based variation. Not persisted to
     sessionStorage because it only makes sense in the active chat. */
  const [showOtherTemplates, setShowOtherTemplates] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [evaStep, setEvaStep] = useState<EvaConversationStep>(restoredEvaSession?.evaStep ?? 'profile');
  const [agentName, setAgentName] = useState(restoredEvaSession?.agentName ?? EVA_TEMPLATES[0].draft.name);
  const [agentDescription, setAgentDescription] = useState(restoredEvaSession?.agentDescription ?? EVA_TEMPLATES[0].draft.description);
  const [avatarUrl, setAvatarUrl] = useState(restoredEvaSession?.avatarUrl ?? 'https://us.webexbotbuilder.com/static/assets/i...');
  const [timezone, setTimezone] = useState(restoredEvaSession?.timezone ?? 'Europe/London');
  const [aiEngine, setAiEngine] = useState(restoredEvaSession?.aiEngine ?? 'Webex AI Pro 1.0');
  const [welcomeMessage, setWelcomeMessage] = useState(restoredEvaSession?.welcomeMessage ?? 'Hi, I am AI Assistant. I can help answer questions, guide next steps, and connect you with the right support path.');
  const [instructionPrompt, setInstructionPrompt] = useState(restoredEvaSession?.instructionPrompt ?? '');
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>(restoredEvaSession?.selectedKnowledgeBases ?? EVA_TEMPLATES[0].draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
  const [selectedActions, setSelectedActions] = useState<string[]>(restoredEvaSession?.selectedActions ?? EVA_TEMPLATES[0].draft.actions.slice(0, 2));
  const [showInstructionExamples, setShowInstructionExamples] = useState(false);
  const [instructionExampleTab, setInstructionExampleTab] = useState<'examples' | 'tips'>('examples');
  const [optimizingInstructions, setOptimizingInstructions] = useState(false);
  const [optimizeAccepted, setOptimizeAccepted] = useState(restoredEvaSession?.optimizeAccepted ?? false);
  const [preOptimizeText, setPreOptimizeText] = useState(restoredEvaSession?.preOptimizeText ?? '');
  const [optimizeSummary, setOptimizeSummary] = useState<{ changes: string[]; reasoning: string[] }>(restoredEvaSession?.optimizeSummary ?? { changes: [], reasoning: [] });
  const [securityTier, setSecurityTier] = useState<EvaSecurityTier>(restoredEvaSession?.securityTier ?? 'standard');
  const [selectedChannels, setSelectedChannels] = useState<EvaChannelSelection[]>(
    () => normalizeEvaChannelSelections(restoredEvaSession?.selectedChannels, restoredEvaSession?.channelType),
  );
  const [channelType, setChannelType] = useState<EvaChannelType>(restoredEvaSession?.channelType ?? 'voice');
  const [selectedDigitalChannels, setSelectedDigitalChannels] = useState<EvaDigitalChannel[]>(
    () => normalizeEvaDigitalChannelSelections(restoredEvaSession?.selectedDigitalChannels, restoredEvaSession?.digitalChannel),
  );
  const [digitalChannel, setDigitalChannel] = useState<EvaDigitalChannel>(restoredEvaSession?.digitalChannel ?? 'chat');
  const [digitalChannelAddress, setDigitalChannelAddress] = useState(restoredEvaSession?.digitalChannelAddress ?? '');
  const [channelPhoneNumber, setChannelPhoneNumber] = useState(restoredEvaSession?.channelPhoneNumber ?? CHANNEL_PHONE_NUMBER_OPTIONS[0].value);
  const [standardGuardrails, setStandardGuardrails] = useState(restoredEvaSession?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS);
  const [advancedGuardrailGroups, setAdvancedGuardrailGroups] = useState(restoredEvaSession?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS);
  const [expandedAdvancedGroups, setExpandedAdvancedGroups] = useState<Set<string>>(
    () => new Set(restoredEvaSession?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => group.id)),
  );
  const [expandedPrebuiltGuardrailGroups, setExpandedPrebuiltGuardrailGroups] = useState<Set<string>>(() => new Set());
  const [personality, setPersonality] = useState(restoredEvaSession?.personality ?? {
    llm: 'Webex AI Pro 1.0',
    voice: 'ava',
    language: 'en-US',
    gender: 'neutral',
  });
  const [customRules, setCustomRules] = useState<string[]>(restoredEvaSession?.customRules ?? []);
  const [disabledCustomRules, setDisabledCustomRules] = useState<Set<string>>(() => new Set());
  const [expandedProfileDescs, setExpandedProfileDescs] = useState<Set<string>>(() => new Set());
  const [previewMessages, setPreviewMessages] = useState<EvaMessage[]>([]);
  const [previewThinking, setPreviewThinking] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<EvaVoiceCallStatus>('idle');
  const [voiceCallError, setVoiceCallError] = useState('');
  const [voiceTranscriptExpanded, setVoiceTranscriptExpanded] = useState(false);
  const [voicePreviewSessionId, setVoicePreviewSessionId] = useState('');
  const [readinessReport, setReadinessReport] = useState<EvaReadinessReport | null>(null);
  const [readinessTesting, setReadinessTesting] = useState(false);
  const [fixedReadinessRecommendations, setFixedReadinessRecommendations] = useState<Set<string>>(() => new Set());
  const [activeRecommendationFix, setActiveRecommendationFix] = useState<string | null>(null);
  const [recommendationFixNote, setRecommendationFixNote] = useState('');
  const [testingScenarioStep, setTestingScenarioStep] = useState<EvaTestingScenarioStep>('choose-method');
  const [testingScenarioDraft, setTestingScenarioDraft] = useState<EvaTestingScenarioDraft>(emptyTestingScenarioDraft);
  const [showEvaGeneratedSidePanel, setShowEvaGeneratedSidePanel] = useState(true);
  const [sideContextExpanded, setSideContextExpanded] = useState(false);
  const [generatedComposerCollapsed, setGeneratedComposerCollapsed] = useState(false);
  const [showEvaThreadPanel, setShowEvaThreadPanel] = useState(false);
  const [activeEvaThreadId, setActiveEvaThreadId] = useState('eva-thread-current');
  const [evaThreads, setEvaThreads] = useState<EvaThread[]>([
    { id: 'eva-thread-current', title: 'Current AI Assistant setup', group: 'Today' },
    { id: 'eva-thread-canvas', title: 'Canvas orchestration', group: 'Today' },
  ]);
  const [evaPlanningProgress, setEvaPlanningProgress] = useState(0);
  const [studioTransitioning, setStudioTransitioning] = useState(false);
  /* Drives the right-rail Progress card's step-by-step reveal during the
     planning/thinking phase. Starts low and ticks up to the full step count
     over the thinking duration so the side panel feels generated alongside
     Eva's left-pane "thinking through your request..." log. Once thinking
     ends, this is forced to the full count and rendering switches back to
     the user-driven currentStepIndex logic below. */
  const [sidePanelStepCount, setSidePanelStepCount] = useState(0);
  const thinkingTimerRef = useRef<number | null>(null);
  const planningIntervalRef = useRef<number | null>(null);
  const sidePanelProgressIntervalRef = useRef<number | null>(null);
  const sidePanelPreviewCardRef = useRef<HTMLElement | null>(null);
  const pendingPreviewScrollRef = useRef(false);
  const retailDiscoveryTimerRef = useRef<number | null>(null);
  const retailPhoneSelectorRef = useRef<HTMLDivElement | null>(null);
  const onboardingResponseTimerRef = useRef<number | null>(null);
  const studioTransitionTimerRef = useRef<number | null>(null);
  const voiceWsRef = useRef<WebSocket | null>(null);
  const voiceMicStreamRef = useRef<MediaStream | null>(null);
  const voiceTranscriptRef = useRef<HTMLDivElement | null>(null);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voicePlaybackContextRef = useRef<AudioContext | null>(null);
  const voiceInputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceScriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const voiceOutputFormatRef = useRef('pcm_16000');
  const voicePlaybackTimeRef = useRef(0);
  const voiceSpeakingTimerRef = useRef<number | null>(null);
  const voiceGreetingFallbackTimerRef = useRef<number | null>(null);
  const voiceConnectionTimerRef = useRef<number | null>(null);
  const voiceCallStatusRef = useRef<EvaVoiceCallStatus>('idle');
  const voiceConversationReadyRef = useRef(false);
  const voiceInitialGreetingPendingRef = useRef(false);
  const voiceMicStreamingEnabledRef = useRef(false);
  const voicePreviewStartedRef = useRef(false);
  const panelMenu = useMenu();

  const persistEvaSession = (overrides: Partial<EvaSessionState> = {}) => {
    const snapshot: EvaSessionState = {
      landingMode,
      selectedTemplateId,
      draft,
      messages,
      guidanceVisible,
      orchestrationSuggested,
      freeChatActive,
      conversationalOnboardingStep,
      evaStep,
      agentName,
      agentDescription,
      avatarUrl,
      timezone,
      aiEngine,
      welcomeMessage,
      instructionPrompt,
      selectedKnowledgeBases,
      selectedActions,
      optimizeAccepted,
      preOptimizeText,
      optimizeSummary,
      securityTier,
      channelType,
      selectedChannels,
      digitalChannel,
      selectedDigitalChannels,
      digitalChannelAddress,
      channelPhoneNumber,
      phoneNumberDeferred,
      standardGuardrails,
      advancedGuardrailGroups,
      expandedAdvancedGroups: Array.from(expandedAdvancedGroups),
      personality,
      customRules,
      ...overrides,
    };
    window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const openEvaCanvas = (overrides: Partial<EvaSessionState> = {}) => {
    persistEvaSession(overrides);
    /* Remember the route the user is opening the canvas from so the
       canvas's "Chat view" / "New thread" buttons can return them
       there. Without this, opening the canvas from /dashboard (the
       "Chat-based in Dashboard" variation) and clicking Chat view
       would dump the user on /agents (EvaAgentsTable's landing
       screen) with the impression their build state was lost. */
    try {
      if (location.pathname && !EVA_CANVAS_PATHS.includes(location.pathname)) {
        window.sessionStorage.setItem(EVA_CANVAS_ORIGIN_PATH_KEY, location.pathname);
      }
    } catch {
      /* sessionStorage unavailable — falls back to /agents on close. */
    }
    /* Pick the canvas route that lives under the same parent as the
       user's current page. From / (Dashboard) we navigate to
       /eva-canvas so the Dashboard sidebar item stays highlighted; from
       anywhere else (notably /agents) we use /agents/eva-canvas. The
       overlay component recognises both as "open" via EVA_CANVAS_PATHS. */
    const canvasPath = location.pathname === '/'
      ? EVA_CANVAS_DASHBOARD_PATH
      : EVA_CANVAS_AGENTS_PATH;
    navigate(canvasPath);
  };

  const toggleSelectedChannel = (channel: EvaChannelSelection) => {
    setSelectedChannels(prev => {
      const hasChannel = prev.includes(channel);
      if (hasChannel && prev.length === 1) return prev;
      const next = hasChannel ? prev.filter(item => item !== channel) : [...prev, channel];

      if (!hasChannel && (channel === 'voice' || channel === 'digital')) {
        setChannelType(channel);
      } else if (hasChannel && channel === channelType) {
        setChannelType(next.includes('voice') ? 'voice' : 'digital');
      }

      if (!hasChannel && channel === 'digital' && selectedDigitalChannels.length === 0) {
        setSelectedDigitalChannels(['chat']);
        setDigitalChannel('chat');
      }

      return next;
    });
  };

  const toggleSelectedDigitalChannel = (channel: EvaDigitalChannel) => {
    setSelectedDigitalChannels(prev => {
      const hasChannel = prev.includes(channel);
      if (hasChannel && prev.length === 1) return prev;
      const next = hasChannel ? prev.filter(item => item !== channel) : [...prev, channel];
      if (!hasChannel) {
        setDigitalChannel(channel);
      } else if (channel === digitalChannel) {
        setDigitalChannel(next[0] ?? 'chat');
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's' || !event.ctrlKey) return;
      const target = event.target;
      const isTextTarget =
        target instanceof HTMLElement &&
        Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
      if (isTextTarget) return;
      event.preventDefault();
      setVoiceActive(prev => !prev);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!voiceTranscriptExpanded) return;
    const transcriptNode = voiceTranscriptRef.current;
    if (!transcriptNode) return;
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [previewMessages.length, voiceTranscriptExpanded]);

  useEffect(() => () => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
    }
    if (planningIntervalRef.current) {
      window.clearInterval(planningIntervalRef.current);
    }
    if (sidePanelProgressIntervalRef.current) {
      window.clearInterval(sidePanelProgressIntervalRef.current);
    }
    if (retailDiscoveryTimerRef.current) {
      window.clearInterval(retailDiscoveryTimerRef.current);
    }
    if (onboardingResponseTimerRef.current) {
      window.clearTimeout(onboardingResponseTimerRef.current);
    }
    if (studioTransitionTimerRef.current) {
      window.clearTimeout(studioTransitionTimerRef.current);
    }
    stopVoiceCall(null);
  }, []);

  useEffect(() => {
    voiceCallStatusRef.current = voiceCallStatus;
  }, [voiceCallStatus]);

  useEffect(() => {
    if (!retailPhoneDropdownOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (retailPhoneSelectorRef.current?.contains(target)) return;
      setRetailPhoneDropdownOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [retailPhoneDropdownOpen]);

  useEffect(() => {
    if (!selectedChannels.includes('voice') && voiceCallStatusRef.current !== 'idle') {
      stopVoiceCall('ended');
    }
  }, [selectedChannels]);

  /* Track the latest user message text outside JSX so React deps are stable. */
  const latestUserMessageText = [...messages].reverse().find(m => m.role === 'user')?.text ?? null;

  useEffect(() => {
    if (!guidanceVisible || evaThinking) return;
    const frameId = window.requestAnimationFrame(() => {
      const stepAnchor = document.querySelector<HTMLElement>(`[data-eva-step="${evaStep}"]`);
      if (!stepAnchor) return;
      stepAnchor.focus({ preventScroll: true });
      /* Scroll only the dialogue scroll container (the closest legitimate
         scrollable ancestor), not every overflow:hidden ancestor — otherwise
         `.eva-first-interface` gets a non-zero scrollTop that survives the
         transition back to landing and leaks blank space at the bottom. */
      const scrollContainer = stepAnchor.closest<HTMLElement>('.eva-dialogue') ?? stepAnchor.parentElement;
      if (scrollContainer) {
        const offset = stepAnchor.offsetTop - scrollContainer.offsetTop;
        scrollContainer.scrollTo({ top: Math.max(0, offset), behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [evaStep, guidanceVisible, evaThinking]);

  /* Mid-step scroll: when the user asks Eva a question during the
     waterfall (or Eva's reply lands), the new user/thinking/reply
     bubbles render BELOW the active step's form (see the
     `{renderUserPromptForStep(...)}` call placed after each
     `</AiResponseMessage>`). Scrolling to the step anchor would still
     leave those bubbles below the viewport, so we explicitly scroll
     the dialogue to its bottom — bringing the latest user prompt and
     Eva's reply right above the sticky composer.

     Also runs for free-chat/prototype message growth so chip/card
     selections and hardcoded assistant replies stay focused without the
     user manually scrolling. */
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const scrollContainer = document.querySelector<HTMLElement>(
        freeChatActive && !guidanceVisible && !orchestrationSuggested
          ? '.eva-first-interface__free-chat'
          : '.eva-dialogue',
      );
      if (!scrollContainer) return;
      if (freeChatActive && !guidanceVisible && !orchestrationSuggested) {
        const latestAssistantMessage = [...messages].reverse().find(message => message.role === 'assistant');
        if (latestAssistantMessage?.originStep === 'retail-phone-choice') {
          scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
          return;
        }

        const retailStepBlocks = latestAssistantMessage?.originStep
          ? Array.from(scrollContainer.querySelectorAll<HTMLElement>(`[data-retail-origin-step="${latestAssistantMessage.originStep}"]`))
          : [];
        const latestBlock =
          retailStepBlocks[retailStepBlocks.length - 1] ??
          (scrollContainer.lastElementChild as HTMLElement | null);
        if (!latestBlock) return;
        const shouldCenterRetailPrompt =
          latestAssistantMessage?.originStep === 'retail-agent-name' &&
          retailPrototypeStep === 'agent-name';
        const shouldLiftAnsweredRetailNamePrompt =
          latestAssistantMessage?.originStep === 'retail-agent-name' &&
          retailPrototypeStep === 'welcome';
        const latestBlockRect = latestBlock.getBoundingClientRect();
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        const offset = shouldCenterRetailPrompt || shouldLiftAnsweredRetailNamePrompt
          ? scrollContainer.scrollTop + latestBlockRect.top - scrollContainerRect.top - (
            shouldCenterRetailPrompt
              ? (scrollContainer.clientHeight - latestBlockRect.height) / 2
              : Math.max(96, scrollContainer.clientHeight * 0.18)
          )
          : latestBlock.offsetTop - scrollContainer.offsetTop - 24;
        scrollContainer.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
        return;
      }
      const hasActiveStepPrompt = messages.some(
        message => message.role === 'user' && message.originStep === evaStep,
      );
      if (guidanceVisible && !waterfallThinking && !hasActiveStepPrompt) return;
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestUserMessageText, messages.length, waterfallThinking, evaThinking, retailDiscoveryProgress, retailPrototypeStep, freeChatActive, guidanceVisible, orchestrationSuggested]);

  const completeEvaThinking = (callback: () => void) => {
    /* Deterministic build flow — clear any prior free-chat state so the
       LLM thread isn't lingering behind the configured form sections. */
    setFreeChatActive(false);
    setEvaThinking(true);
    setGuidanceVisible(false);
    setEvaPlanningProgress(1);
    setSidePanelStepCount(1);
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
    }
    if (planningIntervalRef.current) {
      window.clearInterval(planningIntervalRef.current);
    }
    if (sidePanelProgressIntervalRef.current) {
      window.clearInterval(sidePanelProgressIntervalRef.current);
    }
    planningIntervalRef.current = window.setInterval(() => {
      setEvaPlanningProgress(prev => {
        const next = Math.min(prev + 1, evaPlanningRows.length);
        if (next === evaPlanningRows.length && planningIntervalRef.current) {
          window.clearInterval(planningIntervalRef.current);
          planningIntervalRef.current = null;
        }
        return next;
      });
    }, 560);
    /* Reveal the right-rail Progress steps one-by-one across the thinking
       duration. Spaced evenly so the last step lands just before
       `evaThinking` flips to false, after which the render switches to
       currentStepIndex-driven status. Floor to a sensible minimum so
       extremely short planning phases still feel paced. */
    const totalThinkingMs = evaPlanningRows.length * 560 + 420;
    const sidePanelTickMs = Math.max(180, Math.floor(totalThinkingMs / TOTAL_PROGRESS_STEPS));
    sidePanelProgressIntervalRef.current = window.setInterval(() => {
      setSidePanelStepCount(prev => {
        const next = Math.min(prev + 1, TOTAL_PROGRESS_STEPS);
        if (next === TOTAL_PROGRESS_STEPS && sidePanelProgressIntervalRef.current) {
          window.clearInterval(sidePanelProgressIntervalRef.current);
          sidePanelProgressIntervalRef.current = null;
        }
        return next;
      });
    }, sidePanelTickMs);
    thinkingTimerRef.current = window.setTimeout(() => {
      setEvaPlanningProgress(evaPlanningRows.length);
      setSidePanelStepCount(TOTAL_PROGRESS_STEPS);
      if (sidePanelProgressIntervalRef.current) {
        window.clearInterval(sidePanelProgressIntervalRef.current);
        sidePanelProgressIntervalRef.current = null;
      }
      callback();
      setEvaThinking(false);
      setGuidanceVisible(true);
      thinkingTimerRef.current = null;
    }, evaPlanningRows.length * 560 + 420);
  };

  const handleTemplateSelect = (templateId: EvaTemplateId) => {
    setLandingMode('build');
    setShowOtherTemplates(false);
    const template = EVA_TEMPLATES.find(item => item.id === templateId) ?? EVA_TEMPLATES[0];
    setSelectedTemplateId(template.id);
    setDraft(template.draft);
    setEvaStep('profile');
    setAgentName(template.draft.name);
    setAgentDescription(template.draft.description);
    setTimezone('Europe/London');
    setAiEngine('Webex AI Pro 1.0');
    setWelcomeMessage(buildWelcomeMessage(template.draft));
    setInstructionPrompt(buildInstructionPrompt(template.draft));
    setPersonality(prev => ({
      ...prev,
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: 'en-US',
    }));
    setSelectedKnowledgeBases(template.draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
    setSelectedActions(template.draft.actions.slice(0, 2));
    setCustomRules([]);
    const agent = createOrSelectDraftAgent({
      name: template.draft.name,
      description: template.draft.description,
      gradient,
      status: 'Ready to Publish',
      statusClass: 'badge-warning',
      knowledgeBases: template.draft.knowledgeBases.slice(0, 2).map(kb => kb.name),
    });
    navigate(`/agents/${agent.id}/studio`);
  };

  const handleBuildFromScratch = () => {
    setIsCreateModalOpen(true);
  };

  /* "Existing agent" landing button — switches the design variation to
     the table view and navigates to AI Agents, including when this
     landing is mounted from the Dashboard route. */
  const handleSwitchToExistingAgents = () => {
    setVariation('dashboard');
    navigate('/agents');
  };

  const isRetailReceptionistStoryIntent = (normalized: string) => (
    /\bagents?\b/.test(normalized) &&
    /\bacme\b/.test(normalized)
  );

  const addOnboardingAssistantMessage = (text: string, followups?: string[], originStep?: string) => {
    if (onboardingResponseTimerRef.current) {
      window.clearTimeout(onboardingResponseTimerRef.current);
    }
    setEvaThinking(true);
    onboardingResponseTimerRef.current = window.setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text, followups, originStep }]);
      setEvaThinking(false);
      onboardingResponseTimerRef.current = null;
    }, 850);
  };

  const refreshDraftBasics = (updates: Partial<Pick<EvaAgentDraft, 'name' | 'description' | 'goals'>>) => {
    setDraft(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const seedRetailReceptionistDraft = () => {
    const baseDraft = EVA_TEMPLATES.find(template => template.id === 'customer-support')?.draft ?? EVA_TEMPLATES[0].draft;
    const nextDraft: EvaAgentDraft = {
      ...baseDraft,
      name: RETAIL_RECEPTIONIST_AGENT_NAME,
      description: RETAIL_RECEPTIONIST_DESCRIPTION,
      goals: [
        'Answer store hours, location, parking, and FAQ questions',
        'Check product availability from the inventory manager integration',
        'Escalate VIP customers, complex warranty issues, and manager requests to Matt',
      ],
    };

    setLandingMode('build');
    setSelectedTemplateId('customer-support');
    setDraft(nextDraft);
    setAgentName(RETAIL_RECEPTIONIST_AGENT_NAME);
    setAgentDescription(RETAIL_RECEPTIONIST_DESCRIPTION);
    setTimezone('America/Los_Angeles');
    setAiEngine('Webex AI Pro 1.0');
    setWelcomeMessage('Hi, thanks for calling Acme Electronics in San Jose. I can help with store hours, directions, product availability, and common questions. How can I help?');
    setInstructionPrompt(buildInstructionPrompt(nextDraft));
    setPersonality(prev => ({
      ...prev,
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: 'en-US',
    }));
    setChannelType('voice');
    setSelectedChannels(['voice']);
    setSelectedDigitalChannels(['chat']);
    setChannelPhoneNumber(CHANNEL_PHONE_NUMBER_OPTIONS[0].value);
    setPhoneNumberDeferred(false);
    setSelectedKnowledgeBases(['Acme Electronics Store FAQ', 'San Jose Store Policies']);
    setSelectedActions(['Inventory lookup', 'Create support case']);
    setCustomRules(['Escalate urgent customer, warranty, and store-manager requests to Matt.']);
    setRetailAgentNameInput(RETAIL_RECEPTIONIST_AGENT_NAME);
    setRetailAgentNameInputVisible(false);
    setRetailWelcomeInput(RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].text);
    setRetailWelcomeInputVisible(false);
    setRetailSelectedChannels([RETAIL_VOICE_LABEL]);
  };

  const beginRetailReceptionistStory = () => {
    seedRetailReceptionistDraft();
    setGuidanceVisible(false);
    setEvaThinking(false);
    setFreeChatActive(true);
    setShowOtherTemplates(false);
    setRetailPrototypeStep('discovering');
    setRetailSelectedChannel(RETAIL_VOICE_LABEL);
    setRetailSelectedChannels([RETAIL_VOICE_LABEL]);
    setRetailSelectedPhoneNumber(null);
    setPhoneNumberDeferred(false);
    setRetailDiscoveryProgress(0);
    setConversationalOnboardingStep('idle');
    if (retailDiscoveryTimerRef.current) {
      window.clearInterval(retailDiscoveryTimerRef.current);
    }
    retailDiscoveryTimerRef.current = window.setInterval(() => {
      setRetailDiscoveryProgress(prev => {
        const next = Math.min(prev + 1, RETAIL_DISCOVERY_ROWS.length);
        if (next >= RETAIL_DISCOVERY_ROWS.length && retailDiscoveryTimerRef.current) {
          window.clearInterval(retailDiscoveryTimerRef.current);
          retailDiscoveryTimerRef.current = null;
          window.setTimeout(() => {
            setRetailPrototypeStep('channel');
            addOnboardingAssistantMessage(
              'I found Acme Electronics in San Jose from your organization profile and connected store systems. Voice is selected. Choose any additional channels for this agent.',
              undefined,
              'retail-channel-choice',
            );
          }, 2450);
        }
        return next;
      });
    }, 700);
  };

  const jumpToRetailActionReview = () => {
    if (retailDiscoveryTimerRef.current) {
      window.clearInterval(retailDiscoveryTimerRef.current);
      retailDiscoveryTimerRef.current = null;
    }
    if (onboardingResponseTimerRef.current) {
      window.clearTimeout(onboardingResponseTimerRef.current);
      onboardingResponseTimerRef.current = null;
    }

    seedRetailReceptionistDraft();
    setGuidanceVisible(false);
    setEvaThinking(false);
    setFreeChatActive(true);
    setShowOtherTemplates(false);
    setOrchestrationSuggested(false);
    setConversationalOnboardingStep('idle');
    setRetailPrototypeStep('ready-to-preview');
    setRetailSelectedChannel(RETAIL_VOICE_LABEL);
    setRetailSelectedChannels([RETAIL_VOICE_LABEL]);
    setRetailSelectedPhoneNumber(null);
    setPhoneNumberDeferred(false);
    setRetailDiscoveryProgress(RETAIL_DISCOVERY_ROWS.length);
    setMessages([
      {
        role: 'assistant',
        text: 'Choose the actions this agent can run.',
        originStep: 'retail-actions-choice',
      },
      {
        role: 'user',
        text: RETAIL_CONTINUE_TO_FINAL_LABEL,
      },
      {
        role: 'assistant',
        text: `Great. ${RETAIL_RECEPTIONIST_AGENT_NAME} is ready with the connected knowledge bases, recommended actions, voice channel, escalation to Matt, and your selected greeting. Choose the connected phone number next, then preview the agent before creation.`,
        originStep: 'retail-final-actions',
      },
    ]);
  };

  const completeRetailReceptionistAgent = () => {
    const agent = addAgent({
      name: RETAIL_RECEPTIONIST_AGENT_NAME,
      description: RETAIL_RECEPTIONIST_DESCRIPTION,
      gradient: 'linear-gradient(135deg, #0051af, #00bceb)',
      status: 'Ready to Publish',
      statusClass: 'badge-warning',
      knowledgeBases: ['Acme Electronics Store FAQ', 'San Jose Store Policies'],
    });
    selectAgent(agent.id);
    showToast(`Successfully created "${agent.name}".`, 'success');
    setVariation('dashboard');
    navigate('/agents');
  };

  const askRetailPhoneNumber = () => {
    setChannelType('voice');
    setRetailPrototypeStep('phone');
    addOnboardingAssistantMessage(
      'Which connected phone number should this agent answer before we preview it?',
      CHANNEL_PHONE_NUMBER_OPTIONS.map(option => option.label),
      'retail-phone-choice',
    );
  };

  const selectRetailPhoneNumber = (phoneValue: string) => {
    setMessages(prev => [...prev, { role: 'user', text: phoneValue }]);
    setRetailPhoneDropdownOpen(false);
    setRetailPhoneSearch('');
    void handleRetailReceptionistStoryAnswer(phoneValue);
  };

  const previewRetailReceptionistAgent = () => {
    setChannelType('voice');
    setRetailPrototypeStep('previewing');
    addOnboardingAssistantMessage(
      'Here is a live preview of the receptionist agent. Start the call to simulate how callers will talk with the agent you are building.',
      undefined,
      'retail-inline-preview',
    );

    window.setTimeout(() => {
      void startVoiceCall();
    }, 650);
  };

  const startRetailPreviewInFinalCard = () => {
    if (retailPrototypeStep === 'previewing') return;
    setChannelType('voice');
    setRetailPrototypeStep('previewing');
    void startVoiceCall();
  };

  const toggleRetailChannel = (channelLabel: string) => {
    if (retailPrototypeStep !== 'channel') return;
    setRetailSelectedChannels(prev => {
      const hasChannel = prev.includes(channelLabel);
      if (hasChannel && prev.length === 1) return prev;
      return hasChannel ? prev.filter(label => label !== channelLabel) : [...prev, channelLabel];
    });
  };

  const continueRetailChannelSelection = (channelsOverride?: string[], appendUserMessage = true) => {
    const channels = (channelsOverride?.length ? channelsOverride : retailSelectedChannels).length > 0
      ? (channelsOverride?.length ? channelsOverride : retailSelectedChannels)
      : [RETAIL_VOICE_LABEL];
    const channelCopy = channels.join(' + ');
    setRetailSelectedChannel(channelCopy);
    setSelectedChannels([
      ...(channels.includes(RETAIL_VOICE_LABEL) ? ['voice' as const] : []),
      ...(channels.includes(RETAIL_DIGITAL_LABEL) ? ['digital' as const] : []),
      ...(channels.includes(RETAIL_VIDEO_LABEL) ? ['video' as const] : []),
    ]);
    setChannelType(channels.includes(RETAIL_VOICE_LABEL) ? 'voice' : 'digital');
    if (channels.includes(RETAIL_DIGITAL_LABEL)) {
      setSelectedDigitalChannels(['chat']);
      setDigitalChannel('chat');
      setDigitalChannelAddress('acme-electronics-san-jose');
    }
    if (channels.includes(RETAIL_VIDEO_LABEL) && !channels.includes(RETAIL_DIGITAL_LABEL)) {
      setDigitalChannelAddress('acme-electronics-video');
    }
    setRetailPrototypeStep('agent-name');
    if (appendUserMessage) {
      setMessages(prev => [...prev, { role: 'user', text: channelCopy }]);
    }
    addOnboardingAssistantMessage(
      `${channelCopy} ${channels.length === 1 ? 'is' : 'are'} selected for this agent. What should we name the agent?`,
      [RETAIL_AGENT_NAME_LABEL],
      'retail-agent-name',
    );
  };

  const handleRetailReceptionistStoryAnswer = (answer: string) => {
    const normalized = answer.trim().toLowerCase();

    if (retailPrototypeStep === 'channel') {
      const requestedChannels = [
        ...(normalized.includes('voice') || normalized.includes('phone') || normalized.includes('call') ? [RETAIL_VOICE_LABEL] : []),
        ...(normalized.includes('digital') || normalized.includes('chat') || normalized.includes('email') || normalized.includes('sms') ? [RETAIL_DIGITAL_LABEL] : []),
        ...(normalized.includes('video') ? [RETAIL_VIDEO_LABEL] : []),
      ];

      if (requestedChannels.length > 0) {
        const channels = Array.from(new Set(requestedChannels.length === 1 ? [RETAIL_VOICE_LABEL, ...requestedChannels] : requestedChannels));
        setRetailSelectedChannels(channels);
        continueRetailChannelSelection(channels, false);
        return true;
      }

      addOnboardingAssistantMessage('Voice is selected by default. Add Digital or Video too, then continue with the selected channels.', undefined, 'retail-channel-choice');
      return true;
    }

    if (retailPrototypeStep === 'phone') {
      if (answer.trim() === CONNECT_RETAIL_PHONE_LATER_LABEL) {
        setRetailSelectedPhoneNumber(null);
        setPhoneNumberDeferred(true);
        setRetailPrototypeStep('ready-to-preview');
        addOnboardingAssistantMessage(
          `No problem. ${agentName} is ready with the connected knowledge bases, recommended actions, voice channel, escalation to Matt, and your selected greeting. I will flag the phone number connection as a go-live step. Preview the agent next or skip to creation.`,
          undefined,
          'retail-final-actions',
        );
        return true;
      }

      const connectedPhone = CHANNEL_PHONE_NUMBER_OPTIONS.find(option => option.label === answer.trim() || option.value === answer.trim());
      const nextPhoneNumber = connectedPhone?.value ?? answer.trim() ?? CHANNEL_PHONE_NUMBER_OPTIONS[0].value;
      setRetailSelectedPhoneNumber(nextPhoneNumber);
      setChannelPhoneNumber(nextPhoneNumber);
      setPhoneNumberDeferred(false);
      setRetailPrototypeStep('ready-to-preview');
      addOnboardingAssistantMessage(
        `Perfect. ${agentName} is ready with the connected knowledge bases, recommended actions, voice channel, ${nextPhoneNumber}, escalation to Matt, and your selected greeting. Preview the agent next or skip to creation.`,
        undefined,
        'retail-final-actions',
      );
      return true;
    }

    if (retailPrototypeStep === 'agent-name') {
      const nextName = (
        answer.trim() === RETAIL_AGENT_NAME_CUSTOM_LABEL
          ? retailAgentNameInput.trim()
          : answer.trim()
      ) || RETAIL_RECEPTIONIST_AGENT_NAME;
      setAgentName(nextName);
      setDraft(prev => ({ ...prev, name: nextName }));
      setRetailPrototypeStep('welcome');
      setRetailWelcomeInput(RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].text);
      setRetailWelcomeInputVisible(false);
      addOnboardingAssistantMessage(
        'Here’s a suggested welcome message. Use it as is or edit it before continuing.',
        undefined,
        'retail-welcome-choice',
      );
      return true;
    }

    if (retailPrototypeStep === 'welcome') {
      const nextWelcome = answer.trim() || RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].text;
      setWelcomeMessage(nextWelcome);
      setRetailPrototypeStep('knowledge');
      addOnboardingAssistantMessage(
        'Choose the knowledge sources this agent can use.',
        undefined,
        'retail-knowledge-choice',
      );
      return true;
    }

    if (retailPrototypeStep === 'knowledge') {
      const matchedKnowledge = RETAIL_RECOMMENDED_KNOWLEDGE_BASES.find(option => option.name === answer.trim());
      if (matchedKnowledge) {
        setSelectedKnowledgeBases(prev => (
          prev.includes(matchedKnowledge.name)
            ? prev.filter(item => item !== matchedKnowledge.name)
            : [...prev, matchedKnowledge.name]
        ));
        addOnboardingAssistantMessage(
          `Added ${matchedKnowledge.name}. You can enable another recommended knowledge base or continue to actions.`,
          undefined,
          'retail-knowledge-choice',
        );
        return true;
      }

      if (answer.trim() === RETAIL_CONTINUE_TO_ACTIONS_LABEL || normalized.includes('action')) {
        setRetailPrototypeStep('actions');
        addOnboardingAssistantMessage(
          'Choose the actions this agent can run.',
          undefined,
          'retail-actions-choice',
        );
        return true;
      }
    }

    if (retailPrototypeStep === 'actions') {
      const matchedAction = RETAIL_RECOMMENDED_ACTIONS.find(option => option.name === answer.trim());
      if (matchedAction) {
        setSelectedActions(prev => (
          prev.includes(matchedAction.name)
            ? prev.filter(item => item !== matchedAction.name)
            : [...prev, matchedAction.name]
        ));
        addOnboardingAssistantMessage(
          `Added ${matchedAction.name}. You can enable another integration or continue.`,
          undefined,
          'retail-actions-choice',
        );
        return true;
      }

      if (answer.trim() === RETAIL_CONTINUE_TO_FINAL_LABEL || normalized.includes('continue') || normalized.includes('done')) {
        askRetailPhoneNumber();
        return true;
      }
    }

    if (retailPrototypeStep === 'ready-to-preview') {
      if (normalized.includes('preview') || normalized.includes('test')) {
        previewRetailReceptionistAgent();
        return true;
      }
      if (normalized.includes('skip')) {
        setRetailPrototypeStep('ready-to-create');
        addOnboardingAssistantMessage(
          `No problem. ${agentName} is ready with the connected knowledge bases, recommended actions, voice channel, escalation to Matt, and your selected greeting. You can complete creation now or continue into AI Agent Studio for advanced configuration.`,
          undefined,
          'retail-complete-actions',
        );
        return true;
      }
    }

    if (retailPrototypeStep === 'previewing') {
      if (normalized.includes('connect') || normalized.includes('phone') || normalized.includes('number')) {
        askRetailPhoneNumber();
        return true;
      }
    }

    if (retailPrototypeStep === 'ready-to-create') {
      if (
        normalized.includes('complete') ||
        normalized.includes('create') ||
        normalized.includes('done') ||
        normalized.includes('publish')
      ) {
        completeRetailReceptionistAgent();
        return true;
      }
    }

    return false;
  };

  const beginConversationalOnboarding = (initialRequest: string) => {
    const matched = matchEvaTemplateFromText(initialRequest);
    const inferredName = extractAgentNameFromCreateRequest(initialRequest);
    const baseDraft = matched?.draft ?? EVA_TEMPLATES[0].draft;
    const nextName = inferredName || baseDraft.name;
    const nextDraft = {
      ...baseDraft,
      name: nextName,
      description: inferredName ? '' : baseDraft.description,
    };

    setLandingMode('build');
    setSelectedTemplateId(matched?.id ?? null);
    setDraft(nextDraft);
    setAgentName(nextName);
    setAgentDescription(nextDraft.description);
    setWelcomeMessage(buildWelcomeMessage(nextDraft));
    setInstructionPrompt(buildInstructionPrompt(nextDraft));
    setSelectedKnowledgeBases(baseDraft.knowledgeBases.slice(0, 2).map(kb => kb.name));
    setSelectedActions(baseDraft.actions.slice(0, 2));
    setTimezone('Europe/London');
    setAiEngine('Webex AI Pro 1.0');
    setPersonality(prev => ({
      ...prev,
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: 'en-US',
    }));
    setGuidanceVisible(false);
    setEvaThinking(false);
    setFreeChatActive(true);
    setShowOtherTemplates(false);
    setConversationalOnboardingStep(inferredName ? 'profile-purpose' : 'profile-name');

    addOnboardingAssistantMessage(
      inferredName
        ? `Great, let's set up ${nextName}. What should this agent help users do?`
        : 'Absolutely. Let’s start with the basics. What should we call this agent?',
    );
  };

  const completeConversationalOnboarding = () => {
    const nextStep: EvaConversationalOnboardingStep = 'ready-for-studio';
    const nextEvaStep: EvaConversationStep = 'instructions';
    setConversationalOnboardingStep(nextStep);
    setEvaStep(nextEvaStep);
    setFreeChatActive(false);
    setGuidanceVisible(true);
    setEvaThinking(false);
    setOrchestrationSuggested(false);
    setShowEvaGeneratedSidePanel(true);
    persistEvaSession({
      conversationalOnboardingStep: nextStep,
      freeChatActive: false,
      guidanceVisible: true,
      orchestrationSuggested: false,
      evaStep: nextEvaStep,
    });
  };

  const createOrSelectDraftAgent = (agentDetails: {
    name: string;
    description: string;
    gradient: string;
    status: string;
    statusClass?: string;
    knowledgeBases?: string[];
  }) => {
    const existingAgent = Object.values(agents).find(agent => agent.name === agentDetails.name);
    const agent = existingAgent ?? addAgent(agentDetails);
    selectAgent(agent.id);
    return agent;
  };

  const navigateToAgentStudio = (agentId: string) => {
    setStudioTransitioning(true);
    if (studioTransitionTimerRef.current) {
      window.clearTimeout(studioTransitionTimerRef.current);
    }
    studioTransitionTimerRef.current = window.setTimeout(() => {
      navigate(`/agents/${agentId}/studio`);
      studioTransitionTimerRef.current = null;
    }, STUDIO_TRANSITION_MS);
  };

  const handleViewSummary = () => {
    const agent = createOrSelectDraftAgent({
      name: agentName,
      description: agentDescription,
      gradient,
      status: 'Ready to Publish',
      statusClass: 'badge-warning',
      knowledgeBases: selectedKnowledgeBases,
    });
    panelMenu.close();
    navigateToAgentStudio(agent.id);
  };

  const enterRetailAgentStudio = () => {
    const agent = createOrSelectDraftAgent({
      name: RETAIL_RECEPTIONIST_AGENT_NAME,
      description: RETAIL_RECEPTIONIST_DESCRIPTION,
      gradient,
      status: 'Ready to Publish',
      statusClass: 'badge-warning',
      knowledgeBases: selectedKnowledgeBases,
    });
    setConversationalOnboardingStep('idle');
    setEvaThinking(false);
    setOrchestrationSuggested(false);
    persistEvaSession({
      conversationalOnboardingStep: 'idle',
      freeChatActive: true,
      guidanceVisible: true,
      orchestrationSuggested: false,
    });
    navigateToAgentStudio(agent.id);
  };

  const handleConversationalOnboardingAnswer = (answer: string) => {
    const normalized = answer.trim().toLowerCase();

    if (conversationalOnboardingStep === 'profile-name') {
      const nextName = cleanAgentNameCandidate(answer) || answer.trim();
      if (!nextName) {
        addOnboardingAssistantMessage('What should we call this agent?');
        return true;
      }
      setAgentName(nextName);
      refreshDraftBasics({ name: nextName });
      setWelcomeMessage(`Hi, I am ${nextName.replace(/\s+AI Assistant Agent$/i, '').replace(/\s+Eva Agent$/i, '').replace(/\s+Agent$/i, '')}. I can help with your request and guide you to the right next step.`);
      setConversationalOnboardingStep('profile-purpose');
      addOnboardingAssistantMessage(`Nice. What should ${nextName} help users do?`);
      return true;
    }

    if (conversationalOnboardingStep === 'profile-purpose') {
      const purpose = answer.trim();
      const nextDraft = {
        ...draft,
        name: agentName,
        description: purpose,
        goals: [`Help users with ${purpose.toLowerCase()}`],
      };
      setAgentDescription(purpose);
      setDraft(nextDraft);
      setInstructionPrompt(buildInstructionPrompt(nextDraft));
      setWelcomeMessage(`Hi, I am ${agentName.replace(/\s+AI Assistant Agent$/i, '').replace(/\s+Eva Agent$/i, '').replace(/\s+Agent$/i, '')}. I can ${purpose.toLowerCase()} and guide you to the right next step.`);
      setConversationalOnboardingStep('channel-type');
      addOnboardingAssistantMessage('Where should this agent be available first: voice or digital?');
      return true;
    }

    if (conversationalOnboardingStep === 'channel-type') {
      if (normalized.includes('voice') || normalized.includes('phone') || normalized.includes('call')) {
        setChannelType('voice');
        setConversationalOnboardingStep('voice-phone');
        addOnboardingAssistantMessage(
          `Which phone number should ${agentName} use? These connected numbers are available from your organization account.`,
          CHANNEL_PHONE_NUMBER_OPTIONS.map(option => option.label),
        );
        return true;
      }

      if (
        normalized.includes('digital') ||
        normalized.includes('chat') ||
        normalized.includes('email') ||
        normalized.includes('sms') ||
        normalized.includes('message')
      ) {
        setChannelType('digital');
        setConversationalOnboardingStep('digital-channel');
        addOnboardingAssistantMessage('Which digital entry point should we start with: chat, email, or SMS?');
        return true;
      }

      addOnboardingAssistantMessage('Should this agent start on voice or digital?');
      return true;
    }

    if (conversationalOnboardingStep === 'digital-channel') {
      const nextChannel: EvaDigitalChannel = normalized.includes('email')
        ? 'email'
        : normalized.includes('sms') || normalized.includes('text')
          ? 'sms'
          : 'chat';
      setDigitalChannel(nextChannel);
      setConversationalOnboardingStep('digital-address');
      const channelDetails = DIGITAL_CHANNEL_DETAILS[nextChannel];
      addOnboardingAssistantMessage(`What ${channelDetails.label.toLowerCase()} should this agent use?`);
      return true;
    }

    if (conversationalOnboardingStep === 'digital-address') {
      setDigitalChannelAddress(answer.trim());
      setConversationalOnboardingStep('ready-for-studio');
      addOnboardingAssistantMessage(
        `Great. I have the basic profile and channel details for ${agentName}. You can continue in AI Agent Studio from Step 3, where we’ll configure instructions, knowledge, actions, guardrails, preview, and evaluation.`,
        [CONTINUE_TO_STUDIO_LABEL],
      );
      return true;
    }

    if (conversationalOnboardingStep === 'voice-phone') {
      const nextPhoneNumber = normalized.includes('default') ? CHANNEL_PHONE_NUMBER_OPTIONS[0].value : answer.trim();
      setChannelPhoneNumber(nextPhoneNumber || CHANNEL_PHONE_NUMBER_OPTIONS[0].value);
      setPhoneNumberDeferred(false);
      setConversationalOnboardingStep('ready-for-studio');
      addOnboardingAssistantMessage(
        `Great. I have the basic profile and voice channel details for ${agentName}. You can continue in AI Agent Studio from Step 3, where we’ll configure instructions, knowledge, actions, guardrails, preview, and evaluation.`,
        [CONTINUE_TO_STUDIO_LABEL],
      );
      return true;
    }

    if (conversationalOnboardingStep === 'ready-for-studio') {
      if (normalized.includes('continue') || normalized.includes('studio') || normalized.includes('next')) {
        completeConversationalOnboarding();
        return true;
      }
    }

    return false;
  };

  const handleNewEvaThread = () => {
    const id = `eva-thread-${Date.now()}`;
    setEvaThreads(prev => [{ id, title: 'New thread', group: 'Today' }, ...prev]);
    setActiveEvaThreadId(id);
    setMessages([]);
    setGuidanceVisible(false);
    setEvaThinking(false);
    setOrchestrationSuggested(false);
    setFreeChatActive(false);
    setConversationalOnboardingStep('idle');
    setRetailPrototypeStep('idle');
    setRetailSelectedChannel(null);
    setRetailSelectedPhoneNumber(null);
    setPhoneNumberDeferred(false);
    setShowOtherTemplates(false);
    setLandingMode('build');
  };

  /* When the user clicks "New thread" on the canvas overlay header, the
     overlay sets a one-shot sessionStorage flag and navigates back to
     the route they came from (which may be /agents OR /dashboard when
     the chat experience is mounted via the "Chat-based in Dashboard"
     variation). Because the canvas overlay only changes pathname rather
     than unmounting EvaChatExperience on the /agents path, watching
     `location.pathname` lets us consume the flag every time we land on
     a non-canvas route — and we ignore the canvas path itself so the
     handoff doesn't accidentally fire while the canvas is opening. */
  useEffect(() => {
    if (EVA_CANVAS_PATHS.includes(location.pathname)) return;
    let shouldStart = false;
    try {
      shouldStart = window.sessionStorage.getItem(EVA_CANVAS_NEW_THREAD_FLAG) === '1';
      if (shouldStart) {
        window.sessionStorage.removeItem(EVA_CANVAS_NEW_THREAD_FLAG);
      }
    } catch {
      /* sessionStorage unavailable; nothing to do. */
    }
    if (shouldStart) {
      handleNewEvaThread();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [location.pathname]);

  const handleSelectEvaThread = (threadId: string | number) => {
    setActiveEvaThreadId(String(threadId));
  };

  const handleRenameEvaThread = (threadId: string | number) => {
    const currentThread = evaThreads.find(thread => thread.id === String(threadId));
    const nextTitle = window.prompt('Rename thread', currentThread?.title ?? '');
    if (!nextTitle?.trim()) return;
    setEvaThreads(prev => prev.map(thread =>
      thread.id === String(threadId) ? { ...thread, title: nextTitle.trim() } : thread,
    ));
  };

  const handleDeleteEvaThread = (threadId: string | number) => {
    const id = String(threadId);
    setEvaThreads(prev => {
      const next = prev.filter(thread => thread.id !== id);
      if (activeEvaThreadId === id) {
        setActiveEvaThreadId(next[0]?.id ?? 'eva-thread-current');
      }
      return next.length ? next : [{ id: 'eva-thread-current', title: 'Current AI Assistant setup', group: 'Today' }];
    });
  };

  const handleEvaOptimizeInstructions = async () => {
    const text = instructionPrompt.trim();
    if (!text || optimizingInstructions) return;

    setOptimizingInstructions(true);
    setPreOptimizeText(instructionPrompt);
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });

    try {
      const result = await optimizeInstructions(text);
      setInstructionPrompt(result.optimizedText);
      setOptimizeSummary({ changes: result.changes, reasoning: result.reasoning });
      setOptimizeAccepted(true);
      showToast('Optimized instruction prompt', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimization failed';
      showToast(message, 'error');
    } finally {
      setOptimizingInstructions(false);
    }
  };

  const handleEvaUndoOptimize = () => {
    setInstructionPrompt(preOptimizeText);
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });
    showToast('Reverted to original instructions', 'success');
  };

  const createDraftAgent = () => {
    const agent = addAgent({
      name: agentName,
      description: agentDescription,
      gradient,
      status: 'Ready to Publish',
      knowledgeBases: selectedKnowledgeBases,
    });
    showToast(`AI Assistant created "${agentName}" as a draft agent.`, 'success');
    selectAgent(agent.id);
    setVariation('dashboard');
    navigate('/agents');
  };

  const handleAgentClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleConfigureClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}/studio`);
  };

  const getBadgeVariant = (statusClass: string) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  const handleSectionJump = (section: 'Profile' | 'Knowledge' | 'Action' | 'Security') => {
    const existingAgent = Object.values(agents)[0];
    if (!existingAgent) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Create a draft agent first, then I can take you directly into that configuration section.',
          followups: ['Create this agent'],
        },
      ]);
      return;
    }
    selectAgent(existingAgent.id);
    navigate(`/agents/${existingAgent.id}/configure?section=${section}`);
  };

  const showOrchestrationSuggestion = () => {
    setLandingMode('build');
    setGuidanceVisible(false);
    setEvaThinking(false);
    setOrchestrationSuggested(true);
    setFreeChatActive(false);
  };

  const isTemplateOptionsIntent = (normalized: string) => (
    normalized === 'template' ||
    normalized === 'templates' ||
    normalized === 'show template' ||
    normalized === 'show templates' ||
    normalized === 'template options' ||
    normalized === 'starter templates' ||
    normalized.includes('show me template') ||
    normalized.includes('show me some template') ||
    normalized.includes('give me template') ||
    normalized.includes('give me some template') ||
    normalized.includes('view template') ||
    normalized.includes('see template')
  );

  const handleSend = (text: string) => {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return;

    if (normalized === RETAIL_TRANSITION_PROMPT) {
      jumpToRetailActionReview();
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text }]);
    setOrchestrationSuggested(false);
    /* Collapse the inline starter cards if the user is typing again
       after revealing them via "View other options" — keep the chat
       focused on the live conversation rather than two competing
       layouts (cards above + new exchange below). */
    setShowOtherTemplates(false);

    if (isTemplateOptionsIntent(normalized)) {
      setLandingMode('build');
      setFreeChatActive(true);
      setEvaThinking(false);
      setShowOtherTemplates(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Here are the starter templates you can use. Choose one of these options to start the guided build flow.',
          followups: starterPrompts.slice(0, 4).map(prompt => prompt.prompt),
        },
      ]);
      return;
    }

    if (isOrchestrationIntent(normalized) || normalized.includes('canvas') || normalized.includes('collaboration')) {
      showOrchestrationSuggestion();
      return;
    }

    if (retailPrototypeStep !== 'idle' && handleRetailReceptionistStoryAnswer(text)) {
      return;
    }

    if (isRetailReceptionistStoryIntent(normalized)) {
      beginRetailReceptionistStory();
      return;
    }

    if (conversationalOnboardingStep !== 'idle' && handleConversationalOnboardingAnswer(text)) {
      return;
    }

    if (isCreateAgentIntent(normalized)) {
      beginConversationalOnboarding(text);
      return;
    }

    if (normalized.includes('knowledge')) {
      handleSectionJump('Knowledge');
      return;
    }

    if (normalized.includes('action')) {
      handleSectionJump('Action');
      return;
    }

    if (normalized.includes('security') || normalized.includes('policy')) {
      handleSectionJump('Security');
      return;
    }

    if (normalized === 'create this agent' || normalized === 'create draft agent') {
      createDraftAgent();
      return;
    }

    /* Free-typed text never auto-launches a template anymore. Earlier
       versions matched substrings like "reception" or "support" against
       the user's message and immediately spun up the guided build
       (Progress + Summary side panel), which collapsed the landing into
       a build flow before the user had selected anything. The user-
       facing rule is now: type → chat with the LLM only; the guided
       build only starts when the user explicitly clicks one of the
       starter cards or a template-suggestion chip the LLM emitted. The
       chip path is handled by `handleLlmFollowupClick` below. */
    void runLlmReply(text);
  };

  /* Resolve a follow-up chip's text against the starter-template
     keyword list. Same matcher shape used elsewhere in the variation;
     centralized here so the chip click handler and any future entry
     points use the same rules. Returns the matching template, or null
     if the chip is just a free-chat continuation. */
  const matchTemplateFromText = (text: string): typeof EVA_TEMPLATES[number] | null => {
    return matchEvaTemplateFromText(text);
  };

  /* Label and sentinel for the extra chip we append after Eva's
     follow-up options. We match on the visible label string in the
     click handler — the system prompt instructs the LLM to generate
     template-keyword variants, so a literal "View other options"
     string from the model is extremely unlikely to collide. Mirrors
     the form-based variation's sentinel chip. */
  const OTHER_TEMPLATES_LABEL = 'View other options';

  /* Click handler for the LLM's follow-up chips. Three paths:
       1. The chip is the sentinel "View other options" → reveal the
          four starter template cards inline below the dialogue so the
          user can pivot to a templated path.
       2. The chip text contains a template trigger keyword → that's an
          explicit "start building this kind of agent" intent, so we kick
          off the guided build flow (which sets `guidanceVisible` and
          reveals the Progress + Summary right-rail panel).
       3. Otherwise treat the click like a normal user message and route
          back through `handleSend`, which calls the LLM. This covers
          the (rare) case where the LLM emits non-template chips. */
  const handleLlmFollowupClick = (option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    if (trimmed === OTHER_TEMPLATES_LABEL) {
      setShowOtherTemplates(true);
      return;
    }
    if (trimmed === CONTINUE_TO_STUDIO_LABEL) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
      completeConversationalOnboarding();
      return;
    }
    if (trimmed === RETAIL_CUSTOM_AGENT_NAME_LABEL) {
      setRetailAgentNameInputVisible(true);
      return;
    }
    if (trimmed === RETAIL_EDIT_WELCOME_LABEL) {
      setRetailWelcomeInputVisible(true);
      return;
    }
    if (retailPrototypeStep === 'knowledge') {
      const matchedKnowledge = RETAIL_RECOMMENDED_KNOWLEDGE_BASES.find(option => option.name === trimmed);
      if (matchedKnowledge) {
        setSelectedKnowledgeBases(prev => (
          prev.includes(matchedKnowledge.name)
            ? prev.filter(item => item !== matchedKnowledge.name)
            : [...prev, matchedKnowledge.name]
        ));
        return;
      }
    }
    if (retailPrototypeStep === 'actions') {
      const matchedAction = RETAIL_RECOMMENDED_ACTIONS.find(option => option.name === trimmed);
      if (matchedAction) {
        setSelectedActions(prev => (
          prev.includes(matchedAction.name)
            ? prev.filter(item => item !== matchedAction.name)
            : [...prev, matchedAction.name]
        ));
        return;
      }
    }
    if (
      trimmed === RETAIL_CONTINUE_TO_ACTIONS_LABEL ||
      trimmed === RETAIL_CONTINUE_TO_FINAL_LABEL ||
      RETAIL_RECOMMENDED_KNOWLEDGE_BASES.some(option => option.name === trimmed) ||
      RETAIL_RECOMMENDED_ACTIONS.some(option => option.name === trimmed)
    ) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
      void handleRetailReceptionistStoryAnswer(trimmed);
      return;
    }
    if (
      trimmed === RETAIL_VOICE_LABEL ||
      trimmed === RETAIL_DIGITAL_LABEL ||
      trimmed === RETAIL_VIDEO_LABEL ||
      trimmed === RETAIL_AGENT_NAME_LABEL ||
      trimmed === RETAIL_AGENT_NAME_CUSTOM_LABEL ||
      trimmed === RETAIL_WELCOME_CUSTOM_LABEL ||
      trimmed === CONNECT_RETAIL_PHONE_LATER_LABEL ||
      CHANNEL_PHONE_NUMBER_OPTIONS.some(option => option.label === trimmed || option.value === trimmed) ||
      RETAIL_RECOMMENDED_WELCOME_MESSAGES.some(option => option.text === trimmed)
    ) {
      const submittedText = trimmed === RETAIL_WELCOME_CUSTOM_LABEL ? retailWelcomeInput.trim() : trimmed;
      setMessages(prev => [...prev, { role: 'user', text: submittedText }]);
      void handleRetailReceptionistStoryAnswer(submittedText);
      return;
    }
    if (trimmed === COMPLETE_RETAIL_AGENT_LABEL) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
      completeRetailReceptionistAgent();
      return;
    }
    if (trimmed === PREVIEW_RETAIL_AGENT_LABEL) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
      previewRetailReceptionistAgent();
      return;
    }
    if (trimmed === SKIP_RETAIL_PREVIEW_LABEL || trimmed === CONNECT_RETAIL_PHONE_LABEL) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
      if (trimmed === SKIP_RETAIL_PREVIEW_LABEL && (retailSelectedPhoneNumber || phoneNumberDeferred)) {
        void handleRetailReceptionistStoryAnswer(trimmed);
      } else {
        askRetailPhoneNumber();
      }
      return;
    }
    if (trimmed === ENTER_AGENT_STUDIO_LABEL) {
      if (retailPrototypeStep !== 'idle') {
        enterRetailAgentStudio();
        return;
      }
      completeConversationalOnboarding();
      return;
    }
    const matched = matchTemplateFromText(trimmed);
    if (!matched) {
      handleSend(trimmed);
      return;
    }

    setShowOtherTemplates(false);
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setOrchestrationSuggested(false);
    completeEvaThinking(() => {
      setSelectedTemplateId(matched.id);
      setDraft(matched.draft);
      setAgentName(matched.draft.name);
      setAgentDescription(matched.draft.description);
      setTimezone('Europe/London');
      setAiEngine('Webex AI Pro 1.0');
      setWelcomeMessage(buildWelcomeMessage(matched.draft));
      setInstructionPrompt(buildInstructionPrompt(matched.draft));
      setPersonality(prev => ({
        ...prev,
        llm: 'Webex AI Pro 1.0',
        voice: 'ava',
        language: 'en-US',
      }));
      setSelectedKnowledgeBases(matched.draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
      setSelectedActions(matched.draft.actions.slice(0, 2));
      setEvaStep('profile');
      setCustomRules([]);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: buildGuidanceMessage(matched.draft),
          followups: ['Create this agent', 'Open the canvas', 'Open Knowledge setup', 'Open Security setup'],
        },
      ]);
    });
  };

  const runLlmReply = async (latestUserText: string) => {
    /* Mark free-chat mode active before the LLM responds so that when
       evaThinking flips back to false the layout doesn't snap back to
       the landing hero (showLandingOptions also checks freeChatActive
       now). */
    setFreeChatActive(true);
    setEvaThinking(true);
    try {
      const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: EVA_SYSTEM_PROMPT },
        ...messages.map(message => ({ role: message.role, content: message.text })),
        { role: 'user', content: latestUserText },
      ];
      const reply = await sendEvaChat(history);
      /* Pull the optional `options` JSON block out of the reply. When
         present we render the items as clickable chips beneath Eva's
         response so the user can launch a starter template with one
         click; the prose above is what they actually read. */
      const { prose, followups } = extractFollowupsAndProse(reply);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text:
            prose ||
            'I\u2019m not sure how to respond to that yet \u2014 try rephrasing or pick a quick action below.',
          followups,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn\u2019t reach the assistant just now (${message}). Check that CISCO_AI_AUTH and CISCO_AI_APPKEY are set and try again.`,
        },
      ]);
    } finally {
      setEvaThinking(false);
    }
  };

  const applyFieldSuggestion = (suggestion: EvaFieldSuggestion, messageIndex: number) => {
    switch (suggestion.field) {
      case 'welcomeMessage':
        setWelcomeMessage(suggestion.value);
        break;
      case 'agentDescription':
        setAgentDescription(suggestion.value);
        break;
      case 'instructionPrompt':
        setInstructionPrompt(suggestion.value);
        break;
      case 'customRule':
        setCustomRules(prev => (
          prev.includes(suggestion.value) ? prev : [...prev, suggestion.value]
        ));
        setEvaStep('security');
        break;
    }

    setMessages(prev => prev.map((message, index) => (
      index === messageIndex ? { ...message, suggestionAccepted: true } : message
    )));
    showToast(`Updated the ${getFieldSuggestionLabel(suggestion.field)}.`, 'success');
  };

  const tryAnotherFieldSuggestion = (suggestion: EvaFieldSuggestion) => {
    const label = getFieldSuggestionLabel(suggestion.field);
    const prompt = `Try another option for the ${label}. Original request: ${suggestion.originalRequest}`;
    setMessages(prev => [...prev, { role: 'user', text: 'Try another option', originStep: evaStep }]);
    void runWaterfallLlmReply(prompt);
  };

  const addTestingAssistantMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'assistant', text, originStep: 'testing' }]);
  };

  const startTestingScenarioWizard = () => {
    setReadinessReport(null);
    setTestingScenarioDraft(emptyTestingScenarioDraft);
    setTestingScenarioStep('choose-method');
    addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY['choose-method'].question);
  };

  const hasVisitedTestingStep =
    readinessReport !== null || readinessTesting || testingScenarioStep !== 'choose-method';

  const handlePreviewTestingAction = () => {
    if (hasVisitedTestingStep) {
      setReadinessReport(null);
      setReadinessTesting(false);
      setFixedReadinessRecommendations(new Set());
      setActiveRecommendationFix(null);
      setRecommendationFixNote('');
      setTestingScenarioDraft(emptyTestingScenarioDraft);
      setTestingScenarioStep('choose-method');
      setEvaStep('testing');
      return;
    }

    setEvaStep('testing');
  };

  const buildEvaluationDescription = (draftForDescription = testingScenarioDraft) => {
    const scenarioLabel =
      draftForDescription.method === 'generate'
        ? `${draftForDescription.generateTestCaseCount || '2'} AI-generated scenario cases`
        : draftForDescription.name || 'Manual test scenario';

    return `Comprehensive agent test for ${agentName || 'this agent'} covering ${scenarioLabel}, preview behavior, guardrails, observability, and knowledge/action coverage.`;
  };

  const getScenarioStepsForMethod = (method: EvaTestingScenarioMethod) =>
    method === 'manual' ? MANUAL_TESTING_STEPS : GENERATED_TESTING_STEPS;

  const completeTestingScenarioFlowStep = (nextDraft: EvaTestingScenarioDraft) => {
    if (!nextDraft.method) return;
    const steps = getScenarioStepsForMethod(nextDraft.method);
    const currentIndex = steps.indexOf(testingScenarioStep);
    const nextStep = steps[currentIndex + 1];
    if (nextStep === 'evaluation-description') {
      const withDescription = {
        ...nextDraft,
        evaluationDescription: buildEvaluationDescription(nextDraft),
      };
      setTestingScenarioDraft(withDescription);
      setTestingScenarioStep('evaluation-description');
      addTestingAssistantMessage(`${TESTING_SCENARIO_STEP_COPY['evaluation-description'].question}\n\nSuggested description: ${withDescription.evaluationDescription}`);
      return;
    }

    setTestingScenarioDraft(nextDraft);
    if (nextStep) {
      setTestingScenarioStep(nextStep);
      addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY[nextStep].question);
    } else {
      setTestingScenarioStep('ready');
      addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY.ready.question);
    }
  };

  const selectTestingScenarioMethod = (method: EvaTestingScenarioMethod) => {
    setReadinessReport(null);
    const nextDraft = { ...emptyTestingScenarioDraft, method };
    setTestingScenarioDraft(nextDraft);
    const nextStep = method === 'manual' ? 'manual-basic' : 'generate-count';
    setTestingScenarioStep(nextStep);
    addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY[nextStep].question);
  };

  const generateTestingScenarioDraft = () => {
    const nextDraft: EvaTestingScenarioDraft = {
      ...emptyTestingScenarioDraft,
      method: 'generate',
      generateTestCaseCount: '4',
      creativityLevel: 'Mid',
      generateCustomInstructions: `Generate realistic customer conversations for ${agentName || 'this agent'} that validate instruction following, knowledge grounding, action usage, and guardrail behavior. Include at least one happy path, one escalation or handoff path, one policy/knowledge question, and one edge case with ambiguous customer intent.`,
      evaluationDescription: '',
    };
    const withDescription = {
      ...nextDraft,
      evaluationDescription: buildEvaluationDescription(nextDraft),
    };
    setReadinessReport(null);
    setTestingScenarioDraft(withDescription);
    setTestingScenarioStep('ready');
    addTestingAssistantMessage('I generated a scenario setup draft. Review and edit the generated settings, then run the test when it looks right.');
  };

  const updateTestingScenarioDraft = (patch: Partial<EvaTestingScenarioDraft>) => {
    setReadinessReport(null);
    setTestingScenarioDraft(prev => ({ ...prev, ...patch }));
  };

  const isTestingScenarioStepSubmittable = () => {
    switch (testingScenarioStep) {
      case 'manual-basic':
        return testingScenarioDraft.name.trim().length > 0 && testingScenarioDraft.description.trim().length > 0;
      case 'manual-instructions':
        return testingScenarioDraft.instructions.trim().length > 0 && testingScenarioDraft.expectedOutcome.trim().length > 0;
      case 'manual-variables':
        return true;
      case 'generate-count': {
        const count = Number.parseInt(testingScenarioDraft.generateTestCaseCount, 10);
        return Number.isFinite(count) && count >= 1 && count <= 10;
      }
      case 'generate-creativity':
        return ['Low', 'Mid', 'High'].includes(testingScenarioDraft.creativityLevel);
      case 'generate-instructions':
        return testingScenarioDraft.generateCustomInstructions.trim().length > 0;
      case 'evaluation-description':
        return testingScenarioDraft.evaluationDescription.trim().length > 0;
      default:
        return false;
    }
  };

  const submitTestingScenarioFormStep = () => {
    if (testingScenarioStep === 'ready' || testingScenarioStep === 'choose-method') return;
    if (!isTestingScenarioStepSubmittable()) return;

    if (testingScenarioStep === 'evaluation-description') {
      const nextDraft = {
        ...testingScenarioDraft,
        evaluationDescription: testingScenarioDraft.evaluationDescription.trim() || buildEvaluationDescription(),
      };
      setTestingScenarioDraft(nextDraft);
      setTestingScenarioStep('ready');
      addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY.ready.question);
      return;
    }

    if (testingScenarioStep === 'generate-count') {
      const rawCount = Number.parseInt(testingScenarioDraft.generateTestCaseCount, 10);
      const count = Number.isFinite(rawCount) ? Math.min(10, Math.max(1, rawCount)) : 2;
      completeTestingScenarioFlowStep({ ...testingScenarioDraft, generateTestCaseCount: String(count) });
      return;
    }

    completeTestingScenarioFlowStep({
      ...testingScenarioDraft,
      name: testingScenarioDraft.name.trim(),
      description: testingScenarioDraft.description.trim(),
      instructions: testingScenarioDraft.instructions.trim(),
      expectedOutcome: testingScenarioDraft.expectedOutcome.trim(),
      variables: testingScenarioDraft.variables.trim(),
      generateCustomInstructions: testingScenarioDraft.generateCustomInstructions.trim(),
      evaluationDescription: testingScenarioDraft.evaluationDescription.trim(),
    });
  };

  const goToTestingScenarioPage = (page: number) => {
    const pages: EvaTestingScenarioStep[] = testingScenarioDraft.method
      ? ['choose-method', ...getScenarioStepsForMethod(testingScenarioDraft.method)]
      : ['choose-method'];
    const clampedPage = Math.min(Math.max(1, page), pages.length);
    const currentPage = Math.max(1, pages.indexOf(testingScenarioStep) + 1);

    if (clampedPage === currentPage) return;
    if (clampedPage > currentPage && testingScenarioStep !== 'choose-method' && !isTestingScenarioStepSubmittable()) {
      return;
    }

    if (clampedPage === currentPage + 1 && testingScenarioStep !== 'choose-method') {
      submitTestingScenarioFormStep();
      return;
    }

    const nextStep = pages[clampedPage - 1];
    if (nextStep === 'evaluation-description' && !testingScenarioDraft.evaluationDescription.trim()) {
      setTestingScenarioDraft(prev => ({
        ...prev,
        evaluationDescription: buildEvaluationDescription(prev),
      }));
    }
    setTestingScenarioStep(nextStep);
  };

  const goBackTestingScenarioStep = () => {
    if (testingScenarioStepNumber <= 1) return;
    goToTestingScenarioPage(testingScenarioStepNumber - 1);
  };

  const completeTestingScenarioAnswer = (answer: string) => {
    if (testingScenarioStep === 'ready') return false;

    const value = answer.trim();
    if (!value) return true;

    if (testingScenarioStep === 'choose-method') {
      const normalized = value.toLowerCase();
      if (normalized.includes('manual')) {
        selectTestingScenarioMethod('manual');
        return true;
      }
      if (normalized.includes('generate') || normalized.includes('ai')) {
        selectTestingScenarioMethod('generate');
        return true;
      }
      addTestingAssistantMessage('Choose Create manually or Generate a scenario so I can ask for the right setup details.');
      return true;
    }

    if (testingScenarioStep === 'evaluation-description') {
      const nextDraft = {
        ...testingScenarioDraft,
        evaluationDescription:
          ['yes', 'use default', 'default', 'looks good', 'continue', 'ok', 'okay'].includes(value.toLowerCase())
            ? testingScenarioDraft.evaluationDescription || buildEvaluationDescription()
            : value,
      };
      setTestingScenarioDraft(nextDraft);
      setTestingScenarioStep('ready');
      addTestingAssistantMessage(TESTING_SCENARIO_STEP_COPY.ready.question);
      return true;
    }

    if (testingScenarioStep === 'manual-basic') {
      const [namePart, ...descriptionParts] = value.split(/\s+\|\s+|\n+/);
      const nextDraft = {
        ...testingScenarioDraft,
        name: namePart?.trim() || value,
        description: descriptionParts.join(' ').trim() || value,
      };
      completeTestingScenarioFlowStep(nextDraft);
      return true;
    }

    if (testingScenarioStep === 'manual-instructions') {
      const [instructionsPart, ...expectedParts] = value.split(/\s+Expected:\s+|\nExpected:\s+/i);
      const nextDraft = {
        ...testingScenarioDraft,
        instructions: instructionsPart.trim(),
        expectedOutcome: expectedParts.join(' ').trim() || value,
      };
      completeTestingScenarioFlowStep(nextDraft);
      return true;
    }

    if (testingScenarioStep === 'manual-variables') {
      completeTestingScenarioFlowStep({
        ...testingScenarioDraft,
        variables: value.toLowerCase() === 'skip' ? '' : value,
      });
      return true;
    }

    if (testingScenarioStep === 'generate-count') {
      const rawCount = Number.parseInt(value.replace(/\D/g, ''), 10);
      const count = Number.isFinite(rawCount) ? Math.min(10, Math.max(1, rawCount)) : 2;
      completeTestingScenarioFlowStep({ ...testingScenarioDraft, generateTestCaseCount: String(count) });
      return true;
    }

    if (testingScenarioStep === 'generate-creativity') {
      const normalized = value.toLowerCase();
      const creativityLevel = normalized.includes('low')
        ? 'Low'
        : normalized.includes('high')
          ? 'High'
          : 'Mid';
      completeTestingScenarioFlowStep({ ...testingScenarioDraft, creativityLevel });
      return true;
    }

    if (testingScenarioStep === 'generate-instructions') {
      completeTestingScenarioFlowStep({ ...testingScenarioDraft, generateCustomInstructions: value });
      return true;
    }

    return true;
  };

  const handleTestingStepChat = (trimmed: string, normalized: string) => {
    if (testingScenarioStep !== 'ready') {
      return completeTestingScenarioAnswer(trimmed);
    }

    if (
      testingScenarioStep === 'ready' &&
      (normalized.includes('run test') ||
        normalized.includes('run this') ||
        normalized.includes('run task') ||
        normalized.includes('run the task') ||
        normalized === 'run')
    ) {
      handleRunReadinessTest();
      return true;
    }

    return false;
  };

  const handleWaterfallFollowup = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    /* Tag the user message with the active step so the mid-step
       thread renderer can scope it to the right section. Untagged
       user messages (e.g. the template-selection trigger pushed by
       `handleTemplateSelect`) intentionally don't appear below the
       form — they belong to the planning hero. */
    setMessages(prev => [...prev, { role: 'user', text: trimmed, originStep: evaStep }]);
    setOrchestrationSuggested(false);

    if (evaStep === 'testing' && handleTestingStepChat(trimmed, normalized)) {
      return;
    }

    /* Explicit deterministic shortcuts kept from the previous handler.
       Anything matching these is a clear intent ("create the agent",
       "open the canvas", "advance to the next step", "jump to review")
       and we want to take that action immediately rather than burning
       an LLM round-trip on it. Everything else falls through to the
       LLM so Eva can answer questions, draft suggested field values,
       and offer guidance on the current step. */
    if (
      normalized === 'complete create agent' ||
      normalized === 'complete agent creation' ||
      normalized === 'create this agent' ||
      normalized === 'create agent' ||
      normalized === 'create draft agent'
    ) {
      createDraftAgent();
      return;
    }

    if (isOrchestrationIntent(normalized) || normalized.includes('canvas')) {
      showOrchestrationSuggestion();
      return;
    }

    if (
      normalized.includes('review configuration') ||
      normalized === 'jump to review' ||
      normalized === 'go to review'
    ) {
      setEvaStep('review');
      return;
    }

    /* "Looks good" / "continue" / "next" all mean "advance". We keep
       this deterministic so the user can tab through the waterfall
       without waiting for the LLM, but only fire when the message is
       clearly an advance intent (short phrases that don't include a
       question). A user typing "looks good, but can you suggest…"
       still falls through to the LLM. */
    const isShortAdvance =
      trimmed.length <= 20 &&
      !normalized.includes('?') &&
      (normalized === 'looks good' ||
        normalized === 'continue' ||
        normalized === 'next' ||
        normalized === 'next step' ||
        normalized === 'advance');
    if (isShortAdvance) {
      const nextIndex = Math.min(currentStepIndex + 1, evaStepOrder.length - 1);
      setEvaStep(evaStepOrder[nextIndex]);
      return;
    }

    /* Everything else routes to the Cisco LLM with step + draft
       context so Eva can answer the user's question, suggest a field
       value, or offer guidance instead of being silently absorbed
       into a field or pushing the user forward. */
    void runWaterfallLlmReply(trimmed);
  };

  const buildPreviewSystemPrompt = () => `You are simulating the configured agent in a pre-launch test session. Reply as the agent, not as AI Assistant.

Configured agent:
- Name: ${agentName || draft.name}
- Description: ${agentDescription || draft.description}
- Welcome message: ${welcomeMessage || '(not set)'}
- Channel: ${channelSummary}
- Language: ${languageSummary}
- Voice/personality: ${agentCharacterSummary}
- Knowledge sources available: ${selectedKnowledgeBases.length > 0 ? selectedKnowledgeBases.join(', ') : '(none selected)'}
- Actions enabled: ${selectedActions.length > 0 ? selectedActions.join(', ') : '(none enabled)'}
- Instructions: ${instructionPrompt || buildInstructionPrompt(draft)}
- Guardrails: {[...draft.security, ...enabledCustomRules].join('; ') || '(none configured)'}

Simulation rules:
- Answer as the configured agent would answer an end user.
- Stay within the configured purpose, instructions, knowledge, actions, and guardrails.
- If a request requires an enabled action, describe the action you would take and what information you need before taking it.
- If the request is outside scope or unsafe, decline briefly and offer an allowed next step.
- Keep responses concise and realistic for a preview session.`;

  const handlePreviewSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || previewThinking) return;

    const historySnapshot = previewMessages;
    setPreviewMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setPreviewThinking(true);

    void (async () => {
      try {
        const reply = await sendEvaChat([
          { role: 'system', content: buildPreviewSystemPrompt() },
          ...historySnapshot.map(message => ({ role: message.role, content: message.text })),
          { role: 'user', content: trimmed },
        ]);
        setPreviewMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: reply.trim() || 'I need a little more detail to test that scenario.',
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setPreviewMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `The preview session could not reach the model just now (${message}).`,
          },
        ]);
      } finally {
        setPreviewThinking(false);
      }
    })();
  };

  const appendVoicePreviewMessage = (role: EvaMessage['role'], text?: string) => {
    const normalizedText = text?.trim();
    if (!normalizedText) return;

    setPreviewMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === role && last.text === normalizedText) {
        return prev;
      }

      return [...prev, { role, text: normalizedText, timestamp: new Date().toISOString() }];
    });
  };

  const toggleVoiceTranscript = () => {
    setVoiceTranscriptExpanded(expanded => !expanded);
  };

  const handleVoiceTranscriptPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    toggleVoiceTranscript();
  };

  const handleVoiceTranscriptKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    toggleVoiceTranscript();
  };

  function stopVoiceCall(nextStatus: EvaVoiceCallStatus | null = 'ended') {
    if (voiceConnectionTimerRef.current) {
      window.clearTimeout(voiceConnectionTimerRef.current);
      voiceConnectionTimerRef.current = null;
    }
    if (voiceSpeakingTimerRef.current) {
      window.clearTimeout(voiceSpeakingTimerRef.current);
      voiceSpeakingTimerRef.current = null;
    }
    if (voiceGreetingFallbackTimerRef.current) {
      window.clearTimeout(voiceGreetingFallbackTimerRef.current);
      voiceGreetingFallbackTimerRef.current = null;
    }

    const ws = voiceWsRef.current;
    voiceWsRef.current = null;
    voiceConversationReadyRef.current = false;
    voiceInitialGreetingPendingRef.current = false;
    voiceMicStreamingEnabledRef.current = false;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }

    voiceScriptProcessorRef.current?.disconnect();
    voiceScriptProcessorRef.current = null;
    voiceInputSourceRef.current?.disconnect();
    voiceInputSourceRef.current = null;
    voiceMicStreamRef.current?.getTracks().forEach(track => track.stop());
    voiceMicStreamRef.current = null;

    if (voiceAudioContextRef.current && voiceAudioContextRef.current.state !== 'closed') {
      void voiceAudioContextRef.current.close();
    }
    voiceAudioContextRef.current = null;

    if (voicePlaybackContextRef.current && voicePlaybackContextRef.current.state !== 'closed') {
      void voicePlaybackContextRef.current.close();
    }
    voicePlaybackContextRef.current = null;
    voicePlaybackTimeRef.current = 0;
    setVoiceActive(false);

    if (nextStatus) {
      voiceCallStatusRef.current = nextStatus;
      setVoiceCallStatus(nextStatus);
    }
  }

  function playVoiceAudioChunk(audioBase64: string) {
    if (!audioBase64) return;

    const audioContext = voicePlaybackContextRef.current ?? new AudioContext();
    voicePlaybackContextRef.current = audioContext;

    const rawBuffer = base64ToArrayBuffer(audioBase64);
    const format = voiceOutputFormatRef.current || 'pcm_16000';
    const sampleRateMatch = format.match(/_(\d+)/);
    const sampleRate = sampleRateMatch ? Number(sampleRateMatch[1]) : 16000;

    const playPcm = () => {
      const pcm = new Int16Array(rawBuffer);
      const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i += 1) {
        channelData[i] = pcm[i] / 0x8000;
      }
      scheduleVoiceAudioBuffer(audioContext, audioBuffer);
    };

    if (format.startsWith('pcm_')) {
      playPcm();
      return;
    }

    audioContext.decodeAudioData(rawBuffer.slice(0))
      .then(audioBuffer => scheduleVoiceAudioBuffer(audioContext, audioBuffer))
      .catch(playPcm);
  }

  function scheduleVoiceAudioBuffer(audioContext: AudioContext, audioBuffer: AudioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    const startTime = Math.max(audioContext.currentTime, voicePlaybackTimeRef.current);
    source.start(startTime);
    voicePlaybackTimeRef.current = startTime + audioBuffer.duration;
    voiceCallStatusRef.current = 'speaking';
    setVoiceCallStatus('speaking');

    if (voiceSpeakingTimerRef.current) {
      window.clearTimeout(voiceSpeakingTimerRef.current);
    }
    const remainingMs = Math.max(0, (voicePlaybackTimeRef.current - audioContext.currentTime) * 1000);
    voiceSpeakingTimerRef.current = window.setTimeout(() => {
      voiceSpeakingTimerRef.current = null;
      if (voiceWsRef.current && voiceCallStatusRef.current === 'speaking') {
        if (voiceInitialGreetingPendingRef.current) {
          voiceInitialGreetingPendingRef.current = false;
          voiceMicStreamingEnabledRef.current = true;
        }
        voiceCallStatusRef.current = 'listening';
        setVoiceCallStatus('listening');
      }
    }, remainingMs + 160);
  }

  async function startVoiceCall() {
    if (voiceCallStatus === 'connecting' || voiceCallStatus === 'listening' || voiceCallStatus === 'speaking') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceCallError('Microphone is not available in this browser.');
      setVoiceCallStatus('error');
      return;
    }

    setVoiceCallError('');
    setVoiceCallStatus('connecting');
    voiceCallStatusRef.current = 'connecting';
    voiceInitialGreetingPendingRef.current = true;
    voiceMicStreamingEnabledRef.current = false;
    setVoiceTranscriptExpanded(false);
    setVoicePreviewSessionId('');
    voicePreviewStartedRef.current = false;

    try {
      const signedUrl = await getElevenLabsConversationSignedUrl();
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const ws = new WebSocket(signedUrl);
      voiceWsRef.current = ws;
      voiceMicStreamRef.current = micStream;
      voiceConnectionTimerRef.current = window.setTimeout(() => {
        if (voiceWsRef.current !== ws || voiceCallStatusRef.current !== 'connecting') return;
        setVoiceCallError('Voice preview could not connect to the voice websocket. Check network access to ElevenLabs and try again.');
        stopVoiceCall('error');
      }, 10000);

      ws.onopen = () => {
        if (voiceWsRef.current !== ws) return;
        if (voiceConnectionTimerRef.current) {
          window.clearTimeout(voiceConnectionTimerRef.current);
        }
        voiceConnectionTimerRef.current = window.setTimeout(() => {
          if (
            voiceWsRef.current !== ws ||
            voiceConversationReadyRef.current ||
            voiceCallStatusRef.current === 'error'
          ) {
            return;
          }
          setVoiceCallError('Voice preview connected, but the voice agent did not become ready.');
          stopVoiceCall('error');
        }, 10000);
        voicePreviewStartedRef.current = true;

        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
        }));

        const audioContext = new AudioContext();
        voiceAudioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(micStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        voiceInputSourceRef.current = source;
        voiceScriptProcessorRef.current = processor;

        processor.onaudioprocess = event => {
          if (
            ws.readyState !== WebSocket.OPEN ||
            !voiceConversationReadyRef.current ||
            !voiceMicStreamingEnabledRef.current
          ) {
            return;
          }
          const input = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleTo16Khz(input, audioContext.sampleRate);
          ws.send(JSON.stringify({ user_audio_chunk: float32ToPcm16Base64(downsampled) }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setVoiceActive(true);
      };

      ws.onmessage = event => {
        if (typeof event.data !== 'string') return;

        let data: EvaVoicePreviewSocketMessage;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'conversation_initiation_metadata') {
          if (voiceConnectionTimerRef.current) {
            window.clearTimeout(voiceConnectionTimerRef.current);
            voiceConnectionTimerRef.current = null;
          }
          voiceOutputFormatRef.current = data.conversation_initiation_metadata_event?.agent_output_audio_format || 'pcm_16000';
          setVoicePreviewSessionId(data.conversation_initiation_metadata_event?.conversation_id?.trim() ?? '');
          voiceConversationReadyRef.current = true;
          voiceGreetingFallbackTimerRef.current = window.setTimeout(() => {
            voiceGreetingFallbackTimerRef.current = null;
            if (
              voiceWsRef.current === ws &&
              voiceCallStatusRef.current === 'connecting' &&
              voiceInitialGreetingPendingRef.current
            ) {
              voiceInitialGreetingPendingRef.current = false;
              voiceMicStreamingEnabledRef.current = true;
              voiceCallStatusRef.current = 'listening';
              setVoiceCallStatus('listening');
            }
          }, 1800);
          return;
        }

        if (data.type === 'ping' && typeof data.ping_event?.event_id === 'number') {
          ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event.event_id }));
          return;
        }

        if (data.type === 'audio' && data.audio_event?.audio_base_64) {
          if (voiceGreetingFallbackTimerRef.current) {
            window.clearTimeout(voiceGreetingFallbackTimerRef.current);
            voiceGreetingFallbackTimerRef.current = null;
          }
          playVoiceAudioChunk(data.audio_event.audio_base_64);
          return;
        }

        if (data.type === 'agent_response') {
          appendVoicePreviewMessage('assistant', data.agent_response_event?.agent_response);
          return;
        }

        if (data.type === 'agent_response_correction') {
          appendVoicePreviewMessage(
            'assistant',
            data.agent_response_correction_event?.corrected_agent_response
              ?? data.agent_response_correction_event?.agent_response,
          );
          return;
        }

        if (data.type === 'user_transcript' || data.type === 'user_transcription') {
          appendVoicePreviewMessage('user', data.user_transcription_event?.user_transcript);
          return;
        }

        if (data.type === 'interruption') {
          voicePlaybackTimeRef.current = voicePlaybackContextRef.current?.currentTime ?? 0;
          if (voiceCallStatusRef.current !== 'ended') {
            voiceCallStatusRef.current = 'listening';
            setVoiceCallStatus('listening');
          }
        }
      };

      ws.onerror = () => {
        setVoiceCallError('Voice preview connection failed. Waiting for connection details...');
      };

      ws.onclose = event => {
        if (voiceWsRef.current === ws) {
          if (voiceCallStatusRef.current === 'error') {
            stopVoiceCall('error');
            return;
          }

          if (event.code !== 1000 || event.reason) {
            const reason = event.reason ? `: ${event.reason}` : '';
            const guidance = event.code === 1002 || event.code === 1006
              ? ' Check that the ElevenLabs agent ID matches the API key and that this network allows wss://api.elevenlabs.io.'
              : '';
            setVoiceCallError(`Voice preview websocket closed (${event.code}${reason}).${guidance}`);
            stopVoiceCall('error');
            return;
          }

          stopVoiceCall('ended');
        }
      };
    } catch (err) {
      setVoiceCallError(getVoicePreviewErrorMessage(err));
      stopVoiceCall('error');
    }
  }

  useEffect(() => {
    if (evaStep !== 'preview' || !selectedChannels.includes('voice') || voiceCallStatus !== 'idle') return;

    let shouldAutoStart = false;
    try {
      shouldAutoStart = window.sessionStorage.getItem(EVA_AUTO_START_VOICE_PREVIEW_KEY) === '1';
      if (shouldAutoStart) {
        window.sessionStorage.removeItem(EVA_AUTO_START_VOICE_PREVIEW_KEY);
      }
    } catch {
      /* sessionStorage unavailable; preview remains manual. */
    }

    if (!shouldAutoStart) return;

    setShowEvaGeneratedSidePanel(true);
    pendingPreviewScrollRef.current = true;
    const timer = window.setTimeout(() => {
      void startVoiceCall();
    }, 250);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaStep, selectedChannels, voiceCallStatus]);

  const renderVoicePreviewCall = () => {
    const callLive = voiceCallStatus === 'connecting' || voiceCallStatus === 'listening' || voiceCallStatus === 'speaking';
    const previewAgent = Object.values(agents).find(agent => agent.name === agentName) ?? null;
    const previewSessionsLink = previewAgent
      ? `/agents/${previewAgent.id}/sessions${voicePreviewSessionId ? `?sessionId=${encodeURIComponent(voicePreviewSessionId)}&source=preview` : '?source=preview'}`
      : '';
    const showSessionLink = Boolean(previewSessionsLink)
      && voicePreviewStartedRef.current
      && (voiceCallStatus === 'ended' || voiceCallStatus === 'error');
    const statusCopy: Record<EvaVoiceCallStatus, string> = {
      idle: 'Ready to start a voice preview.',
      connecting: 'Connecting voice preview...',
      listening: 'Listening...',
      speaking: `${agentName || 'Agent'} is speaking...`,
      ended: 'Voice preview ended.',
      error: 'Voice preview failed.',
    };

    return (
      <div className={`eva-voice-preview eva-voice-preview--${voiceCallStatus}`} aria-label="Voice preview call simulation">
        <div className="eva-voice-preview__agent">
          <div className="agent-avatar eva-voice-preview__avatar" style={{ background: gradient }}>
            {profileInitials}
          </div>
          <div>
            <strong>{agentName || 'Preview agent'}</strong>
          </div>
        </div>
        <div className={`eva-voice-preview__body${voiceTranscriptExpanded ? ' eva-voice-preview__body--transcript-open' : ''}`}>
          <div className="eva-voice-preview__controls">
            <div className="eva-voice-preview__visualizer" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <span key={index} style={{ animationDelay: `${index * 55}ms` }} />
              ))}
            </div>
            <p className="eva-voice-preview__status" role="status">{statusCopy[voiceCallStatus]}</p>
            {voiceCallError && voiceCallStatus === 'error' && (
              <p className="eva-voice-preview__error">{voiceCallError}</p>
            )}
            <div className="eva-voice-preview__actions">
              <Button
                size="sm"
                onClick={startVoiceCall}
                disabled={callLive}
              >
                <Icon name="phone" weight="bold" size="sm" />
                {voiceCallStatus === 'ended' || voiceCallStatus === 'error' ? 'Start again' : 'Start call'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => stopVoiceCall('ended')}
                disabled={!callLive}
              >
                End call
              </Button>
            </div>
            <button
              type="button"
              className={`btn ${voiceTranscriptExpanded ? 'btn-secondary' : 'btn-tertiary'} btn-sm eva-voice-preview__transcript-toggle-btn`}
              aria-pressed={voiceTranscriptExpanded}
              aria-expanded={voiceTranscriptExpanded}
              onPointerDown={handleVoiceTranscriptPointerDown}
              onKeyDown={handleVoiceTranscriptKeyDown}
            >
              <Icon name="transcript" weight="bold" size="sm" />
              Text transcript
            </button>
          </div>
          {voiceTranscriptExpanded && (
            <>
              <div className="eva-voice-preview__transcript-header">
                <span>Text transcript</span>
              </div>
              <div ref={voiceTranscriptRef} className="eva-voice-preview__transcript" aria-live="polite">
                {previewMessages.length > 0 ? (
                  previewMessages.map((message, index) => {
                    const timeLabel = formatPreviewTranscriptTime(message.timestamp);
                    return (
                      <article
                        key={`voice-transcript-${index}-${message.role}`}
                        className={`eva-voice-preview__transcript-message eva-voice-preview__transcript-message--${message.role}`}
                      >
                        <div className="eva-voice-preview__transcript-meta">
                          <span className="eva-voice-preview__transcript-speaker">
                            {message.role === 'assistant' && (
                              <Icon name="sparkle" weight="bold" size="xs" />
                            )}
                            {message.role === 'assistant' ? agentName || 'Agent' : 'Caller'}
                          </span>
                          {timeLabel && <time dateTime={message.timestamp}>{timeLabel}</time>}
                        </div>
                        <p>{message.text}</p>
                      </article>
                    );
                  })
                ) : (
                  <p className="eva-voice-preview__transcript-empty">
                    Transcript text appears here as the preview receives speech-to-text events.
                  </p>
                )}
              </div>
            </>
          )}
          {voiceTranscriptExpanded && showSessionLink && (
            <div className="eva-voice-preview__session-link">
              <Icon name="transcript" weight="regular" size="sm" />
              <span>
                Preview ended.{' '}
                <TextLink
                  variant="inline"
                  size="sm"
                  href={previewSessionsLink}
                  onClick={event => {
                    event.preventDefault();
                    navigate(previewSessionsLink);
                  }}
                >
                  Open in Sessions
                </TextLink>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewSession = () => selectedChannels.includes('voice') ? (
    <div className="eva-preview-session" aria-label="Agent preview test session">
      <div className="eva-preview-session__meta">
        <Badge variant="info">Voice preview</Badge>
      </div>
      {renderVoicePreviewCall()}
    </div>
  ) : (
    <div className="eva-preview-session" aria-label="Agent preview test session">
      <div className="eva-preview-session__meta">
        <Badge variant="info">Simulation</Badge>
        <span>
          Uses the current profile, instructions, knowledge, actions, and guardrails.
        </span>
      </div>
      <div className="eva-preview-session__thread" aria-live="polite">
        {previewMessages.length === 0 && !previewThinking && (
          <AiResponseMessage
            className="eva-ai-response"
            showActions={false}
            assistantName={agentName || 'Preview agent'}
            content={welcomeMessage || 'Hi, I am ready to help. What would you like to do?'}
          />
        )}
        {previewMessages.map((message, index) => (
          message.role === 'user' ? (
            <AiUserMessage key={`preview-${index}`} text={message.text} />
          ) : (
            <AiResponseMessage
              key={`preview-${index}`}
              className="eva-ai-response"
              showActions={false}
              assistantName={agentName || 'Preview agent'}
              content={message.text}
            />
          )
        ))}
        {previewThinking && (
          <AiResponseMessage
            className="eva-ai-response"
            showActions={false}
            assistantName={`${agentName || 'Preview agent'} is responding...`}
            assistantState="processing"
            content={null}
          />
        )}
      </div>
      <AiFooter
        className="eva-preview-session__footer"
        fillContainer
        onSend={handlePreviewSend}
        processing={previewThinking}
        disabled={previewThinking}
        placeholder={
          selectedChannels.includes('voice')
            ? 'Speak with the mic or type a caller message...'
            : 'Test the agent. Try: I need help with my request...'
        }
        suggestions={[]}
        voiceActive={voiceActive}
        onVoiceToggle={() => setVoiceActive(prev => !prev)}
      />
      <div className="eva-preview-session__actions">
        <Button variant="secondary" size="sm" onClick={() => setPreviewMessages([])} disabled={previewMessages.length === 0 || previewThinking}>
          Reset test
        </Button>
        <Button size="sm" onClick={handlePreviewTestingAction}>
          Testing
        </Button>
      </div>
    </div>
  );

  const parseReadinessReport = (content: string): EvaReadinessReport => {
    const match = content.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim()) as Partial<EvaReadinessReport>;
        const score = typeof parsed.score === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 70;
        const checks = Array.isArray(parsed.checks)
          ? parsed.checks
              .filter((check): check is EvaReadinessCheck => (
                check != null &&
                typeof check === 'object' &&
                'label' in check &&
                'status' in check &&
                'detail' in check &&
                typeof check.label === 'string' &&
                typeof check.detail === 'string' &&
                ['pass', 'warning', 'fail'].includes(String(check.status))
              ))
              .slice(0, 6)
          : [];
        return {
          score,
          summary: typeof parsed.summary === 'string' && parsed.summary.trim()
            ? parsed.summary.trim()
            : 'The agent is ready for a limited pilot with the checks below.',
          checks: checks.length > 0 ? checks : [
            { label: 'Configuration completeness', status: 'warning', detail: 'The evaluator did not return detailed checks.' },
          ],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4)
            : [],
        };
      } catch {
        /* Fall through to prose fallback below. */
      }
    }

    return {
      score: 70,
      summary: content.trim() || 'The readiness test completed, but the report could not be parsed into structured checks.',
      checks: [
        { label: 'Report format', status: 'warning', detail: 'Review the model response manually before launch.' },
      ],
      recommendations: ['Run the readiness test again before publishing.'],
    };
  };

  const handleRunReadinessTest = () => {
    if (readinessTesting) return;
    setReadinessTesting(true);
    setFixedReadinessRecommendations(new Set());
    setActiveRecommendationFix(null);
    setRecommendationFixNote('');

    const previewTranscript = previewMessages.length > 0
      ? previewMessages.map(message => `${message.role}: ${message.text}`).join('\n')
      : '(No preview transcript yet)';
    const testingScenarioSummary = testingScenarioStep === 'ready'
      ? testingScenarioDraft.method === 'generate'
        ? `Creation method: Generate a scenario
Number of test cases: ${testingScenarioDraft.generateTestCaseCount || '2'}
Creativity level: ${testingScenarioDraft.creativityLevel || 'Mid'}
Custom instructions: ${testingScenarioDraft.generateCustomInstructions || '(not set)'}
Evaluation description: ${testingScenarioDraft.evaluationDescription || '(not set)'}`
        : `Creation method: Create manually
Scenario name: ${testingScenarioDraft.name || '(not set)'}
Description: ${testingScenarioDraft.description || '(not set)'}
Instructions: ${testingScenarioDraft.instructions || '(not set)'}
Expected outcome: ${testingScenarioDraft.expectedOutcome || '(not set)'}
Variables: ${testingScenarioDraft.variables || '(none)'}
Evaluation description: ${testingScenarioDraft.evaluationDescription || '(not set)'}`
      : '(No custom test scenario configured yet)';

    void (async () => {
      try {
        const reply = await sendEvaChat([
          {
            role: 'system',
            content: `You are an AI agent launch-readiness evaluator. Evaluate the configured agent and return a concise report.

Return ONLY a short prose summary followed by a fenced JSON block in this exact shape:
\`\`\`json
{
  "score": 82,
  "summary": "One sentence readiness summary.",
  "checks": [
    { "label": "Configuration completeness", "status": "pass", "detail": "Specific result." },
    { "label": "Instruction quality", "status": "warning", "detail": "Specific result." }
  ],
  "recommendations": ["Specific recommendation"]
}
\`\`\`

Allowed check statuses: "pass", "warning", "fail". Score must be 0-100. Use 4-6 checks. Include scenario quality, observability/logging, guardrails, channel readiness, knowledge/action coverage, and preview behavior when applicable.`,
          },
          {
            role: 'user',
            content: `Evaluate this configured agent for launch readiness.

Agent name: ${agentName}
Description: ${agentDescription}
Welcome message: ${welcomeMessage}
Channel: ${channelSummary}
Language: ${languageSummary}
Voice/personality: ${agentCharacterSummary}
Instructions: ${instructionPrompt || buildInstructionPrompt(draft)}
Knowledge sources: ${selectedKnowledgeBases.join(', ') || '(none selected)'}
Actions enabled: ${selectedActions.join(', ') || '(none enabled)'}
Guardrails: {[...draft.security, ...enabledCustomRules].join('; ') || '(none configured)'}
Custom test scenario:
${testingScenarioSummary}
Preview transcript:
${previewTranscript}`,
          },
        ]);
        setReadinessReport(parseReadinessReport(reply));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setReadinessReport({
          score: 0,
          summary: `Readiness testing failed: ${message}`,
          checks: [
            { label: 'Evaluator availability', status: 'fail', detail: 'The readiness evaluator could not be reached.' },
          ],
          recommendations: ['Check the Cisco LLM connection and run the test again.'],
        });
      } finally {
        setReadinessTesting(false);
      }
    })();
  };

  const handleAddressReadinessRecommendation = (recommendation: string) => {
    const meta = getReadinessRecommendationFixMeta(recommendation);
    if (!['guardrails', 'actions', 'knowledge'].includes(meta.category)) {
      setEvaStep(meta.targetStep);
    }
    setActiveRecommendationFix(recommendation);
    setRecommendationFixNote('');
  };

  const updateEnabledStandardGuardrails = (
    key: 'enforcement' | 'direction',
    value: EvaEnforcement | EvaDirection,
  ) => {
    setStandardGuardrails(prev => prev.map(item => (
      item.enabled ? { ...item, [key]: value } : item
    )));
  };

  const closeRecommendationFixModal = () => {
    setActiveRecommendationFix(null);
    setRecommendationFixNote('');
  };

  const saveRecommendationFix = () => {
    if (!activeRecommendationFix) return;
    const meta = getReadinessRecommendationFixMeta(activeRecommendationFix);
    const requiresFixNote = !['actions', 'knowledge'].includes(meta.category);
    if (requiresFixNote && !recommendationFixNote.trim()) return;

    if (meta.category === 'guardrails') {
      setSecurityTier('advanced');
      setCustomRules(prev => (
        prev.includes(recommendationFixNote.trim()) ? prev : [...prev, recommendationFixNote.trim()]
      ));
    }

    if (meta.category === 'actions' && selectedActions.length === 0 && EVA_ACTION_ROWS[0]) {
      setSelectedActions([EVA_ACTION_ROWS[0].name]);
    }

    if (meta.category === 'knowledge' && selectedKnowledgeBases.length === 0 && draft.knowledgeBases[0]) {
      setSelectedKnowledgeBases([draft.knowledgeBases[0].name]);
    }

    if (meta.category === 'testing' && testingScenarioStep === 'choose-method') {
      selectTestingScenarioMethod('manual');
    }

    setFixedReadinessRecommendations(prev => new Set(prev).add(activeRecommendationFix));
    closeRecommendationFixModal();
  };

  /* Calls the Cisco LLM with a step-aware system prompt and pushes
     Eva's reply onto the messages list. The reply renders in the
     active step's section via `renderUserPromptForStep` (which now
     also picks up the assistant message that follows the user's
     latest prompt). Errors surface as an assistant message so the
     user can see why nothing happened.

     Uses `waterfallThinking` (not `evaThinking`) so the build flow
     stays visible while the LLM is in flight; `evaThinking` is
     reserved for the "Planning the agent setup..." hero shown when
     the user first picks a template. */
  const runWaterfallLlmReply = async (latestUserText: string) => {
    setWaterfallThinking(true);
    try {
      const systemPrompt = buildWaterfallSystemPrompt({
        evaStep,
        agentName,
        agentDescription,
        welcomeMessage,
        instructionPrompt,
        selectedKnowledgeBases,
        selectedActions,
        channelSummary,
        languageSummary,
        customRules: enabledCustomRules,
      });
      const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(message => ({ role: message.role, content: message.text })),
        { role: 'user', content: latestUserText },
      ];
      const reply = await sendEvaChat(history);
      const { prose, suggestion } = extractFieldSuggestionAndProse(reply, latestUserText);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text:
            prose ||
            'I don\u2019t have a suggestion for that yet \u2014 could you give me a bit more context?',
          suggestion,
          originStep: evaStep,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn\u2019t reach the assistant just now (${message}). Check that CISCO_AI_AUTH and CISCO_AI_APPKEY are set and try again.`,
          originStep: evaStep,
        },
      ]);
    } finally {
      setWaterfallThinking(false);
    }
  };

  const handleNextStepSuggestion = (text: string) => {
    setCustomRules(prev => [...prev, text]);
    setInstructionPrompt(prev => `${prev}\n\nAdditional task:\n- ${text}`);
    showToast('Added task to the agent instructions.', 'success');
  };

  const getGuidedCustomProfile = (rule: string, index: number): GuidedCustomProfile => {
    if (rule === defaultGuidedCustomProfile.description) {
      return {
        ...defaultGuidedCustomProfile,
        enabled: !disabledCustomRules.has(rule),
      };
    }

    return {
      id: `custom-profile-${index + 1}`,
      name: `Custom profile ${index + 1}`,
      description: rule,
      enabled: !disabledCustomRules.has(rule),
      createdBy: 'System',
      createdAt: 'Last edited Mar 18, 2026',
      overview: defaultGuidedCustomProfile.overview,
    };
  };

  const toggleGuidedCustomProfile = (rule: string, profileName: string) => {
    const willEnable = disabledCustomRules.has(rule);
    setDisabledCustomRules(prev => {
      const next = new Set(prev);
      if (willEnable) {
        next.delete(rule);
      } else {
        next.add(rule);
      }
      return next;
    });
    showToast(`${profileName} profile ${willEnable ? 'enabled' : 'disabled'}`, 'success');
  };

  const deleteGuidedCustomProfile = (rule: string) => {
    setCustomRules(prev => prev.filter(item => item !== rule));
    setDisabledCustomRules(prev => {
      const next = new Set(prev);
      next.delete(rule);
      return next;
    });
  };

  const addGuidedCustomProfile = () => {
    const nextRule = customRules.length < guidedCustomProfileLimit
      ? guidedCustomProfileDescriptions.find(rule => !customRules.includes(rule))
      : undefined;
    if (!nextRule) return;

    setCustomRules(prev => {
      if (prev.length >= guidedCustomProfileLimit) return prev;
      if (prev.includes(nextRule)) return prev;
      return [...prev, nextRule];
    });
    setDisabledCustomRules(prev => {
      const next = new Set(prev);
      next.delete(nextRule);
      return next;
    });
  };

  const handleReviewPreviewAction = () => {
    if (visibleSteps.includes('preview')) {
      setEvaStep('testing');
      return;
    }

    pendingPreviewScrollRef.current = true;
    setShowEvaGeneratedSidePanel(true);
    setEvaStep('preview');
  };

  const generatedName = draft.name.includes('Customer')
    ? 'ClaimClarity'
    : draft.name.replace(/\s+AI Assistant Agent$/, '').replace(/\s+Eva Agent$/, '').replace(/\s+Agent$/, '') || 'AIAssistantAgent';

  const currentStepIndex = evaStepOrder.indexOf(evaStep);
  const visibleSteps = evaStepOrder.slice(0, currentStepIndex + 1);
  const hideConversationalOnboardingForms =
    conversationalOnboardingStep === 'ready-for-studio' &&
    guidanceVisible &&
    currentStepIndex >= evaStepOrder.indexOf('instructions');
  const latestUserMessage = [...messages].reverse().find(message => message.role === 'user');
  const existingAgentList = Object.values(agents);
  const aiEngineOptions = aiEngines.map(engine => ({ value: engine.name, label: engine.name }));
  const profileInitials = agentName
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EA';
  const retailPreviewAgentName = agentName.trim() || PREVIEW_RETAIL_AGENT_LABEL;
  const retailPreviewAgentIntro =
    agentDescription.trim() ||
    draft.goals[0]?.trim() ||
    'Preview this agent’s caller experience.';
  const filteredAgents = existingAgentList.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && agent.status === 'Published') ||
      (statusFilter === 'draft' && agent.status !== 'Published');
    return matchesSearch && matchesStatus;
  });
  /* `freeChatActive` keeps the layout out of landing while the user is
     in a back-and-forth with the LLM. Without it the UI would fall back
     to the hero + starter cards the moment evaThinking turns off,
     erasing the assistant's reply. The chat-thread render below is gated
     on the same flag. */
  const showLandingOptions = !guidanceVisible && !evaThinking && !orchestrationSuggested && !freeChatActive;
  const showBuildFlow = landingMode === 'build' || guidanceVisible || evaThinking || orchestrationSuggested || freeChatActive;
  const shouldShowEvaThreadPanel = showEvaThreadPanel && !showLandingOptions;

  useEffect(() => {
    if (!pendingPreviewScrollRef.current || !showEvaGeneratedSidePanel || evaStep !== 'preview') {
      return;
    }

    const timer = window.setTimeout(() => {
      sidePanelPreviewCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
      pendingPreviewScrollRef.current = false;
    }, 80);

    return () => window.clearTimeout(timer);
  }, [evaStep, showEvaGeneratedSidePanel]);

  const selectedLanguage = PROFILE_LANGUAGE_OPTIONS.find(option => option.value === personality.language);
  const selectedVoice = PROFILE_VOICE_OPTIONS.find(option => option.value === personality.voice);
  const languageSummary = selectedLanguage?.label ?? personality.language;
  const agentCharacterSummary = `${selectedVoice?.label ?? personality.voice} voice · ${personality.gender === 'neutral' ? 'Neutral' : personality.gender} character`;
  const instructionSummary = summarizeInstructionPrompt(instructionPrompt);
  const enabledStandardGuardrails = standardGuardrails.filter(item => item.enabled);
  const enabledAdvancedGuardrails = advancedGuardrailGroups.flatMap(group => group.items.filter(item => item.enabled));
  const enabledCustomRules = customRules.filter(rule => !disabledCustomRules.has(rule));
  const selectedGuardrailLabels = [
    ...enabledStandardGuardrails.map(item => item.name),
    ...enabledAdvancedGuardrails.map(item => item.name),
    ...enabledCustomRules,
  ];
  const customProfileAppliedCount = enabledCustomRules.length;
  const customProfileLimit = guidedCustomProfileLimit;
  const standardPrebuiltGroups = {
    security: standardGuardrails.filter(item => item.id.includes('jailbreak')),
    privacy: [] as typeof standardGuardrails,
    safety: standardGuardrails.filter(item => !item.id.includes('jailbreak')),
  };
  const prebuiltEnabledCount = enabledStandardGuardrails.length + enabledAdvancedGuardrails.length;
  const prebuiltTotalCount = standardGuardrails.length + advancedGuardrailGroups.reduce((sum, group) => sum + group.items.length, 0);
  const hasVoiceChannel = selectedChannels.includes('voice');
  const hasDigitalChannel = selectedChannels.includes('digital');
  const hasVideoChannel = selectedChannels.includes('video');
  const selectedDigitalChannelLabels = selectedDigitalChannels
    .map(channel => DIGITAL_CHANNEL_OPTIONS.find(option => option.value === channel)?.label)
    .filter(Boolean);
  const digitalChannelSummary = hasDigitalChannel
    ? `Digital (${selectedDigitalChannelLabels.join(', ') || 'Chat'})${digitalChannelAddress.trim() ? ` · ${digitalChannelAddress.trim()}` : ''}`
    : null;
  const voiceChannelSummary = hasVoiceChannel
    ? phoneNumberDeferred ? 'Voice' : `Voice · ${channelPhoneNumber}`
    : null;
  const videoChannelSummary = hasVideoChannel ? 'Video' : null;
  const channelSummary = [voiceChannelSummary, digitalChannelSummary, videoChannelSummary]
    .filter(Boolean)
    .join(' + ');
  const channelsConfigured = selectedChannels.length > 0 && (!hasDigitalChannel || Boolean(digitalChannelAddress.trim()));
  const activeTestingScenarioCopy = TESTING_SCENARIO_STEP_COPY[testingScenarioStep];
  const activeTestingScenarioSteps = testingScenarioDraft.method
    ? getScenarioStepsForMethod(testingScenarioDraft.method)
    : ['choose-method' as EvaTestingScenarioStep];
  const testingScenarioPageSteps: EvaTestingScenarioStep[] = testingScenarioDraft.method
    ? ['choose-method', ...activeTestingScenarioSteps]
    : ['choose-method'];
  const testingScenarioTotalCount = testingScenarioPageSteps.length;
  const testingScenarioStepNumber = testingScenarioStep === 'ready'
    ? testingScenarioTotalCount
    : testingScenarioPageSteps.includes(testingScenarioStep)
      ? testingScenarioPageSteps.indexOf(testingScenarioStep) + 1
      : 1;
  const testingScenarioCanSubmitCurrentStep = isTestingScenarioStepSubmittable();
  const previewLaunchInstruction = hasVoiceChannel
    ? `Voice is selected for ${agentName}. Use the mic in this preview to speak as the caller and hear the connected voice agent respond.`
    : `Before creating ${agentName}, run a quick preview session. Type or speak as an end user, and I will simulate how the configured agent would respond.`;
  /* Right-rail Progress + Summary + Context panel ONLY appears once a
     starter template is selected (guidanceVisible / orchestration /
     template-flow thinking). Free-chat with the LLM no longer triggers
     it — typing just shows the conversation thread above the composer
     until the user explicitly clicks a starter card or template
     suggestion chip. */
  const showGeneratedSidePanel =
    !freeChatActive && (guidanceVisible || evaThinking || orchestrationSuggested);
  const progressStepSource: Array<{ step: EvaConversationStep; label: string; detail: string }> = [
    {
      step: 'profile',
      label: '1. Profile',
      detail: `${agentName} · ${languageSummary}`,
    },
    {
      step: 'channels',
      label: '2. Channel',
      detail: channelSummary,
    },
    {
      step: 'instructions',
      label: '3. Instruction',
      detail: instructionSummary,
    },
    {
      step: 'knowledge',
      label: '4. Knowledge',
      detail: `${selectedKnowledgeBases.length} source${selectedKnowledgeBases.length === 1 ? '' : 's'} selected`,
    },
    {
      step: 'actions',
      label: '5. Action',
      detail: `${selectedActions.length} action${selectedActions.length === 1 ? '' : 's'} enabled`,
    },
    {
      step: 'security',
      label: '6. Guardrails',
      detail: `${securityTier === 'standard' ? 'Standard' : 'Advanced'} guardrails`,
    },
    {
      step: 'review',
      label: '7. Review',
      detail: 'Final configuration check',
    },
    {
      step: 'preview',
      label: '8. Preview',
      detail: hasVoiceChannel
        ? 'Voice test session'
        : previewMessages.length > 0
        ? `${previewMessages.filter(message => message.role === 'user').length} test message${previewMessages.filter(message => message.role === 'user').length === 1 ? '' : 's'}`
        : 'Run a test session',
    },
    {
      step: 'testing',
      label: '9. Testing',
      detail: readinessReport
        ? `${readinessReport.score}/100 readiness score`
        : testingScenarioStep === 'ready'
          ? 'Scenario ready to run'
          : `Scenario setup ${testingScenarioStepNumber}/${testingScenarioTotalCount}`,
    },
  ];
  /* While Eva is thinking, only reveal the first `sidePanelStepCount` items so
     the right-rail Progress card animates in alongside the left-pane planning
     log. The newest revealed item reads as "active" (currently being drafted)
     and prior ones as "done". After thinking ends, render the full list and
     fall back to the user-driven currentStepIndex status. */
  const visibleProgressCount = evaThinking
    ? Math.max(1, Math.min(progressStepSource.length, sidePanelStepCount))
    : progressStepSource.length;
  const generationProgressSteps = progressStepSource
    .slice(0, visibleProgressCount)
    .map((item, index) => ({
      ...item,
      status: evaThinking
        ? index === visibleProgressCount - 1
          ? 'active'
          : 'done'
        : currentStepIndex > index
          ? 'done'
          : currentStepIndex === index
            ? 'active'
            : 'queued',
    }));
  const groupedProgressSections: Array<{
    title: string;
    items: typeof generationProgressSteps;
  }> = [
    {
      title: 'Configuration',
      items: generationProgressSteps.filter(step =>
        ['profile', 'channels', 'instructions', 'knowledge', 'actions', 'security', 'review'].includes(step.step),
      ),
    },
    {
      title: 'Preview',
      items: generationProgressSteps.filter(step => step.step === 'preview'),
    },
    {
      title: 'Testing and Observability',
      items: generationProgressSteps.filter(step => step.step === 'testing'),
    },
  ].filter(section => section.items.length > 0);
  const openSidePanelStep = (step: EvaConversationStep) => {
    setEvaThinking(false);
    setGuidanceVisible(true);
    setOrchestrationSuggested(false);
    setEvaStep(step);
  };
  const selectedActionSet = new Set(selectedActions);
  const selectedKnowledgeBaseSet = new Set(selectedKnowledgeBases);
  const sidePanelActions = EVA_ACTION_ROWS.map(action => ({
    id: action.id,
    name: action.name,
    enabled: selectedActionSet.has(action.name),
  }));
  const sidePanelKnowledgeBases = draft.knowledgeBases.map(kb => ({
    id: kb.name,
    name: kb.name,
    enabled: selectedKnowledgeBaseSet.has(kb.name),
  }));
  /* Renders the *mid-step* user/assistant exchange — i.e. messages
     the user sent VIA the waterfall composer while on the active
     step (and Eva's LLM replies to them). Untagged messages (e.g.
     the template-selection trigger pushed by `handleTemplateSelect`)
     are intentionally skipped — they belong to the planning hero,
     not the in-step thread.

     Anchored AFTER the step's `AiResponseMessage` (the form), so the
     conversation reads naturally:
        Eva: "Plan complete..." + form
        You: "how to fill the welcome message?"
        Eva is thinking...   →   Eva: "Try…"
     Once the user advances to the next step, the now-previous step
     stops matching `evaStep === step`, so the mid-step exchange is
     hidden and the next step takes over. */
  const renderUserPromptForStep = (step: EvaConversationStep) => {
    if (evaStep !== step) return null;
    /* Find the latest user message tagged with this step. Walk
       backwards so we get the most recent question. */
    const midStepUserMessage = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'user' && msg.originStep === step) return msg;
      }
      return null;
    })();
    if (!midStepUserMessage && !waterfallThinking) return null;
    if (step === 'testing' && midStepUserMessage?.text === 'Redo testing') return null;
    /* Eva's reply for THIS step is the most recent assistant message
       tagged with this step (runWaterfallLlmReply tags both sides). */
    const midStepAssistantReply = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant' && msg.originStep === step) return { message: msg, index: i };
        if (msg.role === 'user' && msg.originStep === step) break;
      }
      return null;
    })();
    return (
      <>
        {midStepUserMessage && (
          <AiUserMessage
            key={`user-${step}-${midStepUserMessage.text}`}
            text={midStepUserMessage.text}
          />
        )}
        {/* While the LLM is in flight, show a processing bubble so
            the user sees Eva is working on it. Once the reply lands,
            swap it out for Eva's actual response. */}
        {waterfallThinking && (
          <AiResponseMessage
            key={`thinking-${step}`}
            className="eva-ai-response"
            showActions={false}
            assistantName="AI Assistant is thinking..."
            assistantState="processing"
            content={null}
          />
        )}
        {!waterfallThinking && midStepAssistantReply && (
          <AiResponseMessage
            key={`reply-${step}-${midStepAssistantReply.message.text}`}
            className="eva-ai-response"
            showActions={false}
            assistantName="AI Assistant"
            content={midStepAssistantReply.message.text}
          >
            {midStepAssistantReply.message.suggestion && (
              <div className="eva-field-suggestion">
                <div className="eva-field-suggestion__label">
                  Suggested {getFieldSuggestionLabel(midStepAssistantReply.message.suggestion.field)}
                </div>
                <blockquote className="eva-field-suggestion__value">
                  {midStepAssistantReply.message.suggestion.value}
                </blockquote>
                <div className="eva-field-suggestion__actions">
                  <Button
                    size="sm"
                    onClick={() => applyFieldSuggestion(
                      midStepAssistantReply.message.suggestion!,
                      midStepAssistantReply.index,
                    )}
                    disabled={midStepAssistantReply.message.suggestionAccepted}
                  >
                    {midStepAssistantReply.message.suggestionAccepted ? 'Accepted' : 'Accept'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => tryAnotherFieldSuggestion(midStepAssistantReply.message.suggestion!)}
                  >
                    Try another option
                  </Button>
                </div>
              </div>
            )}
          </AiResponseMessage>
        )}
      </>
    );
  };

  const renderRetailDiscoveryProcess = () => (
    <AiResponseMessage
      className="eva-ai-response"
      showActions={false}
      assistantName="AI Assistant is checking Matt’s store context..."
      assistantState="processing"
      content="I’m checking the store details and connected systems before asking Matt to choose setup options."
    >
      <div className="eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning eva-waterfall-status--dynamic" aria-label="AI Assistant discovery process">
        {RETAIL_DISCOVERY_ROWS.map((row, index) => {
          const resolvedCount = Math.max(1, retailDiscoveryProgress);
          const isPlaceholder = index >= resolvedCount;
          const status = index === resolvedCount - 1 && resolvedCount < RETAIL_DISCOVERY_ROWS.length
            ? 'active'
            : 'done';
          if (isPlaceholder) {
            return (
              <div
                key={row.title}
                className="eva-waterfall-status__row eva-waterfall-status__row--placeholder"
                aria-hidden="true"
              >
                <Icon name="shape-circle" weight="bold" size="sm" />
                <span className="eva-retail-discovery-placeholder">
                  <span />
                  <span />
                </span>
              </div>
            );
          }
          return (
            <div key={row.title} className={`eva-waterfall-status__row eva-waterfall-status__row--${status}`}>
              <Icon name={status === 'done' ? 'check-circle-filled' : 'shape-circle'} weight="bold" size="sm" />
              <span>
                <strong>{row.title}</strong>
                {row.detail}
              </span>
            </div>
          );
        })}
      </div>
    </AiResponseMessage>
  );

  const renderRetailDiscoveryTrace = () => (
    <AccordionItem
      title={(
        <span className="eva-retail-discovery-trace__title">
          <Icon name="sparkle" weight="bold" size="sm" />
          Checked store website, inventory system, and organization profile
        </span>
      )}
      className="eva-retail-discovery-trace"
      size="small"
      styleVariant="borderless"
    >
      <div className="eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning eva-waterfall-status--dynamic" aria-label="Completed AI Assistant discovery process">
        {RETAIL_DISCOVERY_ROWS.map(row => (
          <div key={row.title} className="eva-waterfall-status__row eva-waterfall-status__row--done">
            <Icon name="check-circle-filled" weight="bold" size="sm" />
            <span>
              <strong>{row.title}</strong>
              {row.detail}
            </span>
          </div>
        ))}
      </div>
    </AccordionItem>
  );

  const renderEvaPlanningRows = (visibleCount = evaPlanningRows.length, dynamic = false, complete = false) => (
    <div
      className={`eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning${dynamic ? ' eva-waterfall-status--dynamic' : ''}`}
      aria-label="AI Assistant planning process"
    >
      {evaPlanningRows.slice(0, visibleCount).map((item, index) => {
        const status = complete
          ? 'done'
          : dynamic
          ? (index === visibleCount - 1 && visibleCount < evaPlanningRows.length ? 'active' : 'done')
          : item.status;
        const iconName = status === 'done' ? 'check-circle-filled' : item.icon;
        return (
          <div key={`${item.title}-${index}`} className={`eva-waterfall-status__row eva-waterfall-status__row--${status}`}>
            <Icon name={iconName} weight="bold" size="sm" />
            <span>
              <strong>{item.title}</strong>
              {item.text(draft, generatedName, latestUserMessage?.text)}
            </span>
          </div>
        );
      })}
    </div>
  );
  const renderEvaPlanningProcess = () => (
    <AccordionItem
      title={(
        <span className="eva-planning-accordion__title">
          <Icon name="sparkle" weight="bold" size="sm" />
          View AI Assistant’s thinking trace
        </span>
      )}
      className="eva-planning-accordion"
      size="small"
    >
      {renderEvaPlanningRows(evaPlanningRows.length, false, true)}
    </AccordionItem>
  );

  const toggleKnowledgeBase = (knowledgeBase: string) => {
    setSelectedKnowledgeBases(prev =>
      prev.includes(knowledgeBase)
        ? prev.filter(item => item !== knowledgeBase)
        : [...prev, knowledgeBase],
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action)
        ? prev.filter(item => item !== action)
        : [...prev, action],
    );
  };

  const toggleStandardGuardrail = (id: string) => {
    setStandardGuardrails(prev => prev.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item,
    ));
  };

  const updateStandardGuardrail = (
    id: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setStandardGuardrails(prev => prev.map(item =>
      item.id === id ? { ...item, [key]: value } : item,
    ));
  };

  const toggleAdvancedGuardrail = (groupId: string, itemId: string) => {
    setAdvancedGuardrailGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map(item =>
              item.id === itemId ? { ...item, enabled: !item.enabled } : item,
            ),
          }
        : group,
    ));
  };

  const updateAdvancedGuardrail = (
    groupId: string,
    itemId: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setAdvancedGuardrailGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map(item =>
              item.id === itemId ? { ...item, [key]: value } : item,
            ),
          }
        : group,
    ));
  };

  const toggleAdvancedGroup = (groupId: string) => {
    setExpandedAdvancedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const togglePrebuiltGuardrailGroup = (groupId: string, open: boolean) => {
    setExpandedPrebuiltGuardrailGroups(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  };

  const renderSecurityGuardrailControls = (
    id: string,
    name: string,
    sensitivity: EvaSensitivity,
    enforcement: EvaEnforcement,
    direction: EvaDirection,
    onSensitivityChange: (value: EvaSensitivity) => void,
    onEnforcementChange: (value: EvaEnforcement) => void,
    onDirectionChange: (value: EvaDirection) => void,
  ) => (
    <div className="security-guardrail-controls">
      <div className="security-control-row">
        <label className="security-control-label">Sensitivity</label>
        <div className="security-slider-wrap">
          <Slider
            value={sensitivityToValue[sensitivity]}
            onChange={value => onSensitivityChange(valueToSensitivity(value as number))}
            min={0}
            max={100}
            step={33}
            showTicks
            aria-label={`${name} sensitivity`}
          />
          <div className="security-sensitivity-labels security-sensitivity-labels--four">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>
      </div>
      <div className="security-control-row">
        <label className="security-control-label">Action</label>
        <RadioGroup
          name={`security-action-${id}`}
          value={enforcement}
          onChange={value => onEnforcementChange(value as EvaEnforcement)}
          className="security-enforcement-control"
        >
          <Radio value="monitor" label="Monitor" />
          <Radio value="block" label="Block" />
        </RadioGroup>
      </div>
      <div className="security-control-row">
        <label className="security-control-label">Direction</label>
        <RadioGroup
          name={`security-direction-${id}`}
          value={direction}
          onChange={value => onDirectionChange(value as EvaDirection)}
          className="security-enforcement-control"
        >
          <Radio value="prompt" label="Prompt" />
          <Radio value="response" label="Response" />
        </RadioGroup>
      </div>
    </div>
  );

  const renderStandardPrebuiltGuardrail = (guardrail: typeof standardGuardrails[number]) => (
    <AccordionItem
      key={guardrail.id}
      styleVariant="borderless"
      className="security-prebuilt-rail-item"
      defaultExpanded={guardrail.enabled}
      title={
        <div className="security-guardrail-header">
          <Toggle
            checked={guardrail.enabled}
            onChange={() => toggleStandardGuardrail(guardrail.id)}
            size="compact"
            aria-label={`${guardrail.enabled ? 'Disable' : 'Enable'} ${guardrail.name}`}
          />
          <div className="security-guardrail-header-text">
            <span className="security-guardrail-name">{guardrail.name}</span>
            <span className="security-guardrail-desc">{guardrail.description}</span>
          </div>
        </div>
      }
    >
      {renderSecurityGuardrailControls(
        guardrail.id,
        guardrail.name,
        guardrail.sensitivity,
        guardrail.enforcement,
        guardrail.direction,
        value => updateStandardGuardrail(guardrail.id, 'sensitivity', value),
        value => updateStandardGuardrail(guardrail.id, 'enforcement', value),
        value => updateStandardGuardrail(guardrail.id, 'direction', value),
      )}
    </AccordionItem>
  );

  const renderAdvancedPrebuiltGuardrail = (
    group: typeof advancedGuardrailGroups[number],
    item: typeof advancedGuardrailGroups[number]['items'][number],
  ) => (
    <AccordionItem
      key={item.id}
      styleVariant="borderless"
      className="security-prebuilt-rail-item"
      defaultExpanded={item.enabled}
      title={
        <div className="security-guardrail-header">
          <Toggle
            checked={item.enabled}
            onChange={() => {
              if (!item.enabled) setSecurityTier('advanced');
              toggleAdvancedGuardrail(group.id, item.id);
            }}
            size="compact"
            aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${item.name}`}
          />
          <div className="security-guardrail-header-text">
            <span className="security-guardrail-name">{item.name}</span>
            <span className="security-guardrail-desc">{item.description}</span>
          </div>
        </div>
      }
    >
      {renderSecurityGuardrailControls(
        item.id,
        item.name,
        item.sensitivity,
        item.enforcement,
        item.direction,
        value => updateAdvancedGuardrail(group.id, item.id, 'sensitivity', value),
        value => updateAdvancedGuardrail(group.id, item.id, 'enforcement', value),
        value => updateAdvancedGuardrail(group.id, item.id, 'direction', value),
      )}
    </AccordionItem>
  );

  if (landingMode === 'existing') {
    return (
      <div className="primary-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Agents</h1>
            <p className="page-subtitle">Manage your AI agents</p>
          </div>
          <Button onClick={handleBuildFromScratch}>+ Create Agent</Button>
        </div>

        <div className="secondary-content">
          <div className="filter-bar">
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              leadingIcon="search"
              clearable
              onClear={() => setSearchQuery('')}
              className="filter-bar-search"
            />
            <Dropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="view-switcher">
              <button
                type="button"
                className={`view-switcher-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                aria-label="Show table view"
              >
                <Icon name="view-list" weight="bold" size="sm" />
              </button>
              <button
                type="button"
                className={`view-switcher-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Show grid view"
              >
                <Icon name="view-thumbnail" weight="bold" size="sm" />
              </button>
            </div>
          </div>

          {viewMode === 'table' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Agent</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Sessions</TableHeader>
                  <TableHeader>Success Rate</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody empty={filteredAgents.length === 0} colSpan={5}>
                {filteredAgents.map(agent => (
                  <TableRow key={agent.id} onClick={() => handleAgentClick(agent.id)}>
                    <TableCell>
                      <div className="agents-table-agent">
                        <div className="agents-table-agent__avatar" style={{ background: agent.gradient }}>
                          {agent.initials}
                        </div>
                        <div>
                          <div className="agents-table-agent__name">{agent.name}</div>
                          <div className="agents-table-agent__description">{agent.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(agent.statusClass)}>{agent.status}</Badge>
                    </TableCell>
                    <TableCell>{agent.sessions}</TableCell>
                    <TableCell>{agent.successRate}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={event => {
                          event.stopPropagation();
                          handleConfigureClick(agent.id);
                        }}
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {viewMode === 'grid' && (
            <div className="agents-card-grid">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onSelect={() => handleAgentClick(agent.id)}
                  onConfigure={() => handleConfigureClick(agent.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`primary-content eva-agents-landing eva-agents-landing--flush${studioTransitioning ? ' eva-agents-landing--studio-transitioning' : ''}`}>
      {shouldShowEvaThreadPanel && (
        <aside className="eva-thread-panel-shell" aria-label="AI Assistant threads">
          <AiThreadPanel
            threads={evaThreads}
            activeThreadId={activeEvaThreadId}
            onSelectThread={handleSelectEvaThread}
            onNewThread={handleNewEvaThread}
            onRenameThread={handleRenameEvaThread}
            onDeleteThread={handleDeleteEvaThread}
            onCollapse={() => setShowEvaThreadPanel(false)}
          />
        </aside>
      )}

      <div
        className={`eva-first-interface${showLandingOptions ? ' eva-first-interface--landing eva-landing-shell' : ''}${!freeChatActive && (guidanceVisible || evaThinking || orchestrationSuggested) ? ' eva-first-interface--generated' : ''}${freeChatActive && !guidanceVisible && !orchestrationSuggested ? ' eva-first-interface--free-chat' : ''}`}
      >
        {/* Agent header (avatar + title + Draft badge + description) is
            tied to the build flow only. While the user is just chatting
            with Eva (`freeChatActive`) or waiting on the planning hero
            (`evaThinking`), no template/agent has been confirmed yet,
            so showing an agent name + "Draft" badge is misleading. The
            header pops in the moment the build flow takes over
            (`guidanceVisible`). Same gate applies across all design
            variations that mount this experience. */}
        {guidanceVisible && !evaThinking && (
          <div className="eva-view-actions">
            <div className="eva-view-header agent-header">
              <div className="agent-avatar" style={{ background: gradient }}>
                {profileInitials}
              </div>
              <div className="agent-info">
                <div className="agent-name-row">
                  <span className="agent-name">{agentName}</span>
                  <Badge variant="warning">Draft</Badge>
                </div>
                <div className="agent-meta">{agentDescription} • Last updated just now</div>
              </div>
            </div>
            <div className="eva-view-actions__controls">
              {/* Momentum `Button` doesn't forward refs, so wrap in a tight inline-flex
                  span purely as the menu's positioning anchor (no visual change). */}
              <span
                ref={panelMenu.anchorRef as React.RefObject<HTMLSpanElement>}
                style={{ display: 'inline-flex' }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="eva-view-actions__icon-btn"
                  onClick={panelMenu.toggle}
                  aria-label="Panel options"
                  aria-haspopup="menu"
                  aria-expanded={panelMenu.open}
                  title="Panel options"
                >
                  <Icon name="side-panel" weight="bold" size="sm" />
                </Button>
              </span>
              <MenuOverlay
                open={panelMenu.open}
                anchorRef={panelMenu.anchorRef}
                onClose={panelMenu.close}
                align="left"
              >
                <MenuItem
                  label="View Summary"
                  icon="meeting-summary"
                  onClick={handleViewSummary}
                />
                <MenuItem
                  label={showEvaThreadPanel ? 'Close thread' : 'Open thread'}
                  icon="side-panel"
                  onClick={() => {
                    setShowEvaThreadPanel(prev => !prev);
                    panelMenu.close();
                  }}
                />
                <MenuItem
                  label={showEvaGeneratedSidePanel ? 'Collapse side panel' : 'Open side panel'}
                  icon="arrow-right"
                  onClick={() => {
                    setShowEvaGeneratedSidePanel(prev => !prev);
                    panelMenu.close();
                  }}
                />
              </MenuOverlay>
              <Button
                variant="secondary"
                size="sm"
                className="eva-view-actions__icon-btn"
                onClick={() => openEvaCanvas()}
                aria-label="Open canvas view"
                title="Canvas view"
              >
                <Icon name="workflow-deployments" weight="bold" size="sm" />
              </Button>
              <Button variant="secondary" size="sm" onClick={handleNewEvaThread}>
                <Icon name="plus" weight="bold" size="sm" />
                Create new agent
              </Button>
            </div>
          </div>
        )}

        {showLandingOptions && (
          <section className="eva-first-interface__hero" aria-labelledby="eva-landing-title">
            <div className="eva-landing-hero-brand">
              <EvaHeroAnimation />
              <h1 id="eva-landing-title">AI Agent Studio</h1>
            </div>
            <h2>Build, deploy, and manage AI agents for every interaction.</h2>
          </section>
        )}

        {/* Inline composer between hero and prompt cards — matches the
            form-builder landing layout so all chat-based variations share
            one entry-point design. The "real" composer rendered below
            (the sticky/footer one) is suppressed while we're in the
            landing state to avoid two composers stacking. */}
        {showLandingOptions && landingMode === 'build' && (
          <div className="eva-landing-composer" aria-label="Talk to AI Assistant">
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handleSend}
              processing={false}
              disabled={evaThinking}
              placeholder={'Describe the agent you want to build.\ne.g. A friendly banking assistant that helps customers check their balance, dispute charges, and get account help — always calm and reassuring.'}
              suggestions={[]}
              voiceActive={voiceActive}
              onVoiceToggle={() => setVoiceActive(prev => !prev)}
              showDisclaimer={false}
            />
          </div>
        )}

        {showLandingOptions && landingMode === 'build' && (
          <div className="eva-landing-divider eva-landing-template-divider" role="separator" aria-label="choose a template">
            <span className="eva-landing-divider-line" aria-hidden="true" />
            <span className="eva-landing-divider-text">Choose a template</span>
            <span className="eva-landing-divider-line" aria-hidden="true" />
          </div>
        )}

        {showLandingOptions && landingMode === 'build' && (
          <section className="eva-prompt-examples" aria-label="Quick templates">
            {starterPrompts.slice(0, 4).map(prompt => (
              <button
                key={prompt.templateId}
                type="button"
                className="eva-prompt-card"
                onClick={() => handleTemplateSelect(prompt.templateId)}
              >
                <span className="eva-prompt-card__header">
                  <span className="eva-prompt-card__icon" aria-hidden="true">
                    <Icon name={prompt.icon} weight="bold" size="md" />
                  </span>
                  <strong>{prompt.title}</strong>
                </span>
                <span className="eva-prompt-card__copy">
                  <strong>{prompt.summary}</strong>
                  <span>{prompt.description}</span>
                </span>
                <small>Use template</small>
              </button>
            ))}
          </section>
        )}

        {/* Secondary entry points — same pattern used on the form-builder
            landing. The "Or" divider separates the templated/free-text
            path above from the two direct shortcuts below. */}
        {showLandingOptions && landingMode === 'build' && (
          <>
            <div className="eva-landing-divider" role="separator" aria-label="or">
              <span className="eva-landing-divider-line" aria-hidden="true" />
              <span className="eva-landing-divider-text">Or</span>
              <span className="eva-landing-divider-line" aria-hidden="true" />
            </div>

            <div className="eva-landing-secondary-actions">
              <Button variant="secondary" onClick={handleSwitchToExistingAgents}>
                <Icon name="user" weight="bold" size="sm" />
                Existing agent
              </Button>

              <Button variant="secondary" onClick={handleBuildFromScratch}>
                <Icon name="plus" weight="bold" size="sm" />
                Start from scratch
              </Button>
            </div>
          </>
        )}

        {/* Free-chat dialogue surface — renders ABOVE the right-rail
            wrapper and is mutually exclusive with it. We're in this
            state when the user has typed a message but hasn't yet
            committed to a starter template. The Progress + Summary +
            Context cards stay hidden until the user clicks a template
            card or template-suggestion chip. */}
        {freeChatActive && !guidanceVisible && !orchestrationSuggested && (
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            className="eva-free-chat-new-thread"
            onClick={handleNewEvaThread}
            aria-label="Start a new chat"
            title="Start a new chat"
          >
            <Icon name="edit" weight="bold" size="sm" />
          </Button>
        )}

        {freeChatActive && !guidanceVisible && !orchestrationSuggested && (
          <section
            className={`eva-dialogue eva-first-interface__free-chat${
              messages.some(message => message.originStep === 'retail-welcome-choice')
                ? ' eva-first-interface__free-chat--dense-bottom'
                : ''
            }${
              messages.some(message => message.originStep === 'retail-phone-choice')
                ? ' eva-first-interface__free-chat--phone-focus'
                : ''
            }${
              messages.some(message => message.originStep === 'retail-agent-name') &&
              (
                retailPrototypeStep === 'agent-name' ||
                (
                  retailPrototypeStep === 'welcome' &&
                  evaThinking &&
                  !messages.some(message => message.originStep === 'retail-welcome-choice')
                )
              )
                ? ' eva-first-interface__free-chat--agent-name-focus'
                : ''
            }`}
            aria-label="AI Assistant conversation"
            aria-live="polite"
          >
            {messages.map((message, index) => {
              if (message.role === 'user') {
                return <AiUserMessage key={`free-${index}`} text={message.text} />;
              }
              /* When Eva attached follow-up options to a reply, append
                 the "View other options" sentinel chip so the user can
                 pivot to the full starter-card grid even after they've
                 narrowed down to a specific template branch. Mirrors
                 the form-based variation. */
              const baseFollowups = message.followups ?? [];
              const isRetailChannelChoice = message.originStep === 'retail-channel-choice';
              const isRetailChannelLocked = isRetailChannelChoice && retailPrototypeStep !== 'channel';
              const isRetailPhonePrompt = message.originStep === 'retail-phone-choice';
              const isRetailPhoneLocked = isRetailPhonePrompt && retailPrototypeStep !== 'phone';
              const isRetailAgentNamePrompt = message.originStep === 'retail-agent-name';
              const isRetailAgentNameLocked = isRetailAgentNamePrompt && retailPrototypeStep !== 'agent-name';
              const isRetailWelcomePrompt = message.originStep === 'retail-welcome-choice';
              const isRetailWelcomeLocked = isRetailWelcomePrompt && retailPrototypeStep !== 'welcome';
              const isRetailKnowledgePrompt = message.originStep === 'retail-knowledge-choice';
              const isRetailActionsPrompt = message.originStep === 'retail-actions-choice';
              const isRetailKnowledgeLocked = isRetailKnowledgePrompt && retailPrototypeStep !== 'knowledge';
              const isRetailActionsLocked = isRetailActionsPrompt && retailPrototypeStep !== 'actions';
              const isRetailFinalActions = message.originStep === 'retail-final-actions';
              const isRetailCompleteActions = message.originStep === 'retail-complete-actions';
              const isRetailInlinePreview = message.originStep === 'retail-inline-preview';
              const retailPhoneQuery = retailPhoneSearch.trim().toLowerCase();
              const visibleRetailPhoneOptions = RETAIL_PHONE_NUMBER_OPTIONS.filter(option => {
                if (!retailPhoneQuery) return true;
                return [
                  option.label,
                  option.countryCode,
                  option.localNumber,
                  option.meta,
                ].some(value => value.toLowerCase().includes(retailPhoneQuery));
              });
              const selectedRetailPhoneOption =
                RETAIL_PHONE_NUMBER_OPTIONS.find(option => option.value === channelPhoneNumber) ??
                RETAIL_PHONE_NUMBER_OPTIONS[0];
              const isControlledPrototypePrompt =
                baseFollowups.includes(CONTINUE_TO_STUDIO_LABEL) ||
                baseFollowups.includes(RETAIL_VOICE_LABEL) ||
                baseFollowups.includes(RETAIL_VIDEO_LABEL) ||
                baseFollowups.some(option => CHANNEL_PHONE_NUMBER_OPTIONS.some(phone => phone.label === option || phone.value === option)) ||
                baseFollowups.includes(CONNECT_RETAIL_PHONE_LATER_LABEL) ||
                baseFollowups.includes(RETAIL_AGENT_NAME_LABEL) ||
                baseFollowups.some(option => RETAIL_RECOMMENDED_WELCOME_MESSAGES.some(welcome => welcome.text === option)) ||
                baseFollowups.includes(COMPLETE_RETAIL_AGENT_LABEL);
              const followups = baseFollowups.length > 0 && !isControlledPrototypePrompt
                ? [...baseFollowups, OTHER_TEMPLATES_LABEL]
                : baseFollowups;
              return (
                <AiResponseMessage
                  key={`free-${index}`}
                  className="eva-ai-response"
                  data-retail-origin-step={message.originStep}
                  showActions={false}
                  assistantName="AI Assistant"
                  content={isRetailChannelChoice ? (
                    <>
                      <p>{message.text}</p>
                      {renderRetailDiscoveryTrace()}
                    </>
                  ) : isRetailFinalActions ? (
                    <div className="eva-retail-final-heading">
                      <div className="eva-retail-final-heading__header">
                        <strong>{`Your ${agentName} draft is ready.`}</strong>
                        <span>
                          I saved the voice channel, selected knowledge sources, selected actions, escalation contact, and greeting.
                        </span>
                      </div>
                      <div className="eva-retail-final-heading__body">
                        <p>Review the agent, create it now, or configure advanced settings.</p>
                        <p>To change anything, ask me or open advanced configuration.</p>
                      </div>
                    </div>
                  ) : message.text}
                  followups={isRetailChannelChoice || isRetailPhonePrompt || isRetailAgentNamePrompt || isRetailWelcomePrompt || isRetailKnowledgePrompt || isRetailActionsPrompt || isRetailFinalActions || isRetailCompleteActions || isRetailInlinePreview ? [] : followups}
                  onFollowup={handleLlmFollowupClick}
                >
                  {isRetailChannelChoice && (
                    <div className="eva-retail-channel-panel">
                      <div className="eva-retail-channel-options" role="group" aria-label="Channel options">
                        {RETAIL_CHANNEL_OPTIONS.map(option => {
                          const isSelected = retailSelectedChannels.includes(option.label);
                          return (
                            <Card
                              key={option.label}
                              clickable
                              selected={isSelected}
                              disabled={isRetailChannelLocked}
                              className="eva-retail-channel-option card-selectable"
                              aria-label={`${option.title}. ${option.description}`}
                              aria-pressed={isSelected}
                              onClick={() => toggleRetailChannel(option.label)}
                            >
                              <span className="card-select-icon eva-retail-channel-option__select" aria-hidden="true">
                                <Icon name={isSelected ? 'check-circle-filled' : 'check-circle'} weight="bold" size={20} />
                              </span>
                              <span className="eva-retail-channel-option__icon" aria-hidden="true">
                                <Icon name={option.icon} weight="regular" size={24} />
                              </span>
                              <strong>{option.title}</strong>
                              <span className="eva-retail-channel-option__description">{option.description}</span>
                            </Card>
                          );
                        })}
                      </div>
                      {!isRetailChannelLocked && (
                        <div className="eva-retail-recommendation-actions">
                          <Button size="sm" onClick={() => continueRetailChannelSelection()}>
                            {RETAIL_CONFIRM_CHANNELS_LABEL}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {isRetailPhonePrompt && !isRetailPhoneLocked && (
                    <div
                      ref={retailPhoneSelectorRef}
                      className="eva-retail-phone-selector"
                      role="group"
                      aria-label="Connected phone numbers"
                    >
                      <button
                        type="button"
                        className="eva-retail-phone-selector__trigger"
                        aria-haspopup="listbox"
                        aria-expanded={retailPhoneDropdownOpen}
                        onClick={() => setRetailPhoneDropdownOpen(open => !open)}
                      >
                        <span className="eva-phone-country-pill">
                          <span aria-hidden="true">{selectedRetailPhoneOption.flag}</span>
                          {selectedRetailPhoneOption.countryCode}
                        </span>
                        <span className="eva-retail-phone-selector__number">
                          {selectedRetailPhoneOption.localNumber}
                        </span>
                        <Icon name="arrow-down" weight="bold" size="sm" />
                      </button>
                      {retailPhoneDropdownOpen && (
                        <div className="eva-retail-phone-selector__menu">
                          <label className="eva-retail-phone-selector__search-label" htmlFor="eva-retail-phone-search">
                            Search connected numbers
                          </label>
                          <input
                            id="eva-retail-phone-search"
                            type="search"
                            className="form-input eva-retail-phone-selector__search"
                            value={retailPhoneSearch}
                            placeholder="Search by country, city, or number"
                            onChange={event => setRetailPhoneSearch(event.target.value)}
                          />
                          <div className="eva-retail-phone-selector__list" role="listbox" aria-label="Available phone numbers">
                            {visibleRetailPhoneOptions.map(option => (
                              <button
                                key={option.value}
                                type="button"
                                className={`eva-retail-phone-selector__option${option.value === channelPhoneNumber ? ' eva-retail-phone-selector__option--selected' : ''}`}
                                role="option"
                                aria-selected={option.value === channelPhoneNumber}
                                onClick={() => selectRetailPhoneNumber(option.value)}
                              >
                                <span className="eva-phone-country-pill">
                                  <span aria-hidden="true">{option.flag}</span>
                                  {option.countryCode}
                                </span>
                                <span className="eva-retail-phone-selector__number">{option.localNumber}</span>
                                <span className="eva-retail-phone-selector__meta">{option.meta}</span>
                              </button>
                            ))}
                            {visibleRetailPhoneOptions.length === 0 && (
                              <span className="eva-retail-phone-selector__empty">No connected numbers found.</span>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        className="ai-footer__suggestion eva-retail-phone-selector__later"
                        onClick={() => handleLlmFollowupClick(CONNECT_RETAIL_PHONE_LATER_LABEL)}
                      >
                        {CONNECT_RETAIL_PHONE_LATER_LABEL}
                      </button>
                    </div>
                  )}
                  {isRetailAgentNamePrompt && !isRetailAgentNameLocked && (
                    <div className="eva-retail-agent-name-options">
                      {!retailAgentNameInputVisible ? (
                        <>
                          <button
                            type="button"
                            className="ai-footer__suggestion"
                            onClick={() => handleLlmFollowupClick(RETAIL_AGENT_NAME_LABEL)}
                          >
                            {RETAIL_AGENT_NAME_LABEL}
                          </button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLlmFollowupClick(RETAIL_CUSTOM_AGENT_NAME_LABEL)}
                          >
                            <Icon name="edit" weight="bold" size="sm" />
                            {RETAIL_CUSTOM_AGENT_NAME_LABEL}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={retailAgentNameInput}
                            onChange={event => setRetailAgentNameInput(event.target.value)}
                            aria-label="Custom agent name"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLlmFollowupClick(RETAIL_AGENT_NAME_CUSTOM_LABEL)}
                            disabled={!retailAgentNameInput.trim()}
                          >
                            Use typed name
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  {isRetailWelcomePrompt && (
                    <div className="eva-retail-welcome-options" role="group" aria-label="Welcome message option">
                      <div className="eva-retail-welcome-option">
                        {retailWelcomeInputVisible ? (
                          <Textarea
                            value={retailWelcomeInput}
                            onChange={event => setRetailWelcomeInput(event.target.value)}
                            aria-label="Edit welcome message"
                            rows={4}
                          />
                        ) : (
                          <span className="eva-retail-welcome-option__text">{retailWelcomeInput}</span>
                        )}
                        <span className="eva-retail-welcome-option__reason">
                          <Icon name="sparkle" weight="bold" size="sm" />
                          {[RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].tone, RETAIL_RECOMMENDED_WELCOME_MESSAGES[0].reason].filter(Boolean).join(' ')}
                        </span>
                        {!isRetailWelcomeLocked && (
                          <div className="eva-retail-welcome-option__actions">
                            <Button size="sm" onClick={() => handleLlmFollowupClick(retailWelcomeInput)}>
                              Use greeting
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleLlmFollowupClick(RETAIL_EDIT_WELCOME_LABEL)}>
                              <Icon name="edit" weight="bold" size="sm" />
                              Edit greeting
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {isRetailKnowledgePrompt && (
                    <div className="eva-retail-recommendation-panel" aria-label="Knowledge base recommendations">
                      <div className="eva-retail-recommendation-section">
                        <span className="eva-retail-recommendation-eyebrow">Connected knowledge bases</span>
                        <div className="eva-retail-connected-list">
                          {selectedKnowledgeBases.map(item => (
                            <span key={item} className="eva-retail-connected-chip">
                              <Icon className="eva-retail-connected-chip__status" name="check-circle-filled" weight="bold" size="sm" />
                              {item}
                              <button
                                type="button"
                                className="eva-retail-connected-chip__close"
                                aria-label={`Remove ${item}`}
                                disabled={isRetailKnowledgeLocked}
                                onClick={() => setSelectedKnowledgeBases(prev => prev.filter(value => value !== item))}
                              >
                                <Icon name="cancel" weight="regular" size="sm" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="eva-retail-recommendation-section">
                        <span className="eva-retail-recommendation-eyebrow">Recommended knowledge bases</span>
                        <div className="eva-retail-recommendation-list">
                          {RETAIL_RECOMMENDED_KNOWLEDGE_BASES.map(option => {
                            const isSelected = selectedKnowledgeBases.includes(option.name);
                            return (
                              <Card
                                key={option.name}
                                clickable
                                selected={isSelected}
                                disabled={isRetailKnowledgeLocked}
                                className="eva-retail-recommendation-card card-selectable"
                                aria-label={`${option.name}. ${option.description}`}
                                aria-pressed={isSelected}
                                onClick={() => handleLlmFollowupClick(option.name)}
                              >
                                <span className="card-select-icon eva-retail-recommendation-card__select" aria-hidden="true">
                                  <Icon name={isSelected ? 'check-circle-filled' : 'check-circle'} weight="bold" size={20} />
                                </span>
                                <span className="eva-retail-recommendation-card__icon" aria-hidden="true">
                                  <Icon name="files" weight="regular" size={24} />
                                </span>
                                <strong>{option.name}</strong>
                                <span className="eva-retail-recommendation-card__description">{option.description}</span>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                      {!isRetailKnowledgeLocked && (
                        <div className="eva-retail-recommendation-actions">
                          <Button
                            size="sm"
                            onClick={() => handleLlmFollowupClick(RETAIL_CONTINUE_TO_ACTIONS_LABEL)}
                          >
                            {RETAIL_CONTINUE_TO_ACTIONS_LABEL}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {isRetailActionsPrompt && (
                    <div className="eva-retail-recommendation-panel" aria-label="Action recommendations">
                      <div className="eva-retail-recommendation-section">
                        <span className="eva-retail-recommendation-eyebrow">Connected actions</span>
                        <div className="eva-retail-connected-list">
                          {selectedActions.map(item => (
                            <span key={item} className="eva-retail-connected-chip">
                              <Icon className="eva-retail-connected-chip__status" name="check-circle-filled" weight="bold" size="sm" />
                              {item}
                              <button
                                type="button"
                                className="eva-retail-connected-chip__close"
                                aria-label={`Remove ${item}`}
                                disabled={isRetailActionsLocked}
                                onClick={() => setSelectedActions(prev => prev.filter(value => value !== item))}
                              >
                                <Icon name="cancel" weight="regular" size="sm" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="eva-retail-recommendation-section">
                        <span className="eva-retail-recommendation-eyebrow">Recommended actions</span>
                        <div className="eva-retail-recommendation-list">
                          {RETAIL_RECOMMENDED_ACTIONS.map(option => {
                            const isSelected = selectedActions.includes(option.name);
                            return (
                              <Card
                                key={option.name}
                                clickable
                                selected={isSelected}
                                disabled={isRetailActionsLocked}
                                className="eva-retail-recommendation-card card-selectable"
                                aria-label={`${option.name}. ${option.provider}. ${option.description}`}
                                aria-pressed={isSelected}
                                onClick={() => handleLlmFollowupClick(option.name)}
                              >
                                <span className="card-select-icon eva-retail-recommendation-card__select" aria-hidden="true">
                                  <Icon name={isSelected ? 'check-circle-filled' : 'check-circle'} weight="bold" size={20} />
                                </span>
                                <span
                                  className={`eva-retail-recommendation-card__icon eva-provider-chip__logo eva-provider-chip__logo--${option.providerLogo}`}
                                  aria-hidden="true"
                                >
                                  {option.providerLogoLabel}
                                </span>
                                <strong>{option.name}</strong>
                                <span className="eva-retail-recommendation-card__description">
                                  {`${option.provider}. ${option.description}`}
                                </span>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                      {!isRetailActionsLocked && (
                        <div className="eva-retail-recommendation-actions">
                          <Button
                            size="sm"
                            onClick={() => handleLlmFollowupClick(RETAIL_CONTINUE_TO_FINAL_LABEL)}
                          >
                            {RETAIL_CONTINUE_TO_FINAL_LABEL}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {isRetailFinalActions && (retailPrototypeStep === 'ready-to-preview' || retailPrototypeStep === 'previewing') && (
                    <div className="eva-retail-final-group">
                      <div className="eva-retail-final-block">
                      {retailPrototypeStep === 'previewing' ? (
                        <section className="eva-retail-preview-card eva-retail-preview-card--active" aria-label={`Preview ${retailPreviewAgentName}`}>
                          <div className="eva-retail-preview-card__summary">
                            <div className="agent-avatar eva-retail-preview-card__avatar" style={{ background: gradient }}>
                              {profileInitials}
                            </div>
                            <div className="eva-retail-preview-card__copy">
                              <strong>{retailPreviewAgentName}</strong>
                              <span>{retailPreviewAgentIntro}</span>
                            </div>
                          </div>
                          <div className="eva-retail-preview-card__control">
                            {renderPreviewSession()}
                          </div>
                        </section>
                      ) : (
                        <button
                          type="button"
                          className="eva-retail-preview-card"
                          onClick={startRetailPreviewInFinalCard}
                        >
                          <span className="agent-avatar eva-retail-preview-card__avatar" style={{ background: gradient }}>
                            {profileInitials}
                          </span>
                          <span className="eva-retail-preview-card__copy">
                            <strong>{retailPreviewAgentName}</strong>
                            <span>{retailPreviewAgentIntro}</span>
                          </span>
                          <span className="eva-retail-preview-card__button">
                            <Icon name="play" weight="regular" size="sm" />
                            Preview
                          </span>
                        </button>
                      )}
                      <div className="eva-retail-final-actions">
                      <Button onClick={() => handleLlmFollowupClick(COMPLETE_RETAIL_AGENT_LABEL)}>
                        <Icon name="sparkle" weight="bold" size="sm" />
                        {COMPLETE_RETAIL_AGENT_LABEL}
                      </Button>
                      <Button variant="secondary" onClick={() => handleLlmFollowupClick(ENTER_AGENT_STUDIO_LABEL)}>
                        <Icon name="tools" weight="bold" size="sm" />
                        {ENTER_AGENT_STUDIO_LABEL}
                      </Button>
                      </div>
                      </div>
                    </div>
                  )}
                  {isRetailCompleteActions && retailPrototypeStep === 'ready-to-create' && (
                    <div className="eva-retail-final-actions">
                      <Button onClick={() => handleLlmFollowupClick(COMPLETE_RETAIL_AGENT_LABEL)}>
                        <Icon name="sparkle" weight="bold" size="sm" />
                        {COMPLETE_RETAIL_AGENT_LABEL}
                      </Button>
                      <Button variant="secondary" onClick={() => handleLlmFollowupClick(ENTER_AGENT_STUDIO_LABEL)}>
                        <Icon name="tools" weight="bold" size="sm" />
                        {ENTER_AGENT_STUDIO_LABEL}
                      </Button>
                    </div>
                  )}
                  {isRetailInlinePreview && (
                    <div className="eva-retail-inline-preview">
                      {renderPreviewSession()}
                      {retailPrototypeStep === 'previewing' && ['ended', 'error'].includes(voiceCallStatus) ? (
                        <div className="eva-retail-inline-preview__actions">
                          <Button
                            onClick={() => handleLlmFollowupClick(
                              retailSelectedPhoneNumber || phoneNumberDeferred
                                ? COMPLETE_RETAIL_AGENT_LABEL
                                : CONNECT_RETAIL_PHONE_LABEL,
                            )}
                          >
                            <Icon
                              name={retailSelectedPhoneNumber || phoneNumberDeferred ? 'sparkle' : 'phone'}
                              weight="bold"
                              size="sm"
                            />
                            {retailSelectedPhoneNumber || phoneNumberDeferred
                              ? COMPLETE_RETAIL_AGENT_LABEL
                              : CONNECT_RETAIL_PHONE_LABEL}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </AiResponseMessage>
              );
            })}
            {retailPrototypeStep === 'discovering' && renderRetailDiscoveryProcess()}
            {evaThinking && (
              <AiResponseMessage
                className="eva-ai-response"
                showActions={false}
                assistantName="AI Assistant is thinking..."
                assistantState="processing"
                content={null}
              />
            )}
          </section>
        )}

        {/* Inline starter cards revealed by the "View other options"
            chip — same content as the landing's prompt-examples grid
            but rendered above the composer during free-chat so the
            user can drop into a templated build flow without losing
            their conversation. Hidden during Eva's thinking state so
            focus stays on the live response. */}
        {freeChatActive && showOtherTemplates && !evaThinking && (
          <>
            <p
              className="eva-first-interface__free-chat-encouragement"
              aria-live="polite"
            >
              Pick one of the starter templates below, or keep chatting with AI Assistant.
            </p>
            <section
              className="eva-prompt-examples eva-first-interface__free-chat-cards"
              aria-label="Quick templates"
            >
              {starterPrompts.slice(0, 4).map(prompt => (
                <button
                  key={prompt.templateId}
                  type="button"
                  className="eva-prompt-card"
                  onClick={() => handleTemplateSelect(prompt.templateId)}
                >
                  <span className="eva-prompt-card__header">
                    <span className="eva-prompt-card__icon" aria-hidden="true">
                      <Icon name={prompt.icon} weight="bold" size="md" />
                    </span>
                    <strong>{prompt.title}</strong>
                  </span>
                  <span className="eva-prompt-card__copy">
                    <strong>{prompt.summary}</strong>
                    <span>{prompt.description}</span>
                  </span>
                  <small>Use template</small>
                </button>
              ))}
            </section>
          </>
        )}

        {showGeneratedSidePanel && (
          <div className={`eva-generated-layout${showEvaGeneratedSidePanel ? '' : ' eva-generated-layout--side-collapsed'}`}>
            <div className="eva-generated-layout__main">
              {evaThinking && (
                <section className="eva-dialogue" aria-label="AI Assistant conversation flow" aria-live="polite">
                  {/* Template-flow thinking state — `freeChatActive`
                      is always false here because `showGeneratedSidePanel`
                      now excludes it (free-chat thinking renders in the
                      dedicated section above instead). */}
                  {latestUserMessage && <AiUserMessage text={latestUserMessage.text} />}
                  <AiResponseMessage
                    className="eva-ai-response"
                    showActions={false}
                    assistantName="Thinking through your request and preparing the setup plan..."
                    assistantState="processing"
                    content={null}
                  >
                    {renderEvaPlanningRows(evaPlanningProgress, true)}
                  </AiResponseMessage>
                </section>
              )}

        {orchestrationSuggested && !guidanceVisible && !evaThinking && (
          <section className="eva-dialogue" aria-label="AI Assistant conversation flow">
            {latestUserMessage && <AiUserMessage text={latestUserMessage.text} />}
            <AiResponseMessage
              className="eva-ai-response"
              showActions={false}
              assistantName="AI Assistant"
              content="AI Assistant Canvas is the visual workspace for mapping agent orchestration, connecting nodes, defining handoffs, and coordinating flows. I can open it for you while preserving this chat."
            >
              <div className="eva-dialogue__actions">
                <Button onClick={() => openEvaCanvas()}>Open AI Assistant Canvas</Button>
                <Button variant="secondary" onClick={() => setOrchestrationSuggested(false)}>
                  Build a single agent instead
                </Button>
              </div>
            </AiResponseMessage>
          </section>
        )}

              {guidanceVisible && !evaThinking && (
                <section className="eva-dialogue" aria-label="AI Assistant conversation flow">
            {visibleSteps.includes('profile') && !hideConversationalOnboardingForms && (
              <>
                <div className="eva-step-anchor" data-eva-step="profile" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content={`Plan complete. I collapsed the setup plan below, and we can start configuring ${generatedName} step by step.`}
                >
                  <div className="eva-config-block">
                    {renderEvaPlanningProcess()}
                    <div className="eva-config-grid eva-config-grid--responsive-two">
                      <Input label="Agent name" required value={agentName} onChange={event => setAgentName(event.target.value)} />
                      <div className="v2-profile-avatar-row">
                        <div className="v2-profile-avatar-preview">
                          <div className="agent-avatar" style={{ background: gradient, width: 48, height: 48, fontSize: 16 }}>
                            {profileInitials}
                          </div>
                        </div>
                        <div className="v2-profile-avatar-field">
                          <Input
                            label="URL for agent profile image"
                            required
                            value={avatarUrl}
                            onChange={event => setAvatarUrl(event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="eva-config-grid eva-config-grid--responsive-two">
                      <Dropdown
                        label="Time zone"
                        required
                        options={PROFILE_TIMEZONE_OPTIONS}
                        value={timezone}
                        onChange={setTimezone}
                      />
                      <Dropdown
                        label="Language"
                        required
                        options={PROFILE_LANGUAGE_OPTIONS}
                        value={personality.language}
                        onChange={value => setPersonality(prev => ({ ...prev, language: value }))}
                      />
                      <Dropdown
                        label="Voice name"
                        required
                        options={PROFILE_VOICE_OPTIONS}
                        value={personality.voice}
                        onChange={value => setPersonality(prev => ({ ...prev, voice: value }))}
                      />
                      <Dropdown
                        label="AI engine"
                        required
                        options={aiEngineOptions}
                        value={aiEngine}
                        onChange={value => {
                          setAiEngine(value);
                          setPersonality(prev => ({ ...prev, llm: value }));
                        }}
                      />
                    </div>
                    <div className="v2-profile-textarea-group">
                      <div className="v2-profile-textarea-header">
                        <label className="v2-profile-label">
                          Welcome message <span className="v2-profile-required">*</span>
                          <button type="button" className="v2-profile-info-btn" aria-label="Info">
                            <Icon name="info-badge" size={16} />
                          </button>
                        </label>
                        <button
                          type="button"
                          className="v2-profile-insert-example"
                          onClick={() => setWelcomeMessage(buildWelcomeMessage(draft))}
                        >
                          Insert example
                        </button>
                      </div>
                      <Textarea
                        value={welcomeMessage}
                        onChange={event => setWelcomeMessage(event.target.value)}
                        placeholder="Enter description"
                        rows={4}
                      />
                    </div>
                    {evaStep === 'profile' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('channels')}>Use this profile</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('profile')}
              </>
            )}

            {visibleSteps.includes('channels') && !hideConversationalOnboardingForms && (
              <>
                <div className="eva-step-anchor" data-eva-step="channels" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="Next, add the channels where this agent should be available. Voice is included by default, and you can add digital or video without removing voice."
                >
                  <div className="eva-config-block">
                    <div className="eva-security-tier-selector eva-channel-type-selector" role="group" aria-label="Channels to add">
                      {EVA_CHANNEL_SELECTION_OPTIONS.map(option => {
                        const selected = selectedChannels.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`eva-security-tier-card${selected ? ' eva-security-tier-card--selected' : ''}`}
                            onClick={() => toggleSelectedChannel(option.value)}
                            aria-pressed={selected}
                          >
                            <Icon name={option.icon} weight="bold" size={24} />
                            <span>
                              <strong>{option.title}</strong>
                              <small>{option.description}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {hasDigitalChannel && (
                      <div className="eva-config-block">
                        <label className="v2-profile-label">Digital channels</label>
                        <div className="eva-security-tier-selector eva-channel-type-selector" role="group" aria-label="Digital channels to add">
                          {DIGITAL_CHANNEL_OPTIONS.map(option => {
                            const selected = selectedDigitalChannels.includes(option.value);
                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`eva-security-tier-card${selected ? ' eva-security-tier-card--selected' : ''}`}
                                onClick={() => toggleSelectedDigitalChannel(option.value)}
                                aria-pressed={selected}
                              >
                                <span>
                                  <strong>{option.label}</strong>
                                  <small>Add this digital entry point for the same agent.</small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <Input
                          label="Digital destination"
                          required
                          type="text"
                          value={digitalChannelAddress}
                          onChange={event => setDigitalChannelAddress(event.target.value)}
                          placeholder="support-chat, support@example.com, or +1 415 555 0198"
                          hint="Use a queue, inbox, SMS-capable number, or Webex Connect asset for the selected digital channels."
                        />
                      </div>
                    )}
                    {hasVoiceChannel && (
                      <Dropdown
                        label="Voice phone number"
                        required
                        options={CHANNEL_PHONE_NUMBER_OPTIONS}
                        value={channelPhoneNumber}
                        onChange={(value) => {
                          setChannelPhoneNumber(value);
                          setPhoneNumberDeferred(false);
                        }}
                      />
                    )}
                    {hasVideoChannel && (
                      <Banner
                        type="info"
                        title="Video added"
                        subtitle="Video will use the same agent instructions, knowledge, actions, and guardrails. Meeting routing can be connected after this setup."
                        dismissable={false}
                      />
                    )}
                    {evaStep === 'channels' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('instructions')} disabled={!channelsConfigured}>Continue to instructions</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('channels')}
              </>
            )}

            {visibleSteps.includes('instructions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="instructions" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="Next I drafted the instruction prompt from your request, selected profile, goals, and guardrails. Use this step to clarify what the agent can do, organize role, goals, guardrails, and output rules with markdown headers, define tone and escalation paths, and add dynamic content with {{variable}} syntax."
                >
                  <div className="eva-config-block">
                    <div className="eva-instructions-layout">
                      <div className="instructions-editor">
                        <div className="instructions-toolbar">
                          <div className="instructions-toolbar-left">
                            <button type="button" className="instructions-toolbar-btn" aria-label="Bold"><Icon name="bold" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Italic"><Icon name="italic" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Underline"><Icon name="underline" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Link"><Icon name="link" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Table"><Icon name="table" weight="bold" size={16} /></button>
                            <span className="instructions-toolbar-divider" />
                            <button type="button" className="instructions-toolbar-pill" onClick={() => setShowInstructionExamples(true)}>
                              <Icon name="guide" weight="bold" size={16} />
                              Example
                            </button>
                            {optimizeAccepted && (
                              <button type="button" className="instructions-toolbar-pill" onClick={handleEvaUndoOptimize}>
                                <Icon name="undo" weight="bold" size={16} />
                                Undo
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="instructions-toolbar-pill instructions-optimize-btn"
                            onClick={handleEvaOptimizeInstructions}
                            disabled={!instructionPrompt.trim() || optimizingInstructions}
                          >
                            <Icon name="sparkle" weight="bold" size={16} />
                            {optimizingInstructions ? 'Optimizing...' : 'Optimize prompt'}
                          </button>
                        </div>
                        <Textarea
                          inputClassName="instructions-textarea"
                          placeholder="Set clear goals for your agent. Provide step-by-step instructions to help them succeed in reaching these targets."
                          value={instructionPrompt}
                          onChange={event => setInstructionPrompt(event.target.value)}
                          rows={12}
                        />
                        {optimizeAccepted && (
                          <div className="instructions-ai-footer">
                            <Icon name="check" weight="bold" size={14} color="var(--mds-color-theme-text-success-normal, var(--success-color))" />
                            <span>AI Generated</span>
                            <span className="instructions-ai-divider">·</span>
                            <span>Is this helpful?</span>
                            <button type="button" className="instructions-feedback-btn" aria-label="Helpful"><Icon name="like" weight="bold" size={14} /></button>
                            <button type="button" className="instructions-feedback-btn" aria-label="Not helpful"><Icon name="dislike" weight="bold" size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {optimizeAccepted && (
                      <div className="eva-instruction-optimize-summary">
                        <div className="instructions-optimize-header">
                          <Icon name="sparkle" weight="bold" size={20} />
                          <h3 className="instructions-optimize-title">Optimize summary</h3>
                          <Button variant="secondary" size="sm" onClick={handleEvaUndoOptimize}>
                            <Icon name="undo" weight="bold" size={16} />
                            Undo
                          </Button>
                        </div>
                        <div className="instructions-optimize-results">
                          <div className="optimize-results-section">
                            <h4>What's been changed:</h4>
                            <ul>{optimizeSummary.changes.map((change, index) => <li key={index}>{change}</li>)}</ul>
                          </div>
                          <div className="optimize-results-section">
                            <h4>Reasoning behind changes:</h4>
                            <ul>{optimizeSummary.reasoning.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {showInstructionExamples && createPortal(
                      <div className="example-modal-overlay" onClick={() => setShowInstructionExamples(false)}>
                        <div className="example-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
                          <div className="example-modal-header">
                            <div>
                              <h2 className="example-modal-title">Instruction examples</h2>
                              <p className="example-modal-subtitle">Explore examples for writing effective instructions.</p>
                            </div>
                            <button className="example-modal-close" onClick={() => setShowInstructionExamples(false)} aria-label="Close">
                              <Icon name="cancel" weight="bold" size={20} />
                            </button>
                          </div>
                          <div className="example-modal-tabs">
                            <button type="button" className={`example-modal-tab${instructionExampleTab === 'examples' ? ' active' : ''}`} onClick={() => setInstructionExampleTab('examples')}>
                              <Icon name="text-code-block" weight="bold" size={16} />
                              Examples
                            </button>
                            <button type="button" className={`example-modal-tab${instructionExampleTab === 'tips' ? ' active' : ''}`} onClick={() => setInstructionExampleTab('tips')}>
                              <Icon name="info-circle" weight="bold" size={16} />
                              Best practice & Tips
                            </button>
                          </div>
                          <div className="example-modal-body">
                            {instructionExampleTab === 'examples' && (
                              <div className="example-modal-examples-list">
                                {INSTRUCTION_EXAMPLES.map((example, index) => (
                                  <div key={index} className="example-modal-card">
                                    <div className="example-modal-card-header">
                                      <span className="example-modal-content-label">**{example.title}**</span>
                                      <button
                                        type="button"
                                        className="example-modal-insert-btn"
                                        onClick={() => {
                                          setInstructionPrompt(`**${example.title}**\n\n${example.content}`);
                                          setShowInstructionExamples(false);
                                          setOptimizeAccepted(false);
                                          showToast('Example inserted into instructions', 'success');
                                        }}
                                      >
                                        <Icon name="plus" weight="bold" size={14} />
                                        Insert
                                      </button>
                                    </div>
                                    <div className="example-modal-markdown">
                                      {example.content.split('\n').map((line, lineIndex) => {
                                        if (line.startsWith('####')) return <h4 key={lineIndex}>{line.replace(/^####\s*/, '')}</h4>;
                                        if (line.trim() === '') return <br key={lineIndex} />;
                                        return <p key={lineIndex}>{line}</p>;
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {instructionExampleTab === 'tips' && (
                              <div className="example-modal-card">
                                <div className="example-modal-card-header">
                                  <span className="example-modal-content-label">Best practice & Tips</span>
                                </div>
                                <div className="example-modal-tips">
                                  {INSTRUCTION_TIPS.map((tip, index) => (
                                    <div key={index} className="example-modal-tip">
                                      <span className="example-modal-tip-number">{index + 1}</span>
                                      <div>
                                        <h4 className="example-modal-tip-title">{tip.title}</h4>
                                        <p className="example-modal-tip-desc">{tip.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="example-modal-footer">
                            <Button variant="secondary" onClick={() => setShowInstructionExamples(false)}>Close</Button>
                          </div>
                        </div>
                      </div>,
                      document.body,
                    )}
                    {evaStep === 'instructions' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('knowledge')}>Continue to knowledge</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('instructions')}
              </>
            )}

            {visibleSteps.includes('knowledge') && (
              <>
                <div className="eva-step-anchor" data-eva-step="knowledge" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="For knowledge, I recommend grounding this agent in the sources below. Keep the selected sources or add your own in the composer."
                >
                  <div className="eva-config-block">
                    {/* Mirrors the Knowledge page collections table (Name · Description · Sources ·
                        Used by · Last updated). Selection lives inline on the Name cell — same
                        toggle pattern used by the Actions table on the next step. */}
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Name</TableHeader>
                          <TableHeader>Description</TableHeader>
                          <TableHeader>Sources</TableHeader>
                          <TableHeader>Used by</TableHeader>
                          <TableHeader>Last updated</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody empty={draft.knowledgeBases.length === 0} emptyTitle="No recommended knowledge sources">
                        {draft.knowledgeBases.map(source => {
                          const selected = selectedKnowledgeBases.includes(source.name);
                          return (
                            <TableRow key={source.name} selected={selected}>
                              <TableCell>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <Toggle
                                    size="compact"
                                    checked={selected}
                                    onChange={() => toggleKnowledgeBase(source.name)}
                                    aria-label={`${selected ? 'Deselect' : 'Select'} ${source.name}`}
                                  />
                                  <strong>{source.name}</strong>
                                </span>
                              </TableCell>
                              <TableCell style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                                {source.description}
                              </TableCell>
                              <TableCell>{source.sources}</TableCell>
                              <TableCell>{source.usedBy || '—'}</TableCell>
                              <TableCell>{formatRelative(source.lastUpdatedAt)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {evaStep === 'knowledge' && (
                      <div className="eva-dialogue__actions">
                        <Button variant="secondary" onClick={() => navigate('/knowledge')}>
                          <Icon name="plus" weight="bold" size={16} />
                          Add new
                        </Button>
                        <Button onClick={() => setEvaStep('actions')}>Continue to actions</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('knowledge')}
              </>
            )}

            {visibleSteps.includes('actions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="actions" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="For actions, I recommend these fulfillment capabilities based on the agent purpose. Review what AI Assistant should be allowed to do."
                >
                  <div className="eva-config-block">
                    {/* Mirror the Knowledge table above (same Momentum
                        primitives) so the two recommendation tables read
                        as a consistent pattern: Name column hosts the
                        selection toggle inline, the rest are read-only
                        metadata. The previous div-grid implementation
                        rendered with different padding, dividers, and
                        font weights than the Knowledge table — switching
                        to Table/TableRow/TableCell unifies all of that
                        through the shared component's styles. */}
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Action name</TableHeader>
                          <TableHeader>Created by</TableHeader>
                          <TableHeader>Description</TableHeader>
                          <TableHeader>Last updated</TableHeader>
                          <TableHeader>Action type</TableHeader>
                          <TableHeader>Provider type</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody empty={EVA_ACTION_ROWS.length === 0} emptyTitle="No recommended actions">
                        {EVA_ACTION_ROWS.map(action => {
                          const selected = selectedActions.includes(action.name);
                          return (
                            <TableRow key={action.id} selected={selected}>
                              <TableCell>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <Toggle
                                    size="compact"
                                    checked={selected}
                                    onChange={() => toggleAction(action.name)}
                                    aria-label={`${selected ? 'Disable' : 'Enable'} ${action.name}`}
                                  />
                                  <strong>{action.name}</strong>
                                </span>
                              </TableCell>
                              <TableCell>{action.createdBy}</TableCell>
                              <TableCell style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                                {action.description}
                              </TableCell>
                              <TableCell>{action.lastUpdated}</TableCell>
                              <TableCell>{action.actionType}</TableCell>
                              <TableCell>{action.providerType}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {evaStep === 'actions' && (
                      <div className="eva-dialogue__actions">
                        <Button variant="secondary" onClick={() => navigate('/assistant-skills')}>
                          <Icon name="plus" weight="bold" size={16} />
                          Add new
                        </Button>
                        <Button onClick={() => setEvaStep('security')}>Continue to security</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('actions')}
              </>
            )}

            {visibleSteps.includes('security') && (
              <>
                <div className="eva-step-anchor" data-eva-step="security" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="For security, I broke the configuration into the same sections as the Security page: choose a guardrail tier, review observability behavior, tune standard guardrails, and optionally enable advanced AI Defense categories or custom profiles."
                >
                  <div className="guardrails-layout eva-guided-guardrails">
                    <div className="guardrails-header">
                      <div className="guardrails-header-left">
                        <h1 className="guardrails-title">Guardrails</h1>
                        <p className="guardrails-subtitle">
                          Start with custom profiles for this agent&apos;s business rules, then add baseline guardrails for common risks. Triggered guardrails are logged in Sessions. Monitor logs the interaction for review. Block rejects the prompt while keeping the conversation active.
                        </p>
                      </div>
                    </div>

                    <section className="security-custom-profiles-section security-custom-profiles-section--hero">
                      <div className="security-custom-profiles-header security-custom-profiles-header--hero">
                        <div className="security-custom-profiles-title-row">
                          <div className="security-group-header security-group-header--hero">
                            <div className="security-custom-profiles-title-stack">
                              <div className="security-custom-profiles-heading-line">
                                <span>Custom profiles</span>
                                <Badge variant="success" className="security-tier-badge security-custom-profiles-chip">Business-specific</Badge>
                              </div>
                              {customRules.length > 0 && (
                                <span className="security-custom-profiles-count-text">
                                  {customProfileAppliedCount} of {customProfileLimit} enabled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="security-custom-profiles-desc security-custom-profiles-desc--hero">
                          Create profiles that understand this agent&apos;s real business rules, like identity verification bypasses, approved service flows, and policy exceptions.
                        </p>
                      </div>

                      {customRules.length > 0 ? (
                        <div className="custom-profile-grid custom-profile-grid--hero">
                          {customRules.slice(0, 3).map((rule, index) => {
                            const item = getGuidedCustomProfile(rule, index);

                            return (
                              <div key={item.id} className={`custom-profile-card custom-profile-card--hero${item.enabled ? '' : ' custom-profile-card--disabled'}`}>
                                <div className="custom-profile-card__header">
                                  <Toggle
                                    checked={item.enabled}
                                    aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${item.name} profile`}
                                    onChange={() => toggleGuidedCustomProfile(rule, item.name)}
                                    size="compact"
                                  />
                                  <h4 className="custom-profile-card__name">{item.name}</h4>
                                  <div className="custom-profile-card__actions">
                                    <Button
                                      variant="tertiary"
                                      size="sm"
                                      aria-label={`Edit ${item.name}`}
                                    >
                                      <Icon name="edit" size={16} />
                                    </Button>
                                    <Button
                                      variant="tertiary"
                                      size="sm"
                                      aria-label={`Delete ${item.name}`}
                                      onClick={() => deleteGuidedCustomProfile(rule)}
                                    >
                                      <Icon name="delete" size={16} />
                                    </Button>
                                  </div>
                                </div>
                                <ClampedDesc
                                  text={item.description}
                                  expanded={expandedProfileDescs.has(item.id)}
                                  onToggle={() => setExpandedProfileDescs(prev => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                                    return next;
                                  })}
                                />
                                <ProfileLogicSummary overview={item.overview} />
                                <div className="custom-profile-card__meta">
                                  <span>{item.createdBy}</span>
                                  <span className="custom-profile-card__meta-sep" aria-hidden="true" />
                                  <span>{item.createdAt}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="custom-profile-empty-hero">
                          <Icon name="document-create" weight="bold" size={22} />
                          <span>No custom profiles yet. Start with a policy that matches this agent&apos;s business process.</span>
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="security-custom-profiles-create-button"
                        disabled={customRules.length >= customProfileLimit}
                        onClick={addGuidedCustomProfile}
                      >
                        <Icon name="plus" weight="bold" size={16} />
                        Create custom profile
                      </Button>
                    </section>

                    <section className="security-prebuilt-section">
                      <div className="security-prebuilt-header">
                        <div>
                          <span className="security-prebuilt-eyebrow">Baseline coverage</span>
                          <div className="security-prebuilt-title-row">
                            <div className="security-prebuilt-title-stack">
                              <h4 className="security-prebuilt-title">Prebuilt guardrails</h4>
                              <span className="security-prebuilt-count-text">
                                {prebuiltEnabledCount} of {prebuiltTotalCount} enabled
                              </span>
                            </div>
                          </div>
                          <p className="security-prebuilt-desc">
                            Add broad protections that complement custom profiles. Categories stay collapsed so custom profiles stay easy to scan.
                          </p>
                        </div>
                      </div>

                      <AccordionGroup type="contained" className="security-prebuilt-groups">
                        {advancedGuardrailGroups.map(group => {
                          const standardItems = standardPrebuiltGroups[group.id as keyof typeof standardPrebuiltGroups] ?? [];
                          const groupEnabledCount = standardItems.filter(item => item.enabled).length + group.items.filter(item => item.enabled).length;
                          const groupTotalCount = standardItems.length + group.items.length;

                          return (
                            <AccordionItem
                              key={group.id}
                              title={
                                <div className="security-prebuilt-category-heading">
                                  <div className="security-prebuilt-category-title">
                                    <Icon name={group.icon} weight="bold" size={18} />
                                    <span>{group.label.replace(' guardrails', '')}</span>
                                  </div>
                                  <span className="security-prebuilt-category-meta">{groupEnabledCount} of {groupTotalCount} enabled</span>
                                </div>
                              }
                              expanded={expandedPrebuiltGuardrailGroups.has(group.id)}
                              onExpandedChange={(open) => togglePrebuiltGuardrailGroup(group.id, open)}
                            >
                              <div className="security-prebuilt-group-body">
                                <p className="security-advanced-group-desc">
                                  {group.label} protect this agent against common production risks. <TextLink variant="inline" size="sm">Learn more about {group.label.toLowerCase()}.</TextLink>
                                </p>

                                {standardItems.length > 0 && (
                                  <div className="security-advanced-rule-section">
                                    <div className="security-advanced-rule-section-head">
                                      <div>
                                        <h4>Core coverage</h4>
                                        <p>Always-available protections for common risks in this category.</p>
                                      </div>
                                      <Badge variant="default">{standardItems.filter(item => item.enabled).length} out of {standardItems.length} rules enabled</Badge>
                                    </div>
                                    <AccordionGroup type="borderless" className="security-prebuilt-rail-list">
                                      {standardItems.map(renderStandardPrebuiltGuardrail)}
                                    </AccordionGroup>
                                  </div>
                                )}

                                <div className="security-advanced-rule-section">
                                  <div className="security-advanced-rule-section-head">
                                    <div>
                                      <h4>AI Defense rules</h4>
                                      <p>Advanced protections powered by Cisco AI Defense.</p>
                                    </div>
                                    <Badge variant="default">{group.items.filter(item => item.enabled).length} out of {group.items.length} rules enabled</Badge>
                                  </div>
                                  <AccordionGroup type="borderless" className="security-prebuilt-rail-list">
                                    {group.items.map(item => renderAdvancedPrebuiltGuardrail(group, item))}
                                  </AccordionGroup>
                                </div>
                              </div>
                            </AccordionItem>
                          );
                        })}
                      </AccordionGroup>
                    </section>
                    {evaStep === 'security' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('review')}>Review configuration</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('security')}
              </>
            )}

            {visibleSteps.includes('review') && (
              <>
                <div className="eva-step-anchor" data-eva-step="review" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content={`Ready to create ${agentName}? I kept each recommendation tied to the agent configuration: profile, instructions, knowledge, actions, channels, and guardrails.`}
                >
                  <div className="eva-config-block">
                    <div className="eva-config-summary">
                      <article className="eva-config-summary__item eva-config-summary__item--welcome">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--welcome" aria-hidden="true" />Welcome</strong>
                        <p>{welcomeMessage}</p>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--channel">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--channel" aria-hidden="true" />Channel</strong>
                        <p>{channelSummary}</p>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--instructions">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--instructions" aria-hidden="true" />Instructions</strong>
                        <p>{instructionPrompt || buildInstructionPrompt(draft)}</p>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--profile">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--profile" aria-hidden="true" />Language &amp; time zone</strong>
                        <p>{languageSummary}</p>
                        <p>{timezone}</p>
                        <p>{agentCharacterSummary}</p>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--knowledge">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--knowledge" aria-hidden="true" />Knowledge</strong>
                        <div className="eva-config-summary__chips" aria-label="Selected knowledge sources">
                          {(selectedKnowledgeBases.length ? selectedKnowledgeBases : ['No sources selected']).map(item => (
                            <Badge key={item} variant="default">{item}</Badge>
                          ))}
                        </div>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--actions">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--actions" aria-hidden="true" />Actions</strong>
                        <div className="eva-config-summary__chips" aria-label="Selected actions">
                          {(selectedActions.length ? selectedActions : ['No actions selected']).map(item => (
                            <Badge key={item} variant="default">{item}</Badge>
                          ))}
                        </div>
                      </article>
                      <article className="eva-config-summary__item eva-config-summary__item--guardrails">
                        <strong><span className="eva-config-summary__icon eva-config-summary__icon--guardrails" aria-hidden="true" />Guardrails</strong>
                        <div className="eva-config-summary__chips" aria-label="Selected guardrails">
                          {(selectedGuardrailLabels.length ? selectedGuardrailLabels : ['No guardrails selected']).map(item => (
                            <Badge key={item} variant="default">{summarizeGuardrailChipLabel(item)}</Badge>
                          ))}
                        </div>
                      </article>
                    </div>
                    <div className="eva-next-step-block" aria-label="Suggested next steps">
                      <div className="eva-next-step-block__header">
                        <span>{phoneNumberDeferred ? 'Make the agent live' : 'What would you like to add next?'}</span>
                      </div>
                      {phoneNumberDeferred ? (
                        <>
                          <div className="eva-next-step-card__content">
                            <strong>
                              <Icon name="phone" weight="bold" size="sm" />
                              Connect a phone number
                            </strong>
                            <p>Choose an available voice number before publishing so customers can call this agent.</p>
                          </div>
                          <Button
                            size="sm"
                            className="eva-next-step-block__action"
                            onClick={() => {
                              setChannelType('voice');
                              setEvaStep('channels');
                            }}
                          >
                            Connect phone number
                          </Button>
                        </>
                      ) : (
                        <div className="eva-next-step-block__chips">
                          {[
                            'Include a guide on filing a claim',
                            'Add tips for choosing the right insurance plan',
                            'Explain deductible and co-pay concepts',
                            'Provide updates on ongoing claims',
                            'Create a FAQ on common policy terms',
                          ].map(option => (
                            <button key={option} type="button" onClick={() => handleNextStepSuggestion(option)}>
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {!visibleSteps.includes('preview') && (
                    <div className="eva-dialogue__actions">
                      <Button onClick={handleReviewPreviewAction}>
                        Preview
                      </Button>
                      <Button variant="secondary" onClick={handlePreviewTestingAction}>
                        Evaluate agent
                      </Button>
                      <Button variant="secondary" onClick={createDraftAgent}>
                        Create agent
                      </Button>
                    </div>
                  )}
                </AiResponseMessage>
                {renderUserPromptForStep('review')}
              </>
            )}

            {visibleSteps.includes('preview') && (
              <>
                <div className="eva-step-anchor" data-eva-step="preview" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  content="Now you’ve previewed your agent. The next step is to evaluate it against realistic scenarios so you can catch gaps in instructions, guardrails, knowledge coverage, and channel behavior before customers interact with it."
                >
                  <div className="eva-dialogue__actions">
                    <Button onClick={() => setEvaStep('testing')}>
                      Evaluate my agent
                    </Button>
                    <Button variant="secondary" onClick={createDraftAgent}>
                      Create agent
                    </Button>
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('testing') && (
              <>
                <div className="eva-step-anchor" data-eva-step="testing" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="AI Assistant"
                  assistantState={readinessTesting ? 'processing' : 'static'}
                  content={
                    readinessReport
                      ? 'Testing and observability report is ready. Review the score and checks before creating the agent.'
                      : activeTestingScenarioCopy.question
                  }
                >
                  <div className="eva-config-block">
                    <div className="eva-readiness-panel" aria-label="Testing and observability report">
                      <div className="eva-testing-scenario-panel" aria-label="Guided test scenario setup">
                        <div className="eva-testing-scenario-question eva-testing-scenario-question--header">
                          <strong>
                            {testingScenarioStep === 'ready'
                              ? activeTestingScenarioCopy.label
                              : `Step ${testingScenarioStepNumber}: ${activeTestingScenarioCopy.label}`}
                          </strong>
                          <p>{activeTestingScenarioCopy.helper}</p>
                        </div>
                        {testingScenarioStep === 'choose-method' && (
                          <div className="eva-security-tier-selector eva-channel-type-selector eva-testing-method-cards" role="group" aria-label="Scenario creation method">
                            <button
                              type="button"
                              className="eva-security-tier-card eva-testing-method-card"
                              onClick={() => selectTestingScenarioMethod('manual')}
                            >
                              <span>
                                <strong>Create manually</strong>
                                <small>Uses natural language processing to follow your set logic and responses.</small>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="eva-security-tier-card eva-testing-method-card"
                              onClick={generateTestingScenarioDraft}
                            >
                              <span>
                                <strong>Generate a scenario with AI</strong>
                                <small>Uses generative AI to create dynamic responses.</small>
                              </span>
                            </button>
                          </div>
                        )}
                        {testingScenarioStep !== 'ready' && testingScenarioStep !== 'choose-method' && (
                          <form
                            className="eva-testing-scenario-form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              submitTestingScenarioFormStep();
                            }}
                          >
                            {testingScenarioStep === 'manual-basic' && (
                              <>
                                <Input
                                  label="Scenario name"
                                  required
                                  value={testingScenarioDraft.name}
                                  placeholder="Knowledge retrieval grounding"
                                  onChange={(event) => updateTestingScenarioDraft({ name: event.currentTarget.value })}
                                />
                                <Textarea
                                  label="Description"
                                  required
                                  rows={3}
                                  value={testingScenarioDraft.description}
                                  placeholder="A customer asks about claim status and needs a grounded answer."
                                  onChange={(event) => updateTestingScenarioDraft({ description: event.currentTarget.value })}
                                />
                              </>
                            )}
                            {testingScenarioStep === 'manual-instructions' && (
                              <>
                                <Textarea
                                  label="Instructions"
                                  required
                                  rows={4}
                                  value={testingScenarioDraft.instructions}
                                  placeholder="Ask for claim status, then ask what documents are required next."
                                  onChange={(event) => updateTestingScenarioDraft({ instructions: event.currentTarget.value })}
                                />
                                <Textarea
                                  label="Expected outcome"
                                  required
                                  rows={3}
                                  value={testingScenarioDraft.expectedOutcome}
                                  placeholder="The agent gives a grounded answer, avoids unsupported promises, and offers escalation."
                                  onChange={(event) => updateTestingScenarioDraft({ expectedOutcome: event.currentTarget.value })}
                                />
                              </>
                            )}
                            {testingScenarioStep === 'manual-variables' && (
                              <Textarea
                                label="Test variables"
                                rows={3}
                                value={testingScenarioDraft.variables}
                                placeholder="customer_type=premium, policy_status=active"
                                hint="Optional. Leave blank if this scenario does not need variables."
                                onChange={(event) => updateTestingScenarioDraft({ variables: event.currentTarget.value })}
                              />
                            )}
                            {testingScenarioStep === 'generate-count' && (
                              <Input
                                className="eva-testing-scenario-form__count-field"
                                label="Number of test cases"
                                required
                                type="number"
                                min={1}
                                max={10}
                                value={testingScenarioDraft.generateTestCaseCount}
                                onChange={(event) => updateTestingScenarioDraft({ generateTestCaseCount: event.currentTarget.value })}
                              />
                            )}
                            {testingScenarioStep === 'generate-creativity' && (
                              <div className="eva-testing-creativity-slider">
                                <label>Creativity level</label>
                                <Slider
                                  value={
                                    testingScenarioDraft.creativityLevel === 'Low'
                                      ? 0
                                      : testingScenarioDraft.creativityLevel === 'High'
                                        ? 100
                                        : 50
                                  }
                                  min={0}
                                  max={100}
                                  step={50}
                                  showTicks
                                  aria-label="Creativity level"
                                  onChange={(value) => {
                                    const numeric = Number(value);
                                    updateTestingScenarioDraft({
                                      creativityLevel: numeric <= 0 ? 'Low' : numeric >= 100 ? 'High' : 'Mid',
                                    });
                                  }}
                                />
                                <div className="eva-testing-creativity-labels">
                                  <span>Low</span>
                                  <span>Mid</span>
                                  <span>High</span>
                                </div>
                              </div>
                            )}
                            {testingScenarioStep === 'generate-instructions' && (
                              <Textarea
                                label="Custom instructions"
                                required
                                rows={4}
                                value={testingScenarioDraft.generateCustomInstructions}
                                placeholder="Focus on knowledge grounding, handoff behavior, and policy-question accuracy."
                                onChange={(event) => updateTestingScenarioDraft({ generateCustomInstructions: event.currentTarget.value })}
                              />
                            )}
                            {testingScenarioStep === 'evaluation-description' && (
                              <Textarea
                                label="Evaluation description"
                                required
                                rows={3}
                                value={testingScenarioDraft.evaluationDescription}
                                placeholder="Comprehensive agent test covering scenario behavior, guardrails, observability, and knowledge/action coverage."
                                onChange={(event) => updateTestingScenarioDraft({ evaluationDescription: event.currentTarget.value })}
                              />
                            )}
                            <div className="eva-testing-scenario-form__actions">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={testingScenarioStepNumber <= 1}
                                onClick={goBackTestingScenarioStep}
                              >
                                Back
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={!testingScenarioCanSubmitCurrentStep}
                              >
                                Continue
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                      {!readinessReport && !readinessTesting && testingScenarioStep === 'ready' && (
                        <>
                          {testingScenarioDraft.method === 'generate' && (
                            <form
                              className="eva-testing-scenario-form eva-testing-scenario-form--review"
                              aria-label="Review generated scenario setup"
                              onSubmit={(event) => {
                                event.preventDefault();
                                handleRunReadinessTest();
                              }}
                            >
                              <Input
                                className="eva-testing-scenario-form__count-field"
                                label="Number of test cases"
                                required
                                type="number"
                                min={1}
                                max={10}
                                value={testingScenarioDraft.generateTestCaseCount}
                                onChange={(event) => updateTestingScenarioDraft({ generateTestCaseCount: event.currentTarget.value })}
                              />
                              <div className="eva-testing-creativity-slider">
                                <label>Creativity level</label>
                                <Slider
                                  value={
                                    testingScenarioDraft.creativityLevel === 'Low'
                                      ? 0
                                      : testingScenarioDraft.creativityLevel === 'High'
                                        ? 100
                                        : 50
                                  }
                                  min={0}
                                  max={100}
                                  step={50}
                                  showTicks
                                  aria-label="Creativity level"
                                  onChange={(value) => {
                                    const numeric = Number(value);
                                    updateTestingScenarioDraft({
                                      creativityLevel: numeric <= 0 ? 'Low' : numeric >= 100 ? 'High' : 'Mid',
                                    });
                                  }}
                                />
                                <div className="eva-testing-creativity-labels">
                                  <span>Low</span>
                                  <span>Mid</span>
                                  <span>High</span>
                                </div>
                              </div>
                              <Textarea
                                label="Custom instructions"
                                required
                                rows={4}
                                value={testingScenarioDraft.generateCustomInstructions}
                                placeholder="Focus on knowledge grounding, handoff behavior, and policy-question accuracy."
                                onChange={(event) => updateTestingScenarioDraft({ generateCustomInstructions: event.currentTarget.value })}
                              />
                              <Textarea
                                label="Evaluation description"
                                required
                                rows={3}
                                value={testingScenarioDraft.evaluationDescription}
                                placeholder="Comprehensive agent test covering scenario behavior, guardrails, observability, and knowledge/action coverage."
                                onChange={(event) => updateTestingScenarioDraft({ evaluationDescription: event.currentTarget.value })}
                              />
                            </form>
                          )}
                          <Banner
                            type="success"
                            title="Overview ready"
                            subtitle="The test will use this scenario, the current configuration, and preview transcript to generate the Passing report with aggregated performance metrics."
                            dismissable={false}
                          />
                        </>
                      )}
                      {readinessTesting && (
                        <div className="eva-readiness-empty" role="status">
                          <Banner
                            type="info"
                            title="Running"
                            subtitle={`Running the test against ${agentName || 'the agent'}...`}
                            dismissable={false}
                          />
                          <div className="eva-testing-run-progress" aria-hidden>
                            <span />
                          </div>
                          <small>Evaluating scenario behavior, guardrails, observability, knowledge coverage, and action coverage.</small>
                        </div>
                      )}
                      {readinessReport && !readinessTesting && (
                        <>
                          <div className="eva-testing-results-panel" aria-label="Passing test results">
                            <div className="eva-testing-results-panel__header">
                              <div>
                                <strong>{agentName ? `${agentName} readiness test` : 'Agent readiness test'}</strong>
                                <p>
                                  Aggregated metrics across all {testingScenarioDraft.method === 'generate' ? testingScenarioDraft.generateTestCaseCount || '2' : '1'} scenario{testingScenarioDraft.method === 'generate' && testingScenarioDraft.generateTestCaseCount !== '1' ? 's' : ''} in this evaluation
                                </p>
                              </div>
                              <Badge variant="success">Passing</Badge>
                            </div>
                            <div className="eva-testing-results-stats">
                              <section>
                                <span>Total scenarios</span>
                                <strong>{testingScenarioDraft.method === 'generate' ? testingScenarioDraft.generateTestCaseCount || '2' : '1'}</strong>
                              </section>
                              <section>
                                <span>Total duration</span>
                                <strong>12m 34s</strong>
                              </section>
                              <section>
                                <span>Status</span>
                                <strong className="positive">Success</strong>
                              </section>
                            </div>
                            <div className="eva-testing-metric-list">
                              <strong>Aggregated performance metrics</strong>
                              <p>
                                Workflow completion, answer correctness, and RAG sufficiency from the observability catalog.
                              </p>
                              {[
                                ['Workflow completion rate', '97.1%'],
                                ['Answer correctness', '93.2%'],
                                ['RAG context sufficiency', '88.1%'],
                              ].map(([label, value]) => (
                                <div key={label} className="eva-testing-metric-row">
                                  <Icon name="check-circle" weight="bold" size="sm" />
                                  <span>{label}</span>
                                  <strong>{value}</strong>
                                </div>
                              ))}
                            </div>
                            <div className="eva-testing-metric-list">
                              <strong>Scenario breakdown</strong>
                              {(
                                testingScenarioDraft.method === 'generate'
                                  ? [
                                      ['Generated scenario #1', '95.0%', '91.2%', '86.2%'],
                                      ['Generated scenario #2', '95.9%', '92.1%', '87.1%'],
                                    ].slice(0, Number.parseInt(testingScenarioDraft.generateTestCaseCount || '2', 10))
                                  : [[testingScenarioDraft.name || 'Manual scenario', '95.0%', '91.2%', '86.2%']]
                              ).map(([name, workflow, correctness, rag], index) => (
                                <section key={`${name}-${index}`} className="eva-testing-scenario-result-card">
                                  <h4>
                                    {name}
                                    <Badge variant="default">Scenario #{index + 1}</Badge>
                                  </h4>
                                  {[
                                    ['Workflow completion rate', workflow],
                                    ['Answer correctness', correctness],
                                    ['RAG context sufficiency', rag],
                                  ].map(([label, value]) => (
                                    <div key={label} className="eva-testing-metric-row">
                                      <Icon name="check-circle" weight="bold" size="sm" />
                                      <span>{label}</span>
                                      <strong>{value}</strong>
                                    </div>
                                  ))}
                                </section>
                              ))}
                            </div>
                          </div>
                          <div className="eva-readiness-score">
                            <strong>{readinessReport.score}</strong>
                            <span>/100 readiness score</span>
                          </div>
                          <p className="eva-readiness-summary">{readinessReport.summary}</p>
                          <div className="eva-readiness-checks">
                            {readinessReport.checks.map(check => (
                              <section key={check.label} className="eva-readiness-check">
                                <Badge
                                  variant={
                                    check.status === 'pass'
                                      ? 'success'
                                      : check.status === 'warning'
                                      ? 'warning'
                                      : 'error'
                                  }
                                >
                                  {check.status}
                                </Badge>
                                <span>
                                  <strong>{check.label}</strong>
                                  <small>{check.detail}</small>
                                </span>
                              </section>
                            ))}
                          </div>
                          {readinessReport.recommendations.length > 0 && (
                            <div className="eva-readiness-recommendations">
                              <strong>Recommended fixes</strong>
                              <ul className="eva-readiness-recommendation-list">
                                {readinessReport.recommendations.filter(recommendation => {
                                  const meta = getReadinessRecommendationFixMeta(recommendation);
                                  return meta.category !== 'preview';
                                }).map(recommendation => {
                                  const fixed = fixedReadinessRecommendations.has(recommendation);
                                  const fixMeta = getReadinessRecommendationFixMeta(recommendation);
                                  const isExpandedGuardrailFix =
                                    activeRecommendationFix === recommendation && fixMeta.category === 'guardrails';
                                  const isExpandedActionFix =
                                    activeRecommendationFix === recommendation && fixMeta.category === 'actions';
                                  const isExpandedKnowledgeFix =
                                    activeRecommendationFix === recommendation && fixMeta.category === 'knowledge';
                                  const firstEnabledStandardGuardrail =
                                    standardGuardrails.find(item => item.enabled) ?? standardGuardrails[0];
                                  return (
                                    <li
                                      key={recommendation}
                                      className={`eva-readiness-recommendation-item${fixed ? ' eva-readiness-recommendation-item--fixed' : ''}${isExpandedGuardrailFix || isExpandedActionFix || isExpandedKnowledgeFix ? ' eva-readiness-recommendation-item--expanded' : ''}`}
                                    >
                                      <span className="eva-readiness-recommendation-copy">
                                        {fixed ? (
                                          <Icon name="check-circle" weight="bold" size="sm" />
                                        ) : null}
                                        <span>{recommendation}</span>
                                      </span>
                                      {fixed ? (
                                        <Badge variant="success">Fixed</Badge>
                                      ) : isExpandedGuardrailFix || isExpandedActionFix || isExpandedKnowledgeFix ? null : (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleAddressReadinessRecommendation(recommendation)}
                                        >
                                          {fixMeta.actionLabel}
                                        </Button>
                                      )}
                                      {isExpandedGuardrailFix ? (
                                        <div className="eva-readiness-recommendation-fix-panel">
                                          <Textarea
                                            label="Guardrail rules"
                                            required
                                            rows={3}
                                            value={recommendationFixNote}
                                            placeholder={fixMeta.placeholder}
                                            onChange={(event) => setRecommendationFixNote(event.currentTarget.value)}
                                          />
                                          <div className="eva-readiness-guardrail-settings">
                                            <RadioGroup
                                              name={`fix-enforcement-${recommendation}`}
                                              label="Enforcement"
                                              value={firstEnabledStandardGuardrail.enforcement}
                                              onChange={(value) => updateEnabledStandardGuardrails('enforcement', value as EvaEnforcement)}
                                              className="security-enforcement-control"
                                            >
                                              <Radio value="monitor" label="Monitor" />
                                              <Radio value="block" label="Block" />
                                            </RadioGroup>
                                            <RadioGroup
                                              name={`fix-direction-${recommendation}`}
                                              label="Direction"
                                              value={firstEnabledStandardGuardrail.direction}
                                              onChange={(value) => updateEnabledStandardGuardrails('direction', value as EvaDirection)}
                                              className="security-enforcement-control"
                                            >
                                              <Radio value="prompt" label="Prompt" />
                                              <Radio value="response" label="Response" />
                                            </RadioGroup>
                                          </div>
                                          <div className="eva-readiness-recommendation-fix-actions">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={closeRecommendationFixModal}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              disabled={!recommendationFixNote.trim()}
                                              onClick={saveRecommendationFix}
                                            >
                                              Update guardrail
                                            </Button>
                                          </div>
                                        </div>
                                      ) : null}
                                      {isExpandedActionFix ? (
                                        <div className="eva-readiness-recommendation-fix-panel">
                                          <div className="eva-readiness-action-table">
                                            <Table>
                                              <TableHead>
                                                <TableRow>
                                                  <TableHeader>Action name</TableHeader>
                                                  <TableHeader>Created by</TableHeader>
                                                  <TableHeader>Description</TableHeader>
                                                  <TableHeader>Action type</TableHeader>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody empty={EVA_ACTION_ROWS.length === 0} emptyTitle="No recommended actions">
                                                {EVA_ACTION_ROWS.map(action => {
                                                  const selected = selectedActions.includes(action.name);
                                                  return (
                                                    <TableRow key={action.id} selected={selected}>
                                                      <TableCell>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                          <Toggle
                                                            size="compact"
                                                            checked={selected}
                                                            onChange={() => toggleAction(action.name)}
                                                            aria-label={`${selected ? 'Disable' : 'Enable'} ${action.name}`}
                                                          />
                                                          <strong>{action.name}</strong>
                                                        </span>
                                                      </TableCell>
                                                      <TableCell>{action.createdBy}</TableCell>
                                                      <TableCell style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                                                        {action.description}
                                                      </TableCell>
                                                      <TableCell>{action.actionType}</TableCell>
                                                    </TableRow>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </div>
                                          <div className="eva-readiness-recommendation-fix-actions">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={closeRecommendationFixModal}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={saveRecommendationFix}
                                            >
                                              Update
                                            </Button>
                                          </div>
                                        </div>
                                      ) : null}
                                      {isExpandedKnowledgeFix ? (
                                        <div className="eva-readiness-recommendation-fix-panel">
                                          <div className="eva-readiness-action-table">
                                            <Table>
                                              <TableHead>
                                                <TableRow>
                                                  <TableHeader>Name</TableHeader>
                                                  <TableHeader>Description</TableHeader>
                                                  <TableHeader>Sources</TableHeader>
                                                  <TableHeader>Last updated</TableHeader>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody empty={draft.knowledgeBases.length === 0} emptyTitle="No recommended knowledge sources">
                                                {draft.knowledgeBases.map(source => {
                                                  const selected = selectedKnowledgeBases.includes(source.name);
                                                  return (
                                                    <TableRow key={source.name} selected={selected}>
                                                      <TableCell>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                          <Toggle
                                                            size="compact"
                                                            checked={selected}
                                                            onChange={() => toggleKnowledgeBase(source.name)}
                                                            aria-label={`${selected ? 'Deselect' : 'Select'} ${source.name}`}
                                                          />
                                                          <strong>{source.name}</strong>
                                                        </span>
                                                      </TableCell>
                                                      <TableCell style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                                                        {source.description}
                                                      </TableCell>
                                                      <TableCell>{source.sources}</TableCell>
                                                      <TableCell>{formatRelative(source.lastUpdatedAt)}</TableCell>
                                                    </TableRow>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </div>
                                          <div className="eva-readiness-recommendation-fix-actions">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={closeRecommendationFixModal}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={saveRecommendationFix}
                                            >
                                              Update
                                            </Button>
                                          </div>
                                        </div>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="eva-dialogue__actions">
                    {testingScenarioStep !== 'choose-method' && !readinessTesting && (
                      <Button
                        variant="secondary"
                        onClick={startTestingScenarioWizard}
                      >
                        Create new test scenario
                      </Button>
                    )}
                    {testingScenarioStep === 'ready' && (
                      <Button variant={readinessReport ? 'secondary' : 'primary'} onClick={handleRunReadinessTest} disabled={readinessTesting}>
                        {readinessReport ? 'Run again' : 'Run this test'}
                      </Button>
                    )}
                  </div>
                </AiResponseMessage>
                {readinessReport && (
                  <div className="eva-dialogue__external-actions">
                    <Button onClick={createDraftAgent}>
                      <Icon name="sparkle" weight="bold" size="sm" />
                      Create agent
                    </Button>
                  </div>
                )}
                {activeRecommendationFix && !['guardrails', 'actions', 'knowledge'].includes(getReadinessRecommendationFixMeta(activeRecommendationFix).category) ? (
                  <Modal size="md" onClose={closeRecommendationFixModal} preventBackdropClose>
                    <ModalHeader
                      title={getReadinessRecommendationFixMeta(activeRecommendationFix).title}
                      description="Make the adjustment, then save to mark this recommendation as fixed."
                      onClose={closeRecommendationFixModal}
                    />
                    <ModalBody>
                      <div className="eva-recommendation-fix-modal">
                        <Banner
                          type="info"
                          title="Recommendation"
                          subtitle={activeRecommendationFix}
                          dismissable={false}
                        />
                        <Textarea
                          label={getReadinessRecommendationFixMeta(activeRecommendationFix).fieldLabel}
                          required
                          rows={4}
                          value={recommendationFixNote}
                          placeholder={getReadinessRecommendationFixMeta(activeRecommendationFix).placeholder}
                          onChange={(event) => setRecommendationFixNote(event.currentTarget.value)}
                        />
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button type="button" variant="secondary" size="sm" onClick={closeRecommendationFixModal}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!recommendationFixNote.trim()}
                        onClick={saveRecommendationFix}
                      >
                        Save fix
                      </Button>
                    </ModalFooter>
                  </Modal>
                ) : null}
                {renderUserPromptForStep('testing')}
              </>
            )}
                </section>
              )}
              {showBuildFlow && (
                <section
                  className={`eva-first-interface__chat eva-first-interface__chat--sticky eva-generated-composer${generatedComposerCollapsed ? ' eva-generated-composer--collapsed' : ''}`}
                  aria-label="Talk to AI Assistant"
                >
                  <div className="eva-generated-composer__surface">
                    <AiFooter
                      className="eva-ai-footer"
                      fillContainer
                      onSend={guidanceVisible ? handleWaterfallFollowup : handleSend}
                      processing={false}
                      disabled={evaThinking || waterfallThinking || evaStep === 'preview'}
                      placeholder="Ask any question during your configuration."
                      suggestions={[]}
                      voiceActive={voiceActive}
                      onVoiceToggle={() => setVoiceActive(prev => !prev)}
                      cornerAction={!generatedComposerCollapsed ? (
                        <button
                          type="button"
                          className="eva-generated-composer__toggle"
                          aria-label="Collapse composer"
                          aria-expanded="true"
                          onClick={() => setGeneratedComposerCollapsed(true)}
                        >
                          <Icon name="arrow-down" weight="bold" size="sm" />
                        </button>
                      ) : null}
                    />
                    {generatedComposerCollapsed && (
                      <button
                        type="button"
                        className="eva-generated-composer__toggle eva-generated-composer__toggle--collapsed"
                        aria-label="Expand composer"
                        aria-expanded="false"
                        onClick={() => setGeneratedComposerCollapsed(false)}
                      >
                        <Icon name="arrow-up" weight="bold" size="sm" />
                      </button>
                    )}
                  </div>
                </section>
              )}
            </div>

            <aside
              className={`eva-form-builder__side-panel eva-generated-side-panel${
                showEvaGeneratedSidePanel ? '' : ' eva-generated-side-panel--collapsed'
              }`}
              aria-label="Generated agent summary"
            >
              {showEvaGeneratedSidePanel && (
                <>
              <section className="eva-side-card">
                <div className="eva-side-card__header">
                  <button
                    type="button"
                    className="eva-side-card__icon-btn"
                    aria-label="Collapse side panel"
                    onClick={() => setShowEvaGeneratedSidePanel(false)}
                  >
                    <Icon name="list-menu" weight="bold" size="sm" />
                  </button>
                  <h2>Progress</h2>
                </div>
                <div className="eva-generation-progress-groups">
                  {groupedProgressSections.map(section => (
                    <section key={section.title} className="eva-generation-progress-group">
                      <h3>{section.title}</h3>
                      <ol className="eva-generation-progress">
                        {section.items.map(step => (
                          <li
                            key={step.label}
                            className={`eva-generation-progress__item eva-generation-progress__item--${step.status}`}
                          >
                            <button
                              type="button"
                              className="eva-generation-progress__button"
                              onClick={() => openSidePanelStep(step.step)}
                              aria-label={`Open ${step.label.replace(/^\d+\.\s*/, '')} configuration`}
                            >
                              <span className="eva-generation-progress__icon" aria-hidden="true">
                                <Icon
                                  name={step.status === 'done' ? 'check-circle-filled' : 'shape-circle'}
                                  weight="bold"
                                  size="sm"
                                />
                              </span>
                              <span>
                                <strong>{step.label}</strong>
                                <small>{step.detail}</small>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              </section>

              <section className="eva-side-card">
                <div className="eva-side-card__header">
                  <Icon name="bot" weight="bold" size="sm" />
                  <h2>Summary of the Agent</h2>
                </div>
                {evaThinking ? (
                  <div
                    className="eva-side-card-skeleton"
                    role="status"
                    aria-label="Generating agent summary"
                  >
                    <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--medium" />
                    <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                    <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                    <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--short" />
                  </div>
                ) : (
                  <div className="eva-side-summary">
                    <strong>{agentName}</strong>
                    <p>{agentDescription}</p>
                    <span>{agentCharacterSummary}</span>
                  </div>
                )}
              </section>

              <section className="eva-side-card">
                <div className="eva-side-card__header eva-side-card__header--action">
                  <span className="eva-side-card__title">
                    <Icon name="apps" weight="bold" size="sm" />
                    <h2>Context</h2>
                  </span>
                  <button
                    type="button"
                    className="eva-side-edit-btn"
                    aria-label={sideContextExpanded ? 'Collapse context' : 'Expand context'}
                    aria-expanded={sideContextExpanded}
                    onClick={() => setSideContextExpanded(prev => !prev)}
                  >
                    <Icon name={sideContextExpanded ? 'arrow-up' : 'arrow-down'} weight="bold" size="sm" />
                  </button>
                </div>
                {sideContextExpanded && evaThinking ? (
                  <div
                    className="eva-side-card-skeleton"
                    role="status"
                    aria-label="Generating agent context"
                  >
                    <div className="eva-side-card-skeleton__group">
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--label" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--medium" />
                    </div>
                    <div className="eva-side-card-skeleton__group">
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--label" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--long" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--medium" />
                    </div>
                    <div className="eva-side-card-skeleton__group">
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--label" />
                      <div className="eva-side-card-skeleton__bar eva-side-card-skeleton__bar--short" />
                    </div>
                  </div>
                ) : sideContextExpanded ? (
                  <div className="eva-side-context">
                  <section className="eva-side-context__section" aria-label="Action">
                    <h3>Action</h3>
                    <ul className="eva-side-toggle-list">
                      {sidePanelActions.map(action => (
                        <li key={action.id} className="eva-side-toggle-list__item">
                          <Toggle
                            size="compact"
                            label={action.name}
                            checked={action.enabled}
                            onChange={() => toggleAction(action.name)}
                          />
                          <button
                            type="button"
                            className="eva-side-edit-btn"
                            aria-label={`Edit ${action.name}`}
                            onClick={() => openSidePanelStep('actions')}
                          >
                            <Icon name="edit" weight="bold" size="sm" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="eva-side-context__section" aria-label="Knowledge base">
                    <h3>Knowledge base</h3>
                    <ul className="eva-side-toggle-list">
                      {sidePanelKnowledgeBases.map(source => (
                        <li key={source.id} className="eva-side-toggle-list__item">
                          <Toggle
                            size="compact"
                            label={source.name}
                            checked={source.enabled}
                            onChange={() => toggleKnowledgeBase(source.name)}
                          />
                          <button
                            type="button"
                            className="eva-side-edit-btn"
                            aria-label={`Edit ${source.name}`}
                            onClick={() => openSidePanelStep('knowledge')}
                          >
                            <Icon name="edit" weight="bold" size="sm" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="eva-side-context__section" aria-label="Language">
                    <h3>Language</h3>
                    <p>{languageSummary}</p>
                  </section>
                  </div>
                ) : null}
              </section>
              {visibleSteps.includes('preview') && (
                <section ref={sidePanelPreviewCardRef} className="eva-side-card eva-side-preview-card">
                  <div className="eva-side-card__header">
                    <Icon name="play" weight="bold" size="sm" />
                    <h2>Preview experience</h2>
                  </div>
                  <p className="eva-side-card__description">{previewLaunchInstruction}</p>
                  {renderPreviewSession()}
                </section>
              )}
                </>
              )}
            </aside>
          </div>
        )}

        {/* The inline landing composer above already handles the
            landing-mode entry point. This footer composer is for the
            "build flow" once Eva is generating / has generated content
            — show it only when we're past the landing screen. */}
        {showBuildFlow && !showGeneratedSidePanel && !showLandingOptions && (
          <section className={`eva-first-interface__chat${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface__chat--sticky' : ''}`} aria-label="Talk to AI Assistant">
            {!guidanceVisible && !evaThinking && <div className="eva-chat-spacer" aria-hidden />}
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={guidanceVisible ? handleWaterfallFollowup : handleSend}
              processing={false}
              disabled={evaThinking || waterfallThinking}
              placeholder="Ask any question during your configuration."
              suggestions={[]}
              voiceActive={voiceActive}
              onVoiceToggle={() => setVoiceActive(prev => !prev)}
            />
          </section>
        )}
      </div>
    </div>
  );
}
