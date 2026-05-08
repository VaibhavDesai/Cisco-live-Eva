import { useEffect, useMemo, useRef, useState } from 'react';
import { useCoBuilder } from '../CoBuilderContext';
import { useStatesVersions } from '../StatesVersionsContext';
import { createPortal } from 'react-dom';
import { Button, Chip, Text, Textarea } from '@momentum-design/components/react';
import { requestCodexEdit } from './assistant-api';
import { generateAssistantResponse } from './assistant-engine';
import type {
  AssistantAction,
  AssistantMessage,
  AssistantTargetScope,
  HoveredElementContext,
} from './assistant-types';
import type { CodexEditResponse } from './assistant-api';

function nextMessageId(role: AssistantMessage['role']) {
  return `${role}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getElementContext(element: HTMLElement): HoveredElementContext {
  const rect = element.getBoundingClientRect();
  const textSnippet = (element.textContent ?? '').trim().slice(0, 140);
  return {
    tagName: element.tagName,
    className: element.className || '',
    textSnippet,
    ariaLabel: element.getAttribute('aria-label') ?? '',
    inputLabel: element.getAttribute('label') ?? '',
    inputPlaceholder: element.getAttribute('placeholder') ?? '',
    elementId: element.getAttribute('id') ?? '',
    elementName: element.getAttribute('name') ?? '',
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

function formatFiles(filesChanged: string[]) {
  if (!filesChanged.length) {
    return 'none';
  }
  if (filesChanged.length <= 4) {
    return filesChanged.join(', ');
  }
  return `${filesChanged.slice(0, 4).join(', ')}, +${filesChanged.length - 4} more`;
}

function formatDiffPreview(diff: string) {
  if (!diff.trim()) {
    return 'No textual diff was returned.';
  }

  const preview = diff.split('\n').slice(0, 24).join('\n');
  return `Diff preview:\n${preview}${diff.split('\n').length > 24 ? '\n...diff preview truncated' : ''}`;
}

function formatCodexSummary(response: CodexEditResponse) {
  const warnings = response.warnings.length
    ? `\nWarnings:\n- ${response.warnings.join('\n- ')}`
    : '';

  return [
    `Codex run complete. Changed files: ${formatFiles(response.filesChanged)}`,
    response.lastMessage ? `Agent note: ${response.lastMessage}` : '',
    formatDiffPreview(response.diff),
    warnings,
  ].filter(Boolean).join('\n\n');
}

function formatElementSelector(context: HoveredElementContext | null) {
  if (!context) {
    return 'None selected';
  }

  if (context.elementId) {
    return `#${context.elementId}`;
  }

  const firstClass = context.className.trim().split(/\s+/).find(Boolean);
  if (firstClass) {
    return `.${firstClass}`;
  }

  return context.tagName.toLowerCase();
}

type OverlayRect = { top: number; left: number; width: number; height: number };

function isPointInsideRect(x: number, y: number, rect: OverlayRect | null) {
  if (!rect) {
    return false;
  }
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

function getAnchorPoint(rect: OverlayRect, blocker: OverlayRect | null) {
  const candidates = [
    { left: rect.left + 12, top: rect.top + 12 },
    { left: rect.left + 12, top: rect.top + rect.height - 12 },
    { left: rect.left + rect.width - 12, top: rect.top + 12 },
    { left: rect.left + rect.width - 12, top: rect.top + rect.height - 12 },
  ];
  const visible = candidates.find((point) => !isPointInsideRect(point.left, point.top, blocker));
  return visible ?? candidates[0];
}

export function AssistantWidget() {
  const { coBuilderEnabled } = useCoBuilder();
  const {
    versions,
    states,
    addVersion,
    renameVersion,
    setActiveVersionId,
    addState,
    renameState,
    setActiveStateId,
  } = useStatesVersions();
  const [isOpen, setIsOpen] = useState(false);
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: nextMessageId('assistant'),
      role: 'assistant',
      content: 'Assistant ready. Choose Global for page-wide changes or Element to target a specific element.',
    },
  ]);
  const [targetScope, setTargetScope] = useState<AssistantTargetScope>('global');
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HoveredElementContext | null>(null);
  const [selectedElement, setSelectedElement] = useState<HoveredElementContext | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [widgetOffset, setWidgetOffset] = useState({ x: 0, y: 0 });
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);

  const selectedElementRef = useRef<HTMLElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const widgetRootRef = useRef<HTMLDivElement | null>(null);
  const widgetDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const targetContext = useMemo(
    () => (targetScope === 'element' ? (selectedElement ?? hoveredElement) : null),
    [targetScope, selectedElement, hoveredElement]
  );
  const modalRect = useMemo(() => {
    if (!isOpen) {
      return null;
    }
    const modal = widgetRootRef.current?.querySelector('.assistant-modal') as HTMLElement | null;
    if (!modal) {
      return null;
    }
    const rect = modal.getBoundingClientRect();
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }, [isOpen, widgetOffset.x, widgetOffset.y, isPickingElement, selectedElement, hoveredElement]);
  const showSelectedOverlay = targetScope === 'element' && !!selectedElement;
  const showHoverOverlay = isPickingElement && !!hoveredElement;
  const hasSelectedModalIntersection = !!(selectedElement && modalRect)
    && !(
      selectedElement.rect.left + selectedElement.rect.width <= modalRect.left
      || modalRect.left + modalRect.width <= selectedElement.rect.left
      || selectedElement.rect.top + selectedElement.rect.height <= modalRect.top
      || modalRect.top + modalRect.height <= selectedElement.rect.top
    );
  const hasHoverModalIntersection = !!(hoveredElement && modalRect)
    && !(
      hoveredElement.rect.left + hoveredElement.rect.width <= modalRect.left
      || modalRect.left + modalRect.width <= hoveredElement.rect.left
      || hoveredElement.rect.top + hoveredElement.rect.height <= modalRect.top
      || modalRect.top + modalRect.height <= hoveredElement.rect.top
    );
  const selectedOverlayMode = hasSelectedModalIntersection ? 'anchor' : 'full';
  const hoverOverlayMode = hasHoverModalIntersection ? 'anchor' : 'full';
  const selectedAnchorPoint = selectedElement ? getAnchorPoint(selectedElement.rect, modalRect) : null;
  const hoverAnchorPoint = hoveredElement ? getAnchorPoint(hoveredElement.rect, modalRect) : null;

  function switchToGlobalScope() {
    setTargetScope('global');
    setIsPickingElement(false);
    setHoveredElement(null);
    setSelectedElement(null);
    selectedElementRef.current = null;
  }

  function switchToElementScope() {
    setTargetScope('element');
    setSelectedElement(null);
    setHoveredElement(null);
    selectedElementRef.current = null;
    setIsPickingElement(true);
  }

  function closeAssistant() {
    setIsOpen(false);
    setIsPickingElement(false);
    setHoveredElement(null);
  }

  function isEventFromWidget(event: Event, target: EventTarget | null) {
    const widgetRoot = widgetRootRef.current;
    if (!widgetRoot) {
      return false;
    }

    if (target instanceof Node && widgetRoot.contains(target)) {
      return true;
    }

    const eventPath = event.composedPath();
    return eventPath.includes(widgetRoot);
  }

  useEffect(() => {
    if (!isPickingElement || !isOpen) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (isEventFromWidget(event, target)) {
        return;
      }

      selectedElementRef.current = target;
      setHoveredElement(getElementContext(target));
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target || isEventFromWidget(event, target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement(getElementContext(target));
    }

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isPickingElement, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAssistant();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!highlightRef.current || !isPickingElement || !hoveredElement) {
      return;
    }

    const node = highlightRef.current;
    node.style.setProperty('--assistant-highlight-top', `${hoveredElement.rect.top}px`);
    node.style.setProperty('--assistant-highlight-left', `${hoveredElement.rect.left}px`);
    node.style.setProperty('--assistant-highlight-width', `${hoveredElement.rect.width}px`);
    node.style.setProperty('--assistant-highlight-height', `${hoveredElement.rect.height}px`);
  }, [hoveredElement, isPickingElement]);

  useEffect(() => {
    if (!isDraggingWidget) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const dragStart = widgetDragStartRef.current;
      if (!dragStart || event.pointerId !== dragStart.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragStart.startX;
      const deltaY = event.clientY - dragStart.startY;
      setWidgetOffset({
        x: dragStart.originX + deltaX,
        y: dragStart.originY + deltaY,
      });
    }

    function handlePointerUp(event: PointerEvent) {
      const dragStart = widgetDragStartRef.current;
      if (!dragStart || event.pointerId !== dragStart.pointerId) {
        return;
      }
      widgetDragStartRef.current = null;
      setIsDraggingWidget(false);
    }

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingWidget]);

  function startWidgetDrag(event: React.PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('mdc-button,button')) {
      return;
    }

    widgetDragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: widgetOffset.x,
      originY: widgetOffset.y,
    };
    setIsDraggingWidget(true);
  }

  function updateActionInMessages(actionId: string, updater: (action: AssistantAction) => AssistantAction) {
    setMessages((current) => current.map((message) => {
      if (!message.actions) {
        return message;
      }
      return {
        ...message,
        actions: message.actions.map((action) => (action.id === actionId ? updater(action) : action)),
      };
    }));
  }

  async function executeAction(action: AssistantAction): Promise<string> {
    switch (action.type) {
      case 'toggleTheme': {
        const toggle = document.querySelector('mdc-toggle[aria-label="Toggle dark mode"]') as HTMLElement | null;
        if (!toggle) {
          throw new Error('Theme toggle not found.');
        }
        toggle.click();
        return 'Theme toggled.';
      }
      case 'openProjectMenu': {
        const launcher = document.querySelector('mdc-button[aria-label="App launcher"]') as HTMLElement | null;
        if (!launcher) {
          throw new Error('App launcher button not found.');
        }
        launcher.click();
        return 'Project menu opened.';
      }
      case 'closeProjectMenu': {
        const launcher = document.querySelector('mdc-button[aria-label="App launcher"]') as HTMLElement | null;
        if (!launcher) {
          throw new Error('App launcher button not found.');
        }
        launcher.click();
        return 'Project menu toggled closed.';
      }
      case 'scrollToElement': {
        if (!selectedElementRef.current) {
          throw new Error('No selected element to scroll to.');
        }
        selectedElementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return 'Scrolled to selected element.';
      }
      case 'copySuggestion': {
        const text = action.payload?.textToCopy ?? 'Suggested update generated.';
        if (!navigator.clipboard) {
          throw new Error('Clipboard API is not available in this browser context.');
        }
        await navigator.clipboard.writeText(text);
        return 'Suggestion copied to clipboard.';
      }
      case 'applyCodexPatch': {
        const codexPrompt = action.payload?.codexPrompt?.trim();
        if (!codexPrompt) {
          throw new Error('Missing Codex prompt in assistant action payload.');
        }

        const codexResponse = await requestCodexEdit({
          prompt: codexPrompt,
          selectedElement: action.payload?.targetElement,
          executionMode: action.payload?.executionMode,
        });
        return formatCodexSummary(codexResponse);
      }
      case 'addUiVersion': {
        const label = action.payload?.uiVersionLabel?.trim();
        addVersion(label || undefined);
        return label ? `Added version ${label}.` : 'Added new version.';
      }
      case 'setActiveUiVersion': {
        const raw = action.payload?.uiVersionLabel?.trim().toLowerCase() ?? '';
        if (!raw) {
          throw new Error('Missing version label.');
        }
        const match = versions.find(
          (v) => v.id === raw || v.label.trim().toLowerCase() === raw
        );
        if (!match) {
          throw new Error(`No version matching "${raw}". Add it first or check the label.`);
        }
        setActiveVersionId(match.id);
        return `Active version: ${match.label}.`;
      }
      case 'renameUiVersion': {
        const from = action.payload?.uiVersionLabel?.trim().toLowerCase() ?? '';
        const to = action.payload?.uiRenameTo?.trim() ?? '';
        if (!from || !to) {
          throw new Error('Rename requires a version and new name.');
        }
        const match = versions.find(
          (v) => v.id === from || v.label.trim().toLowerCase() === from
        );
        if (!match) {
          throw new Error(`No version matching "${from}".`);
        }
        renameVersion(match.id, to);
        return `Renamed to ${to}.`;
      }
      case 'addUiState': {
        const label = action.payload?.uiStateLabel?.trim() ?? 'Errors';
        addState(label);
        return `Added state ${label}.`;
      }
      case 'setActiveUiState': {
        const raw = action.payload?.uiStateLabel?.trim().toLowerCase() ?? '';
        if (!raw) {
          throw new Error('Missing state label.');
        }
        const match = states.find(
          (s) => s.id === raw || s.label.trim().toLowerCase() === raw
        );
        if (!match) {
          throw new Error(`No state matching "${raw}". Add it first or check the label.`);
        }
        setActiveStateId(match.id);
        return `Active state: ${match.label}.`;
      }
      case 'renameUiState': {
        const from = action.payload?.uiStateLabel?.trim().toLowerCase() ?? '';
        const to = action.payload?.uiRenameTo?.trim() ?? '';
        if (!from || !to) {
          throw new Error('Rename requires a state and new name.');
        }
        const match = states.find(
          (s) => s.id === from || s.label.trim().toLowerCase() === from
        );
        if (!match) {
          throw new Error(`No state matching "${from}".`);
        }
        renameState(match.id, to);
        return `Renamed state to ${to}.`;
      }
      default:
        return 'No operation.';
    }
  }

  async function executeActionsImmediately(actions: AssistantAction[]) {
    if (!actions.length) {
      return;
    }

    setIsExecutingAction(true);
    try {
      for (const action of actions) {
        updateActionInMessages(action.id, (current) => ({ ...current, status: 'approved' }));
        try {
          const resultMessage = await executeAction(action);
          updateActionInMessages(action.id, (current) => ({
            ...current,
            status: 'completed',
            resultMessage,
          }));
          setMessages((current) => [...current, {
            id: nextMessageId('system'),
            role: 'system',
            content: `Action completed: ${action.label}`,
          }]);
        } catch (error) {
          const resultMessage = error instanceof Error ? error.message : 'Action failed.';
          updateActionInMessages(action.id, (current) => ({
            ...current,
            status: 'failed',
            resultMessage,
          }));
          setMessages((current) => [...current, {
            id: nextMessageId('system'),
            role: 'system',
            content: `Action failed: ${action.label}. ${resultMessage}`,
          }]);
        }
      }
    } finally {
      setIsExecutingAction(false);
    }
  }

  function submitPrompt() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: nextMessageId('user'),
      role: 'user',
      content: trimmed,
    };
    const response = generateAssistantResponse({
      prompt: trimmed,
      targetScope,
      hoveredElement: targetScope === 'element' ? targetContext : null,
    });

    const assistantMessage: AssistantMessage = {
      id: nextMessageId('assistant'),
      role: 'assistant',
      content: response.content,
      actions: response.actions,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setPrompt('');
    void executeActionsImmediately(response.actions);
  }

  function handleComposerKeyDown(event: React.KeyboardEvent) {
    const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };
    if (nativeEvent.isComposing) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  }

  if (!coBuilderEnabled) {
    return null;
  }

  return (
    <>
      {showSelectedOverlay && selectedElement && typeof document !== 'undefined'
        ? createPortal(
          selectedOverlayMode === 'full' ? (
            <div
              className="assistant-selected-highlight"
              style={{
                top: `${selectedElement.rect.top}px`,
                left: `${selectedElement.rect.left}px`,
                width: `${selectedElement.rect.width}px`,
                height: `${selectedElement.rect.height}px`,
              }}
            />
          ) : (
            <div
              className="assistant-selected-anchor"
              style={{
                top: `${(selectedAnchorPoint?.top ?? selectedElement.rect.top) - 6}px`,
                left: `${(selectedAnchorPoint?.left ?? selectedElement.rect.left) - 6}px`,
              }}
            />
          ),
          document.body
        )
        : null}
      {showHoverOverlay && hoveredElement && typeof document !== 'undefined'
        ? createPortal(
          hoverOverlayMode === 'full' ? (
            <div ref={highlightRef} className="assistant-hover-highlight" />
          ) : (
            <div
              className="assistant-hover-anchor"
              style={{
                top: `${(hoverAnchorPoint?.top ?? hoveredElement.rect.top) - 6}px`,
                left: `${(hoverAnchorPoint?.left ?? hoveredElement.rect.left) - 6}px`,
              }}
            />
          ),
          document.body
        )
        : null}
      <div
      ref={widgetRootRef}
      className={`assistant-widget-root assistant-zg ${widgetTheme === 'dark' ? 'assistant-zg-dark' : 'assistant-zg-light'} ${isDraggingWidget ? 'assistant-widget-dragging' : ''} ${isPickingElement ? 'assistant-widget-picking' : ''}`}
      style={{ transform: `translate(${widgetOffset.x}px, ${widgetOffset.y}px)` }}
    >
      {isOpen ? (
        <section className="assistant-modal assistant-zg-modal" role="dialog" aria-modal="true" aria-label="CCD Co-Builder">
          <header className="assistant-modal-header assistant-zg-header" onPointerDown={startWidgetDrag}>
            <h2 className="assistant-modal-title">CCD Co-Builder</h2>
            <div className="assistant-zg-header-actions">
              <Button
                color="default"
                variant="secondary"
                size={32}
                onClick={() => setWidgetTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              >
                {widgetTheme === 'light' ? 'Dark mode' : 'Light mode'}
              </Button>
              <Button color="default" variant="secondary" size={32} onClick={closeAssistant}>
                Close
              </Button>
            </div>
          </header>

          <div className="assistant-target-row assistant-zg-target-row">
            {targetScope === 'element' ? (
              <Text type="body-small-regular" className="assistant-selected-element-label">
                Selected: {formatElementSelector(selectedElement)}
              </Text>
            ) : null}
            <div className="assistant-scope-toggle" role="group" aria-label="Assistant change scope">
              <Button
                color={targetScope === 'global' ? 'accent' : 'default'}
                variant={targetScope === 'global' ? 'primary' : 'secondary'}
                size={32}
                disabled={isExecutingAction}
                onClick={switchToGlobalScope}
              >
                Global
              </Button>
              <Button
                color={targetScope === 'element' ? 'accent' : 'default'}
                variant={targetScope === 'element' ? 'primary' : 'secondary'}
                size={32}
                disabled={isExecutingAction}
                onClick={switchToElementScope}
              >
                Element
              </Button>
            </div>
            {targetScope === 'global' ? (
              <Text type="body-small-regular" className="text-secondary">
                Scope: Global page.
              </Text>
            ) : targetContext ? (
              <Text type="body-small-regular" className="text-secondary">
                Target: {targetContext.tagName.toLowerCase()} {targetContext.className ? `• ${targetContext.className}` : ''}
              </Text>
            ) : (
              <Text type="body-small-regular" className="text-secondary">
                Scope: Element. Hover and click to select a target element.
              </Text>
            )}
            {isExecutingAction ? (
              <div className="assistant-processing-banner assistant-zg-status-row" role="status" aria-live="polite">
                <span className="assistant-spinner" aria-hidden="true" />
                <Text type="body-small-regular" className="text-secondary">
                  Processing actions...
                </Text>
              </div>
            ) : null}
          </div>

          <div className="assistant-messages assistant-zg-timeline">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-message assistant-zg-message assistant-message-${message.role}`}>
                <p className="assistant-message-content">{message.content}</p>

                {message.actions?.length ? (
                  <div className="assistant-action-list">
                    {message.actions.map((action) => (
                      <div key={action.id} className="assistant-action-card assistant-zg-action-card">
                        <Chip label={action.label} />
                        <Text type="body-small-regular" className="text-secondary">
                          Status: {action.status}
                        </Text>
                        {isExecutingAction && action.status === 'approved' ? (
                          <div className="assistant-action-processing" role="status" aria-live="polite">
                            <span className="assistant-spinner" aria-hidden="true" />
                            <Text type="body-small-regular" className="text-secondary">
                              Running now...
                            </Text>
                          </div>
                        ) : null}
                        {action.resultMessage ? (
                          <Text type="body-small-regular" className="text-secondary assistant-action-result">{action.resultMessage}</Text>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <footer className="assistant-composer assistant-zg-composer">
            <Textarea
              label="Ask assistant"
              rows={3}
              value={prompt}
              placeholder="Ask for approved UI actions"
              onInput={(event) => setPrompt((event.target as { value: string }).value)}
              onKeyDown={handleComposerKeyDown}
            />
            <div className="assistant-composer-actions">
              <Button
                color="accent"
                variant="primary"
                size={32}
                onClick={submitPrompt}
                disabled={!prompt.trim() || isExecutingAction}
              >
                Send
              </Button>
            </div>
          </footer>
        </section>
      ) : (
        <Button
          className="assistant-fab"
          color="accent"
          variant="primary"
          size={32}
          onClick={() => setIsOpen(true)}
        >
          CCD Co-Builder
        </Button>
      )}
      </div>
    </>
  );
}
