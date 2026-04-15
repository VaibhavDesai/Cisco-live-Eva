import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import Button from '../../components/shared/Button';
import Tabs, { Tab, SegmentControl, SegmentItem } from '../../components/shared/Tabs';
import Toggle from '../../components/shared/Toggle';
import Dropdown from '../../components/shared/Dropdown';
import { Slider } from '../../components/shared/Slider';
import { AccordionGroup, AccordionItem } from '../../components/shared/Accordion';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/shared/Table';
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

import CreateEngineModal from '../CreateEngineModal';
import CreateFulfillmentModal from './CreateFulfillmentModal';
import PolicyStudio from './PolicyStudio';
import { optimizeInstructions } from '../../api/ciscoAi';
import { Icon } from '../../icons';
import {
  type UpdateStatus,
  type RiskLevel,
  CAPABILITIES,
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
  name: string;
  description: string;
  enabled: boolean;
  actionType: string;
  providerType: string;
  createdBy: string;
  lastUpdated: string;
};

const ACTION_SECTIONS = ['Profile', 'Instructions', 'Security', 'Knowledge', 'Action', 'Language'];

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

interface StandardGuardrail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sensitivity: number;
  enforcement: Enforcement;
}

const DEFAULT_STANDARD_GUARDRAILS: StandardGuardrail[] = [
  { id: 'std-toxicity', name: 'Toxicity', description: 'Detect and filter toxic language, insults, and abusive content in conversations.', enabled: true, sensitivity: 50, enforcement: 'monitor' },
  { id: 'std-harm', name: 'Harm detection', description: 'Identify requests or responses that could cause physical, emotional, or financial harm.', enabled: true, sensitivity: 50, enforcement: 'monitor' },
  { id: 'std-jailbreak', name: 'Jailbreak', description: 'Detect prompt injection attempts designed to bypass agent instructions and safety rules.', enabled: true, sensitivity: 50, enforcement: 'block' },
  { id: 'std-multiturn', name: 'Multi-turn jailbreak', description: 'Detect multi-step manipulation where users gradually steer the agent away from its guardrails across turns.', enabled: true, sensitivity: 50, enforcement: 'block' },
];

type Direction = 'prompt' | 'response';
type AdvAction = 'block' | 'allow';
type AdvancedGroupId = 'security' | 'privacy' | 'safety';

interface AdvancedGuardrailItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  direction: Direction;
  action: AdvAction;
}

interface AdvancedGuardrailGroup {
  id: AdvancedGroupId;
  label: string;
  icon: string;
  items: AdvancedGuardrailItem[];
}

interface PolicyVersion {
  version: string;
  name: string;
  description: string;
  overview: import('./PolicyStudio').PolicyOverview;
  createdAt: string;
}

interface CustomGuardrailItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  overview: import('./PolicyStudio').PolicyOverview;
  versions: PolicyVersion[];
}

const DEFAULT_ADVANCED_GROUPS: AdvancedGuardrailGroup[] = [
  {
    id: 'security', label: 'Security guardrails', icon: 'shield',
    items: [
      { id: 'sec-prompt-injection', name: 'Prompt injection', description: 'Detect attempts to manipulate the agent by injecting hidden instructions into user input.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-code-injection', name: 'Code injection', description: 'Block inputs that attempt to execute arbitrary code through the agent.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-system-prompt', name: 'System prompt extraction', description: 'Prevent users from tricking the agent into revealing its system prompt or configuration.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-instruction-override', name: 'Instruction override', description: 'Block attempts to override or replace the agent\u2019s original instructions.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-encoding-attack', name: 'Encoding attack', description: 'Detect obfuscated payloads using Base64, Unicode, or other encoding schemes.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-sql-injection', name: 'SQL injection', description: 'Identify inputs crafted to execute unauthorized database queries.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-xss', name: 'XSS injection', description: 'Block cross-site scripting payloads embedded in user messages.', enabled: false, direction: 'prompt', action: 'block' },
      { id: 'sec-resource-hijack', name: 'Resource hijack', description: 'Prevent prompts designed to consume excessive compute or API resources.', enabled: false, direction: 'prompt', action: 'block' },
    ],
  },
  {
    id: 'privacy', label: 'Privacy guardrails', icon: 'privacy-circle',
    items: [
      { id: 'priv-pii', name: 'PII detection', description: 'Identify and flag personally identifiable information in agent responses.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-ssn', name: 'SSN redaction', description: 'Automatically redact Social Security numbers from responses.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-credit-card', name: 'Credit card redaction', description: 'Strip credit card numbers from agent output before delivery.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-email', name: 'Email redaction', description: 'Remove email addresses from responses to prevent data leakage.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-phone', name: 'Phone number redaction', description: 'Redact phone numbers from agent responses.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-address', name: 'Address redaction', description: 'Strip physical addresses from responses to protect user privacy.', enabled: false, direction: 'response', action: 'block' },
      { id: 'priv-ip', name: 'IP address redaction', description: 'Remove IP addresses from agent output.', enabled: false, direction: 'response', action: 'allow' },
    ],
  },
  {
    id: 'safety', label: 'Safety guardrails', icon: 'check-circle',
    items: [
      { id: 'safe-toxicity', name: 'Toxicity', description: 'Detect and block toxic, abusive, or offensive language in responses.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-hate', name: 'Hate speech', description: 'Block responses containing hate speech targeting protected groups.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-self-harm', name: 'Self-harm', description: 'Prevent responses that encourage or provide guidance on self-harm.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-violence', name: 'Violence', description: 'Block content that promotes, glorifies, or instructs on violence.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-sexual', name: 'Sexual content', description: 'Filter sexually explicit or inappropriate content from responses.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-harassment', name: 'Harassment', description: 'Detect and block responses that harass, intimidate, or bully users.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-misinfo', name: 'Misinformation', description: 'Flag responses containing known false or misleading claims.', enabled: false, direction: 'response', action: 'block' },
      { id: 'safe-radicalization', name: 'Radicalization', description: 'Block content that promotes extremist ideologies or recruitment.', enabled: false, direction: 'response', action: 'block' },
    ],
  },
];

export default function ActionConfigureV2() {
  const { agentId } = useParams();
  const { agents, currentAgent, selectAgent, showToast, aiEngines, addAiEngine } = useApp();
  const [activeSection, setActiveSection] = useState<string>('Profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    agentName: 'Acme Bank Credit Card Assistant',
    systemId: 'AcmeBankCreditCardAssistant-uah13as',
    avatarUrl: 'https://us.webexbotbuilder.com/static/assets/i...',
    timezone: 'Europe/London',
    aiEngine: 'Webex AI Pro 1.0',
    welcomeMessage: '',
    agentGoal: '',
    instructions: '',
  });

  const updateProfileField = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
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
  const [securityTier, setSecurityTier] = useState<'standard' | 'advanced'>('standard');
  const [showObsBanner, setShowObsBanner] = useState(true);
  const isPaidUser = true;
  const [standardGuardrails, setStandardGuardrails] = useState<StandardGuardrail[]>(DEFAULT_STANDARD_GUARDRAILS);
  const [advancedDefaultGroups, setAdvancedDefaultGroups] = useState<AdvancedGuardrailGroup[]>(DEFAULT_ADVANCED_GROUPS);
  const [advancedCustomItems, setAdvancedCustomItems] = useState<CustomGuardrailItem[]>([]);
  const [confirmDisableJailbreak, setConfirmDisableJailbreak] = useState(false);
  const [pendingAdvancedEnable, setPendingAdvancedEnable] = useState<{ groupId: string; itemId: string } | null>(null);
  const [hasAcknowledgedAdvancedPricing, setHasAcknowledgedAdvancedPricing] = useState(false);
  const [showPolicyStudio, setShowPolicyStudio] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [expandedProfileDescs, setExpandedProfileDescs] = useState<Set<string>>(new Set());

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

  const [capabilities, setCapabilities] = useState<CapabilityRecord[]>(CAPABILITIES);
  const [rows, setRows] = useState<ActionRow[]>(
    CAPABILITIES.map((cap, idx) => ({
      id: cap.id,
      name: cap.name,
      description: cap.description || 'Escalate the conversation to a human agent based on general rules and conditions',
      enabled: idx < 2,
      actionType: idx === 0 ? 'Transfer' : 'MCP',
      providerType: 'System',
      createdBy: idx === 0 ? 'System' : 'Claire',
      lastUpdated: '02/28/25, at 1:08 AM',
    })),
  );

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

  if (!currentAgent || currentAgent.id !== agentId) {
    const nextAgent = agents[agentId];
    if (nextAgent) {
      selectAgent(agentId);
    } else {
      return <Navigate to="/agents" replace />;
    }
  }

  const agent = currentAgent || agents[agentId];
  if (!agent) return <Navigate to="/agents" replace />;

  const toggleAction = (id: number) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row)));
  };

  const deleteAction = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setCapabilities((prev) => prev.filter((cap) => cap.id !== id));
  };

  const headerActions = (
    <div className="action-config-v2-header-actions">
      <button type="button" className="action-config-v2-preview-btn">
        <Icon name="chat" weight="bold" size={20} />
        Preview
      </button>
      <button type="button" className="action-config-v2-more-btn" aria-label="More options">
        <Icon name="more" weight="bold" size={20} />
      </button>
    </div>
  );

  return (
    <div className="primary-content">
      <AgentHeader agent={agent} activeTab="configure" showPublishButton={false} headerRight={headerActions}>
        <div className="action-config-v2-title-row">
          <Tabs variant="line" aria-label="Agent configuration sections">
            {ACTION_SECTIONS.map((section) => (
              <Tab
                key={section}
                active={section === activeSection}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </Tab>
            ))}
          </Tabs>
          {activeSection === 'Action' && (
            <div className="add-action-menu-wrapper" ref={addMenuRef}>
              <button
                type="button"
                className="action-config-v2-add-btn"
                onClick={() => setShowAddMenu(!showAddMenu)}
              >
                <Icon name="plus" weight="bold" size={20} />
                Add actions
              </button>
              {showAddMenu && (
                <div className="add-action-menu">
                  <div className="add-action-menu-section">
                    <div className="add-action-menu-header">Browse actions</div>
                    <button
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
                    <button className="add-action-menu-item" onClick={() => setShowAddMenu(false)}>
                      <Icon name="next" weight="bold" size={20} />
                      Transfer
                    </button>
                    <button className="add-action-menu-item" onClick={() => { setShowAddMenu(false); setShowFulfillmentModal(true); }}>
                      <Icon name="automation" weight="bold" size={20} />
                      Fulfillment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AgentHeader>

      <div className="action-config-v2-shell">
        <div className="action-config-v2-card">

          {activeSection === 'Profile' && (
            <div className="v2-profile-layout">
              <aside className="v2-profile-tips">
                <h3 className="v2-profile-tips-title">Goal and instruction tips</h3>
                <ul className="v2-profile-tips-list">
                  <li>Explain what the agent's purpose is.</li>
                  <li>Break down the overall goal into specific, sequential steps and tasks.</li>
                  <li>Reference the actions at each step that are used to fulfil each step and task.</li>
                  <li>Define the personality and expertise of the AI agent, e.g. friendly, formal, or casual.</li>
                </ul>
              </aside>

              <div className="v2-profile-form">
                <Input
                  label="Agent name"
                  required
                  value={profileForm.agentName}
                  onChange={(e) => updateProfileField('agentName', e.target.value)}
                />

                <Input
                  label="System ID"
                  required
                  value={profileForm.systemId}
                  onChange={(e) => updateProfileField('systemId', e.target.value)}
                />

                <div className="v2-profile-avatar-row">
                  <div className="v2-profile-avatar-preview">
                    <div className="agent-avatar" style={{ background: agent.gradient, width: 48, height: 48, fontSize: 16 }}>
                      {agent.initials}
                    </div>
                  </div>
                  <div className="v2-profile-avatar-field">
                    <Input
                      label="URL for agent profile image"
                      required
                      value={profileForm.avatarUrl}
                      onChange={(e) => updateProfileField('avatarUrl', e.target.value)}
                    />
                  </div>
                </div>

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

                <div className="v2-profile-textarea-group">
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
                    rows={4}
                  />
                </div>

              </div>
            </div>
          )}

          {activeSection === 'Instructions' && (
            <div className="instructions-layout">
              <aside className="instructions-sidebar">
                <h3 className="instructions-sidebar-title">Instructions <span className="instructions-required">(required)</span></h3>
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
                <textarea className="instructions-textarea" placeholder="Set clear goals for your agent. Provide step-by-step instructions to help them succeed in reaching these targets." value={profileForm.instructions} onChange={(e) => updateProfileField('instructions', e.target.value)} />
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
          )}

          {activeSection === 'Security' && (
            <div className="guardrails-layout">
              <div className="guardrails-header">
                <div className="guardrails-header-left">
                  <h3 className="guardrails-title">Security</h3>
                  <p className="guardrails-subtitle">Configure protection rules to control agent behavior, enforce safety policies, and prevent misuse.</p>
                </div>
              </div>

              {/* Tier selector */}
              <div className="security-tier-selector">
                <Card clickable selected={securityTier === 'standard'} onClick={() => setSecurityTier('standard')} className="security-tier-card">
                  <CardBody>
                    <div className="security-tier-card-inner">
                      <Icon name="shield" weight="bold" size={24} />
                      <div className="security-tier-card-text">
                        <span className="security-tier-card-title">Standard guardrails</span>
                        <span className="security-tier-card-desc">Basic protection with toxicity, harm detection, and jailbreak prevention.</span>
                        <span className="security-tier-card-count">{standardGuardrails.filter(g => g.enabled).length}/{standardGuardrails.length} enabled</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card clickable selected={securityTier === 'advanced'} onClick={() => setSecurityTier('advanced')} className="security-tier-card">
                  <CardBody>
                    <div className="security-tier-card-inner">
                      <Icon name="secure-circle" weight="bold" size={24} />
                      <div className="security-tier-card-text">
                        <span className="security-tier-card-title">Advanced guardrails <Badge variant="success" className="security-tier-badge">AI Defense</Badge></span>
                        <span className="security-tier-card-desc">Comprehensive security, privacy, and safety guardrails with custom profiles.</span>
                        <span className="security-tier-card-count">{advancedDefaultGroups.reduce((sum, gp) => sum + gp.items.filter(i => i.enabled).length, 0) + advancedCustomItems.filter(c => c.enabled).length}/{advancedDefaultGroups.reduce((sum, gp) => sum + gp.items.length, 0) + advancedCustomItems.length} enabled{advancedCustomItems.length > 0 ? ` · ${advancedCustomItems.length} custom` : ''}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Observability banner */}
              {showObsBanner && (
                <Banner
                  type="info"
                  title="Observability & Logging"
                  subtitle={<>All triggered rails are logged in the Sessions view. If a rail is set to &ldquo;Monitor&rdquo;, the interaction continues but the violation is logged for admin review. If set to &ldquo;Block&rdquo;, the individual prompt is rejected but the conversation remains active. This allows you to fine-tune confidence settings based on real-world data. <a href="/docs/guardrails" target="_blank" rel="noopener noreferrer" className="banner-link">Learn more</a></>}
                  dismissable
                  onDismiss={() => setShowObsBanner(false)}
                />
              )}

              {/* ── Standard Guardrails ── */}
              {securityTier === 'standard' && (
                <div className="security-standard-list">
                  <AccordionGroup type="contained">
                    {standardGuardrails.map((g) => (
                      <AccordionItem
                        key={g.id}
                        title={
                          <div className="security-guardrail-header">
                            <Toggle
                              checked={g.enabled}
                              onChange={() => {
                                if (g.id === 'std-jailbreak' && g.enabled) {
                                  setConfirmDisableJailbreak(true);
                                  return;
                                }
                                const willEnable = !g.enabled;
                                setStandardGuardrails(prev => prev.map(gr => gr.id === g.id ? { ...gr, enabled: willEnable } : gr));
                                if (willEnable) showToast(`${g.name} guardrail enabled`, 'success');
                              }}
                              size="compact"
                            />
                            <div className="security-guardrail-header-text">
                              <span className="security-guardrail-name">{g.name}</span>
                              <span className="security-guardrail-desc">{g.description}</span>
                            </div>
                          </div>
                        }
                        defaultExpanded={g.enabled}
                      >
                        <div className="security-guardrail-controls">
                          <div className="security-control-row">
                            <label className="security-control-label">Sensitivity</label>
                            <div className="security-slider-wrap">
                              <Slider
                                value={g.sensitivity}
                                onChange={(v) => setStandardGuardrails(prev => prev.map(gr => gr.id === g.id ? { ...gr, sensitivity: v as number } : gr))}
                                min={0}
                                max={100}
                                step={50}
                                showTicks
                                disabled={!g.enabled}
                              />
                              <div className="security-sensitivity-labels">
                                <span>Low</span>
                                <span>Medium</span>
                                <span>High</span>
                              </div>
                            </div>
                          </div>
                          <div className="security-control-row">
                            <label className="security-control-label">Enforcement</label>
                            <RadioGroup
                              name={`enforcement-${g.id}`}
                              value={g.enforcement}
                              onChange={(v) => setStandardGuardrails(prev => prev.map(gr => gr.id === g.id ? { ...gr, enforcement: v as Enforcement } : gr))}
                              className="security-enforcement-control"
                            >
                              <Radio value="monitor" label="Monitor" disabled={!g.enabled} />
                              <Radio value="block" label="Block" disabled={!g.enabled} />
                            </RadioGroup>
                          </div>
                        </div>
                      </AccordionItem>
                    ))}
                  </AccordionGroup>
                </div>
              )}

              {/* ── Advanced Guardrails ── */}
              {securityTier === 'advanced' && (
                <div className="security-advanced-panel">
                  {!isPaidUser && (
                    <Banner
                      type="info"
                      title="Upgrade to Pro"
                      subtitle="Enable advanced guardrails powered by AI Defense for comprehensive protection across security, privacy, and safety categories."
                    />
                  )}

                  <div className="security-advanced-groups">
                    <AccordionGroup type="contained">
                      {advancedDefaultGroups.map((group) => (
                        <AccordionItem
                          key={group.id}
                          defaultExpanded
                          title={
                            <div className="security-group-header">
                              <Icon name={group.icon as any} weight="bold" size={18} />
                              <span>{group.label}</span>
                              <Badge variant="default">{group.items.filter(i => i.enabled).length}/{group.items.length}</Badge>
                            </div>
                          }
                        >
                          <Table compact className="security-advanced-table">
                            <TableHead>
                              <TableRow>
                                <TableHeader style={{ width: 48 }} aria-label="Enabled" />
                                <TableHeader style={{ width: 180 }}>Guardrail</TableHeader>
                                <TableHeader>Description</TableHeader>
                                <TableHeader style={{ width: 140 }}>Direction</TableHeader>
                                <TableHeader style={{ width: 120 }}>Action</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Toggle
                                      checked={item.enabled}
                                      disabled={!isPaidUser}
                                      onChange={() => {
                                        if (!item.enabled) {
                                          if (!hasAcknowledgedAdvancedPricing) {
                                            setPendingAdvancedEnable({ groupId: group.id, itemId: item.id });
                                            return;
                                          }
                                          setAdvancedDefaultGroups(prev => prev.map(gp =>
                                            gp.id === group.id
                                              ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, enabled: true } : it) }
                                              : gp
                                          ));
                                          showToast(`${item.name} guardrail enabled`, 'success');
                                          return;
                                        }
                                        setAdvancedDefaultGroups(prev => prev.map(gp =>
                                          gp.id === group.id
                                            ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, enabled: false } : it) }
                                            : gp
                                        ));
                                      }}
                                      size="compact"
                                    />
                                  </TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="guardrail-description-cell">{item.description}</TableCell>
                                  <TableCell>
                                    <Dropdown
                                      options={[{ value: 'prompt', label: 'Prompt' }, { value: 'response', label: 'Response' }]}
                                      value={item.direction}
                                      disabled={!isPaidUser}
                                      onChange={(v) => setAdvancedDefaultGroups(prev => prev.map(gp =>
                                        gp.id === group.id
                                          ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, direction: v as Direction } : it) }
                                          : gp
                                      ))}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Dropdown
                                      options={[{ value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' }]}
                                      value={item.action}
                                      disabled={!isPaidUser}
                                      className={`security-action-${item.action}`}
                                      onChange={(v) => setAdvancedDefaultGroups(prev => prev.map(gp =>
                                        gp.id === group.id
                                          ? { ...gp, items: gp.items.map(it => it.id === item.id ? { ...it, action: v as AdvAction } : it) }
                                          : gp
                                      ))}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionItem>
                      ))}
                    </AccordionGroup>
                    <div className="security-custom-profiles-section">
                      <div className="security-custom-profiles-header">
                        <div className="security-group-header">
                          <Icon name="document-create" weight="bold" size={18} />
                          <span>Custom profiles</span>
                          {advancedCustomItems.length > 0 && (
                            <Badge variant="default">{advancedCustomItems.filter(i => i.enabled).length}/{advancedCustomItems.length}</Badge>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!isPaidUser}
                          onClick={() => { setEditingProfileId(null); setShowPolicyStudio(true); }}
                        >
                          <Icon name="plus" weight="bold" size={16} />Create custom profile
                        </Button>
                      </div>
                      <p className="security-custom-profiles-desc">Generate custom profiles tailored specifically to this agent&apos;s configuration and requirements.</p>
                      {advancedCustomItems.length > 0 && (
                        <div className="custom-profile-grid">
                          {advancedCustomItems.map((item) => (
                            <div key={item.id} className={`custom-profile-card${item.enabled ? '' : ' custom-profile-card--disabled'}`}>
                              <div className="custom-profile-card__header">
                                <Toggle
                                  checked={item.enabled}
                                  disabled={!isPaidUser}
                                  onChange={() => {
                                    const willEnable = !item.enabled;
                                    setAdvancedCustomItems(prev => prev.map(it => it.id === item.id ? { ...it, enabled: willEnable } : it));
                                    if (willEnable) showToast(`${item.name} profile enabled`, 'success');
                                  }}
                                  size="compact"
                                />
                                <h4 className="custom-profile-card__name">{item.name}</h4>
                                <div className="custom-profile-card__actions">
                                  <Button
                                    variant="tertiary"
                                    size="sm"
                                    aria-label={`Edit ${item.name}`}
                                    onClick={() => { setEditingProfileId(item.id); setShowPolicyStudio(true); }}
                                  >
                                    <Icon name="edit" size={16} />
                                  </Button>
                                  <Button
                                    variant="tertiary"
                                    size="sm"
                                    aria-label={`Delete ${item.name}`}
                                    onClick={() => setAdvancedCustomItems(prev => prev.filter(it => it.id !== item.id))}
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
                              <div className="custom-profile-card__meta">
                                <span>{item.createdBy}</span>
                                <span className="custom-profile-card__meta-sep" aria-hidden="true" />
                                <span>{item.createdAt}</span>
                                {item.versions.length > 1 && (
                                  <>
                                    <span className="custom-profile-card__meta-sep" aria-hidden="true" />
                                    <span>{item.versions.length} versions</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'Knowledge' && (
            <EmptyState
              global
              illustration="message-activity"
              title="No knowledge bases"
              description="Connect knowledge bases to give your agent access to relevant information and documents."
              actions={
                <Button variant="secondary">
                  <Icon name="plus" weight="bold" size={20} />
                  Add knowledge
                </Button>
              }
            />
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
          <div className="action-config-v2-table-wrap">
            <table className="action-config-v2-table">
              <thead>
                <tr>
                  <th className="col-action-name">Action name</th>
                  <th className="col-recurring" aria-label="Status" />
                  <th className="col-created-by">Created by</th>
                  <th className="col-description">Description</th>
                  <th className="col-last-updated">Last updated</th>
                  <th className="col-action-type">Action type</th>
                  <th className="col-provider-type">Provider type</th>
                  <th className="col-controls">Controls</th>
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
                      <td className="col-controls">
                        <div className="action-config-v2-control-group">
                          <button
                            className="action-config-v2-control-btn"
                            type="button"
                            onClick={() => {
                              const foundCap = capabilities.find((c) => c.id === row.id);
                              if (foundCap) handleOpenCapabilityEdit(foundCap);
                            }}
                            title="Edit action"
                          >
                            <Icon name="edit" weight="bold" size={16} />
                          </button>
                          <button
                            className="action-config-v2-control-btn action-config-v2-delete-btn"
                            type="button"
                            onClick={() => deleteAction(row.id)}
                            title="Delete action"
                          >
                            <Icon name="delete" weight="bold" size={16} />
                          </button>
                        </div>
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

      {activeSection === 'Profile' && (
        <div className="v2-profile-footer">
          <Button variant="secondary">Cancel</Button>
          <Button>Save</Button>
        </div>
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
          <ModalHeader title="Enable advanced guardrail?" onClose={() => setPendingAdvancedEnable(null)} />
          <ModalBody>
            Advanced guardrails are powered by Cisco AI Defense and are billed based on usage. Each enabled rail will incur charges per message scanned. You can review pricing in your organization settings.
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setPendingAdvancedEnable(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const { groupId, itemId } = pendingAdvancedEnable;
              const itemName = advancedDefaultGroups.find(g => g.id === groupId)?.items.find(i => i.id === itemId)?.name;
              setAdvancedDefaultGroups(prev => prev.map(gp =>
                gp.id === groupId
                  ? { ...gp, items: gp.items.map(it => it.id === itemId ? { ...it, enabled: true } : it) }
                  : gp
              ));
              setHasAcknowledgedAdvancedPricing(true);
              setPendingAdvancedEnable(null);
              showToast(`${itemName} guardrail enabled`, 'success');
            }}>Enable</Button>
          </ModalFooter>
        </Modal>
      )}

      {confirmDisableJailbreak && (
        <Modal onClose={() => setConfirmDisableJailbreak(false)} size="sm">
          <ModalHeader title="Disable jailbreak protection?" onClose={() => setConfirmDisableJailbreak(false)} />
          <ModalBody>
            Jailbreak protection prevents users from bypassing your agent&apos;s instructions and safety rules through prompt injection. Disabling it may expose your agent to manipulation.
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setConfirmDisableJailbreak(false)}>Cancel</Button>
            <Button variant="primary" color="negative" onClick={() => {
              setStandardGuardrails(prev => prev.map(gr => gr.id === 'std-jailbreak' ? { ...gr, enabled: false } : gr));
              setConfirmDisableJailbreak(false);
            }}>Disable</Button>
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
        const initial = editItem
          ? { name: editItem.name, description: editItem.description, overview: editItem.overview }
          : undefined;
        const versionOpts = editItem?.versions.map((v, i) => ({
          value: v.version,
          label: i === editItem.versions.length - 1 ? `${v.version} (current)` : v.version,
        }));
        return (
          <PolicyStudio
            key={editingProfileId || 'new'}
            initialData={initial}
            versionOptions={versionOpts}
            onClose={() => { setShowPolicyStudio(false); setEditingProfileId(null); }}
            onPublish={(result) => {
              const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              if (result.publishMode === 'new') {
                const v1: import('./PolicyStudio').PolicyStudioResult & { version: string; createdAt: string } = {
                  ...result,
                  version: 'v1',
                  createdAt: now,
                };
                setAdvancedCustomItems(prev => [...prev, {
                  id: `custom-${Date.now()}`,
                  name: result.name,
                  description: result.description,
                  overview: result.overview,
                  enabled: true,
                  createdBy: 'You',
                  createdAt: now,
                  versions: [{ version: v1.version, name: v1.name, description: v1.description, overview: v1.overview, createdAt: v1.createdAt }],
                }]);
                showToast(`Profile "${result.name}" published`, 'success');
              } else if (result.publishMode === 'override' && editingProfileId) {
                setAdvancedCustomItems(prev => prev.map(it => {
                  if (it.id !== editingProfileId) return it;
                  const updatedVersions = [...it.versions];
                  if (updatedVersions.length > 0) {
                    updatedVersions[updatedVersions.length - 1] = {
                      ...updatedVersions[updatedVersions.length - 1],
                      name: result.name,
                      description: result.description,
                      overview: result.overview,
                      createdAt: now,
                    };
                  }
                  return { ...it, name: result.name, description: result.description, overview: result.overview, versions: updatedVersions };
                }));
                showToast(`Profile "${result.name}" updated`, 'success');
              } else if (result.publishMode === 'new-version' && editingProfileId) {
                setAdvancedCustomItems(prev => prev.map(it => {
                  if (it.id !== editingProfileId) return it;
                  const nextNum = it.versions.length + 1;
                  const newVersion: PolicyVersion = {
                    version: `v${nextNum}`,
                    name: result.name,
                    description: result.description,
                    overview: result.overview,
                    createdAt: now,
                  };
                  return {
                    ...it,
                    name: result.name,
                    description: result.description,
                    overview: result.overview,
                    versions: [...it.versions, newVersion],
                  };
                }));
                showToast(`Profile "${result.name}" v${(editItem?.versions.length ?? 0) + 1} created`, 'success');
              }
              setShowPolicyStudio(false);
              setEditingProfileId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
