import { useEffect, useMemo, useRef, useState } from 'react';
import { AccordionGroup, AccordionItem, Badge, Button, Textarea } from '../../../components/shared';
import { Icon } from '../../../icons';
import type { EvaCanvasNode } from '../types';
import {
  EVA_CANVAS_COMPACT_SIZE,
  EVA_CANVAS_NODE_HEIGHT,
  EVA_CANVAS_NODE_META,
  EVA_CANVAS_NODE_WIDTH,
  snapToEvaCanvasGrid,
} from './evaCanvasData';

interface EvaFlowBoxProps {
  node: EvaCanvasNode;
  selected?: boolean;
  compact?: boolean;
  formData: Record<string, string>;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNode: (id: string, patch: Partial<Pick<EvaCanvasNode, 'title' | 'description'>>) => void;
  onFormDataChange: (fieldId: string, value: string) => void;
  onConnectionPointClick: (boxId: string, side: 'left' | 'right' | 'top' | 'bottom', fieldId?: string) => void;
  onConnectionDragStart: (boxId: string, side: 'left' | 'right' | 'top' | 'bottom', clientX: number, clientY: number) => void;
  onConnectionDragEnd: (clientX: number, clientY: number) => void;
  onOpenDetails: (id: string) => void;
  isConnecting?: boolean;
  // Drives the green/red highlight on connection points while another node is
  // being dragged from. `source` = this node started the drag; `compatible`
  // and `incompatible` describe whether dropping onto this node would create a
  // valid connection given the source node's type.
  connectionState?: 'idle' | 'source' | 'compatible' | 'incompatible';
}

export default function EvaFlowBox({
  node,
  selected = false,
  compact = false,
  formData,
  onMove,
  onSelect,
  onDelete,
  onUpdateNode,
  onFormDataChange,
  onConnectionPointClick,
  onConnectionDragStart,
  onConnectionDragEnd,
  onOpenDetails,
  isConnecting = false,
  connectionState = 'idle',
}: EvaFlowBoxProps) {
  const meta = EVA_CANVAS_NODE_META[node.type];
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const showConnectionPoints = hovered || isConnecting;
  const isLeadAgent = node.type === 'agent' && node.id === 'agent-1';

  const nodeFields = useMemo(
    () =>
      meta.fields.map(field => ({
        ...field,
        fieldId: `${node.type}_${node.id}_${field.id}`,
        value: formData[`${node.type}_${node.id}_${field.id}`] ?? field.value,
      })),
    [formData, meta.fields, node.id, node.type],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      onMove(
        node.id,
        snapToEvaCanvasGrid(event.clientX - dragOffset.x),
        snapToEvaCanvasGrid(event.clientY - dragOffset.y),
      );
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragOffset.x, dragOffset.y, dragging, node.id, onMove]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, textarea, input')) return;
    onSelect(node.id);
    setDragging(true);
    setDragOffset({
      x: event.clientX - node.x,
      y: event.clientY - node.y,
    });
  };

  const renderConnectionPoint = (side: 'left' | 'right' | 'top' | 'bottom') => {
    const stateClass = connectionState === 'compatible'
      ? ' eva-flowbox__connection--compatible'
      : connectionState === 'incompatible'
        ? ' eva-flowbox__connection--incompatible'
        : '';
    return (
      <button
        key={side}
        type="button"
        className={`eva-flowbox__connection eva-flowbox__connection--${side}${stateClass}`}
        data-eva-connection-node-id={node.id}
        data-eva-connection-side={side}
        data-eva-connection-state={connectionState}
        aria-label={`Connect from ${side}`}
        aria-disabled={connectionState === 'incompatible' || undefined}
        onPointerDown={event => {
          event.preventDefault();
          event.stopPropagation();
          onConnectionDragStart(node.id, side, event.clientX, event.clientY);
        }}
        onPointerUp={event => {
          event.preventDefault();
          event.stopPropagation();
          onConnectionDragEnd(event.clientX, event.clientY);
        }}
        onClick={event => {
          event.stopPropagation();
          if (event.detail === 0) {
            onConnectionPointClick(node.id, side);
          }
        }}
      />
    );
  };

  if (compact) {
    const compactTransform = node.type === 'decision'
      ? `translate(${node.x}px, ${node.y}px) rotate(45deg)`
      : `translate(${node.x}px, ${node.y}px)`;

    return (
      <div
        ref={boxRef}
        className={[
          'eva-flowbox eva-flowbox--compact',
          node.type === 'decision' && 'eva-flowbox--diamond',
          selected && 'eva-flowbox--selected',
        ].filter(Boolean).join(' ')}
        style={{ transform: compactTransform }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onOpenDetails(node.id)}
        role="button"
        tabIndex={0}
      >
        <Icon name={isLeadAgent ? 'bot-customer-assistant' : meta.icon} weight="bold" size="lg" />
        {showConnectionPoints && (
          <>
            {(['left', 'right', 'top', 'bottom'] as const).map(renderConnectionPoint)}
          </>
        )}
      </div>
    );
  }

  return (
    <article
      ref={boxRef}
      className={[
        'eva-flowbox',
        `eva-flowbox--${node.type}`,
        selected && 'eva-flowbox--selected',
        dragging && 'eva-flowbox--dragging',
      ].filter(Boolean).join(' ')}
      style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: EVA_CANVAS_NODE_WIDTH }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
    >
      <header className="eva-flowbox__header">
        <span className="eva-flowbox__icon">
          <Icon name={isLeadAgent ? 'bot-customer-assistant' : meta.icon} weight="bold" size="md" />
        </span>
        <span className="eva-flowbox__title">
          <strong>{node.title}</strong>
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <small>{node.description}</small>
        </span>
      </header>

      <div className="eva-flowbox__body">
        <AccordionGroup type="stack" className="eva-flowbox__field-list">
          <AccordionItem
            title="Description"
            className="eva-flowbox__field"
            size="small"
            styleVariant="borderless"
          >
            <Textarea
              value={node.description}
              onChange={event => onUpdateNode(node.id, { description: event.target.value })}
              aria-label="Description"
              rows={2}
            />
          </AccordionItem>
          {nodeFields.map(field => (
            <AccordionItem
              key={field.fieldId}
              title={field.label}
              className="eva-flowbox__field"
              size="small"
              styleVariant="borderless"
            >
              <Textarea
                value={field.value}
                onChange={event => onFormDataChange(field.fieldId, event.target.value)}
                aria-label={field.label}
                rows={2}
              />
            </AccordionItem>
          ))}
        </AccordionGroup>
      </div>

      <footer className="eva-flowbox__footer">
        <Button size="sm" variant="secondary" onClick={() => onOpenDetails(node.id)}>
          Details
        </Button>
        <Button size="sm" variant="tertiary" color="negative" onClick={() => onDelete(node.id)}>
          Delete
        </Button>
      </footer>

      {showConnectionPoints && (
        <>
          {(['left', 'right', 'top', 'bottom'] as const).map(renderConnectionPoint)}
        </>
      )}
    </article>
  );
}

export function getEvaFlowBoxSize(compact: boolean) {
  return compact
    ? { width: EVA_CANVAS_COMPACT_SIZE, height: EVA_CANVAS_COMPACT_SIZE }
    : { width: EVA_CANVAS_NODE_WIDTH, height: EVA_CANVAS_NODE_HEIGHT };
}
