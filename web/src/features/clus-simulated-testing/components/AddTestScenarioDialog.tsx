import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../components/shared/Modal';
import {
  Button,
  Input,
  Option,
  Select,
  Selectlistbox,
  Slider,
  Textarea,
} from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { optimizeScenarioCopyAsync } from '../optimize-scenario-copy';
import {
  applyManualScenarioDraftToExistingRow,
  createGeneratedTestScenarioRowBatch,
  createManualTestScenarioRow,
  type ScenarioVariableRow,
  type TestScenarioRow,
} from '../simulated-testing-data';

/** `id` matches `ScenarioVariableRow.id` from the Variables tab. */
type ScenarioVariablePick = { id: string; value: string };

function firstMeaningfulLine(...blocks: string[]): string {
  for (const block of blocks) {
    const firstLine = block
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (firstLine) {
      return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
    }
  }
  return '';
}

/** Display name for the row: explicit title, else first line of description / instructions / outcome. */
function resolvedManualScenarioName(
  scenarioName: string,
  description: string,
  instructions: string,
  expectedOutcome: string,
): string {
  const trimmed = scenarioName.trim();
  if (trimmed) return trimmed;
  return firstMeaningfulLine(description, instructions, expectedOutcome);
}

function variableOptionLabel(row: ScenarioVariableRow): string {
  const v = row.defaultValue.trim();
  const inParen = v.length > 0 ? v : '—';
  return `${row.name} (${inParen})`;
}

type CreationMethod = 'manual' | 'generate';

const CREATIVITY_LABELS = ['Low', 'Mid', 'High'] as const;

export interface AddTestScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restores focus to the trigger when the dialog closes (Momentum `triggerID`). */
  triggerID: string;
  /** When set, dialog prefills from this row and primary action saves edits. */
  scenarioToEdit?: TestScenarioRow | null;
  /** When set (create flow), prefills fields from this row; saving creates a new scenario. */
  scenarioToDuplicate?: TestScenarioRow | null;
  /** Appends rows to the test scenarios table. Parent decides ordering and page reset. */
  onAddScenarios: (rows: TestScenarioRow[]) => void;
  /** Persists edits for `scenarioToEdit` (same id). */
  onSaveEditedScenario?: (row: TestScenarioRow) => void;
  /** Same list as the Variables tab (sample + user-defined). */
  variablesFromTab: ScenarioVariableRow[];
}

function DialogSection({
  title,
  subtitle,
  toolbar,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`add-test-scenario-dialog-section${className ? ` ${className}` : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className={`m-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>{title}</h3>
          <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>{subtitle}</p>
        </div>
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function AddTestScenarioDialog({
  open,
  onOpenChange,
  scenarioToEdit = null,
  scenarioToDuplicate = null,
  onAddScenarios,
  onSaveEditedScenario,
  variablesFromTab,
}: AddTestScenarioDialogProps) {
  const isEditMode = Boolean(scenarioToEdit);
  const isDuplicatePrefill = Boolean(scenarioToDuplicate) && !isEditMode;
  const hideCreationMethodChooser = isEditMode || isDuplicatePrefill;
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('manual');
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [variableSelectValue, setVariableSelectValue] = useState('');
  const [scenarioVariableRows, setScenarioVariableRows] = useState<ScenarioVariablePick[]>([]);
  const [generateTestCaseCount, setGenerateTestCaseCount] = useState('1');
  const [creativityLevel, setCreativityLevel] = useState(2);
  const [generateCustomInstructions, setGenerateCustomInstructions] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const optimizeGenRef = useRef(0);

  useEffect(() => {
    if (!open) {
      optimizeGenRef.current += 1;
      setIsOptimizing(false);
      return;
    }
    setCreationMethod('manual');
    setOptimizeError(null);
    setFormSubmitError(null);
    const prefillSource = scenarioToEdit ?? scenarioToDuplicate;
    if (prefillSource) {
      setScenarioName(prefillSource.name ?? '');
      setDescription(prefillSource.description ?? '');
      setInstructions(prefillSource.instructions ?? '');
      setExpectedOutcome(prefillSource.expectedOutcome ?? '');
      setVariableSelectValue('');
      setScenarioVariableRows(
        prefillSource.scenarioVariablePicks?.map((p) => ({ id: p.id, value: p.value ?? '' })) ?? [],
      );
      setGenerateTestCaseCount('1');
      setCreativityLevel(2);
      setGenerateCustomInstructions('');
      return;
    }
    setScenarioName('');
    setDescription('');
    setInstructions('');
    setExpectedOutcome('');
    setVariableSelectValue('');
    setScenarioVariableRows([]);
    setGenerateTestCaseCount('1');
    setCreativityLevel(2);
    setGenerateCustomInstructions('');
  }, [open, scenarioToEdit, scenarioToDuplicate]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleOptimize = async () => {
    if (!instructions.trim() && !expectedOutcome.trim()) {
      setOptimizeError('Enter text in Instructions or Expected outcome to optimize.');
      return;
    }
    const gen = (optimizeGenRef.current += 1);
    setOptimizeError(null);
    setIsOptimizing(true);
    try {
      const next = await optimizeScenarioCopyAsync(instructions, expectedOutcome);
      if (gen !== optimizeGenRef.current) return;
      setInstructions(next.instructions);
      setExpectedOutcome(next.expectedOutcome);
    } catch {
      if (gen !== optimizeGenRef.current) return;
      setOptimizeError('Could not optimize copy. Try again.');
    } finally {
      if (gen === optimizeGenRef.current) {
        setIsOptimizing(false);
      }
    }
  };

  const handleAddVariable = () => {
    if (!variableSelectValue) return;
    if (scenarioVariableRows.some((r) => r.id === variableSelectValue)) return;
    const row = variablesFromTab.find((v) => v.id === variableSelectValue);
    if (!row) return;
    setScenarioVariableRows((prev) => [...prev, { id: row.id, value: row.defaultValue }]);
    setVariableSelectValue('');
  };

  const handleRemoveScenarioVariable = (id: string) => {
    setScenarioVariableRows((prev) => prev.filter((r) => r.id !== id));
  };

  const variableMeta = (id: string) => variablesFromTab.find((v) => v.id === id);

  const variablesAvailableToAdd = variablesFromTab.filter(
    (v) => !scenarioVariableRows.some((r) => r.id === v.id),
  );

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const title = isEditMode ? 'Edit test scenario' : 'Add test scenario';
  const descriptionText = isEditMode
    ? 'Update scenario details and save your changes'
    : isDuplicatePrefill
      ? 'Review the copied details and create a new scenario'
      : 'Create a new test scenario or generate one automatically';

  return (
    <Modal
      className="add-test-scenario-dialog"
      overlayClassName="add-test-scenario-dialog-overlay"
      size="lg"
      onClose={handleClose}
      preventBackdropClose
    >
      <ModalHeader title={title} description={descriptionText} onClose={handleClose} />
      <ModalBody className="add-test-scenario-dialog-body flex flex-col gap-6">
        <>
          {formSubmitError ? (
            <p role="alert" className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textError}`}>
              {formSubmitError}
            </p>
          ) : null}
          {!hideCreationMethodChooser ? (
            <div className="flex min-w-0 flex-col gap-6">
              <p className={`m-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                Choose how you want to build this test scenario
              </p>
              <div
                className="add-test-scenario-method-cards-row"
                role="group"
                aria-label="How to create this test scenario"
              >
                <button
                  type="button"
                  className={`add-test-scenario-method-card ${
                    creationMethod === 'manual' ? 'add-test-scenario-method-card--selected' : ''
                  }`}
                  role="radio"
                  aria-checked={creationMethod === 'manual'}
                  onClick={() => setCreationMethod('manual')}
                >
                  <span className={`add-test-scenario-method-card__title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                    Create manually
                  </span>
                  <span className={`add-test-scenario-method-card__body ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                    Uses natural language processing to follow your set logic and responses.
                  </span>
                </button>
                <button
                  type="button"
                  className={`add-test-scenario-method-card ${
                    creationMethod === 'generate' ? 'add-test-scenario-method-card--selected' : ''
                  }`}
                  role="radio"
                  aria-checked={creationMethod === 'generate'}
                  onClick={() => setCreationMethod('generate')}
                >
                  <span className={`add-test-scenario-method-card__title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                    Generate a scenario
                  </span>
                  <span className={`add-test-scenario-method-card__body ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                    Uses generative AI to create dynamic responses.
                  </span>
                </button>
              </div>
            </div>
          ) : null}

            {creationMethod === 'manual' || isEditMode || isDuplicatePrefill ? (
              <>
                <DialogSection
                  title="Basic information"
                  subtitle="Define the test scenario name and description"
                >
                  <Input
                    label="Test scenario name"
                    placeholder="e.g., Customer support excellence test"
                    value={scenarioName}
                    required
                    onInput={(e: Event) => {
                      setFormSubmitError(null);
                      setScenarioName((e.target as HTMLInputElement & { value?: string }).value ?? '');
                    }}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Enter description"
                    toggletipText="Optional details about intent, audience, or scope for reviewers."
                    value={description}
                    rows={4}
                    onInput={(e: Event) =>
                      setDescription((e.target as HTMLInputElement).value ?? '')
                    }
                  />
                  <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                    Testing is currently available only for Digital Channels and Functional Test type.
                  </p>
                </DialogSection>

                <DialogSection
                  title="Instructions & expected outcome"
                  subtitle="Define what the agent should do and what success looks like"
                  toolbar={
                    <Button
                      type="button"
                      variant="secondary"
                      color="default"
                      size={32}
                      prefixIcon="sparkle-bold"
                      disabled={isOptimizing}
                      onClick={() => void handleOptimize()}
                    >
                      {isOptimizing ? 'Optimizing…' : 'Optimize'}
                    </Button>
                  }
                >
                  {optimizeError ? (
                    <p
                      role="alert"
                      className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textError}`}
                    >
                      {optimizeError}
                    </p>
                  ) : null}
                  <Textarea
                    label="Instructions"
                    placeholder="Define what the agent should do in this scenario"
                    value={instructions}
                    rows={5}
                    onInput={(e: Event) => {
                      setOptimizeError(null);
                      setInstructions((e.target as HTMLInputElement).value ?? '');
                    }}
                  />
                  <Textarea
                    label="Expected outcome"
                    placeholder="Define the expected behavior and outcomes when the test passes"
                    value={expectedOutcome}
                    rows={5}
                    onInput={(e: Event) => {
                      setOptimizeError(null);
                      setExpectedOutcome((e.target as HTMLInputElement).value ?? '');
                    }}
                  />
                </DialogSection>

                <DialogSection
                  title="Test variables"
                  subtitle="Variables come from the Variables tab. Choose one, then add it to this scenario."
                  className="add-test-scenario-dialog-section--test-variables"
                >
                  <div className="add-test-scenario-variable-toolbar flex min-w-0 flex-row items-end gap-4">
                    <div className="add-test-scenario-dialog-select-cell min-w-0 flex-1">
                      <Select
                        label="Select variable"
                        placeholder={
                          variablesFromTab.length === 0
                            ? 'No variables defined yet'
                            : 'Select variable'
                        }
                        value={variableSelectValue}
                        placement="bottom-start"
                        disableFlip
                        strategy="absolute"
                        onChange={(e: Event) =>
                          setVariableSelectValue((e.target as HTMLElement & { value?: string }).value ?? '')
                        }
                      >
                        <Selectlistbox>
                          {variablesAvailableToAdd.map((v) => (
                            <Option
                              key={v.id}
                              value={v.id}
                              label={variableOptionLabel(v)}
                              variant="inset-rectangle"
                              selected={variableSelectValue === v.id}
                            />
                          ))}
                        </Selectlistbox>
                      </Select>
                    </div>
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        color="default"
                        size={32}
                        onClick={handleAddVariable}
                        disabled={!variableSelectValue}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  {scenarioVariableRows.length > 0 ? (
                    <div className="min-w-0">
                      <div className={clusKpiTable.card}>
                        <div className={clusKpiTable.scroll}>
                          <table className={`${clusKpiTable.table} w-full table-fixed`}>
                            <colgroup>
                              <col className="min-w-0" />
                              <col className="w-[3rem]" />
                            </colgroup>
                            <thead className={clusKpiTable.thead}>
                              <tr className={clusKpiTable.theadRow}>
                                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                                  Variable
                                </th>
                                <th scope="col" className={`!text-right ${clusKpiTable.th}`}>
                                  Controls
                                </th>
                              </tr>
                            </thead>
                            <tbody className={clusKpiTable.tbody}>
                              {scenarioVariableRows.map((pick) => {
                                const meta = variableMeta(pick.id);
                                const name = meta?.name ?? 'Variable';
                                const valueShown = pick.value.trim()
                                  ? pick.value
                                  : meta?.defaultValue.trim()
                                    ? meta.defaultValue
                                    : '—';
                                const nameWithValue = `${name} (${valueShown})`;
                                return (
                                  <tr key={pick.id} className={clusKpiTable.tr}>
                                    <td className={`${clusKpiTable.td} min-w-0`}>
                                      <span className={`${ck.typo.bodyMidsizeMedium} font-semibold ${ck.text}`}>
                                        {nameWithValue}
                                      </span>
                                    </td>
                                    <td className={`${clusKpiTable.td} w-[3rem] text-right align-middle`}>
                                      <Button
                                        type="button"
                                        variant="tertiary"
                                        color="default"
                                        size={32}
                                        prefixIcon="delete-bold"
                                        aria-label={`Remove ${name}`}
                                        onClick={() => handleRemoveScenarioVariable(pick.id)}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DialogSection>
              </>
            ) : (
              <div className="flex min-w-0 flex-col gap-6">
                <Input
                  label="Number of test cases"
                  placeholder="Enter number (1-10)"
                  helpText="Maximum 10 test cases per generation"
                  value={generateTestCaseCount}
                  onInput={(e: Event) => {
                    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                    if (raw === '') {
                      setGenerateTestCaseCount('');
                      return;
                    }
                    const n = Math.min(10, Math.max(1, Number.parseInt(raw, 10)));
                    setGenerateTestCaseCount(String(Number.isNaN(n) ? 1 : n));
                  }}
                  onBlur={() => {
                    if (generateTestCaseCount === '' || generateTestCaseCount === '0') {
                      setGenerateTestCaseCount('1');
                    }
                  }}
                />

                <div className="flex min-w-0 flex-col gap-2">
                  <span className={`${ck.typo.bodyMidsizeMedium} ${ck.text}`}>Creativity level</span>
                  <div className="add-test-scenario-creativity-slider">
                    <Slider
                      min={0}
                      max={2}
                      step={1}
                      value={creativityLevel}
                      hideTooltip
                      dataAriaLabel="Creativity level"
                      dataAriaValuetext={CREATIVITY_LABELS[creativityLevel]}
                      onInput={(e: Event) =>
                        setCreativityLevel(Number((e.target as HTMLInputElement).value))
                      }
                    />
                    <div
                      className={`add-test-scenario-creativity-slider-labels mt-2 flex w-full flex-nowrap items-baseline justify-between gap-2 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}
                      aria-hidden
                    >
                      <span className="shrink-0 whitespace-nowrap">Low</span>
                      <span className="shrink-0 whitespace-nowrap">Mid</span>
                      <span className="shrink-0 whitespace-nowrap">High</span>
                    </div>
                  </div>
                  <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                    Higher creativity generates more diverse and exploratory test scenarios
                  </p>
                </div>

                <Textarea
                  label="Custom instructions (optional)"
                  helpText="The AI will generate multiple test scenarios based on these requirements."
                  placeholder="Describe what you want the test scenarios to evaluate..."
                  value={generateCustomInstructions}
                  rows={6}
                  onInput={(e: Event) =>
                    setGenerateCustomInstructions((e.target as HTMLInputElement).value ?? '')
                  }
                />
              </div>
            )}
        </>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          color="default"
          variant="secondary"
          size={32}
          onClick={handleClose}
        >
          Cancel
        </Button>
        {isEditMode ? (
          <Button
            type="button"
            color="default"
            variant="primary"
            size={32}
            onClick={() => {
              const resolvedName = resolvedManualScenarioName(
                scenarioName,
                description,
                instructions,
                expectedOutcome,
              );
              if (!resolvedName) {
                setFormSubmitError(
                  'Enter a test scenario name, description, or text under Instructions / Expected outcome.',
                );
                return;
              }
              if (!scenarioToEdit) return;
              setFormSubmitError(null);
              const draft = {
                name: resolvedName,
                description: description.trim(),
                instructions: instructions.trim(),
                expectedOutcome: expectedOutcome.trim(),
                scenarioVariablePicks: scenarioVariableRows,
              };
              onSaveEditedScenario?.(applyManualScenarioDraftToExistingRow(scenarioToEdit, draft));
              handleClose();
            }}
          >
            Save scenario
          </Button>
        ) : creationMethod === 'manual' ? (
          <Button
            type="button"
            color="default"
            variant="primary"
            size={32}
            disabled={!scenarioName.trim() || scenarioVariableRows.length === 0}
            onClick={() => {
              const resolvedName = resolvedManualScenarioName(
                scenarioName,
                description,
                instructions,
                expectedOutcome,
              );
              if (!resolvedName) {
                setFormSubmitError(
                  'Enter a test scenario name, description, or text under Instructions / Expected outcome.',
                );
                return;
              }
              setFormSubmitError(null);
              onAddScenarios([
                createManualTestScenarioRow({
                  name: resolvedName,
                  description: description.trim(),
                  instructions: instructions.trim(),
                  expectedOutcome: expectedOutcome.trim(),
                  scenarioVariablePicks: scenarioVariableRows,
                }),
              ]);
              handleClose();
            }}
          >
            Create scenario
          </Button>
        ) : (
          <Button
            type="button"
            color="default"
            variant="primary"
            size={32}
            prefixIcon="sparkle-bold"
            onClick={() => {
              setFormSubmitError(null);
              const raw = generateTestCaseCount.trim();
              const parsed = raw === '' ? 1 : Number.parseInt(raw, 10);
              const n = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
              onAddScenarios(createGeneratedTestScenarioRowBatch(n));
              handleClose();
            }}
          >
            Generate scenarios
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
