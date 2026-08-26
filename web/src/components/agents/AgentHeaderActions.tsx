import { useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type Agent } from '../../contexts/AppContext';
import { Icon } from '../../icons';
import Button from '../shared/Button';
import { MenuItem, MenuOverlay, useMenu } from '../shared/Menu';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../shared/Modal';

const CUSTOM_AGENT_TEMPLATE_STORAGE_KEY = 'webex-ai-agent-studio-custom-templates-v1';

interface AgentHeaderActionsProps {
  agent: Agent;
  onPreview?: () => void;
  releaseLabel?: string;
  releaseDisabled?: boolean;
  releaseVariant?: 'primary' | 'secondary';
  onRelease?: () => void;
}

/** Shared Preview, release, and overflow actions for every Agent Studio page. */
export default function AgentHeaderActions({
  agent,
  onPreview,
  releaseLabel = agent.status === 'Published' ? 'Unpublish' : 'Save',
  releaseDisabled = agent.status !== 'Published',
  releaseVariant = agent.status === 'Published' ? 'secondary' : 'primary',
  onRelease,
}: AgentHeaderActionsProps) {
  const navigate = useNavigate();
  const { agentDrafts, removeAgent, showToast, toggleAgentPublish } = useApp();
  const overflowMenu = useMenu();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
      return;
    }
    navigate(`/agents/${encodeURIComponent(agent.id)}?preview=1`);
  };

  const handleRelease = () => {
    if (onRelease) {
      onRelease();
      return;
    }
    if (agent.status === 'Published') {
      toggleAgentPublish(agent.id);
      showToast('Agent unpublished successfully', 'success');
    }
  };

  const handleMakeTemplate = () => {
    overflowMenu.close();
    try {
      const stored = JSON.parse(window.localStorage.getItem(CUSTOM_AGENT_TEMPLATE_STORAGE_KEY) || '[]');
      const templates = Array.isArray(stored) ? stored : [];
      const nextTemplate = {
        id: `template-${agent.id}`,
        sourceAgentId: agent.id,
        name: agent.name,
        createdAt: new Date().toISOString(),
        agent,
        draft: agentDrafts[agent.id] ?? null,
      };
      window.localStorage.setItem(
        CUSTOM_AGENT_TEMPLATE_STORAGE_KEY,
        JSON.stringify([
          nextTemplate,
          ...templates.filter(template => template?.sourceAgentId !== agent.id),
        ]),
      );
      showToast(`${agent.name} saved as a template`, 'success');
    } catch {
      showToast('The template could not be saved. Try again.', 'error');
    }
  };

  const handleDelete = () => {
    const deleted = removeAgent(agent.id);
    setDeleteConfirmationOpen(false);
    if (!deleted) {
      showToast('The agent could not be deleted.', 'error');
      return;
    }
    navigate('/agents', { replace: true });
    showToast(`${agent.name} deleted`, 'success');
  };

  return (
    <>
      <div
        className="agent-studio-header-actions"
        role="group"
        aria-label={`Actions for ${agent.name}`}
      >
        <Button
          type="button"
          variant="secondary"
          aria-label={`Preview ${agent.name}`}
          onClick={handlePreview}
        >
          <Icon name="play" weight="bold" size="xs" />
          Preview
        </Button>
        <Button
          type="button"
          variant={releaseVariant}
          disabled={releaseDisabled}
          aria-label={`${releaseLabel} ${agent.name}`}
          onClick={handleRelease}
        >
          {releaseLabel}
        </Button>
        <button
          ref={overflowMenu.anchorRef as RefObject<HTMLButtonElement>}
          type="button"
          className="agent-studio-header-more-button"
          aria-label={`More options for ${agent.name}`}
          aria-haspopup="menu"
          aria-expanded={overflowMenu.open}
          onClick={overflowMenu.toggle}
        >
          <Icon name="more-adr" weight="bold" size={20} />
        </button>
      </div>

      <MenuOverlay
        open={overflowMenu.open}
        anchorRef={overflowMenu.anchorRef}
        onClose={overflowMenu.close}
        align="right"
        className="agent-studio-header-menu"
      >
        <MenuItem
          label="Make this agent as a template"
          icon="copy"
          onClick={handleMakeTemplate}
        />
        <MenuItem
          label="Delete"
          icon="delete"
          danger
          onClick={() => {
            overflowMenu.close();
            setDeleteConfirmationOpen(true);
          }}
        />
      </MenuOverlay>

      {deleteConfirmationOpen && (
        <Modal size="sm" onClose={() => setDeleteConfirmationOpen(false)}>
          <ModalHeader
            title={`Delete ${agent.name}?`}
            description="This permanently removes the agent and its saved configuration."
            onClose={() => setDeleteConfirmationOpen(false)}
          />
          <ModalBody>
            <p>This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button type="button" color="negative" onClick={handleDelete}>
              Delete agent
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
