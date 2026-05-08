import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Button,
  Searchfield,
} from '../momentum';
import Tabs, { Tab } from '../../../components/shared/Tabs';
import SharedButton from '../../../components/shared/Button';
import { MenuItem, MenuOverlay } from '../../../components/shared/Menu';
import { Icon } from '../../../icons/Icon';
import { TestingScenariosTab } from './TestingScenariosTab';
import { TestingVariablesTab } from './TestingVariablesTab';
import { AddTestScenarioDialog } from './AddTestScenarioDialog';
import { AddVariableDialog } from './AddVariableDialog';
import { DeleteScenarioConfirmDialog } from './DeleteScenarioConfirmDialog';
import { DeleteVariableConfirmDialog } from './DeleteVariableConfirmDialog';
import { RunEvaluationDescriptionDialog } from './RunEvaluationDescriptionDialog';
import {
  sampleScenarioVariables,
  sampleScenarios,
  type ScenarioVariableRow,
  type TestScenarioRow,
} from '../simulated-testing-data';
import { useSimulatedTestingResults } from '../simulated-testing-results-context';

type ScenariosSubTabId = 'scenarios' | 'variables';

/**
 * Momentum Web Component Library — Simple Buttons / Pill Button, Size=32px (compact toolbar)
 * @see https://www.figma.com/design/9qhjTsC97Q3W8ZsbnTiZho/%F0%9F%A7%A9-Momentum-Web---Component-Library?node-id=41876-1155919
 */
const SCENARIOS_TOOLBAR_PILL_SIZE = 32 as const;

export function TestingScenariosSection() {
  const {
    startEvaluationRun,
    userScenarios,
    setUserScenarios,
    sampleScenarioOverrides,
    setSampleScenarioOverrides,
    removedSampleScenarioIds,
    setRemovedSampleScenarioIds,
    userScenarioVariables,
    setUserScenarioVariables,
    sampleVariableOverrides,
    setSampleVariableOverrides,
    removedSampleVariableIds,
    setRemovedSampleVariableIds,
    runningScenarioIds,
    setRunningScenarioIds,
  } = useSimulatedTestingResults();
  const [activeSubTab, setActiveSubTab] = useState<ScenariosSubTabId>('scenarios');
  const [scenarioSearchQuery, setScenarioSearchQuery] = useState('');
  const [variableSearchQuery, setVariableSearchQuery] = useState('');
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(() => new Set());
  const addScenarioTriggerId = useId().replace(/:/g, '');
  const addVariableTriggerId = useId().replace(/:/g, '');
  const runTestsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [runTestsMenuOpen, setRunTestsMenuOpen] = useState(false);
  const [addScenarioDialogOpen, setAddScenarioDialogOpen] = useState(false);
  const [addVariableDialogOpen, setAddVariableDialogOpen] = useState(false);
  const [editVariableRow, setEditVariableRow] = useState<ScenarioVariableRow | null>(null);
  const [runEvaluationDialogOpen, setRunEvaluationDialogOpen] = useState(false);
  const [pendingRunScope, setPendingRunScope] = useState<'selected' | 'all' | null>(null);
  const [pendingDeleteVariable, setPendingDeleteVariable] = useState<ScenarioVariableRow | null>(null);
  const [scenarioToEdit, setScenarioToEdit] = useState<TestScenarioRow | null>(null);
  const [scenarioToDuplicate, setScenarioToDuplicate] = useState<TestScenarioRow | null>(null);
  const [pendingDeleteScenario, setPendingDeleteScenario] = useState<TestScenarioRow | null>(null);
  /** Bumped each time scenarios are added so the table can reset sort/page to surface the new rows. */
  const [scenarioAddedSignal, setScenarioAddedSignal] = useState(0);

  const effectiveSampleScenarios = useMemo(
    () =>
      sampleScenarios
        .filter((s) => !removedSampleScenarioIds.has(s.id))
        .map((s) => sampleScenarioOverrides.get(s.id) ?? s),
    [sampleScenarioOverrides, removedSampleScenarioIds],
  );

  const effectiveSampleVariables = useMemo(
    () =>
      sampleScenarioVariables
        .filter((v) => !removedSampleVariableIds.has(v.id))
        .map((v) => sampleVariableOverrides.get(v.id) ?? v),
    [sampleVariableOverrides, removedSampleVariableIds],
  );

  const variablesForScenarioDialog = useMemo(
    () => [...effectiveSampleVariables, ...userScenarioVariables],
    [effectiveSampleVariables, userScenarioVariables],
  );

  const reservedVariableNames = useMemo(() => {
    const s = new Set<string>();
    for (const v of effectiveSampleVariables) {
      s.add(v.name);
    }
    for (const v of userScenarioVariables) {
      s.add(v.name);
    }
    return s;
  }, [effectiveSampleVariables, userScenarioVariables]);

  useEffect(() => {
    if (activeSubTab !== 'scenarios') {
      setSelectedScenarioIds(new Set());
    }
  }, [activeSubTab]);

  const selectedCount = selectedScenarioIds.size;

  const allScenarioIds = useMemo(
    () => new Set([...userScenarios, ...effectiveSampleScenarios].map((r) => r.id)),
    [userScenarios, effectiveSampleScenarios],
  );

  const openRunEvaluationDialog = (scope: 'selected' | 'all') => {
    setPendingRunScope(scope);
    setRunEvaluationDialogOpen(true);
  };

  const handleRunEvaluationOpenChange = (open: boolean) => {
    setRunEvaluationDialogOpen(open);
    if (!open) {
      setPendingRunScope(null);
    }
  };

  const handleRunEvaluationConfirm = (_description: string) => {
    if (!pendingRunScope) return;
    const ids =
      pendingRunScope === 'selected' ? new Set(selectedScenarioIds) : new Set(allScenarioIds);
    setRunningScenarioIds(ids);

    const allRows = [...userScenarios, ...effectiveSampleScenarios];
    const orderedScenarios: TestScenarioRow[] = [];
    for (const id of ids) {
      const row = allRows.find((r) => r.id === id);
      if (row) orderedScenarios.push(row);
    }
    orderedScenarios.sort((a, b) => {
      const byUpdated = b.lastUpdatedSortKey.localeCompare(a.lastUpdatedSortKey);
      if (byUpdated !== 0) return byUpdated;
      return a.name.localeCompare(b.name);
    });
    startEvaluationRun(orderedScenarios);

    setPendingRunScope(null);
  };

  return (
    <div className="clus-kpi-testing-scenarios-section min-w-0 space-y-4">
      <div className="testing-scenarios-tab-toolbar-row flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="testing-scenarios-tab-toolbar-row__tabs min-w-0 shrink-0">
          <Tabs
            variant="line"
            aria-label="Test scenarios and variables"
            className="testing-scenarios-subtabs"
          >
            <Tab
              id="testing-scenarios-subtab-scenarios"
              aria-controls="testing-scenarios-panel-scenarios"
              active={activeSubTab === 'scenarios'}
              onClick={() => setActiveSubTab('scenarios')}
            >
              Test scenarios
            </Tab>
            <Tab
              id="testing-scenarios-subtab-variables"
              aria-controls="testing-scenarios-panel-variables"
              active={activeSubTab === 'variables'}
              onClick={() => setActiveSubTab('variables')}
            >
              Variables
            </Tab>
          </Tabs>
        </div>

        {activeSubTab === 'scenarios' && (
          <div className="testing-scenarios-tab-toolbar-row__actions flex min-w-0 flex-[1_1_16rem] flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
            <div className="min-w-0 flex-1 clus-kpi-search-wrap sm:max-w-[22rem]">
              <Searchfield
                label=""
                placeholder="Search scenarios..."
                value={scenarioSearchQuery}
                onInput={(e: Event) =>
                  setScenarioSearchQuery((e.target as HTMLElement & { value: string }).value)
                }
                className="clus-kpi-search-input"
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div ref={runTestsAnchorRef} className="relative inline-flex shrink-0">
                <SharedButton
                  variant="secondary"
                  size="sm"
                  className="clus-kpi-run-tests-trigger"
                  aria-haspopup="menu"
                  aria-expanded={runTestsMenuOpen}
                  onClick={() => setRunTestsMenuOpen((open) => !open)}
                >
                  <span className="btn-icon" aria-hidden>
                    <Icon name="play" weight="bold" size={16} />
                  </span>
                  Run tests
                  <span className="btn-icon" aria-hidden>
                    <Icon name="arrow-down" weight="bold" size={16} />
                  </span>
                </SharedButton>
                <MenuOverlay
                  open={runTestsMenuOpen}
                  anchorRef={runTestsAnchorRef}
                  onClose={() => setRunTestsMenuOpen(false)}
                  className="clus-kpi-run-tests-menu"
                >
                  <MenuItem
                    label={`Run selected (${selectedCount})`}
                    disabled={selectedCount === 0}
                    icon="play"
                    onClick={() => {
                      if (selectedCount === 0) return;
                      setRunTestsMenuOpen(false);
                      openRunEvaluationDialog('selected');
                    }}
                  />
                  <MenuItem
                    label="Run all"
                    icon="play"
                    onClick={() => {
                      setRunTestsMenuOpen(false);
                      openRunEvaluationDialog('all');
                    }}
                  />
                </MenuOverlay>
              </div>
              <SharedButton
                id={addScenarioTriggerId}
                variant="primary"
                size="sm"
                className="clus-kpi-add-test-scenario-trigger"
                aria-haspopup="dialog"
                onClick={() => {
                  setScenarioToEdit(null);
                  setScenarioToDuplicate(null);
                  setAddScenarioDialogOpen(true);
                }}
              >
                <span className="btn-icon" aria-hidden>
                  <Icon name="plus" weight="bold" size={16} />
                </span>
                Add test scenario
              </SharedButton>
            </div>
          </div>
        )}

        {activeSubTab === 'variables' && (
          <div className="testing-scenarios-tab-toolbar-row__actions flex min-w-0 flex-[1_1_16rem] flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
            <div className="min-w-0 flex-1 clus-kpi-search-wrap sm:max-w-[22rem]">
              <Searchfield
                label=""
                placeholder="Search variables..."
                value={variableSearchQuery}
                onInput={(e: Event) =>
                  setVariableSearchQuery((e.target as HTMLElement & { value: string }).value)
                }
                className="clus-kpi-search-input"
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                id={addVariableTriggerId}
                color="default"
                variant="primary"
                size={SCENARIOS_TOOLBAR_PILL_SIZE}
                onClick={() => setAddVariableDialogOpen(true)}
              >
                + Add variable
              </Button>
            </div>
          </div>
        )}
      </div>

      <div
        id="testing-scenarios-panel-scenarios"
        role="tabpanel"
        aria-labelledby="testing-scenarios-subtab-scenarios"
        hidden={activeSubTab !== 'scenarios'}
      >
        <TestingScenariosTab
          searchQuery={scenarioSearchQuery}
          userScenarios={userScenarios}
          sampleScenarioOverrides={sampleScenarioOverrides}
          removedSampleScenarioIds={removedSampleScenarioIds}
          selectedIds={selectedScenarioIds}
          setSelectedIds={setSelectedScenarioIds}
          runningScenarioIds={runningScenarioIds}
          scenarioAddedSignal={scenarioAddedSignal}
          onRequestEditScenario={(row) => {
            setScenarioToDuplicate(null);
            setScenarioToEdit(row);
            setAddScenarioDialogOpen(true);
          }}
          onRequestDuplicateScenario={(row) => {
            setScenarioToEdit(null);
            setScenarioToDuplicate(row);
            setAddScenarioDialogOpen(true);
          }}
          onRequestDeleteScenario={(row) => setPendingDeleteScenario(row)}
        />
      </div>
      <div
        id="testing-scenarios-panel-variables"
        role="tabpanel"
        aria-labelledby="testing-scenarios-subtab-variables"
        hidden={activeSubTab !== 'variables'}
      >
        <TestingVariablesTab
          searchQuery={variableSearchQuery}
          sampleVariables={effectiveSampleVariables}
          userVariables={userScenarioVariables}
          onRequestDeleteVariable={(row) => setPendingDeleteVariable(row)}
          onEditVariable={(row) => {
            setEditVariableRow(row);
            setAddVariableDialogOpen(true);
          }}
        />
      </div>

      <AddTestScenarioDialog
        open={addScenarioDialogOpen}
        onOpenChange={(nextOpen) => {
          setAddScenarioDialogOpen(nextOpen);
          if (!nextOpen) {
            setScenarioToEdit(null);
            setScenarioToDuplicate(null);
          }
        }}
        triggerID={addScenarioTriggerId}
        scenarioToEdit={scenarioToEdit}
        scenarioToDuplicate={scenarioToDuplicate}
        onAddScenarios={(rows) => {
          if (rows.length === 0) return;
          setUserScenarios((prev) => [...rows, ...prev]);
          setActiveSubTab('scenarios');
          setScenarioSearchQuery('');
          setScenarioAddedSignal((n) => n + 1);
        }}
        onSaveEditedScenario={(row) => {
          const isSampleRow = sampleScenarios.some((s) => s.id === row.id);
          if (isSampleRow) {
            setSampleScenarioOverrides((prev) => new Map(prev).set(row.id, row));
          } else {
            setUserScenarios((prev) => prev.map((r) => (r.id === row.id ? row : r)));
          }
        }}
        variablesFromTab={variablesForScenarioDialog}
      />
      <AddVariableDialog
        open={addVariableDialogOpen}
        onOpenChange={(open) => {
          setAddVariableDialogOpen(open);
          if (!open) setEditVariableRow(null);
        }}
        triggerID={addVariableTriggerId}
        reservedNames={reservedVariableNames}
        onAddVariables={(rows) => setUserScenarioVariables((prev) => [...prev, ...rows])}
        editRow={editVariableRow}
        onSaveVariable={(updated) => {
          const isSample = sampleScenarioVariables.some((v) => v.id === updated.id);
          if (isSample) {
            setSampleVariableOverrides((prev) => new Map(prev).set(updated.id, updated));
          } else {
            setUserScenarioVariables((prev) =>
              prev.map((v) => (v.id === updated.id ? updated : v)),
            );
          }
        }}
      />
      <RunEvaluationDescriptionDialog
        open={runEvaluationDialogOpen}
        onOpenChange={handleRunEvaluationOpenChange}
        triggerID={addScenarioTriggerId}
        onConfirm={handleRunEvaluationConfirm}
      />
      <DeleteScenarioConfirmDialog
        open={pendingDeleteScenario !== null}
        scenarioName={pendingDeleteScenario?.name ?? ''}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteScenario(null);
        }}
        onConfirm={() => {
          const row = pendingDeleteScenario;
          if (!row) return;
          const id = row.id;
          const isSampleRow = sampleScenarios.some((s) => s.id === id);
          if (isSampleRow) {
            setRemovedSampleScenarioIds((prev) => new Set(prev).add(id));
            setSampleScenarioOverrides((prev) => {
              const next = new Map(prev);
              next.delete(id);
              return next;
            });
          } else {
            setUserScenarios((prev) => prev.filter((r) => r.id !== id));
          }
          setSelectedScenarioIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setRunningScenarioIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }}
      />
      <DeleteVariableConfirmDialog
        open={pendingDeleteVariable !== null}
        variableName={pendingDeleteVariable?.name ?? ''}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteVariable(null);
        }}
        onConfirm={() => {
          const row = pendingDeleteVariable;
          if (!row) return;
          const isSample = sampleScenarioVariables.some((v) => v.id === row.id);
          if (isSample) {
            setRemovedSampleVariableIds((prev) => new Set(prev).add(row.id));
            setSampleVariableOverrides((prev) => {
              const next = new Map(prev);
              next.delete(row.id);
              return next;
            });
          } else {
            setUserScenarioVariables((prev) => prev.filter((v) => v.id !== row.id));
          }
          if (editVariableRow?.id === row.id) {
            setEditVariableRow(null);
            setAddVariableDialogOpen(false);
          }
        }}
      />
    </div>
  );
}
