import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import Button from '../../components/shared/Button';
import Tabs, { Tab } from '../../components/shared/Tabs';
import Toggle from '../../components/shared/Toggle';
import Dropdown from '../../components/shared/Dropdown';
import { Input, Textarea } from '../../components/shared/FormInput';
import { EmptyState } from '../../components/shared/EmptyState';
import { Illustration } from '../../assets/illustrations';
import { Tooltip } from '../../components/shared/Tooltip';
import { Banner } from '../../components/shared/Banner';
import { Modal, ModalHeader, ModalFooter } from '../../components/shared/Modal';
import CreateEngineModal from '../CreateEngineModal';
import CreateFulfillmentModal from './CreateFulfillmentModal';
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

const ACTION_SECTIONS = ['Profile', 'Instructions', 'Guardrails', 'Knowledge', 'Action', 'Language'];

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

type GuardrailCategory = 'privacy' | 'scope' | 'tone' | 'escalation' | 'accuracy' | 'logging';

interface Guardrail {
  id: string;
  name: string;
  description: string;
  category: GuardrailCategory;
  enabled: boolean;
  recommended?: boolean;
  reasoning?: string;
  custom?: boolean;
}

const GUARDRAIL_CATEGORIES: { id: GuardrailCategory; label: string; icon: string }[] = [
  { id: 'privacy', label: 'Privacy & Data Redaction', icon: 'shield' },
  { id: 'scope', label: 'Scope Restriction', icon: 'blocked' },
  { id: 'tone', label: 'Tone & Brand Consistency', icon: 'chat' },
  { id: 'escalation', label: 'Escalation Triggers', icon: 'next' },
  { id: 'accuracy', label: 'Hallucination / Accuracy Control', icon: 'check-circle' },
  { id: 'logging', label: 'Logging & Audit Behavior', icon: 'document' },
];

const DEFAULT_GUARDRAILS: Guardrail[] = [
  { id: 'gr-1', name: 'Redact PII from logs', description: 'Automatically redact personal identifiable information such as SSN, credit card numbers, and addresses from conversation logs and analytics.', category: 'privacy', enabled: false, recommended: true, reasoning: 'Your goal says \'maintain patient privacy\' — this reinforces HIPAA compliance.' },
  { id: 'gr-2', name: 'Block medical advice', description: 'Prevent the agent from providing medical diagnoses, treatment recommendations, or drug interactions. Redirect users to qualified professionals.', category: 'scope', enabled: false, recommended: true, reasoning: 'Your instruction says \'requests medical advice or diagnosis, politely decline and redirect\'.' },
  { id: 'gr-3', name: 'Block financial advice', description: 'Prevent the agent from providing specific investment, tax, or financial planning advice. Redirect to licensed advisors.', category: 'scope', enabled: false, recommended: true, reasoning: 'Your instruction says "Avoid sharing provider schedules or personal details of staff".' },
  { id: 'gr-4', name: 'Enforce brand tone', description: 'Ensure all responses maintain the defined brand voice — warm, professional, and empathetic. Flag responses that deviate from tone guidelines.', category: 'tone', enabled: false, recommended: true, reasoning: 'Generic good-to-have guardrail to prevent looping on forbidden topics, reduce token spend.' },
  { id: 'gr-5', name: 'Auto-escalate on frustration', description: 'Detect signs of user frustration (repeated questions, negative sentiment) and automatically offer transfer to a live agent.', category: 'escalation', enabled: false, recommended: true, reasoning: 'Your escalation rules mention detecting negative sentiment and handing off to a live agent.' },
  { id: 'gr-6', name: 'Require source citation', description: 'When the agent provides factual claims, require it to reference a knowledge base article or source. Flag unsupported claims.', category: 'accuracy', enabled: false, recommended: true, reasoning: 'Your accuracy goals require all claims to reference a knowledge base article.' },
  { id: 'gr-7', name: 'Log all escalations', description: 'Record detailed context for every conversation escalated to a live agent, including reason, sentiment score, and conversation summary.', category: 'logging', enabled: false, recommended: false },
  { id: 'gr-8', name: 'Restrict off-topic conversations', description: 'Prevent the agent from engaging in conversations outside its defined support scope. Politely redirect to relevant topics.', category: 'scope', enabled: false, recommended: false },
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

  // Guardrails tab state
  const [guardrails, setGuardrails] = useState<Guardrail[]>(DEFAULT_GUARDRAILS);
  const [guardrailFilter, setGuardrailFilter] = useState<GuardrailCategory | 'all'>('all');
  const [showAddGuardrail, setShowAddGuardrail] = useState(false);
  const [showAllGuardrails, setShowAllGuardrails] = useState(false);
  const [editingGuardrailId, setEditingGuardrailId] = useState<string | null>(null);
  const [newGuardrailName, setNewGuardrailName] = useState('');
  const [newGuardrailDesc, setNewGuardrailDesc] = useState('');
  const [newGuardrailCategory, setNewGuardrailCategory] = useState<GuardrailCategory>('scope');
  const [deleteGuardrailId, setDeleteGuardrailId] = useState<string | null>(null);

  const handleOptimize = () => {
    setOriginalTextSnapshot(profileForm.instructions);
    setOptimizeState('generating');
    setOptimizedText('');
    setOptimizeSummary({ changes: [], reasoning: [] });
    setShowOptimizeModal(true);
    setTimeout(() => {
      setOptimizedText(`You are a conversational pizza order bot. Your task is to help users place accurate pizza orders by gathering relevant information in a natural, conversational way. Guide the user step by step: clarify order details (such as pizza size, crust type, toppings, number of pizzas, delivery/pickup, address or contact if needed, special instructions), confirm their selections, and provide a summary of the order for final confirmation.\n\n**Reasoning Order:**\nFirst, ask targeted questions and clarify the user's desires at each stage (reasoning). Then, once all necessary information is gathered, provide a clear, itemized summary and prompt the user for final confirmation (conclusion).\n\n**Output Format:**\nAll responses should be short conversational English sentences or questions, except for the final order summary, which should be presented as a neatly formatted list in plain text.`);
      setOptimizeSummary({
        changes: ['Clarify Pizza order bot\'s role and goals.', 'Add error handling for invalid inputs at each step.', 'Offer menu categories or search by diet.', 'Include upsell prompts ("Would you like a drink or dessert?").', 'Support modifying or canceling items before final confirmation.', 'Send an order-tracking link after completion.'],
        reasoning: ['Reorganized instruction format for better structure.', 'Removed redundancies and overlapped instructions.', 'Simplified language into clear, numbered steps.', 'Preserved all required variables ({{customer_id}}, {{user_name}}, {{order_items}}).', 'Organized flow from verification → naming → ordering → confirmation.', 'Minimized token count while covering typical ordering tasks.'],
      });
      setOptimizeState('completed');
    }, 3000);
  };

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
      <AgentHeader agent={agent} activeTab="configure" showPublishButton={false} headerRight={headerActions} />

      <div className="action-config-v2-shell">
        <div className="action-config-v2-card">
          <div className="action-config-v2-title-row">
            <Tabs aria-label="Agent configuration sections">
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

          {activeSection === 'Profile' && (
            <div className="v2-profile-layout">
              <aside className="sidebar-guidelines">
                <h3 className="sidebar-guidelines-title">Goal and instruction tips</h3>
                <div className="sidebar-guidelines-card">
                  <div className="sidebar-guidelines-item">Explain what the agent's purpose is.</div>
                  <div className="sidebar-guidelines-item">Break down the overall goal into specific, sequential steps and tasks.</div>
                  <div className="sidebar-guidelines-item">Reference the actions at each step that are used to fulfil each step and task.</div>
                  <div className="sidebar-guidelines-item">Define the personality and expertise of the AI agent, e.g. friendly, formal, or casual.</div>
                </div>
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
              <aside className="sidebar-guidelines">
                <h3 className="sidebar-guidelines-title">Instructions <span className="sidebar-guidelines-required">(required)</span></h3>
                <div className="sidebar-guidelines-card">
                  <div className="sidebar-guidelines-item">Explain in detail what the agent needs to do and what actions it is capable of.</div>
                  <div className="sidebar-guidelines-item">Use markdown to help the AI agent understand structure, sequence and importance.</div>
                  <div className="sidebar-guidelines-item">Consider including instructions for personality, response style, context, error handling, connecting to other systems, and completing actions, based on your agent's goals.</div>
                  <div className="sidebar-guidelines-item">Use the syntax {'{{variable}}'} to insert dynamic content.</div>
                  <div className="sidebar-guidelines-item">Use the optimize instructions tool to help write a better instruction.</div>
                </div>
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
                      <Icon name="text-code-block" weight="bold" size={16} />
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
                    <Icon name="check" weight="bold" size={14} /><span>AI Generated</span><span className="instructions-ai-divider">·</span><span>Is this helpful?</span>
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

          {activeSection === 'Guardrails' && (
            <div className="guardrails-layout">
              <div className="guardrails-header">
                <div className="guardrails-header-left">
                  <h3 className="guardrails-title">AI Guardrails</h3>
                  <p className="guardrails-subtitle">Define rules to control how your agent behaves, what it can say, and how it handles sensitive topics.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setEditingGuardrailId(null); setNewGuardrailName(''); setNewGuardrailDesc(''); setNewGuardrailCategory('scope'); setShowAddGuardrail(true); }}>
                  <Icon name="plus" weight="bold" size={16} />Add guardrail
                </Button>
              </div>
              {guardrails.filter(g => g.recommended || g.enabled).length > 0 && (
                <div className="guardrails-section">
                  <div className="guardrails-section-header"><Icon name="sparkle" weight="bold" size={16} /><h4>Recommended based on your instructions</h4></div>
                  <div className="guardrails-grid">
                    {guardrails.filter(g => g.recommended || g.enabled).map((g) => (
                      <div key={g.id} className={`guardrail-card${g.enabled ? ' enabled' : ''}`}>
                        <div className="guardrail-card-title-row">
                          <Toggle checked={g.enabled} onChange={() => setGuardrails(prev => prev.map(gr => gr.id === g.id ? { ...gr, enabled: !gr.enabled } : gr))} size="compact" />
                          <Icon name={(GUARDRAIL_CATEGORIES.find(c => c.id === g.category)?.icon ?? 'info-circle') as any} weight="bold" size={16} />
                          <h4 className="guardrail-card-name">{g.name}</h4>
                          <div className="guardrail-card-actions">
                            {g.reasoning && (
                              <Tooltip content={<><strong>Reasoning</strong><br />{g.reasoning}</>} placement="bottom-end">
                                <button type="button" className="guardrail-action-btn" aria-label="Reasoning"><Icon name="info-circle" weight="bold" size={14} /></button>
                              </Tooltip>
                            )}
                            <button type="button" className="guardrail-action-btn" aria-label="Edit" onClick={() => { setEditingGuardrailId(g.id); setNewGuardrailName(g.name); setNewGuardrailDesc(g.description); setNewGuardrailCategory(g.category); setShowAddGuardrail(true); }}><Icon name="edit" weight="bold" size={14} /></button>
                            <button type="button" className="guardrail-action-btn" aria-label="Delete" onClick={() => setDeleteGuardrailId(g.id)}><Icon name="delete" weight="bold" size={14} /></button>
                          </div>
                        </div>
                        <div className="guardrail-card-chips">
                          <span className="guardrail-card-chip">{GUARDRAIL_CATEGORIES.find(c => c.id === g.category)?.label}</span>
                          {g.custom && <span className="guardrail-card-chip guardrail-custom-chip">Custom</span>}
                        </div>
                        <p className="guardrail-card-desc">{g.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="guardrails-section">
                <button type="button" className="guardrails-expand-btn" onClick={() => setShowAllGuardrails(prev => !prev)}>
                  <Icon name={showAllGuardrails ? 'arrow-up' : 'arrow-down'} weight="bold" size={16} />
                  {showAllGuardrails ? 'Collapse all guardrails' : `Show all guardrails (${guardrails.length})`}
                </button>
                {showAllGuardrails && (
                  <>
                    <div className="guardrails-filters">
                      <button type="button" className={`guardrails-filter-pill${guardrailFilter === 'all' ? ' active' : ''}`} onClick={() => setGuardrailFilter('all')}>All</button>
                      {GUARDRAIL_CATEGORIES.map((cat) => (
                        <button key={cat.id} type="button" className={`guardrails-filter-pill${guardrailFilter === cat.id ? ' active' : ''}`} onClick={() => setGuardrailFilter(cat.id)}>{cat.label}</button>
                      ))}
                    </div>
                    <div className="guardrails-grid">
                      {guardrails.filter(g => guardrailFilter === 'all' ? true : g.category === guardrailFilter).map((g) => (
                        <div key={g.id} className={`guardrail-card${g.enabled ? ' enabled' : ''}`}>
                          <div className="guardrail-card-title-row">
                            <Toggle checked={g.enabled} onChange={() => setGuardrails(prev => prev.map(gr => gr.id === g.id ? { ...gr, enabled: !gr.enabled } : gr))} size="compact" />
                            <Icon name={(GUARDRAIL_CATEGORIES.find(c => c.id === g.category)?.icon ?? 'info-circle') as any} weight="bold" size={16} />
                            <h4 className="guardrail-card-name">{g.name}</h4>
                            <div className="guardrail-card-actions">
                              {g.reasoning && (
                                <Tooltip content={<><strong>Reasoning</strong><br />{g.reasoning}</>} placement="bottom-end">
                                  <button type="button" className="guardrail-action-btn" aria-label="Reasoning"><Icon name="info-circle" weight="bold" size={14} /></button>
                                </Tooltip>
                              )}
                              <button type="button" className="guardrail-action-btn" aria-label="Edit" onClick={() => { setEditingGuardrailId(g.id); setNewGuardrailName(g.name); setNewGuardrailDesc(g.description); setNewGuardrailCategory(g.category); setShowAddGuardrail(true); }}><Icon name="edit" weight="bold" size={14} /></button>
                              <button type="button" className="guardrail-action-btn" aria-label="Delete" onClick={() => setDeleteGuardrailId(g.id)}><Icon name="delete" weight="bold" size={14} /></button>
                            </div>
                          </div>
                          <div className="guardrail-card-chips">
                            <span className="guardrail-card-chip">{GUARDRAIL_CATEGORIES.find(c => c.id === g.category)?.label}</span>
                            {g.custom && <span className="guardrail-card-chip guardrail-custom-chip">Custom</span>}
                          </div>
                          <p className="guardrail-card-desc">{g.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
                          <Toggle checked={row.enabled} onChange={() => toggleAction(row.id)} />
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
                        Selected ({confirmedActions.length}/{9 - rows.length})
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

      {deleteGuardrailId && (
        <Modal size="sm" onClose={() => setDeleteGuardrailId(null)}>
          <ModalHeader
            title="Delete guardrail?"
            description={`"${guardrails.find(g => g.id === deleteGuardrailId)?.name}" will be permanently removed. This action cannot be undone.`}
            onClose={() => setDeleteGuardrailId(null)}
          />
          <ModalFooter>
            <Button variant="tertiary" onClick={() => setDeleteGuardrailId(null)}>Cancel</Button>
            <Button variant="primary" style={{ background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => {
              setGuardrails(prev => prev.filter(g => g.id !== deleteGuardrailId));
              setDeleteGuardrailId(null);
              showToast('Guardrail removed', 'success');
            }}>Delete</Button>
          </ModalFooter>
        </Modal>
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

      {showAddGuardrail && createPortal(
        <div className="fpmodal-overlay">
          <div className="fpmodal" role="dialog" aria-modal="true" aria-label={editingGuardrailId ? 'Edit guardrail' : 'Create guardrail'}>
            <div className="fpmodal-header">
              <div className="fpmodal-header__left">
                <h1 className="fpmodal-title">{editingGuardrailId ? 'Edit guardrail' : 'Create new guardrail'}</h1>
                <p className="fpmodal-subtitle">Define a guardrail to control agent behavior, compliance, or safety.</p>
              </div>
              <button className="fpmodal-close" onClick={() => setShowAddGuardrail(false)} aria-label="Close"><Icon name="cancel" weight="bold" size={32} /></button>
            </div>
            <div className="fpmodal-body">
              <div className="fpmodal-content-area">
                <div className="fpmodal-section">
                  <h2 className="fpmodal-section-title">Guardrail details</h2>
                  <div className="fpmodal-card" style={{ maxWidth: 640 }}>
                    <Input label="Name" required value={newGuardrailName} onChange={(e) => setNewGuardrailName(e.target.value)} placeholder="e.g. Block competitor mentions" clearable onClear={() => setNewGuardrailName('')} />
                    <Textarea label="Description" value={newGuardrailDesc} onChange={(e) => setNewGuardrailDesc(e.target.value)} placeholder="Describe what this guardrail should enforce or prevent..." rows={5} />
                    <Dropdown label="Category" options={GUARDRAIL_CATEGORIES.map(c => ({ value: c.id, label: c.label }))} value={newGuardrailCategory} onChange={(v) => setNewGuardrailCategory(v as GuardrailCategory)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="fpmodal-footer"><div className="fpmodal-footer-divider" /><div className="fpmodal-footer-bar"><div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={() => setShowAddGuardrail(false)}>Cancel</Button>
              <Button disabled={!newGuardrailName.trim()} onClick={() => {
                if (editingGuardrailId) { setGuardrails(prev => prev.map(g => g.id === editingGuardrailId ? { ...g, name: newGuardrailName.trim(), description: newGuardrailDesc.trim(), category: newGuardrailCategory } : g)); showToast('Guardrail updated', 'success'); }
                else { setGuardrails(prev => [...prev, { id: `gr-custom-${Date.now()}`, name: newGuardrailName.trim(), description: newGuardrailDesc.trim(), category: newGuardrailCategory, enabled: true, custom: true }]); showToast('Guardrail created', 'success'); }
                setNewGuardrailName(''); setNewGuardrailDesc(''); setShowAddGuardrail(false); setEditingGuardrailId(null);
              }}>{editingGuardrailId ? 'Save' : 'Create'}</Button>
            </div></div></div>
          </div>
        </div>,
        document.body,
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
                <div className="optimize-modal-text">{optimizeState === 'generating' ? originalTextSnapshot : optimizedText}</div>
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
    </div>
  );
}
