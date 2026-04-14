import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '../components/shared/Button';
import { Input, Textarea } from '../components/shared/FormInput';
import Dropdown from '../components/shared/Dropdown';
import Slider from '../components/shared/Slider';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/shared/Modal';
import { Tooltip } from '../components/shared/Tooltip';
import { Icon } from '../icons';
import { Banner } from '../components/shared/Banner';

const SYSTEM_PROMPT_GUIDELINES = [
  {
    title: 'Define the agent\'s role and scope',
    description: 'Open with a clear identity statement — who the agent is, which tasks it handles, and where its boundaries are. This prevents the agent from drifting into topics outside its contact center function.',
  },
  {
    title: 'Verify caller identity before disclosing data',
    description: 'Require authentication (account number, date of birth, or security question) before accessing any personal or account-specific information. This is critical for compliance in regulated contact center environments.',
  },
  {
    title: 'Handle one issue at a time',
    description: 'Ask a single clarifying question, wait for the caller\'s response, then proceed. Contact center callers are often already frustrated — multiple questions at once increases abandonment.',
  },
  {
    title: 'Define escalation and transfer rules',
    description: 'Specify when and how the agent should escalate to a live agent, create a ticket, or transfer to another queue. Always provide a reference number so the caller can follow up.',
  },
  {
    title: 'Guard sensitive data',
    description: 'Instruct the agent to never reveal full account numbers, SSNs, internal policies, or other customers\' data. Only confirm the last few digits when verification is needed.',
  },
];

type WizardStep = 1 | 2 | 3;

interface StepDef {
  num: WizardStep;
  label: string;
}

const STEPS: StepDef[] = [
  { num: 1, label: 'Basic information' },
  { num: 2, label: 'Configure LLM' },
  { num: 3, label: 'Review' },
];

interface CreateEngineModalProps {
  onClose: () => void;
  onCreate?: (data: { name: string; description: string }) => void;
}

export default function CreateEngineModal({ onClose, onCreate }: CreateEngineModalProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 — LLM configuration
  const [serviceApp, setServiceApp] = useState('');
  const [modelName, setModelName] = useState('');
  const [maxTokens, setMaxTokens] = useState('200');
  const [temperature, setTemperature] = useState(0.5);
  const [topP, setTopP] = useState(0.5);
  const [systemPrompt, setSystemPrompt] = useState('');

  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptOverflows, setPromptOverflows] = useState(false);
  const promptRef = useRef<HTMLSpanElement>(null);
  const [showGuideline, setShowGuideline] = useState(false);

  useEffect(() => {
    const el = promptRef.current;
    if (!el || promptExpanded) return;
    const check = () => setPromptOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [systemPrompt, promptExpanded, step]);

  // Step 3 — Default components
  const [asr, setAsr] = useState('webex-deepgram');
  const [tts, setTts] = useState('webex-elevenlabs');

  const SERVICE_APP_LABELS: Record<string, string> = {
    openai: 'OpenAI',
    'azure-openai': 'Azure OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
  };

  const truncatePrompt = (text: string, max = 120) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  const canProceed = useCallback(() => {
    if (step === 1) return name.trim().length > 0 && description.trim().length > 0;
    if (step === 2) return serviceApp !== '' && maxTokens.trim().length > 0 && systemPrompt.trim().length > 0;
    if (step === 3) return asr !== '' && tts !== '';
    return true;
  }, [step, name, description, serviceApp, maxTokens, systemPrompt, asr, tts]);

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as WizardStep);
    else onCreate?.({ name: name.trim(), description: description.trim() });
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  return createPortal(
    <div className="fpmodal-overlay">
      <div className="fpmodal" role="dialog" aria-modal="true" aria-label="Create AI engine">
        {/* Header */}
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">Create AI engine</h1>
            <p className="fpmodal-subtitle">Configure the components for your custom AI engine</p>
          </div>
          <button
            type="button"
            className="fpmodal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        {/* Stepper */}
        <div className="fpmodal-stepper">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            const cls = [
              'wizard-step',
              isActive && 'active',
              isCompleted && 'completed',
            ].filter(Boolean).join(' ');

            return (
              <span key={s.num} style={{ display: 'contents' }}>
                {i > 0 && (
                  <div className={`wizard-step-line${step > s.num ? ' completed' : ''}`} />
                )}
                <div className={cls}>
                  <div className="wizard-step-number">
                    {isCompleted
                      ? <Icon name="check" weight="bold" size={16} />
                      : isActive
                        ? <Icon name="edit" weight="bold" size={16} />
                        : s.num}
                  </div>
                  <span className="wizard-step-label">{s.label}</span>
                </div>
              </span>
            );
          })}
        </div>

        {/* Body */}
        <div className="fpmodal-body">
          <div className="fpmodal-content-area">
            {step === 1 && (
              <div className="fpmodal-step1-layout">
                <div className="fpmodal-section">
                  <h2 className="fpmodal-section-title">Basic information</h2>
                  <div className="fpmodal-card">
                    <Input
                      label="Engine name"
                      required
                      placeholder="Enter an engine name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      clearable
                      onClear={() => setName('')}
                    />
                    <Input
                      label="Description"
                      required
                      placeholder="Enter a description for this AI engine"
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) setDescription(e.target.value);
                      }}
                      maxLength={30}
                      showCharCount
                      hint="30 characters limit"
                      clearable
                      onClear={() => setDescription('')}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fpmodal-section">
                <h2 className="fpmodal-section-title">Large Language Model</h2>
                <div className="fpmodal-llm-grid">
                  {/* Left column: model settings */}
                  <div className="fpmodal-card">
                    <div className="form-group">
                      <label className="form-label">
                        Service app <span className="required">*</span>
                      </label>
                      <Dropdown
                        placeholder="Select a service app"
                        options={[
                          { value: 'openai', label: 'OpenAI' },
                          { value: 'azure-openai', label: 'Azure OpenAI' },
                          { value: 'anthropic', label: 'Anthropic' },
                          { value: 'google', label: 'Google AI' },
                        ]}
                        value={serviceApp}
                        onChange={setServiceApp}
                      />
                    </div>

                    <Input
                      label="Model name"
                      placeholder="Enter a model name"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                    />

                    <Input
                      label="Max token"
                      required
                      placeholder="200"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      clearable
                      onClear={() => setMaxTokens('')}
                      hint="Maximum number of tokens to generate (1-2000)"
                    />

                    <Slider
                      label="Temperature"
                      value={temperature}
                      onChange={(v) => setTemperature(v as number)}
                      min={0}
                      max={1}
                      step={0.1}
                      showValueLabels
                      minLabel="0"
                      midLabel="0.5"
                      maxLabel="1"
                      showTooltip
                    />

                    <Slider
                      label="Top P"
                      value={topP}
                      onChange={(v) => setTopP(v as number)}
                      min={0}
                      max={1}
                      step={0.1}
                      showValueLabels
                      minLabel="0"
                      midLabel="0.5"
                      maxLabel="1"
                      showTooltip
                    />
                  </div>

                  {/* Right column: system prompt */}
                  <div className="fpmodal-card fpmodal-prompt-card">
                    <label className="form-label">
                      System prompt <span className="required">*</span>
                    </label>
                    <div className="fpmodal-prompt-editor">
                      <div className="fpmodal-prompt-toolbar">
                        <div className="fpmodal-toolbar-group">
                          <button type="button" className="fpmodal-toolbar-icon" aria-label="Bold">
                            <Icon name="bold" weight="bold" size={16} />
                          </button>
                          <button type="button" className="fpmodal-toolbar-icon" aria-label="Italic">
                            <Icon name="italic" weight="bold" size={16} />
                          </button>
                          <button type="button" className="fpmodal-toolbar-icon" aria-label="Underline">
                            <Icon name="underline" weight="bold" size={16} />
                          </button>
                        </div>

                        <span className="fpmodal-toolbar-divider" />

                        <button type="button" className="fpmodal-toolbar-icon" aria-label="Link">
                          <Icon name="link" weight="bold" size={16} />
                        </button>

                        <span className="fpmodal-toolbar-divider" />

                        <button type="button" className="fpmodal-toolbar-icon" aria-label="Markdown">
                          <Icon name="markdown" weight="bold" size={16} />
                        </button>

                        <span className="fpmodal-toolbar-divider" />

                        <button
                          type="button"
                          className="fpmodal-toolbar-pill"
                          onClick={() => setShowGuideline(true)}
                        >
                          <Icon name="guide" weight="bold" size={16} />
                          Guideline
                        </button>
                      </div>

                      <textarea
                        className="fpmodal-prompt-textarea"
                        placeholder="Enter a system prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={14}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="fpmodal-review-grid">
                {/* Left column */}
                <div className="fpmodal-review-left">
                  {/* AI engine information */}
                  <div className="fpmodal-review-card">
                    <div className="fpmodal-review-card-header">
                      <Icon name="check-circle" weight="bold" size="md" color="var(--success-color)" />
                      <h3 className="fpmodal-review-card-title">AI engine information</h3>
                    </div>
                    <div className="fpmodal-review-table">
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Engine name</span>
                        <span className="fpmodal-review-value">{name || '—'}</span>
                      </div>
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Engine description</span>
                        <span className="fpmodal-review-value">{description || '—'}</span>
                      </div>
                    </div>
                    <div className="fpmodal-review-card-footer">
                      <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Edit</Button>
                    </div>
                  </div>

                  {/* LLM configuration */}
                  <div className="fpmodal-review-card">
                    <div className="fpmodal-review-card-header">
                      <Icon name="check-circle" weight="bold" size="md" color="var(--success-color)" />
                      <h3 className="fpmodal-review-card-title">Large language model configuration</h3>
                    </div>
                    <div className="fpmodal-review-table">
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Service app</span>
                        <span className="fpmodal-review-value">{SERVICE_APP_LABELS[serviceApp] || '—'}</span>
                      </div>
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Model name</span>
                        <span className="fpmodal-review-value">{modelName || '—'}</span>
                      </div>
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Max token</span>
                        <span className="fpmodal-review-value">{maxTokens || '—'}</span>
                      </div>
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Temperature</span>
                        <span className="fpmodal-review-value">{temperature}</span>
                      </div>
                      <div className="fpmodal-review-row">
                        <span className="fpmodal-review-label">Top P</span>
                        <span className="fpmodal-review-value">{topP}</span>
                      </div>
                    </div>
                    <div className="fpmodal-prompt-section">
                      <span className="fpmodal-review-label">System prompt</span>
                      <div className="fpmodal-prompt-body">
                        {!systemPrompt ? <span className="fpmodal-review-value">—</span> : (
                          <>
                            <span
                              ref={promptRef}
                              className={`fpmodal-prompt-preview${promptExpanded ? ' expanded' : ''}`}
                            >
                              {systemPrompt}
                            </span>
                            {(promptOverflows || promptExpanded) && (
                              <button
                                type="button"
                                className="fpmodal-view-all"
                                onClick={() => setPromptExpanded(prev => !prev)}
                              >
                                {promptExpanded ? 'Show less' : 'View all'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="fpmodal-review-card-footer">
                      <Button variant="secondary" size="sm" onClick={() => setStep(2)}>Edit</Button>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="fpmodal-review-right">
                  {/* Default components */}
                  <div className="fpmodal-review-card">
                    <h3 className="fpmodal-review-card-title" style={{ marginBottom: '16px' }}>
                      Default components
                    </h3>
                    <div className="form-group">
                      <label className="form-label">
                        Automatic Speech Recognition <span className="required">*</span>
                      </label>
                      <Dropdown
                        placeholder="Select ASR"
                        options={[
                          { value: 'webex-deepgram', label: 'Webex (powered by Deepgram)' },
                          { value: 'webex-google', label: 'Webex (powered by Google)' },
                        ]}
                        value={asr}
                        onChange={setAsr}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Text-to-Speech <span className="required">*</span>
                      </label>
                      <Dropdown
                        placeholder="Select TTS"
                        options={[
                          { value: 'webex-elevenlabs', label: 'Webex (powered by Elevenlabs)' },
                          { value: 'webex-google', label: 'Webex (powered by Google)' },
                        ]}
                        value={tts}
                        onChange={setTts}
                      />
                    </div>
                  </div>

                  {/* System components (read-only) */}
                  <div className="fpmodal-review-card fpmodal-review-card--system">
                    <div className="system-components-title-row">
                      <h3 className="fpmodal-review-card-title">System components</h3>
                      <Tooltip content="Automatically included with your engine." placement="right">
                        <span className="system-components-info">
                          <Icon name="info-circle" weight="bold" size={16} />
                        </span>
                      </Tooltip>
                    </div>
                    <div className="system-components-list">
                      <div className="system-component-item">
                        <span className="system-component-label">Interim Response Model</span>
                        <span className="system-component-value">Webex Interim Responses</span>
                      </div>
                      <div className="system-component-item">
                        <span className="system-component-label">Turn Prediction Model</span>
                        <span className="system-component-value">Webex Turn Prediction</span>
                      </div>
                      <div className="system-component-item">
                        <span className="system-component-label">Standalone Query Generator Model</span>
                        <span className="system-component-value">Webex Standalone Query Generator</span>
                      </div>
                      <div className="system-component-item">
                        <span className="system-component-label">Guardrails</span>
                        <span className="system-component-value">Webex Guardrails</span>
                      </div>
                      <div className="system-component-item">
                        <span className="system-component-label">Retrieval-Augmented Generation</span>
                        <span className="system-component-value">Webex Retrieval-Augmented Generation</span>
                      </div>
                    </div>
                  </div>

                  {/* Engine summary banner */}
                  <Banner
                    type="info"
                    title="Engine summary"
                    subtitle={<>Based on your selected components, this engine supports <strong>English</strong>. <a href="https://developer.webex-ai.cisco.com/docs/languages" target="_blank" rel="noopener noreferrer">View language support details</a><br />Webex model selected — you qualify for the <strong>Standard</strong> pricing tier. <a href="https://developer.webex-ai.cisco.com/docs/pricing" target="_blank" rel="noopener noreferrer">Pricing details</a></>}
                    dismissable={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              {step > 1 && (
                <button type="button" className="fpmodal-back-btn" onClick={handleBack}>
                  <Icon name="arrow-left" weight="bold" size={16} />
                  Back
                </button>
              )}
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNext} disabled={!canProceed()}>
                {step === 3 ? 'Create' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showGuideline && (
        <Modal size="md" onClose={() => setShowGuideline(false)}>
          <ModalHeader
            title="System prompt guidelines"
            description="Follow these best practices when writing a system prompt for your AI engine."
            onClose={() => setShowGuideline(false)}
          />
          <ModalBody>
            <div className="guideline-list">
              {SYSTEM_PROMPT_GUIDELINES.map((g, i) => (
                <div key={i} className="guideline-item">
                  <span className="guideline-number">{i + 1}</span>
                  <div className="guideline-content">
                    <h4 className="guideline-title">{g.title}</h4>
                    <p className="guideline-description">{g.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowGuideline(false)}>Done</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>,
    document.body,
  );
}
