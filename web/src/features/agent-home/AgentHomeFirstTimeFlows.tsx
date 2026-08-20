import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconProvider as MomentumIconProvider,
  Tab as MomentumTab,
  TabList as MomentumTabList,
} from '@momentum-design/components/react';
import { publicAssetUrl } from '../../app/publicAsset';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import { Card } from '../../components/shared/Card';
import {
  AiFooter,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '../../components/shared';
import Spinner from '../../components/shared/Spinner';
import { TabPanel } from '../../components/shared/Tabs';
import providerFedExLogo from '../../assets/provider-fedex.svg';
import providerServiceNowLogo from '../../assets/provider-servicenow.png';
import providerShopifyLogo from '../../assets/provider-shopify.svg';
import providerStripeLogo from '../../assets/provider-stripe.svg';
import { Icon } from '../../icons';
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
}: {
  eyebrow?: string;
  title: string;
  titleId: string;
  description: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <header className="agent-home-flow__header">
      <Button variant="tertiary" size="sm" className="agent-home-flow__back" onClick={onBack}>
        <Icon name="arrow-left" weight="bold" size="sm" />
        {backLabel}
      </Button>
      {eyebrow && <span className="agent-home__section-kicker">{eyebrow}</span>}
      <h1 id={titleId}>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function OptionList({
  options,
  selectedId,
  onSelect,
  label,
}: {
  options: readonly AgentHomeTemplateDefinition[];
  selectedId: AgentHomeTemplateId;
  onSelect: (id: AgentHomeTemplateId) => void;
  label: string;
}) {
  const industryGroups = options.reduce<Array<{
    industry: string;
    templates: AgentHomeTemplateDefinition[];
  }>>((groups, option) => {
    const currentGroup = groups.find(group => group.industry === option.industry);
    if (currentGroup) {
      currentGroup.templates.push(option);
      return groups;
    }

    groups.push({ industry: option.industry, templates: [option] });
    return groups;
  }, []);

  return (
    <div className="agent-home-flow__option-list" role="group" aria-label={label}>
      {industryGroups.map(group => {
        const headingId = `agent-home-industry-${group.templates[0].id.replace(/[^a-z0-9]+/gi, '-')}`;

        return (
          <section
            key={group.industry}
            className="agent-home-flow__industry-group"
            aria-labelledby={headingId}
          >
            <h3 id={headingId}>{group.industry}</h3>
            <div className="agent-home-flow__industry-options">
              {group.templates.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className="agent-home-flow__option"
                  aria-pressed={selectedId === option.id}
                  onClick={() => onSelect(option.id)}
                >
                  <span className="agent-home-flow__option-icon" aria-hidden="true">
                    <Icon name={option.icon} weight="bold" size="md" />
                  </span>
                  <span>
                    <strong>{option.name}</strong>
                    <span>{option.useCase}</span>
                  </span>
                  <Icon name="arrow-right" weight="bold" size="sm" />
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Workflow({ option }: { option: AgentHomeTemplateDefinition }) {
  return (
    <section className="agent-home-flow__workflow" aria-labelledby="agent-home-template-workflow-title">
      <h3 id="agent-home-template-workflow-title">Workflow</h3>
      <ol>
        {option.workflow.map((step, index) => (
          <li key={step}>
            <span aria-hidden="true">{index + 1}</span>
            <strong>{step}</strong>
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
      <svg
        className="agent-home-flow__action-provider-logo"
        viewBox="0 0 24 16"
        aria-hidden="true"
      >
        <path
          d="M10 2.5c1.1 0 2.1.4 2.9 1.1.6-.5 1.4-.8 2.3-.8 1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .5-.1.8 1.5.5 2.5 1.9 2.5 3.5 0 2.1-1.7 3.8-3.8 3.8-.4 0-.8-.1-1.2-.2-.6 1-1.8 1.7-3.1 1.7-1.1 0-2-.4-2.7-1.1-.7.7-1.7 1.1-2.7 1.1-1.5 0-2.8-.9-3.4-2.1-.3.1-.6.1-.9.1C2.1 14 1 12.9 1 11.5c0-1 .5-1.8 1.3-2.3-.2-.5-.3-1-.3-1.5C2 5.5 3.5 4 5.3 4c.6 0 1.2.2 1.7.5C7.7 3 8.8 2.5 10 2.5z"
          fill="#00a1e0"
        />
      </svg>
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

function ActionPresetItems({ items }: { items: readonly string[] }) {
  return (
    <div>
      {items.map((item, index) => {
        const provider = getActionProvider(item);
        const authenticated = index < 2;
        return (
          <Badge
            key={item}
            variant="default"
            className="agent-home-flow__action-chip"
          >
            <ActionProviderLogo provider={provider} />
            <span>{item}</span>
            {authenticated && (
              <Icon
                className="agent-home-flow__action-connected-icon"
                name="check-circle-filled"
                weight="bold"
                size="xs"
                color="var(--mds-color-theme-text-success-normal, #64d29b)"
              />
            )}
            <span className="sr-only">
              {` — ${provider.name}; ${authenticated ? 'authenticated' : 'not authenticated'}`}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}

function PresetDefaults({ option }: { option: AgentHomeTemplateDefinition }) {
  const { draft } = option;
  const channelLabel = getAgentHomePreviewChannelLabel(option.previewChannel);
  const displayPresets = option.presets.map(preset => (
    preset.capabilityId === 'knowledge'
      ? { ...preset, label: 'AI Engine', items: ['Webex AI Pro 1.0'] }
      : preset
  ));

  return (
    <section className="agent-home-flow__defaults" aria-labelledby="agent-home-template-defaults-title">
      <h3 id="agent-home-template-defaults-title">Preset defaults</h3>
      <dl>
        <div>
          <dt>Language</dt>
          <dd>{draft.language}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>{channelLabel}</dd>
        </div>
        <div>
          <dt>{option.responseStyleLabel}</dt>
          <dd>{option.responseStyle}</dd>
        </div>
      </dl>
      {displayPresets.map(preset => (
        <div key={preset.capabilityId} className="agent-home-flow__default-group">
          <strong>{preset.label}</strong>
          {preset.capabilityId === 'audience' ? (
            <span className="agent-home-flow__default-value">{preset.items.join(', ')}</span>
          ) : preset.capabilityId === 'actions' ? (
            <ActionPresetItems items={preset.items} />
          ) : (
            <div>{preset.items.map(item => <Badge key={item} variant="default">{item}</Badge>)}</div>
          )}
        </div>
      ))}
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
  onPreview,
  onUseTemplate,
}: Pick<AgentHomeFirstTimeFlowsProps, 'onFlowChange' | 'onUseTemplate'> & {
  initialTemplateId: AgentHomeTemplateId;
  onPreview: (templateId: AgentHomeTemplateId) => void;
}) {
  const initialFamily = getAgentHomeTemplate(initialTemplateId)?.family
    ?? AGENT_HOME_TEMPLATE_FAMILIES[0].id;
  const [activeFamily, setActiveFamily] = useState<AgentFamily>(initialFamily);
  const [setupTemplateId, setSetupTemplateId] = useState<AgentHomeTemplateId | null>(null);
  const [selectedByFamily, setSelectedByFamily] = useState<Record<AgentFamily, AgentHomeTemplateId>>(() => ({
    calling: initialFamily === 'calling'
      ? initialTemplateId
      : getAgentHomeTemplatesForFamily('calling')[0].id,
    contact_center: initialFamily === 'contact_center'
      ? initialTemplateId
      : getAgentHomeTemplatesForFamily('contact_center')[0].id,
    internal_assistant: initialFamily === 'internal_assistant'
      ? initialTemplateId
      : getAgentHomeTemplatesForFamily('internal_assistant')[0].id,
  }));
  const options = getAgentHomeTemplatesForFamily(activeFamily);
  const selectedId = selectedByFamily[activeFamily];
  const option = getAgentHomeTemplate(selectedId) ?? options[0];
  const setupOption = setupTemplateId ? getAgentHomeTemplate(setupTemplateId) : undefined;
  const channelLabel = getAgentHomePreviewChannelLabel(option.previewChannel);
  const activeFamilyLabel = AGENT_HOME_TEMPLATE_FAMILIES.find(
    candidate => candidate.id === activeFamily,
  )?.label ?? 'Agent';

  const handleSelect = (templateId: AgentHomeTemplateId) => {
    setSelectedByFamily(current => ({ ...current, [activeFamily]: templateId }));
  };

  const handleFamilyChange = (event: CustomEvent<{ tabId: string }>) => {
    const nextFamily = event.detail.tabId as AgentFamily;
    if (AGENT_HOME_TEMPLATE_FAMILIES.some(candidate => candidate.id === nextFamily)) {
      setActiveFamily(nextFamily);
    }
  };

  return (
    <section className="agent-home-flow agent-home-flow--templates" aria-labelledby="agent-home-template-title">
      <div className="agent-home-flow__sticky-header">
        <FlowHeader
          title="Choose a ready-made agent"
          titleId="agent-home-template-title"
          description="Choose an agent type, then review its workflow and preset configuration before you start."
          backLabel="Agent home"
          onBack={() => onFlowChange('home')}
        />
        <div className="agent-home-flow__type-tabs-row">
          <MomentumIconProvider
            iconSet="custom-icons"
            url={publicAssetUrl('icons').replace(/\/$/, '')}
            fileExtension="svg"
          >
            <MomentumTabList
              className="agent-home-flow__type-tabs"
              data-aria-label="Agent type"
              activeTabId={activeFamily}
              onChange={handleFamilyChange}
            >
              {AGENT_HOME_TEMPLATE_FAMILIES.map(agentFamily => (
                <MomentumTab
                  key={agentFamily.id}
                  id={`agent-home-template-tab-${agentFamily.id}`}
                  tabId={agentFamily.id}
                  text={agentFamily.label}
                  variant="pill"
                  aria-controls={`agent-home-template-panel-${agentFamily.id}`}
                  className="agent-home-flow__type-tab"
                />
              ))}
            </MomentumTabList>
          </MomentumIconProvider>
        </div>
      </div>
      <div className="agent-home-flow__layout">
        <div className="agent-home-flow__template-sidebar">
          <TabPanel
            active
            id={`agent-home-template-panel-${activeFamily}`}
            aria-labelledby={`agent-home-template-tab-${activeFamily}`}
            className="agent-home-flow__tabpanel"
          >
            <OptionList
              options={options}
              selectedId={selectedId}
              onSelect={handleSelect}
              label={`${activeFamilyLabel} templates`}
            />
          </TabPanel>
        </div>
        <Card className="agent-home-flow__detail" aria-live="polite">
          <div className="agent-home-flow__detail-heading">
            <div>
              <h2>{option.name}</h2>
              <p>{option.proposal.description}</p>
            </div>
            <span className="agent-home-flow__detail-icon" aria-hidden="true">
              <Icon name={option.icon} weight="bold" size="lg" />
            </span>
          </div>
          <Workflow option={option} />
          <PresetDefaults option={option} />
          <div className="agent-home-flow__actions">
            <Button
              type="button"
              variant="secondary"
              aria-label={`Preview ${option.name}, ${channelLabel}`}
              onClick={() => onPreview(option.id)}
            >
              <Icon name="play" weight="bold" size="sm" />
              Preview
            </Button>
            <Button type="button" variant="primary" onClick={() => setSetupTemplateId(option.id)}>
              Use this template
              <Icon name="arrow-right" weight="bold" size="sm" />
            </Button>
          </div>
        </Card>
      </div>
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

function PreviewChannelChips({
  channel,
}: {
  channel: AgentHomeTemplateDefinition['previewChannel'];
}) {
  const channels = channel === 'both'
    ? ['Voice', 'Digital']
    : [getAgentHomePreviewChannelLabel(channel)];

  return (
    <div className="agent-home-flow__preview-channel">
      <div aria-label={`${channels.join(' and ')} preview ${channels.length > 1 ? 'channels' : 'channel'}`}>
        {channels.map(label => <Badge key={label} variant="default">{label}</Badge>)}
      </div>
      <span>preview {channels.length > 1 ? 'channels' : 'channel'}</span>
    </div>
  );
}

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
  const testTitle = option.previewChannel === 'voice'
    ? 'Talk with the voice preview'
    : option.previewChannel === 'digital'
      ? 'Chat with the preview'
      : 'Test voice or digital';
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
        eyebrow="Agent Studio preview"
        title={option.draft.name}
        titleId="agent-home-demo-preview-title"
        description={`${option.industry} · ${channelLabel} preview · ${option.useCase}`}
        backLabel={backFlow === 'templates' ? 'Back to templates' : 'Choose another demo'}
        onBack={() => onFlowChange(backFlow)}
      />
      <div className="agent-home-flow__preview-layout">
        <Card className="agent-home-flow__preview-context">
          <div className="agent-home-flow__preview-context-heading">
            <span aria-hidden="true"><Icon name={option.icon} weight="bold" size="lg" /></span>
            <div>
              <span className="agent-home__section-kicker">Configured agent</span>
              <h2>What this agent can do</h2>
            </div>
          </div>
          <p>{option.draft.description}</p>
          <Workflow option={option} />
          <div className="agent-home-flow__preview-defaults">
            <span><strong>{option.draft.knowledgeBases.length}</strong> knowledge sources</span>
            <span><strong>{option.presets.length}</strong> configured defaults</span>
            <PreviewChannelChips channel={option.previewChannel} />
          </div>
          <Button variant="secondary" onClick={() => onUseTemplate(templateId)}>
            Start with this agent
            <Icon name="arrow-right" weight="bold" size="sm" />
          </Button>
        </Card>

        <Card className="agent-home-flow__test" aria-label={`Test ${option.draft.name}`}>
          <div className="agent-home-flow__test-header">
            <div>
              <span className="agent-home__section-kicker">Test agent</span>
              <h2>{testTitle}</h2>
            </div>
            <div className="agent-home-flow__test-status">
              <Badge variant="info">{channelLabel}</Badge>
            </div>
          </div>
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
  onUseTemplate,
  onSendDemoMessage,
}: AgentHomeFirstTimeFlowsProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<AgentHomeTemplateId>(
    () => getAgentHomeTemplatesForFamily(AGENT_HOME_TEMPLATE_FAMILIES[0].id)[0].id,
  );
  const [previewReturnFlow, setPreviewReturnFlow] = useState<'templates' | 'demo-select'>('demo-select');

  if (flow === 'templates') {
    return (
      <TemplateFlow
        initialTemplateId={previewTemplateId}
        onFlowChange={onFlowChange}
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
