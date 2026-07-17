import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CISCO_LIVE_AGENTS } from '../demo/ciscoLiveDemo';

// Types
export interface Agent {
  id: string;
  name: string;
  initials: string;
  description: string;
  gradient: string;
  status: string;
  statusClass: string;
  sessions: string;
  successRate: string;
  messages: string;
  avgResponse: string;
  meta: string;
  knowledgeBases?: string[];
  actions?: string[];
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  agentType?: 'Autonomous agent' | 'Scripted agent';
}

export interface AgentsMap {
  [key: string]: Agent;
}

export interface AiEngine {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  lastUpdated: string;
  type: 'Custom' | 'System';
  editable: boolean;
}

export interface AppContextValue {
  agents: AgentsMap;
  currentAgent: Agent | null;
  openAgents: string[];
  selectAgent: (agentId: string) => void;
  goToAgent: (agentId: string) => void;
  closeAgentNav: (agentId: string) => void;
  addAgent: (newAgent: Partial<Agent>) => Agent;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  toggleAgentPublish: (agentId: string) => void;
  toast: { message: string; type?: 'default' | 'info' | 'success' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'default' | 'info' | 'success' | 'warning' | 'error') => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  aiEngines: AiEngine[];
  addAiEngine: (engine: Omit<AiEngine, 'id' | 'lastUpdated' | 'type' | 'editable'>) => void;
  updateAiEngine: (id: string, data: { name: string; description: string }) => void;
  removeAiEngine: (id: string) => void;
}

// Initial agents data
const initialAgents = Object.fromEntries(
  CISCO_LIVE_AGENTS.map((definition) => [definition.id, definition]),
) as AgentsMap;

// Create context
const AppContext = createContext<AppContextValue | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Agents state
  const [agents, setAgents] = useState<AgentsMap>(initialAgents);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [openAgents, setOpenAgents] = useState<string[]>([]);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type?: 'default' | 'info' | 'success' | 'warning' | 'error' } | null>(null);
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Shared AI engine list
  const [aiEngines, setAiEngines] = useState<AiEngine[]>([
    {
      id: 'sys-1',
      name: 'Webex AI Pro-US 1.0',
      description: 'US-region optimized Webex AI engine',
      createdBy: 'System',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'System',
      editable: false,
    },
    {
      id: 'sys-2',
      name: 'Webex AI Pro 1.0',
      description: 'General-purpose Webex AI engine',
      createdBy: 'System',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'System',
      editable: false,
    },
    {
      id: 'custom-1',
      name: 'Custom engine name',
      description: 'Custom LLM integration for tailored AI workflows',
      createdBy: 'Claire K',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'Custom',
      editable: true,
    },
  ]);

  const addAiEngine = useCallback((engine: Omit<AiEngine, 'id' | 'lastUpdated' | 'type' | 'editable'>) => {
    const newEngine: AiEngine = {
      ...engine,
      id: String(Date.now()),
      lastUpdated: new Date().toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: '2-digit',
        hour: 'numeric', minute: '2-digit',
      }),
      type: 'Custom',
      editable: true,
    };
    setAiEngines(prev => [newEngine, ...prev]);
  }, []);

  const updateAiEngine = useCallback((id: string, data: { name: string; description: string }) => {
    setAiEngines(prev => prev.map(e =>
      e.id === id
        ? {
            ...e,
            name: data.name,
            description: data.description,
            lastUpdated: new Date().toLocaleString('en-US', {
              day: '2-digit', month: 'short', year: '2-digit',
              hour: 'numeric', minute: '2-digit',
            }),
          }
        : e
    ));
  }, []);

  const removeAiEngine = useCallback((id: string) => {
    setAiEngines(prev => prev.filter(e => e.id !== id));
  }, []);

  // Select an agent (navigates to agent overview)
  const selectAgent = useCallback((agentId: string) => {
    const agent = agents[agentId];
    if (!agent) return;
    
    setCurrentAgent(agent);
    
    // Add to open agents if not already there
    setOpenAgents(prev => {
      if (!prev.includes(agentId)) {
        return [...prev, agentId];
      }
      return prev;
    });
  }, [agents]);

  // Go to agent (when clicking sidebar shortcut)
  const goToAgent = useCallback((agentId: string) => {
    const agent = agents[agentId];
    if (!agent) return;
    setCurrentAgent(agent);
  }, [agents]);

  // Close agent shortcut from sidebar
  const closeAgentNav = useCallback((agentId: string) => {
    setOpenAgents(prev => prev.filter(id => id !== agentId));
    
    // If closing current agent, clear it
    if (currentAgent && currentAgent.id === agentId) {
      setCurrentAgent(null);
    }
  }, [currentAgent]);

  // Show toast message
  const showToast = useCallback((message: string, type?: 'default' | 'info' | 'success' | 'warning' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Add new agent
  const addAgent = useCallback((newAgent: Partial<Agent> & { name: string; description: string; gradient: string; status: string }) => {
    const id = newAgent.name.toLowerCase().replace(/\s+/g, '-').slice(0, 10);
    const createdAt = new Date().toISOString();
    const agentWithId: Agent = {
      id,
      name: newAgent.name,
      description: newAgent.description,
      gradient: newAgent.gradient,
      status: newAgent.status,
      initials: newAgent.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      statusClass: newAgent.statusClass ?? 'badge-warning',
      sessions: '—',
      successRate: '—',
      messages: '—',
      avgResponse: '—',
      meta: `${newAgent.description} • Just created`,
      createdAt,
      updatedAt: createdAt,
      agentType: newAgent.agentType ?? 'Autonomous agent',
    };
    
    setAgents(prev => ({
      ...prev,
      [id]: agentWithId
    }));
    
    // Select the new agent
    setCurrentAgent(agentWithId);
    setOpenAgents(prev => [...prev, id]);
    
    return agentWithId;
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => {
      const agent = prev[agentId];
      if (!agent) return prev;

      const updatedAgent: Agent = {
        ...agent,
        ...updates,
        initials: updates.name
          ? updates.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
          : agent.initials,
        updatedAt: new Date().toISOString(),
      };

      setCurrentAgent(current => current?.id === agentId ? updatedAgent : current);
      return { ...prev, [agentId]: updatedAgent };
    });
  }, []);

  // Toggle agent publish status
  const toggleAgentPublish = useCallback((agentId: string) => {
    setAgents(prev => {
      const agent = prev[agentId];
      if (!agent) return prev;
      
      const isPublished = agent.status === 'Published';
      const updatedAgent: Agent = {
        ...agent,
        status: isPublished ? 'Ready to Publish' : 'Published',
        statusClass: isPublished ? 'badge-warning' : 'badge-success'
      };
      
      // Update currentAgent if it's the same one
      if (currentAgent && currentAgent.id === agentId) {
        setCurrentAgent(updatedAgent);
      }
      
      return {
        ...prev,
        [agentId]: updatedAgent
      };
    });
  }, [currentAgent]);

  const value: AppContextValue = {
    // Agents
    agents,
    currentAgent,
    openAgents,
    selectAgent,
    goToAgent,
    closeAgentNav,
    addAgent,
    updateAgent,
    toggleAgentPublish,
    
    // Toast
    toast,
    showToast,
    
    // Modal
    isCreateModalOpen,
    setIsCreateModalOpen,

    // AI engines
    aiEngines,
    addAiEngine,
    updateAiEngine,
    removeAiEngine,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
