import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import { Card } from '../components/shared/Card';
import { EmptyState } from '../components/shared/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/shared/Table';
import Tabs, { Tab, TabPanel } from '../components/shared/Tabs';
import { Banner } from '../components/shared/Banner';
import Toolbar from '../components/shared/Toolbar';
import { MenuItem, MenuOverlay, useMenu } from '../components/shared/Menu';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';
import SearchField from '../components/shared/SearchField';
import { Filter } from '../components/shared/Filter';
import { Icon } from '../icons';
import {
  type Agent,
  type Collection,
  type KnowledgeSource,
  type SourceStatus,
  type SyncRun,
  getCollection,
  isSharePointEnabled,
  listAgentsForCollection,
  listSourceIssues,
  listSources,
  listSyncRuns,
  triggerManualSync,
} from '../services/knowledgeService';
import AddSharePointModal from './knowledge/AddSharePointModal';
import ComingSoonModal from './knowledge/ComingSoonModal';
import EditSourceModal from './knowledge/EditSourceModal';
import SourceIssuesDrawer from './knowledge/SourceIssuesDrawer';
import SyncProgressDrawer from './knowledge/SyncProgressDrawer';
import { knowledgeCopy } from './knowledge/copy';
import { formatBytes, formatDateTime, formatRelative } from './knowledge/utils';

const cp = knowledgeCopy.detail;

type Subtab = 'sources' | 'usedBy' | 'history';
type ComingSoonKind = 'files' | 'article' | 'websites' | null;

/* Icons chosen to match the Momentum set referenced in the design:
   - files       → document/page glyph for "Upload files"
   - edit        → pencil glyph for "Create an article"
   - link        → chain-link glyph for "Extract websites"
   - integrations → connected-nodes glyph for "SharePoint" (network metaphor) */
const SOURCE_TYPE_CARDS = [
  { id: 'files', icon: 'files', copy: cp.empty.cards.files },
  { id: 'article', icon: 'edit', copy: cp.empty.cards.article },
  { id: 'websites', icon: 'link', copy: cp.empty.cards.websites },
  { id: 'sharepoint', icon: 'integrations', copy: cp.empty.cards.sharepoint },
] as const;

async function withLiveIssueCounts(sources: KnowledgeSource[]) {
  const issueLists = await Promise.all(sources.map((source) => listSourceIssues(source.id)));
  return sources.map((source, index) => ({
    ...source,
    issueCount: issueLists[index].length,
  }));
}

export default function KnowledgeBaseDetail() {
  const { kbId } = useParams<{ kbId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [collection, setCollection] = useState<Collection | undefined>();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Subtab>('sources');
  const [spEnabled, setSpEnabled] = useState(true);
  const [showSharepointModal, setShowSharepointModal] = useState(false);
  const [comingSoon, setComingSoon] = useState<ComingSoonKind>(null);
  const [issuesFor, setIssuesFor] = useState<{ source: KnowledgeSource; filter?: 'all' | 'processing_failure' } | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [progressFor, setProgressFor] = useState<KnowledgeSource | null>(null);
  const [editFor, setEditFor] = useState<KnowledgeSource | null>(null);

  const refreshSources = useCallback(async () => {
    if (!kbId) return;
    const next = await listSources(kbId);
    setSources(await withLiveIssueCounts(next));
  }, [kbId]);

  useEffect(() => {
    if (!kbId) return;
    setLoading(true);
    Promise.all([
      getCollection(kbId),
      listSources(kbId),
      listAgentsForCollection(kbId),
      isSharePointEnabled(),
    ])
      .then(async ([c, s, a, enabled]) => {
        setCollection(c);
        setSources(await withLiveIssueCounts(s));
        setAgents(a);
        setSpEnabled(enabled);
      })
      .finally(() => setLoading(false));
  }, [kbId]);

  useEffect(() => {
    if (tab !== 'history' || sources.length === 0) return;
    // Aggregate most-recent runs for each source for the History tab.
    Promise.all(sources.map((s) => listSyncRuns(s.id))).then((lists) => {
      const flat = lists.flat().sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
      setRuns(flat);
    });
  }, [tab, sources]);

  const addMenu = useMenu();
  const overflowMenu = useMenu();

  const handleAddSource = (kind: 'files' | 'article' | 'websites' | 'sharepoint') => {
    addMenu.close();
    if (kind === 'sharepoint') {
      setShowSharepointModal(true);
    } else {
      setComingSoon(kind);
    }
  };

  const onCreated = (created: KnowledgeSource) => {
    setSources((prev) => [created, ...prev]);
    notify({
      type: 'success',
      title: cp.firstSyncToast.title,
      message: cp.firstSyncToast.message,
    });
    setSyncingIds((prev) => new Set(prev).add(created.id));
    window.setTimeout(() => {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(created.id);
        return next;
      });
      refreshSources();
    }, 2500);
  };

  /* Manual "Sync now" / restart sync handler. We intentionally do NOT fire
     a success toast here: the table row itself flips to the "Syncing" chip
     and the sync-progress drawer surfaces live status, so a toast would be
     redundant noise. Failures still surface on the next `refreshSources`
     via the row's status chip. */
  const handleSyncNow = async (source: KnowledgeSource) => {
    setSyncingIds((prev) => new Set(prev).add(source.id));
    try {
      await triggerManualSync(source.id);
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
      refreshSources();
    }
  };

  if (!loading && !collection) {
    return (
      <div className="primary-content">
        <EmptyState
          illustration="cliff-open"
          title={cp.notFound.title}
          description={cp.notFound.description}
          actions={<Button onClick={() => navigate('/knowledge')}>{cp.notFound.action}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="primary-content">
      {collection && (
        <>
          <DetailHeader
            collection={collection}
            agentsCount={agents.length}
            spEnabled={spEnabled}
            addMenu={addMenu}
            overflowMenu={overflowMenu}
            onAdd={handleAddSource}
            onBack={() => navigate('/knowledge')}
          />

          {!spEnabled && (
            <Banner
              type="info"
              title="SharePoint is not enabled for this tenant"
              subtitle="Ask an admin to enable the SharePoint connector under Integrations."
              dismissable={false}
            />
          )}

          <Tabs aria-label={collection.name}>
            <Tab active={tab === 'sources'} onClick={() => setTab('sources')}>
              {cp.subtabs.sources}
            </Tab>
            <Tab active={tab === 'usedBy'} onClick={() => setTab('usedBy')}>
              {cp.subtabs.usedBy}
            </Tab>
            <Tab active={tab === 'history'} onClick={() => setTab('history')}>
              {cp.subtabs.history}
            </Tab>
          </Tabs>

          <TabPanel>
            {tab === 'sources' && (
              sources.length === 0 ? (
                <SourcesEmptyState
                  spEnabled={spEnabled}
                  onChoose={handleAddSource}
                />
              ) : (
                <SourcesPanel
                  sources={sources}
                  syncingIds={syncingIds}
                  onOpenIssues={(src, filter) => setIssuesFor({ source: src, filter })}
                  onOpenProgress={(src) => setProgressFor(src)}
                  onSyncNow={handleSyncNow}
                  onEdit={(src) => setEditFor(src)}
                />
              )
            )}

            {tab === 'usedBy' && <UsedByTable agents={agents} />}

            {tab === 'history' && <HistoryTable runs={runs} sources={sources} onOpenIssues={(src) => setIssuesFor({ source: src, filter: 'processing_failure' })} />}
          </TabPanel>
        </>
      )}

      {showSharepointModal && collection && (
        <AddSharePointModal
          collection={collection}
          onClose={() => setShowSharepointModal(false)}
          onCreated={(src) => {
            setShowSharepointModal(false);
            onCreated(src);
          }}
        />
      )}

      {comingSoon && (
        <ComingSoonModal
          sourceLabel={
            comingSoon === 'files' ? cp.addSourceMenu.files
            : comingSoon === 'article' ? cp.addSourceMenu.article
            : cp.addSourceMenu.websites
          }
          onClose={() => setComingSoon(null)}
        />
      )}

      {issuesFor && (
        <SourceIssuesDrawer
          source={issuesFor.source}
          initialFilter={issuesFor.filter}
          onClose={() => setIssuesFor(null)}
        />
      )}

      {editFor && (
        <EditSourceModal
          source={editFor}
          onClose={() => setEditFor(null)}
          onSaved={() => {
            setEditFor(null);
            refreshSources();
          }}
        />
      )}

      {progressFor && (
        <SyncProgressDrawer
          source={progressFor}
          onClose={() => setProgressFor(null)}
          onComplete={() => {
            /* Clear the optimistic syncing flag so the row can't stay stuck
               on the "Syncing" chip after the run settles. Without this,
               `isSyncing = syncingIds.has(s.id) || s.status === 'syncing'`
               could keep the chip syncing even though the source status
               flipped to `has_issues`/`processed`. */
            setSyncingIds((prev) => {
              if (!prev.has(progressFor.id)) return prev;
              const next = new Set(prev);
              next.delete(progressFor.id);
              return next;
            });
            refreshSources();
          }}
          onViewIssues={(src) => {
            setProgressFor(null);
            setIssuesFor({ source: src, filter: 'processing_failure' });
          }}
        />
      )}
    </div>
  );
}

/* ── Header with metadata strip, Add-source split, overflow menu ── */

interface DetailHeaderProps {
  collection: Collection;
  agentsCount: number;
  spEnabled: boolean;
  addMenu: ReturnType<typeof useMenu>;
  overflowMenu: ReturnType<typeof useMenu>;
  onAdd: (kind: 'files' | 'article' | 'websites' | 'sharepoint') => void;
  onBack: () => void;
}

function DetailHeader({ collection, agentsCount, spEnabled, addMenu, overflowMenu, onAdd, onBack }: DetailHeaderProps) {
  const addWrapRef = useRef<HTMLDivElement>(null);
  const overflowWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (addMenu.anchorRef as React.MutableRefObject<HTMLElement | null>).current = addWrapRef.current;
  });
  useEffect(() => {
    (overflowMenu.anchorRef as React.MutableRefObject<HTMLElement | null>).current = overflowWrapRef.current;
  });

  return (
    <header className="collection-detail-header">
      <button
        type="button"
        onClick={onBack}
        className="collection-detail-back"
      >
        <Icon name="arrow-left" weight="bold" size="sm" />
        {knowledgeCopy.detail.back}
      </button>

      <div className="collection-detail-topbar">
        <h1 className="collection-detail-title">{collection.name}</h1>
        <div className="collection-detail-actions">
          <div
            ref={addWrapRef}
            style={{ display: 'inline-flex', borderRadius: 'var(--radius-medium)' }}
          >
            <Button size="sm" onClick={() => addMenu.toggle()}>
              {cp.addSource}
              <span style={{ marginLeft: 6, display: 'inline-flex' }}>
                <Icon name="arrow-down" weight="bold" size="xs" />
              </span>
            </Button>
            <MenuOverlay open={addMenu.open} anchorRef={addMenu.anchorRef} onClose={addMenu.close} align="right">
              <MenuItem label={cp.addSourceMenu.files} icon="files" onClick={() => onAdd('files')} />
              <MenuItem label={cp.addSourceMenu.article} icon="document" onClick={() => onAdd('article')} />
              <MenuItem label={cp.addSourceMenu.websites} icon="browser" onClick={() => onAdd('websites')} />
              <MenuItem
                label={cp.addSourceMenu.sharepoint}
                icon="apps"
                onClick={() => onAdd('sharepoint')}
                disabled={!spEnabled}
              />
            </MenuOverlay>
          </div>
          <div ref={overflowWrapRef} style={{ display: 'inline-flex' }}>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Collection actions"
              className="collection-detail-overflow"
              onClick={() => overflowMenu.toggle()}
            >
              <Icon name="more-adr" weight="bold" size="sm" />
            </Button>
          </div>
          <MenuOverlay open={overflowMenu.open} anchorRef={overflowMenu.anchorRef} onClose={overflowMenu.close} align="right">
            <MenuItem label={cp.overflowMenu.rename} icon="edit" />
            <MenuItem label={cp.overflowMenu.archive} icon="archive" />
            <MenuItem label={cp.overflowMenu.delete} icon="delete" danger />
          </MenuOverlay>
        </div>
      </div>

      <div className="collection-detail-meta">
        <span>
          <strong>ID:</strong> <code>{collection.id}</code>
        </span>
        <span>
          <strong>Storage:</strong> {formatBytes(collection.storageUsedBytes)} / {formatBytes(collection.storageQuotaBytes)}
        </span>
        <span>
          <strong>Created by</strong> {collection.createdBy}
        </span>
        <span>
          <strong>Last updated</strong> {formatRelative(collection.updatedAt)} by {collection.updatedBy}
        </span>
        <span>
          <strong>Used by</strong> {agentsCount} {agentsCount === 1 ? 'agent' : 'agents'}
        </span>
      </div>
    </header>
  );
}

/* ── Empty sources state with 4-up source cards ───────────────── */

function SourcesEmptyState({
  spEnabled,
  onChoose,
}: {
  spEnabled: boolean;
  onChoose: (kind: 'files' | 'article' | 'websites' | 'sharepoint') => void;
}) {
  return (
    <div className="sources-panel sources-panel--empty">
      <EmptyState
        illustration="box-open"
        title={cp.empty.title}
        description={cp.empty.description}
      />
      <div className="source-type-grid">
        {SOURCE_TYPE_CARDS.map((card) => {
          const disabled = card.id === 'sharepoint' && !spEnabled;
          return (
            <Card
              key={card.id}
              clickable
              disabled={disabled}
              className="source-type-card"
              onClick={() => onChoose(card.id)}
            >
              <div className="source-type-card__head">
                <span className="source-type-card__icon">
                  <Icon name={card.icon} weight="bold" size={24} />
                </span>
                <h3 className="source-type-card__title">{card.copy.title}</h3>
              </div>
              <p className="source-type-card__desc">{card.copy.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Populated sources table with clickable Status column ─────── */

/* Glass-background panel that wraps the sources toolbar (search + type
   filter) and the table below. Filters are applied in-memory here so the
   inner <SourcesTable /> stays a pure presentation component. */
function SourcesPanel({
  sources,
  syncingIds,
  onOpenIssues,
  onOpenProgress,
  onSyncNow,
  onEdit,
}: {
  sources: KnowledgeSource[];
  syncingIds: Set<string>;
  onOpenIssues: (src: KnowledgeSource, filter?: 'all' | 'processing_failure') => void;
  onOpenProgress: (src: KnowledgeSource) => void;
  onSyncNow: (src: KnowledgeSource) => void;
  onEdit: (src: KnowledgeSource) => void;
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | KnowledgeSource['type']>('all');

  /* Build filter options with live facet counts so users can see how many
     sources exist per type before committing to a filter. */
  const filterOptions = useMemo(() => {
    const counts: Record<KnowledgeSource['type'], number> = {
      sharepoint: 0,
      files: 0,
      article: 0,
      websites: 0,
    };
    for (const s of sources) counts[s.type] += 1;
    return [
      { value: 'all', label: cp.sourcesTable.filterAll },
      { value: 'sharepoint', label: cp.sourcesTable.filterSharepoint, count: counts.sharepoint },
      { value: 'files', label: cp.sourcesTable.filterFiles, count: counts.files },
      { value: 'article', label: cp.sourcesTable.filterArticle, count: counts.article },
      { value: 'websites', label: cp.sourcesTable.filterWebsites, count: counts.websites },
    ];
  }, [sources]);

  /* Case-insensitive match against name + description so users can find a
     source by either field without needing to know which column holds the
     hit. */
  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sources, query, typeFilter]);

  return (
    <section className="sources-panel">
      <div className="sources-panel__toolbar">
        <div className="sources-panel__search">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={cp.sourcesTable.searchPlaceholder}
            aria-label={cp.sourcesTable.searchPlaceholder}
          />
        </div>
        <Filter
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          options={filterOptions}
        />
      </div>
      <SourcesTable
        sources={filteredSources}
        syncingIds={syncingIds}
        onOpenIssues={onOpenIssues}
        onOpenProgress={onOpenProgress}
        onSyncNow={onSyncNow}
        onEdit={onEdit}
      />
    </section>
  );
}

function SourcesTable({
  sources,
  syncingIds,
  onOpenIssues,
  onOpenProgress,
  onSyncNow,
  onEdit,
}: {
  sources: KnowledgeSource[];
  syncingIds: Set<string>;
  onOpenIssues: (src: KnowledgeSource, filter?: 'all' | 'processing_failure') => void;
  onOpenProgress: (src: KnowledgeSource) => void;
  onSyncNow: (src: KnowledgeSource) => void;
  onEdit: (src: KnowledgeSource) => void;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>{cp.sourcesTable.name}</TableHeader>
          <TableHeader>{cp.sourcesTable.description}</TableHeader>
          <TableHeader>{cp.sourcesTable.type}</TableHeader>
          <TableHeader>{cp.sourcesTable.createdBy}</TableHeader>
          <TableHeader>{cp.sourcesTable.updatedAt}</TableHeader>
          <TableHeader>{cp.sourcesTable.status}</TableHeader>
          <TableHeader>{cp.sourcesTable.controls}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody empty={sources.length === 0}>
        {sources.map((s) => {
          const isSyncing = syncingIds.has(s.id) || s.status === 'syncing';
          const shouldOpenIssues = s.status === 'has_issues' || s.status === 'failed' || s.issueCount > 0;
          return (
            <TableRow key={s.id}>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={sourceTypeIcon(s.type)} weight="bold" size="sm" />
                  <span>{s.name}</span>
                </div>
              </TableCell>
              <TableCell style={{ maxWidth: 280, whiteSpace: 'normal' }}>{s.description ?? '—'}</TableCell>
              <TableCell style={{ textTransform: 'capitalize' }}>{s.type}</TableCell>
              <TableCell>{s.createdBy}</TableCell>
              <TableCell>{formatRelative(s.updatedAt)}</TableCell>
              <TableCell>
                <StatusCell
                  status={isSyncing ? 'syncing' : s.status}
                  issueCount={s.issueCount}
                  onOpenIssues={(filter) => onOpenIssues(s, filter)}
                  onOpenProgress={() => onOpenProgress(s)}
                />
              </TableCell>
              <TableCell>
                <Toolbar.ButtonGroup
                  size="compact"
                  autoDividers={false}
                  className="sources-row-actions"
                >
                  <Toolbar.IconButton
                    icon="refresh-bold"
                    label={cp.sourcesTable.syncNow}
                    disabled={isSyncing}
                    onClick={() => onSyncNow(s)}
                  />
                  <Toolbar.IconButton
                    icon="edit-bold"
                    label={cp.sourcesTable.edit}
                    onClick={() =>
                      isSyncing
                        ? onOpenProgress(s)
                        : shouldOpenIssues
                        ? onOpenIssues(s, s.status === 'failed' ? 'processing_failure' : 'all')
                        : onEdit(s)
                    }
                  />
                  <Toolbar.IconButton icon="delete-bold" label={cp.sourcesTable.delete} />
                </Toolbar.ButtonGroup>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function StatusCell({
  status,
  issueCount,
  onOpenIssues,
  onOpenProgress,
}: {
  status: SourceStatus;
  issueCount: number;
  onOpenIssues: (filter?: 'all' | 'processing_failure') => void;
  onOpenProgress: () => void;
}) {
  if (status === 'syncing') {
    return (
      <button
        type="button"
        className="source-status-cell__trigger"
        onClick={onOpenProgress}
        aria-label="View sync progress"
      >
        <Badge variant="info">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Spinner size="small" />
            {cp.status.syncing}
          </span>
        </Badge>
      </button>
    );
  }
  if (status === 'processed') {
    if (issueCount > 0) {
      return (
        <button
          type="button"
          className="source-status-cell__trigger"
          onClick={() => onOpenIssues('all')}
        >
          <Badge variant="warning">{cp.status.hasIssues(issueCount)}</Badge>
        </button>
      );
    }
    return (
      <span className="source-status-cell">
        <Badge variant="success">{cp.status.processed}</Badge>
      </span>
    );
  }
  if (status === 'has_issues') {
    return (
      <button
        type="button"
        className="source-status-cell__trigger"
        onClick={() => onOpenIssues('all')}
      >
        <Badge variant="warning">{cp.status.hasIssues(issueCount)}</Badge>
      </button>
    );
  }
  if (status === 'failed') {
    return (
      <button
        type="button"
        className="source-status-cell__trigger"
        onClick={() => onOpenIssues('processing_failure')}
      >
        <Badge variant="error">{cp.status.failed}</Badge>
      </button>
    );
  }
  return (
    <span className="source-status-cell">
      <Badge variant="default">{cp.status.draft}</Badge>
    </span>
  );
}

/* ── Used By tab ──────────────────────────────────────────────── */

function UsedByTable({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <EmptyState
        illustration="desert-open-results"
        title={cp.usedByTable.emptyTitle}
        description={cp.usedByTable.emptyDesc}
      />
    );
  }
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Agent</TableHeader>
          <TableHeader>Connected</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {agents.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <strong>{a.name}</strong>
            </TableCell>
            <TableCell>{formatRelative(a.connectedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ── History tab ──────────────────────────────────────────────── */

function HistoryTable({
  runs,
  sources,
  onOpenIssues,
}: {
  runs: SyncRun[];
  sources: KnowledgeSource[];
  onOpenIssues: (src: KnowledgeSource) => void;
}) {
  const sourceById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  if (runs.length === 0) {
    return (
      <EmptyState
        illustration="message-activity"
        title="No sync runs yet"
        description="Once a source syncs, each run will appear here with its results."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Source</TableHeader>
          <TableHeader>{cp.historyTable.started}</TableHeader>
          <TableHeader>{cp.historyTable.finished}</TableHeader>
          <TableHeader>{cp.historyTable.mode}</TableHeader>
          <TableHeader>{cp.historyTable.actions}</TableHeader>
          <TableHeader>{cp.historyTable.trigger}</TableHeader>
          <TableHeader>{cp.historyTable.status}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {runs.map((r) => {
          const src = sourceById.get(r.sourceId);
          const hasFailures = r.failed > 0;
          return (
            <TableRow key={r.id}>
              <TableCell>{src?.name ?? r.sourceId}</TableCell>
              <TableCell>{formatDateTime(r.startedAt)}</TableCell>
              <TableCell>{r.finishedAt ? formatDateTime(r.finishedAt) : '—'}</TableCell>
              <TableCell style={{ textTransform: 'capitalize' }}>{r.mode}</TableCell>
              <TableCell>
                {(() => {
                  const parts = [
                    r.added > 0 && `${r.added} Added`,
                    r.updated > 0 && `${r.updated} Updated`,
                    r.deleted > 0 && `${r.deleted} Deleted`,
                    r.skipped > 0 && `${r.skipped} Skipped`,
                    r.failed > 0 && `${r.failed} Failed`,
                  ].filter(Boolean) as string[];

                  return parts.length > 0 ? parts.join(', ') : '—';
                })()}
              </TableCell>
              <TableCell style={{ textTransform: 'capitalize' }}>{r.trigger}</TableCell>
              <TableCell>
                {hasFailures && src ? (
                  <button
                    type="button"
                    className="source-status-cell__trigger"
                    onClick={() => onOpenIssues(src)}
                  >
                    <Badge variant={r.status === 'succeeded' ? 'success' : r.status === 'partial' ? 'warning' : 'error'}>
                      {r.status}
                    </Badge>
                  </button>
                ) : (
                  <Badge variant={r.status === 'succeeded' ? 'success' : r.status === 'partial' ? 'warning' : r.status === 'failed' ? 'error' : 'info'}>
                    {r.status}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function sourceTypeIcon(type: KnowledgeSource['type']): 'apps' | 'files' | 'document' | 'browser' | 'folder' {
  switch (type) {
    case 'sharepoint':
      return 'apps';
    case 'files':
      return 'files';
    case 'article':
      return 'document';
    case 'websites':
      return 'browser';
    default:
      return 'folder';
  }
}
