import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Dialog, Input, Option, Select, Selectlistbox } from '../momentum';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { formatVariableDateAdded, type ScenarioVariableRow } from '../simulated-testing-data';
import { suggestedAdditionalVariableNames } from '../suggested-variable-names';

export interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerID: string;
  /** Names already used (sample + user-defined), case-sensitive match to `ScenarioVariableRow.name`. */
  reservedNames: ReadonlySet<string>;
  onAddVariables: (rows: ScenarioVariableRow[]) => void;
  /** When provided, the dialog opens in edit mode for this row. */
  editRow?: ScenarioVariableRow | null;
  /** Called when the user saves an edited variable. */
  onSaveVariable?: (row: ScenarioVariableRow) => void;
}

type PendingRow = { key: string; name: string; value: string; description: string };

function DialogSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="add-test-scenario-dialog-section">
      <div className="min-w-0 space-y-2">
        <h3 className={`m-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>{title}</h3>
        {subtitle ? (
          <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function suggestionMeta(name: string): string {
  return (
    suggestedAdditionalVariableNames.find((s) => s.name === name)?.description ??
    'User-defined variable for scenario testing.'
  );
}

export function AddVariableDialog({
  open,
  onOpenChange,
  triggerID,
  reservedNames,
  onAddVariables,
  editRow = null,
  onSaveVariable,
}: AddVariableDialogProps) {
  const isEditMode = editRow != null;
  const [nameSelectValue, setNameSelectValue] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const pendingNames = useMemo(() => new Set(pendingRows.map((r) => r.name)), [pendingRows]);

  const nameOptions = useMemo(
    () =>
      suggestedAdditionalVariableNames.filter(
        (s) => !reservedNames.has(s.name) && !pendingNames.has(s.name),
      ),
    [reservedNames, pendingNames],
  );

  /** Suggested names available for one pending row (current name stays selectable; others blocked). */
  const nameOptionsForPendingRow = (rowKey: string, currentName: string) => {
    const usedElsewhere = new Set(
      pendingRows.filter((r) => r.key !== rowKey).map((r) => r.name),
    );
    return suggestedAdditionalVariableNames.filter(
      (s) =>
        s.name === currentName ||
        (!reservedNames.has(s.name) && !usedElsewhere.has(s.name)),
    );
  };

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editRow) {
      setNameSelectValue(editRow.name);
      setValueInput(editRow.defaultValue);
    } else {
      setNameSelectValue('');
      setValueInput('');
    }
    setPendingRows([]);
    setFormError(null);
  }, [open, isEditMode, editRow]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleToolbarAdd = () => {
    const name = nameSelectValue.trim();
    const value = valueInput.trim();
    if (!name) {
      setFormError('Select a variable name.');
      return;
    }
    if (!value) {
      setFormError('Enter a test value.');
      return;
    }
    if (reservedNames.has(name) || pendingNames.has(name)) {
      setFormError('That variable name is already in use.');
      return;
    }
    setFormError(null);
    setPendingRows((prev) => [
      ...prev,
      {
        key: `pending-${crypto.randomUUID()}`,
        name,
        value,
        description: suggestionMeta(name),
      },
    ]);
    setNameSelectValue('');
    setValueInput('');
  };

  const handleRemovePending = (key: string) => {
    setPendingRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handlePendingNameChange = (rowKey: string, newName: string) => {
    setFormError(null);
    setPendingRows((prev) =>
      prev.map((r) =>
        r.key === rowKey ? { ...r, name: newName, description: suggestionMeta(newName) } : r,
      ),
    );
  };

  const handlePendingValueChange = (rowKey: string, value: string) => {
    setFormError(null);
    setPendingRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, value } : r)));
  };

  const canConfirm =
    pendingRows.length > 0 && pendingRows.every((r) => r.name.trim() && r.value.trim());

  const canSaveEdit = isEditMode && nameSelectValue.trim() !== '' && valueInput.trim() !== '';

  const handleConfirm = () => {
    if (isEditMode) {
      if (!canSaveEdit || !editRow) return;
      onSaveVariable?.({
        ...editRow,
        name: nameSelectValue.trim(),
        defaultValue: valueInput.trim(),
        description: suggestionMeta(nameSelectValue.trim()),
      });
      handleClose();
      return;
    }
    if (!canConfirm) return;
    const rows: ScenarioVariableRow[] = pendingRows.map((r) => ({
      id: `user-var-${crypto.randomUUID()}`,
      name: r.name.trim(),
      defaultValue: r.value.trim(),
      description: suggestionMeta(r.name.trim()),
      dateAdded: formatVariableDateAdded(new Date()),
      addedBy: 'current.user',
    }));
    onAddVariables(rows);
    handleClose();
  };

  const portalTarget =
    typeof document !== 'undefined' ? document.querySelector('mdc-iconprovider') ?? document.body : null;

  if (typeof document === 'undefined' || !portalTarget) {
    return null;
  }

  return createPortal(
    <Dialog
      className="add-variable-dialog"
      visible={open}
      size="large"
      headerText={isEditMode ? 'Edit variable' : 'Add variable'}
      descriptionText={
        isEditMode
          ? 'Update the variable name and value'
          : 'Create a new variable for your testing scenarios'
      }
      closeButtonAriaLabel="Close dialog"
      triggerID={triggerID}
      onClose={handleClose}
    >
      <div slot="dialog-body" className="add-variable-dialog-body flex flex-col gap-6">
        <DialogSection title="Variable details">
          <div className="add-variable-dialog-form flex min-w-0 flex-row items-start gap-4">
            <div className="add-variable-dialog-select-cell min-w-0 flex-1">
              {isEditMode ? (
                <Input
                  label="Variable name"
                  placeholder="Variable name"
                  value={nameSelectValue}
                  onInput={(e: Event) => {
                    setFormError(null);
                    setNameSelectValue((e.target as HTMLInputElement & { value?: string }).value ?? '');
                  }}
                />
              ) : (
                <Select
                  label="Variable name"
                  placeholder="Select variable"
                  value={nameSelectValue}
                  disabled={nameOptions.length === 0}
                  placement="bottom-start"
                  disableFlip
                  strategy="fixed"
                  onChange={(e: Event) => {
                    setFormError(null);
                    setNameSelectValue((e.target as HTMLElement & { value?: string }).value ?? '');
                  }}
                >
                  <Selectlistbox>
                    {nameOptions.map((s) => (
                      <Option
                        key={s.name}
                        value={s.name}
                        label={s.name}
                        variant="inset-rectangle"
                        selected={nameSelectValue === s.name}
                      />
                    ))}
                  </Selectlistbox>
                </Select>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Input
                label="Value"
                placeholder="Enter the test value"
                value={valueInput}
                onInput={(e: Event) => {
                  setFormError(null);
                  setValueInput((e.target as HTMLInputElement & { value?: string }).value ?? '');
                }}
              />
            </div>
          </div>
          {formError ? (
            <p role="alert" className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textError}`}>
              {formError}
            </p>
          ) : null}

          {!isEditMode && (
            <>
              {nameOptions.length === 0 ? (
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                  {pendingRows.length > 0
                    ? 'No further suggested names are available. Remove a row to change a name, or confirm to save these variables.'
                    : 'All suggested variable names are already in use in this workspace.'}
                </p>
              ) : null}

              {pendingRows.map((row) => {
                const rowNameOptions = nameOptionsForPendingRow(row.key, row.name);
                return (
                  <div key={row.key} className="add-variable-dialog-form flex min-w-0 flex-row items-start gap-4">
                    <div className="add-variable-dialog-select-cell min-w-0 flex-1">
                      <Select
                        label="Variable name"
                        placeholder="Select variable"
                        value={row.name}
                        disabled={rowNameOptions.length === 0}
                        placement="bottom-start"
                        disableFlip
                        strategy="fixed"
                        onChange={(e: Event) => {
                          const v = (e.target as HTMLElement & { value?: string }).value ?? '';
                          handlePendingNameChange(row.key, v);
                        }}
                      >
                        <Selectlistbox>
                          {rowNameOptions.map((s) => (
                            <Option
                              key={s.name}
                              value={s.name}
                              label={s.name}
                              variant="inset-rectangle"
                              selected={row.name === s.name}
                            />
                          ))}
                        </Selectlistbox>
                      </Select>
                    </div>
                    <div className="add-variable-dialog-value-with-action flex min-w-0 flex-1 flex-row items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <Input
                          label="Value"
                          placeholder="Enter the test value"
                          value={row.value}
                          onInput={(e: Event) => {
                            handlePendingValueChange(
                              row.key,
                              (e.target as HTMLInputElement & { value?: string }).value ?? '',
                            );
                          }}
                        />
                      </div>
                      <div className="shrink-0">
                        <Button
                          type="button"
                          variant="tertiary"
                          color="default"
                          size={32}
                          prefixIcon="delete-bold"
                          aria-label={`Remove ${row.name}`}
                          onClick={() => handleRemovePending(row.key)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  color="default"
                  size={32}
                  onClick={handleToolbarAdd}
                  disabled={!nameSelectValue || !valueInput.trim()}
                >
                  + Add
                </Button>
              </div>
            </>
          )}
        </DialogSection>
      </div>

      <Button slot="footer-button-secondary" color="default" variant="secondary" size={32} onClick={handleClose}>
        Cancel
      </Button>
      <Button
        slot="footer-button-primary"
        color="default"
        variant="primary"
        size={32}
        disabled={isEditMode ? !canSaveEdit : !canConfirm}
        onClick={handleConfirm}
      >
        {isEditMode ? 'Save variable' : 'Add variable'}
      </Button>
    </Dialog>,
    portalTarget,
  );
}
