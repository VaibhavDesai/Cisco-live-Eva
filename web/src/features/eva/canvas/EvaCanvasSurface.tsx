import { useEffect, useMemo, useRef, useState } from 'react';
import { AiFooter, AiResponseMessage, AiUserMessage, Badge, Button, Card, CardBody, CardHeader, CardTitle, Dropdown, Tab, Tabs } from '../../../components/shared';
import { Icon } from '../../../icons';
import { sendEvaChat } from '../../../api/ciscoAi';
import type { EvaCanvasConnection, EvaCanvasNode } from '../types';
import {
  EVA_CANVAS_NODE_TYPES,
  EVA_CANVAS_TRIAGE_EXAMPLE_CONNECTIONS,
  EVA_CANVAS_TRIAGE_EXAMPLE_NODES,
  EVA_CANVAS_TRIAGE_EXAMPLE_PROMPT,
  initialEvaCanvasConnections,
  initialEvaCanvasNodes,
  isEvaConnectionCompatible,
  snapToEvaCanvasGrid,
} from './evaCanvasData';
import EvaFlowBox, { getEvaFlowBoxSize } from './EvaFlowBox';

type Side = EvaCanvasConnection['fromSide'];

/* SessionStorage key for the canvas. Kept distinct from the chat/form
   builder key (`eva-agents-session-state`) so that toggling the design
   variation or restarting the chat thread doesn't blow away the canvas
   layout, and vice versa. The user can round-trip Chat ↔ Canvas without
   either side losing state. */
const EVA_CANVAS_SESSION_STORAGE_KEY = 'eva-canvas-session-state';

type CanvasEvaMessage = {
  role: 'user' | 'assistant';
  text: string;
};

/* Per-tab snapshot of every piece of canvas state that should be restored
   when switching tabs. The tab strip lets a single canvas surface host
   multiple side-by-side scenarios (e.g. the user's working canvas plus a
   freshly-generated "Triage example") without the layouts contaminating
   each other. */
type CanvasTabSnapshot = {
  nodes: EvaCanvasNode[];
  connections: EvaCanvasConnection[];
  selectedNodeId: string;
  formData: Record<string, string>;
  pan: { x: number; y: number };
  zoom: number;
};

type CanvasTab = {
  id: string;
  label: string;
  /* `snapshot` is the cached state for tabs that AREN'T currently active.
     The active tab's data lives in the top-level state slices below; on
     switch we copy current → outgoing tab's snapshot and load incoming
     tab's snapshot back into the working state. */
  snapshot?: CanvasTabSnapshot;
  /* Closeable tabs render an inline "x"; the default canvas is locked so
     the user always has a home base. */
  closable?: boolean;
};

const MAIN_TAB_ID = 'main';

/* System prompt for the Cisco LLM when the user is chatting with Eva
   inside the canvas. Anchors replies to the visual orchestration model
   (nodes, connections, delegate routing) AND lets Eva mutate the canvas
   directly by emitting fenced JSON action blocks (parsed and executed
   in `handleCanvasEvaSend`). The current canvas state is appended at
   request time by `buildCanvasEvaSystemPrompt` so Eva can reference
   real node IDs when emitting `add_node`/`connect` actions. */
const CANVAS_EVA_SYSTEM_PROMPT_BASE = `You are Eva, embedded inside the Webex AI Agent Studio canvas — a visual multi-agent orchestration map. The user is editing a canvas of nodes connected by labeled edges.

Node types and what they mean:
- agent: a conversational specialist (lead or secondary).
- knowledge: a knowledge base that grounds an agent.
- mcp (action): a tool / integration the agent can invoke.
- decision (delegate): routes a conversation to a specialist agent.
- voice: voice / DTMF configuration.
- language: localization config.
- exit: end-of-conversation handoff (summary, survey).
- metrics: success and quality signals.

Compatibility rules: agents connect to anything; capability nodes (knowledge, language, mcp, voice, exit) only attach to an agent; decision (delegate) connects to agents and metrics.

Guidelines:
- Keep natural-language replies to 1–3 sentences. Be specific.
- If the user asks how to draw a connection by hand, mention dragging from a blue dot on one node to a blue dot on another (green = compatible target).
- Stay in scope: design feedback for this canvas. Politely redirect off-topic asks.

ACTION PROTOCOL — when the user asks you to ADD a node, CONNECT nodes, or otherwise modify the canvas, you MUST execute the change by emitting a fenced JSON block (starting with three backticks and the word \`json\`). Format:

\`\`\`json
{"actions":[
  {"type":"add_node","nodeType":"knowledge","title":"Compliance KB","description":"Policy and risk reference","linkToNodeId":"agent-1"},
  {"type":"connect","fromNodeId":"agent-1","toNodeId":"agent-1234567","label":"escalates to"}
]}
\`\`\`

Action shapes:
- \`add_node\`: { type:"add_node", nodeType: one of [agent,knowledge,mcp,decision,voice,language,exit,metrics], title: short string, description?: optional string, linkToNodeId?: id of an existing node to attach the new node to (omit only if the new node is meant to stand alone) }
- \`connect\`: { type:"connect", fromNodeId, toNodeId, label?: short edge label }

Rules for using actions:
- Always use IDs from the CURRENT CANVAS STATE block below — never invent IDs.
- For "add a knowledge base / action / voice / exit" implicitly attached to "the agent", default \`linkToNodeId\` to the lead agent (the first node of type=agent in the canvas).
- For "add a specialist for X", pick \`nodeType:"agent"\` and link it via a delegate if one already exists, otherwise link directly to the lead agent.
- Respect compatibility rules; if an attempted connection is not compatible, omit it and explain in the reply.
- Place the JSON block at the START of your reply, then add 1–2 sentences of natural-language summary AFTER the closing fence. Only the text outside the fence is shown to the user.
- If the user is just asking a question (no add/connect intent), do NOT emit an actions block — just answer.`;

function buildCanvasEvaSystemPrompt(args: {
  nodes: EvaCanvasNode[];
  connections: EvaCanvasConnection[];
  selectedNodeId: string;
}): string {
  const nodesSummary = args.nodes.length
    ? args.nodes
        .map(n => `- id="${n.id}" type=${n.type} title="${n.title}"`)
        .join('\n')
    : '(canvas is empty)';
  const connectionsSummary = args.connections.length
    ? args.connections
        .map(c => `- ${c.from} -> ${c.to}${c.label ? ` (label: "${c.label}")` : ''}`)
        .join('\n')
    : '(no connections yet)';
  return `${CANVAS_EVA_SYSTEM_PROMPT_BASE}

CURRENT CANVAS STATE — use these exact node IDs in any action:
Nodes:
${nodesSummary}

Connections:
${connectionsSummary}

Selected node id: ${args.selectedNodeId}`;
}

/* Action protocol shared with the LLM — see CANVAS_EVA_SYSTEM_PROMPT_BASE. */
type CanvasAction =
  | {
      type: 'add_node';
      nodeType: EvaCanvasNode['type'];
      title?: string;
      description?: string;
      linkToNodeId?: string;
    }
  | { type: 'connect'; fromNodeId: string; toNodeId: string; label?: string };

const VALID_NODE_TYPES: ReadonlyArray<EvaCanvasNode['type']> = [
  'agent',
  'knowledge',
  'mcp',
  'decision',
  'voice',
  'language',
  'exit',
  'metrics',
];

function isValidCanvasAction(value: unknown): value is CanvasAction {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (obj.type === 'add_node') {
    return (
      typeof obj.nodeType === 'string' &&
      VALID_NODE_TYPES.includes(obj.nodeType as EvaCanvasNode['type'])
    );
  }
  if (obj.type === 'connect') {
    return typeof obj.fromNodeId === 'string' && typeof obj.toNodeId === 'string';
  }
  return false;
}

/* Strips a fenced JSON action block out of the LLM reply, returning
   any parsed actions and the human-readable text that should be shown
   in the chat thread. The fence regex is forgiving — matches both
   ```json and just ``` so a slightly malformed reply still parses. */
function parseCanvasReply(reply: string): { actions: CanvasAction[]; displayText: string } {
  const fenceRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const match = reply.match(fenceRegex);
  if (!match) {
    return { actions: [], displayText: reply.trim() };
  }
  let actions: CanvasAction[] = [];
  try {
    const parsed = JSON.parse(match[1].trim()) as { actions?: unknown };
    if (Array.isArray(parsed?.actions)) {
      actions = (parsed.actions as unknown[]).filter(isValidCanvasAction);
    }
  } catch {
    // Bad JSON — fall through with an empty action list. The LLM's
    // surrounding prose still renders so the user knows something
    // about the request was understood.
  }
  const displayText = reply.replace(match[0], '').trim();
  return {
    actions,
    displayText:
      displayText ||
      (actions.length > 0 ? 'Updated the canvas.' : 'Sorry, I couldn\u2019t produce a reply.'),
  };
}

type StoredCanvasState = {
  nodes: EvaCanvasNode[];
  connections: EvaCanvasConnection[];
  selectedNodeId: string;
  formData: Record<string, string>;
  zoom: number;
  pan: { x: number; y: number };
  compactMode: boolean;
  showJson: boolean;
  evaWindowCollapsed: boolean;
  canvasEvaMessages: CanvasEvaMessage[];
  tabs?: CanvasTab[];
  activeTabId?: string;
};

const readStoredCanvasState = (): StoredCanvasState | null => {
  try {
    const raw = window.sessionStorage.getItem(EVA_CANVAS_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCanvasState) : null;
  } catch {
    return null;
  }
};

const addOptions = [
  { value: 'agent', label: 'Secondary agent' },
  { value: 'knowledge', label: 'Knowledge base' },
  { value: 'language', label: 'Language' },
  { value: 'mcp', label: 'Action' },
  { value: 'decision', label: 'Delegate' },
  { value: 'voice', label: 'Voice' },
  { value: 'exit', label: 'Exit' },
  { value: 'metrics', label: 'Metrics' },
];

function getConnectionPoint(node: EvaCanvasNode, side: Side, compact: boolean) {
  const size = getEvaFlowBoxSize(compact);
  if (side === 'left') return { x: node.x, y: node.y + size.height / 2 };
  if (side === 'right') return { x: node.x + size.width, y: node.y + size.height / 2 };
  if (side === 'top') return { x: node.x + size.width / 2, y: node.y };
  return { x: node.x + size.width / 2, y: node.y + size.height };
}

function getClosestSides(from: EvaCanvasNode, to: EvaCanvasNode): { fromSide: Side; toSide: Side } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { fromSide: 'right', toSide: 'left' } : { fromSide: 'left', toSide: 'right' };
  }
  return dy > 0 ? { fromSide: 'bottom', toSide: 'top' } : { fromSide: 'top', toSide: 'bottom' };
}

function getConnectionHandleAtPoint(clientX: number, clientY: number): { nodeId: string; side: Side } | null {
  const element = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-eva-connection-node-id][data-eva-connection-side]');
  const nodeId = element?.dataset.evaConnectionNodeId;
  const side = element?.dataset.evaConnectionSide;
  if (!nodeId || !side || !['left', 'right', 'top', 'bottom'].includes(side)) return null;
  return { nodeId, side: side as Side };
}

export default function EvaCanvasSurface({
  onBack,
  onNewThread,
}: {
  onBack: () => void;
  /* Optional — when provided, navigates back to chat AND requests a new
     thread there. Wired through the EvaCanvas page so the canvas itself
     stays unaware of how the chat view stores threads. */
  onNewThread?: () => void;
}) {
  /* Hydrate from sessionStorage on first render so a Chat ↔ Canvas round-trip
     restores the user's layout, zoom, pan, JSON pane, Eva window, and
     in-canvas chat exactly as they left it. The lookup is wrapped in a ref
     so it runs once even under StrictMode's double-invoke and never causes
     a re-render. */
  const restoredRef = useRef<StoredCanvasState | null>(null);
  if (restoredRef.current === null) {
    restoredRef.current = readStoredCanvasState();
  }
  const restored = restoredRef.current;

  const [nodes, setNodes] = useState<EvaCanvasNode[]>(restored?.nodes ?? initialEvaCanvasNodes);
  const [connections, setConnections] = useState<EvaCanvasConnection[]>(
    restored?.connections ?? initialEvaCanvasConnections,
  );
  const [selectedNodeId, setSelectedNodeId] = useState(restored?.selectedNodeId ?? 'agent-1');
  const [formData, setFormData] = useState<Record<string, string>>(restored?.formData ?? {});
  const [zoom, setZoom] = useState(restored?.zoom ?? 1);
  const [pan, setPan] = useState(restored?.pan ?? { x: 0, y: 0 });
  const [compactMode, setCompactMode] = useState(restored?.compactMode ?? false);
  const [showJson, setShowJson] = useState(restored?.showJson ?? false);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: Side } | null>(null);
  const [copied, setCopied] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pendingConnectionEnd, setPendingConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [evaWindowCollapsed, setEvaWindowCollapsed] = useState(restored?.evaWindowCollapsed ?? false);
  const [canvasEvaMessages, setCanvasEvaMessages] = useState<CanvasEvaMessage[]>(
    restored?.canvasEvaMessages ?? [
      {
        role: 'assistant',
        text: 'I can help adjust this orchestration map. Try asking me to add a specialist agent, connect two nodes, or summarize the flow.',
      },
    ],
  );
  /* "Thinking" state for the canvas mini-Eva. While true, AiFooter swaps
     its textarea for a processing indicator so the user can't fire a
     second request before the first one returns. Kept ephemeral (not in
     sessionStorage) so a refresh mid-flight doesn't leave the composer
     stuck in the disabled state. */
  const [canvasThinking, setCanvasThinking] = useState(false);

  /* Tab bookkeeping. The "main" tab is always present and uneraseable so
     users have a home base; example tabs (created from the Load example
     button) are closeable. The active tab's working state lives in the
     individual slices above (`nodes`, `connections`, …) and gets cached
     into `tabs[activeTabId].snapshot` whenever the user switches tabs. */
  const [tabs, setTabs] = useState<CanvasTab[]>(
    restored?.tabs ?? [{ id: MAIN_TAB_ID, label: 'Canvas' }],
  );
  const [activeTabId, setActiveTabId] = useState<string>(restored?.activeTabId ?? MAIN_TAB_ID);

  /* Prefill plumbing for the floating Eva composer. `examplePrimed`
     marks that the user pulled in the Triage example via the
     "Load example" button, so the very next send should spawn an example
     tab on the canvas. We bump `prefillKey` whenever we want AiFooter to
     replace its textarea contents — the AiFooter only acts on key changes
     so a user can keep editing the prefilled text without us constantly
     resetting it. */
  const [prefillText, setPrefillText] = useState('');
  const [prefillKey, setPrefillKey] = useState(0);
  const [examplePrimed, setExamplePrimed] = useState(false);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const connectingFromRef = useRef<{ nodeId: string; side: Side } | null>(null);

  /* Mirror every persistable state slice into sessionStorage on change so the
     canvas survives a navigate-away (e.g. clicking "Chat view" then coming
     back via the chat experience's "Canvas view" button). Transient
     drag/UI state — `connectingFrom`, `pendingConnectionEnd`, `panning`,
     `panStart`, `addValue`, `copied` — is intentionally excluded; it's
     ephemeral and would be confusing to restore mid-flight. */
  useEffect(() => {
    const snapshot: StoredCanvasState = {
      nodes,
      connections,
      selectedNodeId,
      formData,
      zoom,
      pan,
      compactMode,
      showJson,
      evaWindowCollapsed,
      canvasEvaMessages,
      tabs,
      activeTabId,
    };
    try {
      window.sessionStorage.setItem(
        EVA_CANVAS_SESSION_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch {
      // Storage failures (quota, private mode) shouldn't break the canvas.
    }
  }, [
    nodes,
    connections,
    selectedNodeId,
    formData,
    zoom,
    pan,
    compactMode,
    showJson,
    evaWindowCollapsed,
    canvasEvaMessages,
    tabs,
    activeTabId,
  ]);

  const clientPointToWorldPoint = (clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return {
      x: ((clientX - (rect?.left ?? 0)) - pan.x) / zoom,
      y: ((clientY - (rect?.top ?? 0)) - pan.y) / zoom,
    };
  };

  const canvasJson = useMemo(
    () => ({
      version: '1.0',
      metadata: {
        name: 'Eva multi-agent canvas',
        generatedAt: new Date().toISOString(),
        operationModel: 'local-typed-graph',
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        title: node.title,
        description: node.description,
        position: { x: node.x, y: node.y },
        fields: Object.fromEntries(
          Object.entries(formData).filter(([key]) => key.startsWith(`${node.type}_${node.id}_`)),
        ),
      })),
      connections,
    }),
    [connections, formData, nodes],
  );

  const updateNode = (id: string, patch: Partial<Pick<EvaCanvasNode, 'title' | 'description'>>) => {
    setNodes(prev => prev.map(node => (node.id === id ? { ...node, ...patch } : node)));
  };

  const moveNode = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => (node.id === id ? { ...node, x, y } : node)));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    setConnections(prev => prev.filter(connection => connection.from !== id && connection.to !== id));
    setSelectedNodeId(prev => (prev === id ? 'agent-1' : prev));
  };

  const addNode = (type: EvaCanvasNode['type']) => {
    const count = nodes.filter(node => node.type === type).length + 1;
    const base = nodes.find(node => node.id === selectedNodeId) ?? nodes[0];
    const typeLabel = EVA_CANVAS_NODE_TYPES.find(item => item.type === type)?.label ?? 'Node';
    const newNode: EvaCanvasNode = {
      id: `${type}-${Date.now()}`,
      type,
      title: type === 'agent' ? `Secondary agent ${count}` : typeLabel,
      description: type === 'decision' ? 'Route to a specialist when conditions are met' : `Configure ${typeLabel.toLowerCase()} details`,
      x: snapToEvaCanvasGrid((base?.x ?? 420) + (type === 'knowledge' || type === 'mcp' ? -340 : 340)),
      y: snapToEvaCanvasGrid((base?.y ?? 220) + (count - 1) * 120),
    };
    setNodes(prev => [...prev, newNode]);
    if (base) {
      const sides = getClosestSides(base, newNode);
      setConnections(prev => [
        ...prev,
        {
          id: `conn-${base.id}-${newNode.id}`,
          from: base.id,
          to: newNode.id,
          fromSide: sides.fromSide,
          toSide: sides.toSide,
          label: 'related',
        },
      ]);
    }
    setSelectedNodeId(newNode.id);
  };

  const arrangeNodes = () => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id === 'agent-1') return { ...node, x: 420, y: 220 };
        if (node.type === 'knowledge') return { ...node, x: 80, y: 80 };
        if (node.type === 'mcp') return { ...node, x: 80, y: 440 };
        if (node.type === 'voice') return { ...node, x: 780, y: 120 };
        if (node.type === 'decision') return { ...node, x: 780, y: 420 };
        if (node.type === 'metrics') return { ...node, x: 1120, y: 260 };
        if (node.type === 'language') return { ...node, x: 420, y: -120 };
        return node;
      }),
    );
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConnectionPointClick = (nodeId: string, side: Side) => {
    const source = connectingFromRef.current;
    if (!source) {
      const nextSource = { nodeId, side };
      connectingFromRef.current = nextSource;
      setConnectingFrom(nextSource);
      return;
    }
    if (source.nodeId !== nodeId) {
      setConnections(prev => [
        ...prev,
        {
          id: `conn-${source.nodeId}-${nodeId}-${Date.now()}`,
          from: source.nodeId,
          to: nodeId,
          fromSide: source.side,
          toSide: side,
          label: 'connects',
        },
      ]);
    }
    connectingFromRef.current = null;
    setConnectingFrom(null);
    setPendingConnectionEnd(null);
  };

  const createConnection = (targetNodeId: string, targetSide: Side) => {
    const source = connectingFromRef.current;
    if (!source || source.nodeId === targetNodeId) {
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setPendingConnectionEnd(null);
      return;
    }

    // Enforce the same compatibility rules that drive the green/red dot
    // highlight: if the target dot was rendered red, dropping there is a
    // no-op so the visual feedback and the actual behavior stay in sync.
    const sourceNode = nodes.find(node => node.id === source.nodeId);
    const targetNode = nodes.find(node => node.id === targetNodeId);
    if (sourceNode && targetNode && !isEvaConnectionCompatible(sourceNode.type, targetNode.type)) {
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setPendingConnectionEnd(null);
      return;
    }

    setConnections(prev => [
      ...prev,
      {
        id: `conn-${source.nodeId}-${targetNodeId}-${Date.now()}`,
        from: source.nodeId,
        to: targetNodeId,
        fromSide: source.side,
        toSide: targetSide,
        label: 'connects',
      },
    ]);
    connectingFromRef.current = null;
    setConnectingFrom(null);
    setPendingConnectionEnd(null);
  };

  const handleConnectionDragStart = (nodeId: string, side: Side, clientX: number, clientY: number) => {
    const nextSource = { nodeId, side };
    connectingFromRef.current = nextSource;
    setConnectingFrom(nextSource);
    setPendingConnectionEnd(clientPointToWorldPoint(clientX, clientY));
  };

  const handleConnectionDragEnd = (clientX: number, clientY: number) => {
    const target = getConnectionHandleAtPoint(clientX, clientY);
    if (!target) {
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setPendingConnectionEnd(null);
      return;
    }
    createConnection(target.nodeId, target.side);
  };

  /* Document-level pointer tracking for an in-progress connection drag.
     The earlier implementation relied on React's `onMouseMove` on the
     `.eva-canvas-stage` section, which was brittle: once the dot button
     swallowed the pointerdown (with preventDefault), the cursor moving
     over child elements or briefly leaving the stage could either fail
     to dispatch mousemove up to the stage or trigger the stage's
     mouseleave cleanup — either way the dashed line stopped following
     the cursor. Listening on `document` for the duration of the drag
     side-steps both problems and matches the pattern already used for
     moving flow boxes (see EvaFlowBox.tsx).

     We stash the latest pan/zoom/createConnection helpers in a ref so
     the effect only re-binds when the drag starts/ends; otherwise it
     would have to thrash through addEventListener on every pan/zoom
     state change. */
  const connectionDragRefs = useRef({
    clientToWorld: clientPointToWorldPoint,
    finish: handleConnectionDragEnd,
  });
  connectionDragRefs.current = {
    clientToWorld: clientPointToWorldPoint,
    finish: handleConnectionDragEnd,
  };

  useEffect(() => {
    if (!connectingFrom) return undefined;
    const onPointerMove = (event: PointerEvent) => {
      setPendingConnectionEnd(connectionDragRefs.current.clientToWorld(event.clientX, event.clientY));
    };
    const onPointerUp = (event: PointerEvent) => {
      connectionDragRefs.current.finish(event.clientX, event.clientY);
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    /* Pointer cancels are dispatched when the OS interrupts the gesture
       (e.g. focus stolen, gesture timeout). Treat them like a release
       outside any drop target so the source dot doesn't get stuck in the
       connecting state. */
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [connectingFrom]);

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(canvasJson, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  /* Snapshot of the active tab's working state, used both when switching
     tabs and when spawning a new tab so the outgoing tab is preserved. */
  const captureActiveSnapshot = (): CanvasTabSnapshot => ({
    nodes,
    connections,
    selectedNodeId,
    formData,
    pan,
    zoom,
  });

  const applySnapshot = (snapshot: CanvasTabSnapshot) => {
    setNodes(snapshot.nodes);
    setConnections(snapshot.connections);
    setSelectedNodeId(snapshot.selectedNodeId);
    setFormData(snapshot.formData);
    setPan(snapshot.pan);
    setZoom(snapshot.zoom);
  };

  const switchTab = (nextTabId: string) => {
    if (nextTabId === activeTabId) return;
    const target = tabs.find(tab => tab.id === nextTabId);
    if (!target) return;
    const outgoing = captureActiveSnapshot();
    setTabs(prev => prev.map(tab => (tab.id === activeTabId ? { ...tab, snapshot: outgoing } : tab)));
    if (target.snapshot) applySnapshot(target.snapshot);
    setActiveTabId(nextTabId);
  };

  const closeTab = (tabId: string) => {
    if (tabId === MAIN_TAB_ID) return;
    const remaining = tabs.filter(tab => tab.id !== tabId);
    if (remaining.length === 0) return;
    const isClosingActive = tabId === activeTabId;
    setTabs(remaining);
    if (isClosingActive) {
      // Fall back to the main tab — its snapshot, if any, was captured the
      // last time the user switched away from it; if the user has never
      // left the main tab, there's no snapshot to restore (the working
      // state is already main's data).
      const fallback = remaining.find(tab => tab.id === MAIN_TAB_ID) ?? remaining[0];
      if (fallback.snapshot) applySnapshot(fallback.snapshot);
      setActiveTabId(fallback.id);
    }
  };

  const spawnExampleTab = () => {
    const newTabId = `example-triage-${Date.now()}`;
    const outgoing = captureActiveSnapshot();
    setTabs(prev => [
      ...prev.map(tab => (tab.id === activeTabId ? { ...tab, snapshot: outgoing } : tab)),
      { id: newTabId, label: 'Triage example', closable: true },
    ]);
    setNodes(EVA_CANVAS_TRIAGE_EXAMPLE_NODES);
    setConnections(EVA_CANVAS_TRIAGE_EXAMPLE_CONNECTIONS);
    setSelectedNodeId(EVA_CANVAS_TRIAGE_EXAMPLE_NODES[0].id);
    setFormData({});
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setActiveTabId(newTabId);
  };

  const handleLoadExample = () => {
    setPrefillText(EVA_CANVAS_TRIAGE_EXAMPLE_PROMPT);
    setPrefillKey(prev => prev + 1);
    setExamplePrimed(true);
    setEvaWindowCollapsed(false);
  };

  /* Refs that mirror the latest nodes/connections so `applyCanvasActions`
     (called from the async LLM callback) sees up-to-date state without
     stale closures. We can't rely on the captured render's `nodes` and
     `connections` because the user may pan, drag, or hand-edit the
     canvas while the LLM round-trip is in flight. */
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  /* Walks the action list left-to-right, accumulating new nodes and
     connections into a working graph that's then committed in a single
     pair of state updates (so React batches a single re-render and the
     edges line up with the freshly placed boxes). Position math mirrors
     `addNode` above: knowledge/mcp sit to the left of the link target,
     everything else to the right; same-type cards stack vertically. */
  const applyCanvasActions = (actions: CanvasAction[]): { addedNodes: number; addedConnections: number } => {
    if (actions.length === 0) return { addedNodes: 0, addedConnections: 0 };
    const workingNodes: EvaCanvasNode[] = [...nodesRef.current];
    const workingConnections: EvaCanvasConnection[] = [...connectionsRef.current];
    let addedNodes = 0;
    let addedConnections = 0;

    /* Pick a fallback link target when the LLM didn't supply a valid
       linkToNodeId. Capability/decision/metrics nodes default to the
       first agent ("lead"); a stand-alone agent gets no auto-link. */
    const findLeadAgentId = () => workingNodes.find(n => n.type === 'agent')?.id;

    /* Unique-ish node id even for batches that all run inside a single
       millisecond. Date.now alone collides when the LLM returns ≥2
       add_node actions in the same response. */
    let idCounter = 0;
    const nextId = (type: string) => `${type}-${Date.now()}-${idCounter++}`;

    for (const action of actions) {
      if (action.type === 'add_node') {
        /* Resolve the link target. Skip linking entirely if the supplied
           id doesn't match any current node (LLM hallucination) — the
           node still gets placed so the user can wire it manually. */
        const linkTarget =
          (action.linkToNodeId && workingNodes.find(n => n.id === action.linkToNodeId)) ||
          (action.nodeType === 'agent' ? null : workingNodes.find(n => n.id === findLeadAgentId())) ||
          null;
        const base = linkTarget ?? workingNodes.find(n => n.id === selectedNodeId) ?? workingNodes[0];
        const sameTypeCount = workingNodes.filter(n => n.type === action.nodeType).length + 1;
        const typeLabel =
          EVA_CANVAS_NODE_TYPES.find(item => item.type === action.nodeType)?.label ?? 'Node';
        const isLeftSide = action.nodeType === 'knowledge' || action.nodeType === 'mcp';
        const newNode: EvaCanvasNode = {
          id: nextId(action.nodeType),
          type: action.nodeType,
          title:
            action.title?.trim() ||
            (action.nodeType === 'agent' ? `Secondary agent ${sameTypeCount}` : typeLabel),
          description:
            action.description?.trim() ||
            (action.nodeType === 'decision'
              ? 'Route to a specialist when conditions are met'
              : `Configure ${typeLabel.toLowerCase()} details`),
          x: snapToEvaCanvasGrid((base?.x ?? 420) + (isLeftSide ? -340 : 340)),
          y: snapToEvaCanvasGrid((base?.y ?? 220) + (sameTypeCount - 1) * 120),
        };
        workingNodes.push(newNode);
        addedNodes += 1;

        /* Auto-connect to the resolved link target. We use the same
           direction as the manual `addNode` helper above (linkTarget →
           newNode) so AI-added edges look the same as user-added ones.
           The compatibility check tolerates either direction in case
           the rules table only lists the reverse — knowledge ↔ agent
           and similar pairs are bidirectionally compatible. */
        if (
          linkTarget &&
          (isEvaConnectionCompatible(linkTarget.type, newNode.type) ||
            isEvaConnectionCompatible(newNode.type, linkTarget.type))
        ) {
          const sides = getClosestSides(linkTarget, newNode);
          workingConnections.push({
            id: `conn-${linkTarget.id}-${newNode.id}-${Date.now()}-${idCounter}`,
            from: linkTarget.id,
            to: newNode.id,
            fromSide: sides.fromSide,
            toSide: sides.toSide,
            label: 'related',
          });
          addedConnections += 1;
        }
      } else if (action.type === 'connect') {
        const fromNode = workingNodes.find(n => n.id === action.fromNodeId);
        const toNode = workingNodes.find(n => n.id === action.toNodeId);
        if (!fromNode || !toNode || fromNode.id === toNode.id) continue;
        if (!isEvaConnectionCompatible(fromNode.type, toNode.type)) continue;
        const sides = getClosestSides(fromNode, toNode);
        workingConnections.push({
          id: `conn-${fromNode.id}-${toNode.id}-${Date.now()}-${idCounter++}`,
          from: fromNode.id,
          to: toNode.id,
          fromSide: sides.fromSide,
          toSide: sides.toSide,
          label: action.label?.trim() || 'connects',
        });
        addedConnections += 1;
      }
    }

    if (addedNodes > 0) setNodes(workingNodes);
    if (addedConnections > 0) setConnections(workingConnections);
    /* Select the most recently added node so the right-side details
       panel jumps to it — mirrors the manual `addNode` UX. */
    if (addedNodes > 0) {
      const last = workingNodes[workingNodes.length - 1];
      if (last) setSelectedNodeId(last.id);
    }
    return { addedNodes, addedConnections };
  };

  const handleCanvasEvaSend = (text: string) => {
    /* If the user pulled in the Triage example via "Load example", treat
       this send as the trigger to materialise the demo on a new tab — even
       if they tweaked the wording before sending. The flag is one-shot so
       subsequent freeform messages don't keep spawning tabs. This stays
       a deterministic fast path; everything else falls through to the
       Cisco LLM below. */
    const shouldSpawnExample = examplePrimed;
    if (shouldSpawnExample) setExamplePrimed(false);

    if (shouldSpawnExample) {
      setCanvasEvaMessages(prev => [
        ...prev,
        { role: 'user', text },
        {
          role: 'assistant',
          text:
            'Done — I spun up a new "Triage example" tab with two specialist agents (Medical Qs and Insurance Qs) sharing one persona, each grounded by its own knowledge base, with a Triage delegate routing between them.',
        },
      ]);
      spawnExampleTab();
      return;
    }

    /* Free-form: append the user message immediately for snappy feedback,
       then ask the LLM. We capture the message history *before* the
       optimistic append so the system prompt + history we send the LLM
       reflects the conversation up to (but not including) this turn —
       sendEvaChat re-adds the latest user message itself. */
    const historySnapshot = canvasEvaMessages;
    setCanvasEvaMessages(prev => [...prev, { role: 'user', text }]);
    setCanvasThinking(true);

    void (async () => {
      try {
        /* System prompt is rebuilt per-request so Eva sees the latest
           node IDs and titles. Without this, the LLM would emit actions
           against stale ids the user has since deleted/renamed. */
        const systemPrompt = buildCanvasEvaSystemPrompt({
          nodes: nodesRef.current,
          connections: connectionsRef.current,
          selectedNodeId,
        });
        const reply = await sendEvaChat([
          { role: 'system', content: systemPrompt },
          ...historySnapshot.map(message => ({ role: message.role, content: message.text })),
          { role: 'user', content: text },
        ]);
        const { actions, displayText } = parseCanvasReply(reply);
        const { addedNodes, addedConnections } = applyCanvasActions(actions);
        /* If the LLM emitted actions but no prose, synthesize a short
           confirmation so the chat thread doesn't go silent. */
        const confirmation =
          displayText ||
          (addedNodes > 0 || addedConnections > 0
            ? `Added ${addedNodes} node${addedNodes === 1 ? '' : 's'}${
                addedConnections > 0 ? ` and ${addedConnections} connection${addedConnections === 1 ? '' : 's'}` : ''
              }.`
            : 'I can help refine the canvas structure, node configuration, and handoff flow. Tell me what you want to change next.');
        setCanvasEvaMessages(prev => [...prev, { role: 'assistant', text: confirmation }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setCanvasEvaMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `I couldn\u2019t reach the assistant just now (${message}). Check that CISCO_AI_AUTH and CISCO_AI_APPKEY are set in the dev server environment and try again.`,
          },
        ]);
      } finally {
        setCanvasThinking(false);
      }
    })();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextZoom = Math.min(Math.max(zoom * (event.deltaY < 0 ? 1.08 : 0.92), 0.5), 2);
    setZoom(nextZoom);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.eva-flowbox, .eva-canvas-json-card, .eva-mini-assistant, button, .form-group')) return;
    setPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    /* Connection-drag tracking lives in the document-level effect above
       (the React synthetic mousemove was unreliable because the cursor
       can hover children that don't bubble cleanly while the dot button
       holds focus). All this handler does now is drive the pan gesture. */
    if (!panning) return;
    setPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
  };

  return (
    <div className="eva-canvas-workspace">
      <header className="eva-canvas-workspace__header">
        <div>
          <span className="eva-shell__eyebrow">
            <Icon name="sparkle" weight="bold" size="sm" />
            Eva canvas
          </span>
          <h1>Multi-agent collaboration map</h1>
          <p>Pan, zoom, connect nodes, switch compact mode, and inspect the operation JSON.</p>
        </div>
        {/* Mirror the 3-button action cluster from the chat view so the
            canvas header has the same affordances in the same place.
            The middle button flips Canvas view ⇄ Chat view, the side-panel
            icon collapses/expands the floating Eva assistant (the only
            "panel" the canvas surfaces), and "New thread" hands off to
            the parent which navigates back to chat and starts a thread. */}
        <div className="eva-view-actions__controls">
          <Button
            variant="secondary"
            size="sm"
            className="eva-view-actions__icon-btn"
            onClick={() => setEvaWindowCollapsed(prev => !prev)}
            aria-label={evaWindowCollapsed ? 'Expand Eva assistant' : 'Collapse Eva assistant'}
            aria-pressed={!evaWindowCollapsed}
            title={evaWindowCollapsed ? 'Expand Eva assistant' : 'Collapse Eva assistant'}
          >
            <Icon name="side-panel" weight="bold" size="sm" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onBack}>
            <Icon name="start-chat" weight="bold" size="sm" />
            Chat view
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (onNewThread ?? onBack)()}
          >
            <Icon name="plus" weight="bold" size="sm" />
            Create new agent
          </Button>
        </div>
      </header>

      <div className="eva-canvas-workspace__body">
        {/* Tab strip for switching between the user's working canvas and any
            generated example canvases (e.g. the Triage demo). The default
            tab is locked; example tabs can be closed inline. */}
        <Tabs aria-label="Canvas tabs" className="eva-canvas-tabs">
          {tabs.map(tab => (
            <div key={tab.id} className="eva-canvas-tab-item">
              <Tab active={tab.id === activeTabId} onClick={() => switchTab(tab.id)}>
                {tab.label}
              </Tab>
              {tab.closable && (
                <button
                  type="button"
                  className="eva-canvas-tab-close"
                  aria-label={`Close ${tab.label} tab`}
                  onClick={event => {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <Icon name="cancel" weight="bold" size={12} />
                </button>
              )}
            </div>
          ))}
        </Tabs>
        <section
          ref={surfaceRef}
          className="eva-canvas-stage"
          aria-label="Eva multi-agent visual canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          /* Connection drags are now tracked via document-level pointer
             listeners (see useEffect above), so onMouseUp / onMouseLeave
             here only need to clean up the canvas pan gesture. Letting
             the cursor briefly leave the stage during a drag — to swing
             over the toolbar, the mini-assistant, or even the gap above
             the canvas — must NOT cancel the in-progress connection. */
          onMouseUp={() => setPanning(false)}
          onMouseLeave={() => setPanning(false)}
        >
          <div className="eva-canvas-toolbar">
            <Dropdown
              className="eva-canvas-add-select"
              options={addOptions}
              value={addValue}
              placeholder="Add card"
              size="compact"
              menuPlacement="top"
              onChange={value => {
                setAddValue('');
                addNode(value as EvaCanvasNode['type']);
              }}
            />
            <Button size="sm" variant="secondary" onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} aria-label="Zoom out">
              <Icon name="minus" weight="bold" size="sm" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} aria-label="Zoom in">
              <Icon name="plus" weight="bold" size="sm" />
            </Button>
            <Badge variant="default">{Math.round(zoom * 100)}%</Badge>
            <Button size="sm" variant="secondary" onClick={arrangeNodes}>Arrange</Button>
            <Button size="sm" variant={compactMode ? 'primary' : 'secondary'} onClick={() => setCompactMode(prev => !prev)}>
              Compact cards
            </Button>
            <Button size="sm" variant={showJson ? 'primary' : 'secondary'} onClick={() => setShowJson(prev => !prev)}>
              JSON
            </Button>
          </div>

          {showJson && (
            <Card className="eva-canvas-json-card">
              <CardHeader actions={<Button size="sm" variant="secondary" onClick={handleCopyJson}>{copied ? 'Copied' : 'Copy'}</Button>}>
                <CardTitle>Canvas JSON</CardTitle>
              </CardHeader>
              <CardBody>
                <pre className="eva-canvas-json">{JSON.stringify(canvasJson, null, 2)}</pre>
              </CardBody>
            </Card>
          )}

          <aside
            className={`eva-mini-assistant eva-mini-assistant--floating${
              evaWindowCollapsed ? ' eva-mini-assistant--collapsed' : ''
            }`}
            aria-label="Eva canvas assistant"
          >
            <div className="eva-mini-assistant__header">
              <span>
                <Icon name="sparkle" weight="bold" size="sm" />
                Eva
              </span>
              <div className="eva-mini-assistant__controls">
                <button
                  type="button"
                  className="eva-mini-assistant__control"
                  aria-label={evaWindowCollapsed ? 'Expand Eva assistant' : 'Collapse Eva assistant'}
                  onClick={() => setEvaWindowCollapsed(prev => !prev)}
                >
                  <Icon name={evaWindowCollapsed ? 'maximize' : 'minimize'} weight="bold" size="sm" />
                </button>
                <button
                  type="button"
                  className="eva-mini-assistant__control"
                  aria-label="Back to full Eva page"
                  onClick={onBack}
                >
                  <Icon name="pop-out" weight="bold" size="sm" />
                </button>
              </div>
            </div>
            {!evaWindowCollapsed && (
              <>
                <div className="eva-mini-assistant__thread">
                  {canvasEvaMessages.map((message, index) => (
                    message.role === 'user'
                      ? <AiUserMessage key={`${message.role}-${index}`} text={message.text} className="eva-mini-assistant__user-message" />
                      : (
                          <AiResponseMessage
                            key={`${message.role}-${index}`}
                            className="eva-mini-assistant__response"
                            assistantName="Eva"
                            content={message.text}
                          />
                        )
                  ))}
                </div>
                {/* One-click prefill of a canned demo prompt. Drops the
                    Triage example text into the composer and arms the
                    next send to spawn a matching example canvas tab — so
                    the user gets to review/edit the prompt before they
                    hit send, then sees the result materialize as a new
                    tab on the canvas. */}
                <div className="eva-mini-assistant__quick-actions">
                  <Button variant="secondary" size="sm" onClick={handleLoadExample}>
                    Load example
                  </Button>
                </div>
                <AiFooter
                  className="eva-mini-assistant__footer"
                  onSend={handleCanvasEvaSend}
                  placeholder="Ask Eva about this canvas..."
                  suggestions={[]}
                  initialText={prefillText}
                  prefillKey={prefillKey}
                  processing={canvasThinking}
                  disabled={canvasThinking}
                />
              </>
            )}
          </aside>

          <div
            className="eva-canvas-world"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg className="eva-canvas-world__connections" aria-hidden>
              {connections.map(connection => {
                const from = nodes.find(node => node.id === connection.from);
                const to = nodes.find(node => node.id === connection.to);
                if (!from || !to) return null;
                const start = getConnectionPoint(from, connection.fromSide, compactMode);
                const end = getConnectionPoint(to, connection.toSide, compactMode);
                const distance = Math.abs(end.x - start.x);
                const curveOffset = Math.min(distance * 0.5, 120);
                const path = `M ${start.x} ${start.y} C ${start.x + curveOffset} ${start.y}, ${end.x - curveOffset} ${end.y}, ${end.x} ${end.y}`;
                return (
                  <g key={connection.id}>
                    <path className="eva-canvas-world__connection-hit" d={path} onClick={() => setConnections(prev => prev.filter(item => item.id !== connection.id))} />
                    <path className="eva-canvas-world__connection" d={path} />
                    {connection.label && (
                      <text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2} className="eva-canvas-world__connection-label">
                        {connection.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {connectingFrom && pendingConnectionEnd && (() => {
                const from = nodes.find(node => node.id === connectingFrom.nodeId);
                if (!from) return null;
                const start = getConnectionPoint(from, connectingFrom.side, compactMode);
                const distance = Math.abs(pendingConnectionEnd.x - start.x);
                const curveOffset = Math.min(distance * 0.5, 120);
                const path = `M ${start.x} ${start.y} C ${start.x + curveOffset} ${start.y}, ${pendingConnectionEnd.x - curveOffset} ${pendingConnectionEnd.y}, ${pendingConnectionEnd.x} ${pendingConnectionEnd.y}`;
                return <path className="eva-canvas-world__connection eva-canvas-world__connection--pending" d={path} />;
              })()}
            </svg>

            {(() => {
              // While a connection drag is in progress we tag every node with a
              // state so its dots can render green (compatible target),
              // red (incompatible target), or stay blue (the source node).
              const sourceNode = connectingFrom
                ? nodes.find(node => node.id === connectingFrom.nodeId) ?? null
                : null;
              return nodes.map(node => {
                let connectionState: 'idle' | 'source' | 'compatible' | 'incompatible' = 'idle';
                if (connectingFrom && sourceNode) {
                  if (node.id === connectingFrom.nodeId) {
                    connectionState = 'source';
                  } else {
                    connectionState = isEvaConnectionCompatible(sourceNode.type, node.type)
                      ? 'compatible'
                      : 'incompatible';
                  }
                }
                return (
                  <EvaFlowBox
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    compact={compactMode}
                    formData={formData}
                    onMove={moveNode}
                    onSelect={setSelectedNodeId}
                    onDelete={deleteNode}
                    onUpdateNode={updateNode}
                    onFormDataChange={(fieldId, value) => setFormData(prev => ({ ...prev, [fieldId]: value }))}
                    onConnectionPointClick={handleConnectionPointClick}
                    onConnectionDragStart={handleConnectionDragStart}
                    onConnectionDragEnd={handleConnectionDragEnd}
                    onOpenDetails={setSelectedNodeId}
                    isConnecting={Boolean(connectingFrom)}
                    connectionState={connectionState}
                  />
                );
              });
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
