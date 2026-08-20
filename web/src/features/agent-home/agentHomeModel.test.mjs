import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const webRoot = fileURLToPath(new URL('../../..', import.meta.url));
let server;
let createDraftFromProposal;
let AGENT_HOME_REFERENCE_TIME;
let DEFAULT_DEMO_HOME_MODE;
let DEMO_HOME_MODE_STORAGE_KEY;
let buildAgentHomeSnapshot;
let buildDashboardSessionHref;
let persistDemoHomeMode;
let rankAttentionItems;
let readDemoHomeMode;

before(async () => {
  server = await createServer({
    root: webRoot,
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
    resolve: {
      alias: {
        '@momentum-design/components/react': fileURLToPath(new URL('../agent-creation/momentumRuntimeStub.mjs', import.meta.url)),
      },
    },
  });

  ({ createDraftFromProposal } = await server.ssrLoadModule('/src/features/agent-creation/agentCreationModel.ts'));
  ({
    AGENT_HOME_REFERENCE_TIME,
    DEFAULT_DEMO_HOME_MODE,
    DEMO_HOME_MODE_STORAGE_KEY,
    buildAgentHomeSnapshot,
    buildDashboardSessionHref,
    persistDemoHomeMode,
    rankAttentionItems,
    readDemoHomeMode,
  } = await server.ssrLoadModule('/src/features/agent-home/agentHomeModel.ts'));
});

after(async () => {
  await server?.close();
});

const getMetric = (snapshot, id) => {
  const metric = snapshot.metrics.find(candidate => candidate.id === id);
  assert.ok(metric, `Expected metric ${id}`);
  return metric;
};

const makeAttention = (id, severity, observedAt = AGENT_HOME_REFERENCE_TIME) => ({
  id,
  severity,
  title: id,
  description: `${id} description`,
  statusLabel: 'Needs attention',
  statusTone: severity === 'critical' ? 'danger' : 'warning',
  agentId: 'test-agent',
  agentName: 'Test agent',
  observedAt,
  actions: [],
});

test('recurring snapshot derives the connected Cisco Live portfolio story', () => {
  const snapshot = buildAgentHomeSnapshot('recurring');

  assert.equal(snapshot.mode, 'recurring');
  assert.equal(snapshot.generatedAt, AGENT_HOME_REFERENCE_TIME);
  assert.equal(snapshot.header.title, 'Here’s how your agents are doing');
  assert.equal(snapshot.composer.placeholder, 'Ask me anything');
  assert.equal(
    snapshot.header.description,
    'Three published agents handled 3,114 sessions at 96.7% weighted success. One session is recommended for review.',
  );
  assert.equal(getMetric(snapshot, 'agent-health').numericValue, 95.8);
  assert.equal(getMetric(snapshot, 'agent-health').value, '95.8%');
  assert.equal(getMetric(snapshot, 'agent-health').scope, 'Across 7 health signals');
  assert.equal(getMetric(snapshot, 'agent-health').drillDown.label, 'View observability');
  assert.deepEqual(getMetric(snapshot, 'agent-health').visualization, {
    kind: 'health-gauge',
    target: 85,
    gap: 10.8,
    signalCount: 7,
  });
  assert.equal(getMetric(snapshot, 'sessions').numericValue, 3114);
  assert.equal(getMetric(snapshot, 'sessions').value, '3,114');
  assert.equal(getMetric(snapshot, 'sessions').drillDown.label, 'Open sessions');
  assert.deepEqual(getMetric(snapshot, 'sessions').visualization, {
    kind: 'agent-session-bars',
    total: 3114,
    agents: [
      {
        agentId: 'golftop-vip-reservations',
        name: 'EAGLE GREEN VIP Reservations',
        label: 'VIP Reservations',
        sessions: 2814,
      },
      {
        agentId: 'golftop-event-operations',
        name: 'EAGLE GREEN Event Operations',
        label: 'Event Operations',
        sessions: 86,
      },
      {
        agentId: 'golftop-servicenow-coordinator',
        name: 'EAGLE GREEN ServiceNow Coordinator',
        label: 'ServiceNow Coordinator',
        sessions: 214,
      },
    ],
  });
  assert.equal(getMetric(snapshot, 'usage').numericValue, 68);
  assert.equal(getMetric(snapshot, 'usage').value, '68%');
  assert.deepEqual(getMetric(snapshot, 'usage').visualization, {
    kind: 'token-usage-donut',
    usedTokens: 6800000,
    tokenLimit: 10000000,
    usagePercent: 68,
    estimatedCostUsd: 124.8,
    simulated: true,
  });
  assert.equal(getMetric(snapshot, 'needs-review').numericValue, 1);
  assert.equal(snapshot.fleet.length, 3);
  assert.equal(snapshot.fleet.every(agent => agent.lifecycle.value === 'published'), true);
  assert.deepEqual(
    snapshot.actions.find(action => action.id === 'open-agent-library'),
    {
      id: 'open-agent-library',
      label: 'All agents',
      href: '/agents',
      intent: 'navigate',
      requiresConfirmation: false,
    },
  );

  for (const metric of snapshot.metrics) {
    assert.ok(metric.scope);
    assert.ok(metric.timeWindow);
    assert.ok(metric.freshness);
    assert.ok(metric.drillDown.href);
  }

  assert.equal(snapshot.attentionItems.length, 1);
  assert.equal(snapshot.attentionItems[0].sessionId, 'SES-GT-1042');
  assert.equal(snapshot.attentionItems[0].statusLabel, 'Working as designed');
  assert.equal(
    snapshot.attentionItems[0].actions[0].href,
    '/agents/golftop-vip-reservations/sessions?sessionId=SES-GT-1042&source=dashboard',
  );

  assert.deepEqual(snapshot.workflowActivity.map(item => item.sequence), [1, 2, 3]);
  assert.deepEqual(snapshot.workflowActivity.map(item => item.agentName), [
    'EAGLE GREEN VIP Reservations',
    'EAGLE GREEN Event Operations',
    'EAGLE GREEN ServiceNow Coordinator',
  ]);
  assert.equal(snapshot.workflowActivity[2].externalReference, 'FAC-3214');
  assert.match(snapshot.workflowActivity[2].description, /FAC-3214/);
});

test('first-time snapshot stays focused on a fresh conversational start', () => {
  const empty = buildAgentHomeSnapshot('first-time');

  assert.equal(empty.header.eyebrow, 'Hi Jackie');
  assert.equal(empty.header.title, 'Let’s build your first agent');
  assert.equal(empty.composer.placeholder, 'Ask me anything');
  assert.deepEqual(empty.composer.suggestions, []);
  assert.deepEqual(empty.quickStarts.map(item => item.title), [
    'Build with AI Assistant',
    'Choose a template',
    'See an agent in action',
  ]);
  assert.deepEqual(empty.quickStarts.map(item => item.action.intent), [
    'start-intake',
    'show-templates',
    'try-demo',
  ]);
  assert.deepEqual(empty.quickStarts.map(item => [item.id, item.action.intent]), [
    ['start-with-assistant', 'start-intake'],
    ['choose-template', 'show-templates'],
    ['try-demo', 'try-demo'],
  ]);
  assert.deepEqual(empty.actions.map(action => action.label), [
    'Start building',
    'Browse templates',
    'Open demo',
  ]);
  assert.deepEqual(empty.onboarding.map(step => step.label), [
    'Define the job',
    'Connect resources',
    'Test behavior',
    'Review and publish',
  ]);
  assert.equal(empty.metrics.length, 0);
  assert.equal(empty.fleet.length, 0);

  const draft = createDraftFromProposal('contact_center', {
    name: 'Property Concierge',
    purpose: 'Resolve tenant service requests',
    description: 'Triage requests and coordinate service.',
    language: 'English (US)',
    instructions: 'Verify the tenant before taking action.',
  });
  draft.id = 'property-concierge';
  draft.activeSection = 'knowledge';
  draft.familyConfiguration.knowledge.progress = 'in_progress';

  const freshDespiteLocalDraft = buildAgentHomeSnapshot('first-time', { draft });
  assert.equal(freshDespiteLocalDraft.header.title, 'Let’s build your first agent');
  assert.equal(freshDespiteLocalDraft.dataState.resumableDraft, false);
  assert.equal(freshDespiteLocalDraft.resumeDraft, null);
  assert.equal(freshDespiteLocalDraft.actions[0]?.id, 'create-first-agent');
  assert.deepEqual(freshDespiteLocalDraft.onboarding.map(step => step.status), [
    'current',
    'upcoming',
    'upcoming',
    'upcoming',
  ]);
});

test('edge-state flags are independent and produce safe section-level fallbacks', () => {
  const stalePartial = buildAgentHomeSnapshot('recurring', { stale: true, partial: true });
  assert.equal(stalePartial.dataState.stale, true);
  assert.equal(stalePartial.dataState.partial, true);
  assert.deepEqual(stalePartial.dataState.unavailableSections, ['activity']);
  assert.equal(stalePartial.workflowActivity.length, 0);
  assert.equal(stalePartial.fleet.length, 3);
  assert.equal(getMetric(stalePartial, 'sessions').freshness, 'Last refreshed 30 minutes ago');

  const loading = buildAgentHomeSnapshot('recurring', { loading: true });
  assert.equal(loading.dataState.loading, true);
  assert.match(loading.header.description, /Refreshing portfolio status/);
  assert.equal(loading.metrics.length, 0);
  assert.equal(loading.attentionItems.length, 0);
  assert.equal(loading.fleet.length, 0);

  const permission = buildAgentHomeSnapshot('first-time', { permissionGranted: false });
  assert.equal(permission.dataState.permission, 'missing');
  assert.equal(permission.header.title, 'Request access to build an agent');
  assert.equal(permission.composer.disabled, true);
  assert.equal(permission.actions[0].label, 'Request access');

  const allClear = buildAgentHomeSnapshot('recurring', { allClear: true });
  assert.equal(allClear.dataState.allClear, true);
  assert.match(allClear.header.description, /No sessions are recommended for review/);
  assert.equal(allClear.attentionItems.length, 0);
  assert.equal(getMetric(allClear, 'needs-review').numericValue, 0);
  assert.equal(getMetric(allClear, 'sessions').numericValue, 3114);

  const noActivity = buildAgentHomeSnapshot('recurring', { noActivity: true });
  assert.equal(noActivity.dataState.hasActivity, false);
  assert.equal(
    noActivity.header.description,
    'Three published agents are ready. No sessions have been recorded yet.',
  );
  assert.equal(getMetric(noActivity, 'sessions').numericValue, 0);
  assert.equal(getMetric(noActivity, 'agent-health').value, '95.8%');
  assert.equal(getMetric(noActivity, 'usage').numericValue, 0);
  assert.equal(getMetric(noActivity, 'usage').visualization.usedTokens, 0);
  assert.equal(getMetric(noActivity, 'usage').visualization.estimatedCostUsd, 0);
  assert.equal(noActivity.workflowActivity.length, 0);
  assert.equal(noActivity.fleet.every(agent => agent.usage.sessions === 0), true);

  const noAgents = buildAgentHomeSnapshot('recurring', { agents: [] });
  assert.equal(getMetric(noAgents, 'agent-health').value, '—');
  assert.equal(getMetric(noAgents, 'agent-health').numericValue, null);
  assert.equal(getMetric(noAgents, 'agent-health').scope, 'Health data unavailable');

  const assistantFailure = buildAgentHomeSnapshot('recurring', { assistantAvailable: false });
  assert.equal(assistantFailure.dataState.assistant, 'unavailable');
  assert.equal(assistantFailure.composer.disabled, true);
  assert.match(assistantFailure.assistantPolicy.failureMessage ?? '', /verified dashboard links/);
});

test('critical and high items rank ahead of review items deterministically', () => {
  const ranked = rankAttentionItems([
    makeAttention('review', 'review'),
    makeAttention('high-b', 'high', '2026-08-09T09:43:00-07:00'),
    makeAttention('critical', 'critical'),
    makeAttention('high-a', 'high', '2026-08-09T09:43:00-07:00'),
  ]);

  assert.deepEqual(ranked.map(item => item.id), ['critical', 'high-a', 'high-b', 'review']);

  const snapshot = buildAgentHomeSnapshot('recurring', {
    additionalAttentionItems: [
      makeAttention('high', 'high'),
      makeAttention('critical', 'critical'),
    ],
  });
  assert.deepEqual(snapshot.attentionItems.map(item => item.severity), ['critical', 'high', 'review']);
  assert.equal(getMetric(snapshot, 'needs-review').numericValue, 3);
});

test('demo mode helpers are guarded, dependency-injected, and default to recurring', () => {
  assert.equal(readDemoHomeMode(undefined), DEFAULT_DEMO_HOME_MODE);
  assert.equal(buildDashboardSessionHref('agent/id', 'session 1'), '/agents/agent%2Fid/sessions?sessionId=session%201&source=dashboard');

  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(readDemoHomeMode(storage), 'recurring');
  assert.equal(persistDemoHomeMode('first-time', storage), 'first-time');
  assert.equal(values.get(DEMO_HOME_MODE_STORAGE_KEY), 'first-time');
  assert.equal(readDemoHomeMode(storage), 'first-time');

  values.set(DEMO_HOME_MODE_STORAGE_KEY, 'invalid');
  assert.equal(readDemoHomeMode(storage), 'recurring');

  const throwingStorage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(readDemoHomeMode(throwingStorage), 'recurring');
  assert.equal(persistDemoHomeMode('first-time', throwingStorage), 'first-time');
});
