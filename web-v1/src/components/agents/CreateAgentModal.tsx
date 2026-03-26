import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../shared/Modal';
import Button from '../shared/Button';
import { Icon } from '../../icons';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
];

const KNOWLEDGE_BASES = [
  { id: 'product-docs', name: 'Product Documentation', meta: '2,847 articles • Last synced 1 hour ago' },
  { id: 'faq', name: 'FAQ Database', meta: '156 Q&A pairs • Last synced 3 hours ago' },
  { id: 'support', name: 'Support Articles', meta: '1,234 articles • Last synced 2 hours ago' },
];

export default function CreateAgentModal({ onClose }) {
  const navigate = useNavigate();
  const { addAgent, showToast } = useApp();
  
  const [step, setStep] = useState(1);
  const [agentType, setAgentType] = useState('scripted');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [selectedKbs, setSelectedKbs] = useState([]);

  const canProceed = () => {
    if (step === 1) return agentType !== '';
    if (step === 2) return name.trim() !== '';
    if (step === 3) return true;
    return true;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = () => {
    const newAgent = addAgent({
      name,
      description: description || 'New AI Agent',
      gradient: avatarColor,
      status: 'Ready to Publish',
      knowledgeBases: selectedKbs
    });
    
    showToast(`Agent "${name}" created successfully!`, 'success');
    onClose();
    navigate(`/agents/${newAgent.id}`);
  };

  const toggleKb = (kbId) => {
    setSelectedKbs(prev => 
      prev.includes(kbId) 
        ? prev.filter(id => id !== kbId)
        : [...prev, kbId]
    );
  };

  const getInitials = () => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Create New Agent" onClose={onClose} />
      
      {/* Wizard Progress */}
      <div className="wizard-progress">
        {[
          { num: 1, label: 'Type' },
          { num: 2, label: 'Details' },
          { num: 3, label: 'Knowledge' },
          { num: 4, label: 'Review' },
        ].map((s, i) => {
          const isCompleted = step > s.num;
          const isActive = step === s.num;
          const cls = `wizard-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`;
          return (
            <span key={s.num} style={{ display: 'contents' }}>
              {i > 0 && <div className={`wizard-step-line${step >= s.num ? ' completed' : ''}`} />}
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

      <ModalBody>
        {/* Step 1: Agent Type */}
        {step === 1 && (
          <div className="agent-type-grid">
            <div 
              className={`agent-type-card ${agentType === 'scripted' ? 'selected' : ''}`}
              onClick={() => setAgentType('scripted')}
            >
              <div className="agent-type-icon" style={{ background: 'color-mix(in srgb, var(--accent-color) 20%, transparent)' }}>
                <Icon name="document" weight="bold" size="lg" color="var(--accent-color)" />
              </div>
              <h3>Scripted Agent</h3>
              <p>Follow predefined scripts and decision trees for consistent responses.</p>
              <div className="agent-type-features">
                <div className="agent-type-feature">
                  <Icon name="check" weight="bold" size="sm" color="var(--success-color)" />
                  Predictable behavior
                </div>
                <div className="agent-type-feature">
                  <Icon name="check" weight="bold" size="sm" color="var(--success-color)" />
                  Easy to maintain
                </div>
              </div>
            </div>

            <div 
              className={`agent-type-card ${agentType === 'autonomous' ? 'selected' : ''}`}
              onClick={() => setAgentType('autonomous')}
            >
              <div className="agent-type-icon" style={{ background: 'color-mix(in srgb, var(--success-color) 20%, transparent)' }}>
                <Icon name="refresh" weight="bold" size="lg" color="var(--success-color)" />
              </div>
              <h3>Autonomous Agent</h3>
              <p>Use AI to dynamically respond based on context and knowledge.</p>
              <div className="agent-type-features">
                <div className="agent-type-feature">
                  <Icon name="check" weight="bold" size="sm" color="var(--success-color)" />
                  Flexible responses
                </div>
                <div className="agent-type-feature">
                  <Icon name="check" weight="bold" size="sm" color="var(--success-color)" />
                  Knowledge-powered
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">
                Agent Name <span className="required">*</span>
              </label>
              <input 
                type="text" 
                className="form-input"
                placeholder="e.g., Customer Support Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
              <div className="form-helper-row">
                <span className="form-hint">Choose a descriptive name for your agent</span>
                <span className="form-hint">{name.length}/50</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-input"
                placeholder="Briefly describe what this agent does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <div className="form-helper-row">
                <span className="form-hint">Help users understand the agent's purpose</span>
                <span className="form-hint">{description.length}/200</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div className="avatar-selector">
                <div 
                  className="avatar-preview" 
                  style={{ background: avatarColor }}
                >
                  {getInitials()}
                </div>
                <div className="avatar-colors">
                  {AVATAR_COLORS.map((color, idx) => (
                    <div
                      key={idx}
                      className={`avatar-color ${avatarColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setAvatarColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Knowledge */}
        {step === 3 && (
          <div>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Select knowledge bases to connect to your agent (optional)
            </p>
            {KNOWLEDGE_BASES.map(kb => (
              <div 
                key={kb.id}
                className={`kb-option ${selectedKbs.includes(kb.id) ? 'selected' : ''}`}
                onClick={() => toggleKb(kb.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedKbs.includes(kb.id)}
                  onChange={() => {}}
                />
                <div className="kb-option-info">
                  <div className="kb-option-name">{kb.name}</div>
                  <div className="kb-option-meta">{kb.meta}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <div className="summary-section">
              <div className="summary-section-title">Agent Details</div>
              <div className="summary-row">
                <span className="summary-label">Type</span>
                <span className="summary-value">{agentType === 'scripted' ? 'Scripted Agent' : 'Autonomous Agent'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Name</span>
                <span className="summary-value">{name}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Description</span>
                <span className="summary-value">{description || 'No description'}</span>
              </div>
            </div>

            <div className="summary-section">
              <div className="summary-section-title">Knowledge Bases</div>
              {selectedKbs.length === 0 ? (
                <div className="summary-row">
                  <span className="summary-label">None selected</span>
                </div>
              ) : (
                selectedKbs.map(kbId => {
                  const kb = KNOWLEDGE_BASES.find(k => k.id === kbId);
                  return (
                    <div key={kbId} className="summary-row">
                      <span className="summary-value">{kb?.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate}>
              Create Agent
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
