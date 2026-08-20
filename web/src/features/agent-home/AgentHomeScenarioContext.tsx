import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  persistDemoHomeMode,
  readDemoHomeMode,
  type DemoHomeMode,
} from './agentHomeModel';

interface AgentHomeScenarioContextValue {
  mode: DemoHomeMode;
  setMode: (mode: DemoHomeMode) => void;
}

const AgentHomeScenarioContext = createContext<AgentHomeScenarioContextValue | null>(null);

export function AgentHomeScenarioProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DemoHomeMode>(() => readDemoHomeMode());

  const setMode = useCallback((nextMode: DemoHomeMode) => {
    setModeState(persistDemoHomeMode(nextMode));
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <AgentHomeScenarioContext.Provider value={value}>
      {children}
    </AgentHomeScenarioContext.Provider>
  );
}

export function useAgentHomeScenario() {
  const context = useContext(AgentHomeScenarioContext);
  if (!context) {
    throw new Error('useAgentHomeScenario must be used within AgentHomeScenarioProvider');
  }
  return context;
}
