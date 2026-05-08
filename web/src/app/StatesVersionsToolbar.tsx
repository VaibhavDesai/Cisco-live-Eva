import { Button, Text } from '@momentum-design/components/react';
import { useStatesVersions } from './StatesVersionsContext';

export function StatesVersionsToolbar() {
  const {
    toolbarEnabled,
    versions,
    activeVersionId,
    setActiveVersionId,
    states,
    activeStateId,
    setActiveStateId,
  } = useStatesVersions();

  if (!toolbarEnabled) {
    return null;
  }

  const showVersions = versions.length > 1;
  const showStates = states.length > 1;

  if (!showVersions && !showStates) {
    return null;
  }

  return (
    <div
      className="states-versions-toolbar"
      role="toolbar"
      aria-label="States and versions"
    >
      {showVersions ? (
        <div className="states-versions-toolbar-group" role="group" aria-label="Versions">
          <Text type="body-small-regular" className="states-versions-toolbar-label text-secondary">
            Version
          </Text>
          <div className="states-versions-toolbar-segments">
            {versions.map((v) => (
              <Button
                key={v.id}
                color={activeVersionId === v.id ? 'accent' : 'default'}
                variant={activeVersionId === v.id ? 'primary' : 'secondary'}
                size={32}
                onClick={() => setActiveVersionId(v.id)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {showVersions && showStates ? (
        <div className="states-versions-toolbar-divider" aria-hidden />
      ) : null}
      {showStates ? (
        <div className="states-versions-toolbar-group" role="group" aria-label="States">
          <Text type="body-small-regular" className="states-versions-toolbar-label text-secondary">
            State
          </Text>
          <div className="states-versions-toolbar-segments">
            {states.map((s) => (
              <Button
                key={s.id}
                color={activeStateId === s.id ? 'accent' : 'default'}
                variant={activeStateId === s.id ? 'primary' : 'secondary'}
                size={32}
                onClick={() => setActiveStateId(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
