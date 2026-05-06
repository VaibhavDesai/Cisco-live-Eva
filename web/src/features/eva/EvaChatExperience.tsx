import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import Button from '../../components/shared/Button';
import { AccordionItem, AiFooter, AiResponseMessage, AiThreadPanel, AiUserMessage, Badge, Dropdown, Input, MenuItem, MenuOverlay, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, Toggle, useMenu } from '../../components/shared';
import { AgentCard } from '../../components/agents';
import { Icon } from '../../icons';
import {
  EVA_CANVAS_AGENTS_PATH,
  EVA_CANVAS_DASHBOARD_PATH,
  EVA_CANVAS_NEW_THREAD_FLAG,
  EVA_CANVAS_ORIGIN_PATH_KEY,
  EVA_CANVAS_PATHS,
} from './EvaCanvasOverlay';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft, EvaMessage, EvaTemplateId } from './types';
import { formatRelative } from '../../pages/knowledge/utils';
import { optimizeInstructions, sendEvaChat } from '../../api/ciscoAi';
import {
  CHANNEL_PHONE_NUMBER_OPTIONS,
  DIGITAL_CHANNEL_DETAILS,
  DIGITAL_CHANNEL_OPTIONS,
  EVA_ACTION_ROWS,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_PLANNING_ROWS,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  EVA_STEP_ORDER,
  INSTRUCTION_EXAMPLES,
  PROFILE_LANGUAGE_OPTIONS,
  PROFILE_TIMEZONE_OPTIONS,
  PROFILE_VOICE_OPTIONS,
  STARTER_PROMPTS,
  buildGuidanceMessage,
  buildInstructionPrompt,
  buildWelcomeMessage,
  isOrchestrationIntent,
  readEvaSessionState,
  sensitivityToValue,
  summarizeInstructionPrompt,
  valueToSensitivity,
  type EvaChannelType,
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
const EVA_SYSTEM_PROMPT = `You are Eva, a conversational AI assistant inside Webex AI Agent Studio. You help product designers and admins design AI agents — defining purpose, knowledge sources, available actions, security policies, voice, and language settings.

Available starter templates (and the trigger keywords that launch the guided build flow): Customer support (keyword: "support"), Knowledge assistant (keywords: "healthcare", "reception"), Workflow automation (keywords: "IT", "ticket", "helpdesk"), Policy compliance (keyword: "compliance"), Sales enablement (keyword: "sales").

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
- If the user clearly wants the multi-agent canvas (mentions "canvas", "orchestrate", "multi-agent", "delegate"), suggest opening the canvas view rather than answering inline.
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
    review: 'Review (final summary before the agent is created)',
  };

  return `You are Eva, a conversational AI assistant inside Webex AI Agent Studio. The user is in the middle of configuring an AI agent through a step-by-step build flow and has asked you a question or for help.

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
- When the user asks you to draft a field value (welcome message, instruction prompt, description, custom guardrail), return the suggested text in plain prose so they can copy it directly. No JSON wrapping.
- If the user asks "what should I pick" / "what's a good X", give a concrete recommendation tailored to their current draft, not generic advice.
- If the user signals they're done with this step ("looks good", "continue", "next"), confirm briefly and tell them they can advance via the same composer.
- Don't pretend you can change fields for them — explain what they should change and where (Profile / Knowledge / Action / Security panels).
- Stay in scope: agent design only. Politely steer off-topic asks back to the current step.`;
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
const TOTAL_PROGRESS_STEPS = 7;

const evaStepOrder: EvaConversationStep[] = EVA_STEP_ORDER;

const evaPlanningRows = EVA_PLANNING_ROWS;
const starterPrompts = STARTER_PROMPTS;

export default function EvaChatExperience() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, addAgent, aiEngines, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const { setVariation } = useDesignVariation();
  const restoredEvaSessionRef = useRef<EvaSessionState | null>(null);
  if (restoredEvaSessionRef.current === null) {
    restoredEvaSessionRef.current = readEvaSessionState();
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
  const [welcomeMessage, setWelcomeMessage] = useState(restoredEvaSession?.welcomeMessage ?? 'Hi, I am Eva. I can help answer questions, guide next steps, and connect you with the right support path.');
  const [instructionPrompt, setInstructionPrompt] = useState(restoredEvaSession?.instructionPrompt ?? '');
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>(restoredEvaSession?.selectedKnowledgeBases ?? EVA_TEMPLATES[0].draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
  const [selectedActions, setSelectedActions] = useState<string[]>(restoredEvaSession?.selectedActions ?? EVA_TEMPLATES[0].draft.actions.slice(0, 2));
  const [showInstructionExamples, setShowInstructionExamples] = useState(false);
  const [optimizingInstructions, setOptimizingInstructions] = useState(false);
  const [optimizeAccepted, setOptimizeAccepted] = useState(restoredEvaSession?.optimizeAccepted ?? false);
  const [preOptimizeText, setPreOptimizeText] = useState(restoredEvaSession?.preOptimizeText ?? '');
  const [optimizeSummary, setOptimizeSummary] = useState<{ changes: string[]; reasoning: string[] }>(restoredEvaSession?.optimizeSummary ?? { changes: [], reasoning: [] });
  const [securityTier, setSecurityTier] = useState<EvaSecurityTier>(restoredEvaSession?.securityTier ?? 'standard');
  const [channelType, setChannelType] = useState<EvaChannelType>(restoredEvaSession?.channelType ?? 'digital');
  const [digitalChannel, setDigitalChannel] = useState<EvaDigitalChannel>(restoredEvaSession?.digitalChannel ?? 'chat');
  const [digitalChannelAddress, setDigitalChannelAddress] = useState(restoredEvaSession?.digitalChannelAddress ?? '');
  const [channelPhoneNumber, setChannelPhoneNumber] = useState(restoredEvaSession?.channelPhoneNumber ?? CHANNEL_PHONE_NUMBER_OPTIONS[0].value);
  const [standardGuardrails, setStandardGuardrails] = useState(restoredEvaSession?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS);
  const [advancedGuardrailGroups, setAdvancedGuardrailGroups] = useState(restoredEvaSession?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS);
  const [expandedAdvancedGroups, setExpandedAdvancedGroups] = useState<Set<string>>(
    () => new Set(restoredEvaSession?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => group.id)),
  );
  const [personality, setPersonality] = useState(restoredEvaSession?.personality ?? {
    llm: 'Webex AI Pro 1.0',
    voice: 'ava',
    language: 'en-US',
    gender: 'neutral',
  });
  const [customRules, setCustomRules] = useState<string[]>(restoredEvaSession?.customRules ?? []);
  const [showEvaGeneratedSidePanel, setShowEvaGeneratedSidePanel] = useState(true);
  const [showEvaThreadPanel, setShowEvaThreadPanel] = useState(false);
  const [activeEvaThreadId, setActiveEvaThreadId] = useState('eva-thread-current');
  const [evaThreads, setEvaThreads] = useState<EvaThread[]>([
    { id: 'eva-thread-current', title: 'Current Eva setup', group: 'Today' },
    { id: 'eva-thread-canvas', title: 'Canvas orchestration', group: 'Today' },
  ]);
  const [evaPlanningProgress, setEvaPlanningProgress] = useState(0);
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
      digitalChannel,
      digitalChannelAddress,
      channelPhoneNumber,
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
  }, []);

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
        scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });
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

     Deps are deliberately limited to `latestUserMessageText` and
     `waterfallThinking` so this effect only re-fires when a mid-step
     exchange actually changes (new user message pushed, or LLM reply
     landed) — NOT when the user advances steps or planning completes
     (those are handled by the step-anchor scroll above). */
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const scrollContainer = document.querySelector<HTMLElement>('.eva-dialogue');
      if (!scrollContainer) return;
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestUserMessageText, waterfallThinking]);

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
    setMessages(prev => [
      ...prev,
      { role: 'user', text: starterPrompts.find(prompt => prompt.templateId === templateId)?.prompt ?? `Use the ${template.name} template.` },
    ]);
    completeEvaThinking(() => {
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
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: buildGuidanceMessage(template.draft),
          followups: ['Create this agent', 'Open Knowledge setup', 'Open Actions setup', 'Open Security setup'],
        },
      ]);
    });
  };

  const handleBuildFromScratch = () => {
    setIsCreateModalOpen(true);
  };

  /* "Existing agent" landing button — switches the design variation
     to the dashboard (table) view so the user lands on the existing
     AI Agent landing page that lists their agents in a table. The
     route stays on /agents; the variation context already swaps the
     rendered component (see Agents.tsx). Mirrors the same secondary
     entry point on the form-builder landing. */
  const handleSwitchToExistingAgents = () => {
    setVariation('dashboard');
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
      return next.length ? next : [{ id: 'eva-thread-current', title: 'Current Eva setup', group: 'Today' }];
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
    showToast(`Eva created "${agentName}" as a draft agent.`, 'success');
    navigate(`/agents/${agent.id}/configure?section=Profile`);
  };

  const handleAgentClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleConfigureClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}/configure`);
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
    const normalized = text.trim().toLowerCase();
    if (!normalized) return null;
    if (normalized.includes('healthcare') || normalized.includes('reception')) {
      return EVA_TEMPLATES.find(template => template.id === 'knowledge-assistant') ?? null;
    }
    if (normalized.includes('it ') || normalized.includes('helpdesk') || normalized.includes('ticket')) {
      return EVA_TEMPLATES.find(template => template.id === 'workflow-automation') ?? null;
    }
    if (normalized.includes('policy') || normalized.includes('compliance')) {
      return EVA_TEMPLATES.find(template => template.id === 'policy-compliance') ?? null;
    }
    if (normalized.includes('sales')) {
      return EVA_TEMPLATES.find(template => template.id === 'sales-enablement') ?? null;
    }
    if (normalized.includes('customer') || normalized.includes('support')) {
      return EVA_TEMPLATES.find(template => template.id === 'customer-support') ?? null;
    }
    return null;
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
        customRules,
      });
      const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(message => ({ role: message.role, content: message.text })),
        { role: 'user', content: latestUserText },
      ];
      const reply = await sendEvaChat(history);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text:
            reply.trim() ||
            'I don\u2019t have a suggestion for that yet \u2014 could you give me a bit more context?',
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

  const generatedName = draft.name.includes('Customer')
    ? 'ClaimClarity'
    : draft.name.replace(/\s+Eva Agent$/, '').replace(/\s+Agent$/, '') || 'EvaAgent';

  const currentStepIndex = evaStepOrder.indexOf(evaStep);
  const visibleSteps = evaStepOrder.slice(0, currentStepIndex + 1);
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

  const selectedLanguage = PROFILE_LANGUAGE_OPTIONS.find(option => option.value === personality.language);
  const selectedVoice = PROFILE_VOICE_OPTIONS.find(option => option.value === personality.voice);
  const languageSummary = selectedLanguage?.label ?? personality.language;
  const agentCharacterSummary = `${selectedVoice?.label ?? personality.voice} voice · ${personality.gender === 'neutral' ? 'Neutral' : personality.gender} character`;
  const instructionSummary = summarizeInstructionPrompt(instructionPrompt);
  const selectedDigitalChannel = DIGITAL_CHANNEL_OPTIONS.find(option => option.value === digitalChannel) ?? DIGITAL_CHANNEL_OPTIONS[0];
  const selectedDigitalChannelDetails = DIGITAL_CHANNEL_DETAILS[digitalChannel];
  const channelDestination = channelType === 'digital' ? digitalChannelAddress.trim() : channelPhoneNumber;
  const channelSummary = channelType === 'digital'
    ? `${selectedDigitalChannel.label} · ${channelDestination || 'Add address or number'}`
    : `Voice · ${channelPhoneNumber}`;
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
    /* Eva's reply for THIS step is the most recent assistant message
       tagged with this step (runWaterfallLlmReply tags both sides). */
    const midStepAssistantReply = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant' && msg.originStep === step) return msg;
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
            assistantName="Eva is thinking..."
            assistantState="processing"
            content={null}
          />
        )}
        {!waterfallThinking && midStepAssistantReply && (
          <AiResponseMessage
            key={`reply-${step}-${midStepAssistantReply.text}`}
            className="eva-ai-response"
            showActions={false}
            assistantName="Eva"
            content={midStepAssistantReply.text}
          />
        )}
      </>
    );
  };
  const renderEvaPlanningRows = (visibleCount = evaPlanningRows.length, dynamic = false, complete = false) => (
    <div
      className={`eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning${dynamic ? ' eva-waterfall-status--dynamic' : ''}`}
      aria-label="Eva planning process"
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
          View Eva’s thinking trace
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
    <div className="primary-content eva-agents-landing eva-agents-landing--flush">
      {shouldShowEvaThreadPanel && (
        <aside className="eva-thread-panel-shell" aria-label="Eva threads">
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
        className={`eva-first-interface${showLandingOptions ? ' eva-first-interface--landing eva-landing-shell' : ''}${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface--generated' : ''}${freeChatActive && !guidanceVisible && !orchestrationSuggested ? ' eva-first-interface--free-chat' : ''}`}
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
            <div className="eva-view-header">
              <div className="agent-avatar eva-view-header__avatar" style={{ background: gradient }}>
                {profileInitials}
              </div>
              <div className="eva-view-header__content">
                <div className="eva-view-header__title-row">
                  <h1 className="eva-view-title">{agentName}</h1>
                  <Badge variant="warning">Draft</Badge>
                </div>
                <p className="eva-view-header__meta">{agentDescription} • Last updated just now</p>
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
                    if (showEvaGeneratedSidePanel) {
                      setShowEvaGeneratedSidePanel(false);
                    } else {
                      setShowEvaThreadPanel(true);
                      setShowEvaGeneratedSidePanel(true);
                    }
                    panelMenu.close();
                  }}
                />
              </MenuOverlay>
              <Button variant="secondary" size="sm" onClick={() => openEvaCanvas()}>
                <Icon name="workflow-deployments" weight="bold" size="sm" />
                Canvas view
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
            <h1 id="eva-landing-title">Hi I'm Eva!</h1>
            <h2>Build smart agent anytime, anywhere.</h2>
            <p>
              Describe the business need, persona, tools, data, routing, or guardrails.
              Eva will decide when your request should become a guided agent configuration.
            </p>
          </section>
        )}

        {/* Inline composer between hero and prompt cards — matches the
            form-builder landing layout so all chat-based variations share
            one entry-point design. The "real" composer rendered below
            (the sticky/footer one) is suppressed while we're in the
            landing state to avoid two composers stacking. */}
        {showLandingOptions && landingMode === 'build' && (
          <div className="eva-landing-composer" aria-label="Talk to Eva">
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handleSend}
              processing={false}
              disabled={evaThinking}
              placeholder="Type with Eva. Try: Create an AI agent for customer onboarding..."
              suggestions={[]}
              voiceActive={voiceActive}
              onVoiceToggle={() => setVoiceActive(prev => !prev)}
            />
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
                <span className="eva-prompt-card__icon" aria-hidden="true">
                  <Icon name={prompt.icon} weight="bold" size="md" />
                </span>
                <strong>{prompt.title}</strong>
                <span>{prompt.description}</span>
                <small>Use this example</small>
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
          <section
            className="eva-dialogue eva-first-interface__free-chat"
            aria-label="Eva conversation"
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
              const followups = baseFollowups.length > 0
                ? [...baseFollowups, OTHER_TEMPLATES_LABEL]
                : baseFollowups;
              return (
                <AiResponseMessage
                  key={`free-${index}`}
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="Eva"
                  content={message.text}
                  followups={followups}
                  onFollowup={handleLlmFollowupClick}
                />
              );
            })}
            {evaThinking && (
              <AiResponseMessage
                className="eva-ai-response"
                showActions={false}
                assistantName="Eva is thinking..."
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
              Pick one of the starter templates below, or keep chatting with Eva.
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
                  <span className="eva-prompt-card__icon" aria-hidden="true">
                    <Icon name={prompt.icon} weight="bold" size="md" />
                  </span>
                  <strong>{prompt.title}</strong>
                  <span>{prompt.description}</span>
                  <small>Use this example</small>
                </button>
              ))}
            </section>
          </>
        )}

        {showGeneratedSidePanel && (
          <div className={`eva-generated-layout${showEvaGeneratedSidePanel ? '' : ' eva-generated-layout--side-collapsed'}`}>
            <div className="eva-generated-layout__main">
              {evaThinking && (
                <section className="eva-dialogue" aria-label="Eva conversation flow" aria-live="polite">
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
          <section className="eva-dialogue" aria-label="Eva conversation flow">
            {latestUserMessage && <AiUserMessage text={latestUserMessage.text} />}
            <AiResponseMessage
              className="eva-ai-response"
              showActions={false}
              assistantName="Eva"
              content="Eva Canvas is the visual workspace for mapping agent orchestration, connecting nodes, defining handoffs, and coordinating flows. I can open it for you while preserving this chat."
            >
              <div className="eva-dialogue__actions">
                <Button onClick={() => openEvaCanvas()}>Open Eva Canvas</Button>
                <Button variant="secondary" onClick={() => setOrchestrationSuggested(false)}>
                  Build a single agent instead
                </Button>
              </div>
            </AiResponseMessage>
          </section>
        )}

              {guidanceVisible && !evaThinking && (
                <section className="eva-dialogue" aria-label="Eva conversation flow">
            {visibleSteps.includes('profile') && (
              <>
                <div className="eva-step-anchor" data-eva-step="profile" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="Eva"
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

            {visibleSteps.includes('channels') && (
              <>
                <div className="eva-step-anchor" data-eva-step="channels" tabIndex={-1} />
                <AiResponseMessage
                  className="eva-ai-response"
                  showActions={false}
                  assistantName="Eva"
                  content="Next, choose where this agent should be available. Select a channel type, then choose the specific channel and address or number Eva should use."
                >
                  <div className="eva-config-block">
                    <div className="eva-security-tier-selector eva-channel-type-selector" role="radiogroup" aria-label="Channel type">
                      <button
                        type="button"
                        className={`eva-security-tier-card${channelType === 'digital' ? ' eva-security-tier-card--selected' : ''}`}
                        onClick={() => setChannelType('digital')}
                        aria-pressed={channelType === 'digital'}
                      >
                        <Icon name="chat" weight="bold" size={24} />
                        <span>
                          <strong>Digital</strong>
                          <small>Use messaging and digital entry points for customer conversations.</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`eva-security-tier-card${channelType === 'voice' ? ' eva-security-tier-card--selected' : ''}`}
                        onClick={() => setChannelType('voice')}
                        aria-pressed={channelType === 'voice'}
                      >
                        <Icon name="phone" weight="bold" size={24} />
                        <span>
                          <strong>Voice</strong>
                          <small>Use voice calling flows for phone-based customer conversations.</small>
                        </span>
                      </button>
                    </div>
                    {channelType === 'digital' ? (
                      <div className="eva-config-grid eva-config-grid--responsive-two">
                        <Dropdown
                          label="Digital channel"
                          required
                          options={DIGITAL_CHANNEL_OPTIONS}
                          value={digitalChannel}
                          onChange={value => setDigitalChannel(value as EvaDigitalChannel)}
                        />
                        <Input
                          label={selectedDigitalChannelDetails.label}
                          required
                          type={selectedDigitalChannelDetails.inputType}
                          value={digitalChannelAddress}
                          onChange={event => setDigitalChannelAddress(event.target.value)}
                          placeholder={selectedDigitalChannelDetails.placeholder}
                          hint={selectedDigitalChannelDetails.hint}
                        />
                      </div>
                    ) : (
                      <Dropdown
                        label="Voice phone number"
                        required
                        options={CHANNEL_PHONE_NUMBER_OPTIONS}
                        value={channelPhoneNumber}
                        onChange={setChannelPhoneNumber}
                      />
                    )}
                    {evaStep === 'channels' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('instructions')} disabled={!channelDestination}>Continue to instructions</Button>
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
                  assistantName="Eva"
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
                            <button type="button" className="instructions-toolbar-pill" onClick={() => setShowInstructionExamples(prev => !prev)}>
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
                        <textarea
                          className="instructions-textarea"
                          placeholder="Set clear goals for your agent. Provide step-by-step instructions to help them succeed in reaching these targets."
                          value={instructionPrompt}
                          onChange={event => setInstructionPrompt(event.target.value)}
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

                    {showInstructionExamples && (
                      <div className="eva-instruction-examples" aria-label="Instruction examples and tips">
                        <div className="eva-instruction-examples__section">
                          <h4>Instruction examples</h4>
                          <div className="eva-instruction-examples__cards">
                            {INSTRUCTION_EXAMPLES.map(example => (
                              <article key={example.title} className="eva-instruction-example-card">
                                <strong>{example.title}</strong>
                                <p>{example.content.split('\n\n')[0].replace('#### Role & Identity\n', '')}</p>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setInstructionPrompt(`**${example.title}**\n\n${example.content}`);
                                    setShowInstructionExamples(false);
                                    setOptimizeAccepted(false);
                                    showToast('Example inserted into instructions', 'success');
                                  }}
                                >
                                  Insert
                                </Button>
                              </article>
                            ))}
                          </div>
                        </div>
                        <div className="eva-instruction-examples__section">
                          <h4>Best practice tips</h4>
                          <ul className="eva-instruction-tips">
                            <li>Start with a clear role definition.</li>
                            <li>Use markdown headers for role, goals, guardrails, and output rules.</li>
                            <li>Define the agent's tone and escalation path.</li>
                          </ul>
                        </div>
                      </div>
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
                  assistantName="Eva"
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
                  assistantName="Eva"
                  content="For actions, I recommend these fulfillment capabilities based on the agent purpose. Review what Eva should be allowed to do."
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
                  assistantName="Eva"
                  content="For security, I broke the configuration into the same sections as the Security page: choose a guardrail tier, review observability behavior, tune standard guardrails, and optionally enable advanced AI Defense categories or custom profiles."
                >
                  <div className="eva-config-block">
                    <div className="eva-security-panel">
                      <div className="eva-security-header">
                        <div>
                          <h3>Security</h3>
                          <p>Configure protection rules to control agent behavior, enforce safety policies, and prevent misuse.</p>
                        </div>
                      </div>

                      <div className="eva-security-tier-selector" role="radiogroup" aria-label="Security tier">
                        <button
                          type="button"
                          className={`eva-security-tier-card${securityTier === 'standard' ? ' eva-security-tier-card--selected' : ''}`}
                          onClick={() => setSecurityTier('standard')}
                        >
                          <Icon name="shield" weight="bold" size={24} />
                          <span>
                            <strong>Standard guardrails</strong>
                            <small>Basic protection with toxicity, harm detection, and jailbreak prevention.</small>
                            <em>{standardGuardrails.filter(item => item.enabled).length}/{standardGuardrails.length} enabled</em>
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`eva-security-tier-card${securityTier === 'advanced' ? ' eva-security-tier-card--selected' : ''}`}
                          onClick={() => setSecurityTier('advanced')}
                        >
                          <Icon name="secure-circle" weight="bold" size={24} />
                          <span>
                            <strong>Advanced guardrails <Badge variant="success" className="security-tier-badge">AI Defense</Badge></strong>
                            <small>Comprehensive security, privacy, and safety guardrails with custom profiles.</small>
                            <em>{advancedGuardrailGroups.reduce((sum, group) => sum + group.items.filter(item => item.enabled).length, 0)}/{advancedGuardrailGroups.reduce((sum, group) => sum + group.items.length, 0)} enabled</em>
                          </span>
                        </button>
                      </div>

                      <div className="eva-security-observability">
                        <Icon name="info-circle" weight="bold" size={18} />
                        <span>
                          <strong>Observability and logging</strong>
                          Triggered rails are logged in Sessions. Monitor allows the interaction to continue with a log entry; Block rejects the individual prompt while keeping the conversation active.
                        </span>
                      </div>

                      {securityTier === 'standard' && (
                        <div className="eva-security-standard-list">
                          {standardGuardrails.map(guardrail => (
                            <section key={guardrail.id} className="eva-security-guardrail-card">
                              <div className="eva-security-guardrail-header">
                                <Toggle
                                  size="compact"
                                  checked={guardrail.enabled}
                                  onChange={() => toggleStandardGuardrail(guardrail.id)}
                                  aria-label={`${guardrail.enabled ? 'Disable' : 'Enable'} ${guardrail.name}`}
                                />
                                <span>
                                  <strong>{guardrail.name}</strong>
                                  <small>{guardrail.description}</small>
                                </span>
                              </div>
                              {guardrail.enabled && (
                                <div className="eva-security-controls">
                                  <div className="eva-security-sensitivity-control">
                                    <label>Sensitivity</label>
                                    <Slider
                                      value={sensitivityToValue[guardrail.sensitivity]}
                                      onChange={value => updateStandardGuardrail(guardrail.id, 'sensitivity', valueToSensitivity(value as number))}
                                      min={0}
                                      max={100}
                                      step={50}
                                      showTicks
                                      aria-label={`${guardrail.name} sensitivity`}
                                    />
                                    <div className="security-sensitivity-labels">
                                      <span>Low</span>
                                      <span>Medium</span>
                                      <span>High</span>
                                    </div>
                                  </div>
                                  <Dropdown
                                    label="Enforcement"
                                    options={[
                                      { value: 'monitor', label: 'Monitor' },
                                      { value: 'block', label: 'Block' },
                                    ]}
                                    value={guardrail.enforcement}
                                    onChange={value => updateStandardGuardrail(guardrail.id, 'enforcement', value as EvaEnforcement)}
                                  />
                                  <Dropdown
                                    label="Direction"
                                    options={[
                                      { value: 'prompt', label: 'Prompt' },
                                      { value: 'response', label: 'Response' },
                                    ]}
                                    value={guardrail.direction}
                                    onChange={value => updateStandardGuardrail(guardrail.id, 'direction', value as EvaDirection)}
                                  />
                                </div>
                              )}
                            </section>
                          ))}
                        </div>
                      )}

                      {securityTier === 'advanced' && (
                        <div className="eva-security-advanced-list">
                          {advancedGuardrailGroups.map(group => (
                            <section key={group.id} className="eva-security-advanced-group">
                              <button
                                type="button"
                                className="eva-security-group-header eva-security-group-header--button"
                                onClick={() => toggleAdvancedGroup(group.id)}
                                aria-expanded={expandedAdvancedGroups.has(group.id)}
                              >
                                <Icon name={group.icon} weight="bold" size={18} />
                                <strong>{group.label}</strong>
                                <Badge>{group.items.filter(item => item.enabled).length}/{group.items.length}</Badge>
                                <Icon name={expandedAdvancedGroups.has(group.id) ? 'arrow-up' : 'arrow-down'} weight="bold" size={16} />
                              </button>
                              {expandedAdvancedGroups.has(group.id) && (
                                <div className="eva-security-advanced-items">
                                  {group.items.map(item => (
                                    <section key={item.id} className="eva-security-guardrail-card eva-security-advanced-rule-card">
                                      <div className="eva-security-guardrail-header">
                                        <Toggle
                                          size="compact"
                                          checked={item.enabled}
                                          onChange={() => toggleAdvancedGuardrail(group.id, item.id)}
                                          aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${item.name}`}
                                        />
                                        <span>
                                          <strong>{item.name}</strong>
                                          <small>{item.description}</small>
                                        </span>
                                      </div>
                                      {item.enabled && (
                                        <div className="eva-security-controls">
                                          <div className="eva-security-sensitivity-control">
                                            <label>Sensitivity</label>
                                            <Slider
                                              value={sensitivityToValue[item.sensitivity]}
                                              onChange={value => updateAdvancedGuardrail(group.id, item.id, 'sensitivity', valueToSensitivity(value as number))}
                                              min={0}
                                              max={100}
                                              step={50}
                                              showTicks
                                              aria-label={`${item.name} sensitivity`}
                                            />
                                            <div className="security-sensitivity-labels">
                                              <span>Low</span>
                                              <span>Medium</span>
                                              <span>High</span>
                                            </div>
                                          </div>
                                          <Dropdown
                                            label="Enforcement"
                                            options={[
                                              { value: 'monitor', label: 'Monitor' },
                                              { value: 'block', label: 'Block' },
                                            ]}
                                            value={item.enforcement}
                                            onChange={value => updateAdvancedGuardrail(group.id, item.id, 'enforcement', value as EvaEnforcement)}
                                          />
                                          <Dropdown
                                            label="Direction"
                                            options={[
                                              { value: 'prompt', label: 'Prompt' },
                                              { value: 'response', label: 'Response' },
                                            ]}
                                            value={item.direction}
                                            onChange={value => updateAdvancedGuardrail(group.id, item.id, 'direction', value as EvaDirection)}
                                          />
                                        </div>
                                      )}
                                    </section>
                                  ))}
                                </div>
                              )}
                            </section>
                          ))}
                          <section className="eva-security-custom-profile">
                            <div className="eva-security-group-header">
                              <Icon name="document-create" weight="bold" size={18} />
                              <strong>Custom profiles</strong>
                            </div>
                            <p>Generate custom profiles tailored to this agent's configuration and requirements.</p>
                            <Button variant="secondary" size="sm">
                              <Icon name="plus" weight="bold" size={16} />
                              Create custom profile
                            </Button>
                          </section>
                        </div>
                      )}
                    </div>
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
                  assistantName="Eva"
                  content={`Ready to create ${agentName}? I kept each recommendation tied to the agent configuration: profile, instructions, knowledge, actions, channels, and guardrails.`}
                >
                  <div className="eva-config-block">
                    <div className="eva-config-summary">
                      <span><strong>Welcome</strong>{welcomeMessage}</span>
                      <span><strong>Language</strong>{languageSummary}</span>
                      <span><strong>Time zone</strong>{timezone}</span>
                      <span><strong>Agent character</strong>{agentCharacterSummary}</span>
                      <span><strong>Instructions</strong>{instructionSummary}</span>
                      <span><strong>Knowledge</strong>{selectedKnowledgeBases.join(', ') || 'No sources selected'}</span>
                      <span><strong>Actions</strong>{selectedActions.join(', ') || 'No actions selected'}</span>
                      <span><strong>Channel</strong>{channelSummary}</span>
                      <span><strong>Guardrails</strong>{[...draft.security, ...customRules].join(', ')}</span>
                    </div>
                    <div className="eva-next-step-block" aria-label="Suggested next steps">
                      <div className="eva-next-step-block__header">
                        <span>What would you like to add next?</span>
                      </div>
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
                    </div>
                  </div>
                  <div className="eva-dialogue__actions">
                    <Button onClick={createDraftAgent}>
                      <Icon name="sparkle" weight="bold" size="sm" />
                      Complete create agent
                    </Button>
                  </div>
                </AiResponseMessage>
                {renderUserPromptForStep('review')}
              </>
            )}
                </section>
              )}
              {showBuildFlow && (
                <section className="eva-first-interface__chat eva-first-interface__chat--sticky" aria-label="Talk to Eva">
                  <AiFooter
                    className="eva-ai-footer"
                    fillContainer
                    onSend={guidanceVisible ? handleWaterfallFollowup : handleSend}
                    processing={false}
                    disabled={evaThinking || waterfallThinking}
                    placeholder={guidanceVisible || orchestrationSuggested ? 'Tell Eva what to adjust or add...' : 'Type with Eva. Try: Create an AI agent for customer onboarding...'}
                    suggestions={[]}
                    voiceActive={voiceActive}
                    onVoiceToggle={() => setVoiceActive(prev => !prev)}
                  />
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
                  <Icon name="list-menu" weight="bold" size="sm" />
                  <h2>Progress</h2>
                </div>
                <ol className="eva-generation-progress">
                  {generationProgressSteps.map(step => (
                    <li
                      key={step.label}
                      className={`eva-generation-progress__item eva-generation-progress__item--${step.status}`}
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
                    </li>
                  ))}
                </ol>
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
                <div className="eva-side-card__header">
                  <Icon name="apps" weight="bold" size="sm" />
                  <h2>Context</h2>
                </div>
                {evaThinking ? (
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
                ) : (
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
                )}
              </section>
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
          <section className={`eva-first-interface__chat${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface__chat--sticky' : ''}`} aria-label="Talk to Eva">
            {!guidanceVisible && !evaThinking && <div className="eva-chat-spacer" aria-hidden />}
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={guidanceVisible ? handleWaterfallFollowup : handleSend}
              processing={false}
              disabled={evaThinking || waterfallThinking}
              placeholder={guidanceVisible || orchestrationSuggested ? 'Tell Eva what to adjust or add...' : 'Type with Eva. Try: Create an AI agent for customer onboarding...'}
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
