import { AssistantWidget } from './assistant/AssistantWidget';
import { StatesVersionsToolbar } from './StatesVersionsToolbar';
import { VersionStateUrlSync } from './StatesVersionsContext';

/** Co-Builder assistant + States and Versions toolbar (fixed corners). */
export function AppFloatingTools() {
  return (
    <>
      <VersionStateUrlSync />
      <StatesVersionsToolbar />
      <AssistantWidget />
    </>
  );
}
