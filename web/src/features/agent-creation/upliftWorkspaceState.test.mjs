import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialUpliftWorkspaceState,
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
  assert.equal(getProductSurfaceSnapWidth('split', 1440), 1008);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1440), 1380);
  assert.equal(getProductSurfaceSnapWidth('split', 1280), 896);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1280), 1220);
  assert.equal(getProductSurfaceSnapWidth('split', 1024), 720);
  assert.equal(getProductSurfaceSnapWidth('expanded', 1024), 964);
  assert.equal(getProductSurfaceSnapWidth('split', 1023), 963);
  assert.equal(getProductSurfaceSnapWidth('split', 375), 315);
  assert.equal(getNearestProductSurfaceSnap(720, 1440), 'split');
  assert.equal(getNearestProductSurfaceSnap(720, 1023), 'expanded');
  assert.equal(getNearestProductSurfaceSnap(80, 375), 'compact');
  assert.equal(getNearestProductSurfaceSnap(300, 375), 'expanded');
});

test('thread history temporarily compacts the product and restores its prior snap', () => {
  const initial = {
    ...createInitialUpliftWorkspaceState(null, NOW),
    productSurface: {
      ...createInitialUpliftWorkspaceState(null, NOW).productSurface,
      snap: 'expanded',
    },
  };
  const opened = upliftWorkspaceReducer(initial, { type: 'open-thread-history' });

  assert.equal(opened.productSurface.snap, 'compact');
  assert.equal(opened.productSurface.previousSnap, 'expanded');
  assert.equal(opened.productSurface.temporaryAssistantOverride, true);
  assert.equal(opened.productSurface.threadHistoryOpen, true);

  const restored = upliftWorkspaceReducer(opened, { type: 'close-thread-history' });
  assert.equal(restored.productSurface.snap, 'expanded');
  assert.equal(restored.productSurface.previousSnap, null);
  assert.equal(restored.productSurface.temporaryAssistantOverride, false);
  assert.equal(restored.productSurface.threadHistoryOpen, false);
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
