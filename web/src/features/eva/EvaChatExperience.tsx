import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/shared/Button';
import { AccordionItem, AiFooter, AiResponseMessage, AiThreadPanel, AiUserMessage, Badge, Dropdown, Input, MenuItem, MenuOverlay, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, Toggle, useMenu } from '../../components/shared';
import { AgentCard } from '../../components/agents';
import { Icon } from '../../icons';
import { EVA_CANVAS_NEW_THREAD_FLAG } from './EvaCanvasOverlay';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft, EvaMessage, EvaTemplateId } from './types';
import { formatRelative } from '../../pages/knowledge/utils';
import { optimizeInstructions } from '../../api/ciscoAi';
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
  const [orchestrationSuggested, setOrchestrationSuggested] = useState(restoredEvaSession?.orchestrationSuggested ?? false);
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
    navigate('/agents/eva-canvas');
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

  const completeEvaThinking = (callback: () => void) => {
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

  const handleNewEvaThread = () => {
    const id = `eva-thread-${Date.now()}`;
    setEvaThreads(prev => [{ id, title: 'New thread', group: 'Today' }, ...prev]);
    setActiveEvaThreadId(id);
    setMessages([]);
    setGuidanceVisible(false);
    setEvaThinking(false);
    setOrchestrationSuggested(false);
    setLandingMode('build');
  };

  /* When the user clicks "New thread" on the canvas overlay header, the
     overlay sets a one-shot sessionStorage flag and navigates back to
     /agents. Because the canvas is now an overlay (not a separate route
     element) the chat experience never unmounts — so we can't rely on a
     mount-time effect anymore. Watching `location.pathname` instead lets
     us run the handoff every time the user returns to /agents from the
     canvas, and only consume the flag when it's actually set (so plain
     /agents loads or back/forward navigations don't spawn surprise
     threads). */
  useEffect(() => {
    if (location.pathname !== '/agents') return;
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
  };

  const handleSend = (text: string) => {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setOrchestrationSuggested(false);

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

    const matchedTemplate =
      normalized.includes('healthcare') || normalized.includes('reception')
        ? EVA_TEMPLATES.find(template => template.id === 'knowledge-assistant')
        : normalized.includes('it ') || normalized.includes('ticket') || normalized.includes('support')
          ? EVA_TEMPLATES.find(template => template.id === 'workflow-automation')
          : normalized.includes('policy') || normalized.includes('compliance')
            ? EVA_TEMPLATES.find(template => template.id === 'policy-compliance')
            : normalized.includes('sales')
              ? EVA_TEMPLATES.find(template => template.id === 'sales-enablement')
              : EVA_TEMPLATES.find(template => template.id === (selectedTemplateId ?? 'customer-support'));

    completeEvaThinking(() => {
      if (matchedTemplate) {
        setSelectedTemplateId(matchedTemplate.id);
        setDraft(matchedTemplate.draft);
        setAgentName(matchedTemplate.draft.name);
        setAgentDescription(matchedTemplate.draft.description);
        setTimezone('Europe/London');
        setAiEngine('Webex AI Pro 1.0');
        setWelcomeMessage(buildWelcomeMessage(matchedTemplate.draft));
        setInstructionPrompt(buildInstructionPrompt(matchedTemplate.draft));
        setPersonality(prev => ({
          ...prev,
          llm: 'Webex AI Pro 1.0',
          voice: 'ava',
          language: 'en-US',
        }));
        setSelectedKnowledgeBases(matchedTemplate.draft.knowledgeBases.slice(0, 2).map(kb => kb.name));
        setSelectedActions(matchedTemplate.draft.actions.slice(0, 2));
      }
      setEvaStep('profile');
      setCustomRules([]);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: buildGuidanceMessage(matchedTemplate?.draft ?? draft),
          followups: ['Create this agent', 'Open the canvas', 'Open Knowledge setup', 'Open Security setup'],
        },
      ]);
    });
  };

  const handleWaterfallFollowup = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setOrchestrationSuggested(false);

    if (normalized === 'complete create agent' || normalized === 'complete agent creation') {
      createDraftAgent();
      return;
    }

    if (isOrchestrationIntent(normalized) || normalized.includes('canvas')) {
      showOrchestrationSuggestion();
      return;
    }

    if (normalized === 'create this agent' || normalized === 'create agent') {
      createDraftAgent();
      return;
    }

    if (normalized.includes('review configuration')) {
      setEvaStep('review');
      return;
    }

    if (normalized.includes('looks good') || normalized.includes('continue')) {
      const nextIndex = Math.min(currentStepIndex + 1, evaStepOrder.length - 1);
      setEvaStep(evaStepOrder[nextIndex]);
      return;
    }

    if (normalized.includes('guardrail')) {
      setCustomRules(prev => [...prev, trimmed]);
      setInstructionPrompt(prev => `${prev}\n\nAdditional guardrail:\n- ${trimmed}`);
      setEvaStep('review');
      return;
    }

    if (evaStep === 'profile') {
      setWelcomeMessage(trimmed);
      setEvaStep('channels');
      return;
    }

    if (evaStep === 'channels') {
      if (channelType === 'digital') {
        setDigitalChannelAddress(trimmed);
      } else {
        setChannelPhoneNumber(trimmed);
      }
      setEvaStep('instructions');
      return;
    }

    if (evaStep === 'instructions') {
      setInstructionPrompt(prev => `${prev}\n\nAdditional user direction:\n- ${trimmed}`);
      setEvaStep('knowledge');
      return;
    }

    if (evaStep === 'knowledge') {
      setSelectedKnowledgeBases(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setEvaStep('actions');
      return;
    }

    if (evaStep === 'actions') {
      setSelectedActions(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setEvaStep('security');
      return;
    }

    setCustomRules(prev => [...prev, trimmed]);
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
  const showLandingOptions = !guidanceVisible && !evaThinking && !orchestrationSuggested;
  const showBuildFlow = landingMode === 'build' || guidanceVisible || evaThinking || orchestrationSuggested;
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
  const showGeneratedSidePanel = guidanceVisible || evaThinking || orchestrationSuggested;
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
  const renderUserPromptForStep = (step: EvaConversationStep) => (
    latestUserMessage && evaStep === step
      ? <AiUserMessage key={`user-${step}-${latestUserMessage.text}`} text={step === 'review' ? 'I want to review all my configurations to a agent' : latestUserMessage.text} />
      : null
  );
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
        className={`eva-first-interface${showLandingOptions ? ' eva-first-interface--landing eva-landing-shell' : ''}${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface--generated' : ''}`}
      >
        {!showLandingOptions && (
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

        {showGeneratedSidePanel && (
          <div className={`eva-generated-layout${showEvaGeneratedSidePanel ? '' : ' eva-generated-layout--side-collapsed'}`}>
            <div className="eva-generated-layout__main">
              {evaThinking && (
                <section className="eva-dialogue" aria-label="Eva conversation flow" aria-live="polite">
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
                {renderUserPromptForStep('profile')}
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
              </>
            )}

            {visibleSteps.includes('channels') && (
              <>
                <div className="eva-step-anchor" data-eva-step="channels" tabIndex={-1} />
                {renderUserPromptForStep('channels')}
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
              </>
            )}

            {visibleSteps.includes('instructions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="instructions" tabIndex={-1} />
                {renderUserPromptForStep('instructions')}
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
              </>
            )}

            {visibleSteps.includes('knowledge') && (
              <>
                <div className="eva-step-anchor" data-eva-step="knowledge" tabIndex={-1} />
                {renderUserPromptForStep('knowledge')}
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
              </>
            )}

            {visibleSteps.includes('actions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="actions" tabIndex={-1} />
                {renderUserPromptForStep('actions')}
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
              </>
            )}

            {visibleSteps.includes('security') && (
              <>
                <div className="eva-step-anchor" data-eva-step="security" tabIndex={-1} />
                {renderUserPromptForStep('security')}
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
              </>
            )}

            {visibleSteps.includes('review') && (
              <>
                <div className="eva-step-anchor" data-eva-step="review" tabIndex={-1} />
                {renderUserPromptForStep('review')}
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
                    disabled={evaThinking}
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
              disabled={evaThinking}
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
