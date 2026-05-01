import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Banner,
  Badge,
  Bullet,
  ProgressBar,
  Button,
} from '../../components/shared';
import { Checkbox } from '../../components/shared/Checkbox';
import Dropdown from '../../components/shared/Dropdown';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Modal, ModalBody, ModalHeader } from '../../components/shared/Modal';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/shared/Table';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { Icon } from '../../icons/Icon';
import {
  type IssueType,
  type KnowledgeSource,
  type SourceIssue,
  type SyncProgress,
  type SyncRun,
  type SyncStage,
  SHAREPOINT_CONTENT_TYPES,
  SHAREPOINT_LIMITS,
  listSourceIssues,
  listSyncRuns,
  subscribeSyncProgress,
} from '../../services/knowledgeService';
import { knowledgeCopy } from './copy';
import { formatDateTime } from './utils';

interface SyncProgressDrawerProps {
  source: KnowledgeSource;
  onClose: () => void;
  /** Fires once when the simulated run hits 100%. Parent can refresh the
      sources table so the source flips from `syncing` → `processed`. */
  onComplete?: () => void;
  /** Optional — when provided, a "View issues" action is surfaced on the
      completion banner and on the inline in-progress warning. */
  onViewIssues?: (source: KnowledgeSource) => void;
}

/* Ordered pipeline used to render the stage timeline. `done` is a terminal
   marker and not shown as its own row — completion is conveyed by every
   stage flipping to the completed state. */
const STAGE_ORDER: SyncStage[] = [
  'connecting',
  'discovering',
  'fetching',
  'processing',
  'indexing',
];

const STAGE_COPY: Record<SyncStage, { title: string; description: string }> = {
  connecting: {
    title: 'Connecting to source',
    description: 'Establishing a secure connection and validating credentials.',
  },
  discovering: {
    title: 'Discovering content',
    description: 'Enumerating sites, libraries, and files eligible for sync.',
  },
  fetching: {
    title: 'Fetching files',
    description: 'Downloading new and updated items from the source.',
  },
  processing: {
    title: 'Processing content',
    description: 'Extracting text, metadata, and permissions from each item.',
  },
  indexing: {
    title: 'Indexing for search',
    description: 'Embedding chunks and updating the retrieval index.',
  },
  done: {
    title: 'Sync complete',
    description: 'All content is available to connected agents.',
  },
};

const sp = knowledgeCopy.sharepointModal;
const INITIAL_CONTENT_TYPES = ['pages', 'news', 'docs', 'spreadsheets', 'lists', 'wiki'];
const INITIAL_SITE_URLS = ['https://contoso.sharepoint.com/sites/support'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CONNECTION_OPTIONS = [
  { value: 'entra-contoso', label: 'Contoso Microsoft Entra connection' },
  { value: 'entra-support', label: 'Support tenant connection' },
  { value: 'new', label: '+ Create new connection' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'custom', label: 'Custom' },
];

const ISSUE_BADGE: Record<IssueType, { label: string; variant: 'warning' | 'error' | 'info' }> = {
  unsupported_type: { label: 'Unsupported', variant: 'warning' },
  oversize: { label: 'Oversize', variant: 'warning' },
  processing_failure: { label: 'Failed', variant: 'error' },
};

/** Compact integer formatter for large file counts. */
function formatCount(n: number) {
  return n.toLocaleString();
}

/** Pluralize "issue" around a count without pulling in i18n for the mock. */
function issueLabel(n: number) {
  return n === 1 ? '1 issue' : `${formatCount(n)} issues`;
}

export default function SyncProgressDrawer({
  source,
  onClose,
  onComplete,
  onViewIssues,
}: SyncProgressDrawerProps) {
  const [progress, setProgress] = useState<SyncProgress | undefined>();
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [issues, setIssues] = useState<SourceIssue[]>([]);
  const domain = source.tenantId?.replace('.onmicrosoft.com', '.sharepoint.com') ?? 'contoso.sharepoint.com';

  useEffect(() => {
    /* Subscribe drives the initial emission synchronously, so we get a
       first snapshot before the first render commits. The unsubscribe
       does NOT cancel the background run — other consumers (e.g. the
       status cell) can continue to read from the same run. */
    let firedComplete = false;
    const unsubscribe = subscribeSyncProgress(source.id, (p) => {
      setProgress(p);
      if (p.stage === 'done' && !firedComplete) {
        firedComplete = true;
        onComplete?.();
      }
    });
    return unsubscribe;
  }, [source.id, onComplete]);

  useEffect(() => {
    let cancelled = false;
    listSyncRuns(source.id).then((runs) => {
      if (!cancelled) setSyncRuns(runs);
    });
    return () => {
      cancelled = true;
    };
  }, [source.id]);

  const currentIndex = progress
    ? progress.stage === 'done'
      ? STAGE_ORDER.length
      : STAGE_ORDER.indexOf(progress.stage)
    : 0;
  const isDone = progress?.stage === 'done';
  const percent = progress?.percent ?? 0;
  const issueCount = progress?.issueCount ?? 0;
  const hasIssues = issueCount > 0;

  useEffect(() => {
    if (!isDone || !hasIssues) return;
    let cancelled = false;
    listSourceIssues(source.id).then((nextIssues) => {
      if (!cancelled) setIssues(nextIssues);
    });
    return () => {
      cancelled = true;
    };
  }, [hasIssues, isDone, source.id]);

  /* Map a stage row to its visual state. A detected issue flips the stage
     where it was found to 'warning' (instead of complete/current) so users
     can see WHERE in the pipeline things went wrong. */
  function stageState(
    stage: SyncStage,
    index: number,
  ): 'complete' | 'current' | 'pending' | 'warning' {
    const base: 'complete' | 'current' | 'pending' = isDone
      ? 'complete'
      : index < currentIndex
        ? 'complete'
        : index === currentIndex
          ? 'current'
          : 'pending';
    if (progress?.issueStage === stage && (base === 'complete' || base === 'current')) {
      return 'warning';
    }
    return base;
  }

  /* ProgressBar only supports success / in-progress / failed. A completed
     run with issues is conceptually success-with-warnings, so we keep
     `complete` and lean on the banner + inline note below to communicate
     the warning. Could be upgraded if the design system adds a 'warning'
     ProgressBar variant. */
  const progressStatus: 'complete' | 'in-progress' = isDone ? 'complete' : 'in-progress';

  const description = isDone
    ? hasIssues
      ? `Sync finished with ${issueLabel(issueCount)}. Review and resolve below.`
      : 'Sync complete. You can close this window.'
    : 'This window stays live while the sync runs. You can close it at any time — the sync will continue in the background.';
  const latestSyncLabel = source.lastSyncAt ? `Latest sync ${formatDateTime(source.lastSyncAt)}` : undefined;

  return createPortal(
    <div className="fpmodal-overlay sync-progress-fpmodal-overlay">
      <div className="fpmodal sync-progress-fpmodal" role="dialog" aria-modal="true" aria-label={`Syncing ${source.name}`}>
        <div className="fpmodal-header sync-progress-fpmodal-header">
          <div className="fpmodal-header__left">
            <div className="issues-fpmodal-title-row">
              <h1 className="fpmodal-title">{source.name}</h1>
              <Badge variant="info">Syncing</Badge>
            </div>
            <p className="fpmodal-subtitle issues-fpmodal-meta">
              {source.type} · {issueLabel(issueCount)} · Created by {source.createdBy} · Last updated {formatDateTime(source.updatedAt)}
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
          <Button variant="secondary" color="negative" size="sm" disabled>
            <Icon name="delete" weight="bold" size="sm" />
            Delete
          </Button>
          <button type="button" className="fpmodal-close sync-progress-fpmodal-close" onClick={onClose} aria-label="Close">
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        <Banner
          type="info"
          title="We're syncing your content now — this may take a little time"
          subtitle="Syncing may take a bit longer for larger or content-rich pages. When done, we'll alert you to review changes or handle them automatically, based on your settings."
          dismissable={false}
        />

        <Tabs variant="pill" className="issues-fpmodal-tabs" aria-label="Sync progress tabs">
          <Tab active={activeTab === 'content'} onClick={() => setActiveTab('content')}>
            Content
          </Tab>
          <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Setting
          </Tab>
        </Tabs>

        <div className="fpmodal-body sync-progress-fpmodal-body">
          {activeTab === 'content' ? (
          <div className="sync-progress-fpmodal-content">
            <section className="sync-progress-primary-card">
              <ProgressBar
                value={percent}
                status={progressStatus}
                label={progress?.stageLabel ?? 'Starting…'}
                helperText={
                  isDone
                    ? hasIssues
                      ? `Indexed ${formatCount(
                          Math.max(0, (progress?.totalFiles ?? 0) - issueCount),
                        )} of ${formatCount(progress?.totalFiles ?? 0)} files (${issueLabel(
                          issueCount,
                        )} skipped).`
                      : `Indexed ${formatCount(progress?.totalFiles ?? 0)} files.`
                    : progress?.etaLabel ?? 'Preparing sync…'
                }
                showPercent
              />

              {/* Mid-sync inline warning — surfaces the issue the moment it's
                  detected so users don't have to wait until the run finishes. */}
              {!isDone && hasIssues && (
                <div className="sync-progress-inline-warning" role="status">
                  <Icon name="warning" weight="bold" size={16} />
                  <span className="sync-progress-inline-warning__text">
                    {issueLabel(issueCount)} detected while processing content. You can review
                    {onViewIssues ? ' ' : ' them '}after the sync completes.
                  </span>
                </div>
              )}

              <div className="sync-progress-stats">
                <div className="sync-progress-stat">
                  <span className="sync-progress-stat__label">Files processed</span>
                  <span className="sync-progress-stat__value">
                    {progress
                      ? `${formatCount(progress.filesProcessed)} of ${formatCount(progress.totalFiles)}`
                      : '—'}
                  </span>
                </div>
                <div className="sync-progress-stat">
                  <span className="sync-progress-stat__label">Stage</span>
                  <span className="sync-progress-stat__value">
                    {isDone
                      ? `Complete (${STAGE_ORDER.length} of ${STAGE_ORDER.length})`
                      : progress
                        ? `${Math.max(1, currentIndex + 1)} of ${STAGE_ORDER.length}`
                        : '—'}
                  </span>
                </div>
                <div
                  className={`sync-progress-stat${hasIssues ? ' sync-progress-stat--warning' : ''}`}
                >
                  <span className="sync-progress-stat__label">Issues</span>
                  <span className="sync-progress-stat__value">
                    {progress ? (hasIssues ? issueLabel(issueCount) : 'None') : '—'}
                  </span>
                </div>
              </div>

              {isDone && hasIssues && (
                <div className="sync-progress-issues-table">
                  <h2 className="sync-progress-section-title">Content issues</h2>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>{knowledgeCopy.issuesDrawer.table.item}</TableHeader>
                        <TableHeader>{knowledgeCopy.issuesDrawer.table.type}</TableHeader>
                        <TableHeader>{knowledgeCopy.issuesDrawer.table.reason}</TableHeader>
                        <TableHeader>{knowledgeCopy.issuesDrawer.table.detected}</TableHeader>
                        <TableHeader>{knowledgeCopy.issuesDrawer.table.action}</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody empty={issues.length === 0}>
                      {issues.map((issue) => {
                        const badge = ISSUE_BADGE[issue.type];
                        return (
                          <TableRow key={issue.id}>
                            <TableCell>{issue.itemName}</TableCell>
                            <TableCell>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell style={{ maxWidth: 260, whiteSpace: 'normal' }}>
                              {issue.reason}
                            </TableCell>
                            <TableCell>{formatDateTime(issue.detectedAt)}</TableCell>
                            <TableCell>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onViewIssues?.(source)}
                                disabled={!onViewIssues}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section className="sync-progress-primary-card">
              <h2 className="sync-progress-section-title">Sync pipeline</h2>
              <ol className="sync-progress-timeline" aria-label="Sync pipeline">
                {STAGE_ORDER.map((stage, index) => {
                  const state = stageState(stage, index);
                  const copy = STAGE_COPY[stage];
                  return (
                    <li
                      key={stage}
                      className={`sync-progress-step sync-progress-step--${state}`}
                      aria-current={state === 'current' ? 'step' : undefined}
                    >
                      <span className="sync-progress-step__marker" aria-hidden="true">
                        {state === 'complete' ? (
                          <Icon
                            name="check-circle-filled"
                            size={20}
                            color="var(--success-color)"
                          />
                        ) : state === 'warning' ? (
                          <Icon name="warning" weight="bold" size={14} />
                        ) : state === 'current' ? (
                          <span className="sync-progress-step__pulse" />
                        ) : (
                          <Bullet size="small" />
                        )}
                      </span>
                      <div className="sync-progress-step__copy">
                        <span className="sync-progress-step__title">{copy.title}</span>
                        <span className="sync-progress-step__desc">{copy.description}</span>
                        {state === 'warning' && (
                          <span className="sync-progress-step__note">
                            {issueLabel(issueCount)} detected in this stage.
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
          ) : (
            <div className="edit-source-layout">
              <aside className="edit-source-side-card" aria-label="Source details">
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

              <section className="edit-source-main-card" aria-label="Sync settings">
                <div className="sync-progress-settings">
                  <section className="issues-settings-section">
                    <h2>{sp.sections.scope}</h2>
                    <div className="fpmodal-card">
                      <div className="sp-content-scope-field">
                        <label className="form-label">
                          {sp.fields.contentTypes}
                          <span className="required">*</span>
                        </label>
                        <span className="form-hint">{sp.fields.contentTypesHint}</span>
                        <div role="group" aria-label={sp.fields.contentTypes} className="sp-content-type-grid">
                          {SHAREPOINT_CONTENT_TYPES.map((contentType) => (
                            <Checkbox
                              key={contentType.id}
                              label={contentType.label}
                              checked={INITIAL_CONTENT_TYPES.includes(contentType.id)}
                              onChange={() => undefined}
                              disabled
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="issues-settings-divider" role="separator" aria-hidden="true" />

                  <section className="issues-settings-section">
                    <h2>{sp.sections.authentication}</h2>
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
                          readOnly
                        />
                        <span className="form-hint">{sp.fields.domainHint}</span>
                      </div>

                      <div className="sp-site-urls-field">
                        <label className="form-label">
                          {sp.fields.siteUrls}
                          <span className="required">*</span>
                        </label>
                        {INITIAL_SITE_URLS.map((siteUrl, index) => (
                          <div key={siteUrl} className="sp-site-url-row">
                            <Input value={siteUrl} aria-label={`Site URL ${index + 1}`} readOnly />
                            <Button variant="tertiary" size="sm" aria-label="Remove site URL" disabled>
                              <Icon name="cancel" weight="bold" size="sm" />
                            </Button>
                          </div>
                        ))}
                        <div className="sp-site-urls-field__add">
                          <Button variant="tertiary" size="sm" disabled>
                            {sp.fields.siteUrlsAdd}
                          </Button>
                        </div>
                      </div>

                      <Dropdown
                        label={sp.fields.connection}
                        required
                        options={CONNECTION_OPTIONS}
                        value="entra-contoso"
                        onChange={() => undefined}
                        placeholder="Select a connection"
                        hint={sp.fields.connectionHint}
                        disabled
                      />
                    </div>
                  </section>

                  <div className="issues-settings-divider" role="separator" aria-hidden="true" />

                  <section className="issues-settings-section">
                    <h2>{sp.sections.syncSettings}</h2>
                    <div className="issues-settings-edit-grid">
                      <div className="issues-settings-edit-col">
                        <h3 className="sp-card-title">{sp.sections.syncMode}</h3>
                        <div className="fpmodal-card">
                          <RadioGroup name="sync-progress-sync-mode" value={source.lastSyncMode ?? 'incremental'} onChange={() => undefined}>
                            <Radio
                              value="incremental"
                              label={sp.fields.syncMode.incremental}
                              helperText={sp.fields.syncMode.incrementalHelp}
                              readOnly
                            />
                            <Radio
                              value="full"
                              label={sp.fields.syncMode.full}
                              helperText={sp.fields.syncMode.fullHelp}
                              readOnly
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
                            value="daily"
                            onChange={() => undefined}
                            hint={sp.fields.firstRunNote}
                            disabled
                          />
                          <div className="issues-custom-schedule">
                            <span className="form-label">Days</span>
                            <div className="issues-custom-schedule__days">
                              {WEEK_DAYS.map((day) => (
                                <Checkbox
                                  key={day}
                                  label={day}
                                  checked={['Mon', 'Wed', 'Fri'].includes(day)}
                                  onChange={() => undefined}
                                  disabled
                                />
                              ))}
                            </div>
                            <Input type="time" label="Time" value="02:00" readOnly />
                            <span className="form-hint">{sp.fields.customIntervalHelp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="issues-settings-divider" role="separator" aria-hidden="true" />

                  <section className="issues-settings-section">
                    <h2>{sp.sections.limits}</h2>
                    <div className="fpmodal-card">
                      <div className="edit-source-limit-list">
                        <div className="sp-limit-row">
                          <span>{sp.fields.maxFileSize}</span>
                          <strong>{SHAREPOINT_LIMITS.maxFileSizeMB} MB</strong>
                        </div>
                        <div className="sp-limit-row">
                          <span>{sp.fields.maxSources}</span>
                          <strong>{SHAREPOINT_LIMITS.maxSourcesPerCollection}</strong>
                        </div>
                        <div className="sp-limit-row">
                          <span>{sp.fields.indexedVolume}</span>
                          <strong>210 MB / 1 GB</strong>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              {isDone && hasIssues && onViewIssues && (
                <Button onClick={() => onViewIssues(source)}>View issues</Button>
              )}
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
