import {
  createDraftFromProposal,
  getRankedRecommendations,
  getRecommendationSourceRevision,
  type AgentDraft,
  type DraftChatMessage,
  type StarterProposal,
} from '../agent-creation/agentCreationModel';

export type Feedback360ConversationStep = 'sources' | 'channels' | 'name' | 'welcome' | 'knowledge' | 'actions' | 'phone' | 'review' | 'complete';
export type Feedback360Audience = 'peers' | 'direct-reports' | 'manager';
export type Feedback360Channel = 'voice' | 'digital' | 'video';

export interface Feedback360Answers {
  leaderName: string;
  audiences: Feedback360Audience[];
  focusAreas: string[];
  sourceChecks: string[];
  channels: Feedback360Channel[];
  name: string;
  welcomeMessage: string;
  knowledgeSources: string[];
  actions: string[];
  phoneNumberPreference: string;
}

export interface Feedback360Message { text: string; followups?: string[] }
export interface Feedback360AdvanceResult {
  step: Feedback360ConversationStep;
  answers: Feedback360Answers;
  message: Feedback360Message;
  shouldCreate?: boolean;
}

export const FEEDBACK360_DEFAULT_AUDIENCES: Feedback360Audience[] = ['peers', 'direct-reports', 'manager'];
export const FEEDBACK360_DEFAULT_FOCUS_AREAS = ['Leadership strengths', 'Communication and collaboration', 'Development opportunities'];
export const FEEDBACK360_SOURCE_CHECKS = ['HR System / Org Chart (reporting structure)', 'Employee Handbook', 'Prior Review Cycle Summary'];
export const FEEDBACK360_KNOWLEDGE_SOURCES = ['Company Directory & Organizational Chart', 'Company Intranet / Review Cycle Policy', 'Leadership Competency Framework', 'HR System'];
export const FEEDBACK360_RECOMMENDED_ACTIONS = ['Generate Anonymized Theme Summary', 'Escalate to HR (if guardrails flagged)', 'Share Summary in Webex Space', 'Share Summary via Email', 'Send Reminder to Incomplete Respondents'];
export const FEEDBACK360_DEFAULT_GUARDRAILS = ['Compensation / Financial: exclude compensation figures, comparisons, and budgets', 'Level / Structure: exclude grade, promotion readiness, and performance ratings', 'Escalate serious harassment, safety, and ethics concerns to a human'];

const DEFAULT_NAME = '360 Feedback Agent';
const DEFAULT_PHONE = 'No Preference';
const STEPS: Feedback360ConversationStep[] = ['sources', 'channels', 'name', 'welcome', 'knowledge', 'actions', 'phone', 'review', 'complete'];
const list = (items: readonly string[]) => items.length ? items.join(', ') : 'None selected';
const formatChannels = (channels: readonly Feedback360Channel[]) => channels
  .map(channel => channel.charAt(0).toUpperCase() + channel.slice(1))
  .join(', ')
  .replace(/, ([^,]+)$/, channels.length > 2 ? ', and $1' : ' and $1');
const suggestedWelcome = (name: string) => `Hi, I'm collecting confidential feedback for ${name.trim() || '[Leader]'}'s development review. Thank you for taking the time to complete this — Are you ready to get started?`;

export function is360FeedbackAgentPrompt(prompt: string): boolean {
  const text = prompt.normalize('NFKC').toLowerCase();
  return /\b(?:360|three[\s-]*sixty)\b/.test(text) && /\bfeedback\b/.test(text) && /\b(?:agent|assistant)\b/.test(text);
}

export function createInitial360FeedbackAnswers(_initialPrompt = ''): Feedback360Answers {
  return {
    leaderName: '',
    audiences: [...FEEDBACK360_DEFAULT_AUDIENCES],
    focusAreas: [...FEEDBACK360_DEFAULT_FOCUS_AREAS],
    sourceChecks: [...FEEDBACK360_SOURCE_CHECKS],
    channels: ['voice', 'digital', 'video'],
    name: DEFAULT_NAME,
    welcomeMessage: suggestedWelcome(''),
    knowledgeSources: [...FEEDBACK360_KNOWLEDGE_SOURCES],
    actions: [...FEEDBACK360_RECOMMENDED_ACTIONS],
    phoneNumberPreference: DEFAULT_PHONE,
  };
}

/** Source-based copy for each assistant turn; these are recommendations, not active integrations. */
export function get360FeedbackPrompt(step: Feedback360ConversationStep, answers: Feedback360Answers): Feedback360Message {
  switch (step) {
    case 'sources': return {
      text: 'Check the Following:',
    };
    case 'channels': return {
      text: 'Include Voice, Digital and Video. Which channels should this agent support?',
      followups: ['Include Voice, Digital and Video'],
    };
    case 'name': return {
      text: `${formatChannels(answers.channels)} ${answers.channels.length === 1 ? 'is' : 'are'} selected for this agent. What should we name the agent?`,
      followups: [DEFAULT_NAME],
    };
    case 'welcome': return {
      text: 'Suggested Welcome Message:',
      followups: ['Use suggested welcome message'],
    };
    case 'knowledge': return {
      text: 'Connected/Recommended Knowledge Basis:',
      followups: ['Use recommended'],
    };
    case 'actions': return {
      text: 'Connected/Recommended Actions:',
      followups: ['Use recommended'],
    };
    case 'phone': return {
      text: 'Connected Phone Number',
      followups: [DEFAULT_PHONE],
    };
    case 'review': return {
      text: 'Create Agent',
      followups: ['Create Agent'],
    };
    case 'complete': return { text: 'The agent draft is ready for review.' };
  }
}

const isDefaultReply = (value: string) => /^(?:yes|sure|okay|ok|confirm|continue|next|all|recommended|default|use (?:the )?(?:recommended|default|suggested)(?: options?| settings?)?|looks good)$/i.test(value.trim());
const isSkipReply = (value: string) => /^(?:none|no|skip(?: these checks| knowledge for now| actions for now| for now)?|not now|no thanks)$/i.test(value.trim());

type SuggestedOption<T extends string> = { value: T; aliases: RegExp[] };

function pickOptions<T extends string>(
  reply: string,
  options: readonly SuggestedOption<T>[],
  defaults: readonly T[],
  allowEmpty: boolean,
): T[] | null {
  const text = reply.trim().toLowerCase();
  if (isSkipReply(text)) return allowEmpty ? [] : null;
  if (isDefaultReply(text) || /\b(?:all|recommended|default)\b/.test(text)) {
    const excluded = text.match(/\b(?:except|without|excluding)\b([\s\S]*)$/)?.[1];
    if (!excluded) return [...defaults];
    return defaults.filter(value => !options.find(option => option.value === value)?.aliases.some(alias => alias.test(excluded)));
  }
  const selected = options.filter(option => option.aliases.some(alias => alias.test(text))).map(option => option.value);
  return selected.length ? selected : null;
}

const SOURCE_OPTIONS: SuggestedOption<string>[] = [
  { value: FEEDBACK360_SOURCE_CHECKS[0], aliases: [/\bhr system\b/, /\borg(?:anizational)? chart\b/, /\breporting structure\b/] },
  { value: FEEDBACK360_SOURCE_CHECKS[1], aliases: [/\bemployee handbook\b/, /\bhandbook\b/] },
  { value: FEEDBACK360_SOURCE_CHECKS[2], aliases: [/\bprior review\b/, /\breview cycle summary\b/] },
];
const CHANNEL_OPTIONS: SuggestedOption<Feedback360Channel>[] = [
  { value: 'voice', aliases: [/\bvoice\b/, /\bphone\b/] },
  { value: 'digital', aliases: [/\bdigital\b/, /\bchat\b/] },
  { value: 'video', aliases: [/\bvideo\b/] },
];
const KNOWLEDGE_OPTIONS: SuggestedOption<string>[] = [
  { value: FEEDBACK360_KNOWLEDGE_SOURCES[0], aliases: [/\bcompany directory\b/, /\borganizational chart\b/, /\borg chart\b/] },
  { value: FEEDBACK360_KNOWLEDGE_SOURCES[1], aliases: [/\bintranet\b/, /\breview cycle policy\b/] },
  { value: FEEDBACK360_KNOWLEDGE_SOURCES[2], aliases: [/\bleadership competency\b/, /\bcompetency framework\b/] },
  { value: FEEDBACK360_KNOWLEDGE_SOURCES[3], aliases: [/\bhr system\b/] },
];
const ACTION_OPTIONS: SuggestedOption<string>[] = [
  { value: FEEDBACK360_RECOMMENDED_ACTIONS[0], aliases: [/\btheme summary\b/, /\banonymized summary\b/] },
  { value: FEEDBACK360_RECOMMENDED_ACTIONS[1], aliases: [/\bescalate\b/, /\bhr\b/] },
  { value: FEEDBACK360_RECOMMENDED_ACTIONS[2], aliases: [/\bwebex space\b/] },
  { value: FEEDBACK360_RECOMMENDED_ACTIONS[3], aliases: [/\bemail\b/] },
  { value: FEEDBACK360_RECOMMENDED_ACTIONS[4], aliases: [/\bremind(?:er)?\b/, /\bincomplete respondents\b/] },
];

function invalid(step: Feedback360ConversationStep, answers: Feedback360Answers, reason: string): Feedback360AdvanceResult {
  const prompt = get360FeedbackPrompt(step, answers);
  return { step, answers, message: { text: `${reason}\n\n${prompt.text}`, followups: prompt.followups } };
}

function next(step: Feedback360ConversationStep, answers: Feedback360Answers): Feedback360AdvanceResult {
  let nextStep = STEPS[STEPS.indexOf(step) + 1] ?? 'complete';
  if (nextStep === 'phone' && !answers.channels.includes('voice')) nextStep = 'review';
  return { step: nextStep, answers, message: get360FeedbackPrompt(nextStep, answers) };
}

/** Read the user's natural-language reply and return the next chat turn. */
export function advance360FeedbackConversation(
  step: Feedback360ConversationStep,
  answer: string,
  answers: Feedback360Answers,
): Feedback360AdvanceResult {
  const value = answer.trim();
  if (!value) return invalid(step, answers, 'Please reply before we continue.');

  switch (step) {
    case 'sources': {
      const sourceChecks = pickOptions(value, SOURCE_OPTIONS, FEEDBACK360_SOURCE_CHECKS, true);
      if (!sourceChecks) return invalid(step, answers, 'Tell me which checks to include, or say “Use recommended.”');
      return next(step, { ...answers, sourceChecks });
    }
    case 'channels': {
      const channels = pickOptions(value, CHANNEL_OPTIONS, ['voice', 'digital', 'video'], false);
      if (!channels?.length) return invalid(step, answers, 'Choose at least one of Voice, Digital, or Video.');
      return next(step, { ...answers, channels });
    }
    case 'name': {
      const name = isDefaultReply(value) ? DEFAULT_NAME : value
        .replace(/^(?:name (?:it|the agent)|call (?:it|the agent))\s*[:\-]?\s*/i, '')
        .replace(/^[“"']|[”"']$/g, '').trim();
      if (!name || name.length > 100) return invalid(step, answers, 'Give the agent a name of 1–100 characters.');
      return next(step, { ...answers, name });
    }
    case 'welcome': {
      const welcomeMessage = isDefaultReply(value) || /^(?:use )?(?:suggested|default) welcome message$/i.test(value)
        ? suggestedWelcome(answers.leaderName)
        : value.replace(/^(?:set (?:the )?welcome (?:message )?to)\s*[:\-]?\s*/i, '').trim();
      if (!welcomeMessage || welcomeMessage.length > 600) return invalid(step, answers, 'Use the suggested welcome message or provide one under 600 characters.');
      return next(step, { ...answers, welcomeMessage });
    }
    case 'knowledge': {
      const knowledgeSources = pickOptions(value, KNOWLEDGE_OPTIONS, FEEDBACK360_KNOWLEDGE_SOURCES, true);
      if (!knowledgeSources) return invalid(step, answers, 'Tell me which knowledge sources to recommend, or say “Use recommended.”');
      return next(step, { ...answers, knowledgeSources });
    }
    case 'actions': {
      const actions = pickOptions(value, ACTION_OPTIONS, FEEDBACK360_RECOMMENDED_ACTIONS, true);
      if (!actions) return invalid(step, answers, 'Tell me which actions to recommend, or say “Use recommended.”');
      return next(step, { ...answers, actions });
    }
    case 'phone': {
      const phoneNumberPreference = isDefaultReply(value) || /^(?:no preference|none|skip|not now)$/i.test(value)
        ? DEFAULT_PHONE : value.slice(0, 100);
      return next(step, { ...answers, phoneNumberPreference });
    }
    case 'review': {
      if (/^(?:yes|confirm|create(?:\s+(?:agent|draft|agent draft))?|looks good|go ahead|proceed)$/i.test(value)) {
        return { step: 'complete', answers, message: { text: 'I’ll create the configuration draft now. No invitations or connections are active.' }, shouldCreate: true };
      }
      if (/\b(?:change|edit|revise|update)\b/i.test(value)) {
        const target: Feedback360ConversationStep | undefined =
          /\b(?:source|check|handbook|org chart)\b/i.test(value) ? 'sources'
            : /\b(?:channel|voice|digital|video)\b/i.test(value) ? 'channels'
              : /\bname\b/i.test(value) ? 'name'
                : /\bwelcome\b/i.test(value) ? 'welcome'
                  : /\bknowledge\b/i.test(value) ? 'knowledge'
                    : /\baction\b/i.test(value) ? 'actions'
                      : /\bphone\b/i.test(value) ? 'phone' : undefined;
        if (target === 'phone' && !answers.channels.includes('voice')) {
          return { step: 'channels', answers, message: { text: 'A phone preference applies only when Voice is planned. Which channels should I plan for?', followups: get360FeedbackPrompt('channels', answers).followups } };
        }
        if (target) return { step: target, answers, message: get360FeedbackPrompt(target, answers) };
        return {
          step,
          answers,
          message: {
            text: 'What would you like to change: source checks, channels, name, welcome message, knowledge, actions, or phone preference?',
            followups: ['Change source checks', 'Change channels', 'Change welcome message', 'Change actions'],
          },
        };
      }
      return invalid(step, answers, 'Say “Create Agent” to create a draft, or tell me what to change.');
    }
    case 'complete': return { step, answers, message: get360FeedbackPrompt(step, answers) };
  }
}

/** Create a draft only; source, action, channel, and phone connections remain pending. */
export function create360FeedbackDraft(
  initialPrompt: string,
  answers: Feedback360Answers,
  chatHistory: DraftChatMessage[] = [],
): AgentDraft {
  if (!answers.audiences.includes('peers') && !answers.audiences.includes('direct-reports')) {
    throw new Error('A peer or direct-report pool is required for this feedback plan.');
  }
  if (!answers.name.trim()) throw new Error('The agent needs a name.');
  if (!answers.channels.length) throw new Error('Choose at least one planned channel.');

  const leader = answers.leaderName.trim() || '[Leader]';
  const safeguards = FEEDBACK360_DEFAULT_GUARDRAILS;
  const audienceLabels: Record<Feedback360Audience, string> = {
    peers: 'peers', 'direct-reports': 'direct reports', manager: 'manager',
  };
  const selectedAudiences = [...new Set(answers.audiences)].map(audience => audienceLabels[audience]).filter(Boolean);
  const welcomeMessage = answers.welcomeMessage.trim() || suggestedWelcome(answers.leaderName);
  const proposal: StarterProposal = {
    name: answers.name.trim(),
    purpose: `Prepare a 360 feedback experience for ${leader}'s development review.`,
    description: `Configuration draft for a short, structured interview with ${list(selectedAudiences)}. Responses should be combined into de-identified themes for development review. Requested goal: ${initialPrompt.trim()}`,
    language: 'English (US)',
    selectedChannels: [...answers.channels],
    greeting: welcomeMessage,
    greetings: Object.fromEntries(answers.channels.map(channel => [channel, welcomeMessage])),
    instructions: [
      '#### Role and draft status',
      `You are ${answers.name.trim()}, a proposed 360 feedback agent for ${leader}. If [Leader] remains a placeholder, resolve it from a supplied leader or approved org data before use. This is a configuration draft. Do not claim invitations were sent, responses collected, integrations connected, or anonymity guaranteed. A human owner must review access, consent, retention, and aggregation controls before use.`,
      '',
      '#### Respondent conversation',
      `Suggested welcome: ${welcomeMessage}`,
      `Ask each respondent for a specific time ${leader} handled a high-pressure situation, whether well or poorly. Then ask what ${leader} should do differently or start doing more as a leader. Keep the interview short and focused on observable leadership behaviors and impact.`,
      'If a respondent raises compensation, financial figures, comparisons, budgets, grade, promotion readiness, or performance ratings, redirect to leadership behaviors and exclude those details from the development summary.',
      'Thank the respondent at the end. Describe sharing only the pooled theme summary in a Webex space as a planned step after an approved connection is configured; do not say a summary has been sent.',
      '',
      '#### Confidentiality and escalation',
      'Only share sufficiently pooled themes after human privacy review and according to the approved response threshold. Do not expose a single manager response separately.',
      'Combine responses into themes. Remove names, raw quotes, role attribution, and identifying details. If details could identify a person or the pool is too small, withhold the summary and request human privacy review.',
      'For serious harassment, safety, or ethics concerns, recommend escalation to a human HR owner. Do not claim an escalation occurred unless a connected action confirms it.',
      ...safeguards.map(rule => `- ${rule}`),
      '',
      '#### Planned sources and capabilities — not connected',
      `Source checks: ${list(answers.sourceChecks)}.`,
      `Recommended knowledge basis: ${list(answers.knowledgeSources)}.`,
      `Recommended actions: ${list(answers.actions)}.`,
      `Planned channels: ${list(answers.channels)}.`,
      `Phone number preference: ${answers.phoneNumberPreference || DEFAULT_PHONE}.`,
      '',
      '#### Development summary',
      `Organize recurring themes around ${list(answers.focusAreas)}. Note uncertainty and suggest practical development actions. Never invent feedback or present a suggestion as a finding without supporting responses.`,
    ].join('\n'),
  };

  const draft = createDraftFromProposal('contact_center', proposal, chatHistory);
  const channelCapability = draft.familyConfiguration.channels;
  if (channelCapability) {
    channelCapability.progress = 'in_progress';
    channelCapability.values = {
      ...(channelCapability.values ?? {}),
      selectedChannels: [...answers.channels],
      greetings: Object.fromEntries(answers.channels.map(channel => [channel, welcomeMessage])),
      phoneNumberPreference: answers.phoneNumberPreference || DEFAULT_PHONE,
      connectionStatus: 'pending',
    };
  }
  const knowledgeCapability = draft.familyConfiguration.knowledge;
  if (knowledgeCapability) {
    knowledgeCapability.progress = answers.knowledgeSources.length ? 'in_progress' : 'not_started';
    knowledgeCapability.values = {
      ...(knowledgeCapability.values ?? {}),
      selections: [...answers.knowledgeSources],
      catalog: answers.knowledgeSources.map(name => ({
        name,
        description: 'Recommended for this 360 feedback draft; connection pending.',
      })),
      connectionStatus: 'pending',
    };
  }
  const actionsCapability = draft.familyConfiguration.actions;
  if (actionsCapability) {
    actionsCapability.progress = answers.actions.length ? 'in_progress' : 'not_started';
    actionsCapability.values = {
      ...(actionsCapability.values ?? {}),
      selections: [...answers.actions],
      catalog: answers.actions.map(name => ({
        name,
        description: 'Recommended for this 360 feedback draft; connection pending.',
      })),
      connectionStatus: 'pending',
    };
  }
  draft.recommendationSourceRevision = getRecommendationSourceRevision(draft);
  draft.recommendations = getRankedRecommendations(draft);
  return draft;
}
