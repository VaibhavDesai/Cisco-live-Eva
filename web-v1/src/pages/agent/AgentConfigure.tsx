import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { AgentHeader } from '../../components/agents';
import Button from '../../components/shared/Button';
import Toggle from '../../components/shared/Toggle';
import Dropdown from '../../components/shared/Dropdown';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/shared/Modal';
import { Icon } from '../../icons';
import {
  type UpdateStatus,
  type RiskLevel,
  type CapabilityRecord,
  type VersionMeta,
  KNOWLEDGE_BASES,
  CAPABILITIES,
  INTEGRATIONS,
  MCP_SERVERS,
  A2A_AGENTS,
  APP_CONNECTORS,
  ACTION_UPDATE_FEATURES,
  DEFAULT_VERSION_META,
  AVAILABLE_ACTIONS,
  buildSeededVersionCache,
  resolveVersionMetaFromCache,
} from './actionConfigShared';

// Chip component for capabilities in instruction
function CapabilityChip({ name, type, onRemove }) {
  return (
    <span className={`instruction-chip chip-${type.toLowerCase()}`} contentEditable={false}>
      <span className="chip-icon">⚡</span>
      {name}
      <button className="chip-remove" onClick={onRemove}>×</button>
    </span>
  );
}

// Example instruction templates
const EXAMPLE_TEMPLATES = [
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Standard support agent instructions',
    content: `You are a helpful customer support agent. Your role is to assist customers with their inquiries, troubleshoot issues, and provide accurate information.

## Guidelines:
- Always be polite, professional, and empathetic
- If you don't know the answer, offer to connect the customer with a human agent
- Never make up information about products or policies
- Keep responses concise but helpful

## Tone:
Professional yet friendly. Use clear, simple language.`
  },
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'Product recommendation focus',
    content: `You are a knowledgeable sales assistant. Help customers find the perfect products based on their needs and preferences.

## Guidelines:
- Ask clarifying questions to understand customer needs
- Provide personalized product recommendations
- Highlight key features and benefits
- Be transparent about pricing and availability

## Tone:
Enthusiastic and helpful without being pushy.`
  },
  {
    id: 'technical-help',
    name: 'Technical Help',
    description: 'Troubleshooting focus',
    content: `You are a technical support specialist. Help users diagnose and resolve technical issues with our products.

## Guidelines:
- Ask for error messages and system information
- Provide step-by-step troubleshooting instructions
- Escalate complex issues to engineering when needed
- Document solutions for future reference

## Tone:
Patient, clear, and technically precise.`
  },
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Flexible conversational agent',
    content: `You are a versatile AI assistant. Help users with a wide range of questions and tasks.

## Guidelines:
- Adapt your communication style to match the user
- Provide accurate and helpful information
- Acknowledge when you're uncertain
- Offer to help with follow-up questions

## Tone:
Friendly, approachable, and adaptable.`
  }
];

const WELCOME_MESSAGE = `## Welcome Message

👋 Welcome! I'm here to help you today.

Before we begin, could you please tell me:
- Your name
- What I can help you with today

---

`;

export default function AgentConfigure() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, currentAgent, selectAgent, showToast } = useApp();
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [capabilities, setCapabilities] = useState<CapabilityRecord[]>(CAPABILITIES);
  const [selectedKbs, setSelectedKbs] = useState([1, 2]);
  const [language, setLanguage] = useState('English');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const instructionRef = useRef(null);
  const instructionContainerRef = useRef(null);
  const initialized = useRef(false);
  const launchSourceRef = useRef<string>('default');
  const pendingModalOpenRef = useRef(false);

  // Plus menu state
  const [showPlusButton, setShowPlusButton] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusButtonPosition, setPlusButtonPosition] = useState({ x: 0, y: 0 });
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showCapabilityPicker, setShowCapabilityPicker] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Add Capability Modal state
  const [showAddCapabilityModal, setShowAddCapabilityModal] = useState(false);
  const [addCapabilitySearch, setAddCapabilitySearch] = useState('');
  const [addCapabilityTab, setAddCapabilityTab] = useState('all');
  const [selectedCapabilities, setSelectedCapabilities] = useState<number[]>([]);
  
  // Enhanced modal state
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [selectedIntegrationActions, setSelectedIntegrationActions] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    id: number | string,
    name: string,
    source: string,
    currentVersion?: string,
    latestVersion?: string,
    updateStatus?: UpdateStatus,
    riskLevel?: RiskLevel,
    changeSummary?: string[],
    requiresConnectorReconfiguration?: boolean,
    lastCheckedAt?: string
  } | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string>(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
  const [confirmedActions, setConfirmedActions] = useState<{
    id: number | string,
    name: string,
    source: string,
    connector: string,
    currentVersion?: string,
    latestVersion?: string,
    updateStatus?: UpdateStatus,
    riskLevel?: RiskLevel,
    changeSummary?: string[],
    requiresConnectorReconfiguration?: boolean,
    lastCheckedAt?: string
  }[]>([]);
  const [showAddCustomMenu, setShowAddCustomMenu] = useState(false);
  const addCustomBtnRef = useRef<HTMLButtonElement>(null);
  const [editingActionConnector, setEditingActionConnector] = useState<string | null>(null);
  const [actionVersionCache, setActionVersionCache] = useState<Record<string, VersionMeta>>(() => buildSeededVersionCache(new Date().toISOString()));
  const [versionCheckLifecycle, setVersionCheckLifecycle] = useState<'idle' | 'checking' | 'stale'>('idle');
  const [deferredVersionUpdates, setDeferredVersionUpdates] = useState<Record<string, boolean>>({});
  const [showPendingChangeSummary, setShowPendingChangeSummary] = useState(false);
  const [showCapabilityChangeSummary, setShowCapabilityChangeSummary] = useState(false);
  const [requiresConnectorReconfiguration, setRequiresConnectorReconfiguration] = useState(false);
  const [versionEvents, setVersionEvents] = useState<string[]>([]);
  const [showCapabilityEditModal, setShowCapabilityEditModal] = useState(false);
  const [editingCapabilityId, setEditingCapabilityId] = useState<number | null>(null);
  const [editingCapabilityName, setEditingCapabilityName] = useState('');
  const [editingCapabilityDescription, setEditingCapabilityDescription] = useState('');
  
  // List expansion state (show all vs show 3)
  const [capabilitiesListExpanded, setCapabilitiesListExpanded] = useState(false);
  const [variablesListExpanded, setVariablesListExpanded] = useState(false);
  const [knowledgeListExpanded, setKnowledgeListExpanded] = useState(false);
  const LIST_PREVIEW_COUNT = 3;

  // Sample variables/entities data
  const [variables] = useState([
    { id: 1, name: 'caller_fname', source: 'CJDS', description: 'Collect the caller\'s first name' },
    { id: 2, name: 'caller_lname', source: 'CJDS', description: 'Collect the caller\'s last name' },
    { id: 3, name: 'appt_time', source: 'CJDS', description: 'The time they would like to book their appointment' },
    { id: 4, name: 'doctor', source: 'CJDS', description: 'The name of the doctor' },
    { id: 5, name: 'insurance_provider', source: 'CJDS', description: 'The name of the insurance provider' },
  ]);

  const trackActionVersionEvent = (eventName: string, payload: Record<string, any>) => {
    if (!ACTION_UPDATE_FEATURES.telemetry) return;
    const eventLine = `${new Date().toISOString()}|${eventName}|${JSON.stringify(payload)}`;
    setVersionEvents(prev => [eventLine, ...prev].slice(0, 50));
    console.info('[version-management]', eventName, payload);
  };

  useEffect(() => {
    if (!ACTION_UPDATE_FEATURES.enabled) return;
    setVersionCheckLifecycle('checking');
    const timer = setTimeout(() => {
      const now = new Date().toISOString();
      const seeded = buildSeededVersionCache(now);
      setActionVersionCache(seeded);
      setVersionCheckLifecycle('stale');
      trackActionVersionEvent('version_check_complete', { count: Object.keys(seeded).length });
    }, 260);
    return () => clearTimeout(timer);
  }, []);

  const resolveVersionMeta = (actionId: number | string, actionName: string) => {
    return resolveVersionMetaFromCache(actionVersionCache, actionId, actionName);
  };

  const getActionBannerKey = (action: { id: number | string; latestVersion?: string; }) => {
    return `${String(action.id)}:${action.latestVersion || 'unknown'}`;
  };

  const shouldShowVersionBanner = (action: any) => {
    if (!action) return false;
    const hasUpdate = action.updateStatus === 'updateAvailable' || action.updateStatus === 'incompatible';
    if (!hasUpdate) return false;
    return !deferredVersionUpdates[getActionBannerKey(action)];
  };

  useEffect(() => {
    if (!pendingAction) return;
    if (!editingActionConnector) return;
    if (!shouldShowVersionBanner(pendingAction)) return;
    trackActionVersionEvent('banner_viewed', {
      actionId: pendingAction.id,
      updateStatus: pendingAction.updateStatus,
      latestVersion: pendingAction.latestVersion,
      checkLifecycle: versionCheckLifecycle,
    });
  }, [pendingAction?.id, pendingAction?.latestVersion, pendingAction?.updateStatus, editingActionConnector, versionCheckLifecycle]);

  // Set initial content only once
  useEffect(() => {
    if (instructionRef.current && !initialized.current) {
      instructionRef.current.innerHTML = `You are a helpful customer support agent for Acme Corporation. Your role is to assist customers with their inquiries, troubleshoot issues, and provide accurate information.<br><br>## Guidelines:<br>- Always be polite, professional, and empathetic<br>- If you don't know the answer, offer to connect the customer with a human agent<br>- Never make up information about products or policies<br>- Keep responses concise but helpful<br><br>## Tone:<br>Professional yet friendly. Use clear, simple language.`;
      initialized.current = true;
    }
  }, []);

  // Update plus button position based on cursor - at end of current line's text
  const updatePlusButtonPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && instructionRef.current) {
      const range = selection.getRangeAt(0);
      if (instructionRef.current.contains(range.startContainer)) {
        const cursorRect = range.getBoundingClientRect();
        const containerRect = instructionRef.current.getBoundingClientRect();
        
        if (cursorRect.top > 0) {
          // Find the end of text on current line by creating a range to end of line
          const lineRange = document.createRange();
          const node = range.startContainer;
          
          // Try to find end of current text node or line
          let endX = cursorRect.right;
          
          if (node.nodeType === Node.TEXT_NODE) {
            // Get the text content and find where the line ends
            const text = node.textContent || '';
            const offset = range.startOffset;
            
            // Find the next line break or end of text
            let lineEndOffset = text.indexOf('\n', offset);
            if (lineEndOffset === -1) lineEndOffset = text.length;
            
            // Create a range to measure end position
            const tempRange = document.createRange();
            tempRange.setStart(node, Math.min(lineEndOffset, text.length));
            tempRange.setEnd(node, Math.min(lineEndOffset, text.length));
            const endRect = tempRange.getBoundingClientRect();
            
            if (endRect.right > 0 && endRect.top === cursorRect.top) {
              endX = endRect.right;
            }
          }
          
          // Cap at container right edge minus padding
          const maxX = containerRect.right - 32;
          endX = Math.min(endX + 12, maxX);
          
          setPlusButtonPosition({
            x: endX,
            y: cursorRect.top - 4
          });
        }
      }
    }
  };

  // Handle focus on instruction field
  const handleInstructionFocus = () => {
    setShowPlusButton(true);
    setTimeout(updatePlusButtonPosition, 10);
  };

  // Handle blur on instruction field
  const handleInstructionBlur = (e) => {
    // Don't hide if clicking on plus button or menu
    const relatedTarget = e.relatedTarget;
    if (relatedTarget?.closest('.instruction-plus-btn') || 
        relatedTarget?.closest('.instruction-plus-menu') ||
        relatedTarget?.closest('.instruction-capability-picker')) {
      return;
    }
    // Longer delay to allow menu clicks to register
    setTimeout(() => {
      if (!showPlusMenu && !showCapabilityPicker) {
        setShowPlusButton(false);
      }
    }, 200);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const target = e.target;
      if (showPlusMenu || showCapabilityPicker) {
        if (!target.closest('.instruction-plus-menu') && 
            !target.closest('.instruction-capability-picker') &&
            !target.closest('.instruction-plus-btn')) {
          setShowPlusMenu(false);
          setShowCapabilityPicker(false);
        }
      }
      // Close Add Custom menu when clicking outside
      if (showAddCustomMenu) {
        if (!target.closest('.add-custom-dropdown-wrapper')) {
          setShowAddCustomMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu, showCapabilityPicker, showAddCustomMenu]);

  // Handle selection change in instruction field
  const handleSelectionChange = () => {
    if (showPlusButton) {
      updatePlusButtonPosition();
    }
  };

  // Add welcome message at the beginning
  const handleAddWelcome = () => {
    if (instructionRef.current) {
      const currentContent = instructionRef.current.innerHTML;
      instructionRef.current.innerHTML = WELCOME_MESSAGE.replace(/\n/g, '<br>') + currentContent;
      showToast('Welcome message added');
    }
    setShowPlusMenu(false);
  };

  // Open examples modal
  const handleViewExamples = () => {
    setShowPlusMenu(false);
    setShowExamplesModal(true);
  };

  // Apply example template
  const handleApplyTemplate = (template) => {
    if (instructionRef.current) {
      instructionRef.current.innerHTML = template.content.replace(/\n/g, '<br>');
      showToast(`Applied "${template.name}" template`);
    }
    setShowExamplesModal(false);
  };

  // Optimize instruction with mock AI
  const handleOptimizeInstruction = () => {
    setShowPlusMenu(false);
    setIsOptimizing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      if (instructionRef.current) {
        const currentContent = instructionRef.current.innerText;
        const optimizedContent = `## Role & Purpose
You are a professional customer support agent for Acme Corporation, dedicated to providing exceptional service.

## Core Responsibilities
- Assist customers with inquiries and issues
- Provide accurate, helpful information
- Troubleshoot problems efficiently

## Communication Guidelines
1. **Be Professional**: Maintain a polite, empathetic tone
2. **Be Honest**: Never fabricate information about products or policies
3. **Be Helpful**: Offer to connect with human agents when needed
4. **Be Concise**: Keep responses clear and to the point

## Response Style
- Use clear, simple language
- Structure responses for easy reading
- Acknowledge customer concerns
- End with next steps or follow-up options`;
        
        instructionRef.current.innerHTML = optimizedContent.replace(/\n/g, '<br>');
        showToast('Instruction optimized with AI');
      }
      setIsOptimizing(false);
    }, 1500);
  };

  // Show capability picker
  const handleShowCapabilityPicker = () => {
    setShowPlusMenu(false);
    setShowCapabilityPicker(true);
  };

  // Insert capability at cursor position
  const insertCapabilityAtCursor = (cap) => {
    if (!instructionRef.current) return;
    
    const colors = {
      mcp: { bg: 'color-mix(in srgb, var(--accent-color) 20%, transparent)', color: 'var(--accent-color)', border: 'color-mix(in srgb, var(--accent-color) 30%, transparent)' },
      action: { bg: 'color-mix(in srgb, var(--color-theme-text-team-violet-normal) 20%, transparent)', color: 'var(--color-theme-text-team-violet-normal)', border: 'color-mix(in srgb, var(--color-theme-text-team-violet-normal) 30%, transparent)' },
      handoff: { bg: 'color-mix(in srgb, var(--success-color) 20%, transparent)', color: 'var(--success-color)', border: 'color-mix(in srgb, var(--success-color) 30%, transparent)' }
    };
    const typeColor = colors[cap.type.toLowerCase()] || colors.mcp;
    
    const chip = document.createElement('span');
    chip.setAttribute('contenteditable', 'false');
    chip.style.cssText = `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; background: ${typeColor.bg}; color: ${typeColor.color}; border: 1px solid ${typeColor.border}; font-size: 12px; font-weight: 500; margin: 0 2px; vertical-align: middle;`;
    chip.textContent = `⚡ ${cap.name}`;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (instructionRef.current.contains(range.startContainer)) {
        range.insertNode(chip);
        const space = document.createTextNode('\u00A0');
        if (chip.nextSibling) {
          chip.parentNode.insertBefore(space, chip.nextSibling);
        } else {
          chip.parentNode.appendChild(space);
        }
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        instructionRef.current.appendChild(document.createTextNode('\u00A0'));
        instructionRef.current.appendChild(chip);
        instructionRef.current.appendChild(document.createTextNode('\u00A0'));
      }
    } else {
      instructionRef.current.appendChild(document.createTextNode('\u00A0'));
      instructionRef.current.appendChild(chip);
      instructionRef.current.appendChild(document.createTextNode('\u00A0'));
    }
    
    setShowCapabilityPicker(false);
    instructionRef.current.focus();
    showToast(`Added "${cap.name}" capability`);
  };
  
  // Advanced settings state
  const [responseLength, setResponseLength] = useState('medium');
  const [fallbackBehavior, setFallbackBehavior] = useState('transfer');
  const [temperature, setTemperature] = useState('0.7');
  const [multiLanguage, setMultiLanguage] = useState(false);

  // Drag and drop handlers
  const handleDragStart = (e, cap) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...cap, itemType: 'capability' }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleVariableDragStart = (e, variable) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...variable, itemType: 'variable' }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const insertVariableAtCursor = (variable) => {
    if (!instructionRef.current) return;
    
    const variableText = `{{${variable.name}}}`;
    
    // Create variable chip element
    const chip = document.createElement('span');
    chip.setAttribute('contenteditable', 'false');
    chip.style.cssText = `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; background: var(--color-theme-background-primary-hover); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 12px; font-family: 'Monaco', 'Menlo', monospace; margin: 0 2px; vertical-align: middle;`;
    chip.textContent = variableText;
    
    // Try to insert at current cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (instructionRef.current.contains(range.startContainer)) {
        range.deleteContents();
        range.insertNode(chip);
        // Add space after chip
        const space = document.createTextNode('\u00A0');
        if (chip.nextSibling) {
          chip.parentNode.insertBefore(space, chip.nextSibling);
        } else {
          chip.parentNode.appendChild(space);
        }
        // Move cursor after the space
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        instructionRef.current.focus();
        return;
      }
    }
    
    // Fallback: append at end
    instructionRef.current.appendChild(document.createTextNode('\u00A0'));
    instructionRef.current.appendChild(chip);
    instructionRef.current.appendChild(document.createTextNode('\u00A0'));
    instructionRef.current.focus();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data || !instructionRef.current) return;
    
    try {
      const item = JSON.parse(data);
      
      let chip;
      
      if (item.itemType === 'variable') {
        // Create variable chip
        const variableText = `{{${item.name}}}`;
        chip = document.createElement('span');
        chip.setAttribute('contenteditable', 'false');
        chip.style.cssText = `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; background: var(--color-theme-background-primary-hover); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 12px; font-family: 'Monaco', 'Menlo', monospace; margin: 0 2px; vertical-align: middle;`;
        chip.textContent = variableText;
      } else {
        const colors = {
          mcp: { bg: 'color-mix(in srgb, var(--accent-color) 20%, transparent)', color: 'var(--accent-color)', border: 'color-mix(in srgb, var(--accent-color) 30%, transparent)' },
          action: { bg: 'color-mix(in srgb, var(--color-theme-text-team-violet-normal) 20%, transparent)', color: 'var(--color-theme-text-team-violet-normal)', border: 'color-mix(in srgb, var(--color-theme-text-team-violet-normal) 30%, transparent)' },
          handoff: { bg: 'color-mix(in srgb, var(--success-color) 20%, transparent)', color: 'var(--success-color)', border: 'color-mix(in srgb, var(--success-color) 30%, transparent)' }
        };
        const typeColor = colors[item.type?.toLowerCase()] || colors.mcp;
        
        chip = document.createElement('span');
        chip.setAttribute('contenteditable', 'false');
        chip.style.cssText = `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; background: ${typeColor.bg}; color: ${typeColor.color}; border: 1px solid ${typeColor.border}; font-size: 12px; font-weight: 500; margin: 0 2px; vertical-align: middle;`;
        chip.textContent = `⚡ ${item.name}`;
      }
      
      // Get drop position from mouse coordinates
      let range = null;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      }
      
      if (range && instructionRef.current.contains(range.startContainer)) {
        // Insert at exact drop position
        range.insertNode(chip);
        // Add space after chip
        const space = document.createTextNode('\u00A0');
        if (chip.nextSibling) {
          chip.parentNode.insertBefore(space, chip.nextSibling);
        } else {
          chip.parentNode.appendChild(space);
        }
        // Move cursor after the space
        range.setStartAfter(space);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // Fallback: append at end
        instructionRef.current.appendChild(document.createTextNode('\u00A0'));
        instructionRef.current.appendChild(chip);
        instructionRef.current.appendChild(document.createTextNode('\u00A0'));
      }
      
      instructionRef.current.focus();
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // If no current agent or different agent, select it
  if (!currentAgent || currentAgent.id !== agentId) {
    const agent = agents[agentId];
    if (agent) {
      selectAgent(agentId);
    } else {
      return <Navigate to="/agents" replace />;
    }
  }

  const agent = currentAgent || agents[agentId];
  if (!agent) return <Navigate to="/agents" replace />;

  // Initialize state from agent data
  if (!agentName && agent.name) {
    setAgentName(agent.name);
    setDescription(agent.description || '');
  }

  const toggleCapability = (id) => {
    setCapabilities(prev => 
      prev.map(cap => cap.id === id ? { ...cap, enabled: !cap.enabled } : cap)
    );
  };

  const toggleKnowledge = (id) => {
    setSelectedKbs(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    showToast('Changes saved successfully', 'success');
  };

  const handleSaveAdvanced = () => {
    setShowAdvancedModal(false);
    showToast('Advanced settings saved', 'success');
  };

  const staleCapabilityCount = capabilities.filter((cap) => {
    const meta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
    return meta.updateStatus === 'updateAvailable' || meta.updateStatus === 'incompatible';
  }).length;

  const handleUseLatestForPending = () => {
    if (!pendingAction) return;
    const latestMeta = resolveVersionMeta(pendingAction.id, pendingAction.name);
    setPendingAction(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentVersion: latestMeta.latestVersion,
        latestVersion: latestMeta.latestVersion,
        updateStatus: 'upToDate',
        riskLevel: latestMeta.riskLevel,
        changeSummary: latestMeta.changeSummary,
        requiresConnectorReconfiguration: latestMeta.requiresConnectorReconfiguration,
        lastCheckedAt: latestMeta.lastCheckedAt,
      };
    });
    setShowPendingChangeSummary(false);
    if (latestMeta.requiresConnectorReconfiguration) {
      setRequiresConnectorReconfiguration(true);
      setSelectedConnector('');
    }
    trackActionVersionEvent('apply_latest_pending', { actionId: pendingAction.id, latestVersion: latestMeta.latestVersion });
  };

  const handleKeepCurrentForPending = () => {
    if (!pendingAction) return;
    setDeferredVersionUpdates(prev => ({ ...prev, [getActionBannerKey(pendingAction)]: true }));
    setShowPendingChangeSummary(false);
    trackActionVersionEvent('keep_current_pending', { actionId: pendingAction.id, currentVersion: pendingAction.currentVersion });
  };

  const handleUseLatestForCapability = () => {
    if (editingCapabilityId === null) return;
    setCapabilities(prev =>
      prev.map(cap => {
        if (cap.id !== editingCapabilityId) return cap;
        const latestMeta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
        return {
          ...cap,
          currentVersion: latestMeta.latestVersion,
          latestVersion: latestMeta.latestVersion,
          updateStatus: 'upToDate',
          riskLevel: latestMeta.riskLevel,
          changeSummary: latestMeta.changeSummary,
          requiresConnectorReconfiguration: latestMeta.requiresConnectorReconfiguration,
          lastCheckedAt: latestMeta.lastCheckedAt,
          requiresReconfiguration: !!latestMeta.requiresConnectorReconfiguration,
        };
      })
    );
    setShowCapabilityChangeSummary(false);
    trackActionVersionEvent('apply_latest_capability', { capabilityId: editingCapabilityId });
    showToast('Action updated to latest version');
  };

  const handleKeepCurrentForCapability = () => {
    if (!editingCapability) return;
    setDeferredVersionUpdates(prev => ({ ...prev, [getActionBannerKey(editingCapability)]: true }));
    setShowCapabilityChangeSummary(false);
    trackActionVersionEvent('keep_current_capability', { capabilityId: editingCapability.id });
  };

  const handleOpenCapabilityEdit = (cap) => {
    const versionMeta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
    setEditingCapabilityId(cap.id);
    setEditingCapabilityName(cap.name || '');
    setEditingCapabilityDescription(cap.description || `Configure how ${cap.name} should be used by this agent.`);
    setShowCapabilityChangeSummary(false);
    setCapabilities(prev =>
      prev.map(item =>
        item.id === cap.id
          ? {
              ...item,
              currentVersion: item.currentVersion || versionMeta.currentVersion,
              latestVersion: item.latestVersion || versionMeta.latestVersion,
              updateStatus: item.updateStatus || versionMeta.updateStatus,
              riskLevel: item.riskLevel || versionMeta.riskLevel,
              changeSummary: item.changeSummary || versionMeta.changeSummary,
              requiresConnectorReconfiguration: item.requiresConnectorReconfiguration ?? versionMeta.requiresConnectorReconfiguration,
              lastCheckedAt: item.lastCheckedAt || versionMeta.lastCheckedAt,
            }
          : item
      )
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const actionFlow = params.get('actionFlow');
    const capIdParam = params.get('capId');
    const sourceParam = params.get('source');

    if (!actionFlow) return;

    if (sourceParam === 'v2') {
      launchSourceRef.current = 'v2';
    }

    pendingModalOpenRef.current = true;

    if (actionFlow === 'add') {
      navigate(`/agents/${agent.id}/configure`, { replace: true });
      setShowAddCapabilityModal(true);
      return;
    }

    if (actionFlow === 'edit' && capIdParam) {
      const capId = Number(capIdParam);
      const target = capabilities.find(c => c.id === capId);
      navigate(`/agents/${agent.id}/configure`, { replace: true });
      if (target) {
        handleOpenCapabilityEdit(target);
      }
    }
  }, [location.search, agent.id]);

  useEffect(() => {
    if (pendingModalOpenRef.current) {
      pendingModalOpenRef.current = false;
      return;
    }
    if (showAddCapabilityModal || showCapabilityEditModal) return;
    if (launchSourceRef.current !== 'v2') return;
    launchSourceRef.current = 'default';
  }, [showAddCapabilityModal, showCapabilityEditModal]);

  const handleSaveCapabilityEdit = () => {
    if (editingCapabilityId === null) return;
    setCapabilities(prev =>
      prev.map(cap =>
        cap.id === editingCapabilityId
          ? {
              ...cap,
              name: editingCapabilityName.trim() || cap.name,
              description: editingCapabilityDescription.trim()
            }
          : cap
      )
    );
    handleCloseCapabilityEdit();
    showToast('Capability updated');
  };

  const editingCapability = capabilities.find(cap => cap.id === editingCapabilityId) || null;
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

  return (
    <div className="primary-content">
      <AgentHeader
        agent={agent}
        activeTab="configure"
        showPublishButton={false}
        headerRight={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary">Preview</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        }
      />

      {/* Unified Configure Layout */}
      <div className="configure-layout">
        {/* Left: Main Instruction Area */}
        <div className="configure-main">
          <div className="configure-section">
            <label className="configure-label">Instruction</label>
            <div className="instruction-editor-container" ref={instructionContainerRef}>
              {/* Formatting Toolbar */}
              <div className="instruction-toolbar">
                <div className="toolbar-left">
                  <div className="toolbar-group">
                    <button 
                      className="toolbar-btn" 
                      title="Bold (Ctrl+B)"
                      onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
                    >
                      <Icon name="bold" weight="bold" size="sm" />
                    </button>
                    <button 
                      className="toolbar-btn" 
                      title="Italic (Ctrl+I)"
                      onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
                    >
                      <Icon name="italic" weight="bold" size="sm" />
                    </button>
                    <button 
                      className="toolbar-btn" 
                      title="Underline (Ctrl+U)"
                      onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }}
                    >
                      <Icon name="underline" weight="bold" size="sm" />
                    </button>
                  </div>
                  <div className="toolbar-divider" />
                  <button 
                    className="toolbar-btn" 
                    title="Add Link"
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      const url = prompt('Enter URL:');
                      if (url) document.execCommand('createLink', false, url);
                    }}
                  >
                    <Icon name="link" weight="bold" size="sm" />
                  </button>
                  <div className="toolbar-divider" />
                  <button 
                    className="toolbar-btn" 
                    title="Markdown"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="20" height="16" rx="3" ry="3"/>
                      <path d="M6 16V8l3 4 3-4v8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 12l-2.5 4h-1l-2.5-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="toolbar-divider" />
                  <button 
                    className="toolbar-btn toolbar-btn-example" 
                    title="View example instructions"
                    onClick={() => setShowExamplesModal(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="7" y1="8" x2="17" y2="8"/>
                      <line x1="7" y1="12" x2="17" y2="12"/>
                      <line x1="7" y1="16" x2="12" y2="16"/>
                    </svg>
                    Example
                  </button>
                </div>
                <div className="toolbar-right">
                  <button 
                    className="toolbar-btn toolbar-btn-optimize"
                    onClick={handleOptimizeInstruction}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <>
                        <span className="toolbar-spinner" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" weight="bold" size="sm" />
                        Optimize instructions
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div 
                ref={instructionRef}
                className={`configure-textarea instruction-editor ${isDragOver ? 'drag-over' : ''}`}
                contentEditable
                suppressContentEditableWarning
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFocus={handleInstructionFocus}
                onBlur={handleInstructionBlur}
                onKeyUp={handleSelectionChange}
                onMouseUp={handleSelectionChange}
              />
              
            </div>
          </div>
        </div>

        {/* Floating Plus Button - rendered via portal */}
        {showPlusButton && createPortal(
          <button 
            className="instruction-plus-btn"
            style={{ 
              position: 'fixed',
              left: `${plusButtonPosition.x}px`,
              top: `${plusButtonPosition.y}px`
            }}
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            onMouseDown={(e) => e.preventDefault()}
          >
            +
          </button>,
          document.body
        )}
        
        {/* Plus Menu Dropdown - rendered via portal */}
        {showPlusMenu && createPortal(
          <div 
            className="instruction-plus-menu"
            style={{ 
              position: 'fixed',
              left: `${plusButtonPosition.x}px`,
              top: `${plusButtonPosition.y + 32}px`
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button onMouseDown={(e) => { e.preventDefault(); handleAddWelcome(); }}>
              <span className="menu-icon">
                <Icon name="email" weight="bold" size="sm" />
              </span>
              Add welcome message
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); handleViewExamples(); }}>
              <span className="menu-icon">
                <Icon name="document" weight="bold" size="sm" />
              </span>
              View and add example
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); if (!isOptimizing) handleOptimizeInstruction(); }} disabled={isOptimizing}>
              <span className="menu-icon">
                {isOptimizing ? (
                  <Icon name="refresh" weight="bold" size="sm" className="spinning" />
                ) : (
                  <Icon name="sparkle" weight="bold" size="sm" />
                )}
              </span>
              {isOptimizing ? 'Optimizing...' : 'Optimize my instruction'}
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); handleShowCapabilityPicker(); }}>
              <span className="menu-icon">
                <Icon name="apps" weight="bold" size="sm" />
              </span>
              Add capability
            </button>
          </div>,
          document.body
        )}
        
        {/* Capability Picker Dropdown - rendered via portal */}
        {showCapabilityPicker && createPortal(
          <div 
            className="instruction-capability-picker"
            style={{ 
              position: 'fixed',
              left: `${plusButtonPosition.x}px`,
              top: `${plusButtonPosition.y + 32}px`
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="picker-header">Select a capability</div>
            {capabilities.filter(c => c.enabled).map(cap => (
              <button 
                key={cap.id} 
                onMouseDown={(e) => { e.preventDefault(); insertCapabilityAtCursor(cap); }}
                className={`picker-item type-${cap.type.toLowerCase()}`}
              >
                <span className="picker-icon">⚡</span>
                <span className="picker-name">{cap.name}</span>
                <span className={`picker-type type-${cap.type.toLowerCase()}`}>{cap.type}</span>
              </button>
            ))}
          </div>,
          document.body
        )}

        {/* Right: Settings Sidebar */}
        <div className="configure-sidebar">
          {/* Agent Name */}
          <div className="configure-section">
            <label className="configure-label">Agent name</label>
            <input 
              type="text"
              className="configure-input"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Enter agent name"
            />
          </div>

          {/* Description */}
          <div className="configure-section">
            <label className="configure-label">Description</label>
            <textarea 
              className="configure-input configure-input-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this agent does"
              rows={3}
            />
          </div>

          {/* Capabilities */}
          <div className="configure-section">
            <label className="configure-label">
              Capabilities
              <span className="configure-label-hint">Drag capabilities to the instruction field</span>
            </label>
            {ACTION_UPDATE_FEATURES.showBulkReview && staleCapabilityCount > 0 && (
              <div className="configure-version-review-banner">
                {staleCapabilityCount} action{staleCapabilityCount > 1 ? 's have' : ' has'} updates available.
              </div>
            )}
            <div className="configure-list">
              {(capabilitiesListExpanded ? capabilities : capabilities.slice(0, LIST_PREVIEW_COUNT)).map(cap => {
                const versionMeta = resolveVersionMeta(cap.sourceActionId ?? cap.id, cap.name);
                const hasUpdate = versionMeta.updateStatus === 'updateAvailable' || versionMeta.updateStatus === 'incompatible';
                return (
                  <div 
                    key={cap.id} 
                    className={`configure-capability-item ${!cap.enabled ? 'disabled' : ''}`}
                    draggable={cap.enabled}
                    onDragStart={(e) => cap.enabled && handleDragStart(e, cap)}
                  >
                    <Toggle 
                      checked={cap.enabled}
                      onChange={() => toggleCapability(cap.id)}
                    />
                    <div className="configure-capability-info">
                      {hasUpdate && (
                        <span
                          className={`configure-capability-update-indicator ${versionMeta.updateStatus === 'incompatible' ? 'breaking' : ''}`}
                          title="A newer version is available"
                          aria-label="A newer version is available"
                        >
                          <Icon name="refresh" weight="bold" size="xs" />
                        </span>
                      )}
                      <span className="configure-capability-name">{cap.name}</span>
                      <span className={`configure-capability-type type-${cap.type.toLowerCase()}`}>{cap.type}</span>
                    </div>
                    <button
                      type="button"
                      className="configure-capability-edit-btn"
                      aria-label={`Edit ${cap.name}`}
                      title="Edit capability"
                      draggable={false}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenCapabilityEdit(cap);
                      }}
                    >
                      <Icon name="edit" weight="bold" size={14} />
                    </button>
                    {cap.enabled && <span className="drag-handle">⋮⋮</span>}
                  </div>
                );
              })}
              {capabilities.length > LIST_PREVIEW_COUNT && (
                <button 
                  className="configure-view-more-btn"
                  onClick={() => setCapabilitiesListExpanded(!capabilitiesListExpanded)}
                >
                  {capabilitiesListExpanded ? 'View less' : `View ${capabilities.length - LIST_PREVIEW_COUNT} more`}
                </button>
              )}
              <button className="configure-add-btn" onClick={() => setShowAddCapabilityModal(true)}>+ Add capability</button>
            </div>
          </div>

          {/* Variables/Entities */}
          <div className="configure-section">
            <label className="configure-label">Variables</label>
            <div className="configure-list">
                {(variablesListExpanded ? variables : variables.slice(0, LIST_PREVIEW_COUNT)).map(variable => (
                  <div 
                    key={variable.id} 
                    className="configure-variable-item"
                    draggable
                    onDragStart={(e) => handleVariableDragStart(e, variable)}
                    onClick={() => insertVariableAtCursor(variable)}
                    title="Click to insert or drag to instruction field"
                  >
                    <div className="variable-header">
                      <code className="variable-tag">{`{{${variable.name}}}`}</code>
                      <span className="variable-separator">•</span>
                      <span className="variable-source">{variable.source}</span>
                    </div>
                    <p className="variable-description">{variable.description}</p>
                  </div>
                ))}
                {variables.length > LIST_PREVIEW_COUNT && (
                  <button 
                    className="configure-view-more-btn"
                    onClick={() => setVariablesListExpanded(!variablesListExpanded)}
                  >
                    {variablesListExpanded ? 'View less' : `View ${variables.length - LIST_PREVIEW_COUNT} more`}
                  </button>
                )}
                <button className="configure-add-btn">+ Add new entity</button>
              </div>
          </div>

          {/* Knowledge */}
          <div className="configure-section">
            <label className="configure-label">Knowledge</label>
            <div className="configure-list">
              {(knowledgeListExpanded ? KNOWLEDGE_BASES : KNOWLEDGE_BASES.slice(0, LIST_PREVIEW_COUNT)).map(kb => (
                <div key={kb.id} className="configure-list-item">
                  <label className="configure-checkbox">
                    <input 
                      type="checkbox"
                      checked={selectedKbs.includes(kb.id)}
                      onChange={() => toggleKnowledge(kb.id)}
                    />
                    <span className="checkmark"></span>
                    <span>
                      {kb.name}
                      <span className="configure-list-meta">{kb.count}</span>
                    </span>
                  </label>
                </div>
              ))}
              {KNOWLEDGE_BASES.length > LIST_PREVIEW_COUNT && (
                <button 
                  className="configure-view-more-btn"
                  onClick={() => setKnowledgeListExpanded(!knowledgeListExpanded)}
                >
                  {knowledgeListExpanded ? 'View less' : `View ${KNOWLEDGE_BASES.length - LIST_PREVIEW_COUNT} more`}
                </button>
              )}
              <button className="configure-add-btn">+ Connect knowledge base</button>
            </div>
          </div>

          {/* Language */}
          <div className="configure-section">
            <label className="configure-label">Language</label>
            <Dropdown
              options={[
                { value: 'English', label: 'English' },
                { value: 'Spanish', label: 'Spanish' },
                { value: 'French', label: 'French' },
                { value: 'German', label: 'German' },
                { value: 'Japanese', label: 'Japanese' },
                { value: 'Chinese', label: 'Chinese' }
              ]}
              value={language}
              onChange={setLanguage}
            />
          </div>

          {/* Advanced Settings Link */}
          <button 
            className="configure-advanced-link"
            onClick={() => setShowAdvancedModal(true)}
          >
            Advanced settings →
          </button>
        </div>
      </div>

      {/* Advanced Settings Modal */}
      {showAdvancedModal && (
        <Modal onClose={() => setShowAdvancedModal(false)}>
          <ModalHeader title="Advanced Settings" onClose={() => setShowAdvancedModal(false)} />
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-small)' }}>
              {/* Response Language */}
              <div className="configure-section">
                <label className="configure-label">Response Language</label>
                <Dropdown
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Spanish', label: 'Spanish' },
                    { value: 'French', label: 'French' },
                    { value: 'German', label: 'German' },
                    { value: 'Japanese', label: 'Japanese' },
                    { value: 'Chinese', label: 'Chinese' },
                    { value: 'Portuguese', label: 'Portuguese' },
                    { value: 'Italian', label: 'Italian' },
                    { value: 'Korean', label: 'Korean' },
                    { value: 'Arabic', label: 'Arabic' }
                  ]}
                  value={language}
                  onChange={setLanguage}
                />
              </div>

              {/* Multi-language Support */}
              <div className="configure-section">
                <label className="configure-checkbox" style={{ cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={multiLanguage}
                    onChange={(e) => setMultiLanguage(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>
                    Enable multi-language support
                    <span className="configure-list-meta" style={{ display: 'block' }}>
                      Auto-detect and respond in user's language
                    </span>
                  </span>
                </label>
              </div>

              {/* Response Length */}
              <div className="configure-section">
                <label className="configure-label">Response Length</label>
                <Dropdown
                  options={[
                    { value: 'short', label: 'Short (50-100 words)' },
                    { value: 'medium', label: 'Medium (100-200 words)' },
                    { value: 'long', label: 'Long (200-500 words)' }
                  ]}
                  value={responseLength}
                  onChange={setResponseLength}
                />
              </div>

              {/* Temperature / Creativity */}
              <div className="configure-section">
                <label className="configure-label">
                  Creativity Level
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    {temperature}
                  </span>
                </label>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Fallback Behavior */}
              <div className="configure-section">
                <label className="configure-label">Fallback Behavior</label>
                <Dropdown
                  options={[
                    { value: 'transfer', label: 'Transfer to human agent' },
                    { value: 'faq', label: 'Show FAQ suggestions' },
                    { value: 'retry', label: 'Apologize and retry' },
                    { value: 'escalate', label: 'Create support ticket' }
                  ]}
                  value={fallbackBehavior}
                  onChange={setFallbackBehavior}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setShowAdvancedModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdvanced}>
                Save Settings
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* Examples Modal */}
      {showExamplesModal && (
        <Modal onClose={() => setShowExamplesModal(false)}>
          <ModalHeader title="Instruction Examples" onClose={() => setShowExamplesModal(false)} />
          <ModalBody>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Choose a template to get started quickly. This will replace your current instruction.
            </p>
            <div className="examples-grid">
              {EXAMPLE_TEMPLATES.map(template => (
                <div 
                  key={template.id} 
                  className="example-card"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <h4 className="example-card-title">{template.name}</h4>
                  <p className="example-card-description">{template.description}</p>
                  <div className="example-card-preview">
                    {template.content.slice(0, 120)}...
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <div></div>
            <Button variant="secondary" onClick={() => setShowExamplesModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Capability Edit Full-Page Modal */}
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
                    <button className="action-version-link-btn" onClick={() => setShowCapabilityChangeSummary(prev => !prev)}>
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
                  Version: {editingCapability.currentVersion || editingCapabilityVersionMeta.currentVersion} {'->'} {editingCapabilityVersionMeta.latestVersion}
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
                        <td>✎</td>
                      </tr>
                      <tr>
                        <td>Email</td>
                        <td>Email</td>
                        <td>\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*</td>
                        <td>A valid email address</td>
                        <td>test.user@company.com</td>
                        <td>No</td>
                        <td>✎</td>
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

      {/* Add Capability Modal */}
      {showAddCapabilityModal && (
        <div className="add-capability-overlay" onClick={() => {
          setShowAddCapabilityModal(false);
          setSelectedIntegration(null);
          setSelectedIntegrationActions([]);
          setPendingAction(null);
        }}>
          <div className="add-capability-modal" onClick={(e) => e.stopPropagation()}>
            {/* Integration Detail View */}
            {selectedIntegration && addCapabilityTab === 'integration' ? (
              <>
                {/* Header for Integration Detail */}
                <div className="add-capability-header">
                  <div className="add-capability-header-content">
                    <h2 className="add-capability-title">
                      {INTEGRATIONS.find(i => i.id === selectedIntegration)?.name}: select an action
                    </h2>
                    <p className="add-capability-subtitle">Find an action you need to instruct your AI agent</p>
                  </div>
                  <button 
                    className="add-capability-close"
                    onClick={() => {
                      setShowAddCapabilityModal(false);
                      setSelectedIntegration(null);
                      setSelectedIntegrationActions([]);
                    }}
                  >
                    <Icon name="cancel" weight="bold" size="md" />
                  </button>
                </div>

                {/* Search and Filter for Integration Actions */}
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

                {/* Integration Actions List */}
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
                            // If already selected, do nothing - can only remove via chip close button
                            if (isSelected || isPending) return;
                            const versionMeta = resolveVersionMeta(action.id, action.name);
                            // Show connector dropdown
                            setPendingAction({
                              id: action.id,
                              name: action.name,
                              source: INTEGRATIONS.find(i => i.id === selectedIntegration)?.name || '',
                              currentVersion: versionMeta.currentVersion,
                              latestVersion: versionMeta.latestVersion,
                              updateStatus: versionMeta.updateStatus,
                              riskLevel: versionMeta.riskLevel,
                              changeSummary: versionMeta.changeSummary,
                              requiresConnectorReconfiguration: versionMeta.requiresConnectorReconfiguration,
                              lastCheckedAt: versionMeta.lastCheckedAt,
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

                {/* Selected Actions with Chips - Shows ALL selected actions across all tabs */}
                <div className="add-capability-selected-section">
                  <div className="add-capability-selected">
                    Select ({confirmedActions.length}/9)
                    <Icon name="info-circle" weight="bold" size={14} className="add-capability-selected-info" />
                  </div>
                  
                  {/* Chips for confirmed actions */}
                  {confirmedActions.length > 0 && (
                    <div className="add-capability-chips">
                      {confirmedActions.map(action => (
                        <button
                          key={action.id}
                          className={`add-capability-chip ${editingActionConnector === action.id ? 'editing' : ''} ${action.requiresConnectorReconfiguration ? 'requires-reconfiguration' : ''}`}
                          title={action.requiresConnectorReconfiguration ? 'This action requires connector reconfiguration' : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActionConnector(action.id as string);
                            setPendingAction({
                              id: action.id as any,
                              name: action.name,
                              source: action.source,
                              currentVersion: action.currentVersion,
                              latestVersion: action.latestVersion,
                              updateStatus: action.updateStatus,
                              riskLevel: action.riskLevel,
                              changeSummary: action.changeSummary,
                              requiresConnectorReconfiguration: action.requiresConnectorReconfiguration,
                              lastCheckedAt: action.lastCheckedAt,
                            });
                            setSelectedConnector(action.connector);
                            setRequiresConnectorReconfiguration(!!action.requiresConnectorReconfiguration);
                            setShowPendingChangeSummary(false);
                          }}
                        >
                          {action.name}
                          <span 
                            className="add-capability-chip-close"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmedActions(prev => prev.filter(a => a.id !== action.id));
                            }}
                          >
                            <Icon name="cancel" weight="bold" size="xs" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline App Connector Selection - for new action */}
                  {pendingAction && !editingActionConnector && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">from {pendingAction.source}</span>
                        </div>
                        <button 
                          className="add-capability-connector-inline-cancel"
                          onClick={() => {
                            setPendingAction(null);
                            setShowPendingChangeSummary(false);
                            setRequiresConnectorReconfiguration(false);
                            setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
                          }}
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({
                              value: c.id,
                              label: c.name + (c.isDefault ? ' (Default)' : '')
                            }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button 
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => [...prev, {
                                id: pendingAction.id,
                                name: pendingAction.name,
                                source: pendingAction.source,
                                connector: selectedConnector,
                                currentVersion: pendingAction.currentVersion,
                                latestVersion: pendingAction.latestVersion,
                                updateStatus: pendingAction.updateStatus,
                                riskLevel: pendingAction.riskLevel,
                                changeSummary: pendingAction.changeSummary,
                                requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration,
                                lastCheckedAt: pendingAction.lastCheckedAt,
                              }]);
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

                  {/* Editing view for existing chip */}
                  {editingActionConnector && pendingAction && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">from {pendingAction.source}</span>
                        </div>
                        <button 
                          className="add-capability-connector-inline-cancel"
                          onClick={() => {
                            setEditingActionConnector(null);
                            setPendingAction(null);
                            setShowPendingChangeSummary(false);
                            setRequiresConnectorReconfiguration(false);
                          }}
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({
                              value: c.id,
                              label: c.name + (c.isDefault ? ' (Default)' : '')
                            }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button 
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => prev.map(a => 
                                a.id === editingActionConnector
                                  ? {
                                      ...a,
                                      connector: selectedConnector,
                                      currentVersion: pendingAction.currentVersion,
                                      latestVersion: pendingAction.latestVersion,
                                      updateStatus: pendingAction.updateStatus,
                                      riskLevel: pendingAction.riskLevel,
                                      changeSummary: pendingAction.changeSummary,
                                      requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration,
                                      lastCheckedAt: pendingAction.lastCheckedAt,
                                    }
                                  : a
                              ));
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

                {/* Footer with Back */}
                <div className="add-capability-footer">
                  <button 
                    className="add-capability-back-btn"
                    onClick={() => {
                      setSelectedIntegration(null);
                      setAddCapabilitySearch('');
                    }}
                  >
                    Back
                  </button>
                  <div className="add-capability-footer-actions">
                    <Button variant="secondary" onClick={() => {
                      setShowAddCapabilityModal(false);
                      setSelectedIntegration(null);
                      setSelectedIntegrationActions([]);
                      setConfirmedActions([]);
                      setAddCapabilitySearch('');
                      setAddCapabilityTab('all');
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      disabled={confirmedActions.length === 0}
                      onClick={() => {
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
                        setCapabilities([...capabilities, ...newCapabilities]);
                        setShowAddCapabilityModal(false);
                        setSelectedIntegration(null);
                        setSelectedIntegrationActions([]);
                        setConfirmedActions([]);
                        setAddCapabilitySearch('');
                        setAddCapabilityTab('all');
                        showToast(`${newCapabilities.length} action${newCapabilities.length > 1 ? 's' : ''} added`);
                      }}
                    >
                      Select action
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header */}
                <div className="add-capability-header">
                  <h2 className="add-capability-title">Add actions</h2>
                  <button 
                    className="add-capability-close"
                    onClick={() => setShowAddCapabilityModal(false)}
                  >
                    <Icon name="cancel" weight="bold" size="md" />
                  </button>
                </div>

                {/* Search and Add New */}
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
                  <div className="add-custom-dropdown-wrapper">
                    <button 
                      ref={addCustomBtnRef}
                      className="add-capability-add-custom-btn"
                      onClick={() => setShowAddCustomMenu(!showAddCustomMenu)}
                    >
                      Add custom
                    </button>
                    {showAddCustomMenu && (
                      <div className="add-custom-menu">
                        <button 
                          className="add-custom-menu-item"
                          onClick={() => {
                            setShowAddCustomMenu(false);
                            // Handle Transfer action
                          }}
                        >
                          <Icon name="arrow-right" weight="bold" size="sm" />
                          Transfer
                        </button>
                        <div className="add-custom-menu-divider" />
                        <button 
                          className="add-custom-menu-item"
                          onClick={() => {
                            setShowAddCustomMenu(false);
                            // Handle Fulfillment action
                          }}
                        >
                          <Icon name="apps" weight="bold" size="sm" />
                          Fulfillment
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="add-capability-tabs">
                  <button 
                    className={`add-capability-tab ${addCapabilityTab === 'all' ? 'active' : ''}`}
                    onClick={() => setAddCapabilityTab('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`add-capability-tab ${addCapabilityTab === 'integration' ? 'active' : ''}`}
                    onClick={() => setAddCapabilityTab('integration')}
                  >
                    Integration
                  </button>
                  <button 
                    className={`add-capability-tab ${addCapabilityTab === 'mcp' ? 'active' : ''}`}
                    onClick={() => setAddCapabilityTab('mcp')}
                  >
                    MCP
                  </button>
                  <button 
                    className={`add-capability-tab ${addCapabilityTab === 'a2a' ? 'active' : ''}`}
                    onClick={() => setAddCapabilityTab('a2a')}
                  >
                    A2A
                  </button>
                </div>

                {/* Integration Tab - Show Integration List (no checkboxes) */}
                {addCapabilityTab === 'integration' && (
                  <div className="add-capability-list">
                    {INTEGRATIONS
                      .filter(integration => 
                        addCapabilitySearch === '' || 
                        integration.name.toLowerCase().includes(addCapabilitySearch.toLowerCase())
                      )
                      .map(integration => (
                        <div 
                          key={integration.id} 
                          className="add-capability-item add-capability-item-clickable"
                          onClick={() => {
                            setSelectedIntegration(integration.id);
                            setAddCapabilitySearch('');
                          }}
                        >
                          <div className={`add-capability-item-logo logo-${integration.logo}`}>
                            {integration.logo === 'salesforce' && (
                              <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                                <path d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z" fill="#00A1E0"/>
                              </svg>
                            )}
                            {integration.logo === 'servicenow' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#81B5A1"/>
                                <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            )}
                            {integration.logo === 'zendesk' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#03363D"/>
                                <path d="M6 8l6 4-6 4V8zM18 8v8l-6-4 6-4z" fill="#78A300"/>
                              </svg>
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

                {/* All/MCP/A2A Tabs - Show Actions with Checkboxes */}
                {addCapabilityTab !== 'integration' && (
                  <div className="add-capability-list">
                    {(addCapabilityTab === 'mcp' ? MCP_SERVERS : 
                      addCapabilityTab === 'a2a' ? A2A_AGENTS : 
                      AVAILABLE_ACTIONS)
                      .filter(item => {
                        if (addCapabilityTab === 'all') {
                          return addCapabilitySearch === '' || 
                            item.name.toLowerCase().includes(addCapabilitySearch.toLowerCase()) ||
                            item.source.toLowerCase().includes(addCapabilitySearch.toLowerCase());
                        }
                        return addCapabilitySearch === '' || 
                          item.name.toLowerCase().includes(addCapabilitySearch.toLowerCase());
                      })
                      .map(item => {
                        const isSelected = confirmedActions.some(a => a.id === item.id);
                        const isPending = pendingAction?.id === item.id;
                        return (
                        <div 
                          key={item.id} 
                          className={`add-capability-item ${isSelected ? 'selected disabled' : ''} ${isPending ? 'pending' : ''}`}
                          onClick={() => {
                            // If already selected, do nothing - can only remove via chip close button
                            if (isSelected || isPending) return;
                            const versionMeta = resolveVersionMeta(item.id, item.name);
                            // Show inline connector selection
                            setPendingAction({
                              id: item.id,
                              name: item.name,
                              source: item.source,
                              currentVersion: versionMeta.currentVersion,
                              latestVersion: versionMeta.latestVersion,
                              updateStatus: versionMeta.updateStatus,
                              riskLevel: versionMeta.riskLevel,
                              changeSummary: versionMeta.changeSummary,
                              requiresConnectorReconfiguration: versionMeta.requiresConnectorReconfiguration,
                              lastCheckedAt: versionMeta.lastCheckedAt,
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
                          <div className={`add-capability-item-logo logo-${item.logo}`}>
                            {item.logo === 'salesforce' && (
                              <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                                <path d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z" fill="#00A1E0"/>
                              </svg>
                            )}
                            {item.logo === 'servicenow' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#81B5A1"/>
                                <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            )}
                            {item.logo === 'infinitus' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#4A90D9"/>
                                <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            )}
                            {item.logo === 'zendesk' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#03363D"/>
                                <path d="M6 8l6 4-6 4V8zM18 8v8l-6-4 6-4z" fill="#78A300"/>
                              </svg>
                            )}
                            {item.logo === 'a2a' && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#6B5CE7"/>
                                <path d="M8 8h8v8H8z" stroke="white" strokeWidth="2"/>
                              </svg>
                            )}
                            {(item.logo === 'stripe' || item.logo === 'docai') && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#635BFF"/>
                                <path d="M8 8h8v8H8z" stroke="white" strokeWidth="2"/>
                              </svg>
                            )}
                          </div>
                          <div className="add-capability-item-info">
                            <div className="add-capability-item-name">
                              {item.name}
                              <Icon name="info-circle" weight="bold" size={14} className="add-capability-item-info-icon" />
                            </div>
                            <div className="add-capability-item-meta">
                              From {item.source} {('type' in item) && <><span className="add-capability-item-dot">•</span> {item.type}</>}
                            </div>
                          </div>
                        </div>
                      );
                      })}
                  </div>
                )}

                {/* Selected Section with Chips - Shows ALL selected actions across all tabs */}
                <div className="add-capability-selected-section">
                  <div className="add-capability-selected">
                    Select ({confirmedActions.length}/9)
                    <Icon name="info-circle" weight="bold" size={14} className="add-capability-selected-info" />
                  </div>
                  
                  {/* Chips for confirmed actions */}
                  {confirmedActions.length > 0 && (
                    <div className="add-capability-chips">
                      {confirmedActions.map(action => (
                        <button
                          key={action.id}
                          className={`add-capability-chip ${editingActionConnector === action.id ? 'editing' : ''} ${action.requiresConnectorReconfiguration ? 'requires-reconfiguration' : ''}`}
                          title={action.requiresConnectorReconfiguration ? 'This action requires connector reconfiguration' : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActionConnector(action.id as string);
                            setPendingAction({
                              id: action.id as any,
                              name: action.name,
                              source: action.source,
                              currentVersion: action.currentVersion,
                              latestVersion: action.latestVersion,
                              updateStatus: action.updateStatus,
                              riskLevel: action.riskLevel,
                              changeSummary: action.changeSummary,
                              requiresConnectorReconfiguration: action.requiresConnectorReconfiguration,
                              lastCheckedAt: action.lastCheckedAt,
                            });
                            setSelectedConnector(action.connector);
                            setRequiresConnectorReconfiguration(!!action.requiresConnectorReconfiguration);
                            setShowPendingChangeSummary(false);
                          }}
                        >
                          {action.name}
                          <span 
                            className="add-capability-chip-close"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmedActions(prev => prev.filter(a => a.id !== action.id));
                            }}
                          >
                            <Icon name="cancel" weight="bold" size="xs" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline App Connector Selection - for new action */}
                  {pendingAction && !editingActionConnector && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">from {pendingAction.source}</span>
                        </div>
                        <button 
                          className="add-capability-connector-inline-cancel"
                          onClick={() => {
                            setPendingAction(null);
                            setShowPendingChangeSummary(false);
                            setRequiresConnectorReconfiguration(false);
                            setSelectedConnector(APP_CONNECTORS.find(c => c.isDefault)?.id || '');
                          }}
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({
                              value: c.id,
                              label: c.name + (c.isDefault ? ' (Default)' : '')
                            }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button 
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => [...prev, {
                                id: pendingAction.id,
                                name: pendingAction.name,
                                source: pendingAction.source,
                                connector: selectedConnector,
                                currentVersion: pendingAction.currentVersion,
                                latestVersion: pendingAction.latestVersion,
                                updateStatus: pendingAction.updateStatus,
                                riskLevel: pendingAction.riskLevel,
                                changeSummary: pendingAction.changeSummary,
                                requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration,
                                lastCheckedAt: pendingAction.lastCheckedAt,
                              }]);
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

                  {/* Editing view for existing chip */}
                  {editingActionConnector && pendingAction && (
                    <div className="add-capability-connector-inline">
                      <div className="add-capability-connector-inline-header">
                        <div className="add-capability-connector-inline-action">
                          <span className="add-capability-connector-inline-action-name">{pendingAction.name}</span>
                          <span className="add-capability-connector-inline-action-source">from {pendingAction.source}</span>
                        </div>
                        <button 
                          className="add-capability-connector-inline-cancel"
                          onClick={() => {
                            setEditingActionConnector(null);
                            setPendingAction(null);
                            setShowPendingChangeSummary(false);
                            setRequiresConnectorReconfiguration(false);
                          }}
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </button>
                      </div>
                      <div className="add-capability-connector-select">
                        <label className="add-capability-connector-label">Select an app connector</label>
                        <div className="add-capability-connector-row">
                          <Dropdown
                            options={APP_CONNECTORS.map(c => ({
                              value: c.id,
                              label: c.name + (c.isDefault ? ' (Default)' : '')
                            }))}
                            value={selectedConnector}
                            onChange={(value) => setSelectedConnector(value)}
                            className="add-capability-connector-dropdown"
                          />
                          <Button 
                            variant="secondary"
                            disabled={!selectedConnector}
                            onClick={() => {
                              setConfirmedActions(prev => prev.map(a => 
                                a.id === editingActionConnector
                                  ? {
                                      ...a,
                                      connector: selectedConnector,
                                      currentVersion: pendingAction.currentVersion,
                                      latestVersion: pendingAction.latestVersion,
                                      updateStatus: pendingAction.updateStatus,
                                      riskLevel: pendingAction.riskLevel,
                                      changeSummary: pendingAction.changeSummary,
                                      requiresConnectorReconfiguration: pendingAction.requiresConnectorReconfiguration,
                                      lastCheckedAt: pendingAction.lastCheckedAt,
                                    }
                                  : a
                              ));
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

                {/* Footer */}
                <div className="add-capability-footer">
                  <Button variant="secondary" onClick={() => {
                    setShowAddCapabilityModal(false);
                    setConfirmedActions([]);
                    setAddCapabilitySearch('');
                    setAddCapabilityTab('all');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    disabled={confirmedActions.length === 0}
                    onClick={() => {
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
                      setCapabilities([...capabilities, ...newCapabilities]);
                      setShowAddCapabilityModal(false);
                      setConfirmedActions([]);
                      setAddCapabilitySearch('');
                      setAddCapabilityTab('all');
                      showToast(`${newCapabilities.length} capability${newCapabilities.length > 1 ? 's' : ''} added`);
                    }}
                  >
                    Add
                  </Button>
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
