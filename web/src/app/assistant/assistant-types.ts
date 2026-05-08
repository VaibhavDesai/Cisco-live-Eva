export type AssistantActionType =
  | 'toggleTheme'
  | 'openProjectMenu'
  | 'closeProjectMenu'
  | 'scrollToElement'
  | 'copySuggestion'
  | 'applyCodexPatch'
  | 'addUiVersion'
  | 'setActiveUiVersion'
  | 'renameUiVersion'
  | 'addUiState'
  | 'setActiveUiState'
  | 'renameUiState';

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
export type AssistantExecutionMode = 'quick' | 'full';
export type AssistantTargetScope = 'global' | 'element';

export type HoveredElementContext = {
  tagName: string;
  className: string;
  textSnippet: string;
  ariaLabel: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  elementId?: string;
  elementName?: string;
  rect: { top: number; left: number; width: number; height: number };
};

export type AssistantActionPayload = {
  textToCopy?: string;
  codexPrompt?: string;
  targetElement?: HoveredElementContext;
  executionMode?: AssistantExecutionMode;
  /** Version label (e.g. v2) or id slug */
  uiVersionLabel?: string;
  uiStateLabel?: string;
  uiRenameTo?: string;
};

export type AssistantAction = {
  id: string;
  type: AssistantActionType;
  label: string;
  payload?: AssistantActionPayload;
  status: ActionStatus;
  resultMessage?: string;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: AssistantAction[];
};

export type AssistantEngineInput = {
  prompt: string;
  targetScope: AssistantTargetScope;
  hoveredElement?: HoveredElementContext | null;
};

export type AssistantEngineOutput = {
  content: string;
  actions: AssistantAction[];
};
