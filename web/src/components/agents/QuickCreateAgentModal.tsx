import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Icon, type IconName } from '../../icons';
import {
  createBlankAgentDraft,
  type AgentFamily,
} from '../../features/agent-creation/agentCreationModel';
import { CardRadio as MomentumCardRadio } from '@momentum-design/components/react';
import Button from '../shared/Button';
import { Input, Textarea } from '../shared/FormInput';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../shared/Modal';

type ScratchAgentTypeId = 'cx_concierge' | 'cx_specialist' | 'ai_receptionist' | 'personal_agent';

interface ScratchAgentType {
  id: ScratchAgentTypeId;
  name: string;
  description: string;
  family: AgentFamily;
  icon: IconName;
}

const CardRadio = MomentumCardRadio as any;

const SCRATCH_AGENT_TYPES: readonly ScratchAgentType[] = [
  {
    id: 'cx_concierge',
    name: 'CX Concierge',
    description: 'A continuous customer experience agent that uses memory, knowledge, and actions to resolve requests and coordinate with other agents.',
    family: 'contact_center',
    icon: 'bot',
  },
  {
    id: 'cx_specialist',
    name: 'CX Specialist',
    description: 'A focused agent for a defined task, such as booking appointments, checking order status, or handling reservations.',
    family: 'contact_center',
    icon: 'headset',
  },
  {
    id: 'ai_receptionist',
    name: 'AI Receptionist',
    description: 'A calling agent that greets, answers common questions, and routes callers for small-business phone experiences.',
    family: 'calling',
    icon: 'phone',
  },
  {
    id: 'personal_agent',
    name: 'My Personal Agent',
    description: 'An internal assistant that helps employees find information, complete everyday work, and follow through on tasks.',
    family: 'internal_assistant',
    icon: 'user',
  },
];

export default function QuickCreateAgentModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const {
    entitlements,
    createAgentDraft,
    selectAgent,
    showToast,
  } = useApp();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<ScratchAgentTypeId | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const formId = 'quick-create-agent-form';
  const trimmedName = name.trim();
  const trimmedGoal = goal.trim();
  const selectedType = SCRATCH_AGENT_TYPES.find(type => type.id === selectedTypeId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedType) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (!trimmedName || !trimmedGoal) return;

    if (entitlements[selectedType.family] !== 'licensed') {
      showToast('An AI Agent Studio license is required to create an agent.', 'warning');
      return;
    }

    const agent = createAgentDraft(createBlankAgentDraft(trimmedName, selectedType.family, trimmedGoal));
    selectAgent(agent.id);
    showToast(`Created ${trimmedName} as a ${selectedType.name} draft.`, 'success');
    onClose();
    navigate(`/agents/${encodeURIComponent(agent.id)}`);
  };

  return (
    <Modal
      size="md"
      className="quick-create-agent-modal"
      onClose={onClose}
      ariaLabel={`Start from scratch, step ${step} of 2`}
    >
      <ModalHeader
        title={step === 1 ? 'Start from scratch' : 'Name your agent'}
        description={step === 1
          ? 'Step 1 of 2 · Choose the kind of agent you want to start with.'
          : 'Step 2 of 2 · Give your agent a name and define its goal.'}
        onClose={onClose}
      />
      <ModalBody className="quick-create-agent-modal__body">
        <form id={formId} className="quick-create-agent-modal__form" onSubmit={handleSubmit}>
          {step === 1 ? (
            <fieldset className="quick-create-agent-modal__type-fieldset">
              <legend id="quick-create-agent-type-label">Agent type <span aria-hidden="true">*</span></legend>
              <p id="quick-create-agent-type-hint">Choose a starting point. You can refine capabilities and configuration after you create the agent.</p>
              <div
                className="quick-create-agent-modal__type-grid"
                role="radiogroup"
                aria-labelledby="quick-create-agent-type-label"
                aria-describedby="quick-create-agent-type-hint"
              >
                {SCRATCH_AGENT_TYPES.map(type => {
                  const isSelected = type.id === selectedTypeId;
                  return (
                    <CardRadio
                      key={type.id}
                      className={`quick-create-agent-modal__type-card quick-create-agent-modal__type-card--${type.id}`}
                      name="quick-create-agent-type"
                      cardTitle={type.name}
                      variant="border"
                      orientation="vertical"
                      checked={isSelected}
                      onChange={() => setSelectedTypeId(type.id)}
                    >
                      <span slot="title" className="quick-create-agent-modal__type-title">
                        <span className="quick-create-agent-modal__type-icon" aria-hidden="true">
                          <Icon name={type.icon} weight="bold" size="lg" />
                        </span>
                        <span>{type.name}</span>
                      </span>
                      <span slot="body" className="quick-create-agent-modal__type-description">
                        {type.description}
                      </span>
                    </CardRadio>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <div className="quick-create-agent-modal__details">
              <Input
                label="Agent name"
                required
                value={name}
                maxLength={80}
                placeholder="Enter an agent name"
                hint="You can change this later."
                onChange={event => setName(event.target.value)}
                voiceInput={false}
              />
              <Textarea
                label="Agent goal"
                required
                value={goal}
                maxLength={280}
                rows={3}
                placeholder="For example, help employees troubleshoot access and device issues."
                hint="We'll use this to prepare the agent's initial instructions."
                onChange={event => setGoal(event.target.value)}
                voiceInput={false}
              />
            </div>
          )}
        </form>
      </ModalBody>
      <ModalFooter>
        {step === 1 ? (
          <>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form={formId} variant="primary" disabled={!selectedType}>Next</Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" form={formId} variant="primary" disabled={!trimmedName || !trimmedGoal}>
              Create agent
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
