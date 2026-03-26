import { useState } from 'react';
import Button from '../components/shared/Button';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../components/shared/Table';
import Badge from '../components/shared/Badge';
import { Icon } from '../icons';
import { useApp, type AiEngine } from '../contexts/AppContext';
import CreateEngineModal from './CreateEngineModal';
import EditEngineModal from './EditEngineModal';

/**
 * AI Engine — model / engine configuration (design: BYO LLM table).
 * Organization preferences live under **Organization settings** in the sidebar footer.
 */
export default function Settings() {
  const { showToast, aiEngines, addAiEngine, updateAiEngine, removeAiEngine } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEngine, setEditingEngine] = useState<AiEngine | null>(null);

  return (
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Engine</h1>
          <p className="page-subtitle">AI engine configuration and management</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowCreate(true)}
        >
          Create engine
        </Button>
      </div>

      {showCreate && (
        <CreateEngineModal
          onClose={() => setShowCreate(false)}
          onCreate={(data) => {
            addAiEngine({ name: data.name, description: data.description, createdBy: 'You' });
            setShowCreate(false);
            showToast(`Engine "${data.name}" created successfully!`, 'success');
          }}
        />
      )}

      {editingEngine && (
        <EditEngineModal
          initialData={{ name: editingEngine.name, description: editingEngine.description }}
          onClose={() => setEditingEngine(null)}
          onSave={(data) => {
            updateAiEngine(editingEngine.id, data);
            setEditingEngine(null);
            showToast(`Engine "${data.name}" updated successfully!`, 'success');
          }}
          onDuplicate={(data) => {
            addAiEngine({ name: data.name, description: data.description, createdBy: 'You' });
            setEditingEngine(null);
            showToast(`Engine "${data.name}" created as a new version!`, 'success');
          }}
        />
      )}

      <div className="secondary-content ai-engine-panel">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Engine name</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Created by</TableHeader>
              <TableHeader>Last updated</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Controls</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {aiEngines.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="ai-engine-name">{row.name}</span>
                </TableCell>
                <TableCell className="ai-engine-muted">{row.description}</TableCell>
                <TableCell>{row.createdBy}</TableCell>
                <TableCell className="ai-engine-muted">{row.lastUpdated}</TableCell>
                <TableCell>
                  <Badge
                    variant={row.type === 'System' ? 'default' : 'info'}
                  >
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.editable ? (
                    <div className="ai-engine-controls">
                      <button
                        type="button"
                        className="ai-engine-icon-btn"
                        title="Edit engine"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => setEditingEngine(row)}
                      >
                        <Icon name="edit" weight="bold" size="sm" />
                      </button>
                      <button
                        type="button"
                        className="ai-engine-icon-btn ai-engine-icon-btn--danger"
                        title="Delete engine"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => { removeAiEngine(row.id); showToast(`Engine "${row.name}" deleted`, 'success'); }}
                      >
                        <Icon name="delete" weight="bold" size="sm" />
                      </button>
                    </div>
                  ) : (
                    <span className="ai-engine-controls-placeholder" aria-hidden>
                      —
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
