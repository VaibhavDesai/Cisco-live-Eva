import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Checkbox } from '../../components/shared/Checkbox';
import Dropdown from '../../components/shared/Dropdown';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Modal, ModalBody, ModalHeader } from '../../components/shared/Modal';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import Spinner from '../../components/shared/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/shared/Table';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { useToast } from '../../components/shared/Toast';
import { Icon } from '../../icons';
import {
  type KnowledgeSource,
  type SyncRun,
  SHAREPOINT_CONTENT_TYPES,
  SHAREPOINT_LIMITS,
  listSyncRuns,
  updateSourceBasics,
} from '../../services/knowledgeService';
import { knowledgeCopy } from './copy';
import { formatDateTime } from './utils';

const cp = knowledgeCopy.editSourceModal;
const sp = knowledgeCopy.sharepointModal;

type EditableSourceFile = {
  id: string;
  name: string;
  type: 'Folder' | 'File';
  location: string;
  size: string;
};

type MicrosoftPickerItem = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  meta: string;
  parentId: string | null;
};

const MICROSOFT_PICKER_ITEMS: MicrosoftPickerItem[] = [
  { id: 'shared-docs', name: 'Shared Documents', type: 'folder', meta: 'Folder', parentId: null },
  { id: 'support-playbooks', name: 'Support playbooks', type: 'folder', meta: 'Folder', parentId: null },
  { id: 'faq-pdf', name: 'Contoso FAQ.pdf', type: 'file', meta: '280 KB', parentId: null },
  { id: 'roadmap-xlsx', name: 'Product roadmap.xlsx', type: 'file', meta: '246 KB', parentId: null },
  { id: 'release-notes-md', name: 'Release notes.md', type: 'file', meta: '42 KB', parentId: null },
  { id: 'policies', name: 'Policies', type: 'folder', meta: 'Folder', parentId: 'shared-docs' },
  { id: 'templates', name: 'Templates', type: 'folder', meta: 'Folder', parentId: 'shared-docs' },
  { id: 'benefits-pdf', name: 'Benefits guide.pdf', type: 'file', meta: '318 KB', parentId: 'shared-docs' },
  { id: 'returns-docx', name: 'Return policy.docx', type: 'file', meta: '128 KB', parentId: 'policies' },
  { id: 'security-md', name: 'Security policy.md', type: 'file', meta: '64 KB', parentId: 'policies' },
  { id: 'case-template-docx', name: 'Case template.docx', type: 'file', meta: '96 KB', parentId: 'templates' },
  { id: 'tier-one', name: 'Tier 1', type: 'folder', meta: 'Folder', parentId: 'support-playbooks' },
  { id: 'tier-two', name: 'Tier 2', type: 'folder', meta: 'Folder', parentId: 'support-playbooks' },
  { id: 'triage-pdf', name: 'Triage guide.pdf', type: 'file', meta: '402 KB', parentId: 'tier-one' },
  { id: 'escalation-pdf', name: 'Escalation guide.pdf', type: 'file', meta: '512 KB', parentId: 'tier-two' },
];

const getMicrosoftPickerItems = (parentId: string | null) =>
  MICROSOFT_PICKER_ITEMS.filter((item) => item.parentId === parentId);

const getMicrosoftPickerBreadcrumbs = (folderId: string | null) => {
  const breadcrumbs: MicrosoftPickerItem[] = [];
  let currentId = folderId;

  while (currentId) {
    const current = MICROSOFT_PICKER_ITEMS.find((item) => item.id === currentId);
    if (!current) break;
    breadcrumbs.unshift(current);
    currentId = current.parentId;
  }

  return breadcrumbs;
};

const getMicrosoftPickerPath = (item: MicrosoftPickerItem) => {
  const breadcrumbs = getMicrosoftPickerBreadcrumbs(item.parentId);
  return ['My files', ...breadcrumbs.map((folder) => folder.name)].join(' / ');
};

const toEditableSourceFile = (item: MicrosoftPickerItem): EditableSourceFile => ({
  id: item.id,
  name: item.name,
  type: item.type === 'folder' ? 'Folder' : 'File',
  location: getMicrosoftPickerPath(item),
  size: item.meta,
});

const INITIAL_FILE_IDS = ['shared-docs', 'benefits-pdf', 'triage-pdf'];
const INITIAL_CONTENT_TYPES = ['pages', 'news', 'docs', 'sheets', 'lists', 'wiki'];
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

interface EditSourceModalProps {
  source: KnowledgeSource;
  onClose: () => void;
  onSaved: (updated: KnowledgeSource) => void;
}

/**
 * Full-page edit modal for a knowledge source. Source basics and selected
 * files are editable in this prototype; connection and sync settings are
 * intentionally read-only so users can review what was captured at creation.
 */
export default function EditSourceModal({ source, onClose, onSaved }: EditSourceModalProps) {
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(INITIAL_FILE_IDS);
  const [contentTypes, setContentTypes] = useState<string[]>(INITIAL_CONTENT_TYPES);
  const [domain, setDomain] = useState(source.tenantId?.replace('.onmicrosoft.com', '.sharepoint.com') ?? 'contoso.sharepoint.com');
  const [siteUrls, setSiteUrls] = useState<string[]>(INITIAL_SITE_URLS);
  const [connectionId, setConnectionId] = useState('entra-contoso');
  const [syncMode, setSyncMode] = useState<'incremental' | 'full'>(source.lastSyncMode ?? 'incremental');
  const [frequency, setFrequency] = useState('daily');
  const [customDays, setCustomDays] = useState(['Mon', 'Wed', 'Fri']);
  const [customTime, setCustomTime] = useState('02:00');
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);
  const [microsoftStage, setMicrosoftStage] = useState<'signin' | 'picker'>('signin');
  const [pickerSelection, setPickerSelection] = useState<string[]>(INITIAL_FILE_IDS);
  const [submitting, setSubmitting] = useState(false);

  const trimmedName = source.name.trim();
  const trimmedDesc = (source.description ?? '').trim();

  const canSave = trimmedName.length > 0 && trimmedDesc.length > 0;
  const selectedFiles = MICROSOFT_PICKER_ITEMS
    .filter((file) => selectedFileIds.includes(file.id))
    .map(toEditableSourceFile);
  const fileSelectionDirty = selectedFileIds.join('|') !== INITIAL_FILE_IDS.join('|');
  const contentTypesDirty = contentTypes.join('|') !== INITIAL_CONTENT_TYPES.join('|');
  const connectionDirty =
    domain !== (source.tenantId?.replace('.onmicrosoft.com', '.sharepoint.com') ?? 'contoso.sharepoint.com') ||
    siteUrls.join('|') !== INITIAL_SITE_URLS.join('|') ||
    connectionId !== 'entra-contoso';
  const syncDirty =
    syncMode !== (source.lastSyncMode ?? 'incremental') ||
    frequency !== 'daily' ||
    customDays.join('|') !== 'Mon|Wed|Fri' ||
    customTime !== '02:00';
  const dirty =
    trimmedName !== source.name ||
    trimmedDesc !== (source.description ?? '') ||
    fileSelectionDirty ||
    contentTypesDirty ||
    connectionDirty ||
    syncDirty;
  const latestSyncLabel = source.lastSyncAt ? `Latest sync ${formatDateTime(source.lastSyncAt)}` : undefined;

  useEffect(() => {
    let cancelled = false;
    listSyncRuns(source.id).then((runs) => {
      if (!cancelled) setSyncRuns(runs);
    });
    return () => {
      cancelled = true;
    };
  }, [source.id]);

  useEffect(() => {
    if (!microsoftModalOpen || microsoftStage !== 'signin') return;
    const timer = window.setTimeout(() => {
      setMicrosoftStage('picker');
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [microsoftModalOpen, microsoftStage]);

  const handleAddMoreFiles = () => {
    setPickerSelection(selectedFileIds);
    setMicrosoftStage('signin');
    setMicrosoftModalOpen(true);
  };

  const handleMicrosoftCancel = () => {
    setMicrosoftModalOpen(false);
    setMicrosoftStage('signin');
    setPickerSelection(selectedFileIds);
  };

  const handleMicrosoftSelect = () => {
    setSelectedFileIds(pickerSelection);
    setMicrosoftModalOpen(false);
    setMicrosoftStage('signin');
  };

  const removeFile = (id: string) => {
    setSelectedFileIds((prev) => prev.filter((fileId) => fileId !== id));
  };

  const toggleContentType = (id: string) => {
    setContentTypes((prev) =>
      prev.includes(id) ? prev.filter((contentType) => contentType !== id) : [...prev, id],
    );
  };

  const setSiteUrl = (index: number, value: string) => {
    setSiteUrls((prev) => prev.map((siteUrl, currentIndex) => (currentIndex === index ? value : siteUrl)));
  };

  const removeSiteUrl = (index: number) => {
    setSiteUrls((prev) => (prev.length === 1 ? prev : prev.filter((_, currentIndex) => currentIndex !== index)));
  };

  const toggleCustomDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((current) => current !== day) : [...prev, day],
    );
  };

  const onSave = async () => {
    if (!canSave || !dirty) return;
    setSubmitting(true);
    try {
      const updated = await updateSourceBasics(source.id, {
        name: trimmedName,
        description: trimmedDesc,
      });
      notify({ type: 'success', title: cp.toast.savedTitle });
      onSaved(updated);
    } catch (err) {
      notify({
        type: 'error',
        title: cp.errors.saveFailedTitle,
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fpmodal-overlay">
      <div
        className="fpmodal sp-fpmodal"
        role="dialog"
        aria-modal="true"
        aria-label={cp.title}
      >
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">{cp.title}</h1>
            <p className="fpmodal-subtitle issues-fpmodal-meta">
              {source.type} · {source.issueCount} issue{source.issueCount === 1 ? '' : 's'} · Created by {source.createdBy} · Last updated {formatDateTime(source.updatedAt)}
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
          <button
            type="button"
            className="fpmodal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        <Tabs variant="pill" className="edit-source-tabs" aria-label="Edit source sections">
          <Tab active={activeTab === 'content'} onClick={() => setActiveTab('content')}>
            Content
          </Tab>
          <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Setting
          </Tab>
        </Tabs>

        <div className="fpmodal-body edit-source-body">
          <div className="edit-source-layout">
            <aside className="edit-source-side-card" aria-label="Source details">
              <h2 className="issues-source-card__title">Source details</h2>
              <Input label="Source name" required value={trimmedName || source.name} readOnly />
              <Textarea
                label="Description"
                required
                value={trimmedDesc || source.description || 'No description provided.'}
                readOnly
                rows={4}
              />
            </aside>

            <section className="edit-source-main-card" aria-label={activeTab === 'content' ? 'Selected content' : 'Source settings'}>
              {activeTab === 'content' ? (
                <div className="sp-selected-files-card">
                  <div className="sp-selected-scope">
                    <div className="sp-selected-scope__header">
                      <div>
                        <h2 className="issues-source-card__title">{sp.fields.selectedFilesTitle}</h2>
                        <p className="sp-selected-scope__hint">{sp.fields.selectedFilesHint}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddMoreFiles}
                      >
                        {sp.fields.addMoreFiles}
                      </Button>
                    </div>
                    <div className="sp-selected-files-table" role="table" aria-label={sp.fields.selectedFilesTitle}>
                      <div className="sp-selected-files-table__head" role="row">
                        <span role="columnheader">{sp.fields.selectedName}</span>
                        <span role="columnheader">{sp.fields.selectedType}</span>
                        <span role="columnheader">{sp.fields.selectedLocation}</span>
                        <span role="columnheader">{sp.fields.selectedSize}</span>
                        <span role="columnheader">{sp.fields.selectedActions}</span>
                      </div>
                      {selectedFiles.map((file) => (
                        <div key={file.id} className="sp-selected-files-table__row" role="row">
                          <span className="sp-selected-files-table__name" role="cell">
                            <Icon name={file.type === 'Folder' ? 'folder' : 'document'} weight="bold" size="sm" />
                            {file.name}
                          </span>
                          <span role="cell">{file.type}</span>
                          <span role="cell">{file.location}</span>
                          <span role="cell">{file.size}</span>
                          <span role="cell">
                            <Button variant="tertiary" size="sm" onClick={() => removeFile(file.id)}>
                              <Icon name="cancel" weight="bold" size="sm" />
                              {sp.fields.removeSelected}
                            </Button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="issues-settings">
                  <section className="issues-settings-section">
                    <h2>{sp.sections.scope}</h2>
                    <div className="fpmodal-card">
                      <div className="sp-content-scope-field">
                        <label className="form-label">
                          {sp.fields.contentTypes}
                          <span className="required">*</span>
                        </label>
                        <span className="form-hint">{sp.fields.contentTypesHint}</span>
                        <div
                          role="group"
                          aria-label={sp.fields.contentTypes}
                          className="sp-content-type-grid"
                        >
                          {SHAREPOINT_CONTENT_TYPES.map((contentType) => (
                            <Checkbox
                              key={contentType.id}
                              label={contentType.label}
                              checked={contentTypes.includes(contentType.id)}
                              onChange={() => toggleContentType(contentType.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="issues-settings-divider" role="separator" aria-hidden="true" />

                  <section className="issues-settings-section">
                    <h2>Connection</h2>
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
                            name="edit-source-sync-mode"
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
              )}
            </section>
          </div>
        </div>

        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                {cp.actions.cancel}
              </Button>
              <Button
                onClick={onSave}
                disabled={!canSave || !dirty || submitting}
              >
                {cp.actions.save}
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
        {microsoftModalOpen && (
          <MicrosoftConnectModal
            stage={microsoftStage}
            selection={pickerSelection}
            onToggleSelection={(id) =>
              setPickerSelection((prev) =>
                prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
              )
            }
            onCancel={handleMicrosoftCancel}
            onSelect={handleMicrosoftSelect}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

function MicrosoftConnectModal({
  stage,
  selection,
  onToggleSelection,
  onCancel,
  onSelect,
}: {
  stage: 'signin' | 'picker';
  selection: string[];
  onToggleSelection: (id: string) => void;
  onCancel: () => void;
  onSelect: () => void;
}) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const currentItems = getMicrosoftPickerItems(currentFolderId);
  const breadcrumbs = getMicrosoftPickerBreadcrumbs(currentFolderId);

  return (
    <div className="sp-ms-window" role="dialog" aria-modal="true" aria-label="Connect Microsoft account">
      <div className="sp-ms-window__chrome">
        <span className="sp-ms-window__dot" />
        <span className="sp-ms-window__dot" />
        <span className="sp-ms-window__dot" />
        <strong>{stage === 'signin' ? 'Connect Microsoft account' : 'Select a file to share'}</strong>
      </div>
      {stage === 'signin' ? (
        <div className="sp-ms-signin">
          <div className="sp-ms-signin__card">
            <div className="sp-ms-brand">
              <span className="sp-ms-brand__mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>Microsoft</span>
            </div>
            <h2>Sign in</h2>
            <div className="sp-ms-signin__spinner-area">
              <div className="sp-ms-autologin" aria-live="polite">
                <Spinner size="large" aria-label="Signing in" />
                <span>Signing in automatically…</span>
              </div>
            </div>
          </div>
          <div className="sp-ms-signin__options">
            <Icon name="shield" weight="bold" size="md" />
            Sign-in options
          </div>
        </div>
      ) : (
        <div className="sp-ms-picker">
          <aside className="sp-ms-picker__nav" aria-label="Microsoft file navigation">
            <h2>Pick files</h2>
            {['My files', 'Recent', 'Shared', 'Favorites'].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`sp-ms-picker__nav-item${index === 0 ? ' active' : ''}`}
              >
                <Icon name={index === 0 ? 'folder' : 'document'} weight="bold" size="sm" />
                {label}
              </button>
            ))}
          </aside>
          <main className="sp-ms-picker__content">
            <div className="sp-ms-picker__toolbar">
              <div className="sp-ms-picker__crumbs" aria-label="Current folder path">
                <button type="button" onClick={() => setCurrentFolderId(null)}>
                  My files
                </button>
                {breadcrumbs.map((folder) => (
                  <span key={folder.id} className="sp-ms-picker__crumb">
                    <Icon name="arrow-right" size="xs" />
                    <button type="button" onClick={() => setCurrentFolderId(folder.id)}>
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
              <div className="sp-ms-picker__search">
                <Icon name="search" size="sm" />
                Search
              </div>
            </div>
            <div className="sp-ms-picker__table" role="listbox" aria-label="SharePoint files and folders">
              <div className="sp-ms-picker__head">
                <span />
                <span>Name</span>
                <span>Modified</span>
                <span>Modified By</span>
              </div>
              {currentItems.map((item) => {
                const selected = selection.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={selected}
                    className={`sp-ms-picker__row${selected ? ' selected' : ''}`}
                  >
                    <Checkbox
                      checked={selected}
                      onChange={() => onToggleSelection(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                    {item.type === 'folder' ? (
                      <button
                        type="button"
                        className="sp-ms-picker__file sp-ms-picker__folder-link"
                        onClick={() => setCurrentFolderId(item.id)}
                      >
                        <Icon name="folder" weight="bold" size="md" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.meta}</small>
                        </span>
                      </button>
                    ) : (
                      <span className="sp-ms-picker__file">
                        <Icon name="document" weight="bold" size="md" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.meta}</small>
                        </span>
                      </span>
                    )}
                    <span>January 14, 2021</span>
                    <span>Stewart Curry</span>
                  </div>
                );
              })}
              {currentItems.length === 0 && (
                <div className="sp-ms-picker__empty">This folder is empty.</div>
              )}
            </div>
            <div className="sp-ms-picker__footer">
              <Button disabled={selection.length === 0} onClick={onSelect}>Select</Button>
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
