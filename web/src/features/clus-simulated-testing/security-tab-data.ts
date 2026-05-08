/* Security tab — rail metadata and default state factories */

/** Icon names used for advanced rail group headers (Momentum Icon `name`). */
export type AdvancedRailGroupIcon = 'shield-bold' | 'secure-lock-bold' | 'active-speaker-alert-bold';

export type SensitivityLevel = 'low' | 'medium' | 'high';
export type EnforcementMode = 'monitor' | 'block';

/** Where the guardrail applies: user prompt vs agent response (standard + advanced rails). */
export type DirectionOption = 'prompt' | 'response';

export type StandardRailId = 'toxicity' | 'harmDetection' | 'jailbreak' | 'multiTurnJailbreak';

export interface StandardRailMeta {
  id: StandardRailId;
  label: string;
  description: string;
}

export interface StandardRailState {
  enabled: boolean;
  sensitivity: SensitivityLevel;
  enforcement: EnforcementMode;
  direction: DirectionOption;
}

export const STANDARD_RAILS: StandardRailMeta[] = [
  {
    id: 'toxicity',
    label: 'Toxicity',
    description: 'Detect and filter toxic language, insults, and abusive content in conversations.',
  },
  {
    id: 'harmDetection',
    label: 'Harm detection',
    description: 'Identify requests or responses that could cause physical, emotional, or financial harm.',
  },
  {
    id: 'jailbreak',
    label: 'Jailbreak',
    description: 'Detect prompt injection attempts designed to bypass agent instructions and safety rules.',
  },
  {
    id: 'multiTurnJailbreak',
    label: 'Multi-turn jailbreak',
    description: 'Detect multi-step manipulation where users gradually steer the agent away from its guardrails across turns.',
  },
];

export function createDefaultStandardStates(): Record<StandardRailId, StandardRailState> {
  return {
    toxicity: { enabled: true, sensitivity: 'low', enforcement: 'monitor', direction: 'response' },
    harmDetection: { enabled: true, sensitivity: 'low', enforcement: 'monitor', direction: 'response' },
    jailbreak: { enabled: true, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
    multiTurnJailbreak: { enabled: true, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
  };
}

/* ── Advanced guardrails ── */

export type ActionOption = 'block' | 'allow' | 'monitor';

export interface AdvancedRailMeta {
  id: string;
  label: string;
  description: string;
  defaultDirection: DirectionOption;
  defaultAction: ActionOption;
}

export interface AdvancedRailState {
  enabled: boolean;
  sensitivity: SensitivityLevel;
  enforcement: EnforcementMode;
  direction: DirectionOption;
}

/** Maps legacy metadata defaults (block / monitor / allow) to Monitor vs Block enforcement. */
export function defaultEnforcementFromAction(action: ActionOption): EnforcementMode {
  return action === 'block' ? 'block' : 'monitor';
}

export interface AdvancedRailGroup {
  category: string;
  icon: AdvancedRailGroupIcon;
  rails: AdvancedRailMeta[];
}

export const ADVANCED_RAIL_GROUPS: AdvancedRailGroup[] = [
  {
    category: 'Security guardrails',
    icon: 'shield-bold',
    rails: [
      { id: 'promptInjection', label: 'Prompt injection', description: 'Detect attempts to manipulate the agent by injecting hidden instructions into user input.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'codeInjection', label: 'Code injection', description: 'Block inputs that attempt to execute arbitrary code through the agent.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'systemPromptExtraction', label: 'System prompt extraction', description: 'Prevent users from tricking the agent into revealing its system prompt or configuration.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'instructionOverride', label: 'Instruction override', description: "Block attempts to override or replace the agent's original instructions.", defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'encodingAttack', label: 'Encoding attack', description: 'Detect obfuscated payloads using Base64, Unicode, or other encoding schemes.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'sqlInjection', label: 'SQL injection', description: 'Identify inputs crafted to execute unauthorized database queries.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'xssInjection', label: 'XSS injection', description: 'Block cross-site scripting payloads embedded in user messages.', defaultDirection: 'prompt', defaultAction: 'block' },
      { id: 'resourceHijack', label: 'Resource hijack', description: 'Prevent prompts designed to consume excessive compute or API resources.', defaultDirection: 'prompt', defaultAction: 'block' },
    ],
  },
  {
    category: 'Privacy guardrails',
    icon: 'secure-lock-bold',
    rails: [
      { id: 'piiDetection', label: 'PII detection', description: 'Identify and flag personally identifiable information in agent responses.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'ssnRedaction', label: 'SSN redaction', description: 'Automatically redact Social Security numbers from responses.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'creditCardRedaction', label: 'Credit card redaction', description: 'Strip credit card numbers from agent output before delivery.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'emailRedaction', label: 'Email redaction', description: 'Remove email addresses from responses to prevent data leakage.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'phoneRedaction', label: 'Phone number redaction', description: 'Redact phone numbers from agent responses.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'addressRedaction', label: 'Address redaction', description: 'Strip physical addresses from responses to protect user privacy.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'ipRedaction', label: 'IP address redaction', description: 'Remove IP addresses from agent output.', defaultDirection: 'response', defaultAction: 'allow' },
    ],
  },
  {
    category: 'Safety guardrails',
    icon: 'active-speaker-alert-bold',
    rails: [
      { id: 'advToxicity', label: 'Toxicity', description: 'Detect and block toxic, abusive, or offensive language in responses.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'hateSpeech', label: 'Hate speech', description: 'Block responses containing hate speech targeting protected groups.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'selfHarm', label: 'Self-harm', description: 'Prevent responses that encourage or provide guidance on self-harm.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'violence', label: 'Violence', description: 'Block content that promotes, glorifies, or instructs on violence.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'sexualContent', label: 'Sexual content', description: 'Filter sexually explicit or inappropriate content from responses.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'harassment', label: 'Harassment', description: 'Detect and block responses that harass, intimidate, or bully users.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'misinformation', label: 'Misinformation', description: 'Flag responses containing known false or misleading claims.', defaultDirection: 'response', defaultAction: 'block' },
      { id: 'radicalization', label: 'Radicalization', description: 'Block content that promotes extremist ideologies or recruitment.', defaultDirection: 'response', defaultAction: 'block' },
    ],
  },
];

export function createDefaultAdvancedStates(): Record<string, AdvancedRailState> {
  const states: Record<string, AdvancedRailState> = {};
  for (const group of ADVANCED_RAIL_GROUPS) {
    for (const rail of group.rails) {
      states[rail.id] = {
        enabled: false,
        sensitivity: 'medium',
        enforcement: defaultEnforcementFromAction(rail.defaultAction),
        direction: rail.defaultDirection,
      };
    }
  }
  return states;
}

export const TOTAL_ADVANCED_RAILS = ADVANCED_RAIL_GROUPS.reduce(
  (sum, g) => sum + g.rails.length,
  0,
);
