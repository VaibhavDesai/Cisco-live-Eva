import { Icon } from '../../icons';

export type ConfigurationCategory = 'knowledge' | 'memory' | 'action' | 'orchestration' | 'guardrail';

export default function ConfigurationCategoryIcon({ type }: { type: ConfigurationCategory }) {
  if (type === 'action') {
    return (
      <span className="configuration-category-icon configuration-category-icon--action" aria-hidden="true">
        <Icon name="bot-customer-assistant" weight="regular" size="xs" />
      </span>
    );
  }

  if (type === 'orchestration') {
    return (
      <span className="configuration-category-icon configuration-category-icon--orchestration" aria-hidden="true">
        <Icon name="people" weight="regular" size="xs" />
      </span>
    );
  }

  if (type === 'guardrail') {
    return (
      <span className="configuration-category-icon configuration-category-icon--guardrail" aria-hidden="true">
        <Icon name="shield" weight="regular" size="xs" />
      </span>
    );
  }

  if (type === 'knowledge') {
    return (
      <span className="configuration-category-icon configuration-category-icon--knowledge" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M2.5 3.5c1.9-.7 3.7-.4 5.5.9v8c-1.8-1.3-3.6-1.6-5.5-.9v-8Z" />
          <path d="M13.5 3.5c-1.9-.7-3.7-.4-5.5.9v8c1.8-1.3 3.6-1.6 5.5-.9v-8Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="configuration-category-icon configuration-category-icon--memory" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M6.2 13.2a2.2 2.2 0 0 1-2.1-2.8A2.5 2.5 0 0 1 3.3 6a2.4 2.4 0 0 1 3-3.1A2.4 2.4 0 0 1 8 2.3v11.4c-.6 0-1.2-.2-1.8-.5Z" />
        <path d="M9.8 13.2a2.2 2.2 0 0 0 2.1-2.8A2.5 2.5 0 0 0 12.7 6a2.4 2.4 0 0 0-3-3.1A2.4 2.4 0 0 0 8 2.3v11.4c.6 0 1.2-.2 1.8-.5Z" />
        <path d="M5.2 6.1c.8 0 1.4.4 1.8 1M10.8 6.1c-.8 0-1.4.4-1.8 1M4.5 9.8c.8-.2 1.5 0 2 .6M11.5 9.8c-.8-.2-1.5 0-2 .6" />
      </svg>
    </span>
  );
}
