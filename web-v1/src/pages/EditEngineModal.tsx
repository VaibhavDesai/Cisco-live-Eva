import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Button from '../components/shared/Button';
import { Input, Textarea } from '../components/shared/FormInput';
import Dropdown from '../components/shared/Dropdown';
import Slider from '../components/shared/Slider';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/shared/Modal';
import { Tooltip } from '../components/shared/Tooltip';
import { Icon } from '../icons';

interface EditEngineModalProps {
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  onDuplicate?: (data: { name: string; description: string }) => void;
  /** Pre-filled data for editing; omit for creation mode */
  initialData?: {
    name: string;
    description: string;
  };
}

export default function EditEngineModal({ onClose, onSave, onDuplicate, initialData }: EditEngineModalProps) {
  const isEdit = Boolean(initialData);

  // Basic info
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  // LLM config
  const [serviceApp, setServiceApp] = useState('');
  const [modelName, setModelName] = useState('');
  const [maxTokens, setMaxTokens] = useState('200');
  const [temperature, setTemperature] = useState(0.5);
  const [topP, setTopP] = useState(0.5);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Default components
  const [asr, setAsr] = useState('webex-deepgram');
  const [tts, setTts] = useState('webex-elevenlabs');

  // Save confirmation dialogs (edit mode only)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);

  const canSave = useCallback(() => {
    return name.trim().length > 0;
  }, [name]);

  const handleSave = () => {
    if (!canSave()) return;
    if (isEdit) {
      setShowSaveConfirm(true);
    } else {
      onSave({ name: name.trim(), description: description.trim() });
    }
  };

  const handleOverrideClick = () => {
    setShowSaveConfirm(false);
    setShowOverrideWarning(true);
  };

  const handleOverrideConfirm = () => {
    setShowOverrideWarning(false);
    onSave({ name: name.trim(), description: description.trim() });
  };

  const nextVersionName = (() => {
    const base = (initialData?.name ?? name).trim();
    const match = base.match(/^(.*?)\s+(\d+(?:\.\d+)?)$/);
    if (match) {
      const num = parseFloat(match[2]);
      return `${match[1]} ${(num + 1).toFixed(1)}`;
    }
    return `${base} 2.0`;
  })();

  const handleDuplicate = () => {
    setShowSaveConfirm(false);
    const cb = onDuplicate ?? onSave;
    cb({ name: nextVersionName, description: description.trim() });
  };

  return createPortal(
    <div className="fpmodal-overlay">
      <div className="fpmodal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit AI engine' : 'Create AI engine'}>
        {/* Header */}
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">{isEdit ? 'Edit AI engine' : 'Create AI engine'}</h1>
            <p className="fpmodal-subtitle">Configure the components for your custom AI engine</p>
          </div>
          <button type="button" className="fpmodal-close" onClick={onClose} aria-label="Close">
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        {/* Body — scrollable two-column layout */}
        <div className="fpmodal-body edit-engine-body">
          <div className="edit-engine-grid">
            {/* LEFT COLUMN */}
            <div className="edit-engine-col">
              {/* AI engine information card */}
              <div className="edit-engine-card">
                <h2 className="edit-engine-card-title">AI engine information</h2>
                <Input
                  label="Engine name"
                  required
                  placeholder="Enter an engine name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  clearable
                  onClear={() => setName('')}
                />
                <div className="edit-engine-field-group">
                  <div className="edit-engine-label-row">
                    <label className="form-label">Description</label>
                    <Icon name="info-badge" size={16} />
                  </div>
                  <Textarea
                    placeholder="Enter a description for this AI engine"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              {/* Default components card */}
              <div className="edit-engine-card">
                <h2 className="edit-engine-card-title">Default components</h2>
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

              {/* System components card (read-only) */}
              <div className="edit-engine-card edit-engine-card--system">
                <div className="system-components-title-row">
                  <h2 className="edit-engine-card-title">System components</h2>
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
            </div>

            {/* RIGHT COLUMN */}
            <div className="edit-engine-col">
              {/* LLM configuration card */}
              <div className="edit-engine-card">
                <h2 className="edit-engine-card-title">Large language model configuration</h2>
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

                <div className="edit-engine-field-group">
                  <div className="edit-engine-label-row">
                    <label className="form-label">Model name</label>
                    <Icon name="info-badge" size={16} />
                  </div>
                  <Input
                    placeholder="Enter a model name"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>

                <div className="edit-engine-field-group">
                  <div className="edit-engine-label-row">
                    <label className="form-label">
                      Max token <span className="required">*</span>
                    </label>
                    <Icon name="info-badge" size={16} />
                  </div>
                  <Input
                    placeholder="200"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    clearable
                    onClear={() => setMaxTokens('')}
                    hint="Maximum number of tokens to generate (1-2000)"
                  />
                </div>

                <div className="edit-engine-field-group">
                  <div className="edit-engine-label-row">
                    <label className="form-label">
                      Temperature <span className="required">*</span>
                    </label>
                    <Icon name="info-badge" size={16} />
                  </div>
                  <Slider
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
                </div>

                <div className="edit-engine-field-group">
                  <div className="edit-engine-label-row">
                    <label className="form-label">
                      Top P <span className="required">*</span>
                    </label>
                    <Icon name="info-badge" size={16} />
                  </div>
                  <Slider
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
              </div>

              {/* System prompt card */}
              <div className="edit-engine-card edit-engine-prompt-card">
                <div className="edit-engine-label-row">
                  <label className="form-label">
                    System prompt <span className="required">*</span>
                  </label>
                  <Icon name="info-badge" size={16} />
                </div>
                <Textarea
                  placeholder="Enter a system prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                />
              </div>

            </div>
          </div>

          {/* Engine summary banner — full width below both columns */}
          <div className="edit-engine-summary">
            <Icon name="info-circle" weight="bold" size={20} />
            <div className="edit-engine-summary-text">
              <h3 className="edit-engine-summary-title">Engine summary</h3>
              <p>Based on your selected components, this engine supports <strong>English</strong>. <a href="https://developer.webex-ai.cisco.com/docs/languages" target="_blank" rel="noopener noreferrer">View language support details</a></p>
              <p>Webex model selected — you qualify for the <strong>Standard</strong> pricing tier. <a href="https://developer.webex-ai.cisco.com/docs/pricing" target="_blank" rel="noopener noreferrer">Pricing details</a></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSave()}>
                {isEdit ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
        {/* Save confirmation dialog */}
        {showSaveConfirm && (
          <Modal size="sm" onClose={() => setShowSaveConfirm(false)}>
            <ModalHeader
              title="Save changes"
              description={`A new version will be saved as "${nextVersionName}". You can also override the existing engine.`}
              onClose={() => setShowSaveConfirm(false)}
            />
            <ModalFooter>
              <Button variant="tertiary" onClick={() => setShowSaveConfirm(false)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleOverrideClick}>
                Override
              </Button>
              <Button onClick={handleDuplicate}>
                Save new version
              </Button>
            </ModalFooter>
          </Modal>
        )}
        {/* Override warning confirmation */}
        {showOverrideWarning && (
          <Modal size="sm" onClose={() => setShowOverrideWarning(false)}>
            <ModalHeader
              title="Override existing engine?"
              description={`All agents currently configured with "${initialData?.name ?? name}" will be affected by this change. This action cannot be undone.`}
              onClose={() => setShowOverrideWarning(false)}
            />
            <ModalFooter>
              <Button variant="tertiary" onClick={() => setShowOverrideWarning(false)}>
                Cancel
              </Button>
              <Button variant="primary" style={{ background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={handleOverrideConfirm}>
                Override
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </div>
    </div>,
    document.body,
  );
}
