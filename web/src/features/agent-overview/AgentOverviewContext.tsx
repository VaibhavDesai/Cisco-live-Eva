import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AgentOverviewTimeRange } from './agentOverviewSnapshot';

interface AgentOverviewContextValue {
  timeRanges: Record<string, AgentOverviewTimeRange>;
  getTimeRange: (agentId: string | null | undefined) => AgentOverviewTimeRange;
  setTimeRange: (agentId: string, value: AgentOverviewTimeRange) => void;
}

const AgentOverviewContext = createContext<AgentOverviewContextValue | null>(null);

export function AgentOverviewProvider({ children }: { children: ReactNode }) {
  const [timeRanges, setTimeRanges] = useState<Record<string, AgentOverviewTimeRange>>({});
  const getTimeRange = useCallback(
    (agentId: string | null | undefined) => agentId ? timeRanges[agentId] ?? '6h' : '6h',
    [timeRanges],
  );
  const setTimeRange = useCallback((agentId: string, value: AgentOverviewTimeRange) => {
    setTimeRanges(current => (
      current[agentId] === value ? current : { ...current, [agentId]: value }
    ));
  }, []);
  const value = useMemo(
    () => ({ timeRanges, getTimeRange, setTimeRange }),
    [getTimeRange, setTimeRange, timeRanges],
  );

  return (
    <AgentOverviewContext.Provider value={value}>
      {children}
    </AgentOverviewContext.Provider>
  );
}

export function useAgentOverviewContext() {
  const context = useContext(AgentOverviewContext);
  if (!context) {
    throw new Error('useAgentOverviewContext must be used within AgentOverviewProvider');
  }
  return context;
}
