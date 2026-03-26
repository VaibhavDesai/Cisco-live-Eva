import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../components/shared/Button';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Icon } from '../../icons';

interface InputEntity {
  id: string;
  name: string;
  type: string;
  value: string;
  description: string;
  example: string;
  required: boolean;
}

interface CreateFulfillmentModalProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    serverName: string;
    entities: InputEntity[];
  }) => void;
}

const SAMPLE_ENTITIES: InputEntity[] = [
  {
    id: 'e1',
    name: 'Customer ID',
    type: 'Digits',
    value: '6',
    description: 'A series of digits of the given length',
    example: '123456',
    required: true,
  },
  {
    id: 'e2',
    name: 'Email',
    type: 'Email',
    value: String.raw`\w+([.-]\w+)*@(\w+([.-]\w+)*\.\w+([.-]\w+)*`,
    description: 'A valid email address',
    example: 'test.user@company.com',
    required: false,
  },
];

export default function CreateFulfillmentModal({ onClose, onSave }: CreateFulfillmentModalProps) {
  const [serverName] = useState('Salesforce');
  const [actionName, setActionName] = useState('Get customer record');
  const [actionDescription] = useState(
    'Find a record of a specific Salesforce object by up to two fields and values you choose.',
  );
  const [entities] = useState<InputEntity[]>(SAMPLE_ENTITIES);

  const canSave = actionName.trim().length > 0;

  return createPortal(
    <div className="fpmodal-overlay">
      <div
        className="fpmodal"
        role="dialog"
        aria-modal="true"
        aria-label="Create fulfillment action"
      >
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">{actionName || 'New fulfillment action'}</h1>
            <p className="fpmodal-subtitle">
              Enable your AI agent to connect with external systems and perform more complex tasks.
            </p>
          </div>
          <button className="fpmodal-close" onClick={onClose} aria-label="Close">
            <Icon name="cancel" weight="bold" size={32} />
          </button>
        </div>

        <div className="fpmodal-body fulfillment-body">
          <div className="fulfillment-content">
            {/* General information */}
            <section className="fulfillment-section">
              <h2 className="fulfillment-section-title">General information</h2>
              <div className="fulfillment-card">
                <div className="fulfillment-readonly-field">
                  <span className="fulfillment-readonly-label">MCP server name</span>
                  <span className="fulfillment-readonly-value">{serverName}</span>
                </div>

                <Input
                  label="Action name"
                  required
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="Enter action name"
                  clearable
                  onClear={() => setActionName('')}
                />

                <div className="fulfillment-textarea-wrap">
                  <div className="fulfillment-textarea-label">
                    <span>Action description</span>
                    <span className="fulfillment-required">*</span>
                    <button type="button" className="fulfillment-info-btn" aria-label="Info">
                      <Icon name="info-circle" weight="bold" size={16} />
                    </button>
                  </div>
                  <Textarea
                    value={actionDescription}
                    disabled
                    rows={5}
                    placeholder="Describe what this action does..."
                  />
                </div>
              </div>
            </section>

            {/* Slot filling */}
            <section className="fulfillment-section">
              <div className="fulfillment-section-header">
                <h2 className="fulfillment-section-title">Slot filling</h2>
                <p className="fulfillment-section-subtitle">
                  See the information that will be gathered.
                </p>
              </div>

              <div className="fulfillment-card">
                <div className="fulfillment-table-header">
                  <span className="fulfillment-table-header-label">Input entities</span>
                  <div className="fulfillment-table-header-actions">
                    <Button variant="secondary" size="sm">
                      <Icon name="text-code-block" weight="bold" size={16} />
                      See JSON schema
                    </Button>
                    <Icon name="info-circle" weight="bold" size={16} className="fulfillment-info-icon" />
                  </div>
                </div>

                <div className="fulfillment-table-wrap">
                  <table className="fulfillment-table">
                    <thead>
                      <tr>
                        <th style={{ width: 180 }}>Entity name</th>
                        <th style={{ width: 120 }}>Type</th>
                        <th>Value</th>
                        <th>Description</th>
                        <th>Example</th>
                        <th style={{ width: 100 }}>Required</th>
                        <th style={{ width: 56 }}>Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map((entity) => (
                        <tr key={entity.id}>
                          <td>{entity.name}</td>
                          <td>{entity.type}</td>
                          <td className="fulfillment-td-mono">{entity.value}</td>
                          <td>{entity.description}</td>
                          <td className="fulfillment-td-example">{entity.example}</td>
                          <td>{entity.required ? 'Yes' : 'No'}</td>
                          <td>
                            <button type="button" className="fulfillment-edit-btn" aria-label="Edit entity">
                              <Icon name="edit" weight="bold" size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="fpmodal-footer">
          <div className="fpmodal-footer__actions">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSave}
              onClick={() =>
                onSave({
                  name: actionName.trim(),
                  description: actionDescription,
                  serverName,
                  entities,
                })
              }
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
