import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { AccordionGroup, AccordionItem } from '../../components/shared/Accordion';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Input } from '../../components/shared/FormInput';
import { MenuItem, MenuOverlay, useMenu } from '../../components/shared/Menu';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../components/shared/Modal';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import { Slider } from '../../components/shared/Slider';
import Toggle from '../../components/shared/Toggle';
import { Tooltip } from '../../components/shared/Tooltip';
import { useApp } from '../../contexts/AppContext';
import type { CiscoLiveAgentDefinition } from '../../demo/ciscoLiveDemo';
import { Icon } from '../../icons';
import type { PolicyOverview, PolicyStudioResult } from './PolicyStudio';
import SecurityUIPolicyStudio from './SecurityUIPolicyStudio';
import './LatestSecurityGuardrails.css';

type Enforcement = 'monitor' | 'block';
type Direction = 'prompt' | 'response' | 'both';
type CustomGuardrailAction = 'monitor' | 'steer' | 'block';
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
}

interface AdvancedGuardrailGroup {
  id: AdvancedGroupId;
  label: string;
  description: string;
  icon: string;
  sections?: Array<{ id: string; label: string; description: string }>;
  items: AdvancedGuardrailItem[];
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
  overview: PolicyOverview;
  policyText?: string;
}

const DEFAULT_PREBUILT_GROUPS: AdvancedGuardrailGroup[] = [
  {
    id: 'security',
    label: 'Security guardrails',
    description: 'Protect AI models against threats and unauthorized access. Ensure integrity and security of the models and outputs.',
    icon: 'shield',
    items: [
      { id: 'sec-prompt-injection', name: 'Prompt Injection', description: 'Aims to prevent prompt injection attempts that may override existing instructions, bypass model alignment, or breach guardrails in model and tool interactions.', enabled: true, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'sec-code-detection', name: 'Code Detection', description: 'Aims to prevent software code in model endpoint interactions, reducing risks such as malicious code execution, source-code disclosure, and unauthorized coding guidance.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'sec-multi-turn-jailbreak', name: 'Multi-turn jailbreak', description: 'Aims to detect multi-step manipulation where users gradually steer the agent away from its guardrails across turns.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy guardrails',
    description: 'Protect regulated data including PII, PHI, and PCI while maintaining safe and compliant conversations.',
    icon: 'privacy-circle',
    sections: [
      { id: 'pii', label: 'Personally Identifiable Information (PII)', description: 'Aims to prevent the exposure of personal information that can directly identify an individual.' },
      { id: 'phi', label: 'Protected Health Information (PHI)', description: 'Aims to prevent disclosure of health data that can identify an individual or connect them to care.' },
      { id: 'pci', label: 'Payment Card Industry (PCI)', description: 'Aims to prevent disclosure of payment card and financial account data subject to PCI protections.' },
    ],
    items: [
      { id: 'priv-full-address', sectionId: 'pii', name: 'Full Address', description: 'Detects complete street addresses including apartment numbers, street, city, state, postal code, or country.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-ip-address', sectionId: 'pii', name: 'IP Address', description: 'Flags IPv4 or IPv6 addresses that can identify a user, device, or network location.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-phone-number', sectionId: 'pii', name: 'Phone Number', description: 'Detects personal or business phone numbers in local or international formats.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-drivers-license', sectionId: 'pii', name: 'Driver’s License Number/SSN', description: 'Detects driver’s license identifiers and national identity numbers such as Social Security Numbers.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-passport-number', sectionId: 'pii', name: 'Passport Number/ID', description: 'Detects passport numbers and government-issued travel document identifiers.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-social-security', sectionId: 'pii', name: 'Social Security Number (SSN)', description: 'Flags U.S. Social Security Numbers and similar national identifier formats.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-medical-record', sectionId: 'phi', name: 'Medical Record Number', description: 'Detects unique medical record numbers used to identify patient records and treatment history.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-national-health-service', sectionId: 'phi', name: 'National Health Service (NHS) Number', description: 'Detects NHS numbers and similar healthcare-specific patient identifiers.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-pci-cardholder', sectionId: 'pci', name: 'Cardholder Data Account Number (PAN) Tracking Number', description: 'Detects payment card primary account numbers and associated tracking identifiers.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-credit-card-number', sectionId: 'pci', name: 'Credit Card Number', description: 'Flags credit card numbers that may expose customer payment credentials.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-bank-account', sectionId: 'pci', name: 'Bank Account Number', description: 'Detects bank account numbers and similar financial account identifiers.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-international-bank-account', sectionId: 'pci', name: 'International Bank Account Number (IBAN)', description: 'Flags IBAN values used for international bank transfers and account identification.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'priv-swift-code', sectionId: 'pci', name: 'SWIFT/BIC Code', description: 'Detects SWIFT or BIC identifiers that route international bank transactions.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety guardrails',
    description: 'Protect against content harmful to people, organizations, or society. Reduce toxic and dangerous content.',
    icon: 'check-circle',
    items: [
      { id: 'safe-toxicity', name: 'Toxicity', description: 'Aims to prevent the inclusion of harmful content, including hate speech, violence, disinformation, or sexually explicit material in model endpoint interactions.', enabled: true, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-hate', name: 'Hate Speech', description: 'Abusive or threatening speech or writing that expresses prejudice on the basis of ethnicity, religion, sexual orientation, or similar grounds.', enabled: true, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-profanity', name: 'Profanity', description: 'Filters offensive or obscene language.', enabled: true, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-sexual', name: 'Sexual Content & Exploitation', description: 'Content that creates, distributes, or promotes sexually explicit material and harmful sexual behavior or exploitation.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-harassment', name: 'Harassment', description: 'Aggressive pressure or intimidation.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-social-division', name: 'Social Division & Polarization', description: 'Content that fosters division within society by promoting extreme views or demonizing specific groups.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-violence', name: 'Violence & Public Safety Threats', description: 'Content that can endanger public safety, including promoting dangerous behavior or inflicting physical harm.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
      { id: 'safe-general-harms', name: 'General Harms', description: 'Content that enables, encourages, or meaningfully facilitates harmful real-world wrongdoing or personal injury.', enabled: false, sensitivity: 50, enforcement: 'block', direction: 'prompt' },
    ],
  },
];

function formatGuardrailUpdatedAt(date = new Date()) {
  return `Last updated at: ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function buildCustomGuardrails(agent?: CiscoLiveAgentDefinition): CustomGuardrailItem[] {
  return (agent?.customGuardrails ?? []).map(item => ({
    ...item,
    enabled: true,
    action: 'block',
    direction: 'prompt',
  }));
}

function ProfileLogicSummary({ overview }: { overview: PolicyOverview }) {
  const logicCounts = [
    { key: 'blocked', icon: 'blocked', color: 'var(--danger-color)', label: `${overview.blocked.length} blocked` },
    { key: 'allows', icon: 'check-circle', color: 'var(--success-color)', label: `${overview.allowed.length} allow${overview.allowed.length === 1 ? '' : 's'}` },
    { key: 'edge', icon: 'search', color: 'var(--warning-color)', label: `${overview.edgeCases.length} edge case${overview.edgeCases.length === 1 ? '' : 's'}` },
  ];

  return (
    <div className="latest-security-profile-logic" aria-label="Custom guardrail rule summary">
      {logicCounts.map(item => (
        <span key={item.key}><Icon name={item.icon} size={14} color={item.color} />{item.label}</span>
      ))}
    </div>
  );
}

function CustomGuardrailActionMenu({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  const { open, anchorRef, toggle, close } = useMenu();
  return (
    <>
      <button ref={anchorRef as RefObject<HTMLButtonElement>} type="button" className="latest-security-icon-button" aria-label={`Actions for ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => toggle()}>
        <Icon name="more-adr" weight="bold" size="sm" />
      </button>
      <MenuOverlay open={open} anchorRef={anchorRef} onClose={close} align="right">
        <MenuItem label="Edit" icon="edit" onClick={() => { close(); onEdit(); }} />
        <MenuItem label="Delete" icon="delete" danger onClick={() => { close(); onDelete(); }} />
      </MenuOverlay>
    </>
  );
}

function GuardrailRail({ item, expanded, onToggle, onExpandedChange, headerActions, children }: {
  item: { id: string; name: string; description: string; enabled: boolean };
  expanded: boolean;
  onToggle: () => void;
  onExpandedChange: (open: boolean) => void;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const panelId = `${item.id}-details`;
  const headerId = `${item.id}-header`;
  return (
    <div className={`latest-security-rail${expanded ? ' latest-security-rail--expanded' : ''}`}>
      <div className="latest-security-rail__header">
        <Toggle checked={item.enabled} onChange={onToggle} size="compact" aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${item.name} guardrail`} />
        <button id={headerId} type="button" className="latest-security-rail__details" aria-expanded={expanded} aria-controls={panelId} onClick={() => onExpandedChange(!expanded)}>
          <strong>{item.name}</strong><span>{item.description}</span>
        </button>
        <div className="latest-security-rail__trailing">
          {headerActions}
          <button type="button" className="latest-security-icon-button" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.name}`} aria-expanded={expanded} aria-controls={panelId} onClick={() => onExpandedChange(!expanded)}>
            <Icon name="arrow-down" weight="bold" size="sm" />
          </button>
        </div>
      </div>
      {expanded && <div id={panelId} role="region" aria-labelledby={headerId} className="latest-security-rail__panel">{children}</div>}
    </div>
  );
}

export default function LatestSecurityGuardrails({ agent }: { agent?: CiscoLiveAgentDefinition }) {
  const { showToast } = useApp();
  const [prebuiltGroups, setPrebuiltGroups] = useState(DEFAULT_PREBUILT_GROUPS);
  const [customGuardrails, setCustomGuardrails] = useState(() => buildCustomGuardrails(agent));
  const [search, setSearch] = useState('');
  const [customOpen, setCustomOpen] = useState(true);
  const [prebuiltOpen, setPrebuiltOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<AdvancedGroupId>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(['pii', 'phi', 'pci']));
  const [expandedRails, setExpandedRails] = useState<Set<string>>(() => new Set([
    ...buildCustomGuardrails(agent).filter(item => item.enabled).map(item => item.id),
    ...DEFAULT_PREBUILT_GROUPS.flatMap(group => group.items.filter(item => item.enabled).map(item => item.id)),
  ]));
  const [policyStudioOpen, setPolicyStudioOpen] = useState(false);
  const [editingGuardrailId, setEditingGuardrailId] = useState<string | null>(null);
  const [pendingEnable, setPendingEnable] = useState<{ groupId: AdvancedGroupId; ids: string[]; label: string } | null>(null);
  const [pricingAcknowledged, setPricingAcknowledged] = useState(false);
  const searchQuery = search.trim().toLowerCase();
  const customLimit = 3;
  const customLimitReached = customGuardrails.length >= customLimit;
  const totals = useMemo(() => ({
    enabled: prebuiltGroups.reduce((sum, group) => sum + group.items.filter(item => item.enabled).length, 0),
    all: prebuiltGroups.reduce((sum, group) => sum + group.items.length, 0),
  }), [prebuiltGroups]);
  const itemMatches = (item: AdvancedGuardrailItem) => !searchQuery || item.name.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery);
  const hasSearchResults = prebuiltGroups.some(group => group.items.some(itemMatches));

  const updateSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, id: T, open: boolean) => {
    setter(current => {
      const next = new Set(current);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  };

  const setPrebuiltEnabled = (groupId: AdvancedGroupId, ids: string[], enabled: boolean) => {
    const idSet = new Set(ids);
    setPrebuiltGroups(current => current.map(group => group.id === groupId ? { ...group, items: group.items.map(item => idSet.has(item.id) ? { ...item, enabled } : item) } : group));
    setExpandedRails(current => {
      const next = new Set(current);
      ids.forEach(id => enabled ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const requestEnable = (groupId: AdvancedGroupId, ids: string[], label: string) => {
    if (pricingAcknowledged) {
      setPrebuiltEnabled(groupId, ids, true);
      showToast(`${label} enabled`, 'success');
    } else {
      setPendingEnable({ groupId, ids, label });
    }
  };

  const updatePrebuilt = (groupId: AdvancedGroupId, itemId: string, patch: Partial<AdvancedGuardrailItem>) => {
    setPrebuiltGroups(current => current.map(group => group.id === groupId ? { ...group, items: group.items.map(item => item.id === itemId ? { ...item, ...patch } : item) } : group));
  };
  const updateCustom = (id: string, patch: Partial<CustomGuardrailItem>) => setCustomGuardrails(current => current.map(item => item.id === id ? { ...item, ...patch } : item));

  const renderControls = (group: AdvancedGuardrailGroup, item: AdvancedGuardrailItem) => (
    <div className="latest-security-controls">
      {item.id !== 'sec-code-detection' && (
        <div className="latest-security-control-row">
          <strong>Sensitivity</strong>
          <div>
            <Slider value={item.sensitivity} onChange={value => updatePrebuilt(group.id, item.id, { sensitivity: value as number })} min={0} max={150} step={50} showTicks disabled={!item.enabled} />
            <div className="latest-security-sensitivity-labels"><span>Low</span><span>Medium</span><span>High</span><span>Very high</span></div>
          </div>
        </div>
      )}
      <div className="latest-security-control-row">
        <strong>Action</strong>
        <RadioGroup name={`action-${item.id}`} value={item.enforcement} onChange={value => updatePrebuilt(group.id, item.id, { enforcement: value as Enforcement })}>
          <Radio value="monitor" label="Monitor" disabled={!item.enabled} /><Radio value="block" label="Block" disabled={!item.enabled} />
        </RadioGroup>
      </div>
      <div className="latest-security-control-row">
        <strong>Direction</strong>
        <RadioGroup name={`direction-${item.id}`} value={item.direction} onChange={value => updatePrebuilt(group.id, item.id, { direction: value as Direction })}>
          <Radio value="prompt" label="Prompt" disabled={!item.enabled} /><Radio value="response" label="Response" disabled={!item.enabled} /><Radio value="both" label="Both prompts and responses" disabled={!item.enabled} />
        </RadioGroup>
      </div>
    </div>
  );

  const renderPrebuiltRail = (group: AdvancedGuardrailGroup, item: AdvancedGuardrailItem) => (
    <GuardrailRail key={item.id} item={item} expanded={expandedRails.has(item.id)} onExpandedChange={open => updateSet(setExpandedRails, item.id, open)} onToggle={() => item.enabled ? setPrebuiltEnabled(group.id, [item.id], false) : requestEnable(group.id, [item.id], item.name)}>
      {renderControls(group, item)}
    </GuardrailRail>
  );

  const editItem = editingGuardrailId ? customGuardrails.find(item => item.id === editingGuardrailId) : undefined;
  const publishCustomGuardrail = (result: PolicyStudioResult) => {
    const updatedAt = formatGuardrailUpdatedAt();
    if (editingGuardrailId) {
      setCustomGuardrails(current => current.map(item => item.id === editingGuardrailId ? { ...item, name: result.name, description: result.description, overview: result.overview, policyText: result.policyText, createdAt: updatedAt } : item));
      showToast(`Guardrail "${result.name}" updated`, 'success');
    } else {
      setCustomGuardrails(current => [...current, { id: `custom-${Date.now()}`, name: result.name, description: result.description, overview: result.overview, policyText: result.policyText, enabled: true, action: 'block', direction: 'prompt', createdBy: 'You', createdAt: updatedAt }]);
      showToast(`Guardrail "${result.name}" created`, 'success');
    }
    setPolicyStudioOpen(false);
    setEditingGuardrailId(null);
  };

  return (
    <>
      <div className="latest-security-guardrails">
        <header className="latest-security-header">
          <h1><span>Guardrails</span><Badge variant="success" className="security-tier-badge security-custom-profiles-chip">AI defense</Badge></h1>
          <p>Use custom guardrails for this agent&apos;s business rules. Add prebuilt guardrails for common security, privacy, and safety risks. Triggered guardrails appear in Sessions. Monitor logs the interaction for review. Block rejects the prompt while keeping the conversation active.</p>
        </header>

        <div className="latest-security-toolbar">
          <Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search guardrails by name" aria-label="Search guardrails by name" leadingIcon="search" clearable onClear={() => setSearch('')} />
          {customLimitReached ? (
            <Tooltip content="You can create up to 3 custom guardrails for this agent. Delete a guardrail to create another." placement="top">
              <span className="latest-security-disabled-action" tabIndex={0}><Button variant="primary" disabled><Icon name="plus" weight="bold" size={16} />Create custom guardrail</Button></span>
            </Tooltip>
          ) : (
            <Button variant="primary" onClick={() => { setEditingGuardrailId(null); setPolicyStudioOpen(true); }}><Icon name="plus" weight="bold" size={16} />Create custom guardrail</Button>
          )}
        </div>

        <AccordionGroup type="contained" className="latest-security-accordion">
          {!searchQuery && (
            <AccordionItem className="latest-security-custom" expanded={customOpen} onExpandedChange={setCustomOpen} title={
              <div className="latest-security-category">
                <strong><Icon name="sparkle" weight="bold" size={18} />Custom guardrails</strong>
                <span>{customGuardrails.filter(item => item.enabled).length} of {customLimit} enabled</span>
                <p>Create guardrails that understand this agent&apos;s real business rules, like identity verification bypasses, approved service flows, and policy exceptions.</p>
              </div>
            }>
              <div className="latest-security-custom__body">
                {customGuardrails.length > 0 ? customGuardrails.map(item => (
                  <GuardrailRail key={item.id} item={item} expanded={expandedRails.has(item.id)} onExpandedChange={open => updateSet(setExpandedRails, item.id, open)} onToggle={() => {
                    const enabled = !item.enabled;
                    updateCustom(item.id, { enabled });
                    updateSet(setExpandedRails, item.id, enabled);
                    if (enabled) showToast(`${item.name} guardrail enabled`, 'success');
                  }} headerActions={
                    <CustomGuardrailActionMenu name={item.name} onEdit={() => { setEditingGuardrailId(item.id); setPolicyStudioOpen(true); }} onDelete={() => setCustomGuardrails(current => current.filter(candidate => candidate.id !== item.id))} />
                  }>
                    <div className="latest-security-controls">
                      <ProfileLogicSummary overview={item.overview} />
                      <div className="latest-security-control-row"><strong>Action</strong><RadioGroup name={`custom-action-${item.id}`} value={item.action} onChange={value => updateCustom(item.id, { action: value as CustomGuardrailAction })}><Radio value="monitor" label="Monitor" disabled={!item.enabled} /><Radio value="steer" label="Steer" disabled={!item.enabled} /><Radio value="block" label="Block" disabled={!item.enabled} /></RadioGroup></div>
                      <div className="latest-security-control-row"><strong>Direction</strong><RadioGroup name={`custom-direction-${item.id}`} value={item.direction} onChange={value => updateCustom(item.id, { direction: value as Direction })}><Radio value="prompt" label="Prompt" disabled={!item.enabled} /><Radio value="response" label="Response" disabled={!item.enabled} /><Radio value="both" label="Both prompts and responses" disabled={!item.enabled} /></RadioGroup></div>
                      <span className="latest-security-meta">{item.createdBy}<span aria-hidden>•</span>{item.createdAt}</span>
                    </div>
                  </GuardrailRail>
                )) : <div className="latest-security-empty"><Icon name="document-create" weight="bold" size={22} />No custom guardrails yet. Start with a policy that matches this agent&apos;s business process.</div>}
              </div>
            </AccordionItem>
          )}

          {(!searchQuery || hasSearchResults) && (
            <div className="latest-security-prebuilt" role="group" aria-label="Prebuilt guardrails">
              <button type="button" className="latest-security-summary" aria-expanded={prebuiltOpen} aria-controls="latest-security-prebuilt-groups" onClick={() => setPrebuiltOpen(open => !open)}>
                <span className="latest-security-category"><strong>Prebuilt guardrails</strong><span>{totals.enabled} of {totals.all} enabled</span><p>Use prebuilt guardrails for common security, privacy, and safety risks.</p></span>
                <Icon name="arrow-down" weight="bold" size="sm" />
              </button>
              {prebuiltOpen && (
                <div id="latest-security-prebuilt-groups">
                  {prebuiltGroups.map(group => {
                    const visibleItems = group.items.filter(itemMatches);
                    if (searchQuery && visibleItems.length === 0) return null;
                    const groupOpen = Boolean(searchQuery) || expandedGroups.has(group.id);
                    const enabledCount = group.items.filter(item => item.enabled).length;
                    const displayName = group.id.charAt(0).toUpperCase() + group.id.slice(1);
                    return (
                      <div key={group.id} className="latest-security-group">
                        <button type="button" className="latest-security-group__header" aria-expanded={groupOpen} aria-controls={`latest-${group.id}-panel`} onClick={() => updateSet(setExpandedGroups, group.id, !groupOpen)}>
                          <span className="latest-security-category"><strong><Icon name={group.icon} weight="bold" size={18} />{displayName}</strong><span>{enabledCount} of {group.items.length} enabled</span><p>{group.description} <span className="text-link">Learn more about {displayName} guardrails.</span></p></span>
                          <Icon name="arrow-down" weight="bold" size="sm" />
                        </button>
                        {groupOpen && (
                          <div id={`latest-${group.id}-panel`} className="latest-security-group__panel">
                            {(group.sections ?? [{ id: 'default', label: 'AI Defense rules', description: group.description }]).map(section => {
                              const sectionItems = group.items.filter(item => (item.sectionId ?? 'default') === section.id);
                              const visibleSectionItems = sectionItems.filter(itemMatches);
                              if (searchQuery && visibleSectionItems.length === 0) return null;
                              const hideSectionHeader = (group.id === 'security' || group.id === 'safety') && section.id === 'default';
                              const sectionEnabledCount = sectionItems.filter(item => item.enabled).length;
                              const sectionOpen = Boolean(searchQuery) || expandedSections.has(section.id);
                              const sectionEnabled = sectionItems.length > 0 && sectionEnabledCount === sectionItems.length;
                              if (hideSectionHeader) return <div key={section.id}>{visibleSectionItems.map(item => renderPrebuiltRail(group, item))}</div>;
                              return (
                                <div key={section.id} className="latest-security-section">
                                  <div className="latest-security-section__header">
                                    <Toggle checked={sectionEnabled} onChange={() => sectionEnabled ? setPrebuiltEnabled(group.id, sectionItems.map(item => item.id), false) : requestEnable(group.id, sectionItems.map(item => item.id), section.label)} size="compact" aria-label={`${sectionEnabled ? 'Disable' : 'Enable'} ${section.label} guardrails`} />
                                    <button type="button" aria-expanded={sectionOpen} onClick={() => updateSet(setExpandedSections, section.id, !sectionOpen)}><strong>{section.label}</strong><span>{sectionEnabledCount} of {sectionItems.length} enabled</span><p>{section.description}</p></button>
                                    <Icon name="arrow-down" weight="bold" size="sm" />
                                  </div>
                                  {sectionOpen && <div>{visibleSectionItems.map(item => renderPrebuiltRail(group, item))}</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </AccordionGroup>
        {searchQuery && !hasSearchResults && <p className="latest-security-no-results">No guardrails match “{search.trim()}”.</p>}
      </div>

      {pendingEnable && (
        <Modal onClose={() => setPendingEnable(null)} size="sm">
          <ModalHeader title={`Enable ${pendingEnable.label}?`} onClose={() => setPendingEnable(null)} />
          <ModalBody><p>This guardrail uses Cisco AI Defense. Usage is billed per message scanned, and the change applies immediately.</p><p>Review pricing in <Link to="/settings/organization">organization settings</Link>.</p></ModalBody>
          <ModalFooter><Button variant="secondary" onClick={() => setPendingEnable(null)}>Cancel</Button><Button variant="primary" onClick={() => { setPrebuiltEnabled(pendingEnable.groupId, pendingEnable.ids, true); setPricingAcknowledged(true); showToast(`${pendingEnable.label} enabled`, 'success'); setPendingEnable(null); }}>Enable</Button></ModalFooter>
        </Modal>
      )}

      {policyStudioOpen && (
        <SecurityUIPolicyStudio
          key={editingGuardrailId ?? 'new-security-guardrail'}
          initialBasicStep={!editingGuardrailId}
          initialProfileName={editItem?.name}
          initialData={editItem ? { name: editItem.name, description: editItem.description, overview: editItem.overview, policyText: editItem.policyText } : undefined}
          onClose={() => { setPolicyStudioOpen(false); setEditingGuardrailId(null); }}
          onPublish={publishCustomGuardrail}
        />
      )}
    </>
  );
}
