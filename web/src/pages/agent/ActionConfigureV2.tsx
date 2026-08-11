import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader, AgentWorkspacePageHeading } from '../../components/agents';
import Button from '../../components/shared/Button';
import Tabs, { Tab, SegmentControl, SegmentItem } from '../../components/shared/Tabs';
import Toggle from '../../components/shared/Toggle';
import Dropdown from '../../components/shared/Dropdown';
import { MenuItem, MenuOverlay, useMenu } from '../../components/shared/Menu';
import { Slider } from '../../components/shared/Slider';
import { AccordionGroup, AccordionItem } from '../../components/shared/Accordion';

import Badge from '../../components/shared/Badge';
import { Card, CardBody } from '../../components/shared/Card';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import { Input, Textarea } from '../../components/shared/FormInput';
import { EmptyState } from '../../components/shared/EmptyState';
import { Illustration } from '../../assets/illustrations';
import { Tooltip } from '../../components/shared/Tooltip';
import { Banner } from '../../components/shared/Banner';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/shared/Modal';
import { TextLink } from '../../components/shared/TextLink';
import { ProgressBar } from '../../components/shared/ProgressBar';

import CreateEngineModal from '../CreateEngineModal';
import CreateFulfillmentModal from './CreateFulfillmentModal';
import PolicyStudio from './PolicyStudio';
import SecurityUIPolicyStudio from './SecurityUIPolicyStudio';
import { optimizeInstructions } from '../../api/ciscoAi';
import { Icon } from '../../icons';
import {
  type AgentFamily,
  type CapabilityState,
  type CustomerChannel,
} from '../../features/agent-creation/agentCreationModel';
import { EVA_CHANNEL_SELECTION_OPTIONS } from '../../features/eva/evaFormConfig';
import {
  CISCO_LIVE_AGENTS,
  CISCO_LIVE_ACTION_CATALOG,
  CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL,
} from '../../demo/ciscoLiveDemo';
import { buildCiscoLiveInstructions } from '../../demo/ciscoLiveSeed';
import {
  type UpdateStatus,
  type RiskLevel,
  CapabilityRecord,
  VersionMeta,
  DEFAULT_VERSION_META,
  INTEGRATIONS,
  MCP_SERVERS,
  A2A_AGENTS,
  APP_CONNECTORS,
  AVAILABLE_ACTIONS,
  buildSeededVersionCache,
  resolveVersionMetaFromCache,
} from './actionConfigShared';
import {
  ActionControlManagerDialog,
  GALILEO_ACTION_IDS,
  LARGE_EVENT_CONTROL_ID,
  RecommendedActionControlsDialog,
  addRecommendedGalileoControl,
  getGalileoActionDisplayName,
  getGalileoActionId,
  getGalileoActionStatus,
  readGalileoActionControlState,
  type GalileoActionControlState,
} from './ActionControls';

const VOICE_LOCATION_OPTIONS = [
  { value: 'headquarters', label: '🇺🇸 San Francisco headquarters' },
  { value: 'customer-support', label: '🇺🇸 New York customer support' },
  { value: 'reservations-desk', label: '🇬🇧 London reservations desk' },
];

const VOICE_PHONE_NUMBER_OPTIONS = [
  { value: '+1-415-555-0142', label: '+1 (415) 555-0142' },
  { value: '+1-212-555-0186', label: '+1 (212) 555-0186' },
  { value: '+44-20-7946-0958', label: '+44 20 7946 0958' },
];

function ProfileLogicSummary({ overview }: { overview: import('./PolicyStudio').PolicyOverview }) {
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
      label: `${overview.allowed.length} allowed`,
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
      <div className="custom-profile-card__logic" aria-label="Adaptive guardrail rule summary">
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

interface GuardrailRailProps {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  expanded: boolean;
  toggleLabel: string;
  onToggle: () => void;
  onExpandedChange: (open: boolean) => void;
  headerActions?: ReactNode;
  children: ReactNode;
}

function CustomGuardrailActionMenu({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { open, anchorRef, toggle, close } = useMenu();

  return (
    <>
      <button
        ref={anchorRef as RefObject<HTMLButtonElement>}
        type="button"
        className="security-rail-action-menu-btn"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => toggle()}
      >
        <Icon name="more-adr" weight="bold" size="sm" />
      </button>
      <MenuOverlay open={open} anchorRef={anchorRef} onClose={close} align="right">
        <MenuItem
          label="Edit"
          icon="edit"
          onClick={() => {
            close();
            onEdit();
          }}
        />
        <MenuItem
          label="Delete"
          icon="delete"
          danger
          onClick={() => {
            close();
            onDelete();
          }}
        />
      </MenuOverlay>
    </>
  );
}

function ActionRowMenu({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { open, anchorRef, toggle, close } = useMenu();

  return (
    <>
      <button
        ref={anchorRef as RefObject<HTMLButtonElement>}
        type="button"
        className="action-config-v2-row-menu-btn"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => toggle()}
      >
        <Icon name="more-adr" weight="bold" size="sm" />
      </button>
      <MenuOverlay open={open} anchorRef={anchorRef} onClose={close} align="right">
        <MenuItem
          label="Edit"
          icon="edit"
          onClick={() => {
            close();
            onEdit();
          }}
        />
        <MenuItem
          label="Delete"
          icon="delete"
          danger
          onClick={() => {
            close();
            onDelete();
          }}
        />
      </MenuOverlay>
    </>
  );
}

function GuardrailRail({
  id,
  name,
  description,
  enabled,
  disabled = false,
  expanded,
  toggleLabel,
  onToggle,
  onExpandedChange,
  headerActions,
  children,
}: GuardrailRailProps) {
  const panelId = `${id}-details`;
  const headerId = `${id}-header`;

  return (
    <div className={`accordion accordion--small accordion--borderless security-prebuilt-rail-item ${expanded ? 'security-prebuilt-rail-item--expanded' : 'security-prebuilt-rail-item--collapsed'}`}>
      <div className="security-rail-header">
        <Toggle
          checked={enabled}
          disabled={disabled}
          onChange={onToggle}
          size="compact"
          aria-label={toggleLabel}
        />
        <button
          type="button"
          id={headerId}
          className="security-rail-details-btn"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onExpandedChange(!expanded)}
        >
          <span className="security-guardrail-header-text">
            <span className="security-guardrail-name">{name}</span>
            <span className="security-guardrail-desc">{description}</span>
          </span>
        </button>
        <div className="security-rail-trailing">
          {headerActions}
          <button
            type="button"
            className="security-rail-chevron-btn"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${name}`}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => onExpandedChange(!expanded)}
          >
            <span
              aria-hidden
              className={`accordion__chevron ${expanded ? 'accordion__chevron--open' : ''}`}
            >
              <Icon name="arrow-down" weight="bold" size="sm" />
            </span>
          </button>
        </div>
      </div>
      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="accordion__panel security-rail-panel"
        >
          <div className="accordion__panel-content">{children}</div>
        </div>
      )}
    </div>
  );
}

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

type ActionRow = {
  id: number;
  actionId: string;
  name: string;
  description: string;
  enabled: boolean;
  actionType: string;
  providerType: string;
  createdBy: string;
  lastUpdated: string;
};

type ConfigurationSection = 'Profile' | 'Channels' | 'Flow' | 'Instructions' | 'Knowledge' | 'Action' | 'Security' | 'Language';

const ACTION_SECTIONS: ConfigurationSection[] = ['Profile', 'Channels', 'Flow', 'Instructions', 'Knowledge', 'Action', 'Security', 'Language'];

const FAMILY_SECTIONS: Record<AgentFamily, ConfigurationSection[]> = {
  calling: ['Profile', 'Channels', 'Flow', 'Instructions', 'Knowledge', 'Language'],
  contact_center: ACTION_SECTIONS,
  internal_assistant: ACTION_SECTIONS,
};

const FAMILY_SECTION_LABELS: Record<AgentFamily, Partial<Record<ConfigurationSection, string>>> = {
  calling: {
    Knowledge: 'Basic knowledge',
  },
  contact_center: {
    Action: 'Actions / MCP',
  },
  internal_assistant: {
    Knowledge: 'Internal knowledge',
    Action: 'Actions and skills',
    Security: 'Security and audit',
  },
};

const CONFIGURATION_PAGE_TITLES: Record<ConfigurationSection, string> = {
  Profile: 'Profile',
  Channels: 'Channels',
  Flow: 'Flow',
  Instructions: 'Instructions',
  Knowledge: 'Knowledge & Memory',
  Action: 'Actions',
  Security: 'Security',
  Language: 'Languages',
};

const PROFILE_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
];

const profileLanguageValue = (language: string | undefined) =>
  PROFILE_LANGUAGE_OPTIONS.find(option => option.value === language || option.label === language)?.value ?? 'en-US';

const draftLanguageLabel = (language: string) =>
  PROFILE_LANGUAGE_OPTIONS.find(option => option.value === language)?.label ?? language;

const PROFILE_VOICE_OPTIONS = [
  { value: 'ava', label: 'Ava' },
  { value: 'daniel', label: 'Daniel' },
  { value: 'emma', label: 'Emma' },
  { value: 'liam', label: 'Liam' },
  { value: 'sophia', label: 'Sophia' },
];

const INSTRUCTION_EXAMPLES = [
  {
    title: 'Customer Service Representative',
    content: `#### Role & Identity\nYou are a professional customer service representative dedicated to providing exceptional support and assistance across all customer touchpoints.\n\n#### Primary Goals\nYour primary goals are to resolve customer inquiries efficiently, ensure satisfaction in every interaction, and build lasting positive relationships.\n\n#### Guardrails\nYou must NOT make unauthorized promises, share confidential information, or engage in conversations outside your defined support scope.\n\n#### Output Rules\nMaintain a warm, empathetic, and professional tone in all communications.\n\nUse clear and accessible language while avoiding technical jargon unless necessary.\n\n#### Domain Expertise\nYou have deep knowledge of the company's products, services, policies, return and refund procedures, shipping timelines, and escalation paths. Use this expertise to provide accurate and helpful responses.`,
  },
  {
    title: 'Healthcare Appointment Scheduler',
    content: `#### Role & Identity\nYou are a virtual receptionist for a healthcare clinic, helping patients schedule, reschedule, and cancel appointments.\n\n#### Primary Goals\nEfficiently manage appointment bookings while ensuring patients feel heard and cared for. Collect all required information in a conversational manner.\n\n#### Guardrails\nNever provide medical advice or diagnoses. Do not access or share other patients' information. Always direct urgent medical concerns to emergency services.\n\n#### Output Rules\nAddress patients by their first name. Be compassionate and reassuring. Always confirm appointment details before finalizing.\n\n#### Domain Expertise\nYou are familiar with appointment types (general checkup, specialist, follow-up, urgent care), clinic locations, provider availability, and standard patient intake procedures.`,
  },
  {
    title: 'IT Help Desk Agent',
    content: `#### Role & Identity\nYou are an IT help desk agent assisting employees with common technical issues including password resets, VPN, software installations, and access requests.\n\n#### Primary Goals\nResolve technical issues quickly through structured troubleshooting. Escalate to specialized teams when remote resolution is not possible.\n\n#### Guardrails\nNever ask for or store full passwords. Do not provide workarounds that bypass security policies. Always verify employee identity before making account changes.\n\n#### Output Rules\nUse clear, step-by-step instructions. Confirm each step is completed before proceeding. Provide ticket numbers for all escalations.\n\n#### Domain Expertise\nYou have knowledge of common enterprise IT systems, VPN configurations, Active Directory, password policies, and standard software deployment procedures.`,
  },
];

const INSTRUCTION_TIPS = [
  { title: 'Start with a clear role definition', description: 'Begin your instructions by defining who the agent is and what its primary function is. This anchors all subsequent behavior.' },
  { title: 'Use markdown headers to organize', description: 'Structure your instructions with #### headers for each section (Role, Goals, Guardrails, Output Rules). This helps the AI parse priorities.' },
  { title: 'Set explicit guardrails', description: 'Clearly state what the agent must NOT do. Negative constraints are as important as positive instructions.' },
  { title: 'Define the tone and style', description: 'Specify the communication style — warm, professional, concise. Include examples of phrasing if possible.' },
  { title: 'Include domain context', description: 'Give the agent knowledge about your products, policies, and processes so it can answer accurately without hallucinating.' },
];

const SYSTEM_PROMPT_GUIDELINES = [
  { title: 'Define the agent\'s role and scope', description: 'Open with a clear identity statement — who the agent is, which tasks it handles, and where its boundaries are. This prevents the agent from drifting into topics outside its contact center function.' },
  { title: 'Verify caller identity before disclosing data', description: 'Require authentication (account number, date of birth, or security question) before accessing any personal or account-specific information. This is critical for compliance in regulated contact center environments.' },
  { title: 'Handle one issue at a time', description: 'Ask a single clarifying question, wait for the caller\'s response, then proceed. Contact center callers are often already frustrated — multiple questions at once increases abandonment.' },
  { title: 'Define escalation and transfer rules', description: 'Specify when and how the agent should escalate to a live agent, create a ticket, or transfer to another queue. Always provide a reference number so the caller can follow up.' },
  { title: 'Guard sensitive data', description: 'Instruct the agent to never reveal full account numbers, SSNs, internal policies, or other customers\' data. Only confirm the last few digits when verification is needed.' },
];

/* ── Security tab data model ─────────────────────────────────────── */

type Enforcement = 'monitor' | 'block';

type Direction = 'prompt' | 'response' | 'both';

const DIRECTION_LABELS: Record<Direction, string> = {
  prompt: 'Prompt',
  response: 'Response',
  both: 'Both prompts and responses',
};
type CustomGuardrailAction = 'monitor' | 'steer' | 'block';
type AdvAction = 'block' | 'allow';
type AdvancedGroupId = 'security' | 'privacy' | 'safety';

interface AdvancedGuardrailItem {
  id: string;
  sectionId?: string;
  name: string;
  description: string;
  enabled: boolean;
  sensitivity: number;
  enforcement: Enforcement;
  direction: Direction;
  action: AdvAction;
}

interface AdvancedGuardrailGroup {
  id: AdvancedGroupId;
  label: string;
  description: string;
  icon: string;
  sections?: {
    id: string;
    label: string;
    description: string;
  }[];
  items: AdvancedGuardrailItem[];
}

interface PolicyVersion {
  version: string;
  name: string;
  description: string;
  overview: import('./PolicyStudio').PolicyOverview;
  createdAt: string;
  policyText?: string;
}

interface CustomGuardrailItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  action: CustomGuardrailAction;
  direction: Direction;
  createdBy: string;
  createdAt: string;
  overview: import('./PolicyStudio').PolicyOverview;
  versions: PolicyVersion[];
  policyText?: string;
}

function formatGuardrailUpdatedAt(date = new Date()) {
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const calendarDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `Last updated at: ${time}, ${calendarDate}`;
}

const DEFAULT_GENERATED_CUSTOM_PROFILE: CustomGuardrailItem = {
  id: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.id,
  name: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.name,
  description: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.description,
  enabled: true,
  action: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.action,
  direction: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.direction,
  createdBy: 'System',
  createdAt: 'Last updated at: 11:05 am, July 20, 2026',
  policyText: `# VIP event confidentiality

Purpose
Prevent the agent from sharing protected guest, schedule, location, access, security, or reservation details with unverified or unauthorized requesters.

Blocks
- Confirming whether a protected guest is attending
- Sharing guest lists, arrival times, private entrances, access routes, or security arrangements
- Reconstructing protected event details across multiple questions

Allows
- Public venue and event information
- Approved reservation details for a verified organizer
- Task-specific logistics for a verified vendor
- Secure verification or organizer callback`,
  overview: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.overview,
  versions: [{
    version: 'v1',
    name: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.name,
    description: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.description,
    overview: CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.overview,
    createdAt: 'Last updated at: 11:05 am, July 20, 2026',
    policyText: `# VIP event confidentiality

Purpose
Prevent the agent from sharing protected guest, schedule, location, access, security, or reservation details with unverified or unauthorized requesters.

Blocks
- Confirming whether a protected guest is attending
- Sharing guest lists, arrival times, private entrances, access routes, or security arrangements
- Reconstructing protected event details across multiple questions

Allows
- Public venue and event information
- Approved reservation details for a verified organizer
- Task-specific logistics for a verified vendor
- Secure verification or organizer callback`,
  }],
};

const DEFAULT_ADVANCED_GROUPS: AdvancedGuardrailGroup[] = [
  {
    id: 'security',
    label: 'Security guardrails',
    description: 'Protect AI models against threats and unauthorized access. Ensure integrity and security of the models and outputs.',
    icon: 'shield',
    items: [
      { id: 'sec-prompt-injection', name: 'Prompt injection', description: 'Detect attempts to manipulate the agent by injecting hidden instructions into user input.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-code-injection', name: 'Code injection', description: 'Block inputs that attempt to execute arbitrary code through the agent.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-system-prompt', name: 'System prompt extraction', description: 'Prevent users from tricking the agent into revealing its system prompt or configuration.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-instruction-override', name: 'Instruction override', description: 'Block attempts to override or replace the agent\u2019s original instructions.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-encoding-attack', name: 'Encoding attack', description: 'Detect obfuscated payloads using Base64, Unicode, or other encoding schemes.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-sql-injection', name: 'SQL injection', description: 'Identify inputs crafted to execute unauthorized database queries.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-xss', name: 'XSS injection', description: 'Block cross-site scripting payloads embedded in user messages.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
      { id: 'sec-resource-hijack', name: 'Resource hijack', description: 'Prevent prompts designed to consume excessive compute or API resources.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt', action: 'block' },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy guardrails',
    description: 'Protect regulated data including PII, PHI, and PCI while maintaining safe and compliant conversations.',
    icon: 'privacy-circle',
    sections: [
      {
        id: 'pii',
        label: 'Personally Identifiable Information (PII)',
        description: 'Aims to prevent the exposure of personal information that can directly identify an individual.',
      },
      {
        id: 'pci',
        label: 'Payment Card Industry (PCI)',
        description: 'Aims to prevent disclosure of payment card and financial account data subject to PCI protections.',
      },
    ],
    items: [
      { id: 'priv-pii', sectionId: 'pii', name: 'PII detection', description: 'Identify and flag personally identifiable information in agent responses.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'priv-ssn', sectionId: 'pii', name: 'SSN redaction', description: 'Automatically redact Social Security numbers from responses.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'priv-email', sectionId: 'pii', name: 'Email redaction', description: 'Remove email addresses from responses to prevent data leakage.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'priv-phone', sectionId: 'pii', name: 'Phone number redaction', description: 'Redact phone numbers from agent responses.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'priv-address', sectionId: 'pii', name: 'Address redaction', description: 'Strip physical addresses from responses to protect user privacy.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'priv-ip', sectionId: 'pii', name: 'IP address redaction', description: 'Remove IP addresses from agent output.', enabled: false, sensitivity: 50, enforcement: 'monitor', direction: 'response', action: 'allow' },
      { id: 'priv-credit-card', sectionId: 'pci', name: 'Credit card redaction', description: 'Strip credit card numbers from agent output before delivery.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety guardrails',
    description: 'Protect against content harmful to people, organizations, or society. Reduce toxic and dangerous content.',
    icon: 'check-circle',
    items: [
      { id: 'safe-toxicity', name: 'Toxicity', description: 'Detect and block toxic, abusive, or offensive language in responses.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-hate', name: 'Hate speech', description: 'Block responses containing hate speech targeting protected groups.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-self-harm', name: 'Self-harm', description: 'Prevent responses that encourage or provide guidance on self-harm.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-violence', name: 'Violence', description: 'Block content that promotes, glorifies, or instructs on violence.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-sexual', name: 'Sexual content', description: 'Filter sexually explicit or inappropriate content from responses.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-harassment', name: 'Harassment', description: 'Detect and block responses that harass, intimidate, or bully users.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
      { id: 'safe-misinfo', name: 'Misinformation', description: 'Flag responses containing known false or misleading claims.', enabled: false, sensitivity: 50, enforcement: 'monitor', direction: 'response', action: 'block' },
      { id: 'safe-radicalization', name: 'Radicalization', description: 'Block content that promotes extremist ideologies or recruitment.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'response', action: 'block' },
    ],
  },
];

export default function ActionConfigureV2() {
  const { agentId } = useParams();
  const {
    agents,
    agentDrafts,
    currentAgent,
    selectAgent,
    updateAgentDraft,
    showToast,
    aiEngines,
    addAiEngine,
  } = useApp();
  const agentDraft = agentId ? agentDrafts[agentId] : undefined;
  // Resolve the Cisco Live demo definition for this agent (falling back to the
  // primary demo agent) so every configuration screen shows real design-
  // explorations names instead of the generic defaults.
  const ciscoLiveAgent = CISCO_LIVE_AGENTS.find(candidate => candidate.id === agentId) ?? CISCO_LIVE_AGENTS[0];
  const agentFamily = agentDraft?.family;
  const availableSections = useMemo(
    () => agentFamily ? FAMILY_SECTIONS[agentFamily] : ACTION_SECTIONS,
    [agentFamily],
  );
  const [searchParams] = useSearchParams();
  // Allow deep-linking to a specific section via ?section=Security (etc.).
  // Only the first render reads the param; user navigation takes over after that.
  const initialSection: ConfigurationSection = (() => {
    const raw = searchParams.get('section');
    if (!raw) return 'Profile';
    return ACTION_SECTIONS.includes(raw as ConfigurationSection)
      ? raw as ConfigurationSection
      : 'Profile';
  })();
  const initialTier: 'standard' | 'advanced' = (() => {
    const raw = searchParams.get('tier');
    return raw === 'advanced' ? 'advanced' : 'standard';
  })();
  const [selectedSection, setSelectedSection] = useState<ConfigurationSection>(initialSection);
  // Keep the active section in sync with the ?section= query param so the
  // agent side navigation (which drives section switching) can select and
  // highlight sections. Falls back to Profile when the param is absent.
  useEffect(() => {
    const raw = searchParams.get('section');
    if (raw && ACTION_SECTIONS.includes(raw as ConfigurationSection)) {
      setSelectedSection(raw as ConfigurationSection);
    } else if (!raw) {
      setSelectedSection('Profile');
    }
  }, [searchParams]);
  const activeSection = availableSections.includes(selectedSection) ? selectedSection : 'Profile';
  const pageTitle = CONFIGURATION_PAGE_TITLES[activeSection];

  // Profile form state
  const [profileForm, setProfileForm] = useState(() => ({
    agentName: agentDraft?.basics.name ?? (agentId ? agents[agentId]?.name : undefined) ?? 'Acme Bank Credit Card Assistant',
    systemId: 'AcmeBankCreditCardAssistant-uah13as',
    avatarUrl: 'https://us.webexbotbuilder.com/static/assets/i...',
    timezone: 'Europe/London',
    language: profileLanguageValue(agentDraft?.language.defaultLanguage),
    voiceName: 'ava',
    aiEngine: 'Webex AI Pro 1.0',
    welcomeMessage: ciscoLiveAgent.welcomeMessage,
    agentGoal: agentDraft?.basics.purpose ?? '',
    instructions: agentDraft?.instructions.content?.trim()
      ? agentDraft.instructions.content
      : buildCiscoLiveInstructions(ciscoLiveAgent),
  }));

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));

    if (!agentId || !agentDraft) return;
    if (field === 'agentName') {
      updateAgentDraft(agentId, draft => ({
        ...draft,
        basics: { ...draft.basics, name: value },
      }));
    } else if (field === 'instructions') {
      updateAgentDraft(agentId, draft => ({
        ...draft,
        instructions: { ...draft.instructions, content: value },
      }));
    } else if (field === 'language') {
      updateAgentDraft(agentId, draft => ({
        ...draft,
        language: { ...draft.language, defaultLanguage: draftLanguageLabel(value) },
      }));
    }
  };

  // Instructions tab state
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptOverflows, setPromptOverflows] = useState(false);
  const promptRef = useRef<HTMLSpanElement>(null);
  const [showGuideline, setShowGuideline] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleTab, setExampleTab] = useState<'examples' | 'tips'>('examples');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizeState, setOptimizeState] = useState<'generating' | 'completed'>('generating');
  const [optimizedText, setOptimizedText] = useState('');
  const [optimizeSummary, setOptimizeSummary] = useState<{ changes: string[]; reasoning: string[] }>({ changes: [], reasoning: [] });
  const [originalTextSnapshot, setOriginalTextSnapshot] = useState('');
  const [optimizeAccepted, setOptimizeAccepted] = useState(false);
  const [acceptedSummary, setAcceptedSummary] = useState<{ changes: string[]; reasoning: string[] }>({ changes: [], reasoning: [] });
  const [preOptimizeText, setPreOptimizeText] = useState('');

  // Security tab state
  const isPaidUser = true;
  const [advancedDefaultGroups, setAdvancedDefaultGroups] = useState<AdvancedGuardrailGroup[]>(() =>
    DEFAULT_ADVANCED_GROUPS.map(group => ({
      ...group,
      items: group.items.map(guardrail => ({
        ...guardrail,
        enabled: ciscoLiveAgent.prebuiltGuardrailIds.includes(guardrail.id),
      })),
    })),
  );
  const [advancedCustomItems, setAdvancedCustomItems] = useState<CustomGuardrailItem[]>(() => {
    const seededItems = ciscoLiveAgent.customGuardrails.map(guardrail => ({
      ...guardrail,
      enabled: true,
      action: guardrail.action as CustomGuardrailAction,
      direction: guardrail.direction as Direction,
      overview: {
        blocked: guardrail.overview.blocked.map(entry => ({ ...entry })),
        allowed: guardrail.overview.allowed.map(entry => ({ ...entry })),
        edgeCases: guardrail.overview.edgeCases.map(entry => ({ ...entry })),
      },
      versions: [],
    }));
    const storedItems = agentDraft?.familyConfiguration.security?.values?.customGuardrails;
    if (!Array.isArray(storedItems)) return seededItems;

    const validItems = storedItems.filter((item): item is CustomGuardrailItem => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const candidate = item as Partial<CustomGuardrailItem>;
      return typeof candidate.id === 'string'
        && typeof candidate.name === 'string'
        && typeof candidate.description === 'string'
        && typeof candidate.enabled === 'boolean'
        && ['monitor', 'steer', 'block'].includes(String(candidate.action))
        && ['prompt', 'response', 'both'].includes(String(candidate.direction))
        && Boolean(candidate.overview)
        && Array.isArray(candidate.versions);
    });
    return validItems.length > 0 ? structuredClone(validItems) : seededItems;
  });
  const [pendingAdvancedEnable, setPendingAdvancedEnable] = useState<{ groupId: string; itemIds: string[]; label: string } | null>(null);
  const [hasAcknowledgedAdvancedPricing, setHasAcknowledgedAdvancedPricing] = useState(false);
  const [expandedRails, setExpandedRails] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    DEFAULT_ADVANCED_GROUPS.forEach(gp => gp.items.forEach(it => {
      if (ciscoLiveAgent.prebuiltGuardrailIds.includes(it.id)) initial.add(it.id);
    }));
    ciscoLiveAgent.customGuardrails.forEach(g => initial.add(g.id));
    return initial;
  });
  const [expandedPrebuiltGroups, setExpandedPrebuiltGroups] = useState<Set<AdvancedGroupId>>(new Set());
  const [expandedPrivacySections, setExpandedPrivacySections] = useState<Set<string>>(() => new Set(['pii', 'pci']));
  const [prebuiltSearch, setPrebuiltSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [guardrailMode, setGuardrailMode] = useState<'custom' | 'prebuilt'>('custom');
  const [customSectionOpen, setCustomSectionOpen] = useState(true);
  const [showPolicyStudio, setShowPolicyStudio] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [defaultCustomProfileState, setDefaultCustomProfileState] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [defaultCustomProfileProgress, setDefaultCustomProfileProgress] = useState(0);
  const handledGuardrailDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    const guardrailId = searchParams.get('guardrailId');
    if (activeSection !== 'Security' || !guardrailId) return;
    const requestKey = `${agentId ?? ''}:${guardrailId}`;
    if (handledGuardrailDeepLinkRef.current === requestKey) return;
    handledGuardrailDeepLinkRef.current = requestKey;
    setGuardrailMode('custom');
    setCustomSectionOpen(true);
    setExpandedRails(current => new Set(current).add(guardrailId));
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.getElementById(`${guardrailId}-header`);
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target?.focus();
    }));
  }, [activeSection, agentId, searchParams]);

  const handleOptimize = useCallback(async () => {
    const text = profileForm.instructions.trim();
    if (!text) return;

    setOriginalTextSnapshot(text);
    setOptimizeState('generating');
    setOptimizedText('');
    setOptimizeSummary({ changes: [], reasoning: [] });
    setShowOptimizeModal(true);

    try {
      const result = await optimizeInstructions(text);
      setOptimizedText(result.optimizedText);
      setOptimizeSummary({ changes: result.changes, reasoning: result.reasoning });
      setOptimizeState('completed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimization failed';
      showToast(message, 'error');
      setShowOptimizeModal(false);
      setOptimizeState('idle');
    }
  }, [profileForm.instructions, showToast]);

  const ciscoLiveCapabilities: CapabilityRecord[] = ciscoLiveAgent.actions.map((name, index) => ({
    id: 100 + index,
    sourceActionId: getGalileoActionId(undefined, name),
    name: getGalileoActionDisplayName(name),
    type: name.startsWith('Transfer') ? 'Handoff' : 'MCP',
    enabled: true,
    description: CISCO_LIVE_ACTION_CATALOG[name] ?? '',
  }));
  const [capabilities, setCapabilities] = useState<CapabilityRecord[]>(ciscoLiveCapabilities);
  const [disabledKnowledge, setDisabledKnowledge] = useState<Record<string, boolean>>({});
  const toggleKnowledge = (name: string) =>
    setDisabledKnowledge((prev) => ({ ...prev, [name]: !prev[name] }));
  const [rows, setRows] = useState<ActionRow[]>(
    ciscoLiveCapabilities.map((cap) => ({
      id: cap.id,
      actionId: getGalileoActionId(cap.sourceActionId, cap.name),
      name: cap.name,
      description: cap.description || 'Escalate the conversation to a human agent based on general rules and conditions',
      enabled: true,
      actionType: cap.type === 'Handoff' ? 'Transfer' : cap.type,
      providerType: /(ServiceNow|fulfillment|SLA)/i.test(cap.name) ? 'ServiceNow' : 'Gofie',
      createdBy: ciscoLiveAgent.updatedBy,
      lastUpdated: '07/13/26, at 9:30 AM',
    })),
  );
  const [galileoActionControls, setGalileoActionControls] = useState<GalileoActionControlState>(() => (
    readGalileoActionControlState(agentDraft?.familyConfiguration.actions?.values)
  ));
  const galileoAgentIdRef = useRef(agentId);
  const [galileoDialogActionId, setGalileoDialogActionId] = useState<string | null>(null);
  const galileoReturnFocusRef = useRef<HTMLElement | null>(null);
  const [showRecommendedControls, setShowRecommendedControls] = useState(false);
  const recommendedControlsReturnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (galileoAgentIdRef.current === agentId) return;
    galileoAgentIdRef.current = agentId;
    setGalileoActionControls(readGalileoActionControlState(agentDraft?.familyConfiguration.actions?.values));
    setGalileoDialogActionId(null);
    setShowRecommendedControls(false);
  }, [agentDraft, agentId]);

  const openGalileoActionControls = (actionId: string) => {
    galileoReturnFocusRef.current = document.activeElement as HTMLElement | null;
    setGalileoDialogActionId(actionId);
  };

  const closeGalileoActionControls = () => {
    setGalileoDialogActionId(null);
    const target = galileoReturnFocusRef.current;
    galileoReturnFocusRef.current = null;
    window.requestAnimationFrame(() => target?.focus());
  };

  const openRecommendedControls = () => {
    recommendedControlsReturnFocusRef.current = document.activeElement as HTMLElement | null;
    setShowAddMenu(false);
    setShowRecommendedControls(true);
  };

  const closeRecommendedControls = () => {
    setShowRecommendedControls(false);
    const target = recommendedControlsReturnFocusRef.current;
    recommendedControlsReturnFocusRef.current = null;
    window.requestAnimationFrame(() => target?.focus());
  };

  const handledActionControlDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    const actionId = searchParams.get('actionId');
    if (activeSection !== 'Action' || !actionId) return;
    const requestKey = `${agentId ?? ''}:${actionId}:${searchParams.get('controlId') ?? ''}`;
    if (handledActionControlDeepLinkRef.current === requestKey) return;
    handledActionControlDeepLinkRef.current = requestKey;
    openGalileoActionControls(actionId);
  }, [activeSection, agentId, searchParams]);

  // Reflect the Actions table into the shared agent draft so the overview's
  // "Connections" card stays in sync with what is enabled here. Guarded so it
  // only writes when the enabled set actually changes.
  useEffect(() => {
    if (!agentId) return;
    const enabledNames = rows.filter(row => row.enabled).map(row => row.name);
    const cap = agentDraft?.familyConfiguration.actions;
    const rawSelections = cap?.values?.selections;
    const currentSelections = Array.isArray(rawSelections)
      ? rawSelections.filter((s): s is string => typeof s === 'string')
      : [];
    const desiredProgress = enabledNames.length > 0 ? 'configured' : 'not_started';
    const rawControlsByActionId = cap?.values?.controlsByActionId;
    const rawGatesByActionId = cap?.values?.gatesByActionId;
    const controlsUnchanged = JSON.stringify(rawControlsByActionId ?? {})
      === JSON.stringify(galileoActionControls.controlsByActionId);
    const gatesUnchanged = JSON.stringify(rawGatesByActionId ?? {})
      === JSON.stringify(galileoActionControls.gatesByActionId);
    const unchanged =
      cap?.progress === desiredProgress &&
      currentSelections.length === enabledNames.length &&
      currentSelections.every((s, i) => s === enabledNames[i]) &&
      controlsUnchanged &&
      gatesUnchanged;
    if (unchanged) return;
    updateAgentDraft(agentId, draft => {
      const actionsCap = draft.familyConfiguration.actions;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          actions: {
            ...(actionsCap as CapabilityState | undefined),
            progress: desiredProgress,
            values: {
              ...(actionsCap?.values ?? {}),
              selections: enabledNames,
              controlsByActionId: galileoActionControls.controlsByActionId,
              gatesByActionId: galileoActionControls.gatesByActionId,
            },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  }, [rows, galileoActionControls, agentId, agentDraft, updateAgentDraft]);

  // Reflect the enabled guardrails into the shared agent draft (security row).
  useEffect(() => {
    if (!agentId) return;
    // Every enabled guardrail counts toward what the overview shows, regardless
    // of which tier the Security screen is currently displaying.
    const enabledGuardrailNames = [
      ...advancedDefaultGroups.flatMap(group => group.items.filter(item => item.enabled).map(item => item.name)),
      ...advancedCustomItems.filter(item => item.enabled).map(item => item.name),
    ];
    const cap = agentDraft?.familyConfiguration.security;
    const rawSelections = cap?.values?.selections;
    const currentSelections = Array.isArray(rawSelections)
      ? rawSelections.filter((s): s is string => typeof s === 'string')
      : [];
    const desiredProgress = enabledGuardrailNames.length > 0 ? 'configured' : 'not_started';
    const rawCustomGuardrails = cap?.values?.customGuardrails;
    const customGuardrailsUnchanged = JSON.stringify(rawCustomGuardrails ?? [])
      === JSON.stringify(advancedCustomItems);
    const unchanged =
      cap?.progress === desiredProgress &&
      currentSelections.length === enabledGuardrailNames.length &&
      currentSelections.every((s, i) => s === enabledGuardrailNames[i]) &&
      customGuardrailsUnchanged;
    if (unchanged) return;
    updateAgentDraft(agentId, draft => {
      const securityCap = draft.familyConfiguration.security;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          security: {
            ...(securityCap as CapabilityState | undefined),
            progress: desiredProgress,
            values: {
              ...(securityCap?.values ?? {}),
              selections: enabledGuardrailNames,
              customGuardrails: advancedCustomItems,
            },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  }, [advancedDefaultGroups, advancedCustomItems, agentId, agentDraft, updateAgentDraft]);

  // Reflect the enabled knowledge bases into the shared agent draft (knowledge row).
  useEffect(() => {
    if (!agentId) return;
    const demoAgent = CISCO_LIVE_AGENTS.find((candidate) => candidate.id === agentId) ?? CISCO_LIVE_AGENTS[0];
    const enabledNames = demoAgent.knowledgeSources
      .filter((source) => !disabledKnowledge[source.name])
      .map((source) => source.name);
    const cap = agentDraft?.familyConfiguration.knowledge;
    const rawSelections = cap?.values?.selections;
    const currentSelections = Array.isArray(rawSelections)
      ? rawSelections.filter((s): s is string => typeof s === 'string')
      : [];
    const desiredProgress = enabledNames.length > 0 ? 'configured' : 'not_started';
    const unchanged =
      cap?.progress === desiredProgress &&
      currentSelections.length === enabledNames.length &&
      currentSelections.every((s, i) => s === enabledNames[i]);
    if (unchanged) return;
    updateAgentDraft(agentId, draft => {
      const knowledgeCap = draft.familyConfiguration.knowledge;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          knowledge: {
            ...(knowledgeCap as CapabilityState | undefined),
            progress: desiredProgress,
            values: { ...(knowledgeCap?.values ?? {}), selections: enabledNames },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  }, [disabledKnowledge, agentId, agentDraft, updateAgentDraft]);

  // Reflect the enabled AI memory sources into the shared agent draft (memory row).
  useEffect(() => {
    if (!agentId) return;
    const demoAgent = CISCO_LIVE_AGENTS.find((candidate) => candidate.id === agentId) ?? CISCO_LIVE_AGENTS[0];
    const enabledNames = demoAgent.memorySources
      .filter((source) => !disabledKnowledge[source.name])
      .map((source) => source.name);
    const cap = agentDraft?.familyConfiguration.memory;
    const rawSelections = cap?.values?.selections;
    const currentSelections = Array.isArray(rawSelections)
      ? rawSelections.filter((s): s is string => typeof s === 'string')
      : [];
    const desiredProgress = enabledNames.length > 0 ? 'configured' : 'not_started';
    const unchanged =
      cap?.progress === desiredProgress &&
      currentSelections.length === enabledNames.length &&
      currentSelections.every((s, i) => s === enabledNames[i]);
    if (unchanged) return;
    updateAgentDraft(agentId, draft => {
      const memoryCap = draft.familyConfiguration.memory;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          memory: {
            ...(memoryCap as CapabilityState | undefined),
            progress: desiredProgress,
            values: { ...(memoryCap?.values ?? {}), selections: enabledNames },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  }, [disabledKnowledge, agentId, agentDraft, updateAgentDraft]);

  const [actionVersionCache] = useState<Record<string, VersionMeta>>(
    () => buildSeededVersionCache(new Date().toISOString()),
  );
  const [deferredVersionUpdates, setDeferredVersionUpdates] = useState<Record<string, boolean>>({});
  const [showCapabilityEditModal, setShowCapabilityEditModal] = useState(false);
  const [editingCapabilityId, setEditingCapabilityId] = useState<number | null>(null);
  const [editingCapabilityName, setEditingCapabilityName] = useState('');
  const [editingCapabilityDescription, setEditingCapabilityDescription] = useState('');
  const [showCapabilityChangeSummary, setShowCapabilityChangeSummary] = useState(false);

  // Add action modal state
  const [showAddCapabilityModal, setShowAddCapabilityModal] = useState(false);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [addCapabilitySearch, setAddCapabilitySearch] = useState('');
  const [addCapabilityTab, setAddCapabilityTab] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [selectedIntegrationActions, setSelectedIntegrationActions] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    id: number | string;
    name: string;
    source: string;
    logo?: string;
    type?: string;
    currentVersion?: string;
    latestVersion?: string;
    updateStatus?: UpdateStatus;
    riskLevel?: RiskLevel;
    changeSummary?: string[];
    requiresConnectorReconfiguration?: boolean;
    lastCheckedAt?: string;
  } | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string>(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
  const [confirmedActions, setConfirmedActions] = useState<{
    id: number | string;
    name: string;
    source: string;
    connector: string;
    logo?: string;
    type?: string;
    currentVersion?: string;
    latestVersion?: string;
    updateStatus?: UpdateStatus;
    riskLevel?: RiskLevel;
    changeSummary?: string[];
    requiresConnectorReconfiguration?: boolean;
    lastCheckedAt?: string;
  }[]>([]);
  const [showAddCustomMenu, setShowAddCustomMenu] = useState(false);
  const addCustomBtnRef = useRef<HTMLButtonElement>(null);

  // Add actions dropdown menu
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // AI engine menu
  const [showAiEngineMenu, setShowAiEngineMenu] = useState(false);
  const [aiEngineSearch, setAiEngineSearch] = useState('');
  const aiEngineMenuRef = useRef<HTMLDivElement>(null);
  const [showCreateEngine, setShowCreateEngine] = useState(false);
  const [editingActionConnector, setEditingActionConnector] = useState<string | null>(null);
  const [requiresConnectorReconfiguration, setRequiresConnectorReconfiguration] = useState(false);
  const [showPendingChangeSummary, setShowPendingChangeSummary] = useState(false);
  const [showMcpBanner, setShowMcpBanner] = useState(true);

  useEffect(() => {
    if (!showAddCustomMenu) return;
    const handler = (e: MouseEvent) => {
      if (addCustomBtnRef.current && !addCustomBtnRef.current.contains(e.target as Node)) {
        setShowAddCustomMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddCustomMenu]);

  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  useEffect(() => {
    if (!showAiEngineMenu) return;
    const handler = (e: MouseEvent) => {
      if (aiEngineMenuRef.current && !aiEngineMenuRef.current.contains(e.target as Node)) {
        setShowAiEngineMenu(false);
        setAiEngineSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAiEngineMenu]);

  const closeAddModal = () => {
    setShowAddCapabilityModal(false);
    setSelectedIntegration(null);
    setSelectedIntegrationActions([]);
    setConfirmedActions([]);
    setPendingAction(null);
    setEditingActionConnector(null);
    setAddCapabilitySearch('');
    setAddCapabilityTab('all');
    setShowPendingChangeSummary(false);
    setRequiresConnectorReconfiguration(false);
    setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
  };

  const handleAddConfirm = () => {
    const newCapabilities = confirmedActions.map((a, idx) => ({
      id: capabilities.length + idx + 1,
      sourceActionId: a.id,
      name: a.name,
      type: 'Action' as const,
      enabled: true,
      currentVersion: a.currentVersion,
      latestVersion: a.latestVersion,
      updateStatus: a.updateStatus,
      riskLevel: a.riskLevel,
      changeSummary: a.changeSummary,
      requiresConnectorReconfiguration: a.requiresConnectorReconfiguration,
      lastCheckedAt: a.lastCheckedAt,
      description: `Imported from ${a.source}`,
    }));
    setCapabilities(prev => [...prev, ...newCapabilities]);
    setRows(prev => [
      ...prev,
      ...newCapabilities.map(cap => ({
        id: cap.id,
        actionId: getGalileoActionId(cap.sourceActionId, cap.name),
        name: cap.name,
        description: cap.description,
        enabled: true,
        actionType: cap.type,
        providerType: 'Custom',
        createdBy: 'System',
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
        }).replace(/\//g, '/'),
      })),
    ]);
    closeAddModal();
    showToast(`${newCapabilities.length} action${newCapabilities.length > 1 ? 's' : ''} added`);
  };

  const resolveVersionMeta = (actionId: number | string, actionName: string) => {
    return resolveVersionMetaFromCache(actionVersionCache, actionId, actionName);
  };

  const getActionBannerKey = (action: { id: number | string; latestVersion?: string }) => {
    return `${String(action.id)}:${action.latestVersion || 'unknown'}`;
  };

  const shouldShowVersionBanner = (action: { id: number | string; latestVersion?: string; updateStatus?: string }) => {
    if (!action) return false;
    const hasUpdate = action.updateStatus === 'updateAvailable' || action.updateStatus === 'incompatible';
    if (!hasUpdate) return false;
    return !deferredVersionUpdates[getActionBannerKey(action)];
  };

  const handleOpenCapabilityEdit = (cap: CapabilityRecord) => {
    const versionMeta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
    setEditingCapabilityId(cap.id);
    setEditingCapabilityName(cap.name || '');
    setEditingCapabilityDescription(cap.description || `Configure how ${cap.name} should be used by this agent.`);
    setShowCapabilityChangeSummary(false);
    setCapabilities((prev) =>
      prev.map((item) =>
        item.id === cap.id
          ? {
              ...item,
              currentVersion: item.currentVersion || versionMeta.currentVersion,
              latestVersion: item.latestVersion || versionMeta.latestVersion,
              updateStatus: item.updateStatus || versionMeta.updateStatus,
              riskLevel: item.riskLevel || versionMeta.riskLevel,
              changeSummary: item.changeSummary || versionMeta.changeSummary,
              requiresConnectorReconfiguration:
                item.requiresConnectorReconfiguration ?? versionMeta.requiresConnectorReconfiguration,
              lastCheckedAt: item.lastCheckedAt || versionMeta.lastCheckedAt,
            }
          : item,
      ),
    );
    setShowCapabilityEditModal(true);
  };

  const handleCloseCapabilityEdit = () => {
    setShowCapabilityEditModal(false);
    setEditingCapabilityId(null);
    setEditingCapabilityName('');
    setEditingCapabilityDescription('');
    setShowCapabilityChangeSummary(false);
  };

  const handleSaveCapabilityEdit = () => {
    if (editingCapabilityId === null) return;
    setCapabilities((prev) =>
      prev.map((cap) =>
        cap.id === editingCapabilityId
          ? { ...cap, name: editingCapabilityName, description: editingCapabilityDescription }
          : cap,
      ),
    );
    setRows((prev) =>
      prev.map((row) =>
        row.id === editingCapabilityId
          ? { ...row, name: editingCapabilityName, description: editingCapabilityDescription }
          : row,
      ),
    );
    handleCloseCapabilityEdit();
    showToast('Capability updated');
  };

  const handleUseLatestForCapability = () => {
    if (editingCapabilityId === null) return;
    setCapabilities((prev) =>
      prev.map((cap) => {
        if (cap.id !== editingCapabilityId) return cap;
        const latestMeta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
        return {
          ...cap,
          currentVersion: latestMeta.latestVersion,
          latestVersion: latestMeta.latestVersion,
          updateStatus: 'upToDate' as const,
          riskLevel: latestMeta.riskLevel,
          changeSummary: latestMeta.changeSummary,
          requiresConnectorReconfiguration: latestMeta.requiresConnectorReconfiguration,
          requiresReconfiguration: !!latestMeta.requiresConnectorReconfiguration,
          lastCheckedAt: latestMeta.lastCheckedAt,
        };
      }),
    );
    setShowCapabilityChangeSummary(false);
    showToast('Action updated to latest version');
  };

  const handleKeepCurrentForCapability = () => {
    if (!editingCapability) return;
    setDeferredVersionUpdates((prev) => ({ ...prev, [getActionBannerKey(editingCapability)]: true }));
    setShowCapabilityChangeSummary(false);
  };

  const editingCapability = capabilities.find((cap) => cap.id === editingCapabilityId) || null;
  const editingCapabilityVersionMeta = editingCapability
    ? resolveVersionMeta(editingCapability.sourceActionId ?? editingCapability.id, editingCapability.name)
    : DEFAULT_VERSION_META;
  const capabilityBannerTarget = editingCapability
    ? {
        id: editingCapability.sourceActionId ?? editingCapability.id,
        latestVersion: editingCapability.latestVersion || editingCapabilityVersionMeta.latestVersion,
        updateStatus: editingCapability.updateStatus || editingCapabilityVersionMeta.updateStatus,
      }
    : null;

  const mcpUpdateCount = useMemo(() => {
    return capabilities.filter((cap) => {
      const meta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
      return meta.updateStatus === 'updateAvailable' || meta.updateStatus === 'incompatible';
    }).length;
  }, [capabilities, resolveVersionMeta]);

  const galileoActionOptions = useMemo(
    () => rows.map(row => ({
      id: row.actionId,
      name: row.name,
      description: row.description,
    })),
    [rows],
  );
  const largeEventControl = galileoActionControls.controlsByActionId[GALILEO_ACTION_IDS.checkAvailability]
    ?.find(control => control.id === LARGE_EVENT_CONTROL_ID);

  const channelConfigurationValues = agentDraft?.familyConfiguration.channels?.values;
  const selectedChannels =
    (channelConfigurationValues?.selectedChannels as CustomerChannel[] | undefined) ?? [];
  const voiceLocation = typeof channelConfigurationValues?.voiceLocation === 'string'
    ? channelConfigurationValues.voiceLocation
    : '';
  const voicePhoneNumber = typeof channelConfigurationValues?.voicePhoneNumber === 'string'
    ? channelConfigurationValues.voicePhoneNumber
    : '';
  const voiceExtension = typeof channelConfigurationValues?.voiceExtension === 'string'
    ? channelConfigurationValues.voiceExtension
    : '';
  const configurationFingerprint = useMemo(
    () => JSON.stringify({
      profileForm,
      advancedDefaultGroups,
      advancedCustomItems,
      rows,
      galileoActionControls,
      disabledKnowledge,
      channelConfigurationValues,
    }),
    [
      profileForm,
      advancedDefaultGroups,
      advancedCustomItems,
      rows,
      galileoActionControls,
      disabledKnowledge,
      channelConfigurationValues,
    ],
  );
  const [savedConfigurationFingerprint, setSavedConfigurationFingerprint] = useState(configurationFingerprint);
  const savedAgentIdRef = useRef(agentId);

  useEffect(() => {
    if (savedAgentIdRef.current === agentId) return;
    savedAgentIdRef.current = agentId;
    setSavedConfigurationFingerprint(configurationFingerprint);
  }, [agentId, configurationFingerprint]);

  const hasUnsavedChanges = configurationFingerprint !== savedConfigurationFingerprint;
  const handleSaveConfiguration = () => {
    setSavedConfigurationFingerprint(configurationFingerprint);
    showToast('Configuration saved', 'success');
  };

  const requestedAgent = agents[agentId];
  useEffect(() => {
    if (requestedAgent && currentAgent?.id !== agentId) {
      selectAgent(agentId);
    }
  }, [agentId, currentAgent?.id, requestedAgent, selectAgent]);

  if (!requestedAgent && currentAgent?.id !== agentId) {
    return <Navigate to="/agents" replace />;
  }

  const agent = currentAgent?.id === agentId ? currentAgent : requestedAgent;
  if (!agent) return <Navigate to="/agents" replace />;

  const knowledgeDemoAgent = CISCO_LIVE_AGENTS.find((candidate) => candidate.id === agent.id) ?? CISCO_LIVE_AGENTS[0];
  const knowledgeBases = knowledgeDemoAgent.knowledgeSources;
  const memorySources = knowledgeDemoAgent.memorySources;

  const toggleAction = (id: number) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row)));
  };

  const deleteAction = (id: number) => {
    const deletedActionId = rows.find(row => row.id === id)?.actionId;
    setRows((prev) => prev.filter((row) => row.id !== id));
    setCapabilities((prev) => prev.filter((cap) => cap.id !== id));
    if (deletedActionId) {
      setGalileoActionControls((current) => {
        const controlsByActionId = Object.fromEntries(
          Object.entries(current.controlsByActionId)
            .filter(([actionId]) => actionId !== deletedActionId)
            .map(([actionId, controls]) => [
              actionId,
              controls.map(control => (
                control.steerToActionId === deletedActionId
                  ? { ...control, steerToActionId: undefined }
                  : control
              )),
            ]),
        );
        const gatesByActionId = Object.fromEntries(
          Object.entries(current.gatesByActionId).filter(([actionId, gate]) => (
            actionId !== deletedActionId && gate.sourceActionId !== deletedActionId
          )),
        );
        return { controlsByActionId, gatesByActionId };
      });
    }
  };

  const toggleChannel = (value: CustomerChannel) => {
    if (!agentId) return;
    updateAgentDraft(agentId, (draft) => {
      const channelsCap = draft.familyConfiguration.channels;
      const current = (channelsCap?.values?.selectedChannels as CustomerChannel[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((channel) => channel !== value)
        : [...current, value];
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          channels: {
            ...(channelsCap as CapabilityState | undefined),
            progress: next.length > 0 ? 'configured' : 'not_started',
            values: { ...(channelsCap?.values ?? {}), selectedChannels: next },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  };

  const updateVoiceChannelField = (
    field: 'voiceLocation' | 'voicePhoneNumber' | 'voiceExtension',
    value: string,
  ) => {
    if (!agentId) return;
    updateAgentDraft(agentId, (draft) => {
      const channelsCap = draft.familyConfiguration.channels;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          channels: {
            ...(channelsCap as CapabilityState | undefined),
            values: {
              ...(channelsCap?.values ?? {}),
              [field]: value,
            },
            updatedAt: new Date().toISOString(),
          } as CapabilityState,
        },
      };
    });
  };

  const prebuiltQuery = prebuiltSearch.trim().toLowerCase();
  const prebuiltItemMatches = (item: AdvancedGuardrailItem) =>
    !prebuiltQuery ||
    item.name.toLowerCase().includes(prebuiltQuery) ||
    item.description.toLowerCase().includes(prebuiltQuery);
  const prebuiltHasResults = advancedDefaultGroups.some(group => group.items.some(prebuiltItemMatches));
  const customItemMatches = (item: CustomGuardrailItem) =>
    !prebuiltQuery ||
    item.name.toLowerCase().includes(prebuiltQuery) ||
    item.description.toLowerCase().includes(prebuiltQuery);
  const visibleCustomItems = advancedCustomItems.filter(customItemMatches);
  // While searching, results span BOTH custom and prebuilt guardrails
  // regardless of the selected mode; only sections with matches are shown.
  const isGuardrailSearching = Boolean(prebuiltQuery);
  const showCustomSection = isGuardrailSearching
    ? visibleCustomItems.length > 0
    : guardrailMode === 'custom';
  const showPrebuiltSection = isGuardrailSearching
    ? prebuiltHasResults
    : guardrailMode === 'prebuilt';
  const noGuardrailSearchResults =
    isGuardrailSearching && visibleCustomItems.length === 0 && !prebuiltHasResults;
  const prebuiltEnabledCount = advancedDefaultGroups.reduce(
    (count, group) => count + group.items.filter(item => item.enabled).length,
    0,
  );
  const prebuiltTotalCount = advancedDefaultGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );
  const customProfileAppliedCount = Math.max(
    advancedCustomItems.filter(item => item.enabled).length,
    defaultCustomProfileState === 'generating' ? 1 : 0,
  );
  const customProfileCardCount = (defaultCustomProfileState === 'generating' ? 1 : 0) + advancedCustomItems.length;
  const customProfileLimit = 3;
  const customGuardrailCapacityLabel = `${customProfileAppliedCount} enabled · ${customProfileCardCount} of ${customProfileLimit} slots used`;
  const customProfileLimitReached = customProfileCardCount >= customProfileLimit;
  const createCustomProfileDisabled = !isPaidUser || customProfileLimitReached;

  const togglePrebuiltGroup = (groupId: AdvancedGroupId, open: boolean) => {
    setExpandedPrebuiltGroups(prev => {
      const next = new Set(prev);
      if (open) next.add(groupId); else next.delete(groupId);
      return next;
    });
  };

  const togglePrivacySection = (sectionId: string, open: boolean) => {
    setExpandedPrivacySections(prev => {
      const next = new Set(prev);
      if (open) next.add(sectionId); else next.delete(sectionId);
      return next;
    });
  };

  const setPrebuiltGuardrailsEnabled = (groupId: string, itemIds: string[], enabled: boolean) => {
    const itemIdSet = new Set(itemIds);

    setAdvancedDefaultGroups(prev => prev.map(gp =>
      gp.id === groupId
        ? {
            ...gp,
            items: gp.items.map(it => itemIdSet.has(it.id) ? { ...it, enabled } : it),
          }
        : gp,
    ));

    if (enabled) {
      setExpandedRails(prev => {
        const next = new Set(prev);
        itemIds.forEach(itemId => next.add(itemId));
        return next;
      });
    }
  };

  const renderProfileLogic = (profile: CustomGuardrailItem) => (
    <ProfileLogicSummary overview={profile.overview} />
  );

  const renderCustomGuardrailDirection = (item: CustomGuardrailItem, disabled = false) => (
    <div className="security-control-row custom-guardrail-direction-row">
      <label className="security-control-label">Direction</label>
      <RadioGroup
        name={`custom-direction-${item.id}`}
        value={item.direction}
        onChange={(value) => setAdvancedCustomItems(prev => prev.map(it =>
          it.id === item.id ? { ...it, direction: value as Direction } : it,
        ))}
        className="security-enforcement-control"
      >
        <Radio value="prompt" label="Prompt" disabled={disabled || !item.enabled || !isPaidUser} />
        <Radio value="response" label="Response" disabled={disabled || !item.enabled || !isPaidUser} />
        <Radio value="both" label="Both prompts and responses" disabled={disabled || !item.enabled || !isPaidUser} />
      </RadioGroup>
      <p className="security-control-help">
        Prompt checks customer requests. Response checks agent output. Both checks customer prompts and agent responses.
      </p>
    </div>
  );

  const renderCustomGuardrailAction = (item: CustomGuardrailItem) => (
    <div className="security-control-row">
      <label className="security-control-label">Action</label>
      <RadioGroup
        name={`custom-action-${item.id}`}
        value={item.action}
        onChange={(value) => setAdvancedCustomItems(prev => prev.map(it =>
          it.id === item.id ? { ...it, action: value as CustomGuardrailAction } : it,
        ))}
        className="security-enforcement-control"
      >
        <Radio value="monitor" label="Monitor" disabled={!item.enabled || !isPaidUser} />
        <Radio value="steer" label="Steer" disabled={!item.enabled || !isPaidUser} />
        <Radio value="block" label="Block" disabled={!item.enabled || !isPaidUser} />
      </RadioGroup>
      <p className="security-control-help">
        Monitor records a match. Steer guides the agent to a safer path. Block stops the prompt or response.
      </p>
    </div>
  );

  const renderAdvancedPrebuiltGuardrail = (group: AdvancedGuardrailGroup, item: AdvancedGuardrailItem) => (
    <GuardrailRail
      key={item.id}
      id={item.id}
      name={item.name}
      description={item.description}
      enabled={item.enabled}
      disabled={!isPaidUser}
      toggleLabel={`${item.enabled ? 'Disable' : 'Enable'} ${item.name} guardrail`}
      expanded={expandedRails.has(item.id)}
      onToggle={() => {
        if (!item.enabled) {
          if (!hasAcknowledgedAdvancedPricing) {
            setPendingAdvancedEnable({ groupId: group.id, itemIds: [item.id], label: item.name });
            return;
          }
          setPrebuiltGuardrailsEnabled(group.id, [item.id], true);
          showToast(`${item.name} guardrail enabled`, 'success');
          return;
        }
        setPrebuiltGuardrailsEnabled(group.id, [item.id], false);
      }}
      onExpandedChange={(open) => setExpandedRails(prev => {
        const next = new Set(prev);
        if (open) next.add(item.id); else next.delete(item.id);
        return next;
      })}
    >
      <div className="security-guardrail-controls">
        {item.id !== 'sec-code-detection' && (
          <div className="security-control-row">
            <label className="security-control-label">Sensitivity</label>
            <div className="security-slider-wrap">
              <Slider
                value={item.sensitivity}
                onChange={(v) => setAdvancedDefaultGroups(prev => prev.map(gp =>
                  gp.id === group.id
                    ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, sensitivity: v as number } : it) }
                    : gp
                ))}
                min={0}
                max={150}
                step={50}
                showTicks
                disabled={!item.enabled || !isPaidUser}
              />
              <div className="security-sensitivity-labels security-sensitivity-labels--four">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Very high</span>
              </div>
            </div>
          </div>
        )}
        <div className="security-control-row">
          <label className="security-control-label">Action</label>
          <RadioGroup
            name={`action-${item.id}`}
            value={item.enforcement}
            onChange={(v) => setAdvancedDefaultGroups(prev => prev.map(gp =>
              gp.id === group.id
                ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, enforcement: v as Enforcement, action: v === 'block' ? 'block' : 'allow' } : it) }
                : gp
            ))}
            className="security-enforcement-control"
          >
            <Radio value="monitor" label="Monitor" disabled={!item.enabled || !isPaidUser} />
            <Radio value="block" label="Block" disabled={!item.enabled || !isPaidUser} />
          </RadioGroup>
        </div>
        <div className="security-control-row">
          <label className="security-control-label">Direction</label>
          <RadioGroup
            name={`direction-${item.id}`}
            value={item.direction}
            onChange={(v) => setAdvancedDefaultGroups(prev => prev.map(gp =>
              gp.id === group.id
                ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, direction: v as Direction } : it) }
                : gp
            ))}
            className="security-enforcement-control"
          >
            <Radio value="prompt" label="Prompt" disabled={!item.enabled || !isPaidUser} />
            <Radio value="response" label="Response" disabled={!item.enabled || !isPaidUser} />
            <Radio value="both" label="Both prompts and responses" disabled={!item.enabled || !isPaidUser} />
          </RadioGroup>
        </div>
      </div>
    </GuardrailRail>
  );

  const renderCustomGuardrailRail = (item: CustomGuardrailItem) => (
    <GuardrailRail
      key={item.id}
      id={item.id}
      name={item.name}
      description={item.description}
      enabled={item.enabled}
      disabled={!isPaidUser}
      toggleLabel={`${item.enabled ? 'Disable' : 'Enable'} ${item.name} guardrail`}
      expanded={expandedRails.has(item.id)}
      onToggle={() => {
        const willEnable = !item.enabled;
        setAdvancedCustomItems(prev => prev.map(it => it.id === item.id ? { ...it, enabled: willEnable } : it));
        if (willEnable) {
          showToast(`${item.name} guardrail enabled`, 'success');
          setExpandedRails(prev => {
            const next = new Set(prev);
            next.add(item.id);
            return next;
          });
        }
      }}
      onExpandedChange={(open) => setExpandedRails(prev => {
        const next = new Set(prev);
        if (open) next.add(item.id); else next.delete(item.id);
        return next;
      })}
      headerActions={
        <CustomGuardrailActionMenu
          name={item.name}
          onEdit={() => { setEditingProfileId(item.id); setShowPolicyStudio(true); }}
          onDelete={() => setAdvancedCustomItems(prev => prev.filter(it => it.id !== item.id))}
        />
      }
    >
      <div className="security-guardrail-controls custom-guardrail-controls">
        {renderProfileLogic(item)}
        {renderCustomGuardrailAction(item)}
        {renderCustomGuardrailDirection(item)}
        <span className="custom-guardrail-panel-meta">
          <span>{item.createdBy}</span>
          <span className="custom-profile-card__meta-sep" aria-hidden="true" />
          <span>{item.createdAt}</span>
          {item.versions.length > 1 && (
            <span className="custom-profile-card__version-meta">
              <span className="custom-profile-card__meta-sep" aria-hidden="true" />
              <span>{item.versions.length} versions</span>
            </span>
          )}
        </span>
      </div>
    </GuardrailRail>
  );

  const headerActions = (
    <div className="action-config-v2-header-actions">
      {hasUnsavedChanges && (
        <Button type="button" onClick={handleSaveConfiguration}>
          Save
        </Button>
      )}
      <Button type="button" variant="secondary">
        <Icon name="chat" weight="bold" size="xs" />
        Preview
      </Button>
      <button type="button" className="action-config-v2-more-btn" aria-label="More options">
        <Icon name="more" weight="bold" size={20} />
      </button>
    </div>
  );

  const actionPageActions = activeSection === 'Action' ? (
    <div className="action-config-v2-action-actions">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="action-config-v2-recommended-btn"
        aria-haspopup="dialog"
        aria-expanded={showRecommendedControls}
        onClick={openRecommendedControls}
      >
        <Icon name="sparkle" weight="bold" size={18} />
        Recommend Controls
      </Button>
      <div className="add-action-menu-wrapper" ref={addMenuRef}>
        <button
          type="button"
          className="action-config-v2-add-btn"
          aria-haspopup="menu"
          aria-expanded={showAddMenu}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Icon name="plus" weight="bold" size={20} />
          Add actions
        </button>
        {showAddMenu && (
          <div className="add-action-menu" role="menu">
            <div className="add-action-menu-section">
              <div className="add-action-menu-header">Browse actions</div>
              <button
                type="button"
                role="menuitem"
                className="add-action-menu-item"
                onClick={() => { setShowAddMenu(false); setShowAddCapabilityModal(true); }}
              >
                <Icon name="extension-mobility" weight="bold" size={20} />
                Select available
              </button>
            </div>
            <div className="add-action-menu-divider" />
            <div className="add-action-menu-section">
              <div className="add-action-menu-header">Create new action</div>
              <button type="button" role="menuitem" className="add-action-menu-item" onClick={() => setShowAddMenu(false)}>
                <Icon name="next" weight="bold" size={20} />
                Transfer
              </button>
              <button
                type="button"
                role="menuitem"
                className="add-action-menu-item"
                onClick={() => { setShowAddMenu(false); setShowFulfillmentModal(true); }}
              >
                <Icon name="automation" weight="bold" size={20} />
                Fulfillment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : undefined;

  const securityPageActions = activeSection === 'Security' ? (
    searchOpen ? (
      <div className="security-prebuilt-search guardrails-header-search">
        <Input
          type="search"
          value={prebuiltSearch}
          onChange={(e) => setPrebuiltSearch(e.target.value)}
          placeholder="Search guardrails by name"
          aria-label="Search guardrails by name"
          leadingIcon="search"
          clearable
          autoFocus
          onClear={() => { setPrebuiltSearch(''); setSearchOpen(false); }}
          onBlur={() => { if (!prebuiltSearch.trim()) setSearchOpen(false); }}
        />
      </div>
    ) : (
      <Button
        variant="secondary"
        className="guardrails-search-toggle"
        aria-label="Search guardrails"
        onClick={() => setSearchOpen(true)}
      >
        <Icon name="search" weight="regular" size={16} />
      </Button>
    )
  ) : undefined;

  const pageActions = actionPageActions ?? securityPageActions;

  return (
    <div className="primary-content action-config-v2-page agent-workspace-page">
      <AgentHeader agent={agent} activeTab="configure" showPublishButton={false} showTabs={false} headerRight={headerActions} />
      <AgentWorkspacePageHeading title={pageTitle} actions={pageActions} />

      <div className="action-config-v2-shell">
        <div className="action-config-v2-card">

          {activeSection === 'Channels' && (
            <div className="v2-channels">
              <div className="v2-channels__intro">
                <p className="v2-channels__desc">Choose the customer channels this agent supports.</p>
              </div>
              <div className="v2-channels__grid">
                {EVA_CHANNEL_SELECTION_OPTIONS.map((option) => {
                  const active = selectedChannels.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`v2-channel-card${active ? ' v2-channel-card--active' : ''}`}
                      onClick={() => toggleChannel(option.value)}
                      aria-pressed={active}
                    >
                      {active && (
                        <span className="v2-channel-card__check" aria-hidden>
                          <Icon name="check" weight="bold" size={18} />
                        </span>
                      )}
                      <span className="v2-channel-card__icon">
                        <Icon name={option.icon} weight="bold" size={24} />
                      </span>
                      <span className="v2-channel-card__title">{option.title}</span>
                      <span className="v2-channel-card__desc">{option.description}</span>
                    </button>
                  );
                })}
              </div>
              {selectedChannels.includes('voice') && (
                <fieldset className="v2-voice-channel-fields">
                  <legend>Voice details</legend>
                  <p className="v2-voice-channel-fields__description">
                    Choose the location and phone number callers use to reach this agent.
                  </p>
                  <div className="v2-voice-channel-fields__grid">
                    <Dropdown
                      id="voice-location"
                      label="Location"
                      hint="Choose the location this agent supports"
                      options={VOICE_LOCATION_OPTIONS}
                      value={voiceLocation}
                      placeholder="Select location"
                      onChange={(value) => updateVoiceChannelField('voiceLocation', value)}
                    />
                    <Dropdown
                      id="voice-phone-number"
                      label="Phone number"
                      hint="Choose an available number for this agent"
                      options={VOICE_PHONE_NUMBER_OPTIONS}
                      value={voicePhoneNumber}
                      placeholder="Select phone number"
                      onChange={(value) => updateVoiceChannelField('voicePhoneNumber', value)}
                    />
                    <Input
                      id="voice-extension"
                      label="Extension"
                      hint="Optional, up to 8 digits"
                      value={voiceExtension}
                      placeholder="Enter extension"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      voiceInput={false}
                      onChange={(event) => updateVoiceChannelField('voiceExtension', event.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </fieldset>
              )}
            </div>
          )}

          {activeSection === 'Flow' && (
            <EmptyState
              global
              illustration="desert-open-results"
              title="No flow configured"
              description="Create a flow to define how this agent handles conversations across its deployed channels."
              actions={
                <Button variant="secondary">
                  <Icon name="plus" weight="bold" size={20} />
                  Create flow
                </Button>
              }
            />
          )}

          {activeSection === 'Profile' && (
            <>
            <div className="v2-profile-layout">
              <div className="v2-profile-form">
                <Input
                  label="Agent name"
                  required
                  value={profileForm.agentName}
                  onChange={(e) => updateProfileField('agentName', e.target.value)}
                />

                <div className="v2-profile-field-group">
                  <label className="v2-profile-label">
                    Time zone <span className="v2-profile-required">*</span>
                  </label>
                  <Dropdown
                    options={[
                      { value: 'Europe/London', label: 'Europe/London' },
                      { value: 'America/New_York', label: 'America/New_York' },
                      { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                      { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
                      { value: 'UTC', label: 'UTC' },
                    ]}
                    value={profileForm.timezone}
                    onChange={(val) => updateProfileField('timezone', val)}
                  />
                </div>

                <div className="v2-profile-field-group">
                  <label className="v2-profile-label">
                    Language <span className="v2-profile-required">*</span>
                  </label>
                  <Dropdown
                    options={PROFILE_LANGUAGE_OPTIONS}
                    value={profileForm.language}
                    onChange={(val) => updateProfileField('language', val)}
                  />
                </div>

                <div className="v2-profile-field-group">
                  <label className="v2-profile-label">
                    Voice name <span className="v2-profile-required">*</span>
                  </label>
                  <Dropdown
                    options={PROFILE_VOICE_OPTIONS}
                    value={profileForm.voiceName}
                    onChange={(val) => updateProfileField('voiceName', val)}
                  />
                </div>

                <div className="v2-profile-field-group" ref={aiEngineMenuRef}>
                  <label className="v2-profile-label">
                    AI engine <span className="v2-profile-required">*</span>
                  </label>
                  <button
                    type="button"
                    className="ai-engine-trigger"
                    onClick={() => setShowAiEngineMenu(!showAiEngineMenu)}
                  >
                    <span className="ai-engine-trigger-text">{profileForm.aiEngine}</span>
                    <Icon name="arrow-down" size={16} />
                  </button>

                  {showAiEngineMenu && (
                    <div className="ai-engine-menu">
                      <div className="ai-engine-menu-search">
                        <Icon name="search" size={16} />
                        <input
                          type="text"
                          className="ai-engine-menu-search-input"
                          placeholder="Search by name"
                          value={aiEngineSearch}
                          onChange={(e) => setAiEngineSearch(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="ai-engine-menu-section">
                        <div className="ai-engine-menu-header">System</div>
                        {aiEngines
                          .filter((e) => e.type === 'System')
                          .filter((e) => e.name.toLowerCase().includes(aiEngineSearch.toLowerCase()))
                          .map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              className={`ai-engine-menu-item${profileForm.aiEngine === e.name ? ' selected' : ''}`}
                              onClick={() => {
                                updateProfileField('aiEngine', e.name);
                                setShowAiEngineMenu(false);
                                setAiEngineSearch('');
                              }}
                            >
                              <span className="ai-engine-menu-item-icon ai-engine-menu-item-icon--system">
                                <Icon name="bot" size={20} />
                              </span>
                              <div className="ai-engine-menu-item-content">
                                <span className="ai-engine-menu-item-name">{e.name}</span>
                                <span className="ai-engine-menu-item-desc">{e.description}</span>
                              </div>
                              {profileForm.aiEngine === e.name && (
                                <Icon name="check" size={20} />
                              )}
                            </button>
                          ))}
                      </div>

                      <div className="ai-engine-menu-divider" />

                      <div className="ai-engine-menu-section">
                        <div className="ai-engine-menu-header">Custom</div>
                        {aiEngines
                          .filter((e) => e.type === 'Custom')
                          .filter((e) => e.name.toLowerCase().includes(aiEngineSearch.toLowerCase()))
                          .map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              className={`ai-engine-menu-item${profileForm.aiEngine === e.name ? ' selected' : ''}`}
                              onClick={() => {
                                updateProfileField('aiEngine', e.name);
                                setShowAiEngineMenu(false);
                                setAiEngineSearch('');
                              }}
                            >
                              <span className="ai-engine-menu-item-icon ai-engine-menu-item-icon--custom">
                                <Icon name="tools" size={20} />
                              </span>
                              <div className="ai-engine-menu-item-content">
                                <span className="ai-engine-menu-item-name">{e.name}</span>
                                <span className="ai-engine-menu-item-desc">{e.description}</span>
                              </div>
                              {profileForm.aiEngine === e.name && (
                                <Icon name="check" size={20} />
                              )}
                            </button>
                          ))}
                        {aiEngines.filter((e) => e.type === 'Custom').length === 0 && !aiEngineSearch && (
                          <div className="ai-engine-menu-item-empty">No custom engines</div>
                        )}
                      </div>

                      <div className="ai-engine-menu-footer">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowAiEngineMenu(false);
                            setAiEngineSearch('');
                            setShowCreateEngine(true);
                          }}
                        >
                          <Icon name="plus" weight="bold" size={16} />
                          Create new
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
            </>
          )}

          {activeSection === 'Instructions' && (
            <div className="instructions-section">
            <div className="instructions-layout">
              <aside className="instructions-sidebar">
                <ul className="instructions-guidelines">
                  <li>Describe what the agent does and which actions it can take.</li>
                  <li>Use markdown headers to organize role, goals, guardrails, and output rules.</li>
                  <li>Set the tone, personality, and response style for the agent.</li>
                  <li>Include error handling, escalation paths, and integration steps.</li>
                  <li>Insert dynamic content with {'{{variable}}'} syntax.</li>
                  <li>Try the optimize tool to tighten and restructure your instructions.</li>
                </ul>
              </aside>
              <div className="instructions-editor">
                <div className="instructions-toolbar">
                  <div className="instructions-toolbar-left">
                    <button type="button" className="instructions-toolbar-btn" aria-label="Bold"><Icon name="bold" weight="bold" size={16} /></button>
                    <button type="button" className="instructions-toolbar-btn" aria-label="Italic"><Icon name="italic" weight="bold" size={16} /></button>
                    <button type="button" className="instructions-toolbar-btn" aria-label="Underline"><Icon name="underline" weight="bold" size={16} /></button>
                    <button type="button" className="instructions-toolbar-btn" aria-label="Link"><Icon name="link" weight="bold" size={16} /></button>
                    <button type="button" className="instructions-toolbar-btn" aria-label="Table"><Icon name="table" weight="bold" size={16} /></button>
                    <span className="instructions-toolbar-divider" />
                    <button type="button" className="instructions-toolbar-pill" onClick={() => setShowExampleModal(true)}>
                      <Icon name="guide" weight="bold" size={16} />
                      Example
                    </button>
                    {optimizeAccepted && (
                      <button type="button" className="instructions-toolbar-pill" onClick={() => { updateProfileField('instructions', preOptimizeText); setOptimizeAccepted(false); showToast('Reverted to original instructions', 'success'); }}>
                        <Icon name="undo" weight="bold" size={16} />
                        Undo
                      </button>
                    )}
                  </div>
                  <button type="button" className="instructions-toolbar-pill instructions-optimize-btn" onClick={handleOptimize} disabled={!profileForm.instructions.trim()}>
                    <Icon name="sparkle" weight="bold" size={16} />
                    Optimize instructions
                  </button>
                </div>
                <Textarea
                  inputClassName="instructions-textarea"
                  placeholder="Set clear goals for your agent. Provide step-by-step instructions to help them succeed in reaching these targets."
                  value={profileForm.instructions}
                  onChange={(e) => updateProfileField('instructions', e.target.value)}
                  rows={12}
                />
                {optimizeAccepted && (
                  <div className="instructions-ai-footer">
                    <Icon name="check" weight="bold" size={14} color="var(--mds-color-theme-text-success-normal, var(--success-color))" /><span>AI Generated</span><span className="instructions-ai-divider">·</span><span>Is this helpful?</span>
                    <button type="button" className="instructions-feedback-btn" aria-label="Helpful"><Icon name="like" weight="bold" size={14} /></button>
                    <button type="button" className="instructions-feedback-btn" aria-label="Not helpful"><Icon name="dislike" weight="bold" size={14} /></button>
                  </div>
                )}
              </div>
              <aside className="instructions-optimize-card">
                <div className="instructions-optimize-header"><Icon name="sparkle" weight="bold" size={20} /><h3 className="instructions-optimize-title">Optimize summary</h3></div>
                {optimizeAccepted ? (
                  <div className="instructions-optimize-results">
                    <div className="optimize-results-section"><h4>What's been changed:</h4><ul>{acceptedSummary.changes.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                    <div className="optimize-results-section"><h4>Reasoning behind changes:</h4><ul>{acceptedSummary.reasoning.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                    <Button variant="secondary" size="sm" onClick={() => { updateProfileField('instructions', preOptimizeText); setOptimizeAccepted(false); showToast('Reverted to original instructions', 'success'); }}><Icon name="undo" weight="bold" size={16} />Undo</Button>
                  </div>
                ) : (
                  <div className="instructions-optimize-empty">
                    <Illustration name="cliff-open" size={140} />
                    <p className="instructions-optimize-hint">Improve your instructions with AI.</p>
                    <Button variant="secondary" size="sm" onClick={handleOptimize} disabled={!profileForm.instructions.trim()}>Optimize instructions</Button>
                  </div>
                )}
              </aside>
            </div>

            <div className="instructions-welcome">
              <div className="v2-profile-textarea-header">
                <label className="v2-profile-label">
                  Welcome message <span className="v2-profile-required">*</span>
                  <button type="button" className="v2-profile-info-btn" aria-label="Info">
                    <Icon name="info-badge" size={16} />
                  </button>
                </label>
                <button type="button" className="v2-profile-insert-example">Insert example</button>
              </div>
              <Textarea
                value={profileForm.welcomeMessage}
                onChange={(e) => updateProfileField('welcomeMessage', e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            </div>
          )}

          {activeSection === 'Security' && (
            <div className="guardrails-layout">
              <div className="guardrails-header">
                <p className="guardrails-subtitle">
                  Use adaptive guardrails for business-specific privacy, safety, and security rules. Use prebuilt guardrails for common risks. Triggered guardrails appear in Sessions.
                </p>
              </div>

              {!isGuardrailSearching && (
              <div className="security-tier-selector">
                <Card clickable selected={guardrailMode === 'custom'} onClick={() => setGuardrailMode('custom')} className="security-tier-card">
                  <CardBody>
                    <div className="security-tier-card-inner">
                      <Icon name="sparkle" weight="bold" size={24} />
                      <div className="security-tier-card-text">
                        <span className="security-tier-card-title">Adaptive guardrails</span>
                        <span className="security-tier-card-desc">Business-specific rules that protect this agent&apos;s guests, workflows, and policy boundaries.</span>
                        <span className="security-tier-card-count">{customGuardrailCapacityLabel}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card clickable selected={guardrailMode === 'prebuilt'} onClick={() => setGuardrailMode('prebuilt')} className="security-tier-card">
                  <CardBody>
                    <div className="security-tier-card-inner">
                      <Icon name="secure-circle" weight="bold" size={24} />
                      <div className="security-tier-card-text">
                        <span className="security-tier-card-title">Prebuilt guardrails</span>
                        <span className="security-tier-card-desc">Ready-to-use protection for common security, privacy, and safety risks.</span>
                        <span className="security-tier-card-count">{prebuiltEnabledCount} of {prebuiltTotalCount} enabled</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
              )}

              <section className="security-prebuilt-section">
                {showCustomSection && (
                <div className="security-prebuilt-toolbar">
                  <div className="security-prebuilt-toolbar-actions">
                    {customProfileLimitReached ? (
                      <Tooltip
                        content="You can create up to 3 adaptive guardrails for this agent. Delete a guardrail to create another."
                        placement="top"
                      >
                        <span
                          className="security-custom-profiles-create-tooltip-anchor"
                          tabIndex={0}
                          aria-label="Create adaptive guardrail unavailable. You can create up to 3 adaptive guardrails for this agent."
                        >
                          <Button
                            variant="primary"
                            disabled
                            onClick={() => { setEditingProfileId(null); setShowPolicyStudio(true); }}
                          >
                            <Icon name="plus" weight="bold" size={16} />Create guardrail
                          </Button>
                        </span>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="primary"
                        disabled={createCustomProfileDisabled}
                        onClick={() => { setEditingProfileId(null); setShowPolicyStudio(true); }}
                      >
                        <Icon name="plus" weight="bold" size={16} />Create guardrail
                      </Button>
                    )}
                  </div>
                </div>
                )}

                {!isPaidUser && (
                  <Banner
                    type="info"
                    title="Upgrade to Pro"
                    subtitle="Enable AI Defense guardrails for security, privacy, and safety coverage."
                  />
                )}

                <AccordionGroup type="contained" className="security-prebuilt-groups">
                  {showCustomSection && (
                    <AccordionItem
                      className="security-prebuilt-custom-item"
                      expanded={isGuardrailSearching || customSectionOpen}
                      onExpandedChange={setCustomSectionOpen}
                      title={
                        <div className="security-prebuilt-category-heading security-prebuilt-category-heading--custom">
                          <div className="security-prebuilt-category-copy">
                            <div className="security-prebuilt-category-title">
                              <Icon name="sparkle" weight="bold" size={18} />
                              <span>Adaptive guardrails</span>
                              <Badge variant="success" className="security-tier-badge">Powered by AI Defense</Badge>
                            </div>
                            <span className="security-prebuilt-category-meta">{customGuardrailCapacityLabel}</span>
                            <span className="security-prebuilt-category-desc">
                              Create rules for this agent&apos;s business-specific privacy, safety, and security risks. Adaptive guardrails can evaluate prompts, responses, or both.
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <div className="security-prebuilt-group-body security-prebuilt-group-body--custom">
                {((defaultCustomProfileState === 'generating' && !prebuiltQuery) || visibleCustomItems.length > 0) ? (
                  <AccordionGroup type="borderless" className="security-prebuilt-rail-list">
                    {defaultCustomProfileState === 'generating' && !prebuiltQuery && (
                      <div key="generating-custom-profile" className="accordion accordion--small accordion--borderless security-prebuilt-rail-item custom-guardrail-rail--generating">
                        <div className="security-rail-header">
                          <span className="security-guardrail-header-text">
                            <span className="security-guardrail-name">{DEFAULT_GENERATED_CUSTOM_PROFILE.name}</span>
                            <span className="security-guardrail-desc">{DEFAULT_GENERATED_CUSTOM_PROFILE.description}</span>
                          </span>
                        </div>
                        <div className="accordion__panel security-rail-panel">
                          <div className="accordion__panel-content security-guardrail-controls custom-guardrail-controls">
                            {renderProfileLogic(DEFAULT_GENERATED_CUSTOM_PROFILE)}
                            {renderCustomGuardrailDirection(DEFAULT_GENERATED_CUSTOM_PROFILE, true)}
                            <ProgressBar
                              value={defaultCustomProfileProgress}
                              label="Creating adaptive guardrail"
                              helperText="Drafting blocked, allowed, and edge-case rules for this agent."
                              showPercent
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {visibleCustomItems.map((item) => renderCustomGuardrailRail(item))}
                  </AccordionGroup>
                ) : prebuiltQuery ? (
                  <p className="security-prebuilt-no-results">
                    No guardrails match &ldquo;{prebuiltSearch.trim()}&rdquo;.
                  </p>
                ) : (
                  <div className="custom-profile-empty-hero">
                    <Icon name="document-create" weight="bold" size={22} />
                    <span>No adaptive guardrails. Create one for a business-specific privacy, safety, or security risk.</span>
                  </div>
                )}
                      </div>
                    </AccordionItem>
                  )}
                  {showPrebuiltSection && (
                    <div className="security-prebuilt-default-groups" role="group" aria-label="Prebuilt guardrails">
                      <div id="prebuilt-default-groups-panel" className="security-prebuilt-default-group-list">
                          {advancedDefaultGroups.map((group) => {
                    const sections = group.sections ?? [{
                      id: 'default',
                      label: 'AI Defense rules',
                      description: group.description,
                    }];
                    const sectionSummaries = group.sections?.map(section => {
                      const sectionItems = group.items.filter(item => item.sectionId === section.id);
                      const enabledCount = sectionItems.filter(item => item.enabled).length;
                      return {
                        ...section,
                        items: sectionItems,
                        enabledCount,
                        allEnabled: sectionItems.length > 0 && enabledCount === sectionItems.length,
                        partiallyEnabled: enabledCount > 0 && enabledCount < sectionItems.length,
                      };
                    });
                    const groupEnabledCount = group.items.filter(item => item.enabled).length;
                    const groupTotalCount = group.items.length;
                    const groupDisplayName = group.id.charAt(0).toUpperCase() + group.id.slice(1);
                    const groupOpen = prebuiltQuery ? true : expandedPrebuiltGroups.has(group.id);
                    const groupHeaderId = `prebuilt-${group.id}-header`;
                    const groupPanelId = `prebuilt-${group.id}-panel`;

                    if (prebuiltQuery && !group.items.some(prebuiltItemMatches)) return null;

                    return (
                      <div
                        key={group.id}
                        className="accordion accordion--small security-prebuilt-default-item"
                      >
                        <button
                          type="button"
                          id={groupHeaderId}
                          className="accordion__header"
                          aria-expanded={groupOpen}
                          aria-controls={groupPanelId}
                          onClick={() => togglePrebuiltGroup(group.id, !groupOpen)}
                        >
                          <span className="accordion__header-text">
                            <span className="security-prebuilt-category-heading">
                              <span className="security-prebuilt-category-copy">
                                <span className="security-prebuilt-category-title">
                                  <Icon name={group.icon as any} weight="bold" size={18} />
                                  <span>{groupDisplayName}</span>
                                </span>
                                <span className="security-prebuilt-category-meta">{groupEnabledCount} of {groupTotalCount} enabled</span>
                                <span className="security-prebuilt-category-desc">
                                  {group.description} <span className="text-link text-link--inline text-link--sm">Learn more about {groupDisplayName} guardrails.</span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span
                            aria-hidden
                            className={`accordion__chevron ${groupOpen ? 'accordion__chevron--open' : ''}`}
                          >
                            <Icon name="arrow-down" weight="bold" size="sm" />
                          </span>
                        </button>
                        {groupOpen && (
                          <div
                            id={groupPanelId}
                            role="region"
                            aria-labelledby={groupHeaderId}
                            className="accordion__panel"
                          >
                            <div className="accordion__panel-content security-prebuilt-group-body">
                              {sections.map((section) => {
                                const sectionSummary = sectionSummaries?.find(summary => summary.id === section.id);
                                const sectionItems = sectionSummary?.items ?? group.items;
                                const visibleSectionItems = sectionItems.filter(prebuiltItemMatches);
                                if (prebuiltQuery && visibleSectionItems.length === 0) return null;
                                const hideSectionHeading = (group.id === 'security' || group.id === 'safety') && section.id === 'default';
                                const sectionEnabledCount = sectionSummary?.enabledCount ?? sectionItems.filter(item => item.enabled).length;
                                const isSectionEnabled = sectionSummary?.allEnabled ?? (sectionItems.length > 0 && sectionEnabledCount === sectionItems.length);
                                const isSectionMixed = sectionSummary?.partiallyEnabled ?? false;
                                const sectionToggleLabel = `${isSectionEnabled ? 'Disable' : 'Enable'} ${section.label} guardrails`;
                                const sectionOpen = prebuiltQuery ? true : expandedPrivacySections.has(section.id);
                                const sectionHeaderId = `prebuilt-${group.id}-${section.id}-header`;
                                const sectionPanelId = `prebuilt-${group.id}-${section.id}-panel`;

                                if (hideSectionHeading) {
                                  return (
                                    <AccordionGroup key={section.id} type="borderless" className="security-prebuilt-rail-list">
                                      {visibleSectionItems.map((item) => renderAdvancedPrebuiltGuardrail(group, item))}
                                    </AccordionGroup>
                                  );
                                }

                                return (
                                  <div key={section.id} className="security-advanced-rule-section">
                                    <div className="security-advanced-rule-section-head">
                                      {group.id === 'privacy' && (
                                        <Toggle
                                          className={`security-advanced-rule-section-toggle${isSectionMixed ? ' security-advanced-rule-section-toggle--mixed' : ''}`}
                                          checked={isSectionEnabled}
                                          disabled={!isPaidUser || sectionItems.length === 0}
                                          aria-label={
                                            isSectionMixed
                                              ? `${section.label} guardrails partially enabled. ${sectionEnabledCount} of ${sectionItems.length} enabled`
                                              : sectionToggleLabel
                                          }
                                          onChange={() => {
                                            const sectionItemIds = sectionItems.map(item => item.id);

                                            if (isSectionEnabled) {
                                              setPrebuiltGuardrailsEnabled(group.id, sectionItemIds, false);
                                              return;
                                            }

                                            if (!hasAcknowledgedAdvancedPricing) {
                                              setPendingAdvancedEnable({
                                                groupId: group.id,
                                                itemIds: sectionItemIds,
                                                label: `${section.label} guardrails`,
                                              });
                                              return;
                                            }

                                            setPrebuiltGuardrailsEnabled(group.id, sectionItemIds, true);
                                            showToast(`${section.label} guardrails enabled`, 'success');
                                          }}
                                        />
                                      )}
                                      <button
                                        type="button"
                                        id={sectionHeaderId}
                                        className="security-advanced-rule-section-trigger"
                                        aria-expanded={sectionOpen}
                                        aria-controls={sectionPanelId}
                                        onClick={() => togglePrivacySection(section.id, !sectionOpen)}
                                      >
                                        <span className="security-advanced-rule-section-copy">
                                          <span className="security-advanced-rule-section-title">{section.label}</span>
                                          {sectionEnabledCount > 0 && (
                                            <span className="security-advanced-rule-section-count">
                                              {sectionEnabledCount} enabled
                                            </span>
                                          )}
                                          <span className="security-advanced-rule-section-desc">{section.description}</span>
                                        </span>
                                        <span
                                          aria-hidden
                                          className={`accordion__chevron ${sectionOpen ? 'accordion__chevron--open' : ''}`}
                                        >
                                          <Icon name="arrow-down" weight="bold" size="sm" />
                                        </span>
                                      </button>
                                    </div>
                                    {sectionOpen && (
                                      <div
                                        id={sectionPanelId}
                                        role="region"
                                        aria-labelledby={sectionHeaderId}
                                        className="security-advanced-rule-section-panel"
                                      >
                                        <AccordionGroup type="borderless" className="security-prebuilt-rail-list">
                                          {visibleSectionItems.map((item) => renderAdvancedPrebuiltGuardrail(group, item))}
                                        </AccordionGroup>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                          })}
                      </div>
                    </div>
                  )}
                </AccordionGroup>
                {noGuardrailSearchResults && (
                  <p className="security-prebuilt-no-results">
                    No guardrails match &ldquo;{prebuiltSearch.trim()}&rdquo;.
                  </p>
                )}
              </section>
            </div>
          )}

          {activeSection === 'Knowledge' && (
            <div className="knowledge-config">
              <div className="knowledge-config-section">
                <div className="knowledge-config-heading">
                  <div>
                    <h3>Knowledge bases</h3>
                    <p>Sources your agent can search to answer questions.</p>
                  </div>
                  <button type="button" className="action-config-v2-add-btn">
                    <Icon name="plus" weight="bold" size={20} />
                    Add knowledge
                  </button>
                </div>
                <div className="action-config-v2-table-wrap">
                  <table className="action-config-v2-table knowledge-config-table">
                    <thead>
                      <tr>
                        <th className="col-knowledge-toggle" aria-label="Enabled" />
                        <th className="col-knowledge-name">Name</th>
                        <th className="col-knowledge-description">Description</th>
                        <th className="col-knowledge-sources">Sources</th>
                        <th className="col-knowledge-status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {knowledgeBases.map((source) => (
                        <tr key={source.name}>
                          <td className="col-knowledge-toggle">
                            <Toggle
                              checked={!disabledKnowledge[source.name]}
                              onChange={() => toggleKnowledge(source.name)}
                              size="compact"
                              aria-label={`Toggle ${source.name}`}
                            />
                          </td>
                          <td className="col-knowledge-name">
                            <div className="knowledge-config-name">
                              <Icon name="document" weight="bold" size={18} />
                              <span>{source.name}</span>
                            </div>
                          </td>
                          <td className="col-knowledge-description">{source.description}</td>
                          <td className="col-knowledge-sources">{source.sources}</td>
                          <td className="col-knowledge-status">
                            <Badge variant="success">Connected</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="knowledge-config-section">
                <div className="knowledge-config-heading">
                  <div>
                    <h3>AI memory</h3>
                    <p>What your agent remembers across conversations to personalize responses.</p>
                  </div>
                </div>
                <div className="action-config-v2-table-wrap">
                  <table className="action-config-v2-table knowledge-config-table">
                    <thead>
                      <tr>
                        <th className="col-knowledge-toggle" aria-label="Enabled" />
                        <th className="col-knowledge-name">Name</th>
                        <th className="col-knowledge-description">Description</th>
                        <th className="col-knowledge-status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memorySources.map((source) => (
                        <tr key={source.name}>
                          <td className="col-knowledge-toggle">
                            <Toggle
                              checked={!disabledKnowledge[source.name]}
                              onChange={() => toggleKnowledge(source.name)}
                              size="compact"
                              aria-label={`Toggle ${source.name}`}
                            />
                          </td>
                          <td className="col-knowledge-name">
                            <div className="knowledge-config-name">
                              <Icon name="mind-map" weight="bold" size={18} />
                              <span>{source.name}</span>
                            </div>
                          </td>
                          <td className="col-knowledge-description">{source.description}</td>
                          <td className="col-knowledge-status">
                            <Badge variant="success">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'Language' && (
            <EmptyState
              global
              illustration="campfire-gather"
              title="No languages configured"
              description="Add language support so your agent can communicate with users in their preferred language."
              actions={
                <Button variant="secondary">
                  <Icon name="plus" weight="bold" size={20} />
                  Add language
                </Button>
              }
            />
          )}

          {activeSection === 'Action' && showMcpBanner && mcpUpdateCount > 0 && (
            <Banner
              type="info"
              title="Action updated"
              subtitle={
                <>
                  {mcpUpdateCount} action{mcpUpdateCount !== 1 ? 's' : ''} got updated by admin. Review the{' '}
                  <Link to={`/agents/${agent.id}/history`}>History</Link> to track updates made by the admin.
                </>
              }
              onDismiss={() => setShowMcpBanner(false)}
            />
          )}

          {activeSection === 'Action' && (
          <div className="action-config-v2-table-wrap action-config-v2-table-wrap--actions">
            <table className="action-config-v2-table action-config-v2-table--actions">
              <thead>
                <tr>
                  <th className="col-action-name">Action name</th>
                  <th className="col-recurring" aria-label="Status" />
                  <th className="col-created-by">Created by</th>
                  <th className="col-description">Description</th>
                  <th className="col-last-updated">Last updated</th>
                  <th className="col-action-type">Action type</th>
                  <th className="col-provider-type">Provider type</th>
                  <th className="col-galileo">Controls</th>
                  <th className="col-row-actions" aria-label="Row actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const cap = capabilities.find((c) => c.id === row.id);
                  const versionMeta = cap
                    ? resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name)
                    : DEFAULT_VERSION_META;
                  const hasUpdate =
                    versionMeta.updateStatus === 'updateAvailable' ||
                    versionMeta.updateStatus === 'incompatible';
                  const galileoStatus = getGalileoActionStatus(row.actionId, galileoActionControls);
                  const galileoButtonColor: 'default' | 'positive' | 'accent' = galileoStatus.tone === 'active'
                    ? 'positive'
                    : galileoStatus.tone === 'gated' || galileoStatus.tone === 'draft'
                      ? 'accent'
                      : 'default';
                  return (
                    <tr key={row.id} className={!row.enabled ? 'row-disabled' : ''}>
                      <td className="col-action-name">
                        <div className="action-config-v2-row-name">
                          <Toggle checked={row.enabled} onChange={() => toggleAction(row.id)} size="compact" />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="col-recurring">
                        {hasUpdate && (
                          <Tooltip
                            placement="bottom-start"
                            interactive
                            content={
                              <>
                                This action is unavailable because your admin has disabled it. Check the{' '}
                                <a href={`/agents/${agent.id}/history`}>History</a> for more details.
                              </>
                            }
                            action={{ label: 'Got it' }}
                          >
                            <span className="action-config-v2-update-icon">
                              <Icon name="recurring" weight="bold" size={16} />
                            </span>
                          </Tooltip>
                        )}
                      </td>
                      <td className="col-created-by">{row.createdBy}</td>
                      <td className="col-description">{row.description}</td>
                      <td className="col-last-updated">{row.lastUpdated}</td>
                      <td className="col-action-type">{row.actionType}</td>
                      <td className="col-provider-type">{row.providerType}</td>
                      <td className="col-galileo">
                        <Button
                          type="button"
                          variant="secondary"
                          color={galileoButtonColor}
                          size="sm"
                          className={`galileo-action-control-button is-${galileoStatus.tone}`}
                          aria-label={`${row.name}: Galileo ${galileoStatus.label}`}
                          aria-haspopup="dialog"
                          onClick={() => openGalileoActionControls(row.actionId)}
                        >
                          <Icon name="automation" weight="bold" size={16} />
                          <span className="galileo-action-control-button__label">
                            {galileoStatus.label}
                          </span>
                        </Button>
                      </td>
                      <td className="col-row-actions">
                        <ActionRowMenu
                          name={row.name}
                          onEdit={() => {
                            const foundCap = capabilities.find((capability) => capability.id === row.id);
                            if (foundCap) handleOpenCapabilityEdit(foundCap);
                          }}
                          onDelete={() => deleteAction(row.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {showRecommendedControls && (
        <RecommendedActionControlsDialog
          actions={galileoActionOptions}
          state={galileoActionControls}
          onAdd={(control) => {
            setGalileoActionControls(current => addRecommendedGalileoControl(current, control));
            showToast('Recommended control added for review', 'success');
          }}
          onClose={closeRecommendedControls}
        />
      )}

      {galileoDialogActionId && (
        <ActionControlManagerDialog
          actionId={galileoDialogActionId}
          actions={galileoActionOptions}
          state={galileoActionControls}
          onChange={(next) => {
            setGalileoActionControls(next);
            showToast('Galileo action controls updated', 'success');
          }}
          onClose={closeGalileoActionControls}
        />
      )}

      {showCapabilityEditModal && createPortal(
        <div className="capability-edit-overlay" onClick={handleCloseCapabilityEdit}>
          <div className="capability-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="capability-edit-header">
              <div className="capability-edit-header-content">
                <h2 className="capability-edit-title">{editingCapabilityName || 'Edit capability'}</h2>
                <p className="capability-edit-subtitle">
                  Enable your AI agent to connect with external systems and perform more complex tasks.
                </p>
              </div>
              <button className="capability-edit-close" onClick={handleCloseCapabilityEdit} aria-label="Close">
                <Icon name="cancel" weight="bold" size="md" />
              </button>
            </div>

            {capabilityBannerTarget && shouldShowVersionBanner(capabilityBannerTarget) && (
              <div className={`action-version-banner ${editingCapabilityVersionMeta.updateStatus === 'incompatible' ? 'breaking' : ''}`}>
                <div className="action-version-banner-top">
                  <div className="action-version-banner-title">
                    {editingCapabilityVersionMeta.updateStatus === 'incompatible'
                      ? 'This action was updated with potential breaking changes'
                      : 'This action was updated. Do you want to use the most recent version?'}
                  </div>
                  <div className="action-version-banner-cta">
                    <button className="action-version-link-btn" onClick={() => setShowCapabilityChangeSummary((prev) => !prev)}>
                      {showCapabilityChangeSummary ? 'Hide changes' : 'View changes'}
                    </button>
                    <button className="action-version-link-btn" onClick={handleKeepCurrentForCapability}>
                      Keep current
                    </button>
                    <button className="action-version-primary-btn" onClick={handleUseLatestForCapability}>
                      Use latest
                    </button>
                  </div>
                </div>
                <div className="action-version-banner-meta">
                  Version: {editingCapability?.currentVersion || editingCapabilityVersionMeta.currentVersion} {'->'} {editingCapabilityVersionMeta.latestVersion}
                  <span className={`action-version-risk-badge ${editingCapabilityVersionMeta.riskLevel}`}>
                    {editingCapabilityVersionMeta.riskLevel === 'breaking' ? 'Breaking' : editingCapabilityVersionMeta.riskLevel === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>
                {showCapabilityChangeSummary && (
                  <ul className="action-version-change-list">
                    {(editingCapabilityVersionMeta.changeSummary || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="capability-edit-main">
              <div className="capability-edit-section">
                <h3 className="capability-edit-section-title">General information</h3>
                <div className="capability-edit-card">
                  <div className="capability-edit-field">
                    <label>MCP server name</label>
                    <div className="capability-edit-field-value">
                      {editingCapability?.type === 'MCP' ? 'Salesforce' : 'Webex Action Service'}
                    </div>
                  </div>

                  <div className="capability-edit-field">
                    <label>Action name</label>
                    <input
                      type="text"
                      value={editingCapabilityName}
                      onChange={(e) => setEditingCapabilityName(e.target.value)}
                    />
                  </div>

                  <div className="capability-edit-field">
                    <label>Action description</label>
                    <textarea
                      rows={3}
                      value={editingCapabilityDescription}
                      disabled
                      onChange={(e) => setEditingCapabilityDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="capability-edit-section">
                <h3 className="capability-edit-section-title">Slot filling</h3>
                <p className="capability-edit-slot-hint">See the information that will be gathered.</p>
                <div className="capability-edit-card capability-edit-table-wrap">
                  <table className="capability-edit-table">
                    <thead>
                      <tr>
                        <th>Entity name</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Description</th>
                        <th>Example</th>
                        <th>Required</th>
                        <th>Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Customer ID</td>
                        <td>Digits</td>
                        <td>6</td>
                        <td>A series of digits of the given length</td>
                        <td>123456</td>
                        <td>Yes</td>
                        <td>&#x270E;</td>
                      </tr>
                      <tr>
                        <td>Email</td>
                        <td>Email</td>
                        <td>{'\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*'}</td>
                        <td>A valid email address</td>
                        <td>test.user@company.com</td>
                        <td>No</td>
                        <td>&#x270E;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="capability-edit-footer">
              <Button variant="secondary" onClick={handleCloseCapabilityEdit}>Cancel</Button>
              <Button onClick={handleSaveCapabilityEdit}>Update</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddCapabilityModal && createPortal(
        <div className="add-capability-overlay" onClick={closeAddModal}>
          <div className="add-capability-modal" onClick={(e) => e.stopPropagation()}>
            {selectedIntegration && addCapabilityTab === 'integration' ? (
              <>
                <div className="add-capability-header">
                  <div className="add-capability-header-content">
                    <h2 className="add-capability-title">
                      {INTEGRATIONS.find(i => i.id === selectedIntegration)?.name}: select an action
                    </h2>
                    <p className="add-capability-subtitle">Find an action you need to instruct your AI agent</p>
                  </div>
                  <button className="add-capability-close" onClick={closeAddModal}>
                    <Icon name="cancel" weight="bold" size="md" />
                  </button>
                </div>

                <div className="add-capability-search-row">
                  <div className="add-capability-search">
                    <Icon name="search" weight="bold" size="sm" className="add-capability-search-icon" />
                    <input
                      type="text"
                      placeholder={`Search ${INTEGRATIONS.find(i => i.id === selectedIntegration)?.name} actions`}
                      value={addCapabilitySearch}
                      onChange={(e) => setAddCapabilitySearch(e.target.value)}
                    />
                  </div>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All nodes' },
                      { value: 'actions', label: 'Actions only' },
                      { value: 'triggers', label: 'Triggers only' },
                    ]}
                    value="all"
                    onChange={() => {}}
                    className="add-capability-filter-dropdown"
                  />
                </div>

                <div className="add-capability-list">
                  {INTEGRATIONS.find(i => i.id === selectedIntegration)?.actions
                    .filter(action =>
                      addCapabilitySearch === '' ||
                      action.name.toLowerCase().includes(addCapabilitySearch.toLowerCase()) ||
                      action.description.toLowerCase().includes(addCapabilitySearch.toLowerCase())
                    )
                    .map(action => {
                      const isSelected = confirmedActions.some(a => a.id === action.id);
                      const isPending = pendingAction?.id === action.id;
                      return (
                        <div
                          key={action.id}
                          className={`add-capability-item ${isSelected ? 'selected disabled' : ''} ${isPending ? 'pending' : ''}`}
                          onClick={() => {
                            if (isSelected || isPending) return;
                            const vm = resolveVersionMeta(action.id, action.name);
                            const integ = INTEGRATIONS.find(i => i.id === selectedIntegration);
                            setPendingAction({
                              id: action.id,
                              name: action.name,
                              source: integ?.name || '',
                              logo: integ?.logo,
                              type: 'Action',
                              currentVersion: vm.currentVersion,
                              latestVersion: vm.latestVersion,
                              updateStatus: vm.updateStatus,
                              riskLevel: vm.riskLevel,
                              changeSummary: vm.changeSummary,
                              requiresConnectorReconfiguration: vm.requiresConnectorReconfiguration,
                              lastCheckedAt: vm.lastCheckedAt,
                            });
                            setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
                            setRequiresConnectorReconfiguration(false);
                            setShowPendingChangeSummary(false);
                          }}
                        >
                          <div className={`add-capability-item-checkbox ${isSelected ? 'disabled' : ''} ${isPending ? 'pending' : ''}`}>
                            {(isSelected || isPending) && (
                              <Icon name="check" weight="bold" size="xs" />
                            )}
                          </div>
                          <div className="add-capability-item-info">
                            <div className="add-capability-item-name">
                              {action.name}
                              <Icon name="info-circle" weight="bold" size={14} className="add-capability-item-info-icon" />
                            </div>
                            <div className="add-capability-item-meta">{action.description}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Selected chips + connector picker (integration detail) */}
                <div className="add-capability-selected-section">
                  <div className="add-capability-selected">
                    Select ({confirmedActions.length}/9)
                    <Icon name="info-circle" weight="bold" size={14} className="add-capability-selected-info" />
                  </div>

                  {confirmedActions.length > 0 && (
                    <div className="add-capability-chips">
                      {confirmedActions.map(action => (
                        <button
                          key={action.id}
                          className={`add-capability-chip ${editingActionConnector === action.id ? 'editing' : ''} ${action.requiresConnectorReconfiguration ? 'requires-reconfiguration' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActionConnector(action.id as string);
                            setPendingAction({ id: action.id as any, name: action.name, source: action.source, logo: action.logo, type: action.type, currentVersion: action.currentVersion, latestVersion: action.latestVersion, updateStatus: action.updateStatus, riskLevel: action.riskLevel, changeSummary: action.changeSummary, requiresConnectorReconfiguration: action.requiresConnectorReconfiguration, lastCheckedAt: action.lastCheckedAt });
                            setSelectedConnector(action.connector);
                            setRequiresConnectorReconfiguration(!!action.requiresConnectorReconfiguration);
                            setShowPendingChangeSummary(false);
                          }}
                        >
                          {action.name}
                          <span className="add-capability-chip-close" onClick={(e) => { e.stopPropagation(); setConfirmedActions(prev => prev.filter(a => a.id !== action.id)); }}>
                            <Icon name="cancel" weight="bold" size="xs" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {pendingAction && !editingActionConnector && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className={`add-capability-connector-inline-logo logo-${pendingAction.logo || 'default'}`}>
                          {pendingAction.logo === 'salesforce' && (<svg width="24" height="16" viewBox="0 0 24 16" fill="none"><path d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z" fill="#00A1E0"/></svg>)}
                          {pendingAction.logo === 'servicenow' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#81B5A1"/><path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>)}
                          {pendingAction.logo === 'zendesk' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#03363D"/><path d="M6 8l12 8M6 16V8M18 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
                          {pendingAction.logo === 'infinitus' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#4F46E5"/><path d="M7 12c0-2.2 1.8-3 3-3s2 1.3 2 3-1.8 3-3 3-2-1.3-2-3zm5 0c0-2.2 1.8-3 3-3s2 1.3 2 3-1.8 3-3 3-2-1.3-2-3z" fill="white"/></svg>)}
                          {!pendingAction.logo && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#666"/><path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>)}
                        </div>
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">From {pendingAction.source} · {pendingAction.type || 'Action'}</span>
                        </div>
                        <button className="add-capability-connector-inline-cancel" onClick={() => { setPendingAction(null); setShowPendingChangeSummary(false); setRequiresConnectorReconfiguration(false); setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || ''); }}>
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({ value: c.id, label: c.name + (c.isDefault ? ' (Default)' : '') }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => [...prev, { id: pendingAction.id, name: pendingAction.name, source: pendingAction.source, logo: pendingAction.logo, type: pendingAction.type, connector: selectedConnector, currentVersion: pendingAction.currentVersion, latestVersion: pendingAction.latestVersion, updateStatus: pendingAction.updateStatus, riskLevel: pendingAction.riskLevel, changeSummary: pendingAction.changeSummary, requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration, lastCheckedAt: pendingAction.lastCheckedAt }]);
                              setPendingAction(null);
                              setRequiresConnectorReconfiguration(false);
                              setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
                            }}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingActionConnector && pendingAction && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className={`add-capability-connector-inline-logo logo-${pendingAction.logo || 'default'}`}>
                          {pendingAction.logo === 'salesforce' && (<svg width="24" height="16" viewBox="0 0 24 16" fill="none"><path d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z" fill="#00A1E0"/></svg>)}
                          {pendingAction.logo === 'servicenow' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#81B5A1"/><path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>)}
                          {pendingAction.logo === 'zendesk' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#03363D"/><path d="M6 8l12 8M6 16V8M18 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
                          {pendingAction.logo === 'infinitus' && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#4F46E5"/><path d="M7 12c0-2.2 1.8-3 3-3s2 1.3 2 3-1.8 3-3 3-2-1.3-2-3zm5 0c0-2.2 1.8-3 3-3s2 1.3 2 3-1.8 3-3 3-2-1.3-2-3z" fill="white"/></svg>)}
                          {!pendingAction.logo && (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#666"/><path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>)}
                        </div>
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">From {pendingAction.source} · {pendingAction.type || 'Action'}</span>
                        </div>
                        <button className="add-capability-connector-inline-cancel" onClick={() => { setEditingActionConnector(null); setPendingAction(null); setShowPendingChangeSummary(false); setRequiresConnectorReconfiguration(false); }}>
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({ value: c.id, label: c.name + (c.isDefault ? ' (Default)' : '') }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => prev.map(a => a.id === editingActionConnector ? { ...a, connector: selectedConnector, currentVersion: pendingAction.currentVersion, latestVersion: pendingAction.latestVersion, updateStatus: pendingAction.updateStatus, riskLevel: pendingAction.riskLevel, changeSummary: pendingAction.changeSummary, requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration, lastCheckedAt: pendingAction.lastCheckedAt } : a));
                              setEditingActionConnector(null);
                              setPendingAction(null);
                            }}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="add-capability-footer">
                  <button className="add-capability-back-btn" onClick={() => { setSelectedIntegration(null); setAddCapabilitySearch(''); }}>Back</button>
                  <div className="add-capability-footer-actions">
                    <Button variant="secondary" onClick={closeAddModal}>Cancel</Button>
                    <Button disabled={confirmedActions.length === 0} onClick={handleAddConfirm}>Select action</Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="add-capability-header">
                  <h2 className="add-capability-title">Add actions</h2>
                  <button className="add-capability-close" onClick={closeAddModal}>
                    <Icon name="cancel" weight="bold" size="md" />
                  </button>
                </div>

                <div className="add-capability-search-row">
                  <div className="add-capability-search">
                    <Icon name="search" weight="bold" size="sm" className="add-capability-search-icon" />
                    <input
                      type="text"
                      placeholder="Search by action name, description, or provider name"
                      value={addCapabilitySearch}
                      onChange={(e) => setAddCapabilitySearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="add-capability-tabs">
                  {(['all', 'integration', 'mcp'] as const).map(tab => (
                    <button key={tab} className={`add-capability-tab ${addCapabilityTab === tab ? 'active' : ''}`} onClick={() => setAddCapabilityTab(tab)}>
                      {tab === 'all' ? 'All' : tab === 'integration' ? 'Integration' : 'MCP'}
                    </button>
                  ))}
                </div>

                {addCapabilityTab === 'integration' && (
                  <div className="add-capability-list">
                    {INTEGRATIONS
                      .filter(integration => addCapabilitySearch === '' || integration.name.toLowerCase().includes(addCapabilitySearch.toLowerCase()))
                      .map(integration => (
                        <div key={integration.id} className="add-capability-item add-capability-item-clickable" onClick={() => { setSelectedIntegration(integration.id); setAddCapabilitySearch(''); }}>
                          <div className={`add-capability-item-logo logo-${integration.logo}`}>
                            {integration.logo === 'salesforce' && (
                              <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><path d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z" fill="#00A1E0"/></svg>
                            )}
                            {integration.logo === 'servicenow' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#81B5A1"/><path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                            )}
                            {integration.logo === 'zendesk' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#03363D"/><path d="M6 8l6 4-6 4V8zM18 8v8l-6-4 6-4z" fill="#78A300"/></svg>
                            )}
                          </div>
                          <div className="add-capability-item-info">
                            <div className="add-capability-item-name">{integration.name}</div>
                            <div className="add-capability-item-meta">{integration.description}</div>
                          </div>
                          <Icon name="arrow-right" weight="bold" size="sm" className="add-capability-item-arrow" />
                        </div>
                      ))}
                  </div>
                )}

                {addCapabilityTab !== 'integration' && (
                  <div className="add-capability-list">
                    {(addCapabilityTab === 'mcp' ? MCP_SERVERS : AVAILABLE_ACTIONS)
                      .filter(item =>
                        addCapabilitySearch === '' ||
                        item.name.toLowerCase().includes(addCapabilitySearch.toLowerCase()) ||
                        item.source.toLowerCase().includes(addCapabilitySearch.toLowerCase())
                      )
                      .map(item => {
                        const isSelected = confirmedActions.some(a => a.id === item.id);
                        const toggleItem = () => {
                          if (isSelected) {
                            setConfirmedActions(prev => prev.filter(a => a.id !== item.id));
                          } else {
                            const maxActions = 9;
                            if (confirmedActions.length >= maxActions) return;
                            const vm = resolveVersionMeta(item.id, item.name);
                            setConfirmedActions(prev => [
                              ...prev,
                              {
                                id: item.id,
                                name: item.name,
                                source: item.source,
                                connector: APP_CONNECTORS.find(c => c.isDefault)?.id || '',
                                logo: (item as any).logo,
                                type: (item as any).type || (item as any).category,
                                currentVersion: vm.currentVersion,
                                latestVersion: vm.latestVersion,
                                updateStatus: vm.updateStatus,
                                riskLevel: vm.riskLevel,
                                changeSummary: vm.changeSummary,
                                requiresConnectorReconfiguration: vm.requiresConnectorReconfiguration,
                                lastCheckedAt: vm.lastCheckedAt,
                              },
                            ]);
                          }
                        };
                        return (
                          <div
                            key={item.id}
                            className={`add-capability-item${isSelected ? ' selected' : ''}`}
                            onClick={toggleItem}
                          >
                            <div className={`add-capability-item-checkbox${isSelected ? ' checked' : ''}`}>
                              {isSelected && <Icon name="check" weight="bold" size="xs" />}
                            </div>
                            <div className={`add-capability-item-logo logo-${item.logo}`}>
                              {item.logo === 'infermedica' && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0066FF"/><path d="M10 16l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
                              {item.logo === 'salesforce' && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#00A1E0"/><path d="M14 8.5c1.3 0 2.4.5 3.3 1.3.7-.6 1.6-.9 2.6-.9 2.2 0 4 1.8 4 4 0 .3 0 .6-.1.9 1.7.6 2.9 2.2 2.9 4 0 2.4-1.9 4.3-4.3 4.3-.5 0-.9-.1-1.4-.2-.7 1.2-2 1.9-3.5 1.9-1.2 0-2.3-.5-3.1-1.3-.8.8-1.9 1.3-3.1 1.3-1.7 0-3.2-1-3.8-2.4-.3.1-.7.1-1 .1-1.5 0-2.7-1.2-2.7-2.7 0-1.1.6-2 1.5-2.6-.2-.5-.3-1.1-.3-1.7 0-2.4 1.7-4.3 3.8-4.3.7 0 1.4.2 1.9.6.9-1.5 2.2-2.3 3.6-2.3z" fill="white"/></svg>)}
                              {item.logo === 'servicenow' && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#81B5A1"/><path d="M8 16h16M16 8v16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>)}
                              {item.logo === 'infinitus' && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#4A90D9"/><path d="M9 16h14M16 9v14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>)}
                              {item.logo === 'zendesk' && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#03363D"/><path d="M8 10l8 6-8 6V10zM24 10v12l-8-6 8-6z" fill="#78A300"/></svg>)}
                              {(item.logo === 'stripe' || item.logo === 'docai') && (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#635BFF"/><path d="M10 10h12v12H10z" stroke="white" strokeWidth="2.5"/></svg>)}
                            </div>
                            <div className="add-capability-item-info">
                              <div className="add-capability-item-name">
                                {item.name}
                                <Icon name="info-circle" weight="bold" size={14} className="add-capability-item-info-icon" />
                              </div>
                              <div className="add-capability-item-meta">
                                From {item.source} {'type' in item && <><span className="add-capability-item-dot">&#x2022;</span> {(item as any).type}</>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="add-capability-selected-section">
                  <div className="add-capability-selected">
                    <Tooltip
                      content={`Your agent already has ${rows.length} action${rows.length !== 1 ? 's' : ''}. You can add ${Math.max(0, 9 - rows.length)} more.`}
                      placement="top"
                    >
                      <span className="add-capability-selected-label">
                        Selected ({confirmedActions.length}/9)
                        <Icon name="info-circle" weight="bold" size={16} className="add-capability-selected-info" />
                      </span>
                    </Tooltip>
                  </div>
                  {confirmedActions.length > 0 && (
                    <div className="add-capability-chips">
                      {confirmedActions.map(action => (
                        <span key={action.id} className="add-capability-chip">
                          {action.name}
                          <button
                            type="button"
                            className="add-capability-chip-close"
                            onClick={() => setConfirmedActions(prev => prev.filter(a => a.id !== action.id))}
                          >
                            <Icon name="cancel" weight="bold" size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="add-capability-footer">
                  <Button variant="secondary" onClick={closeAddModal}>Cancel</Button>
                  <Button disabled={confirmedActions.length === 0} onClick={handleAddConfirm}>Add</Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {pendingAdvancedEnable && (
        <Modal onClose={() => setPendingAdvancedEnable(null)} size="sm">
          <ModalHeader title={`Enable ${pendingAdvancedEnable.label}?`} onClose={() => setPendingAdvancedEnable(null)} />
          <ModalBody>
            <p>
              This guardrail uses Cisco AI Defense. Usage is billed per message scanned, and the change applies immediately.
            </p>
            <p>
              Review pricing in <Link to="/settings/organization">organization settings</Link>.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setPendingAdvancedEnable(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const { groupId, itemIds, label } = pendingAdvancedEnable;
              setPrebuiltGuardrailsEnabled(groupId, itemIds, true);
              setHasAcknowledgedAdvancedPricing(true);
              setPendingAdvancedEnable(null);
              showToast(`${label} enabled`, 'success');
            }}>Enable</Button>
          </ModalFooter>
        </Modal>
      )}

      {showCreateEngine && (
        <CreateEngineModal
          onClose={() => setShowCreateEngine(false)}
          onCreate={(data) => {
            addAiEngine({ name: data.name, description: data.description, createdBy: 'You' });
            updateProfileField('aiEngine', data.name);
            setShowCreateEngine(false);
            showToast(`Engine "${data.name}" created successfully!`, 'success');
          }}
        />
      )}

      {showFulfillmentModal && (
        <CreateFulfillmentModal
          onClose={() => setShowFulfillmentModal(false)}
          onSave={(data) => {
            setShowFulfillmentModal(false);
            showToast(`Action "${data.name}" updated successfully!`, 'success');
          }}
        />
      )}


      {showExampleModal && createPortal(
        <div className="example-modal-overlay" onClick={() => setShowExampleModal(false)}>
          <div className="example-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="example-modal-header">
              <div><h2 className="example-modal-title">Instruction examples</h2><p className="example-modal-subtitle">Explore examples for writing effective instructions.</p></div>
              <button className="example-modal-close" onClick={() => setShowExampleModal(false)} aria-label="Close"><Icon name="cancel" weight="bold" size={20} /></button>
            </div>
            <div className="example-modal-tabs">
              <button type="button" className={`example-modal-tab${exampleTab === 'examples' ? ' active' : ''}`} onClick={() => setExampleTab('examples')}><Icon name="text-code-block" weight="bold" size={16} />Examples</button>
              <button type="button" className={`example-modal-tab${exampleTab === 'tips' ? ' active' : ''}`} onClick={() => setExampleTab('tips')}><Icon name="info-circle" weight="bold" size={16} />Best practice & Tips</button>
            </div>
            <div className="example-modal-body">
              {exampleTab === 'examples' && (
                <div className="example-modal-examples-list">
                  {INSTRUCTION_EXAMPLES.map((ex, idx) => (
                    <div key={idx} className="example-modal-card">
                      <div className="example-modal-card-header">
                        <span className="example-modal-content-label">**{ex.title}**</span>
                        <button type="button" className="example-modal-insert-btn" onClick={() => { updateProfileField('instructions', `**${ex.title}**\n\n${ex.content}`); setShowExampleModal(false); showToast('Example inserted into instructions', 'success'); }}>
                          <Icon name="plus" weight="bold" size={14} />Insert
                        </button>
                      </div>
                      <div className="example-modal-markdown">
                        {ex.content.split('\n').map((line, i) => {
                          if (line.startsWith('####')) return <h4 key={i}>{line.replace(/^####\s*/, '')}</h4>;
                          if (line.trim() === '') return <br key={i} />;
                          return <p key={i}>{line}</p>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {exampleTab === 'tips' && (
                <div className="example-modal-card">
                  <div className="example-modal-card-header">
                    <span className="example-modal-content-label">Best practice & Tips</span>
                  </div>
                  <div className="example-modal-tips">
                    {INSTRUCTION_TIPS.map((tip, i) => (
                      <div key={i} className="example-modal-tip">
                        <span className="example-modal-tip-number">{i + 1}</span>
                        <div><h4 className="example-modal-tip-title">{tip.title}</h4><p className="example-modal-tip-desc">{tip.description}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="example-modal-footer"><Button variant="secondary" onClick={() => setShowExampleModal(false)}>Close</Button></div>
          </div>
        </div>,
        document.body,
      )}

      {showOptimizeModal && createPortal(
        <div className="optimize-modal-overlay">
          <div className="optimize-modal" role="dialog" aria-modal="true">
            <div className="optimize-modal-header">
              <h2 className="optimize-modal-title">Optimizing instructions</h2>
              <button className="optimize-modal-close" onClick={() => setShowOptimizeModal(false)} aria-label="Close"><Icon name="cancel" weight="bold" size={24} /></button>
            </div>
            <div className="optimize-modal-body">
              <div className="optimize-modal-col">
                <div className="optimize-modal-col-header"><Icon name="document" weight="bold" size={16} /><h3>Original instructions</h3>
                  {optimizeState === 'completed' && <button type="button" className="optimize-copy-btn" onClick={() => { navigator.clipboard.writeText(originalTextSnapshot); showToast('Copied to clipboard', 'success'); }}><Icon name="copy" weight="bold" size={14} />Copy</button>}
                </div>
                <div className="optimize-modal-text">{originalTextSnapshot}</div>
              </div>
              <div className="optimize-modal-col">
                <div className="optimize-modal-col-header"><Icon name="check-circle" weight="bold" size={16} color="var(--success-color)" /><h3>Optimized instructions</h3>
                  {optimizeState === 'completed' && <button type="button" className="optimize-copy-btn" onClick={() => { navigator.clipboard.writeText(optimizedText); showToast('Copied to clipboard', 'success'); }}><Icon name="copy" weight="bold" size={14} />Copy</button>}
                </div>
                <div className="optimize-modal-text">
                  {optimizeState === 'generating' ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Optimized instructions will appear here once generation is complete.</p>
                  ) : optimizedText}
                </div>
              </div>
              <div className="optimize-modal-summary">
                <h3 className="optimize-modal-summary-title">Optimize summary</h3>
                {optimizeState === 'generating' ? (
                  <div className="optimize-modal-loading"><div className="optimize-spinner" /><p>Generating your instructions...</p></div>
                ) : (
                  <div className="optimize-modal-results">
                    <div className="optimize-results-section"><h4>What's been changed:</h4><ul>{optimizeSummary.changes.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                    <div className="optimize-results-section"><h4>Reasoning behind changes:</h4><ul>{optimizeSummary.reasoning.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                  </div>
                )}
              </div>
            </div>
            <div className="optimize-modal-footer">
              {optimizeState === 'generating' ? (
                <><Button variant="secondary" onClick={() => setShowOptimizeModal(false)}>Cancel</Button><Button disabled>Save change</Button></>
              ) : (
                <><Button variant="secondary" onClick={() => setShowOptimizeModal(false)}>Discard</Button><Button onClick={() => {
                  setPreOptimizeText(originalTextSnapshot); updateProfileField('instructions', optimizedText); setAcceptedSummary({ ...optimizeSummary }); setOptimizeAccepted(true); setShowOptimizeModal(false); showToast('Optimized instructions applied', 'success');
                }}>Accept</Button></>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
      {showPolicyStudio && (() => {
        const editItem = editingProfileId ? advancedCustomItems.find(it => it.id === editingProfileId) : undefined;
        return (
          <SecurityUIPolicyStudio
            key={editingProfileId || 'new-security-ui'}
            initialBasicStep={!editingProfileId}
            initialProfileName={editItem?.name}
            initialDirection={editItem?.direction}
            initialData={editItem ? {
              name: editItem.name,
              description: editItem.description,
              overview: editItem.overview,
              policyText: editItem.policyText,
            } : undefined}
            onClose={() => { setShowPolicyStudio(false); setEditingProfileId(null); }}
            onPublish={(result) => {
              const now = formatGuardrailUpdatedAt();
              const v1: import('./PolicyStudio').PolicyStudioResult & { version: string; createdAt: string } = {
                ...result,
                version: 'v1',
                createdAt: now,
              };
              if (editingProfileId) {
                setAdvancedCustomItems(prev => prev.map(it => {
                  if (it.id !== editingProfileId) return it;
                  const nextNum = it.versions.length + 1;
                  const newVersion: PolicyVersion = {
                    version: `v${nextNum}`,
                    name: result.name,
                    description: result.description,
                    overview: result.overview,
                    createdAt: now,
                    policyText: result.policyText,
                  };
                  return {
                    ...it,
                    name: result.name,
                    description: result.description,
                    overview: result.overview,
                    direction: result.direction,
                    createdAt: now,
                    policyText: result.policyText,
                    versions: [...it.versions, newVersion],
                  };
                }));
                showToast(`Guardrail "${result.name}" updated`, 'success');
                setShowPolicyStudio(false);
                setEditingProfileId(null);
                return;
              }
              setAdvancedCustomItems(prev => [...prev, {
                id: `custom-${Date.now()}`,
                name: result.name,
                description: result.description,
                overview: result.overview,
                policyText: result.policyText,
                enabled: true,
                action: 'block',
                direction: result.direction,
                createdBy: 'You',
                createdAt: now,
                versions: [{ version: v1.version, name: v1.name, description: v1.description, overview: v1.overview, createdAt: v1.createdAt, policyText: v1.policyText }],
              }]);
              showToast(`Guardrail "${result.name}" published`, 'success');
              setShowPolicyStudio(false);
              setEditingProfileId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
