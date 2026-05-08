import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import {
  AccordionGroup,
  AccordionItem,
  AiFooter,
  AiPromptButton,
  AiResponseMessage,
  AiUserMessage,
  Badge,
  Button,
  Dropdown,
  Input,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Toggle,
} from '../../components/shared';
import { Icon } from '../../icons';
import { optimizeInstructions, sendEvaChat } from '../../api/ciscoAi';
import { formatRelative } from '../../pages/knowledge/utils';
import { EVA_TEMPLATES } from './evaTemplates';
import {
  EVA_CANVAS_AGENTS_PATH,
  EVA_CANVAS_DASHBOARD_PATH,
  EVA_CANVAS_ORIGIN_PATH_KEY,
  EVA_CANVAS_PATHS,
} from './EvaCanvasOverlay';
import type { EvaAgentDraft, EvaFieldSuggestion, EvaTemplateId } from './types';
import {
  FIELD_SUGGESTION_RESPONSE_RULES,
  extractFieldSuggestionAndProse,
  getFieldSuggestionLabel,
} from './evaSuggestion';
import {
  CHANNEL_PHONE_NUMBER_OPTIONS,
  DIGITAL_CHANNEL_DETAILS,
  DIGITAL_CHANNEL_OPTIONS,
  EVA_ACTION_ROWS,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_PLANNING_ROWS,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  INSTRUCTION_EXAMPLES,
  PROFILE_LANGUAGE_OPTIONS,
  PROFILE_TIMEZONE_OPTIONS,
  PROFILE_VOICE_OPTIONS,
  STARTER_PROMPTS,
  buildInstructionPrompt,
  buildWelcomeMessage,
  readEvaSessionState,
  sensitivityToValue,
  summarizeInstructionPrompt,
  valueToSensitivity,
  type EvaChannelType,
  type EvaDigitalChannel,
  type EvaDirection,
  type EvaEnforcement,
  type EvaSecurityTier,
  type EvaSensitivity,
  type EvaSessionState,
} from './evaFormConfig';

const gradient = 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass-light))';
const initialTemplateDraft: EvaAgentDraft = EVA_TEMPLATES[0].draft;

/* System prompt for the Cisco LLM fallback in the form-based variation.
   Same voice as the chat-based Eva, but explicitly nudges the model to
   recommend a starter template by name when the user describes a real
   agent so the form waterfall stays the right next step for them.

   The "options" JSON block is parsed by `extractFollowupsAndProse`
   below — when present we strip it from the prose and render the items
   as clickable follow-up chips under Eva's reply. Each option must
   include the template's domain keyword so a click trips the
   deterministic template-router in `handlePromptSubmit` and launches
   the form waterfall. */
const FORM_BUILDER_EVA_SYSTEM_PROMPT = `You are Eva, a conversational AI assistant inside Webex AI Agent Studio's form-based agent builder. You help product designers and admins design AI agents — defining purpose, knowledge sources, available actions, security policies, voice, and language settings.

Available starter templates (and the trigger keywords that launch the form waterfall): Customer support (keyword: "support"), Knowledge assistant (keywords: "healthcare", "reception"), Workflow automation (keywords: "IT", "ticket", "helpdesk"), Policy compliance (keyword: "compliance"), Sales enablement (keyword: "sales").

Guidelines:
- Keep replies concise (2–4 sentences). Be specific and actionable.
- When the user describes an agent that fits one of the templates, recommend that template AND offer 3–4 concrete variations as clickable options. Each option's wording MUST contain the template's trigger keyword so clicking it launches the form waterfall.
- Format the options as a JSON code block at the very end of your reply, like this:
\`\`\`json
{ "options": ["Customer support agent for insurance claims", "Customer support agent for policy questions", "Customer support agent for appointment scheduling"] }
\`\`\`
- Each option must be under 8 words and read naturally as a user message.
- Do NOT include the JSON block when you are just answering a question, debating trade-offs, or chitchatting. Only emit it when you are recommending a template.
- For pure questions ("what's the difference between X and Y", "how do guardrails work"), just answer directly with no JSON.
- Never invent UI commands or features. If you're not sure how something works in the product, say so.
- Stay in scope. If the user asks about anything unrelated to designing AI agents in this product, politely steer back.`;

/* Context-aware system prompt for the docked side-panel mini Eva
   that lives next to the generated form (waterfall + complete
   phases). Once the user has picked a starter template the form
   builder shows their full agent draft on the left rail; questions
   they type into the mini Eva are almost always about THAT draft —
   "make the welcome message friendlier", "what should I add for
   knowledge?", "tighten the PII guardrail". The system prompt embeds
   the live draft so Eva can ground answers in the actual configured
   values rather than handing back generic advice.

   We deliberately don't ask for the JSON `options` block here — at
   this point the user has already committed to a template and is
   refining it. Plain-prose suggestions can be copied directly into
   the form's fields by hand. */
function buildFormBuilderAssistantSystemPrompt(args: {
  isGenerating: boolean;
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
  const phaseHint = args.isGenerating
    ? 'Eva is currently still drafting the form. The user can preview but most fields are filling in.'
    : 'The form is fully drafted and the user is reviewing/adjusting it.';
  return `You are Eva, a conversational AI assistant inside Webex AI Agent Studio's form-based agent builder. The user has already chosen a starter template and the form is being drafted on the left side of the page. The user is now refining the agent and asking you for help.

${phaseHint}

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
- Recommend specific changes ("make the welcome message warmer by mentioning their name and the channel") rather than abstract advice.
- Don't pretend you can change fields for the user — point them to the right form section (Profile / Channels / Instructions / Knowledge / Actions / Security / Review).
- If the user asks about a different starter template or wants to start over, suggest they click "Create new agent" in the header rather than typing it as a free-form question.
- Stay in scope: this agent's design only.

${FIELD_SUGGESTION_RESPONSE_RULES}`;
}

interface FormBuilderChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /* Clickable variations Eva attached to a template suggestion. Wired
     into AiResponseMessage's `followups` prop so each one renders as a
     chip under the reply; clicking calls handlePromptSubmit so the
     deterministic template router can pick it up. */
  followups?: string[];
  suggestion?: EvaFieldSuggestion;
  suggestionAccepted?: boolean;
}

/* Pulls a fenced JSON `options` array out of an LLM reply and returns
   the prose stripped of that block. Returns just the prose if no valid
   block is present so plain Q&A replies render unchanged. */
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

const FORM_SECTION_IDS = [
  'profile',
  'channels',
  'instructions',
  'knowledge',
  'actions',
  'security',
  'review',
] as const;

const REVIEW_FOLLOW_UP_PROMPTS = [
  'Include a guide on filing a claim',
  'Add tips for choosing the right insurance plan',
  'Explain the deductible and co-pay concepts',
  'Provide updates on the process of ongoing claims',
  'Create a FAQ on common policy terms',
];

const PLANNING_TICK_MS = 560;
const SECTION_REVEAL_MS = 320;

type FormBuilderPhase = 'landing' | 'planning' | 'waterfall' | 'complete';

export default function EvaFormBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addAgent, aiEngines, setIsCreateModalOpen, showToast } = useApp();
  const { setVariation } = useDesignVariation();

  const restoredRef = useRef<EvaSessionState | null>(null);
  if (restoredRef.current === null) {
    restoredRef.current = readEvaSessionState();
  }
  const restored = restoredRef.current;

  const [draft, setDraft] = useState<EvaAgentDraft>(restored?.draft ?? initialTemplateDraft);
  const [agentName, setAgentName] = useState(restored?.agentName ?? initialTemplateDraft.name);
  const [agentDescription, setAgentDescription] = useState(
    restored?.agentDescription ?? initialTemplateDraft.description,
  );
  const [avatarUrl, setAvatarUrl] = useState(
    restored?.avatarUrl ?? 'https://us.webexbotbuilder.com/static/assets/i...',
  );
  const [timezone, setTimezone] = useState(restored?.timezone ?? 'Europe/London');
  const [aiEngine, setAiEngine] = useState(restored?.aiEngine ?? 'Webex AI Pro 1.0');
  const [welcomeMessage, setWelcomeMessage] = useState(
    restored?.welcomeMessage ??
      'Hi, I am Eva. I can help answer questions, guide next steps, and connect you with the right support path.',
  );
  const [instructionPrompt, setInstructionPrompt] = useState(
    restored?.instructionPrompt ?? buildInstructionPrompt(initialTemplateDraft),
  );
  const [showInstructionExamples, setShowInstructionExamples] = useState(false);
  const [optimizingInstructions, setOptimizingInstructions] = useState(false);
  const [optimizeAccepted, setOptimizeAccepted] = useState(restored?.optimizeAccepted ?? false);
  const [preOptimizeText, setPreOptimizeText] = useState(restored?.preOptimizeText ?? '');
  const [optimizeSummary, setOptimizeSummary] = useState<{
    changes: string[];
    reasoning: string[];
  }>(restored?.optimizeSummary ?? { changes: [], reasoning: [] });
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>(
    restored?.selectedKnowledgeBases ?? initialTemplateDraft.knowledgeBases.slice(0, 2).map(kb => kb.name),
  );
  const [selectedActions, setSelectedActions] = useState<string[]>(
    restored?.selectedActions ?? initialTemplateDraft.actions.slice(0, 2),
  );
  const [securityTier, setSecurityTier] = useState<EvaSecurityTier>(
    restored?.securityTier ?? 'standard',
  );
  const [channelType, setChannelType] = useState<EvaChannelType>(
    restored?.channelType ?? 'digital',
  );
  const [digitalChannel, setDigitalChannel] = useState<EvaDigitalChannel>(
    restored?.digitalChannel ?? 'chat',
  );
  const [digitalChannelAddress, setDigitalChannelAddress] = useState(
    restored?.digitalChannelAddress ?? '',
  );
  const [channelPhoneNumber, setChannelPhoneNumber] = useState(
    restored?.channelPhoneNumber ?? CHANNEL_PHONE_NUMBER_OPTIONS[0].value,
  );
  const [standardGuardrails, setStandardGuardrails] = useState(
    restored?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS,
  );
  const [advancedGuardrailGroups, setAdvancedGuardrailGroups] = useState(
    restored?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS,
  );
  const [expandedAdvancedGroups, setExpandedAdvancedGroups] = useState<Set<string>>(
    () => new Set(restored?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(g => g.id)),
  );
  const [personality, setPersonality] = useState(
    restored?.personality ?? {
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: 'en-US',
      gender: 'neutral',
    },
  );
  const [customRules, setCustomRules] = useState<string[]>(restored?.customRules ?? []);
  const [selectedTemplateId, setSelectedTemplateId] = useState<EvaTemplateId | null>(
    restored?.selectedTemplateId ?? null,
  );

  const [phase, setPhase] = useState<FormBuilderPhase>('landing');
  const [planningProgress, setPlanningProgress] = useState(0);
  const [revealedSections, setRevealedSections] = useState(0);
  /* Indices of form sections the user has actually scrolled into view.
     Drives the right-rail Progress card's "done" check marks (see
     `generationProgressSteps` below). Populated by the IntersectionObserver
     useEffect below, never auto-set by the planning reveal timer. */
  const [visitedSections, setVisitedSections] = useState<Set<number>>(() => new Set());
  /* Index of the form section currently most prominently in view. Used to
     paint a blue active outline on that section's wrapper, mirroring the
     "active" state shown in the right-rail Progress card. */
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [voiceActive, setVoiceActive] = useState(false);
  /* Free-form chat with the Cisco LLM. The form builder's primary flow
     is a structured waterfall, but if the user asks a question that
     doesn't match a template keyword we keep them on the landing screen
     and answer inline instead of forcing them through the form. */
  const [chatMessages, setChatMessages] = useState<FormBuilderChatMessage[]>([]);
  const [chatThinking, setChatThinking] = useState(false);
  /* Once the user has sent a message we hide the 4 starter template
     cards by default. They re-appear when the user clicks the "Other
     templates" chip beside Eva's suggested follow-ups. Reset to false
     whenever a new user message is sent so the cards stay hidden until
     explicitly requested again. */
  const [showOtherTemplates, setShowOtherTemplates] = useState(false);
  /* Collapsed/expanded state for the side-panel mini Eva assistant. Mirrors
     the canvas Eva window's behavior so the user can shrink it down to just
     the header when they need more vertical space for the Progress / Summary
     / Context cards above. Starts expanded so the input is immediately
     reachable on first arrival to the Review step. */
  const [reviewAssistantCollapsed, setReviewAssistantCollapsed] = useState(false);

  const planningIntervalRef = useRef<number | null>(null);
  const planningTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (planningIntervalRef.current) window.clearInterval(planningIntervalRef.current);
    if (planningTimeoutRef.current) window.clearTimeout(planningTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'waterfall') return undefined;
    if (revealedSections >= FORM_SECTION_IDS.length) {
      setPhase('complete');
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setRevealedSections(prev => prev + 1);
    }, SECTION_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [phase, revealedSections]);

  /* Watch each rendered form section for viewport entry and (a) mark its
     index as visited once it's meaningfully on screen, and (b) maintain
     `activeSectionIndex` as the section currently most prominently in view
     (used to paint the blue active outline on that section's wrapper).
     Multiple thresholds give us live `intersectionRatio` updates as the
     user scrolls; we re-query whenever the set of rendered sections
     changes (revealedSections ticks up during planning, phase transitions). */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-form-section-index]'),
    );
    if (sections.length === 0) return undefined;

    /* Per-section visibility ratio. Lives in a closure (not React state) so
       each observer callback can read the latest values from the previous
       batch without triggering re-renders for ratio changes themselves —
       only the derived `activeSectionIndex` flows back into React. */
    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const indexAttr = entry.target.getAttribute('data-form-section-index');
          if (indexAttr === null) return;
          const idx = Number(indexAttr);
          ratios.set(idx, entry.isIntersecting ? entry.intersectionRatio : 0);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            setVisitedSections(prev => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
          }
        });

        let topIdx: number | null = null;
        let topRatio = 0;
        ratios.forEach((ratio, idx) => {
          if (ratio > topRatio) {
            topRatio = ratio;
            topIdx = idx;
          }
        });
        /* Only call setState when the active index actually changes, to
           avoid a re-render storm during scroll. */
        setActiveSectionIndex(prev => (prev === topIdx ? prev : topIdx));
      },
      { threshold: [0, 0.25, 0.4, 0.6, 0.8, 1], rootMargin: '0px 0px -20% 0px' },
    );
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [revealedSections, phase]);

  const aiEngineOptions = useMemo(
    () => aiEngines.map(engine => ({ value: engine.name, label: engine.name })),
    [aiEngines],
  );

  const profileInitials =
    agentName
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'EA';

  useEffect(() => {
    const snapshot: Partial<EvaSessionState> = {
      draft,
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
      selectedTemplateId,
    };

    try {
      const existing = window.sessionStorage.getItem(EVA_SESSION_STORAGE_KEY);
      const parsed = existing ? (JSON.parse(existing) as EvaSessionState) : null;
      const merged: EvaSessionState = {
        landingMode: parsed?.landingMode ?? 'build',
        selectedTemplateId: parsed?.selectedTemplateId ?? null,
        messages: parsed?.messages ?? [],
        guidanceVisible: parsed?.guidanceVisible ?? false,
        orchestrationSuggested: parsed?.orchestrationSuggested ?? false,
        evaStep: parsed?.evaStep ?? 'profile',
        ...parsed,
        ...snapshot,
      } as EvaSessionState;
      window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore storage failures
    }
  }, [
    selectedTemplateId,
    draft,
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
    expandedAdvancedGroups,
    personality,
    customRules,
  ]);

  const toggleKnowledgeBase = (knowledgeBase: string) => {
    setSelectedKnowledgeBases(prev =>
      prev.includes(knowledgeBase)
        ? prev.filter(item => item !== knowledgeBase)
        : [...prev, knowledgeBase],
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(item => item !== action) : [...prev, action],
    );
  };

  const toggleStandardGuardrail = (id: string) => {
    setStandardGuardrails(prev =>
      prev.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  };

  const updateStandardGuardrail = (
    id: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setStandardGuardrails(prev =>
      prev.map(item => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const toggleAdvancedGuardrail = (groupId: string, itemId: string) => {
    setAdvancedGuardrailGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map(item =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item,
              ),
            }
          : group,
      ),
    );
  };

  const updateAdvancedGuardrail = (
    groupId: string,
    itemId: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setAdvancedGuardrailGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map(item =>
                item.id === itemId ? { ...item, [key]: value } : item,
              ),
            }
          : group,
      ),
    );
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

  const handleOptimizeInstructions = async () => {
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

  const handleUndoOptimize = () => {
    setInstructionPrompt(preOptimizeText);
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });
    showToast('Reverted to original instructions', 'success');
  };

  const applyTemplate = (templateId: EvaTemplateId): boolean => {
    const template = EVA_TEMPLATES.find(item => item.id === templateId);
    if (!template) return false;
    setSelectedTemplateId(template.id);
    setDraft(template.draft);
    setAgentName(template.draft.name);
    setAgentDescription(template.draft.description);
    setWelcomeMessage(buildWelcomeMessage(template.draft));
    setInstructionPrompt(buildInstructionPrompt(template.draft));
    setSelectedKnowledgeBases(template.draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
    setSelectedActions(template.draft.actions.slice(0, 2));
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });
    return true;
  };

  const startPlanningWaterfall = () => {
    if (planningIntervalRef.current) window.clearInterval(planningIntervalRef.current);
    if (planningTimeoutRef.current) window.clearTimeout(planningTimeoutRef.current);

    setPhase('planning');
    setPlanningProgress(1);
    setRevealedSections(0);
    setVisitedSections(new Set());

    planningIntervalRef.current = window.setInterval(() => {
      setPlanningProgress(prev => {
        const next = Math.min(prev + 1, EVA_PLANNING_ROWS.length);
        if (next >= EVA_PLANNING_ROWS.length && planningIntervalRef.current) {
          window.clearInterval(planningIntervalRef.current);
          planningIntervalRef.current = null;
        }
        return next;
      });
    }, PLANNING_TICK_MS);

    planningTimeoutRef.current = window.setTimeout(() => {
      setPlanningProgress(EVA_PLANNING_ROWS.length);
      setPhase('waterfall');
      planningTimeoutRef.current = null;
    }, EVA_PLANNING_ROWS.length * PLANNING_TICK_MS + 320);
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

  const handlePromptSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const matched = EVA_TEMPLATES.find(template => {
      if (normalized.includes('healthcare') || normalized.includes('reception')) {
        return template.id === 'knowledge-assistant';
      }
      if (
        normalized.includes('it ') ||
        normalized.includes('helpdesk') ||
        normalized.includes('ticket')
      ) {
        return template.id === 'workflow-automation';
      }
      if (normalized.includes('policy') || normalized.includes('compliance')) {
        return template.id === 'policy-compliance';
      }
      if (normalized.includes('sales')) {
        return template.id === 'sales-enablement';
      }
      if (normalized.includes('customer') || normalized.includes('support')) {
        return template.id === 'customer-support';
      }
      return false;
    });

    if (isTemplateOptionsIntent(normalized)) {
      setChatMessages(prev => [
        ...prev,
        { role: 'user', text: trimmed },
        {
          role: 'assistant',
          text: 'Here are the starter templates you can use. Choose one of these options to start the form setup.',
          followups: STARTER_PROMPTS.slice(0, 4).map(prompt => prompt.prompt),
        },
      ]);
      setChatThinking(false);
      setShowOtherTemplates(false);
      return;
    }

    /* Deterministic fast path: if the user clearly described an agent
       we know how to build, kick off the form waterfall immediately and
       wipe any prior free-chat thread so the new build starts clean. */
    if (matched) {
      setChatMessages([]);
      applyTemplate(matched.id);
      setUserPrompt(trimmed);
      startPlanningWaterfall();
      return;
    }

    /* Free-chat path: nothing matched, so route the message to the
       Cisco LLM and stay on the landing screen. The chat thread renders
       above the composer so the user can keep asking follow-ups without
       being forced into a form they didn't ask for. */
    const historySnapshot = chatMessages;
    setChatMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setChatThinking(true);
    /* If the user is typing again after viewing the template cards via
       "Other templates", collapse the cards back so the conversation
       stays the focal point. */
    setShowOtherTemplates(false);

    void (async () => {
      try {
        const reply = await sendEvaChat([
          { role: 'system', content: FORM_BUILDER_EVA_SYSTEM_PROMPT },
          ...historySnapshot.map(message => ({ role: message.role, content: message.text })),
          { role: 'user', content: trimmed },
        ]);
        const { prose, followups } = extractFollowupsAndProse(reply);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text:
              prose ||
              'I\u2019m not sure how to respond to that yet \u2014 try rephrasing, or describe the agent you want to build to launch the form setup.',
            followups,
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `I couldn\u2019t reach the assistant just now (${message}). Check that CISCO_AI_AUTH and CISCO_AI_APPKEY are set in the dev server environment and try again.`,
          },
        ]);
      } finally {
        setChatThinking(false);
      }
    })();
  };

  const handleTemplateClick = (templateId: EvaTemplateId, prompt: string) => {
    setChatMessages([]);
    setShowOtherTemplates(false);
    applyTemplate(templateId);
    setUserPrompt(prompt);
    startPlanningWaterfall();
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
        break;
    }

    setChatMessages(prev => prev.map((message, index) => (
      index === messageIndex ? { ...message, suggestionAccepted: true } : message
    )));
    showToast(`Updated the ${getFieldSuggestionLabel(suggestion.field)}.`, 'success');
  };

  const requestAnotherFieldSuggestion = (suggestion: EvaFieldSuggestion) => {
    const label = getFieldSuggestionLabel(suggestion.field);
    handleAssistantSend(
      `Try another option for the ${label}. Original request: ${suggestion.originalRequest}`,
    );
  };

  /* Send handler for the docked side-panel mini Eva that's visible
     during waterfall + complete phases. Unlike `handlePromptSubmit`
     (the landing composer), this one does NOT try to match template
     keywords — the user is already in a templated flow, so a free-typed
     "customer support agent for X" should not blow away the in-progress
     draft and restart the planning waterfall. Instead we always route
     to the Cisco LLM with a context-aware system prompt that embeds the
     live draft, push both the user message and Eva's reply onto
     `chatMessages`, and the mini Eva thread renders them inline. */
  const handleAssistantSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const historySnapshot = chatMessages;
    setChatMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setChatThinking(true);

    void (async () => {
      try {
        const systemPrompt = buildFormBuilderAssistantSystemPrompt({
          isGenerating,
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
        const reply = await sendEvaChat([
          { role: 'system', content: systemPrompt },
          ...historySnapshot.map(message => ({ role: message.role, content: message.text })),
          { role: 'user', content: trimmed },
        ]);
        const { prose, suggestion } = extractFieldSuggestionAndProse(reply, trimmed);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text:
              prose ||
              'I don\u2019t have a suggestion for that yet \u2014 could you give me a bit more context about what you want to change?',
            suggestion,
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `I couldn\u2019t reach the assistant just now (${message}). Check that CISCO_AI_AUTH and CISCO_AI_APPKEY are set in the dev server environment and try again.`,
          },
        ]);
      } finally {
        setChatThinking(false);
      }
    })();
  };

  /* Sends the user back to the landing prompt screen so they can start a new
     agent flow. The current draft is left in sessionStorage (the auto-persist
     effect already mirrors every state change), so the user can pick it up
     again on a future visit. We also clear any in-flight planning timers
     so the previous waterfall doesn't continue ticking under the new screen. */
  const handleStartNewAgent = () => {
    if (planningIntervalRef.current) {
      window.clearInterval(planningIntervalRef.current);
      planningIntervalRef.current = null;
    }
    if (planningTimeoutRef.current) {
      window.clearTimeout(planningTimeoutRef.current);
      planningTimeoutRef.current = null;
    }
    setPhase('landing');
    setUserPrompt('');
    setPlanningProgress(0);
    setRevealedSections(0);
    setVisitedSections(new Set());
    setActiveSectionIndex(null);
    setChatMessages([]);
    setChatThinking(false);
    setShowOtherTemplates(false);
  };

  const handleOpenCanvas = () => {
    /* Remember the route the user is on so the canvas's "Chat view"
       button can return them here. Form-based variation typically lives
       on /agents, but tracking the origin keeps the close-route logic
       consistent across all variations and survives any future routing
       changes. */
    try {
      if (location.pathname && !EVA_CANVAS_PATHS.includes(location.pathname)) {
        window.sessionStorage.setItem(EVA_CANVAS_ORIGIN_PATH_KEY, location.pathname);
      }
    } catch {
      /* sessionStorage unavailable — falls back to /agents on close. */
    }
    /* Pick the canvas path that sits under the same parent as the
       user's current page so the sidebar selection doesn't jump while
       the canvas is open. */
    const canvasPath = location.pathname === '/'
      ? EVA_CANVAS_DASHBOARD_PATH
      : EVA_CANVAS_AGENTS_PATH;
    navigate(canvasPath);
  };

  /* "Start from scratch" landing button — opens the global Create
     Agent modal so the user can name a fresh agent and configure it
     without going through Eva's template waterfall. Mirrors the same
     entry point used by the +Create Agent buttons elsewhere. */
  const handleStartFromScratch = () => {
    setIsCreateModalOpen(true);
  };

  /* "Existing agent" landing button — switches the design variation
     to the dashboard (table) view so the user lands on the existing
     AI Agent landing page that lists their agents in a table. The
     route stays on /agents; the variation context already swaps the
     rendered component (see Agents.tsx). */
  const handleSwitchToExistingAgents = () => {
    setVariation('dashboard');
  };

  /* Label and sentinel for the extra chip we append after Eva's
     follow-up options. We match on the visible label string in the
     click handler — the system prompt instructs the LLM to generate
     template-keyword variants, so a literal "Other templates" string
     from the model is extremely unlikely to collide. */
  const OTHER_TEMPLATES_LABEL = 'Other templates';

  /* Followup chip click handler. Clicking the "Other templates" chip
     reveals the 4 starter cards inline; everything else is a real user
     message that flows back through the deterministic / LLM router so
     a click is identical to typing the option text. */
  const handleFollowupClick = (option: string) => {
    if (option === OTHER_TEMPLATES_LABEL) {
      setShowOtherTemplates(true);
      return;
    }
    handlePromptSubmit(option);
  };

  const createDraftAgent = () => {
    if (!agentName.trim()) {
      showToast('Add an agent name before creating', 'error');
      return;
    }
    const agent = addAgent({
      name: agentName.trim(),
      description: agentDescription,
      gradient,
      status: 'Ready to Publish',
      knowledgeBases: selectedKnowledgeBases,
    });
    showToast(`Created "${agentName}" as a draft agent.`, 'success');
    navigate(`/agents/${agent.id}/configure?section=Profile`);
  };

  const selectedDigitalChannel =
    DIGITAL_CHANNEL_OPTIONS.find(option => option.value === digitalChannel) ??
    DIGITAL_CHANNEL_OPTIONS[0];
  const selectedDigitalChannelDetails = DIGITAL_CHANNEL_DETAILS[digitalChannel];
  const channelDestination =
    channelType === 'digital' ? digitalChannelAddress.trim() : channelPhoneNumber;
  const channelSummary =
    channelType === 'digital'
      ? `${selectedDigitalChannel.label} · ${channelDestination || 'Add address or number'}`
      : `Voice · ${channelPhoneNumber}`;
  const selectedLanguage = PROFILE_LANGUAGE_OPTIONS.find(o => o.value === personality.language);
  const selectedVoice = PROFILE_VOICE_OPTIONS.find(o => o.value === personality.voice);
  const languageSummary = selectedLanguage?.label ?? personality.language;
  const agentCharacterSummary = `${selectedVoice?.label ?? personality.voice} voice · ${
    personality.gender === 'neutral' ? 'Neutral' : personality.gender
  } character`;
  const instructionSummary = summarizeInstructionPrompt(instructionPrompt);
  /* Mirrors the form's actual configuration sections (driven by
     `revealedSections` and gated 1:1 with each <AccordionItem> below).
     A step is only marked `done` once the user has actually scrolled
     through that section (tracked in `visitedSections` via the
     IntersectionObserver in the useEffect below). The currently in-flight
     section reads as `active`: while planning, that's the latest
     just-revealed section; after `phase === 'complete'`, that's the first
     not-yet-visited section. Everything else is `queued`. */
  const formProgressEntries: Array<{ label: string; detail: string }> = [
    { label: '1. Profile', detail: `${agentName} · ${languageSummary}` },
    { label: '2. Channel', detail: channelSummary },
    { label: '3. Instruction', detail: instructionSummary },
    {
      label: '4. Knowledge',
      detail: `${selectedKnowledgeBases.length} source${selectedKnowledgeBases.length === 1 ? '' : 's'} selected`,
    },
    {
      label: '5. Action',
      detail: `${selectedActions.length} action${selectedActions.length === 1 ? '' : 's'} enabled`,
    },
    {
      label: '6. Guardrails',
      detail: `Standard ${standardGuardrails.filter(g => g.enabled).length} · Advanced ${advancedGuardrailGroups.reduce((sum, g) => sum + g.items.filter(i => i.enabled).length, 0)}`,
    },
    { label: '7. Review', detail: 'Final configuration check' },
  ];
  const firstUnvisitedIndex = formProgressEntries.findIndex(
    (_, index) => !visitedSections.has(index),
  );
  /* While Eva is still drafting (planning + waterfall), only show the items
     that have been revealed so far so the Progress list grows in lockstep
     with the form below — same dynamic-reveal pattern EvaChatExperience uses
     for its right-rail Progress card. We always show at least one entry so
     the card doesn't look empty during the brief planning frame. The newest
     item reads as `active` (currently being drafted, with the pulse + text
     shimmer); prior items stay `queued` (neutral) so they don't flash through
     the green-check `done` state on every step. The done/checked transition
     happens only once the user actually visits each section after the form
     finishes generating. */
  const isGenerating = phase === 'planning' || phase === 'waterfall';
  const visibleProgressCount = isGenerating
    ? Math.max(1, Math.min(formProgressEntries.length, revealedSections))
    : formProgressEntries.length;
  const generationProgressSteps = formProgressEntries
    .slice(0, visibleProgressCount)
    .map((entry, index) => {
      let status: 'done' | 'active' | 'queued';
      if (isGenerating) {
        status = index === visibleProgressCount - 1 ? 'active' : 'queued';
      } else if (visitedSections.has(index)) {
        status = 'done';
      } else if (phase === 'complete') {
        status = index === firstUnvisitedIndex ? 'active' : 'queued';
      } else {
        status = revealedSections === index + 1 ? 'active' : 'queued';
      }
      return { ...entry, status };
    });
  /* Mirror the chat-experience side panel: toggle list per row instead of a
     comma-joined string. Clicking the inline toggle enables/disables the item
     in-place (same `toggleAction` / `toggleKnowledgeBase` handlers used inside
     the form below), and the edit pencil scrolls to the corresponding
     accordion section so they stay in lockstep. */
  const selectedActionSet = new Set(selectedActions);
  const selectedKnowledgeBaseSet = new Set(selectedKnowledgeBases);
  const sidePanelActions = EVA_ACTION_ROWS.map(action => ({
    id: action.id,
    name: action.name,
    enabled: selectedActionSet.has(action.name),
  }));
  const sidePanelKnowledgeBases = draft.knowledgeBases.map(source => ({
    id: source.name,
    name: source.name,
    enabled: selectedKnowledgeBaseSet.has(source.name),
  }));
  /* Side-card "thinking" flags mirror the shimmer behavior used by
     EvaChatExperience: each card shows skeleton bars until the form section
     that feeds it has been revealed by the waterfall reveal effect, so
     content streams in instead of popping in fully formed.
       - Summary needs Profile (section 0) to populate name/description.
       - Context needs Knowledge (3) + Actions (4) + Profile (0) to populate
         the three subsections; gating on the latest (Actions) is enough. */
  const summaryThinking = revealedSections < 1;
  const contextThinking = revealedSections < 5;
  const scrollToFormSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  /* Builds the wrapper className for each form section. The base class drops
     in default styling (rounded corner, transition); the `--active` modifier
     applies the blue active outline when this section is the one currently
     most prominently in view. */
  const formSectionWrapperClass = (index: number) =>
    `eva-form-section-wrapper${activeSectionIndex === index ? ' eva-form-section-wrapper--active' : ''}`;

  const standardEnabledCount = standardGuardrails.filter(g => g.enabled).length;
  const advancedEnabledCount = advancedGuardrailGroups.reduce(
    (sum, g) => sum + g.items.filter(i => i.enabled).length,
    0,
  );
  const advancedTotalCount = advancedGuardrailGroups.reduce(
    (sum, g) => sum + g.items.length,
    0,
  );

  return (
    <div
      className={`primary-content eva-form-builder eva-form-builder--phase-${phase}${
        phase === 'landing' ? ' eva-agents-landing eva-agents-landing--flush' : ''
      }`}
    >
      {phase === 'landing' ? (
        <div className="eva-first-interface eva-first-interface--landing eva-form-builder__landing-shell">
          {chatMessages.length === 0 && !chatThinking && (
            <section
              className="eva-first-interface__hero"
              aria-labelledby="eva-form-builder-hero"
            >
              <h1 id="eva-form-builder-hero">Hi I&rsquo;m Eva!</h1>
              <h2>Build smart agent anytime, anywhere.</h2>
              <p>
                Describe the business need, persona, tools, data, routing, or guardrails. I&rsquo;ll
                plan the setup and lay out every section as a form for you to review.
              </p>
            </section>
          )}

          {(chatMessages.length > 0 || chatThinking) && (
            <section
              className="eva-dialogue eva-form-builder__landing-chat"
              aria-label="Eva conversation"
              aria-live="polite"
            >
              {/* Free-chat transcript: rendered when the user asks a
                  question that didn't match any deterministic template
                  keyword. Stays on the landing screen so they can keep
                  asking, and only flips to the form waterfall when they
                  actually describe an agent. */}
              {chatMessages.map((message, index) => {
                if (message.role === 'user') {
                  return <AiUserMessage key={`form-chat-${index}`} text={message.text} />;
                }
                /* When Eva attached follow-up options to a reply, append
                   an "Other templates" chip so the user can pivot to
                   the full starter-card grid even after they've gone
                   down a specific template branch. */
                const baseFollowups = message.followups ?? [];
                const followups = baseFollowups.length > 0
                  ? [...baseFollowups, OTHER_TEMPLATES_LABEL]
                  : baseFollowups;
                return (
                  <AiResponseMessage
                    key={`form-chat-${index}`}
                    className="eva-ai-response"
                    showActions={false}
                    assistantName="Eva"
                    content={message.text}
                    followups={followups}
                    onFollowup={handleFollowupClick}
                  />
                );
              })}
              {chatThinking && (
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

          {/* Initial landing only: put the composer above the four
              template tiles so the typing surface is the primary CTA.
              Once the user starts chatting, the composer renders again
              at the bottom of the landing state below. */}
          {chatMessages.length === 0 && !chatThinking && (
          <div
            className="eva-form-builder__landing-composer eva-form-builder__landing-composer--initial"
            aria-label="Talk to Eva"
          >
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handlePromptSubmit}
              onVoiceToggle={() => setVoiceActive(active => !active)}
              processing={false}
              disabled={chatThinking}
              placeholder="Type with Eva. Try: Create an AI agent for customer onboarding..."
              suggestions={[]}
              voiceActive={voiceActive}
            />
          </div>
          )}

          {/* Starter cards: shown on the initial landing screen, hidden
              the moment the user starts a conversation, and revealed
              again only when they explicitly click the "Other
              templates" follow-up chip. Hidden during Eva's thinking
              state so the focus stays on the live response. */}
          {!chatThinking && (chatMessages.length === 0 || showOtherTemplates) && (
            <>
              {showOtherTemplates && chatMessages.length > 0 && (
                <p
                  className="eva-form-builder__landing-prompt-encouragement"
                  aria-live="polite"
                >
                  Pick one of the starter templates below, or keep chatting with Eva.
                </p>
              )}
              <section className="eva-prompt-examples" aria-label="Quick templates">
                {STARTER_PROMPTS.slice(0, 4).map(prompt => (
                  <button
                    key={prompt.templateId}
                    type="button"
                    className="eva-prompt-card"
                    onClick={() => handleTemplateClick(prompt.templateId, prompt.prompt)}
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

              {/* Secondary entry points for users who don't want to use
                  Eva's template flow at all — either pick up an agent
                  they've already created, or open the bare Create Agent
                  modal to start with no preset. The divider's "Or" label
                  visually separates these from the templated path above. */}
              <div className="eva-form-builder__landing-divider" role="separator" aria-label="or">
                <span className="eva-form-builder__landing-divider-line" aria-hidden="true" />
                <span className="eva-form-builder__landing-divider-text">Or</span>
                <span className="eva-form-builder__landing-divider-line" aria-hidden="true" />
              </div>

              <div className="eva-form-builder__landing-secondary-actions">
                <Button variant="secondary" onClick={handleSwitchToExistingAgents}>
                  <Icon name="user" weight="bold" size="sm" />
                  Existing agent
                </Button>

                <Button variant="secondary" onClick={handleStartFromScratch}>
                  <Icon name="plus" weight="bold" size="sm" />
                  Start from scratch
                </Button>
              </div>
            </>
          )}

          {/* Chat/thinking landing state: keep the composer at the bottom
              like the original free-chat layout. */}
          {(chatMessages.length > 0 || chatThinking) && (
          <div
            className="eva-form-builder__landing-composer eva-form-builder__landing-composer--bottom"
            aria-label="Talk to Eva"
          >
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handlePromptSubmit}
              onVoiceToggle={() => setVoiceActive(active => !active)}
              processing={false}
              disabled={chatThinking}
              placeholder="Type with Eva. Try: Create an AI agent for customer onboarding..."
              suggestions={[]}
              voiceActive={voiceActive}
            />
          </div>
          )}
        </div>
      ) : (
        <div className="page-header eva-form-builder__compact-header">
          <div>
            <span className="eva-shell__eyebrow">
              <Icon name="sparkle" weight="bold" size="sm" />
              Form-based agent setup
            </span>
            <h1 className="page-title">Create AI Agent</h1>
            <p className="page-subtitle">
              Eva drafted the configuration based on your request. Review and adjust each section
              as needed.
            </p>
          </div>
          <div className="eva-form-builder__compact-header-actions">
            <Button variant="secondary" size="sm" onClick={handleOpenCanvas}>
              <Icon name="workflow-deployments" weight="bold" size="sm" />
              Canvas view
            </Button>
            <Button variant="secondary" size="sm" onClick={handleStartNewAgent}>
              <Icon name="plus" weight="bold" size="sm" />
              Create new agent
            </Button>
          </div>
        </div>
      )}

      {phase !== 'landing' && (
      <div className="eva-form-builder__generation-layout">
      <div className="secondary-content eva-form-builder__main-column">
        {(phase === 'planning' || userPrompt) && (
        <section className="eva-form-builder__waterfall" aria-live="polite">
          {phase === 'planning' && (
            <AiResponseMessage
              assistantName="Eva"
              assistantState="processing"
              content="Planning the agent setup based on your request..."
            >
              <div className="eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning eva-waterfall-status--dynamic">
                {EVA_PLANNING_ROWS.slice(0, planningProgress).map((item, index) => {
                  const isLastRow = index === planningProgress - 1;
                  const isComplete = planningProgress >= EVA_PLANNING_ROWS.length || !isLastRow;
                  const status = isComplete ? 'done' : 'active';
                  const iconName = status === 'done' ? 'check-circle-filled' : item.icon;
                  return (
                    <div
                      key={`${item.title}-${index}`}
                      className={`eva-waterfall-status__row eva-waterfall-status__row--${status}`}
                    >
                      <Icon name={iconName} weight="bold" size="sm" />
                      <span>
                        <strong>{item.title}</strong>
                        {item.text(draft, draft.name, userPrompt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AiResponseMessage>
          )}

          {(phase === 'waterfall' || phase === 'complete') && (
            <AiResponseMessage
              assistantName="Eva"
              content={
                phase === 'complete'
                  ? 'All recommended sections are ready. Adjust any details and create the agent when you are happy with the setup.'
                  : "Plan complete. I'm assembling the form below — sections will appear as I prepare each one."
              }
            >
              <AccordionGroup type="stack" className="eva-planning-trace-group">
                <AccordionItem
                  title={
                    <span className="eva-planning-trace__title">
                      <Icon name="sparkle" weight="bold" size="sm" />
                      View Eva&rsquo;s thinking trace
                    </span>
                  }
                  size="small"
                >
                  <div className="eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning">
                    {EVA_PLANNING_ROWS.map((item, index) => (
                      <div
                        key={`trace-${item.title}-${index}`}
                        className="eva-waterfall-status__row eva-waterfall-status__row--done"
                      >
                        <Icon name="check-circle-filled" weight="bold" size="sm" />
                        <span>
                          <strong>{item.title}</strong>
                          {item.text(draft, draft.name, userPrompt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </AccordionGroup>
            </AiResponseMessage>
          )}
        </section>
        )}

        <AccordionGroup type="stack" className="eva-form-builder__sections">
          {revealedSections > 0 && (
          <div id="form-section-profile" data-form-section-index="0" className={formSectionWrapperClass(0)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="document" weight="bold" size="sm" />
                <strong>Profile</strong>
                <span className="eva-form-section__hint">
                  {agentName} · {timezone} · {languageSummary}
                </span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              <div className="eva-config-grid eva-config-grid--responsive-two">
                <Input
                  label="Agent name"
                  required
                  value={agentName}
                  onChange={event => setAgentName(event.target.value)}
                />
                <div className="v2-profile-avatar-row">
                  <div className="v2-profile-avatar-preview">
                    <div
                      className="agent-avatar"
                      style={{ background: gradient, width: 48, height: 48, fontSize: 16 }}
                    >
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
              <Textarea
                label="Description"
                value={agentDescription}
                onChange={event => setAgentDescription(event.target.value)}
                placeholder="Describe what this agent does"
                rows={3}
              />
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
                  placeholder="Enter a friendly greeting"
                  rows={4}
                />
              </div>
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 1 && (
          <div id="form-section-channels" data-form-section-index="1" className={formSectionWrapperClass(1)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="chat" weight="bold" size="sm" />
                <strong>Channels</strong>
                <span className="eva-form-section__hint">{channelSummary}</span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              <div
                className="eva-security-tier-selector eva-channel-type-selector"
                role="radiogroup"
                aria-label="Channel type"
              >
                <button
                  type="button"
                  className={`eva-security-tier-card${
                    channelType === 'digital' ? ' eva-security-tier-card--selected' : ''
                  }`}
                  onClick={() => setChannelType('digital')}
                  aria-pressed={channelType === 'digital'}
                >
                  <Icon name="chat" weight="bold" size={24} />
                  <span>
                    <strong>Digital</strong>
                    <small>
                      Use messaging and digital entry points for customer conversations.
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className={`eva-security-tier-card${
                    channelType === 'voice' ? ' eva-security-tier-card--selected' : ''
                  }`}
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
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 2 && (
          <div id="form-section-instructions" data-form-section-index="2" className={formSectionWrapperClass(2)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="document-create" weight="bold" size="sm" />
                <strong>Instructions</strong>
                <span className="eva-form-section__hint">
                  {instructionSummary.slice(0, 90)}
                </span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              <div className="eva-instructions-layout">
                <div className="instructions-editor">
                  <div className="instructions-toolbar">
                    <div className="instructions-toolbar-left">
                      <button type="button" className="instructions-toolbar-btn" aria-label="Bold">
                        <Icon name="bold" weight="bold" size={16} />
                      </button>
                      <button type="button" className="instructions-toolbar-btn" aria-label="Italic">
                        <Icon name="italic" weight="bold" size={16} />
                      </button>
                      <button type="button" className="instructions-toolbar-btn" aria-label="Underline">
                        <Icon name="underline" weight="bold" size={16} />
                      </button>
                      <button type="button" className="instructions-toolbar-btn" aria-label="Link">
                        <Icon name="link" weight="bold" size={16} />
                      </button>
                      <button type="button" className="instructions-toolbar-btn" aria-label="Table">
                        <Icon name="table" weight="bold" size={16} />
                      </button>
                      <span className="instructions-toolbar-divider" />
                      <button
                        type="button"
                        className="instructions-toolbar-pill"
                        onClick={() => setShowInstructionExamples(prev => !prev)}
                      >
                        <Icon name="guide" weight="bold" size={16} />
                        Example
                      </button>
                      {optimizeAccepted && (
                        <button
                          type="button"
                          className="instructions-toolbar-pill"
                          onClick={handleUndoOptimize}
                        >
                          <Icon name="undo" weight="bold" size={16} />
                          Undo
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="instructions-toolbar-pill instructions-optimize-btn"
                      onClick={handleOptimizeInstructions}
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
                      <Icon
                        name="check"
                        weight="bold"
                        size={14}
                        color="var(--mds-color-theme-text-success-normal, var(--success-color))"
                      />
                      <span>AI Generated</span>
                      <span className="instructions-ai-divider">·</span>
                      <span>Is this helpful?</span>
                      <button type="button" className="instructions-feedback-btn" aria-label="Helpful">
                        <Icon name="like" weight="bold" size={14} />
                      </button>
                      <button type="button" className="instructions-feedback-btn" aria-label="Not helpful">
                        <Icon name="dislike" weight="bold" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {optimizeAccepted && (
                <div className="eva-instruction-optimize-summary">
                  <div className="instructions-optimize-header">
                    <Icon name="sparkle" weight="bold" size={20} />
                    <h3 className="instructions-optimize-title">Optimize summary</h3>
                    <Button variant="secondary" size="sm" onClick={handleUndoOptimize}>
                      <Icon name="undo" weight="bold" size={16} />
                      Undo
                    </Button>
                  </div>
                  <div className="instructions-optimize-results">
                    <div className="optimize-results-section">
                      <h4>What's been changed:</h4>
                      <ul>
                        {optimizeSummary.changes.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="optimize-results-section">
                      <h4>Reasoning behind changes:</h4>
                      <ul>
                        {optimizeSummary.reasoning.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {showInstructionExamples && (
                <div
                  className="eva-instruction-examples"
                  aria-label="Instruction examples and tips"
                >
                  <div className="eva-instruction-examples__section">
                    <h4>Instruction examples</h4>
                    <div className="eva-instruction-examples__cards">
                      {INSTRUCTION_EXAMPLES.map(example => (
                        <article
                          key={example.title}
                          className="eva-instruction-example-card"
                        >
                          <strong>{example.title}</strong>
                          <p>
                            {example.content
                              .split('\n\n')[0]
                              .replace('#### Role & Identity\n', '')}
                          </p>
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
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 3 && (
          <div id="form-section-knowledge" data-form-section-index="3" className={formSectionWrapperClass(3)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="apps" weight="bold" size="sm" />
                <strong>Knowledge</strong>
                <span className="eva-form-section__hint">
                  {selectedKnowledgeBases.length} of {draft.knowledgeBases.length} sources selected
                </span>
              </span>
            }
            defaultExpanded
            size="large"
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
                <TableBody
                  empty={draft.knowledgeBases.length === 0}
                  emptyTitle="No recommended knowledge sources"
                >
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
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 4 && (
          <div id="form-section-actions" data-form-section-index="4" className={formSectionWrapperClass(4)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="tools" weight="bold" size="sm" />
                <strong>Actions</strong>
                <span className="eva-form-section__hint">
                  {selectedActions.length} of {EVA_ACTION_ROWS.length} actions enabled
                </span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              {/* Recommended actions and MCP tools — same shared <Table> primitive
                  used by the Knowledge step above for visual + behavioral parity. */}
              <Table aria-label="Recommended actions and MCP tools">
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
                <TableBody
                  empty={EVA_ACTION_ROWS.length === 0}
                  emptyTitle="No recommended actions"
                >
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
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 5 && (
          <div id="form-section-security" data-form-section-index="5" className={formSectionWrapperClass(5)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="shield" weight="bold" size="sm" />
                <strong>Security</strong>
                <span className="eva-form-section__hint">
                  {securityTier === 'standard'
                    ? `${standardEnabledCount}/${standardGuardrails.length} standard guardrails`
                    : `${advancedEnabledCount}/${advancedTotalCount} advanced guardrails`}
                </span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              <div className="eva-security-panel">
                <div
                  className="eva-security-tier-selector"
                  role="radiogroup"
                  aria-label="Security tier"
                >
                  <button
                    type="button"
                    className={`eva-security-tier-card${
                      securityTier === 'standard' ? ' eva-security-tier-card--selected' : ''
                    }`}
                    onClick={() => setSecurityTier('standard')}
                  >
                    <Icon name="shield" weight="bold" size={24} />
                    <span>
                      <strong>Standard guardrails</strong>
                      <small>
                        Basic protection with toxicity, harm detection, and jailbreak prevention.
                      </small>
                      <em>
                        {standardEnabledCount}/{standardGuardrails.length} enabled
                      </em>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`eva-security-tier-card${
                      securityTier === 'advanced' ? ' eva-security-tier-card--selected' : ''
                    }`}
                    onClick={() => setSecurityTier('advanced')}
                  >
                    <Icon name="secure-circle" weight="bold" size={24} />
                    <span>
                      <strong>
                        Advanced guardrails{' '}
                        <Badge variant="success" className="security-tier-badge">
                          AI Defense
                        </Badge>
                      </strong>
                      <small>
                        Comprehensive security, privacy, and safety guardrails with custom
                        profiles.
                      </small>
                      <em>
                        {advancedEnabledCount}/{advancedTotalCount} enabled
                      </em>
                    </span>
                  </button>
                </div>

                <div className="eva-security-observability">
                  <Icon name="info-circle" weight="bold" size={18} />
                  <span>
                    <strong>Observability and logging</strong>
                    Triggered rails are logged in Sessions. Monitor allows the interaction to
                    continue with a log entry; Block rejects the individual prompt while keeping
                    the conversation active.
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
                            aria-label={`${guardrail.enabled ? 'Disable' : 'Enable'} ${
                              guardrail.name
                            }`}
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
                                onChange={value =>
                                  updateStandardGuardrail(
                                    guardrail.id,
                                    'sensitivity',
                                    valueToSensitivity(value as number),
                                  )
                                }
                                min={0}
                                max={100}
                                step={33}
                                showTicks
                                aria-label={`${guardrail.name} sensitivity`}
                              />
                              <div className="security-sensitivity-labels">
                                <span>Low</span>
                                <span>Medium</span>
                                <span>High</span>
                                <span>Critical</span>
                              </div>
                            </div>
                            <Dropdown
                              label="Enforcement"
                              options={[
                                { value: 'monitor', label: 'Monitor' },
                                { value: 'block', label: 'Block' },
                              ]}
                              value={guardrail.enforcement}
                              onChange={value =>
                                updateStandardGuardrail(
                                  guardrail.id,
                                  'enforcement',
                                  value as EvaEnforcement,
                                )
                              }
                            />
                            <Dropdown
                              label="Direction"
                              options={[
                                { value: 'prompt', label: 'Prompt' },
                                { value: 'response', label: 'Response' },
                              ]}
                              value={guardrail.direction}
                              onChange={value =>
                                updateStandardGuardrail(
                                  guardrail.id,
                                  'direction',
                                  value as EvaDirection,
                                )
                              }
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
                          <Badge>
                            {group.items.filter(item => item.enabled).length}/{group.items.length}
                          </Badge>
                          <Icon
                            name={expandedAdvancedGroups.has(group.id) ? 'arrow-up' : 'arrow-down'}
                            weight="bold"
                            size={16}
                          />
                        </button>
                        {expandedAdvancedGroups.has(group.id) && (
                          <div className="eva-security-advanced-items">
                            {group.items.map(item => (
                              <section
                                key={item.id}
                                className="eva-security-guardrail-card eva-security-advanced-rule-card"
                              >
                                <div className="eva-security-guardrail-header">
                                  <Toggle
                                    size="compact"
                                    checked={item.enabled}
                                    onChange={() => toggleAdvancedGuardrail(group.id, item.id)}
                                    aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${
                                      item.name
                                    }`}
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
                                        onChange={value =>
                                          updateAdvancedGuardrail(
                                            group.id,
                                            item.id,
                                            'sensitivity',
                                            valueToSensitivity(value as number),
                                          )
                                        }
                                        min={0}
                                        max={100}
                                        step={33}
                                        showTicks
                                        aria-label={`${item.name} sensitivity`}
                                      />
                                      <div className="security-sensitivity-labels">
                                        <span>Low</span>
                                        <span>Medium</span>
                                        <span>High</span>
                                        <span>Critical</span>
                                      </div>
                                    </div>
                                    <Dropdown
                                      label="Enforcement"
                                      options={[
                                        { value: 'monitor', label: 'Monitor' },
                                        { value: 'block', label: 'Block' },
                                      ]}
                                      value={item.enforcement}
                                      onChange={value =>
                                        updateAdvancedGuardrail(
                                          group.id,
                                          item.id,
                                          'enforcement',
                                          value as EvaEnforcement,
                                        )
                                      }
                                    />
                                    <Dropdown
                                      label="Direction"
                                      options={[
                                        { value: 'prompt', label: 'Prompt' },
                                        { value: 'response', label: 'Response' },
                                      ]}
                                      value={item.direction}
                                      onChange={value =>
                                        updateAdvancedGuardrail(
                                          group.id,
                                          item.id,
                                          'direction',
                                          value as EvaDirection,
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </section>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AccordionItem>
          </div>
          )}

          {revealedSections > 6 && (
          <div id="form-section-review" data-form-section-index="6" className={formSectionWrapperClass(6)}>
          <AccordionItem
            title={
              <span className="eva-form-section__title">
                <Icon name="check-circle" weight="bold" size="sm" />
                <strong>Review</strong>
                <span className="eva-form-section__hint">Verify before creating the agent</span>
              </span>
            }
            defaultExpanded
            size="large"
          >
            <div className="eva-config-block">
              <div className="eva-config-summary">
                <span>
                  <strong>Welcome</strong>
                  {welcomeMessage}
                </span>
                <span>
                  <strong>Language</strong>
                  {languageSummary}
                </span>
                <span>
                  <strong>Time zone</strong>
                  {timezone}
                </span>
                <span>
                  <strong>Agent character</strong>
                  {agentCharacterSummary}
                </span>
                <span>
                  <strong>Instructions</strong>
                  {instructionSummary}
                </span>
                <span>
                  <strong>Knowledge</strong>
                  {selectedKnowledgeBases.join(', ') || 'No sources selected'}
                </span>
                <span>
                  <strong>Actions</strong>
                  {selectedActions.join(', ') || 'No actions selected'}
                </span>
                <span>
                  <strong>Channel</strong>
                  {channelSummary}
                </span>
                <span>
                  <strong>Guardrails</strong>
                  {[...draft.security, ...customRules].join(', ')}
                </span>
              </div>
              <div className="eva-form-builder__custom-rules">
                <Input
                  label="Add a custom guardrail"
                  placeholder="e.g. Never quote pricing without manager approval"
                  onKeyDown={event => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    const value = (event.target as HTMLInputElement).value.trim();
                    if (!value) return;
                    setCustomRules(prev => [...prev, value]);
                    (event.target as HTMLInputElement).value = '';
                    showToast('Added custom guardrail', 'success');
                  }}
                />
                {customRules.length > 0 && (
                  <ul className="eva-form-builder__custom-rule-list">
                    {customRules.map((rule, index) => (
                      <li key={`${rule}-${index}`}>
                        <span>{rule}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${rule}`}
                          onClick={() =>
                            setCustomRules(prev => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </AccordionItem>
          </div>
          )}
        </AccordionGroup>

        {phase === 'complete' && (
          <div className="eva-form-builder__form-actions">
            <div className="eva-form-builder__followups" aria-label="Suggested follow-up options">
              <span className="eva-form-builder__followups-label">
                What would you like to add next?
              </span>
              <div className="eva-form-builder__followups-list">
                {REVIEW_FOLLOW_UP_PROMPTS.map(prompt => (
                  <AiPromptButton key={prompt} onClick={() => handlePromptSubmit(prompt)}>
                    {prompt}
                  </AiPromptButton>
                ))}
              </div>
            </div>
            <Button onClick={createDraftAgent}>
              <Icon name="sparkle" weight="bold" size="sm" />
              Create agent
            </Button>
          </div>
        )}

      </div>
      <aside className="eva-form-builder__side-panel" aria-label="Generated agent summary">
        {/* Cards live in their own scroll region so the docked Eva assistant
           below can stay anchored at the bottom of the side panel without
           being pushed off-screen when the Context card fills out post-
           generation. The side panel itself owns the fixed height and clips;
           this inner div owns the actual scrolling. */}
        <div className="eva-form-builder__side-panel-scroll">
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
          {summaryThinking ? (
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
          {contextThinking ? (
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
                        onClick={() => scrollToFormSection('form-section-actions')}
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
                        onClick={() => scrollToFormSection('form-section-knowledge')}
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
        </div>

        {/* Composer lives inside the side panel itself (vs. a viewport-fixed
           footer) so it visually anchors to the Progress / Summary / Context
           column and stays docked at the bottom of the side rail. Always
           visible during non-landing phases so the user can ask Eva to adjust
           the setup while the form is still drafting (planning/waterfall) and
           after it finishes (complete). It sits OUTSIDE the cards' scroll
           region (see `.eva-form-builder__side-panel-scroll`) so the cards
           above can grow + scroll independently without ever pushing this
           composer off-screen. While Eva is still generating, the input is
           disabled and the placeholder explains why so it doesn't accept
           conflicting prompts mid-flight. */}
        <aside
          className={`eva-mini-assistant eva-mini-assistant--docked eva-form-builder__review-assistant${
            reviewAssistantCollapsed ? ' eva-mini-assistant--collapsed' : ''
          }`}
          aria-label="Eva agent review assistant"
        >
          <div className="eva-mini-assistant__header">
            <span>
              <Icon name="sparkle" weight="bold" size="sm" />
              Eva
            </span>
            <div className="eva-mini-assistant__controls">
              <button
                type="button"
                className="eva-mini-assistant__control"
                aria-label={
                  reviewAssistantCollapsed
                    ? 'Expand Eva assistant'
                    : 'Collapse Eva assistant'
                }
                onClick={() => setReviewAssistantCollapsed(prev => !prev)}
              >
                <Icon
                  name={reviewAssistantCollapsed ? 'maximize' : 'minimize'}
                  weight="bold"
                  size="sm"
                />
              </button>
            </div>
          </div>
          {!reviewAssistantCollapsed && (
            <>
              <div className="eva-mini-assistant__thread">
                {/* Show a static intro AiResponseMessage only when the
                    user hasn't started chatting yet. As soon as they
                    send a message we replace it with the real Eva
                    conversation history (chatMessages). The static
                    intro covers two states:
                      - while the form is still drafting (planning /
                        waterfall): explain Eva is working
                      - once it's fully drafted (complete): invite
                        the user to ask follow-ups about the draft */}
                {chatMessages.length === 0 && !chatThinking && (
                  <AiResponseMessage
                    className="eva-mini-assistant__response"
                    assistantName="Eva"
                    assistantState={isGenerating ? 'processing' : 'static'}
                    content={
                      isGenerating
                        ? 'Drafting your agent setup. I\'ll be ready for follow-up adjustments once each section is in place.'
                        : 'I can help adjust this agent setup. Try asking me to change the persona, swap the channel, tighten guardrails, or add knowledge sources.'
                    }
                  />
                )}
                {/* Mini-Eva conversation thread. Both user prompts and
                    Eva's replies render here so the user can scroll back
                    through the side-panel exchange while the form on
                    the left rail stays focused on the draft itself. */}
                {chatMessages.map((message, index) => (
                  message.role === 'user' ? (
                    <AiUserMessage
                      key={`mini-chat-${index}`}
                      className="eva-mini-assistant__user-message"
                      text={message.text}
                    />
                  ) : (
                    <AiResponseMessage
                      key={`mini-chat-${index}`}
                      className="eva-mini-assistant__response"
                      assistantName="Eva"
                      content={message.text}
                    >
                      {message.suggestion && (
                        <div className="eva-field-suggestion">
                          <div className="eva-field-suggestion__label">
                            Suggested {getFieldSuggestionLabel(message.suggestion.field)}
                          </div>
                          <blockquote className="eva-field-suggestion__value">
                            {message.suggestion.value}
                          </blockquote>
                          <div className="eva-field-suggestion__actions">
                            <Button
                              size="sm"
                              onClick={() => applyFieldSuggestion(message.suggestion!, index)}
                              disabled={message.suggestionAccepted}
                            >
                              {message.suggestionAccepted ? 'Accepted' : 'Accept'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => requestAnotherFieldSuggestion(message.suggestion!)}
                            >
                              Try another option
                            </Button>
                          </div>
                        </div>
                      )}
                    </AiResponseMessage>
                  )
                ))}
                {chatThinking && (
                  <AiResponseMessage
                    className="eva-mini-assistant__response"
                    assistantName="Eva is thinking..."
                    assistantState="processing"
                    content={null}
                  />
                )}
              </div>
              {/* The composer stays interactive even while Eva is
                  still drafting the form (`isGenerating`) so the user
                  can ask for opinions, clarifications, and field
                  recommendations the moment a question crosses their
                  mind — they shouldn't have to wait for the reveal
                  animation to finish before being able to talk to
                  Eva. We only swap the input for the processing
                  indicator when the LLM is actively in flight
                  (`chatThinking`), which prevents the user from
                  firing a second request before the first returns. */}
              <AiFooter
                className="eva-mini-assistant__footer"
                onSend={handleAssistantSend}
                onVoiceToggle={() => setVoiceActive(active => !active)}
                processing={chatThinking}
                disabled={chatThinking}
                placeholder={
                  isGenerating
                    ? 'Ask Eva for help while the form is drafting...'
                    : 'Ask Eva to adjust the setup...'
                }
                suggestions={[]}
                voiceActive={voiceActive}
              />
            </>
          )}
        </aside>
      </aside>
      </div>
      )}
    </div>
  );
}
