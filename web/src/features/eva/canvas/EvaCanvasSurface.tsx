import { useMemo, useRef, useState } from 'react';
import { AiFooter, AiResponseMessage, AiUserMessage, Badge, Button, Card, CardBody, CardHeader, CardTitle, Dropdown } from '../../../components/shared';
import { Icon } from '../../../icons';
import type { EvaCanvasConnection, EvaCanvasNode } from '../types';
import {
  EVA_CANVAS_NODE_TYPES,
  initialEvaCanvasConnections,
  initialEvaCanvasNodes,
  snapToEvaCanvasGrid,
} from './evaCanvasData';
import EvaFlowBox, { getEvaFlowBoxSize } from './EvaFlowBox';

type Side = EvaCanvasConnection['fromSide'];

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

type CanvasEvaMessage = {
  role: 'user' | 'assistant';
  text: string;
};

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

export default function EvaCanvasSurface({ onBack }: { onBack: () => void }) {
  const [nodes, setNodes] = useState<EvaCanvasNode[]>(initialEvaCanvasNodes);
  const [connections, setConnections] = useState<EvaCanvasConnection[]>(initialEvaCanvasConnections);
  const [selectedNodeId, setSelectedNodeId] = useState('agent-1');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [compactMode, setCompactMode] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: Side } | null>(null);
  const [copied, setCopied] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pendingConnectionEnd, setPendingConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [evaWindowCollapsed, setEvaWindowCollapsed] = useState(false);
  const [canvasEvaMessages, setCanvasEvaMessages] = useState<CanvasEvaMessage[]>([
    {
      role: 'assistant',
      text: 'I can help adjust this orchestration map. Try asking me to add a specialist agent, connect two nodes, or summarize the flow.',
    },
  ]);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const connectingFromRef = useRef<{ nodeId: string; side: Side } | null>(null);

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

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(canvasJson, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleCanvasEvaSend = (text: string) => {
    const normalized = text.toLowerCase();
    const response = normalized.includes('connect')
      ? 'Select a blue dot on the source node, drag to a blue dot on the target node, and release to create the connection.'
      : normalized.includes('add')
        ? 'Use Add card in the bottom toolbar to add an agent, knowledge source, action, delegate, voice, exit, or metrics node.'
        : 'I can help refine the canvas structure, node configuration, and handoff flow. Tell me what you want to change next.';

    setCanvasEvaMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: response },
    ]);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextZoom = Math.min(Math.max(zoom * (event.deltaY < 0 ? 1.08 : 0.92), 0.5), 2);
    setZoom(nextZoom);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.eva-flowbox, .eva-canvas-json-card, .eva-canvas-eva-window, button, .form-group')) return;
    setPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (connectingFromRef.current) {
      setPendingConnectionEnd(clientPointToWorldPoint(event.clientX, event.clientY));
    }
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
        <Button variant="secondary" size="sm" onClick={onBack}>
          <Icon name="start-chat" weight="bold" size="sm" />
          Chat view
        </Button>
      </header>

      <div className="eva-canvas-workspace__body">
        <section
          ref={surfaceRef}
          className="eva-canvas-stage"
          aria-label="Eva multi-agent visual canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => {
            setPanning(false);
            connectingFromRef.current = null;
            setConnectingFrom(null);
            setPendingConnectionEnd(null);
          }}
          onMouseLeave={() => {
            setPanning(false);
            connectingFromRef.current = null;
            setConnectingFrom(null);
            setPendingConnectionEnd(null);
          }}
        >
          <div className="eva-canvas-toolbar">
            <Dropdown
              className="eva-canvas-add-select"
              options={addOptions}
              value={addValue}
              placeholder="Add card"
              size="compact"
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

          <aside className={`eva-canvas-eva-window${evaWindowCollapsed ? ' eva-canvas-eva-window--collapsed' : ''}`} aria-label="Eva canvas assistant">
            <div className="eva-canvas-eva-window__header">
              <span>
                <Icon name="sparkle" weight="bold" size="sm" />
                Eva
              </span>
              <div className="eva-canvas-eva-window__controls">
                <button
                  type="button"
                  className="eva-canvas-eva-window__control"
                  aria-label={evaWindowCollapsed ? 'Expand Eva assistant' : 'Collapse Eva assistant'}
                  onClick={() => setEvaWindowCollapsed(prev => !prev)}
                >
                  <Icon name={evaWindowCollapsed ? 'maximize' : 'minimize'} weight="bold" size="sm" />
                </button>
                <button
                  type="button"
                  className="eva-canvas-eva-window__control"
                  aria-label="Back to full Eva page"
                  onClick={onBack}
                >
                  <Icon name="pop-out" weight="bold" size="sm" />
                </button>
              </div>
            </div>
            {!evaWindowCollapsed && (
              <>
                <div className="eva-canvas-eva-window__thread">
                  {canvasEvaMessages.map((message, index) => (
                    message.role === 'user'
                      ? <AiUserMessage key={`${message.role}-${index}`} text={message.text} className="eva-canvas-eva-window__user-message" />
                      : (
                          <AiResponseMessage
                            key={`${message.role}-${index}`}
                            className="eva-canvas-eva-window__response"
                            assistantName="Eva"
                            content={message.text}
                          />
                        )
                  ))}
                </div>
                <AiFooter
                  className="eva-canvas-eva-window__footer"
                  onSend={handleCanvasEvaSend}
                  placeholder="Ask Eva about this canvas..."
                  suggestions={[]}
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

            {nodes.map(node => (
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
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
