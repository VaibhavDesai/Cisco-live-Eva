import { EmptyState } from '../components/shared/EmptyState';
import Button from '../components/shared/Button';
import { Icon } from '../icons';

export default function AssistantSkills() {
  return (
    <div className="primary-content">
      <EmptyState
        global
        illustration="favorite-apps"
        title="No AI Assistant Skills yet"
        description="Create skills to extend your AI Assistant's capabilities with custom actions and workflows."
        actions={
          <Button variant="secondary">
            <Icon name="plus" weight="bold" size={20} />
            Create skill
          </Button>
        }
      />
    </div>
  );
}
