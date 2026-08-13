import { useEffect, useState } from 'react';
import { Modal } from '../../../components/shared/Modal';
import { Icon } from '../../../icons';

type InspectorTab = 'evaluators' | 'params' | 'annotations';
type WorkspaceTab = 'messages' | 'latency' | 'trace';
type ResultTone = 'positive' | 'negative' | 'neutral' | 'warning';

interface SplunkSessionModalProps {
  onClose: () => void;
  sourceMetric: string;
}

interface EvaluatorResult {
  label: string;
  value: string;
  tone: ResultTone;
  benchmark?: string;
}

const AGENT_NAME = 'EAGLE GREEN VIP Reservations';

const AGENT_QUALITY_RESULTS: EvaluatorResult[] = [
  { label: 'AI goal completion', value: 'false', tone: 'negative' },
  { label: 'Transfer action completed', value: 'true', tone: 'positive' },
  { label: 'Correct handoff flow', value: 'true', tone: 'positive' },
  { label: 'Conversation quality', value: 'true', tone: 'positive' },
  { label: 'AI productivity contribution', value: 'false', tone: 'negative' },
  { label: 'User intent change', value: 'false', tone: 'positive' },
];

const SESSION_METRICS: EvaluatorResult[] = [
  { label: 'ai_agent_turn_count', value: '1', tone: 'neutral' },
  { label: 'action_count', value: '2', tone: 'neutral' },
  { label: 'goal_completion_rate', value: '0%', tone: 'negative' },
  { label: 'contained', value: 'false', tone: 'neutral' },
  { label: 'handoff_requested', value: 'true', tone: 'positive' },
  { label: 'handoff_completed', value: 'true', tone: 'positive' },
  { label: 'fallback_triggered', value: 'false', tone: 'positive' },
  { label: 'guardrail_triggered', value: 'false', tone: 'positive' },
  { label: 'first_contact_resolution', value: 'pending', tone: 'warning' },
  { label: 'eligible_ai_voice_seconds', value: '24.8 s', tone: 'neutral' },
  { label: 'productive_ai_voice_seconds', value: '0 s', tone: 'negative' },
  { label: 'first_response_latency', value: '1.2 s', tone: 'positive' },
];

const SESSION_PARAMS = [
  ['Agent', AGENT_NAME],
  ['Session ID', 'SES-EG-1074'],
  ['Interaction ID', 'INT-EG-2084'],
  ['Channel', 'Voice'],
  ['Started', 'Thursday, August 13, 2026, at 2:14:02 PM'],
  ['Duration', '24.8 s'],
  ['AI goal', 'Create VIP reservation'],
  ['Goal status', 'Not completed'],
  ['Outcome', 'Transferred to human'],
  ['Transfer reason', 'Customer requested an event specialist; party size met the transfer rule'],
  ['Transfer queue', 'VIP Events team'],
] as const;

const NAV_ITEMS = [
  { label: 'Home', icon: 'home' as const },
  { label: 'Overview', icon: 'dashboard' as const },
  { label: 'Agent stream', icon: 'analysis' as const, active: true },
  { label: 'Playgrounds', icon: 'automation' as const },
  { label: 'Experiments', icon: 'file-analysis' as const },
  { label: 'Datasets', icon: 'folder' as const, separated: true },
  { label: 'Prompts', icon: 'document' as const },
  { label: 'Annotation queues', icon: 'annotate' as const },
  { label: 'Evaluators', icon: 'check-circle' as const },
  { label: 'Dashboards', icon: 'area-chart' as const },
  { label: 'Controls', icon: 'shield' as const },
];

function ResultRow({ result }: { result: EvaluatorResult }) {
  return (
    <div className="splunk-preview-result-row">
      <dt>{result.label}</dt>
      <dd>
        <span className={`splunk-preview-result splunk-preview-result--${result.tone}`}>
          {result.value}
        </span>
        {result.benchmark ? <span className="splunk-preview-benchmark">{result.benchmark}</span> : null}
      </dd>
    </div>
  );
}

function EvaluatorsPanel() {
  return (
    <div id="splunk-evaluators-panel" className="splunk-preview-inspector-scroll">
      <section className="splunk-preview-inspector-card" aria-labelledby="splunk-agent-quality-title">
        <h3 id="splunk-agent-quality-title">Agent quality</h3>
        <dl>
          {AGENT_QUALITY_RESULTS.map(result => <ResultRow key={result.label} result={result} />)}
        </dl>
      </section>

      <section className="splunk-preview-inspector-card" aria-labelledby="splunk-session-metrics-title">
        <h3 id="splunk-session-metrics-title">Session metrics</h3>
        <dl>
          {SESSION_METRICS.map(result => <ResultRow key={result.label} result={result} />)}
        </dl>
      </section>
    </div>
  );
}

function ParamsPanel({ sourceMetric }: { sourceMetric: string }) {
  return (
    <div className="splunk-preview-inspector-scroll">
      <section className="splunk-preview-inspector-card" aria-labelledby="splunk-session-params-title">
        <h3 id="splunk-session-params-title">Session metadata</h3>
        <dl>
          {SESSION_PARAMS.map(([label, value]) => (
            <div className="splunk-preview-param-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div className="splunk-preview-param-row">
            <dt>Source metric</dt>
            <dd>{sourceMetric}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function AnnotationsPanel() {
  return (
    <div className="splunk-preview-inspector-scroll">
      <article className="splunk-preview-annotation">
        <div className="splunk-preview-annotation-heading">
          <span className="splunk-preview-annotation-icon" aria-hidden>
            <Icon name="analysis" weight="bold" size={16} />
          </span>
          <div>
            <span className="splunk-preview-eyebrow">Productivity signal</span>
            <h3>AI goal not completed</h3>
          </div>
        </div>
        <p>
          The customer requested a human event specialist in the first turn. The agent checked
          availability, then the large-event control matched and unlocked the transfer. No reservation
          was created or updated, so this is a successful handoff and a missed AI goal.
        </p>
        <div className="splunk-preview-tag-row" aria-label="Annotation tags">
          <span>Intentional handoff</span>
          <span>Not contained</span>
          <span>No fallback</span>
        </div>
      </article>
    </div>
  );
}

function AlternateWorkspaceView({ tab }: { tab: Exclude<WorkspaceTab, 'messages'> }) {
  if (tab === 'latency') {
    return (
      <section className="splunk-preview-alt-view" aria-labelledby="splunk-latency-title">
        <div>
          <span className="splunk-preview-eyebrow">Voice session</span>
          <h2 id="splunk-latency-title">Latency</h2>
          <p>The requested handoff completed without a fallback or retry.</p>
        </div>
        <div className="splunk-preview-latency-grid">
          <article><span>First response</span><strong>1.2 s</strong></article>
          <article><span>Transfer action</span><strong>2.6 s</strong></article>
          <article><span>Total session</span><strong>24.8 s</strong></article>
        </div>
      </section>
    );
  }

  return (
    <section className="splunk-preview-alt-view" aria-labelledby="splunk-trace-title">
      <div>
        <span className="splunk-preview-eyebrow">Execution path</span>
        <h2 id="splunk-trace-title">Trace graph</h2>
        <p>The trace ended after the requested transfer, before the Create reservation action ran.</p>
      </div>
      <div className="splunk-preview-trace-graph" aria-label="Caller intent to human transfer trace">
        <div><span>1</span><strong>Availability checked</strong><small>action.execute</small></div>
        <Icon name="arrow-right" weight="bold" size={20} />
        <div><span>2</span><strong>Large-event control matched</strong><small>control.evaluate</small></div>
        <Icon name="arrow-right" weight="bold" size={20} />
        <div><span>3</span><strong>VIP transfer completed</strong><small>handoff.transfer</small></div>
      </div>
    </section>
  );
}

export function SplunkSessionModal({ onClose, sourceMetric }: SplunkSessionModalProps) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('evaluators');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('messages');
  const [selectedStep, setSelectedStep] = useState<'voice' | 'availability' | 'control' | 'handoff'>('voice');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const notify = (message: string) => setActionMessage(message);

  return (
    <Modal
      size="lg"
      onClose={onClose}
      className="splunk-preview-modal"
      overlayClassName="splunk-preview-overlay"
      ariaLabel="Splunk session preview"
    >
      <div className="splunk-preview-app">
        <header className="splunk-preview-brandbar">
          <div className="splunk-preview-brand">
            <span className="splunk-preview-wordmark" translate="no">splunk&gt;</span>
            <span>Agent Observability</span>
          </div>
          <div className="splunk-preview-brand-actions">
            <span className="splunk-preview-demo-badge">Demo session</span>
            <span className="splunk-preview-user">
              <Icon name="user" weight="regular" size={18} />
              Demo analyst
            </span>
            <button type="button" onClick={onClose} aria-label="Close Splunk preview">
              <Icon name="cancel" weight="bold" size={18} />
            </button>
          </div>
        </header>

        <div className="splunk-preview-workspace">
          <nav className="splunk-preview-sidebar" aria-label="Splunk navigation">
            <div className="splunk-preview-project">
              <Icon name="folder" weight="regular" size={20} />
              <span><small>Project</small>Eagle Green</span>
            </div>
            <ul>
              {NAV_ITEMS.map(item => (
                <li
                  key={item.label}
                  className={`${item.active ? 'is-active' : ''}${item.separated ? ' is-separated' : ''}`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <Icon name={item.icon} weight="regular" size={20} />
                  <span>{item.label}</span>
                  {item.active ? <small>{AGENT_NAME}</small> : null}
                </li>
              ))}
            </ul>
          </nav>

          <main className="splunk-preview-main">
            <div className="splunk-preview-toolbar">
              <div className="splunk-preview-workspace-tabs" role="tablist" aria-label="Session views">
                {([
                  ['messages', 'Messages', 'chat'],
                  ['latency', 'Latency', 'completed-by-time'],
                  ['trace', 'Trace graph', 'file-graph'],
                ] as const).map(([value, label, icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={workspaceTab === value}
                    className={workspaceTab === value ? 'is-active' : ''}
                    onClick={() => setWorkspaceTab(value)}
                  >
                    <Icon name={icon} weight="regular" size={17} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="splunk-preview-session-actions">
                <span>Session 1 of 38</span>
                <button
                  type="button"
                  className="splunk-preview-configure"
                  onClick={() => {
                    setInspectorTab('evaluators');
                    notify('Showing evaluators for this session');
                  }}
                >
                  Configure evaluators
                </button>
              </div>
            </div>

            <div className="splunk-preview-session-heading">
              <div>
                <button type="button" className="splunk-preview-back" onClick={onClose} aria-label="Back to Observability">
                  <Icon name="arrow-left" weight="bold" size={18} />
                </button>
                <span className="splunk-preview-session-icon" aria-hidden>
                  <Icon name="audio-call" weight="regular" size={18} />
                </span>
                <div>
                  <h1>Human transfer requested · SES-EG-1074</h1>
                  <p>{AGENT_NAME} · Voice · 24.8 s</p>
                </div>
              </div>
              <div className="splunk-preview-heading-actions">
                <button type="button" onClick={() => notify('Session copied to the demo dataset')}>
                  Copy to dataset
                </button>
                <button type="button" onClick={() => notify('Session added to the annotation queue')}>
                  Add to annotation queue
                </button>
              </div>
            </div>

            {actionMessage ? <div className="splunk-preview-status" role="status">{actionMessage}</div> : null}

            {workspaceTab === 'messages' ? (
              <div className="splunk-preview-session-grid">
                <aside className="splunk-preview-steps" aria-labelledby="splunk-steps-title">
                  <div className="splunk-preview-condense-row">
                    <span id="splunk-steps-title">Session steps</span>
                    <span className="splunk-preview-toggle" aria-hidden><span /></span>
                    <small>Condense steps</small>
                  </div>
                  <div className="splunk-preview-step-filters">
                    <span>Type: All</span>
                    <span>Latency</span>
                    <Icon name="search" weight="regular" size={20} />
                  </div>
                  <button
                    type="button"
                    className={`splunk-preview-step${selectedStep === 'voice' ? ' is-active' : ''}`}
                    onClick={() => setSelectedStep('voice')}
                  >
                    <Icon name="audio-call" weight="regular" size={18} />
                    <span><strong>voice.turn</strong><small>Customer requested a human agent</small></span>
                    <time>2.14 s</time>
                  </button>
                  <button
                    type="button"
                    className={`splunk-preview-step${selectedStep === 'availability' ? ' is-active' : ''}`}
                    onClick={() => setSelectedStep('availability')}
                  >
                    <Icon name="calendar-day" weight="regular" size={18} />
                    <span><strong>action.check_availability</strong><small>150 guests · 7:00 PM</small></span>
                    <time>1.38 s</time>
                  </button>
                  <button
                    type="button"
                    className={`splunk-preview-step${selectedStep === 'control' ? ' is-active' : ''}`}
                    onClick={() => setSelectedStep('control')}
                  >
                    <Icon name="automation" weight="regular" size={18} />
                    <span><strong>control.large_event_transfer</strong><small>party_size 150 exceeded 100</small></span>
                    <time>0.12 s</time>
                  </button>
                  <button
                    type="button"
                    className={`splunk-preview-step${selectedStep === 'handoff' ? ' is-active' : ''}`}
                    onClick={() => setSelectedStep('handoff')}
                  >
                    <Icon name="blind-transfer" weight="regular" size={18} />
                    <span><strong>handoff.transfer</strong><small>VIP Events team</small></span>
                    <time>2.64 s</time>
                  </button>
                </aside>

                <section className="splunk-preview-transcript" aria-labelledby="splunk-transcript-title">
                  <div className="splunk-preview-impact-note">
                    <span aria-hidden><Icon name="analysis" weight="bold" size={18} /></span>
                    <div>
                      <strong>Representative session contributing to 77.9% voice productivity</strong>
                      <p>
                        The customer asked for a human event specialist in the first turn. The handoff
                        succeeded, but the AI did not complete the reservation goal. This added 24.8
                        eligible voice seconds and 0 productive seconds to the metric.
                      </p>
                    </div>
                  </div>
                  <h2 id="splunk-transcript-title" className="sr-only">Session transcript</h2>
                  <ol className="splunk-preview-message-list">
                    <li className="is-customer">
                      <div>
                        <span>Customer · 2:14:02 PM</span>
                        <p>I need a reservation tomorrow at 7 PM for about 150 guests, and I'd like to speak with a human event specialist.</p>
                      </div>
                    </li>
                    <li className="is-system">
                      <div>
                        <Icon name="calendar-day" weight="bold" size={18} />
                        <span><strong>Availability checked</strong>Bayview Pavilion can support 150 guests at 7:00 PM.</span>
                      </div>
                    </li>
                    <li className="is-agent">
                      <div>
                        <span>{AGENT_NAME} · 2:14:04 PM</span>
                        <p>I checked availability and I'm connecting you to our VIP Events team with your request attached.</p>
                      </div>
                    </li>
                    <li className="is-system">
                      <div>
                        <Icon name="blind-transfer" weight="bold" size={18} />
                        <span><strong>Transfer completed</strong>VIP Events team · 2:14:27 PM</span>
                      </div>
                    </li>
                  </ol>
                </section>

                <aside className="splunk-preview-inspector" aria-label="Session analysis">
                  <div className="splunk-preview-inspector-tabs" role="tablist" aria-label="Session analysis views">
                    {([
                      ['evaluators', 'Evaluators'],
                      ['params', 'Params'],
                      ['annotations', 'Annotations'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={inspectorTab === value}
                        className={inspectorTab === value ? 'is-active' : ''}
                        onClick={() => setInspectorTab(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {inspectorTab === 'evaluators' ? <EvaluatorsPanel /> : null}
                  {inspectorTab === 'params' ? <ParamsPanel sourceMetric={sourceMetric} /> : null}
                  {inspectorTab === 'annotations' ? <AnnotationsPanel /> : null}
                </aside>
              </div>
            ) : (
              <AlternateWorkspaceView tab={workspaceTab} />
            )}
          </main>
        </div>
      </div>
    </Modal>
  );
}

export default SplunkSessionModal;
