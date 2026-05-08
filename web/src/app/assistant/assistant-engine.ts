import type {
  AssistantAction,
  AssistantEngineInput,
  AssistantEngineOutput,
} from './assistant-types';

function nextActionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildAction(
  type: AssistantAction['type'],
  label: string,
  payload?: AssistantAction['payload']
): AssistantAction {
  return {
    id: nextActionId(type),
    type,
    label,
    payload,
    status: 'pending',
  };
}

function isQuickChangePrompt(prompt: string) {
  const normalized = prompt.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const hasQuickKeyword = (
    normalized.includes('text') ||
    normalized.includes('copy') ||
    normalized.includes('label') ||
    normalized.includes('title') ||
    normalized.includes('rename') ||
    normalized.includes('icon') ||
    normalized.includes('glyph') ||
    normalized.includes('error state') ||
    normalized.includes('invalid') ||
    normalized.includes('validation') ||
    (normalized.includes('error') && normalized.includes('input'))
  );

  return hasQuickKeyword && tokenCount <= 28;
}

/** User likely wants a code/Codex change, not only toolbar actions. */
function looksLikeCodeChangeIntent(prompt: string): boolean {
  const n = prompt.toLowerCase();
  if (/\b(this|the)\s+screen\b/.test(n)) return true;
  if (/\bmove\b/.test(n) && /\b(component|top|bottom|button|field)\b/.test(n)) return true;
  if (/\b(make|create)\s+a\s+new\s+version\s+of\b/.test(n)) return true;
  return /\b(codex|codebase|implement|refactor|tsx|jsx|css|file|layout|patch)\b/.test(n);
}

function buildUiToolbarActions(prompt: string): AssistantAction[] {
  const n = prompt.toLowerCase();
  const actions: AssistantAction[] = [];

  const renameMatch = prompt.match(/\brename\s+(v\d+)\s+to\s+(.+?)\s*\.?\s*$/i);
  if (renameMatch) {
    actions.push(
      buildAction('renameUiVersion', `Rename ${renameMatch[1]} to ${renameMatch[2].trim()}`, {
        uiVersionLabel: renameMatch[1].toLowerCase(),
        uiRenameTo: renameMatch[2].trim(),
      })
    );
    return actions;
  }

  const explicitAddV = prompt.match(/\badd\s+(v\d+)\b/i);
  if (
    /\b(new|add|create|duplicate)\s+(a\s+)?version\b/.test(n) ||
    explicitAddV ||
    /\bnew\s+version\b/.test(n)
  ) {
    actions.push(
      buildAction(
        'addUiVersion',
        explicitAddV ? `Add ${explicitAddV[1]}` : 'Add UI version',
        explicitAddV ? { uiVersionLabel: explicitAddV[1].toLowerCase() } : undefined
      )
    );
  }

  const versionSwitch = prompt.match(/\b(switch|show|go|open|use)\s+(to\s+)?(v\d+)\b/i);
  if (versionSwitch && /\b(switch|show|go to|open|use)\b/.test(n)) {
    const v = versionSwitch[3].toLowerCase();
    actions.push(buildAction('setActiveUiVersion', `Switch to ${v}`, { uiVersionLabel: v }));
  }

  const addErrorsState =
    (/\b(add|new|create)\b/.test(n) && /\berrors?\b/.test(n) && /\bstate\b/.test(n)) ||
    /\berrors?\s+state\b/.test(n) ||
    /\bshow\s+(all\s+)?fields?\s+with\s+errors?\b/.test(n) ||
    /\badd\s+a\s+new\s+state\s+(called\s+)?errors?\b/i.test(prompt);

  if (addErrorsState) {
    actions.push(buildAction('addUiState', 'Add Errors state', { uiStateLabel: 'Errors' }));
  }

  if (
    /\b(switch|show|go to)\s+(to\s+)?errors?\b/.test(n) &&
    !/\bversion\b/.test(n)
  ) {
    actions.push(buildAction('setActiveUiState', 'Show Errors state', { uiStateLabel: 'Errors' }));
  }

  if (/\b(switch|show|go to)\s+(to\s+)?(the\s+)?default\b/.test(n)) {
    actions.push(buildAction('setActiveUiState', 'Switch to Default state', { uiStateLabel: 'Default' }));
  }

  return actions;
}

function buildAgentActions(
  prompt: string,
  hoveredElement: AssistantEngineInput['hoveredElement']
): AssistantAction[] {
  const normalized = prompt.toLowerCase();
  const quickMode = isQuickChangePrompt(prompt);
  const actions: AssistantAction[] = [
    buildAction('applyCodexPatch', quickMode ? 'Apply quick code edit with Codex' : 'Apply change in codebase with Codex', {
      codexPrompt: prompt,
      targetElement: hoveredElement ?? undefined,
      executionMode: quickMode ? 'quick' : 'full',
    }),
  ];

  if (normalized.includes('theme') || normalized.includes('dark mode')) {
    actions.push(buildAction('toggleTheme', 'Toggle theme mode'));
  }
  if (normalized.includes('project') || normalized.includes('app launcher')) {
    actions.push(buildAction('openProjectMenu', 'Open project menu'));
  }
  if (normalized.includes('close menu')) {
    actions.push(buildAction('closeProjectMenu', 'Close project menu'));
  }
  if (normalized.includes('scroll') || normalized.includes('focus')) {
    actions.push(buildAction('scrollToElement', 'Scroll to selected element'));
  }
  if (normalized.includes('copy')) {
    actions.push(buildAction('copySuggestion', 'Copy suggested text', {
      textToCopy: 'Suggested update: simplify this section and keep one primary action visible.',
    }));
  }

  return actions;
}

export function generateAssistantResponse({
  prompt,
  targetScope,
  hoveredElement,
}: AssistantEngineInput): AssistantEngineOutput {
  const contextSnippet = targetScope === 'global'
    ? 'Scope: Global page.'
    : hoveredElement
      ? `Scope: Element. Target: <${hoveredElement.tagName.toLowerCase()}> ${hoveredElement.className || '(no classes)'}.`
      : 'Scope: Element. No UI element selected yet.';

  const uiActions = buildUiToolbarActions(prompt);
  const codeIntent = looksLikeCodeChangeIntent(prompt);

  let actions: AssistantAction[];
  if (uiActions.length > 0 && !codeIntent) {
    actions = uiActions;
  } else if (uiActions.length > 0) {
    actions = [...uiActions, ...buildAgentActions(prompt, hoveredElement)];
  } else {
    actions = buildAgentActions(prompt, hoveredElement);
  }

  const content = `Assistant ready. ${contextSnippet} I prepared executable actions and started running them right away.`;

  return {
    content,
    actions,
  };
}
