import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Dropdown from '../../components/shared/Dropdown';
import { Banner } from '../../components/shared/Banner';
import { Modal, ModalBody, ModalHeader } from '../../components/shared/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/shared/Table';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { Filter } from '../../components/shared/Filter';
import { EmptyState } from '../../components/shared/EmptyState';
import { Checkbox } from '../../components/shared/Checkbox';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import Spinner from '../../components/shared/Spinner';
import { useToast } from '../../components/shared/Toast';
import { Icon } from '../../icons';
import {
  type IssueType,
  type KnowledgeSource,
  type SourceIssue,
  type SyncRun,
  listSourceIssues,
  listSyncRuns,
  retryIssue,
  skipIssue,
} from '../../services/knowledgeService';
import { knowledgeCopy } from './copy';

const sp = knowledgeCopy.sharepointModal;

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'custom', label: 'Custom' },
];

const CONNECTION_OPTIONS = [
  { value: 'entra-contoso', label: 'Contoso Microsoft Entra connection' },
  { value: 'entra-support', label: 'Support tenant connection' },
  { value: 'new', label: '+ Create new connection' },
];

const INITIAL_SITE_URLS = ['https://contoso.sharepoint.com/sites/support'];

interface SourceIssuesDrawerProps {
  source: KnowledgeSource;
  initialFilter?: IssueType | 'all';
  onClose: () => void;
}

const FILTERS: Array<{ id: IssueType | 'all'; label: string }> = [
  { id: 'all', label: knowledgeCopy.issuesDrawer.filters.all },
  { id: 'unsupported_type', label: knowledgeCopy.issuesDrawer.filters.unsupported },
  { id: 'oversize', label: knowledgeCopy.issuesDrawer.filters.oversize },
  { id: 'processing_failure', label: knowledgeCopy.issuesDrawer.filters.processing },
];

const ISSUE_BADGE: Record<IssueType, { label: string; variant: 'warning' | 'error' | 'info' }> = {
  unsupported_type: { label: 'Unsupported', variant: 'warning' },
  oversize: { label: 'Oversize', variant: 'warning' },
  processing_failure: { label: 'Failed', variant: 'error' },
};

const createMockSyncHistory = (sourceId: string): SyncRun[] => {
  const now = Date.now();
  return [
    {
      id: 'mock-sync-1',
      sourceId,
      startedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      finishedAt: new Date(now - 1000 * 60 * 42).toISOString(),
      mode: 'incremental',
      trigger: 'manual',
      added: 0,
      updated: 2,
      deleted: 0,
      skipped: 1,
      failed: 2,
      status: 'failed',
    },
    {
      id: 'mock-sync-2',
      sourceId,
      startedAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      finishedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 4).toISOString(),
      mode: 'incremental',
      trigger: 'schedule',
      added: 8,
      updated: 14,
      deleted: 1,
      skipped: 0,
      failed: 0,
      status: 'succeeded',
    },
    {
      id: 'mock-sync-3',
      sourceId,
      startedAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      finishedAt: new Date(now - 1000 * 60 * 60 * 48 + 1000 * 60 * 7).toISOString(),
      mode: 'full',
      trigger: 'manual',
      added: 128,
      updated: 0,
      deleted: 0,
      skipped: 3,
      failed: 1,
      status: 'partial',
    },
  ];
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SourceIssuesDrawer({
  source,
  initialFilter = 'all',
  onClose,
}: SourceIssuesDrawerProps) {
  const { notify } = useToast();
  const [filter, setFilter] = useState<IssueType | 'all'>(initialFilter);
  const [issues, setIssues] = useState<SourceIssue[]>([]);
  const [latestRun, setLatestRun] = useState<SyncRun | undefined>();
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [domain, setDomain] = useState(
    source.tenantId?.replace('.onmicrosoft.com', '.sharepoint.com') ?? 'contoso.sharepoint.com',
  );
  const [siteUrls, setSiteUrls] = useState<string[]>(INITIAL_SITE_URLS);
  const [connectionId, setConnectionId] = useState('entra-contoso');
  const [syncMode, setSyncMode] = useState<'incremental' | 'full'>(source.lastSyncMode ?? 'incremental');
  const [frequency, setFrequency] = useState('daily');
  const [customDays, setCustomDays] = useState(['Mon', 'Wed', 'Fri']);
  const [customTime, setCustomTime] = useState('02:00');
  /* Tracks issues that are mid-retry or mid-skip. Rows in either set
     swap their Retry/Skip actions for an inline spinner and, on
     resolution, the issue row disappears entirely — both flows are
     treated as optimistic "assume success" (same pattern as "Sync now"
     on the sources table). */
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [skippingIds, setSkippingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listSourceIssues(source.id), listSyncRuns(source.id)])
      .then(([i, runs]) => {
        if (cancelled) return;
        setIssues(i);
        const history = runs.length > 0 ? runs : createMockSyncHistory(source.id);
        setSyncRuns(history);
        setLatestRun(history[0]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [source.id]);

  const visible = useMemo(
    () => (filter === 'all' ? issues : issues.filter((i) => i.type === filter)),
    [issues, filter],
  );

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (checked: boolean) => {
    setSelected(checked ? new Set(visible.map((i) => i.id)) : new Set());
  };

  const allChecked = visible.length > 0 && visible.every((i) => selected.has(i.id));

  /* Shared optimistic flow used by Retry and Skip. While the service
     call is in flight we park the id in the matching "in-progress" set
     so the Action cell swaps the buttons for an inline spinner. On
     success we drop the row from the list entirely — the row
     disappearing is the feedback, so no success toast. Errors still
     surface a toast so users know the action didn't take. */
  const runOptimistic = async (
    fn: (id: string) => Promise<SourceIssue>,
    ids: string[],
    setInFlight: React.Dispatch<React.SetStateAction<Set<string>>>,
    errorTitle: string,
  ) => {
    if (ids.length === 0) return;
    setInFlight((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    // Clear these from any bulk selection immediately so the bulk bar
    // reflects only the still-actionable rows.
    setSelected((prev) => {
      if (ids.every((id) => !prev.has(id))) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    try {
      await Promise.all(ids.map((id) => fn(id)));
      setIssues((prev) => prev.filter((i) => !ids.includes(i.id)));
    } catch (err) {
      notify({
        type: 'error',
        title: errorTitle,
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setInFlight((prev) => {
        if (ids.every((id) => !prev.has(id))) return prev;
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleRetry = (ids: string[]) =>
    runOptimistic(retryIssue, ids, setRetryingIds, 'Retry failed');
  const handleSkip = (ids: string[]) =>
    runOptimistic(skipIssue, ids, setSkippingIds, 'Skip failed');

  const latestSyncLabel = latestRun
    ? `Latest sync ${formatDateTime(latestRun.finishedAt ?? latestRun.startedAt)}`
    : undefined;

  const toggleCustomDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((current) => current !== day) : [...prev, day],
    );
  };

  const setSiteUrl = (index: number, value: string) => {
    setSiteUrls((prev) =>
      prev.map((siteUrl, currentIndex) => (currentIndex === index ? value : siteUrl)),
    );
  };

  const removeSiteUrl = (index: number) => {
    setSiteUrls((prev) =>
      prev.length === 1 ? prev : prev.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  return createPortal(
    <div className="fpmodal-overlay issues-fpmodal-overlay">
      <div className="fpmodal issues-fpmodal" role="dialog" aria-modal="true" aria-label={knowledgeCopy.issuesDrawer.title(source.name)}>
        <div className="fpmodal-header issues-fpmodal-header">
          <div className="fpmodal-header__left">
            <div className="issues-fpmodal-title-row">
              <h1 className="fpmodal-title">{source.name}</h1>
              {issues.length > 0 && <Badge variant="error">Failed to sync</Badge>}
            </div>
            <p className="fpmodal-subtitle issues-fpmodal-meta">
              {source.type} · {issues.length} issue{issues.length === 1 ? '' : 's'} · Created by {source.createdBy} · Last updated {formatDateTime(source.updatedAt)}
              {latestSyncLabel ? ` · ${latestSyncLabel}` : ''}
              {' · '}
              <button
                type="button"
                className="issues-sync-history-trigger"
                onClick={() => setShowSyncHistory(true)}
              >
                <Icon name="refresh" weight="bold" size="sm" />
                Show sync history
              </button>
            </p>
          </div>
          <Button
            variant="secondary"
            color="negative"
            size="sm"
            onClick={() => handleSkip(issues.map((i) => i.id))}
            disabled={issues.length === 0}
          >
            <Icon name="delete" weight="bold" size="sm" />
            Delete
          </Button>
          <button type="button" className="fpmodal-close issues-fpmodal-close" onClick={onClose} aria-label="Close">
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        {issues.length > 0 && (
          <Banner
            type="error"
            title="Sync did not complete."
            subtitle="Review the content issues or adjust your settings."
            dismissable={false}
          />
        )}

        <Tabs variant="pill" className="issues-fpmodal-tabs" aria-label="Source issue tabs">
          <Tab active={activeTab === 'content'} onClick={() => setActiveTab('content')}>
            Content
          </Tab>
          <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Setting
          </Tab>
        </Tabs>

        <div className="fpmodal-body issues-fpmodal-body">
          <div className="issues-fpmodal-layout">
            <aside className="issues-source-card" aria-label="Source details">
              <h2 className="issues-source-card__title">Source details</h2>
              <Input label="Source name" required value={source.name} readOnly />
              <Textarea
                label="Description"
                required
                value={source.description || 'No description provided.'}
                readOnly
                rows={4}
              />
            </aside>

            <section className="issues-main-card" aria-label={activeTab === 'content' ? 'Content issues' : 'Issue settings'}>
              {activeTab === 'content' ? (
                <>
                  <div className="issues-toolbar-row">
                    <Filter
                      value={filter}
                      onChange={(v) => setFilter(v as IssueType | 'all')}
                      options={FILTERS.map((f) => ({
                        value: f.id,
                        label: f.label,
                        count:
                          f.id === 'all' ? undefined : issues.filter((i) => i.type === f.id).length,
                      }))}
                    />
                  </div>

                  {selected.size > 0 && (
                    <div className="issues-bulk-bar">
                      <span>{selected.size} selected</span>
                      <div className="issues-bulk-bar__actions">
                        <Button variant="secondary" size="sm" onClick={() => handleRetry(Array.from(selected))}>
                          {knowledgeCopy.issuesDrawer.bulk.retry}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSkip(Array.from(selected))}>
                          {knowledgeCopy.issuesDrawer.bulk.skip}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!loading && visible.length === 0 ? (
                    <EmptyState
                      illustration="horns-success"
                      title={knowledgeCopy.issuesDrawer.empty.title}
                      description={knowledgeCopy.issuesDrawer.empty.description}
                    />
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeader style={{ width: 40 }}>
                            <Checkbox
                              checked={allChecked}
                              onChange={(checked) => selectAll(checked)}
                              aria-label="Select all issues"
                            />
                          </TableHeader>
                          <TableHeader>{knowledgeCopy.issuesDrawer.table.item}</TableHeader>
                          <TableHeader>{knowledgeCopy.issuesDrawer.table.type}</TableHeader>
                          <TableHeader>{knowledgeCopy.issuesDrawer.table.reason}</TableHeader>
                          <TableHeader>{knowledgeCopy.issuesDrawer.table.detected}</TableHeader>
                          <TableHeader>{knowledgeCopy.issuesDrawer.table.action}</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody loading={loading} empty={!loading && visible.length === 0}>
                        {visible.map((issue) => {
                          const badge = ISSUE_BADGE[issue.type];
                          return (
                            <TableRow key={issue.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selected.has(issue.id)}
                                  onChange={() => toggleSelected(issue.id)}
                                  aria-label={`Select ${issue.itemName}`}
                                />
                              </TableCell>
                              <TableCell>
                                <span>{issue.itemName}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell style={{ maxWidth: 260, whiteSpace: 'normal' }}>
                                {issue.reason}
                              </TableCell>
                              <TableCell>{formatDateTime(issue.detectedAt)}</TableCell>
                              <TableCell>
                                {retryingIds.has(issue.id) || skippingIds.has(issue.id) ? (
                                  <div className="issues-row-spinner">
                                    <Spinner
                                      size="small"
                                      aria-label={retryingIds.has(issue.id) ? 'Retrying' : 'Skipping'}
                                    />
                                    <span>
                                      {retryingIds.has(issue.id)
                                        ? knowledgeCopy.issuesDrawer.actions.retry
                                        : knowledgeCopy.issuesDrawer.actions.skip}
                                      …
                                    </span>
                                  </div>
                                ) : (
                                  <div className="issues-row-actions">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleRetry([issue.id])}
                                      disabled={issue.status !== 'open'}
                                    >
                                      {knowledgeCopy.issuesDrawer.actions.retry}
                                    </Button>
                                    <Button
                                      variant="tertiary"
                                      size="sm"
                                      onClick={() => handleSkip([issue.id])}
                                      disabled={issue.status === 'skipped'}
                                    >
                                      {knowledgeCopy.issuesDrawer.actions.skip}
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </>
              ) : (
                <div className="issues-settings">
                  <section className="issues-settings-section">
                    <h2>Authentication</h2>
                    <div className="fpmodal-card">
                      <div className="edit-source-form-stack">
                        <label className="form-label">
                          {sp.fields.domain}
                          <span className="required">*</span>
                        </label>
                        <Input
                          prefix={sp.fields.domainPrefix}
                          value={domain}
                          placeholder={sp.fields.domainPlaceholder}
                          onChange={(event) => setDomain(event.target.value)}
                        />
                        <span className="form-hint">{sp.fields.domainHint}</span>
                      </div>

                      <div className="sp-site-urls-field">
                        <label className="form-label">
                          {sp.fields.siteUrls}
                          <span className="required">*</span>
                        </label>
                        {siteUrls.map((siteUrl, index) => (
                          <div key={index} className="sp-site-url-row">
                            <Input
                              value={siteUrl}
                              placeholder={sp.fields.sitePlaceholder}
                              onChange={(event) => setSiteUrl(index, event.target.value)}
                              aria-label={`Site URL ${index + 1}`}
                            />
                            <Button
                              variant="tertiary"
                              size="sm"
                              aria-label="Remove site URL"
                              disabled={siteUrls.length === 1}
                              onClick={() => removeSiteUrl(index)}
                            >
                              <Icon name="cancel" weight="bold" size="sm" />
                            </Button>
                          </div>
                        ))}
                        <div className="sp-site-urls-field__add">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => setSiteUrls((prev) => [...prev, ''])}
                          >
                            {sp.fields.siteUrlsAdd}
                          </Button>
                        </div>
                      </div>

                      <Dropdown
                        label={sp.fields.connection}
                        required
                        options={CONNECTION_OPTIONS}
                        value={connectionId}
                        onChange={setConnectionId}
                        placeholder="Select a connection"
                        hint={sp.fields.connectionHint}
                      />
                    </div>
                  </section>
                  <div className="issues-settings-divider" role="separator" aria-hidden="true" />

                  <section className="issues-settings-section">
                    <h2>Sync settings</h2>
                    <div className="issues-settings-edit-grid">
                      <div className="issues-settings-edit-col">
                        <h3 className="sp-card-title">{sp.sections.syncMode}</h3>
                        <div className="fpmodal-card">
                          <RadioGroup
                            name="issues-sync-mode"
                            value={syncMode}
                            onChange={(value) => setSyncMode(value as 'incremental' | 'full')}
                          >
                            <Radio
                              value="incremental"
                              label={sp.fields.syncMode.incremental}
                              helperText={sp.fields.syncMode.incrementalHelp}
                            />
                            <Radio
                              value="full"
                              label={sp.fields.syncMode.full}
                              helperText={sp.fields.syncMode.fullHelp}
                            />
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="issues-settings-edit-col">
                        <h3 className="sp-card-title">{sp.sections.syncSchedule}</h3>
                        <div className="fpmodal-card">
                          <Dropdown
                            label={sp.fields.frequency}
                            options={FREQUENCY_OPTIONS}
                            value={frequency}
                            onChange={setFrequency}
                            hint={sp.fields.firstRunNote}
                          />
                          {frequency === 'custom' && (
                            <div className="issues-custom-schedule">
                              <span className="form-label">Days</span>
                              <div className="issues-custom-schedule__days">
                                {WEEK_DAYS.map((day) => (
                                  <Checkbox
                                    key={day}
                                    label={day}
                                    checked={customDays.includes(day)}
                                    onChange={() => toggleCustomDay(day)}
                                  />
                                ))}
                              </div>
                              <Input
                                type="time"
                                label="Time"
                                value={customTime}
                                onChange={(event) => setCustomTime(event.target.value)}
                              />
                              <span className="form-hint">{sp.fields.customIntervalHelp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              <Button onClick={() => handleRetry(visible.map((i) => i.id))} disabled={visible.length === 0}>
                Retry visible
              </Button>
            </div>
          </div>
        </div>

        {showSyncHistory && (
          <Modal
            onClose={() => setShowSyncHistory(false)}
            size="lg"
            className="issues-sync-history-modal"
            overlayClassName="issues-sync-history-overlay"
          >
            <ModalHeader
              title="Sync history"
              description={`Recent sync runs for ${source.name}`}
              onClose={() => setShowSyncHistory(false)}
            />
            <ModalBody>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Started</TableHeader>
                    <TableHeader>Finished</TableHeader>
                    <TableHeader>Mode</TableHeader>
                    <TableHeader>Changes</TableHeader>
                    <TableHeader>Trigger</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody empty={syncRuns.length === 0}>
                  {syncRuns.map((run) => {
                    const changes = [
                      run.added > 0 && `${run.added} Added`,
                      run.updated > 0 && `${run.updated} Updated`,
                      run.deleted > 0 && `${run.deleted} Deleted`,
                      run.skipped > 0 && `${run.skipped} Skipped`,
                      run.failed > 0 && `${run.failed} Failed`,
                    ].filter(Boolean) as string[];

                    return (
                      <TableRow key={run.id}>
                        <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                        <TableCell>{run.finishedAt ? formatDateTime(run.finishedAt) : '—'}</TableCell>
                        <TableCell style={{ textTransform: 'capitalize' }}>{run.mode}</TableCell>
                        <TableCell>{changes.length > 0 ? changes.join(', ') : '—'}</TableCell>
                        <TableCell style={{ textTransform: 'capitalize' }}>{run.trigger}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              run.status === 'succeeded'
                                ? 'success'
                                : run.status === 'partial'
                                  ? 'warning'
                                  : run.status === 'failed'
                                    ? 'error'
                                    : 'info'
                            }
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ModalBody>
          </Modal>
        )}
      </div>
    </div>,
    document.body,
  );
}
