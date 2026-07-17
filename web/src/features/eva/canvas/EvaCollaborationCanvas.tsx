import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { Badge } from '../../../components/shared';
import {
  CISCO_LIVE_AGENTS,
  type CiscoLiveAgentDefinition,
} from '../../../demo/ciscoLiveDemo';
import { Icon } from '../../../icons';

type Point = { x: number; y: number };
type CardSize = { width: number; height: number };

type DragState = {
  id: string;
  pointerId: number;
  startClient: Point;
  startPosition: Point;
  moved: boolean;
};

type ConnectionLayout = {
  id: string;
  path: string;
  marker: Point;
  label: Point;
  index: number;
};

const HUB_ID = 'current-agent';
const FALLBACK_HUB_SIZE: CardSize = { width: 360, height: 220 };
const FALLBACK_COLLABORATOR_SIZE: CardSize = { width: 440, height: 144 };

function collaboratorCardId(scenarioId: string) {
  return `collaborator-${scenarioId}`;
}

function AgentIdentity({ agent, compact = false }: { agent: CiscoLiveAgentDefinition; compact?: boolean }) {
  return (
    <div className={`eva-collaboration-agent-identity${compact ? ' eva-collaboration-agent-identity--compact' : ''}`}>
      <span className="eva-collaboration-agent-avatar" style={{ background: agent.gradient }} aria-hidden="true">
        {agent.initials}
      </span>
      <span>
        <strong>{agent.name}</strong>
        <small>{agent.description}</small>
      </span>
    </div>
  );
}

function getCardCenter(position: Point, size: CardSize): Point {
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2,
  };
}

function getConnectionLayout(
  id: string,
  index: number,
  fromPosition: Point,
  fromSize: CardSize,
  toPosition: Point,
  toSize: CardSize,
): ConnectionLayout {
  const fromCenter = getCardCenter(fromPosition, fromSize);
  const toCenter = getCardCenter(toPosition, toSize);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);

  let start: Point;
  let end: Point;
  let controlOne: Point;
  let controlTwo: Point;

  if (horizontal) {
    const direction = dx >= 0 ? 1 : -1;
    start = {
      x: fromCenter.x + direction * fromSize.width / 2,
      y: fromCenter.y,
    };
    end = {
      x: toCenter.x - direction * toSize.width / 2,
      y: toCenter.y,
    };
    const offset = Math.min(Math.max(Math.abs(end.x - start.x) * 0.45, 48), 180);
    controlOne = { x: start.x + direction * offset, y: start.y };
    controlTwo = { x: end.x - direction * offset, y: end.y };
  } else {
    const direction = dy >= 0 ? 1 : -1;
    start = {
      x: fromCenter.x,
      y: fromCenter.y + direction * fromSize.height / 2,
    };
    end = {
      x: toCenter.x,
      y: toCenter.y - direction * toSize.height / 2,
    };
    const offset = Math.min(Math.max(Math.abs(end.y - start.y) * 0.45, 48), 180);
    controlOne = { x: start.x, y: start.y + direction * offset };
    controlTwo = { x: end.x, y: end.y - direction * offset };
  }

  const marker = {
    x: (start.x + 3 * controlOne.x + 3 * controlTwo.x + end.x) / 8,
    y: (start.y + 3 * controlOne.y + 3 * controlTwo.y + end.y) / 8,
  };

  return {
    id,
    index,
    path: `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`,
    marker,
    label: {
      x: marker.x + (horizontal && dx < 0 ? -264 : 24),
      y: marker.y - 27,
    },
  };
}

function CollaborationOverview({
  agent,
  onInspect,
}: {
  agent: CiscoLiveAgentDefinition;
  onInspect: (agentId: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [cardSizes, setCardSizes] = useState<Record<string, CardSize>>({});
  const stageHeight = Math.max(480, 120 + agent.orchestrationScenarios.length * 190);
  const [positions, setPositions] = useState<Record<string, Point>>(() => ({
    [HUB_ID]: { x: 40, y: stageHeight / 2 - FALLBACK_HUB_SIZE.height / 2 },
    ...Object.fromEntries(agent.orchestrationScenarios.map((scenario, index) => [
      collaboratorCardId(scenario.id),
      { x: 640, y: 36 + index * 210 },
    ])),
  }));

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const width = Math.max(map.clientWidth, 1360);
    const hubSize = cardSizes[HUB_ID] ?? FALLBACK_HUB_SIZE;
    const widestCollaborator = agent.orchestrationScenarios.reduce((widest, scenario) => (
      Math.max(widest, cardSizes[collaboratorCardId(scenario.id)]?.width ?? FALLBACK_COLLABORATOR_SIZE.width)
    ), FALLBACK_COLLABORATOR_SIZE.width);
    const collaboratorX = Math.max(720, width - widestCollaborator - 40);
    const routeStep = stageHeight / (agent.orchestrationScenarios.length + 1);

    setPositions({
      [HUB_ID]: {
        x: 40,
        y: Math.max(24, stageHeight / 2 - hubSize.height / 2),
      },
      ...Object.fromEntries(agent.orchestrationScenarios.map((scenario, index) => {
        const id = collaboratorCardId(scenario.id);
        const size = cardSizes[id] ?? FALLBACK_COLLABORATOR_SIZE;
        return [id, {
          x: collaboratorX,
          y: Math.max(20, routeStep * (index + 1) - size.height / 2),
        }];
      })),
    });
  }, [agent.id, agent.orchestrationScenarios, cardSizes, stageHeight]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextSizes: Record<string, CardSize> = {};
    map.querySelectorAll<HTMLElement>('[data-collaboration-card-id]').forEach(element => {
      const id = element.dataset.collaborationCardId;
      if (!id) return;
      nextSizes[id] = { width: element.offsetWidth, height: element.offsetHeight };
    });
    setCardSizes(previous => {
      const previousEntries = Object.entries(previous);
      const nextEntries = Object.entries(nextSizes);
      const unchanged = previousEntries.length === nextEntries.length && nextEntries.every(([id, size]) => (
        previous[id]?.width === size.width && previous[id]?.height === size.height
      ));
      return unchanged ? previous : nextSizes;
    });
  }, [agent.id, agent.orchestrationScenarios]);

  useEffect(() => {
    if (!draggingId) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const map = mapRef.current;
      if (!drag || !map || event.pointerId !== drag.pointerId) return;
      const deltaX = event.clientX - drag.startClient.x;
      const deltaY = event.clientY - drag.startClient.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) drag.moved = true;

      const size = cardSizes[drag.id] ?? (drag.id === HUB_ID ? FALLBACK_HUB_SIZE : FALLBACK_COLLABORATOR_SIZE);
      const maxX = Math.max(0, map.clientWidth - size.width);
      const maxY = Math.max(0, stageHeight - size.height);
      setPositions(previous => ({
        ...previous,
        [drag.id]: {
          x: Math.min(Math.max(drag.startPosition.x + deltaX, 0), maxX),
          y: Math.min(Math.max(drag.startPosition.y + deltaY, 0), maxY),
        },
      }));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) suppressClickRef.current = drag.id;
      dragRef.current = null;
      setDraggingId(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [cardSizes, draggingId, stageHeight]);

  const beginDrag = (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const position = positions[id];
    if (!position) return;
    event.preventDefault();
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPosition: position,
      moved: false,
    };
    setDraggingId(id);
  };

  const moveCardWithKeyboard = (id: string, event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const movement = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    const map = mapRef.current;
    if (!map) return;
    const step = event.shiftKey ? 32 : 16;
    const size = cardSizes[id] ?? (id === HUB_ID ? FALLBACK_HUB_SIZE : FALLBACK_COLLABORATOR_SIZE);
    const maxX = Math.max(0, map.clientWidth - size.width);
    const maxY = Math.max(0, stageHeight - size.height);
    setPositions(previous => {
      const current = previous[id] ?? { x: 0, y: 0 };
      return {
        ...previous,
        [id]: {
          x: Math.min(Math.max(current.x + movement.x * step, 0), maxX),
          y: Math.min(Math.max(current.y + movement.y * step, 0), maxY),
        },
      };
    });
  };

  const handleCardClick = (id: string, agentId?: string) => {
    if (suppressClickRef.current === id) {
      suppressClickRef.current = null;
      return;
    }
    if (agentId) onInspect(agentId);
  };

  const connectionLayouts = useMemo(() => agent.orchestrationScenarios.map((scenario, index) => {
    const collaboratorId = collaboratorCardId(scenario.id);
    return getConnectionLayout(
      scenario.id,
      index + 1,
      positions[HUB_ID] ?? { x: 40, y: 120 },
      cardSizes[HUB_ID] ?? FALLBACK_HUB_SIZE,
      positions[collaboratorId] ?? { x: 640, y: 36 + index * 210 },
      cardSizes[collaboratorId] ?? FALLBACK_COLLABORATOR_SIZE,
    );
  }), [agent.orchestrationScenarios, cardSizes, positions]);

  return (
    <section className="eva-collaboration-overview" aria-labelledby="eva-collaboration-overview-title">
      <header className="eva-collaboration-section-header">
        <div>
          <span className="eva-shell__eyebrow">Configured collaboration</span>
          <h3 id="eva-collaboration-overview-title">How this agent works with other AI agents</h3>
          <p>
            This map reflects the {agent.orchestrationScenarios.length} orchestration scenarios configured for {agent.name}.
          </p>
        </div>
        <Badge variant="default">{agent.orchestrationScenarios.length} connections</Badge>
      </header>

      <div
        ref={mapRef}
        className={`eva-collaboration-map${draggingId ? ' eva-collaboration-map--dragging' : ''}`}
        style={{ minHeight: stageHeight }}
        aria-label={`${agent.name} collaboration map. Drag agent cards to rearrange them.`}
      >
        <svg className="eva-collaboration-connections" aria-hidden="true">
          {connectionLayouts.map(connection => (
            <g key={connection.id}>
              <path className="eva-canvas-world__connection" d={connection.path} />
              <circle className="eva-collaboration-connection-dot" cx={connection.marker.x} cy={connection.marker.y} r="15" />
              <text className="eva-collaboration-connection-number" x={connection.marker.x} y={connection.marker.y}>
                {connection.index}
              </text>
            </g>
          ))}
        </svg>

        <button
          type="button"
          className={`eva-collaboration-hub${draggingId === HUB_ID ? ' is-dragging' : ''}`}
          style={{ transform: `translate3d(${positions[HUB_ID]?.x ?? 40}px, ${positions[HUB_ID]?.y ?? 120}px, 0)` }}
          data-collaboration-card-id={HUB_ID}
          onPointerDown={event => beginDrag(HUB_ID, event)}
          onKeyDown={event => moveCardWithKeyboard(HUB_ID, event)}
          onClick={() => handleCardClick(HUB_ID, agent.id)}
          aria-label={`View ${agent.name} details, metrics, and attached nodes. Drag to move; use arrow keys for precise movement.`}
          aria-roledescription="draggable agent card"
        >
          <span className="eva-collaboration-hub__label">Current agent</span>
          <AgentIdentity agent={agent} />
          <span className="eva-collaboration-hub__meta">
            <Badge variant="success">{agent.status}</Badge>
            <span>{agent.agentType}</span>
          </span>
          <span className="eva-collaboration-hub__cta">View metrics and attached nodes <Icon name="arrow-right" weight="bold" size="sm" /></span>
        </button>

        <div className="eva-collaboration-routes" role="list" aria-label="Configured collaborators">
          {agent.orchestrationScenarios.map((scenario, index) => {
            const collaboratorAgent = scenario.collaborator.agentId
              ? CISCO_LIVE_AGENTS.find(candidate => candidate.id === scenario.collaborator.agentId)
              : undefined;
            const cardId = collaboratorCardId(scenario.id);
            const connection = connectionLayouts[index];
            return (
              <article className="eva-collaboration-route" key={scenario.id} role="listitem">
                <div
                  className="eva-collaboration-route__scenario"
                  style={{ transform: `translate3d(${connection?.label.x ?? 520}px, ${connection?.label.y ?? 40 + index * 190}px, 0)` }}
                >
                  <strong>{scenario.name}</strong>
                  <small>{scenario.collaboration}</small>
                </div>
                <button
                  type="button"
                  className={`eva-collaboration-collaborator${draggingId === cardId ? ' is-dragging' : ''}`}
                  style={{ transform: `translate3d(${positions[cardId]?.x ?? 640}px, ${positions[cardId]?.y ?? 36 + index * 210}px, 0)` }}
                  data-collaboration-card-id={cardId}
                  onPointerDown={event => beginDrag(cardId, event)}
                  onKeyDown={event => moveCardWithKeyboard(cardId, event)}
                  onClick={() => handleCardClick(cardId, collaboratorAgent?.id)}
                  aria-label={collaboratorAgent
                    ? `View ${collaboratorAgent.name} details. Drag to move; use arrow keys for precise movement.`
                    : `${scenario.collaborator.name} is connected through this scenario. Drag to move; use arrow keys for precise movement.`}
                  aria-roledescription="draggable agent card"
                >
                  <span
                    className="eva-collaboration-agent-avatar eva-collaboration-agent-avatar--small"
                    style={{ background: scenario.collaborator.gradient }}
                    aria-hidden="true"
                  >
                    {scenario.collaborator.initials}
                  </span>
                  <span>
                    <strong>{scenario.collaborator.name}</strong>
                    <small>{scenario.collaborator.description}</small>
                    <em>{scenario.actions.join(' · ')}</em>
                  </span>
                  {collaboratorAgent && <Icon name="arrow-right" weight="bold" size="sm" />}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function EvaCollaborationCanvas({
  agent,
  onInspectAgent,
}: {
  agent: CiscoLiveAgentDefinition;
  onInspectAgent: (agent: CiscoLiveAgentDefinition) => void;
}) {
  return (
    <div className="eva-collaboration-canvas">
      <CollaborationOverview
        agent={agent}
        onInspect={agentId => {
          const inspectedAgent = CISCO_LIVE_AGENTS.find(candidate => candidate.id === agentId) ?? agent;
          onInspectAgent(inspectedAgent);
        }}
      />
    </div>
  );
}
