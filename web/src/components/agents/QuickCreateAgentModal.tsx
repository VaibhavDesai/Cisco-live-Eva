import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  createBlankAgentDraft,
  type AgentFamily,
} from '../../features/agent-creation/agentCreationModel';
import Button from '../shared/Button';
import { Input, Textarea } from '../shared/FormInput';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../shared/Modal';

const FAMILY_PRIORITY: readonly AgentFamily[] = [
  'contact_center',
  'calling',
  'internal_assistant',
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
  const formId = 'quick-create-agent-form';
  const trimmedName = name.trim();
  const trimmedGoal = goal.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || !trimmedGoal) return;

    const family = FAMILY_PRIORITY.find(candidate => entitlements[candidate] === 'licensed');
    if (!family) {
      showToast('An AI Agent Studio license is required to create an agent.', 'warning');
      return;
    }

    const agent = createAgentDraft(createBlankAgentDraft(trimmedName, family, trimmedGoal));
    selectAgent(agent.id);
    showToast(`Created ${trimmedName} as an empty draft.`, 'success');
    onClose();
    navigate(`/agents/${encodeURIComponent(agent.id)}`);
  };

  return (
    <Modal
      size="sm"
      className="quick-create-agent-modal"
      onClose={onClose}
      ariaLabel="Start from scratch"
    >
      <ModalHeader
        title="Start from scratch"
        description="Name your agent and set its goal. We'll prepare the initial instructions for you."
        onClose={onClose}
      />
      <ModalBody>
        <form id={formId} onSubmit={handleSubmit}>
          <Input
            autoFocus
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
        </form>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} variant="primary" disabled={!trimmedName || !trimmedGoal}>
          Create agent
        </Button>
      </ModalFooter>
    </Modal>
  );
}
