import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Button from '../../components/shared/Button';
import { UpliftMomentumButton } from '../../components/shared/UpliftMomentumButton';
import Badge from '../../components/shared/Badge';
import { Card } from '../../components/shared/Card';
import { ListItem } from '../../components/shared/ListItem';
import SearchField from '../../components/shared/SearchField';
import {
  AiFooter,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover,
  Tab,
  Tabs,
  Textarea,
} from '../../components/shared';
import Spinner from '../../components/shared/Spinner';
import providerFedExLogo from '../../assets/provider-fedex.svg';
import providerServiceNowLogo from '../../assets/provider-servicenow.png';
import providerShopifyLogo from '../../assets/provider-shopify.svg';
import providerStripeLogo from '../../assets/provider-stripe.svg';
import readyMadeAccountStatusIcon from '../../assets/figma-ready-made/account-status.svg';
import readyMadeApplicationIcon from '../../assets/figma-ready-made/application.svg';
import readyMadeArrowLeftIcon from '../../assets/figma-ready-made/arrow-left.svg';
import readyMadeArrowRightIcon from '../../assets/figma-ready-made/arrow-right.svg';
import readyMadeCheckCircleIcon from '../../assets/figma-ready-made/check-circle.svg';
import readyMadeCloudMutedIcon from '../../assets/figma-ready-made/cloud-muted.svg';
import readyMadeHandshakeIcon from '../../assets/figma-ready-made/handshake.svg';
import readyMadeHelpdeskIcon from '../../assets/figma-ready-made/helpdesk.svg';
import readyMadePanelHeader from '../../assets/figma-ready-made/panel-header.png';
import readyMadePrivacyIcon from '../../assets/figma-ready-made/privacy-circle.svg';
import readyMadeSalesforceIcon from '../../assets/figma-ready-made/salesforce-color.svg';
import readyMadeShieldIcon from '../../assets/figma-ready-made/shield.svg';
import readyMadeSparkleIcon from '../../assets/figma-ready-made/sparkle.svg';
import readyMadeTrackingIcon from '../../assets/figma-ready-made/tracking.svg';
import { Icon } from '../../icons';
import type { IconName } from '../../icons/types';
import type { AgentFamily } from '../agent-creation/agentCreationModel';
import {
  AGENT_HOME_DEMO_OPTIONS,
  AGENT_HOME_TEMPLATE_FAMILIES,
  getAgentHomePreviewChannelLabel,
  getAgentHomeTemplate,
  getAgentHomeTemplatesForFamily,
  type AgentHomeTemplateDefinition,
  type AgentHomeTemplateId,
} from './agentHomeTemplateCatalog';

export type AgentHomeFirstTimeFlow = 'home' | 'templates' | 'demo-select' | 'demo-preview';

export interface AgentHomeDemoMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AgentHomeTemplateSetup {
  name: string;
  goal: string;
}

export interface AgentHomeFirstTimeFlowsProps {
  flow: Exclude<AgentHomeFirstTimeFlow, 'home'>;
  onFlowChange: (flow: AgentHomeFirstTimeFlow) => void;
  onCreateFromScratch?: () => void;
  onUseTemplate: (templateId: AgentHomeTemplateId, setup?: AgentHomeTemplateSetup) => void;
  onSendDemoMessage: (
    templateId: AgentHomeTemplateId,
    history: AgentHomeDemoMessage[],
    text: string,
  ) => Promise<string>;
}

function FlowHeader({
  eyebrow,
  title,
  titleId,
  description,
  backLabel,
  onBack,
  titleAction,
}: {
  eyebrow?: string;
  title: string;
  titleId: string;
  description: string;
  backLabel: string;
  onBack: () => void;
  titleAction?: ReactNode;
}) {
  const titleGroup = (
    <div className="agent-home-flow__title-group">
      <h1 id={titleId}>{title}</h1>
      <p>{description}</p>
    </div>
  );

  return (
    <header className="agent-home-flow__header">
      <button type="button" className="agent-home-flow__back" onClick={onBack}>
        <img src={readyMadeArrowLeftIcon} alt="" aria-hidden="true" />
        {backLabel}
      </button>
      {eyebrow && <span className="agent-home__section-kicker">{eyebrow}</span>}
      {titleAction ? (
        <div className="agent-home-flow__title-row">
          {titleGroup}
          {titleAction}
        </div>
      ) : titleGroup}
    </header>
  );
}

type ReadyMadeDisplayOption = {
  key: string;
  templateId: AgentHomeTemplateId;
  name: string;
  useCase: string;
  industry: string;
  template: AgentHomeTemplateDefinition;
};

type AgentTypeFilter = 'all' | AgentFamily;
type TemplateFilterTab = 'agent-type' | 'industry';
type TemplateFilterOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  icon?: IconName;
};

function TemplateFilterMenu({
  agentTypeOptions,
  agentTypeValue,
  onAgentTypeChange,
  industryOptions,
  industryValue,
  onIndustryChange,
  onClear,
}: {
  agentTypeOptions: readonly TemplateFilterOption<AgentTypeFilter>[];
  agentTypeValue: AgentTypeFilter;
  onAgentTypeChange: (value: AgentTypeFilter) => void;
  industryOptions: readonly TemplateFilterOption[];
  industryValue: string;
  onIndustryChange: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateFilterTab>('agent-type');
  const anchorRef = useRef<HTMLSpanElement>(null);
  const hasActiveFilters = agentTypeValue !== 'all' || industryValue !== 'all';
  const activeOptions = activeTab === 'agent-type' ? agentTypeOptions : industryOptions;
  const activeValue = activeTab === 'agent-type' ? agentTypeValue : industryValue;

  const selectOption = (value: string) => {
    if (activeTab === 'agent-type') onAgentTypeChange(value as AgentTypeFilter);
    else onIndustryChange(value);
  };

  return (
    <>
      <span ref={anchorRef} className="agent-home-flow__filter-trigger-anchor">
        <UpliftMomentumButton
          type="button"
          variant="secondary"
          color="default"
          size="sm"
          className={`agent-home-flow__filter-trigger${hasActiveFilters ? ' active' : ''}`}
          aria-label={`Filter templates${hasActiveFilters ? ', filters applied' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          <Icon name="filter" weight="bold" size={16} />
        </UpliftMomentumButton>
      </span>
      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={anchorRef}
        placement="bottom-end"
        className="agent-home-flow__filter-popover"
        aria-label="Filter templates"
      >
        <Tabs variant="line" aria-label="Template filter category">
          <Tab
            id="agent-home-filter-agent-type-tab"
            active={activeTab === 'agent-type'}
            aria-controls="agent-home-filter-panel"
            onClick={() => setActiveTab('agent-type')}
          >
            Agent type
          </Tab>
          <Tab
            id="agent-home-filter-industry-tab"
            active={activeTab === 'industry'}
            aria-controls="agent-home-filter-panel"
            onClick={() => setActiveTab('industry')}
          >
            Industry
          </Tab>
        </Tabs>
        <div
          id="agent-home-filter-panel"
          className="agent-home-flow__filter-options"
          role="tabpanel"
          aria-labelledby={activeTab === 'agent-type'
            ? 'agent-home-filter-agent-type-tab'
            : 'agent-home-filter-industry-tab'}
        >
          {activeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={`agent-home-flow__filter-option${activeValue === option.value ? ' active' : ''}`}
              aria-pressed={activeValue === option.value}
              onClick={() => selectOption(option.value)}
            >
              <span className="agent-home-flow__filter-option-icon" aria-hidden="true">
                {option.icon && <Icon name={option.icon} weight="regular" size={16} />}
              </span>
              <span>{option.label}</span>
              {typeof option.count === 'number' && <small>{option.count}</small>}
              {activeValue === option.value && <Icon name="check" weight="bold" size={16} />}
            </button>
          ))}
        </div>
        {hasActiveFilters && (
          <button type="button" className="agent-home-flow__filter-clear" onClick={onClear}>
            Clear filters
          </button>
        )}
      </Popover>
    </>
  );
}

const READY_MADE_CONTACT_CENTER_ROWS: ReadonlyArray<Omit<ReadyMadeDisplayOption, 'template'>> = [
  {
    key: 'contact_center:technical-support',
    templateId: 'contact_center:technical-support',
    name: 'Technical support concierge',
    useCase: 'Troubleshooting, service status, and escalations',
    industry: 'Customer service',
  },
  {
    key: 'contact_center:cx-concierge',
    templateId: 'contact_center:cx-concierge',
    name: 'CX concierge',
    useCase: 'Answers, resolution, and contextual handoff',
    industry: 'Customer service',
  },
  {
    key: 'contact_center:reservation-scheduler',
    templateId: 'contact_center:reservation-scheduler',
    name: 'Reservation book & schedule agent',
    useCase: 'Reservations, scheduling, and confirmation',
    industry: 'Customer service',
  },
  {
    key: 'contact_center:order-management',
    templateId: 'contact_center:order-management',
    name: 'Order management concierge',
    useCase: 'Order status, delivery, and returns',
    industry: 'Commerce',
  },
  {
    key: 'contact_center:returns-exchanges',
    templateId: 'contact_center:returns-exchanges',
    name: 'Returns and exchanges concierge',
    useCase: 'Return eligibility, exchanges, and next steps',
    industry: 'Commerce',
  },
  {
    key: 'contact_center:product-discovery',
    templateId: 'contact_center:product-discovery',
    name: 'Product discovery assistant',
    useCase: 'Personalized recommendations, comparisons, and wish lists',
    industry: 'Commerce',
  },
  {
    key: 'contact_center:patient-care',
    templateId: 'contact_center:patient-care',
    name: 'Patient care navigator',
    useCase: 'Appointment scheduling, benefits inquiry, and care coordination',
    industry: 'Healthcare',
  },
  {
    key: 'contact_center:clinical-intake',
    templateId: 'contact_center:clinical-intake',
    name: 'Clinical intake assistant',
    useCase: 'Symptom triage, prior authorization, and provider matching',
    industry: 'Healthcare',
  },
];

const getReadyMadeDisplayOptions = (
  family: AgentFamily,
  options: readonly AgentHomeTemplateDefinition[],
): ReadyMadeDisplayOption[] => {
  if (family !== 'contact_center') {
    return options.map(template => ({
      key: template.id,
      templateId: template.id,
      name: template.name,
      useCase: template.useCase,
      industry: template.industry,
      template,
    }));
  }

  return READY_MADE_CONTACT_CENTER_ROWS.flatMap(row => {
    const template = getAgentHomeTemplate(row.templateId);
    return template ? [{ ...row, template }] : [];
  });
};

function OptionList({
  options,
  selectedKey,
  onSelect,
  labelledBy,
}: {
  options: readonly ReadyMadeDisplayOption[];
  selectedKey: string;
  onSelect: (option: ReadyMadeDisplayOption) => void;
  labelledBy: string;
}) {
  return (
    <div className="agent-home-flow__option-list">
      <div className="agent-home-flow__template-options" role="listbox" aria-labelledby={labelledBy}>
        {options.map(option => {
          const family = AGENT_HOME_TEMPLATE_FAMILIES.find(item => item.id === option.template.family);
          return (
            <ListItem
              key={option.key}
              className={`agent-home-flow__option agent-home-flow__option--${option.template.family}`}
              active={selectedKey === option.key}
              role="option"
              aria-label={`${option.name}. ${option.useCase}`}
              aria-selected={selectedKey === option.key}
              onClick={() => onSelect(option)}
              secondaryLabel={option.useCase}
              leading={family && (
                <span className="agent-home-flow__option-icon" aria-hidden="true">
                  <Icon name={family.icon} size={20} />
                </span>
              )}
            >
              {option.name}
            </ListItem>
          );
        })}
      </div>
    </div>
  );
}

function ReadyMadeWorkflow({ option }: { option: AgentHomeTemplateDefinition }) {
  const actions = getWorkflowActionItems(option);
  const stages = option.workflowDiagram?.stages
    ?? option.workflow.map((label, index) => ({
      label,
      actions: actions[index] ? [actions[index]] : [],
    }));
  const isTree = option.workflowDiagram?.layout === 'tree';

  const renderStep = (
    step: { label: string; actions?: readonly string[] },
    number: string | number,
    className = '',
  ) => (
    <div className={`agent-home-flow__workflow-step ${className}`.trim()}>
      <span aria-hidden="true">{number}</span>
      <div className="agent-home-flow__workflow-step-content">
        <strong>{step.label}</strong>
        {step.actions && step.actions.length > 0 && (
          <div className="agent-home-flow__workflow-actions" aria-label={`Actions for step ${number}`}>
            {step.actions.map((action, index) => (
              <ReadyMadeChip
                key={action}
                label={action}
                icon={getReadyMadeActionIcon(action, index)}
                trailingIcon={/handoff|transfer|route|escalate/.test(action.toLowerCase())
                  ? readyMadeCloudMutedIcon
                  : readyMadeCheckCircleIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      className={`agent-home-flow__workflow agent-home-flow__workflow--ready-made${isTree ? ' agent-home-flow__workflow--tree' : ''}`}
      aria-labelledby="agent-home-template-workflow-title"
    >
      <h3 id="agent-home-template-workflow-title">Workflow</h3>
      <ol>
        {stages.map((stage, index) => (
          <li key={'branches' in stage ? `branch-${index}` : stage.label}>
            {'branches' in stage ? (
              <div className="agent-home-flow__workflow-branch-grid">
                {stage.branches.map((branch, branchIndex) => renderStep(
                  branch,
                  `${index + 1}${String.fromCharCode(65 + branchIndex)}`,
                  'agent-home-flow__workflow-step--branch',
                ))}
              </div>
            ) : renderStep(stage, index + 1)}
            {index < stages.length - 1 && (
              <img
                className="agent-home-flow__workflow-connector"
                src={readyMadeArrowRightIcon}
                alt=""
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

type ActionProvider = {
  name: string;
  logo: 'salesforce' | 'webex' | string;
};

const getActionProvider = (action: string): ActionProvider => {
  const normalized = action.toLowerCase();
  if (normalized === 'create support case') return { name: 'Webex', logo: 'webex' };
  if (/payment|billing/.test(normalized)) return { name: 'Stripe', logo: providerStripeLogo };
  if (/delivery|shipment|shipping/.test(normalized)) return { name: 'FedEx', logo: providerFedExLogo };
  if (/order|return|inventory|pickup|product|store/.test(normalized)) {
    return { name: 'Shopify', logo: providerShopifyLogo };
  }
  if (/account|customer|lead|license|profile/.test(normalized)) {
    return { name: 'Salesforce', logo: 'salesforce' };
  }
  return { name: 'ServiceNow', logo: providerServiceNowLogo };
};

function ActionProviderLogo({ provider }: { provider: ActionProvider }) {
  if (provider.logo === 'webex') {
    return (
      <Icon
        className="agent-home-flow__action-provider-logo"
        name="webex-helix"
        weight="bold"
        size={16}
      />
    );
  }

  if (provider.logo === 'salesforce') {
    return (
      <img
        className="agent-home-flow__action-provider-logo"
        src={readyMadeSalesforceIcon}
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      className="agent-home-flow__action-provider-logo"
      src={provider.logo}
      alt=""
      aria-hidden="true"
    />
  );
}

function ReadyMadeChip({
  label,
  icon,
  trailingIcon,
}: {
  label: string;
  icon?: string;
  trailingIcon?: string;
}) {
  return (
    <span className="agent-home-flow__ready-chip">
      {icon && <img src={icon} alt="" aria-hidden="true" />}
      <span>{label}</span>
      {trailingIcon && (
        <span className="agent-home-flow__ready-chip-trailing" aria-hidden="true">
          <img src={trailingIcon} alt="" />
        </span>
      )}
    </span>
  );
}

const getPresetItems = (
  option: AgentHomeTemplateDefinition,
  capabilityIds: readonly string[],
) => option.presets.find(preset => capabilityIds.includes(preset.capabilityId))?.items ?? [];

const getWorkflowActionItems = (option: AgentHomeTemplateDefinition) => {
  const actions = getPresetItems(option, ['actions']);
  return actions.length > 0 ? actions : getPresetItems(option, ['handoff']);
};

const getReadyMadeActionIcon = (action: string, index: number) => {
  const normalized = action.toLowerCase();
  if (/handoff|transfer|route|escalate|notify/.test(normalized)) return readyMadeHelpdeskIcon;
  if (/schedule|appointment|reservation|availability/.test(normalized)) return readyMadeApplicationIcon;
  if (/account|status|authorization|benefit/.test(normalized)) return readyMadeAccountStatusIcon;
  if (/ticket|case|request|summary/.test(normalized)) return readyMadeSalesforceIcon;
  return [readyMadeTrackingIcon, readyMadeHandshakeIcon, readyMadeSalesforceIcon][index % 3];
};

const READY_MADE_GUARDRAIL_ICONS = [
  readyMadeSparkleIcon,
  readyMadeShieldIcon,
  readyMadePrivacyIcon,
] as const;

function PresetDefaults({ option }: { option: AgentHomeTemplateDefinition }) {
  const actions = getWorkflowActionItems(option);
  const configuredGuardrails = getPresetItems(option, ['security']);
  const guardrails = configuredGuardrails.length > 0
    ? configuredGuardrails
    : getPresetItems(option, ['identity']);

  return (
    <section className="agent-home-flow__defaults" aria-labelledby="agent-home-template-defaults-title">
      <h3 id="agent-home-template-defaults-title">Preset defaults</h3>
      <dl className="agent-home-flow__preset-grid">
        <div>
          <dt>Language</dt>
          <dd>{option.proposal.language}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>{getAgentHomePreviewChannelLabel(option.previewChannel)}</dd>
        </div>
        <div>
          <dt>AI Engine</dt>
          <dd>Webex AI Pro 1.0</dd>
        </div>
      </dl>
      <div className="agent-home-flow__parameter-stack">
        {actions.length > 0 && (
          <div className="agent-home-flow__default-group">
            <strong>Actions</strong>
            <div>
              {actions.map((action, index) => (
                <ReadyMadeChip
                  key={action}
                  label={action}
                  icon={getReadyMadeActionIcon(action, index)}
                  trailingIcon={/handoff|transfer|route|escalate/.test(action.toLowerCase())
                    ? readyMadeCloudMutedIcon
                    : readyMadeCheckCircleIcon}
                />
              ))}
            </div>
          </div>
        )}
        {guardrails.length > 0 && (
          <div className="agent-home-flow__default-group">
            <strong>Guardrails</strong>
            <div>
              {guardrails.map((guardrail, index) => (
                <ReadyMadeChip
                  key={guardrail}
                  label={guardrail}
                  icon={READY_MADE_GUARDRAIL_ICONS[index % READY_MADE_GUARDRAIL_ICONS.length]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="agent-home-flow__instruction">
        <strong>Instruction</strong>
        <p>{option.proposal.instructions}</p>
      </div>
    </section>
  );
}

function TemplateSetupDialog({
  option,
  onClose,
  onConfirm,
}: {
  option: AgentHomeTemplateDefinition;
  onClose: () => void;
  onConfirm: (setup: AgentHomeTemplateSetup) => void;
}) {
  const [name, setName] = useState(option.draft.name);
  const [goal, setGoal] = useState(option.proposal.purpose);
  const formId = 'agent-home-template-setup-form';
  const canCreate = Boolean(name.trim() && goal.trim());
  const actionItems = option.presets.find(preset => preset.capabilityId === 'actions')?.items ?? [];
  const actionConnections = actionItems.map((action, index) => ({
    action,
    provider: getActionProvider(action),
    authenticated: index < 2,
  }));
  const authenticatedCount = actionConnections.filter(connection => connection.authenticated).length;
  const remainingCount = actionConnections.length - authenticatedCount;

  return (
    <Modal
      size="sm"
      className="agent-home-template-setup-modal"
      onClose={onClose}
      ariaLabel="Set up your agent"
    >
      <ModalHeader
        title="Set up your agent"
        description="Confirm the name and primary goal before creating the draft."
        onClose={onClose}
      />
      <ModalBody>
        <form
          id={formId}
          className="agent-home-template-setup-form"
          onSubmit={event => {
            event.preventDefault();
            if (!canCreate) return;
            onConfirm({ name: name.trim(), goal: goal.trim() });
          }}
        >
          <Input
            label="Agent name"
            required
            value={name}
            maxLength={80}
            onChange={event => setName(event.target.value)}
            voiceInput={false}
          />
          <Textarea
            label="Agent goal"
            required
            value={goal}
            rows={3}
            maxLength={240}
            hint="Describe the main outcome this agent should help people achieve."
            onChange={event => setGoal(event.target.value)}
            voiceInput={false}
          />
          {actionConnections.length > 0 && (
            <section
              className="agent-home-template-connections"
              aria-labelledby="agent-home-template-connections-title"
            >
              <div className="agent-home-template-connections__header">
                <div>
                  <h3 id="agent-home-template-connections-title">Action authentication</h3>
                  <p>{authenticatedCount} of {actionConnections.length} actions authenticated</p>
                </div>
                <Badge variant="default">{authenticatedCount}/{actionConnections.length}</Badge>
              </div>
              <ul className="agent-home-template-connections__list">
                {actionConnections.map(({ action, provider, authenticated }) => (
                  <li key={action}>
                    <span className="agent-home-template-connections__action">
                      <ActionProviderLogo provider={provider} />
                      <span>
                        <strong>{action}</strong>
                        <span>{provider.name}</span>
                      </span>
                    </span>
                    {authenticated ? (
                      <span className="agent-home-template-connections__status agent-home-template-connections__status--success">
                        <Icon
                          name="check-circle-filled"
                          weight="bold"
                          size="xs"
                          color="var(--mds-color-theme-text-success-normal, #64d29b)"
                        />
                        Authenticated
                      </span>
                    ) : (
                      <a
                        className="agent-home-template-connections__status agent-home-template-connections__status--link"
                        href="https://admin.webex.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Connect ${action} in Control Hub (opens in a new tab)`}
                      >
                        Connect in Control Hub
                        <Icon name="launch" weight="bold" size="xs" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="agent-home-template-connections__next">
                <Icon name="launch" weight="bold" size="sm" />
                <p>
                  <strong>Next in Control Hub</strong>
                  <span>
                    {remainingCount > 0
                      ? `After creating the draft, connect ${remainingCount} remaining ${remainingCount === 1 ? 'action' : 'actions'} before publishing.`
                      : 'All template actions are authenticated and ready to use.'}
                  </span>
                </p>
              </div>
            </section>
          )}
        </form>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} variant="primary" disabled={!canCreate}>
          Create draft
        </Button>
      </ModalFooter>
    </Modal>
  );
}

const getTemplatePreviewPrompts = (
  option: AgentHomeTemplateDefinition,
): readonly [string, string, string] => option.demo?.prompts ?? [
  'What can you help me with?',
  `How would you handle ${option.useCase.toLowerCase()}?`,
  'When would you hand off to a person?',
];

function TemplateFlow({
  initialTemplateId,
  onFlowChange,
  onCreateFromScratch,
  onPreview,
  onUseTemplate,
}: Pick<AgentHomeFirstTimeFlowsProps, 'onFlowChange' | 'onCreateFromScratch' | 'onUseTemplate'> & {
  initialTemplateId: AgentHomeTemplateId;
  onPreview: (templateId: AgentHomeTemplateId) => void;
}) {
  const [setupTemplateId, setSetupTemplateId] = useState<AgentHomeTemplateId | null>(null);
  const [selectedId, setSelectedId] = useState<AgentHomeTemplateId>(initialTemplateId);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentTypeFilter, setAgentTypeFilter] = useState<AgentTypeFilter>('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const allDisplayOptions = useMemo(
    () => AGENT_HOME_TEMPLATE_FAMILIES.flatMap(agentFamily => getReadyMadeDisplayOptions(
      agentFamily.id,
      getAgentHomeTemplatesForFamily(agentFamily.id),
    )),
    [],
  );
  const agentFamilyLabels = useMemo(
    () => new Map(AGENT_HOME_TEMPLATE_FAMILIES.map(agentFamily => [agentFamily.id, agentFamily.label])),
    [],
  );
  const agentTypeOptions = useMemo(() => [
    {
      value: 'all' as const,
      label: 'All agent types',
      count: allDisplayOptions.length,
      icon: 'filter' as const,
    },
    ...AGENT_HOME_TEMPLATE_FAMILIES.map(agentFamily => ({
      value: agentFamily.id,
      label: agentFamily.label,
      count: allDisplayOptions.filter(candidate => candidate.template.family === agentFamily.id).length,
      icon: agentFamily.icon,
    })),
  ], [allDisplayOptions]);
  const optionsForAgentType = useMemo(
    () => agentTypeFilter === 'all'
      ? allDisplayOptions
      : allDisplayOptions.filter(candidate => candidate.template.family === agentTypeFilter),
    [agentTypeFilter, allDisplayOptions],
  );
  const industryOptions = useMemo(() => {
    const industries = [...new Set(optionsForAgentType.map(candidate => candidate.industry))];
    return [
      { value: 'all', label: 'All industries', count: optionsForAgentType.length },
      ...industries.map(industry => ({
        value: industry,
        label: industry,
        count: optionsForAgentType.filter(candidate => candidate.industry === industry).length,
      })),
    ];
  }, [optionsForAgentType]);
  const displayOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return optionsForAgentType.filter(candidate => {
      if (industryFilter !== 'all' && candidate.industry !== industryFilter) return false;
      if (!normalizedQuery) return true;
      const familyLabel = agentFamilyLabels.get(candidate.template.family) ?? '';
      return [candidate.name, candidate.useCase, candidate.industry, familyLabel]
        .some(value => value.toLowerCase().includes(normalizedQuery));
    });
  }, [agentFamilyLabels, industryFilter, optionsForAgentType, searchQuery]);
  const selectedDisplayOption = displayOptions.find(candidate => candidate.templateId === selectedId)
    ?? displayOptions[0];
  const option = selectedDisplayOption?.template;
  const setupOption = setupTemplateId ? getAgentHomeTemplate(setupTemplateId) : undefined;
  const channelLabel = option ? getAgentHomePreviewChannelLabel(option.previewChannel) : '';

  const handleSelect = (displayOption: ReadyMadeDisplayOption) => {
    setSelectedId(displayOption.templateId);
  };

  const handleAgentTypeChange = (nextAgentType: AgentTypeFilter) => {
    setAgentTypeFilter(nextAgentType);
    if (industryFilter !== 'all') {
      const industryStillAvailable = allDisplayOptions.some(candidate => (
        (nextAgentType === 'all' || candidate.template.family === nextAgentType)
        && candidate.industry === industryFilter
      ));
      if (!industryStillAvailable) setIndustryFilter('all');
    }
  };

  const clearDiscoveryFilters = () => {
    setSearchQuery('');
    setAgentTypeFilter('all');
    setIndustryFilter('all');
  };

  const clearTemplateFilters = () => {
    setAgentTypeFilter('all');
    setIndustryFilter('all');
  };

  return (
    <section className="agent-home-flow agent-home-flow--templates" aria-labelledby="agent-home-template-title">
      <div className="agent-home-flow__sticky-header">
        <FlowHeader
          title="Choose a ready-made agent"
          titleId="agent-home-template-title"
          description="Choose an agent type, then review its workflow and preset configuration before you start."
          backLabel="Home"
          onBack={() => onFlowChange('home')}
          titleAction={(
            <UpliftMomentumButton
              type="button"
              variant="secondary"
              color="default"
              size="sm"
              className="agent-home-flow__create-from-scratch"
              disabled={!onCreateFromScratch}
              onClick={onCreateFromScratch}
            >
              Create from scratch
            </UpliftMomentumButton>
          )}
        />
      </div>
      {option ? (
        <div className="agent-home-flow__layout">
          <div className="agent-home-flow__template-sidebar">
            <div className="agent-home-flow__selector-header">
              <h3 id="agent-home-all-templates-title">All templates</h3>
              <div
                className="agent-home-flow__discovery-toolbar"
                role="search"
                aria-label="Find ready-made agents"
              >
                <SearchField
                  className="agent-home-flow__template-search"
                  label="Search"
                  placeholder="Search templates"
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <TemplateFilterMenu
                  agentTypeOptions={agentTypeOptions}
                  agentTypeValue={agentTypeFilter}
                  onAgentTypeChange={handleAgentTypeChange}
                  industryOptions={industryOptions}
                  industryValue={industryFilter}
                  onIndustryChange={setIndustryFilter}
                  onClear={clearTemplateFilters}
                />
              </div>
            </div>
            <div className="agent-home-flow__tabpanel">
            <OptionList
              options={displayOptions}
              selectedKey={selectedId}
              onSelect={handleSelect}
              labelledBy="agent-home-all-templates-title"
            />
            </div>
          </div>
          <Card className="agent-home-flow__detail" aria-live="polite">
          <div className="agent-home-flow__detail-heading">
            <img
              className="agent-home-flow__detail-heading-art"
              src={readyMadePanelHeader}
              alt=""
              aria-hidden="true"
            />
            <div className="agent-home-flow__detail-heading-copy">
              <h2>{option.name}</h2>
              <p>{option.proposal.description}</p>
            </div>
            <div className="agent-home-flow__actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`Preview ${option.name}, ${channelLabel}`}
                onClick={() => onPreview(option.id)}
              >
                Preview
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setSetupTemplateId(option.id)}
              >
                Use this template
              </Button>
            </div>
          </div>
          <div className="agent-home-flow__detail-body">
            <div className="agent-home-flow__workflow-column">
              <ReadyMadeWorkflow option={option} />
            </div>
            <div className="agent-home-flow__defaults-column">
              <PresetDefaults option={option} />
            </div>
          </div>
          </Card>
        </div>
      ) : (
        <div className="agent-home-flow__empty" role="status">
          <h2>No ready-made agents found</h2>
          <p>Try a different search or filter.</p>
          <Button type="button" variant="secondary" size="sm" onClick={clearDiscoveryFilters}>
            Clear search and filters
          </Button>
        </div>
      )}
      {setupTemplateId && setupOption && (
        <TemplateSetupDialog
          key={setupTemplateId}
          option={setupOption}
          onClose={() => setSetupTemplateId(null)}
          onConfirm={setup => {
            onUseTemplate(setupTemplateId, setup);
            setSetupTemplateId(null);
          }}
        />
      )}
    </section>
  );
}

function DemoSelector({
  onFlowChange,
  onSelect,
}: {
  onFlowChange: AgentHomeFirstTimeFlowsProps['onFlowChange'];
  onSelect: (id: AgentHomeTemplateId) => void;
}) {
  return (
    <section className="agent-home-flow agent-home-flow--demo-select" aria-labelledby="agent-home-demo-title">
      <FlowHeader
        eyebrow="Interactive demo"
        title="Choose an industry use case"
        titleId="agent-home-demo-title"
        description="Open a configured agent in preview, then test it with a realistic request."
        backLabel="Agent home"
        onBack={() => onFlowChange('home')}
      />
      <div className="agent-home-flow__demo-grid">
        {AGENT_HOME_DEMO_OPTIONS.map(option => {
          const channelLabel = getAgentHomePreviewChannelLabel(option.previewChannel);
          return (
          <Card
            key={option.id}
            className="agent-home-flow__demo-card eva-landing-task-card"
          >
            <div className="eva-landing-task-card__header">
              <span className="eva-landing-task-card__icon" aria-hidden="true">
                <Icon name={option.icon} weight="bold" size="md" />
              </span>
              <strong>{option.industry}</strong>
            </div>
            <div className="eva-landing-task-card__divider" />
            <div className="eva-landing-task-card__body">
              <h2>{option.name}</h2>
              <p>{option.useCase}</p>
            </div>
            <div className="agent-home-flow__demo-card-footer">
              <Badge variant="default">{channelLabel}</Badge>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`Preview ${option.name}, ${channelLabel}`}
                onClick={() => onSelect(option.id)}
              >
                <Icon name="play" weight="bold" size="xs" />
                Preview
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </section>
  );
}

type VoicePreviewStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended';

function VoicePreviewWidget({
  option,
  prompts,
  onSpeak,
}: {
  option: AgentHomeTemplateDefinition;
  prompts: readonly string[];
  onSpeak: (text: string) => Promise<string>;
}) {
  const [status, setStatus] = useState<VoicePreviewStatus>('idle');
  const [lastUtterance, setLastUtterance] = useState('');
  const [lastReply, setLastReply] = useState('');
  const timerRef = useRef<number | null>(null);
  const callLive = status === 'connecting' || status === 'listening' || status === 'speaking';
  const statusCopy: Record<VoicePreviewStatus, string> = {
    idle: 'Ready to start a voice preview',
    connecting: 'Connecting voice preview…',
    listening: 'Listening…',
    speaking: `${option.draft.name} is speaking…`,
    ended: 'Voice preview ended',
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const startCall = () => {
    clearTimer();
    setLastUtterance('');
    setLastReply('');
    setStatus('connecting');
    timerRef.current = window.setTimeout(() => {
      setStatus('listening');
      timerRef.current = null;
    }, 650);
  };

  const endCall = () => {
    clearTimer();
    setStatus('ended');
  };

  const speak = async (text: string) => {
    if (!callLive || status === 'connecting' || status === 'speaking') return;
    clearTimer();
    setLastUtterance(text);
    setLastReply('');
    setStatus('speaking');
    try {
      const reply = await onSpeak(text);
      setLastReply(reply);
    } catch {
      setLastReply('The preview could not respond. End the call and try again.');
    } finally {
      timerRef.current = window.setTimeout(() => {
        setStatus('listening');
        timerRef.current = null;
      }, 900);
    }
  };

  return (
    <div
      className={`eva-voice-preview agent-home-flow__voice-widget eva-voice-preview--${status}`}
      aria-label={`Voice preview for ${option.draft.name}`}
    >
      <div className="eva-voice-preview__agent">
        <span className="agent-home-flow__voice-avatar" aria-hidden="true">
          <Icon name={option.icon} weight="bold" size="lg" />
        </span>
        <div>
          <strong>{option.draft.name}</strong>
          <span>Voice preview</span>
        </div>
      </div>
      <div className="eva-voice-preview__controls">
        <div className="eva-voice-preview__visualizer" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ animationDelay: `${index * 55}ms` }} />
          ))}
        </div>
        <p className="eva-voice-preview__status" role="status">{statusCopy[status]}</p>
        {callLive && status !== 'connecting' && (
          <div className="agent-home-flow__voice-prompts" aria-label="Try saying">
            <span>Try saying</span>
            {prompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                disabled={status === 'speaking'}
                onClick={() => void speak(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        {(lastUtterance || lastReply) && (
          <div className="agent-home-flow__voice-caption" aria-live="polite">
            {lastUtterance && <p><strong>You said</strong>{lastUtterance}</p>}
            {lastReply && <p><strong>{option.draft.name}</strong>{lastReply}</p>}
          </div>
        )}
        <div className="eva-voice-preview__actions">
          <Button type="button" size="sm" disabled={callLive} onClick={startCall}>
            <Icon name="phone" weight="bold" size="sm" />
            {status === 'ended' ? 'Start again' : 'Start call'}
          </Button>
          {callLive && (
            <Button type="button" variant="secondary" size="sm" onClick={endCall}>
              End call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoPreview({
  backFlow,
  templateId,
  onFlowChange,
  onUseTemplate,
  onSendDemoMessage,
}: Pick<AgentHomeFirstTimeFlowsProps, 'onFlowChange' | 'onUseTemplate' | 'onSendDemoMessage'> & {
  backFlow: 'templates' | 'demo-select';
  templateId: AgentHomeTemplateId;
}) {
  const option = getAgentHomeTemplate(templateId)
    ?? AGENT_HOME_DEMO_OPTIONS[0];
  const previewPrompts = getTemplatePreviewPrompts(option);
  const channelLabel = getAgentHomePreviewChannelLabel(option.previewChannel);
  const inputPlaceholder = option.previewChannel === 'digital'
      ? 'Type a message'
      : 'Type a voice or digital request';
  const [messages, setMessages] = useState<AgentHomeDemoMessage[]>([]);
  const [responding, setResponding] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setResponding(false);
  }, [templateId]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'auto' });
  }, [messages, responding]);

  const welcomeMessage = useMemo(
    () => `Hi, I’m ${option.draft.name}. What can I help you with?`,
    [option.draft.name],
  );

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || responding) return;
    const history = messages;
    setMessages(previous => [...previous, { role: 'user', text: trimmed }]);
    setResponding(true);
    try {
      const reply = await onSendDemoMessage(templateId, history, trimmed);
      setMessages(previous => [...previous, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          text: 'The preview could not respond. Try again, or preview another template.',
        },
      ]);
    } finally {
      setResponding(false);
    }
  };

  return (
    <section className="agent-home-flow agent-home-flow--demo-preview" aria-labelledby="agent-home-demo-preview-title">
      <FlowHeader
        title={option.draft.name}
        titleId="agent-home-demo-preview-title"
        description={`${option.industry} · ${channelLabel} preview · ${option.useCase}`}
        backLabel={backFlow === 'templates' ? 'Back to templates' : 'Choose another demo'}
        onBack={() => onFlowChange(backFlow)}
        titleAction={(
          <div className="agent-home-flow__test-actions">
            <div className="agent-home-flow__test-status">
              <Badge variant="info">{channelLabel}</Badge>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onUseTemplate(templateId)}
            >
              Start with this agent
              <Icon name="arrow-right" weight="bold" size="sm" />
            </Button>
          </div>
        )}
      />
      <div className="agent-home-flow__preview-layout">
        <Card className="agent-home-flow__test" aria-label={`Test ${option.draft.name}`}>
          {option.previewChannel === 'voice' ? (
            <VoicePreviewWidget
              option={option}
              prompts={previewPrompts}
              onSpeak={text => onSendDemoMessage(templateId, [], text)}
            />
          ) : (
            <>
              <div ref={threadRef} className="agent-home-flow__test-thread" aria-live="polite">
                <div className="agent-home-flow__message agent-home-flow__message--assistant">
                  <strong>{option.draft.name}</strong>
                  <p>{welcomeMessage}</p>
                </div>
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`agent-home-flow__message agent-home-flow__message--${message.role}`}
                  >
                    <strong>{message.role === 'user' ? 'You' : option.draft.name}</strong>
                    <p>{message.text}</p>
                  </div>
                ))}
                {responding && (
                  <div className="agent-home-flow__message agent-home-flow__message--assistant agent-home-flow__message--thinking">
                    <Spinner size="small" aria-label={`${option.draft.name} is responding`} />
                    <span>Responding…</span>
                  </div>
                )}
              </div>
              <AiFooter
                className="agent-home-flow__digital-composer"
                disabled={responding}
                fillContainer
                onSend={(text: string) => void send(text)}
                placeholder={inputPlaceholder}
                showDisclaimer={false}
                suggestions={messages.length === 0 ? [...previewPrompts] : []}
              />
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

export default function AgentHomeFirstTimeFlows({
  flow,
  onFlowChange,
  onCreateFromScratch,
  onUseTemplate,
  onSendDemoMessage,
}: AgentHomeFirstTimeFlowsProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<AgentHomeTemplateId>(
    'contact_center:technical-support',
  );
  const [previewReturnFlow, setPreviewReturnFlow] = useState<'templates' | 'demo-select'>('demo-select');

  if (flow === 'templates') {
    return (
      <TemplateFlow
        initialTemplateId={previewTemplateId}
        onFlowChange={onFlowChange}
        onCreateFromScratch={onCreateFromScratch}
        onPreview={templateId => {
          setPreviewTemplateId(templateId);
          setPreviewReturnFlow('templates');
          onFlowChange('demo-preview');
        }}
        onUseTemplate={onUseTemplate}
      />
    );
  }

  if (flow === 'demo-select') {
    return (
      <DemoSelector
        onFlowChange={onFlowChange}
        onSelect={templateId => {
          setPreviewTemplateId(templateId);
          setPreviewReturnFlow('demo-select');
          onFlowChange('demo-preview');
        }}
      />
    );
  }

  return (
    <DemoPreview
      backFlow={previewReturnFlow}
      templateId={previewTemplateId}
      onFlowChange={onFlowChange}
      onUseTemplate={onUseTemplate}
      onSendDemoMessage={onSendDemoMessage}
    />
  );
}
