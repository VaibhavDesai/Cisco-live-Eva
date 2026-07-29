import { Icon } from '../../icons';

export type ConfigurationCategory = 'knowledge' | 'memory' | 'action' | 'orchestration' | 'guardrail';

export function KnowledgeBookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 3.5c1.9-.7 3.7-.4 5.5.9v8c-1.8-1.3-3.6-1.6-5.5-.9v-8Z" />
      <path d="M13.5 3.5c-1.9-.7-3.7-.4-5.5.9v8c1.8-1.3 3.6-1.6 5.5-.9v-8Z" />
    </svg>
  );
}

export default function ConfigurationCategoryIcon({ type }: { type: ConfigurationCategory }) {
  if (type === 'action') {
    return (
      <span className="configuration-category-icon configuration-category-icon--action" aria-hidden="true">
        <Icon name="tools" weight="bold" size="xs" />
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

  if (type === 'memory') {
    return (
      <span className="configuration-category-icon configuration-category-icon--memory" aria-hidden="true">
        <Icon name="mind-map" weight="regular" size="xs" />
      </span>
    );
  }

  return (
    <span className="configuration-category-icon configuration-category-icon--knowledge" aria-hidden="true">
      <KnowledgeBookIcon />
    </span>
  );
}
