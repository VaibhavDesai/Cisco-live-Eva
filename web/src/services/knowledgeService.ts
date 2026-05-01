/**
 * Mock Knowledge service — typed, Promise-returning API that mirrors the
 * shape of the future real service. Swap these implementations for real
 * network calls without changing any consumers.
 *
 * NOTE: All data here is in-memory; no calls leave the browser.
 */

export type SourceType = 'sharepoint' | 'files' | 'article' | 'websites';

export type SourceStatus =
  | 'processed'
  | 'syncing'
  | 'has_issues'
  | 'failed'
  | 'draft';

export type SyncMode = 'full' | 'incremental';

export type SyncFrequency = 'daily' | 'weekly' | 'biweekly' | 'custom';

export type SyncTrigger = 'manual' | 'scheduled';

export type IssueType =
  | 'unsupported_type'
  | 'oversize'
  | 'processing_failure';

/* ── Data models ───────────────────────────────────────────────── */

export interface Collection {
  id: string;
  name: string;
  description: string;
  sourceCount: number;
  usedBy: string[];
  totalItems: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  type: SourceType;
  status: SourceStatus;
  issueCount: number;
  tenantId?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  lastSyncAt?: string;
  lastSyncMode?: SyncMode;
}

export interface SharePointSourceConfig {
  name: string;
  description: string;
  hostingMethod: 'online';
  domain: string;
  siteUrls: string[];
  connectionId: string;
  contentTypes: string[];
  entities: string[];
  entityRegex?: string[];
  attachmentRegex?: string[];
  includeAcl: boolean;
  syncMode: SyncMode;
  frequency: SyncFrequency;
  customInterval?: { days: string[]; time: string };
}

export interface SyncRun {
  id: string;
  sourceId: string;
  startedAt: string;
  finishedAt?: string;
  mode: SyncMode;
  trigger: SyncTrigger;
  added: number;
  updated: number;
  deleted: number;
  skipped: number;
  failed: number;
  status: 'running' | 'succeeded' | 'partial' | 'failed';
}

export interface SourceIssue {
  id: string;
  sourceId: string;
  syncRunId: string;
  itemName: string;
  itemUrl?: string;
  type: IssueType;
  reason: string;
  detectedAt: string;
  status: 'open' | 'retrying' | 'skipped' | 'excluded';
}

export interface ConnectionOption {
  id: string;
  label: string;
  provider: 'microsoft-entra';
  tenantDomain: string;
}

export interface Agent {
  id: string;
  name: string;
  connectedAt: string;
}

/* ── Fake latency helper ───────────────────────────────────────── */

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/* ── Seed data ─────────────────────────────────────────────────── */

const now = () => new Date().toISOString();

const COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'Customer Support',
    description:
      'Knowledge base for customer support agents containing product documentation, FAQs, and support articles.',
    sourceCount: 3,
    usedBy: ['Customer Support Agent', 'Website Chat Bot', 'Email Assistant'],
    totalItems: 4237,
    storageUsedBytes: 1024 * 1024 * 210,
    storageQuotaBytes: 1024 * 1024 * 1024,
    createdBy: 'Ava Lin',
    createdAt: '2026-01-15T10:15:00Z',
    updatedBy: 'Ava Lin',
    updatedAt: '2026-04-18T14:22:00Z',
  },
  {
    id: 'col-2',
    name: 'Technical Support',
    description:
      'Technical documentation and troubleshooting guides for the IT support team.',
    sourceCount: 2,
    usedBy: ['Tech Support Bot', 'Developer Assistant'],
    totalItems: 1315,
    storageUsedBytes: 1024 * 1024 * 72,
    storageQuotaBytes: 1024 * 1024 * 1024,
    createdBy: 'Mateo García',
    createdAt: '2026-01-10T08:30:00Z',
    updatedBy: 'Ava Lin',
    updatedAt: '2026-04-19T10:02:00Z',
  },
  {
    id: 'col-3',
    name: 'Sales Enablement',
    description: 'Product information and competitive analysis for the sales team.',
    sourceCount: 0,
    usedBy: [],
    totalItems: 0,
    storageUsedBytes: 0,
    storageQuotaBytes: 1024 * 1024 * 1024,
    createdBy: 'Priya Shah',
    createdAt: '2026-02-02T09:10:00Z',
    updatedBy: 'Priya Shah',
    updatedAt: '2026-02-02T09:10:00Z',
  },
];

const SOURCES: KnowledgeSource[] = [
  {
    id: 'src-1',
    collectionId: 'col-1',
    name: 'Contoso Support Hub',
    description: 'Primary SharePoint site for public support content.',
    type: 'sharepoint',
    status: 'processed',
    issueCount: 0,
    tenantId: 'contoso.onmicrosoft.com',
    createdBy: 'Ava Lin',
    createdAt: '2026-01-15T10:30:00Z',
    updatedBy: 'Ava Lin',
    updatedAt: '2026-04-18T12:00:00Z',
    lastSyncAt: '2026-04-18T12:00:00Z',
    lastSyncMode: 'incremental',
  },
  {
    id: 'src-2',
    collectionId: 'col-1',
    name: 'Internal Policies Library',
    description: 'SharePoint document library for product policies.',
    type: 'sharepoint',
    status: 'has_issues',
    issueCount: 4,
    tenantId: 'contoso.onmicrosoft.com',
    createdBy: 'Ava Lin',
    createdAt: '2026-02-04T15:21:00Z',
    updatedBy: 'Ava Lin',
    updatedAt: '2026-04-18T12:05:00Z',
    lastSyncAt: '2026-04-18T12:05:00Z',
    lastSyncMode: 'incremental',
  },
  {
    id: 'src-3',
    collectionId: 'col-1',
    name: 'Knowledge Drafts',
    description: 'Working drafts awaiting review.',
    type: 'sharepoint',
    status: 'syncing',
    issueCount: 0,
    tenantId: 'contoso.onmicrosoft.com',
    createdBy: 'Mateo García',
    createdAt: '2026-03-01T09:00:00Z',
    updatedBy: 'Mateo García',
    updatedAt: now(),
    lastSyncAt: now(),
    lastSyncMode: 'full',
  },
  {
    id: 'src-4',
    collectionId: 'col-2',
    name: 'Engineering Wiki',
    description: 'Engineering SharePoint site.',
    type: 'sharepoint',
    status: 'failed',
    issueCount: 2,
    tenantId: 'contoso.onmicrosoft.com',
    createdBy: 'Mateo García',
    createdAt: '2026-01-10T09:00:00Z',
    updatedBy: 'Mateo García',
    updatedAt: '2026-04-17T23:11:00Z',
    lastSyncAt: '2026-04-17T23:11:00Z',
    lastSyncMode: 'incremental',
  },
  {
    id: 'src-5',
    collectionId: 'col-2',
    name: 'API Handbook',
    description: 'API reference documents.',
    type: 'sharepoint',
    status: 'processed',
    issueCount: 0,
    tenantId: 'contoso.onmicrosoft.com',
    createdBy: 'Ava Lin',
    createdAt: '2026-01-10T09:25:00Z',
    updatedBy: 'Ava Lin',
    updatedAt: '2026-04-19T08:45:00Z',
    lastSyncAt: '2026-04-19T08:45:00Z',
    lastSyncMode: 'incremental',
  },
];

const AGENTS_BY_COLLECTION: Record<string, Agent[]> = {
  'col-1': [
    { id: 'a1', name: 'Customer Support Agent', connectedAt: '2026-02-01T10:00:00Z' },
    { id: 'a2', name: 'Website Chat Bot', connectedAt: '2026-02-12T10:00:00Z' },
    { id: 'a3', name: 'Email Assistant', connectedAt: '2026-03-01T10:00:00Z' },
  ],
  'col-2': [
    { id: 'a4', name: 'Tech Support Bot', connectedAt: '2026-01-20T10:00:00Z' },
    { id: 'a5', name: 'Developer Assistant', connectedAt: '2026-02-15T10:00:00Z' },
  ],
  'col-3': [],
};

const SYNC_RUNS: Record<string, SyncRun[]> = {
  'src-1': [
    {
      id: 'run-1',
      sourceId: 'src-1',
      startedAt: '2026-04-18T11:58:00Z',
      finishedAt: '2026-04-18T12:00:00Z',
      mode: 'incremental',
      trigger: 'scheduled',
      added: 12,
      updated: 8,
      deleted: 1,
      skipped: 0,
      failed: 0,
      status: 'succeeded',
    },
    {
      id: 'run-2',
      sourceId: 'src-1',
      startedAt: '2026-04-17T11:58:00Z',
      finishedAt: '2026-04-17T12:02:00Z',
      mode: 'full',
      trigger: 'manual',
      added: 128,
      updated: 42,
      deleted: 3,
      skipped: 4,
      failed: 0,
      status: 'succeeded',
    },
  ],
  'src-2': [
    {
      id: 'run-3',
      sourceId: 'src-2',
      startedAt: '2026-04-18T12:00:00Z',
      finishedAt: '2026-04-18T12:05:00Z',
      mode: 'incremental',
      trigger: 'scheduled',
      added: 22,
      updated: 13,
      deleted: 0,
      skipped: 5,
      failed: 4,
      status: 'partial',
    },
  ],
  'src-3': [],
  'src-4': [
    {
      id: 'run-4',
      sourceId: 'src-4',
      startedAt: '2026-04-17T23:08:00Z',
      finishedAt: '2026-04-17T23:11:00Z',
      mode: 'incremental',
      trigger: 'scheduled',
      added: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      failed: 2,
      status: 'failed',
    },
  ],
  'src-5': [
    {
      id: 'run-5',
      sourceId: 'src-5',
      startedAt: '2026-04-19T08:42:00Z',
      finishedAt: '2026-04-19T08:45:00Z',
      mode: 'incremental',
      trigger: 'scheduled',
      added: 4,
      updated: 1,
      deleted: 0,
      skipped: 0,
      failed: 0,
      status: 'succeeded',
    },
  ],
};

const ISSUES: SourceIssue[] = [
  {
    id: 'iss-1',
    sourceId: 'src-2',
    syncRunId: 'run-3',
    itemName: 'Q2-strategy.pptx',
    itemUrl: 'https://contoso.sharepoint.com/sites/policies/Q2-strategy.pptx',
    type: 'unsupported_type',
    reason: 'PPTX file format is not supported yet.',
    detectedAt: '2026-04-18T12:04:00Z',
    status: 'open',
  },
  {
    id: 'iss-2',
    sourceId: 'src-2',
    syncRunId: 'run-3',
    itemName: 'All-hands-recording.mp4',
    itemUrl: 'https://contoso.sharepoint.com/sites/policies/All-hands-recording.mp4',
    type: 'oversize',
    reason: 'File exceeds the 50 MB limit (312 MB).',
    detectedAt: '2026-04-18T12:04:00Z',
    status: 'open',
  },
  {
    id: 'iss-3',
    sourceId: 'src-2',
    syncRunId: 'run-3',
    itemName: 'FY24-budget.xlsx',
    itemUrl: 'https://contoso.sharepoint.com/sites/policies/FY24-budget.xlsx',
    type: 'processing_failure',
    reason: 'Extraction failed after 3 attempts. Automatic retry will run in the next sync.',
    detectedAt: '2026-04-18T12:04:00Z',
    status: 'open',
  },
  {
    id: 'iss-4',
    sourceId: 'src-2',
    syncRunId: 'run-3',
    itemName: 'architecture-diagrams.vsdx',
    itemUrl: 'https://contoso.sharepoint.com/sites/policies/architecture-diagrams.vsdx',
    type: 'unsupported_type',
    reason: 'Visio files (.vsdx) are not supported. Export to PDF or PNG and re-upload.',
    detectedAt: '2026-04-18T12:04:00Z',
    status: 'open',
  },
  {
    id: 'iss-5',
    sourceId: 'src-4',
    syncRunId: 'run-4',
    itemName: 'architecture-diagrams.vsdx',
    itemUrl: 'https://contoso.sharepoint.com/sites/engineering/architecture-diagrams.vsdx',
    type: 'unsupported_type',
    reason: 'VSDX file format is not supported yet.',
    detectedAt: '2026-04-17T23:10:00Z',
    status: 'open',
  },
  {
    id: 'iss-6',
    sourceId: 'src-4',
    syncRunId: 'run-4',
    itemName: 'incident-playbook.docx',
    itemUrl: 'https://contoso.sharepoint.com/sites/engineering/incident-playbook.docx',
    type: 'processing_failure',
    reason: 'Timed out while parsing. Retry scheduled.',
    detectedAt: '2026-04-17T23:10:00Z',
    status: 'open',
  },
  {
    id: 'iss-7',
    sourceId: 'src-4',
    syncRunId: 'run-4',
    itemName: 'onboarding-checklist.pdf',
    itemUrl: 'https://contoso.sharepoint.com/sites/engineering/onboarding-checklist.pdf',
    type: 'processing_failure',
    reason: 'Extraction failed after 3 attempts. Automatic retry will run in the next sync.',
    detectedAt: '2026-04-17T23:10:00Z',
    status: 'open',
  },
];

const CONNECTIONS: ConnectionOption[] = [
  {
    id: 'conn-1',
    label: 'Contoso Production (contoso.onmicrosoft.com)',
    provider: 'microsoft-entra',
    tenantDomain: 'contoso.onmicrosoft.com',
  },
  {
    id: 'conn-2',
    label: 'Contoso Sandbox (contoso-test.onmicrosoft.com)',
    provider: 'microsoft-entra',
    tenantDomain: 'contoso-test.onmicrosoft.com',
  },
];

/* ── Feature flags (FR-14) ─────────────────────────────────────── */

export async function isSharePointEnabled(): Promise<boolean> {
  await wait(50);
  return true;
}

/* ── Collections ──────────────────────────────────────────────── */

export async function listCollections(): Promise<Collection[]> {
  await wait();
  return [...COLLECTIONS];
}

export async function getCollection(id: string): Promise<Collection | undefined> {
  await wait();
  return COLLECTIONS.find((c) => c.id === id);
}

/* ── Sources ──────────────────────────────────────────────────── */

export async function listSources(collectionId: string): Promise<KnowledgeSource[]> {
  await wait();
  return SOURCES.filter((s) => s.collectionId === collectionId).map((s) => ({ ...s }));
}

export async function listAllSources(): Promise<KnowledgeSource[]> {
  await wait();
  return SOURCES.map((s) => ({ ...s }));
}

/**
 * Validates and creates a SharePoint source. Returns the created source with
 * status='syncing' to simulate the first sync kicking off immediately.
 */
export async function createSharePointSource(
  collectionId: string,
  config: SharePointSourceConfig,
): Promise<KnowledgeSource> {
  await wait(500);

  if (!/\.sharepoint\.(com|us)$|\.sharepointonline\.com$/i.test(config.domain)) {
    throw new Error(
      'Only SharePoint Online domains (*.sharepoint.com, *.sharepoint.us, *.sharepointonline.com) are supported.',
    );
  }
  if (!config.siteUrls.length) {
    throw new Error('At least one site URL is required.');
  }
  if (!config.contentTypes.length) {
    throw new Error('Select at least one content type to sync.');
  }

  const tenantId = config.domain.replace(/^https?:\/\//, '').split('.')[0] + '.onmicrosoft.com';
  const stamp = now();
  const created: KnowledgeSource = {
    id: `src-${Math.random().toString(36).slice(2, 9)}`,
    collectionId,
    name: config.name,
    description: config.description,
    type: 'sharepoint',
    status: 'syncing',
    issueCount: 0,
    tenantId,
    createdBy: 'You',
    createdAt: stamp,
    updatedBy: 'You',
    updatedAt: stamp,
    lastSyncAt: stamp,
    lastSyncMode: config.syncMode,
  };
  SOURCES.unshift(created);
  return { ...created };
}

/**
 * Minimal source edit — updates only the name/description shown in the
 * sources table. The full SharePoint config (domain, site URLs, connection,
 * scope, schedule, …) is captured at create-time and is intentionally not
 * editable here; richer edit flows can extend this signature later.
 */
export async function updateSourceBasics(
  sourceId: string,
  patch: { name: string; description: string },
): Promise<KnowledgeSource> {
  await wait(300);

  const name = patch.name.trim();
  const description = patch.description.trim();
  if (!name) throw new Error('Give this source a name.');
  if (name.length > 80) throw new Error('Source name must be 80 characters or fewer.');
  if (description.length > 500)
    throw new Error('Description must be 500 characters or fewer.');

  const src = SOURCES.find((s) => s.id === sourceId);
  if (!src) throw new Error('Source not found.');

  src.name = name;
  src.description = description;
  src.updatedBy = 'You';
  src.updatedAt = now();
  return { ...src };
}

export async function triggerManualSync(sourceId: string): Promise<SyncRun> {
  await wait(400);
  const run: SyncRun = {
    id: `run-${Math.random().toString(36).slice(2, 9)}`,
    sourceId,
    startedAt: now(),
    mode: 'incremental',
    trigger: 'manual',
    added: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    failed: 0,
    status: 'running',
  };
  const list = SYNC_RUNS[sourceId] ?? [];
  SYNC_RUNS[sourceId] = [run, ...list];
  const src = SOURCES.find((s) => s.id === sourceId);
  if (src) {
    src.status = 'syncing';
    src.lastSyncAt = run.startedAt;
    src.lastSyncMode = run.mode;
  }
  return { ...run };
}

/* ── Sync runs (History) ─────────────────────────────────────── */

export async function listSyncRuns(sourceId: string): Promise<SyncRun[]> {
  await wait();
  return (SYNC_RUNS[sourceId] ?? []).map((r) => ({ ...r }));
}

/* ── Live sync progress (simulated) ──────────────────────────── */

/**
 * Stages a sync moves through. `done` is emitted once when the simulated
 * run reaches 100% so consumers can transition the source back to
 * `processed` without polling.
 */
export type SyncStage =
  | 'connecting'
  | 'discovering'
  | 'fetching'
  | 'processing'
  | 'indexing'
  | 'done';

export interface SyncProgress {
  sourceId: string;
  stage: SyncStage;
  stageLabel: string;
  /** 0–100. Integer percent for display. */
  percent: number;
  filesProcessed: number;
  totalFiles: number;
  /** Running tally of items that hit issues (processing failures, oversize,
      etc.). Mid-sync the drawer surfaces this inline so users don't have to
      wait until the run completes to know something went wrong. */
  issueCount: number;
  /** Stage in which the first issue was detected, or undefined while the
      run is still clean. Drives the warning marker on the timeline. */
  issueStage?: SyncStage;
  /** Human-readable ETA, e.g. "~12s remaining". Undefined once done. */
  etaLabel?: string;
  startedAt: string;
  updatedAt: string;
}

const STAGE_LABELS: Record<SyncStage, string> = {
  connecting: 'Connecting to source',
  discovering: 'Discovering content',
  fetching: 'Fetching files',
  processing: 'Processing content',
  indexing: 'Indexing for search',
  done: 'Sync complete',
};

/**
 * Total simulated duration for a sync run. Kept deliberately short so the
 * mock UX is observable in under a minute; the real service will emit
 * progress events at its own pace.
 */
const SYNC_DURATION_MS = 30_000;
const TICK_MS = 500;

interface ProgressEntry {
  state: SyncProgress;
  listeners: Set<(p: SyncProgress) => void>;
  timerId?: number;
  /** Stable sync-run id used to link simulated issues to this run. */
  runId: string;
  /** Once true, `seedProcessingIssue` has fired for this run; cleared when
      a fresh run is started by createSharePointSource / triggerManualSync. */
  issueSeeded: boolean;
}

const PROGRESS: Map<string, ProgressEntry> = new Map();

function stageFor(percent: number): SyncStage {
  if (percent >= 100) return 'done';
  if (percent >= 90) return 'indexing';
  if (percent >= 65) return 'processing';
  if (percent >= 20) return 'fetching';
  if (percent >= 5) return 'discovering';
  return 'connecting';
}

function makeInitialState(sourceId: string): SyncProgress {
  const totalFiles = 80 + Math.floor(Math.random() * 120);
  const startedAt = now();
  return {
    sourceId,
    stage: 'connecting',
    stageLabel: STAGE_LABELS.connecting,
    percent: 0,
    filesProcessed: 0,
    totalFiles,
    issueCount: 0,
    etaLabel: '~30s remaining',
    startedAt,
    updatedAt: startedAt,
  };
}

/**
 * Demo injection point: during the processing stage, append a simulated
 * processing-failure issue to the shared ISSUES list and bump the source's
 * issueCount. Idempotent — called every tick in the processing band but
 * only seeds once per run (keyed by `seeded`). Keeps the mock deterministic
 * from the drawer's perspective (always 1 issue, not a growing count).
 */
function seedProcessingIssue(sourceId: string, runId: string) {
  const existing = ISSUES.some((i) => i.sourceId === sourceId && i.syncRunId === runId);
  if (existing) return;
  ISSUES.push({
    id: `iss-${Math.random().toString(36).slice(2, 9)}`,
    sourceId,
    syncRunId: runId,
    itemName: 'Quarterly-review-deck.pptx',
    itemUrl: undefined,
    type: 'processing_failure',
    reason: 'Extraction failed after 3 attempts. Automatic retry will run in the next sync.',
    detectedAt: now(),
    status: 'open',
  });
}

function emit(entry: ProgressEntry) {
  const snapshot: SyncProgress = { ...entry.state };
  entry.listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      /* swallow listener errors — one bad listener shouldn't kill the run */
    }
  });
}

function startTicking(sourceId: string, entry: ProgressEntry) {
  if (entry.timerId != null) return;
  const stepsTotal = SYNC_DURATION_MS / TICK_MS;
  const increment = 100 / stepsTotal;
  entry.timerId = window.setInterval(() => {
    const next = Math.min(100, entry.state.percent + increment);
    const stage = stageFor(next);
    const remainingMs = Math.max(0, Math.round(((100 - next) / 100) * SYNC_DURATION_MS));

    /* Simulate a single file failure mid-processing (~75%). Fires once per
       run so users see the issue count + warning marker appear live. */
    let issueCount = entry.state.issueCount;
    let issueStage = entry.state.issueStage;
    if (!entry.issueSeeded && next >= 75 && stage === 'processing') {
      seedProcessingIssue(sourceId, entry.runId);
      entry.issueSeeded = true;
      issueCount = 1;
      issueStage = 'processing';
    }

    entry.state = {
      ...entry.state,
      percent: Math.round(next),
      stage,
      stageLabel: STAGE_LABELS[stage],
      filesProcessed: Math.min(
        entry.state.totalFiles,
        Math.round((next / 100) * entry.state.totalFiles),
      ),
      issueCount,
      issueStage,
      etaLabel: next >= 100 ? undefined : `~${Math.max(1, Math.ceil(remainingMs / 1000))}s remaining`,
      updatedAt: now(),
    };

    /* IMPORTANT: settle the SOURCES row BEFORE emitting the terminal state.
       The drawer's listener fires `onComplete` synchronously inside `emit`,
       which in turn triggers `refreshSources` on the page. If we mutate
       after the emit, a fast consumer could read stale SOURCES and the
       chip would stay stuck on "Syncing" even though the run finished. */
    if (next >= 100) {
      if (entry.timerId != null) {
        window.clearInterval(entry.timerId);
        entry.timerId = undefined;
      }
      const src = SOURCES.find((s) => s.id === sourceId);
      if (src && src.status === 'syncing') {
        /* If the run surfaced any issues, land on `has_issues` so the table
           chip becomes the warning variant and the existing issues drawer
           gets a live issue to show. Otherwise settle cleanly to processed. */
        if (entry.state.issueCount > 0) {
          src.status = 'has_issues';
          src.issueCount = entry.state.issueCount;
        } else {
          src.status = 'processed';
        }
        src.updatedAt = now();
      }
    }
    emit(entry);
  }, TICK_MS);
}

/**
 * Subscribe to live sync progress for a source. Starts a simulated run if
 * one isn't already in flight. The subscriber receives an immediate
 * snapshot and then updates every 500ms until the run completes.
 *
 * Returns an unsubscribe function. When the last listener unsubscribes
 * the run continues in the background so a different surface (e.g. the
 * status chip elsewhere) can re-subscribe without losing progress.
 */
export function subscribeSyncProgress(
  sourceId: string,
  listener: (progress: SyncProgress) => void,
): () => void {
  let entry = PROGRESS.get(sourceId);
  if (!entry) {
    entry = {
      state: makeInitialState(sourceId),
      listeners: new Set(),
      runId: `run-${Math.random().toString(36).slice(2, 9)}`,
      issueSeeded: false,
    };
    PROGRESS.set(sourceId, entry);
    startTicking(sourceId, entry);
  }
  entry.listeners.add(listener);
  listener({ ...entry.state });
  return () => {
    entry!.listeners.delete(listener);
  };
}

/**
 * Read the current progress snapshot for a source without subscribing.
 * Returns undefined if no run has started yet.
 */
export function getSyncProgress(sourceId: string): SyncProgress | undefined {
  const entry = PROGRESS.get(sourceId);
  return entry ? { ...entry.state } : undefined;
}

/* ── Issues ──────────────────────────────────────────────────── */

export async function listSourceIssues(
  sourceId: string,
  filter?: { type?: IssueType; syncRunId?: string },
): Promise<SourceIssue[]> {
  await wait();
  return ISSUES.filter((i) => i.sourceId === sourceId)
    .filter((i) => (filter?.type ? i.type === filter.type : true))
    .filter((i) => (filter?.syncRunId ? i.syncRunId === filter.syncRunId : true))
    .map((i) => ({ ...i }));
}

/**
 * Simulates retry with exponential backoff delay (FR-11). Returns the
 * mutated issue in a resolved state for the happy path; tests can stub this.
 */
export async function retryIssue(issueId: string): Promise<SourceIssue> {
  const attempt = (retryIssue as unknown as { _a?: number })._a ?? 0;
  const backoff = Math.min(1000 * 2 ** attempt, 4000);
  (retryIssue as unknown as { _a?: number })._a = attempt + 1;
  await wait(backoff);
  const found = ISSUES.find((i) => i.id === issueId);
  if (!found) throw new Error('Issue not found');
  found.status = 'retrying';
  return { ...found };
}

export async function excludeIssue(issueId: string): Promise<SourceIssue> {
  await wait();
  const found = ISSUES.find((i) => i.id === issueId);
  if (!found) throw new Error('Issue not found');
  found.status = 'excluded';
  return { ...found };
}

export async function skipIssue(issueId: string): Promise<SourceIssue> {
  await wait();
  const found = ISSUES.find((i) => i.id === issueId);
  if (!found) throw new Error('Issue not found');
  found.status = 'skipped';
  return { ...found };
}

/* ── Ancillary lookups ───────────────────────────────────────── */

export async function listConnections(): Promise<ConnectionOption[]> {
  await wait();
  return [...CONNECTIONS];
}

export async function listAgentsForCollection(
  collectionId: string,
): Promise<Agent[]> {
  await wait();
  return (AGENTS_BY_COLLECTION[collectionId] ?? []).map((a) => ({ ...a }));
}

/* ── Supported content-type enum (FR-4) ──────────────────────── */

export const SHAREPOINT_CONTENT_TYPES = [
  { id: 'pages', label: 'Site pages' },
  { id: 'news', label: 'News posts' },
  { id: 'docs', label: 'Documents (.docx, .pdf, .txt, .md, .html)' },
  { id: 'spreadsheets', label: 'Spreadsheets (.xlsx, .csv)' },
  { id: 'lists', label: 'Lists' },
  { id: 'wiki', label: 'Wiki pages' },
] as const;

export const SHAREPOINT_LIMITS = {
  maxFileSizeMB: 50,
  maxSourcesPerCollection: 10,
} as const;
