import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialUpliftWorkspaceState,
  getAssistantContextAgentId,
  getNearestProductSurfaceSnap,
  getProductSurfaceSnapWidth,
  parseStoredUpliftWorkspaceState,
  upliftWorkspaceReducer,
} from '../../products/ai-agent-studio/UpliftWorkspaceState.ts';

const NOW = '2026-07-29T12:00:00.000Z';
const LATER = '2026-07-29T12:05:00.000Z';

const migratedSession = {
  landingMode: 'build',
  selectedTemplateId: null,
  draft: {},
  messages: [{ id: 'message-1', role: 'user', text: 'Create a support agent' }],
  guidanceVisible: true,
  orchestrationSuggested: false,
  evaStep: 'profile',
  agentName: '',
  agentDescription: '',
  avatarUrl: '',
  timezone: 'America/Los_Angeles',
  aiEngine: '',
  welcomeMessage: '',
  instructionPrompt: '',
  selectedKnowledgeBases: [],
  selectedActions: [],
  optimizeAccepted: false,
  preOptimizeText: '',
  optimizeSummary: { changes: [], reasoning: [] },
  securityTier: 'standard',
  channelType: 'voice',
  channelPhoneNumber: '',
  standardGuardrails: [],
  advancedGuardrailGroups: [],
  expandedAdvancedGroups: [],
  personality: { llm: '', voice: '', language: '', gender: '' },
  customRules: [],
};

test('Uplift product surface exposes desktop snap points and removes split below 1024px', () => {
  assert.equal(getProductSurfaceSnapWidth('compact', 1440), 60);
  assert.equal(getProductSurfaceSnapWidth('split', 1440), 1140);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1440), 1380);
  assert.equal(getProductSurfaceSnapWidth('split', 1280), 980);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1280), 1220);
  assert.equal(getProductSurfaceSnapWidth('split', 1024), 724);
  assert.equal(getProductSurfaceSnapWidth('split', 1967), 1574);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1024), 964);
  assert.equal(getProductSurfaceSnapWidth('split', 1023), 963);
  assert.equal(getProductSurfaceSnapWidth('split', 375), 315);
  assert.equal(getNearestProductSurfaceSnap(720, 1440), 'split');
  assert.equal(getNearestProductSurfaceSnap(720, 1023), 'expanded');
  assert.equal(getNearestProductSurfaceSnap(80, 375), 'compact');
  assert.equal(getNearestProductSurfaceSnap(300, 375), 'expanded');
});

test('thread history opens in place without resizing the product or assistant surfaces', () => {
  const initial = {
    ...createInitialUpliftWorkspaceState(null, NOW),
    productSurface: {
      ...createInitialUpliftWorkspaceState(null, NOW).productSurface,
      snap: 'expanded',
      width: 1112,
    },
  };
  const opened = upliftWorkspaceReducer(initial, { type: 'open-thread-history' });

  assert.equal(opened.productSurface.snap, 'expanded');
  assert.equal(opened.productSurface.width, 1112);
  assert.equal(opened.productSurface.previousSnap, null);
  assert.equal(opened.productSurface.temporaryAssistantOverride, false);
  assert.equal(opened.productSurface.threadHistoryOpen, true);

  const restored = upliftWorkspaceReducer(opened, { type: 'close-thread-history' });
  assert.equal(restored.productSurface.snap, 'expanded');
  assert.equal(restored.productSurface.width, 1112);
  assert.equal(restored.productSurface.previousSnap, null);
  assert.equal(restored.productSurface.temporaryAssistantOverride, false);
  assert.equal(restored.productSurface.threadHistoryOpen, false);
});

test('freeform product widths persist without snapping to preset sizes', () => {
  const initial = createInitialUpliftWorkspaceState(null, NOW);
  const resized = upliftWorkspaceReducer(initial, {
    type: 'set-width',
    width: 873,
    snap: 'split',
  });

  assert.equal(resized.productSurface.width, 873);
  assert.equal(resized.productSurface.snap, 'split');
  assert.equal(getNearestProductSurfaceSnap(873, 1440), 'split');
});

test('assistant threads can be created, selected, renamed, updated, and deleted independently', () => {
  const initial = createInitialUpliftWorkspaceState(migratedSession, NOW);
  const created = upliftWorkspaceReducer(initial, {
    type: 'new-thread',
    id: 'thread-2',
    now: LATER,
  });
  assert.equal(created.assistant.activeThreadId, 'thread-2');
  assert.equal(created.assistant.threads[0].messages.length, 0);

  const renamed = upliftWorkspaceReducer(created, {
    type: 'rename-thread',
    id: 'thread-2',
    title: 'Reservation agent',
    now: LATER,
  });
  assert.equal(renamed.assistant.threads[0].title, 'Reservation agent');

  const updated = upliftWorkspaceReducer(renamed, {
    type: 'update-active-thread',
    snapshot: migratedSession,
    now: LATER,
  });
  assert.equal(updated.assistant.threads[0].messages.length, 1);
  assert.equal(updated.assistant.threads[1].messages.length, 1);

  const selected = upliftWorkspaceReducer(updated, {
    type: 'select-thread',
    id: 'assistant-thread-initial',
  });
  assert.equal(selected.assistant.activeThreadId, 'assistant-thread-initial');

  const remaining = upliftWorkspaceReducer(selected, {
    type: 'delete-thread',
    id: 'assistant-thread-initial',
    replacementId: 'thread-replacement',
    now: LATER,
  });
  assert.equal(remaining.assistant.activeThreadId, 'thread-2');
  assert.equal(remaining.assistant.threads.length, 1);

  const replaced = upliftWorkspaceReducer(remaining, {
    type: 'delete-thread',
    id: 'thread-2',
    replacementId: 'thread-replacement',
    now: LATER,
  });
  assert.equal(replaced.assistant.activeThreadId, 'thread-replacement');
  assert.equal(replaced.assistant.threads[0].title, 'New chat');
});

test('stored workspace migrates the existing Eva session and recovers from invalid payloads', () => {
  const migrated = parseStoredUpliftWorkspaceState(null, migratedSession, NOW);
  assert.equal(migrated.assistant.threads[0].title, 'AI Agent Studio setup');
  assert.equal(migrated.assistant.threads[0].messages.length, 1);
  assert.equal(migrated.productSurface.snap, 'split');

  const corrupted = parseStoredUpliftWorkspaceState('{not-json', migratedSession, NOW);
  assert.equal(corrupted.assistant.threads[0].messages.length, 1);

  const wrongVersion = parseStoredUpliftWorkspaceState(
    JSON.stringify({ version: 99 }),
    null,
    NOW,
  );
  assert.equal(wrongVersion.version, 1);
  assert.equal(wrongVersion.assistant.threads[0].title, 'New chat');
});

test('agent routes create and restore the most recent thread for each agent', () => {
  const initial = createInitialUpliftWorkspaceState(migratedSession, NOW);
  const eagle = upliftWorkspaceReducer(initial, {
    type: 'set-context-path',
    path: '/agents/golftop-vip-reservations',
    id: 'thread-eagle',
    now: LATER,
  });
  assert.equal(eagle.assistant.activeThreadId, 'thread-eagle');
  assert.equal(eagle.assistant.threads[0].contextAgentId, 'golftop-vip-reservations');
  assert.equal(eagle.assistant.threads[0].messages.length, 0);

  const eagleUpdated = upliftWorkspaceReducer(eagle, {
    type: 'update-active-thread',
    snapshot: migratedSession,
    now: '2026-07-29T12:06:00.000Z',
  });
  const property = upliftWorkspaceReducer(eagleUpdated, {
    type: 'set-context-path',
    path: '/agents/property-management-service-agent',
    id: 'thread-property',
    now: '2026-07-29T12:07:00.000Z',
  });
  assert.equal(property.assistant.activeThreadId, 'thread-property');
  assert.equal(property.assistant.threads[0].contextAgentId, 'property-management-service-agent');

  const sameProperty = upliftWorkspaceReducer(property, {
    type: 'set-context-path',
    path: '/agents/property-management-service-agent/configure?section=Security',
    id: 'should-not-be-created',
    now: '2026-07-29T12:08:00.000Z',
  });
  assert.equal(sameProperty.assistant.activeThreadId, 'thread-property');
  assert.equal(
    sameProperty.assistant.threads.some(thread => thread.id === 'should-not-be-created'),
    false,
  );

  const restoredEagle = upliftWorkspaceReducer(sameProperty, {
    type: 'set-context-path',
    path: '/agents/golftop-vip-reservations/sessions',
    id: 'second-eagle-thread',
    now: '2026-07-29T12:09:00.000Z',
  });
  assert.equal(restoredEagle.assistant.activeThreadId, 'thread-eagle');
  assert.equal(
    restoredEagle.assistant.threads.find(thread => thread.id === 'thread-eagle').messages.length,
    1,
  );
});

test('legacy threads remain global and agent thread history can be filtered without migration', () => {
  const initial = createInitialUpliftWorkspaceState(migratedSession, NOW);
  assert.equal(initial.assistant.threads[0].contextAgentId, undefined);
  assert.equal(getAssistantContextAgentId('/agents'), undefined);
  assert.equal(
    getAssistantContextAgentId('/agents/property-management-service-agent/history?source=assistant'),
    'property-management-service-agent',
  );

  const agentState = upliftWorkspaceReducer(initial, {
    type: 'set-context-path',
    path: '/agents/property-management-service-agent',
    id: 'thread-property',
    now: LATER,
  });
  const agentThreads = agentState.assistant.threads.filter(
    thread => thread.contextAgentId === 'property-management-service-agent',
  );
  const globalThreads = agentState.assistant.threads.filter(
    thread => thread.contextAgentId === undefined,
  );
  assert.deepEqual(agentThreads.map(thread => thread.id), ['thread-property']);
  assert.deepEqual(globalThreads.map(thread => thread.id), ['assistant-thread-initial']);

  const restoredGlobal = upliftWorkspaceReducer(agentState, {
    type: 'set-context-path',
    path: '/agents',
    id: 'unused-global-thread',
    now: '2026-07-29T12:10:00.000Z',
  });
  assert.equal(restoredGlobal.assistant.activeThreadId, 'assistant-thread-initial');
});
