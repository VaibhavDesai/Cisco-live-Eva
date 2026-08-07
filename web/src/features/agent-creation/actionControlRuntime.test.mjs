import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const webRoot = fileURLToPath(new URL('../../..', import.meta.url));
let server;
let controls;
let demo;

before(async () => {
  server = await createServer({
    root: webRoot,
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  controls = await server.ssrLoadModule('/src/pages/agent/ActionControls.tsx');
  demo = await server.ssrLoadModule('/src/demo/ciscoLiveDemo.ts');
});

after(async () => {
  await server?.close();
});

test('canonical Galileo state normalizes model fields and fills only missing seeded keys', () => {
  assert.equal(
    controls.getGalileoActionId(undefined, 'Check Availability'),
    controls.GALILEO_ACTION_IDS.checkAvailability,
  );
  assert.equal(
    controls.getGalileoActionId(undefined, 'Check Availability.'),
    controls.GALILEO_ACTION_IDS.checkAvailability,
    'legacy persisted names should continue to resolve to the stable action ID',
  );

  const defaults = controls.createDefaultGalileoActionControlState();
  const control = defaults.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0];
  assert.equal(control.version, 1);
  assert.equal(control.timing, 'post_tool');
  assert.ok(control.conditions.every(condition => condition.kind === 'action_input'));

  const missingKeys = controls.readGalileoActionControlState({
    controlsByActionId: {},
    gatesByActionId: {},
  });
  assert.equal(missingKeys.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability].length, 1);
  assert.equal(missingKeys.gatesByActionId[controls.GALILEO_ACTION_IDS.transferVipConcierge].enabled, true);

  const explicitOverrides = controls.readGalileoActionControlState({
    controlsByActionId: { [controls.GALILEO_ACTION_IDS.checkAvailability]: [] },
    gatesByActionId: {
      [controls.GALILEO_ACTION_IDS.transferVipConcierge]: {
        ...defaults.gatesByActionId[controls.GALILEO_ACTION_IDS.transferVipConcierge],
        enabled: false,
      },
    },
  });
  assert.deepEqual(explicitOverrides.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability], []);
  assert.equal(explicitOverrides.gatesByActionId[controls.GALILEO_ACTION_IDS.transferVipConcierge].enabled, false);
});

test('post-tool ANY evaluation uses strict thresholds and unlocks only after a matching Steer', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const snapshot = structuredClone(state);

  const oversized = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000 },
    timing: 'post_tool',
  });
  assert.equal(oversized.shouldExecuteAction, true);
  assert.equal(oversized.decisions[0].toolExecuted, true);
  assert.equal(oversized.decisions[0].result, 'steered');
  assert.deepEqual(oversized.unlockedActionIds, [controls.GALILEO_ACTION_IDS.transferVipConcierge]);

  const exactBoundary = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 100, requested_bays: 20 },
    timing: 'post_tool',
  });
  assert.equal(exactBoundary.decisions[0].matched, false);
  assert.equal(exactBoundary.shouldExecuteAction, true);
  assert.deepEqual(exactBoundary.unlockedActionIds, []);

  const secondAnyBranch = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 8, requested_bays: 21 },
    timing: 'post_tool',
  });
  assert.equal(secondAnyBranch.decisions[0].matched, true);
  assert.deepEqual(secondAnyBranch.unlockedActionIds, [controls.GALILEO_ACTION_IDS.transferVipConcierge]);

  const missingInputs = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: {},
    timing: 'post_tool',
  });
  assert.equal(missingInputs.decisions[0].matched, false);
  assert.deepEqual(missingInputs.unlockedActionIds, []);

  const wrongPhase = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000 },
    timing: 'pre_tool',
  });
  assert.deepEqual(wrongPhase.decisions, []);
  assert.deepEqual(wrongPhase.unlockedActionIds, []);
  assert.deepEqual(state, snapshot, 'evaluation must not mutate persisted configuration');
});

test('gates fail closed and accept only satisfied active Steer prerequisites', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const locked = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.transferVipConcierge,
    inputs: {},
  });
  assert.equal(locked.gateAllowed, false);
  assert.equal(locked.shouldExecuteAction, false);
  assert.deepEqual(locked.missingPrerequisiteControlIds, [controls.LARGE_EVENT_CONTROL_ID]);

  const source = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { requested_bays: 21 },
    timing: 'post_tool',
  });
  const unlocked = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.transferVipConcierge,
    inputs: {},
    satisfiedControlIds: source.satisfiedPrerequisiteControlIds,
  });
  assert.equal(unlocked.gateAllowed, true);
  assert.equal(unlocked.shouldExecuteAction, true);

  for (const behavior of ['observe', 'deny']) {
    const incompatible = structuredClone(state);
    incompatible.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0].behavior = behavior;
    const result = controls.evaluateGalileoActionInvocation({
      state: incompatible,
      actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
      inputs: { party_size: 1000 },
      timing: 'post_tool',
    });
    assert.deepEqual(result.unlockedActionIds, [], `${behavior} must not unlock the Steer gate`);
    assert.equal(result.shouldExecuteAction, true, 'the attached action has already completed');
  }
});

test('recommended controls are added for review without replacing existing controls or gates', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const originalGate = structuredClone(
    state.gatesByActionId[controls.GALILEO_ACTION_IDS.transferVipConcierge],
  );
  const recommendation = {
    id: 'large-event-payment-observation',
    actionId: controls.GALILEO_ACTION_IDS.sendPayment,
    name: 'Monitor payment links for large event requests',
    description: 'Review payment-link activity on large event requests.',
    status: 'needs_review',
    timing: 'pre_tool',
    behavior: 'observe',
    matchMode: 'any',
    conditions: [{
      id: 'payment-party-size',
      kind: 'action_input',
      field: 'party_size',
      operator: 'greater_than',
      value: 100,
    }],
    guidance: 'Record the request without inferring approval or payment status.',
    source: 'recommended',
    sourceEvidence: 'Large event reservations require VIP-team review.',
    recommendationReason: 'The attempt is useful monitoring evidence.',
    version: 1,
  };

  const next = controls.addRecommendedGalileoControl(state, recommendation);
  assert.equal(
    next.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability].length,
    1,
    'the active large-event routing control should remain intact',
  );
  assert.deepEqual(
    next.gatesByActionId[controls.GALILEO_ACTION_IDS.transferVipConcierge],
    originalGate,
    'adding a recommendation must not replace the active VIP transfer gate',
  );
  assert.equal(next.controlsByActionId[controls.GALILEO_ACTION_IDS.sendPayment][0].status, 'needs_review');
  assert.equal(state.controlsByActionId[controls.GALILEO_ACTION_IDS.sendPayment], undefined);

  const duplicate = controls.addRecommendedGalileoControl(next, recommendation);
  assert.equal(duplicate, next, 'the same recommended control should not be added twice');
});

test('seeded Session telemetry preserves completed transfers and exposes machine time', () => {
  const now = new Date('2026-08-07T02:00:00.000Z');
  const defaults = controls.createDefaultGalileoActionControlState();
  const values = {
    selections: ['Check Availability', 'Send payment link', 'Transfer to VIP team'],
    ...defaults,
  };
  const decisions = demo.getCiscoLiveActionControlDecisions(
    demo.CISCO_LIVE_PRIMARY_AGENT_ID,
    values,
    now,
  );
  assert.deepEqual(decisions.map(decision => decision.result), ['steered', 'not_matched']);
  assert.deepEqual(
    decisions.map(decision => decision.occurredAt),
    ['2026-08-07T01:58:00.000Z', '2026-08-07T01:52:00.000Z'],
  );
  assert.deepEqual(
    demo.summarizeCiscoLiveActionControlDecisions(decisions),
    {
      evaluated: 2,
      matched: 1,
      notMatched: 1,
      actionRan: 2,
      observed: 0,
      steered: 1,
      denied: 0,
      unlocked: 1,
      matchRate: 50,
    },
  );

  const disabledValues = structuredClone(values);
  disabledValues.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0].status = 'disabled';
  const decisionsAfterDraftChange = demo.getCiscoLiveActionControlDecisions(
    demo.CISCO_LIVE_PRIMARY_AGENT_ID,
    disabledValues,
    now,
  );
  assert.deepEqual(decisionsAfterDraftChange.map(decision => decision.sessionId), ['SES-GT-1042']);
  assert.deepEqual(decisionsAfterDraftChange.map(decision => decision.result), ['steered']);
  const disabledLargeEventSession = demo
    .getCiscoLiveSessions(demo.CISCO_LIVE_PRIMARY_AGENT_ID, disabledValues)
    .find(session => session.id === 'SES-GT-1042');
  assert.equal(disabledLargeEventSession.transferred, true);
  assert.equal(disabledLargeEventSession.outcome, 'Transferred');
  assert.equal(disabledLargeEventSession.transcript.some(event => event.kind === 'handoff'), true);
  assert.equal(disabledLargeEventSession.transcript.some(event => event.kind === 'action_control'), true);

  const lowerThresholdValues = structuredClone(values);
  lowerThresholdValues.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0].conditions = [
    {
      id: 'small-party-threshold',
      kind: 'action_input',
      field: 'party_size',
      operator: 'greater_than',
      value: 4,
    },
  ];
  const regeneratedStandardSession = demo
    .getCiscoLiveSessions(demo.CISCO_LIVE_PRIMARY_AGENT_ID, lowerThresholdValues)
    .find(session => session.id === 'SES-GT-1038');
  assert.equal(regeneratedStandardSession.transferred, true);
  assert.equal(regeneratedStandardSession.outcome, 'Transferred');
  assert.equal(regeneratedStandardSession.transcript.some(event => event.kind === 'handoff'), true);
});
