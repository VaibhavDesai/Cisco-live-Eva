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
    resolve: {
      alias: {
        '@momentum-design/components/react': fileURLToPath(new URL('./momentumRuntimeStub.mjs', import.meta.url)),
      },
    },
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
  assert.equal(
    controls.getGalileoActionId(undefined, 'Handover'),
    controls.GALILEO_ACTION_IDS.handover,
  );

  const defaults = controls.createDefaultGalileoActionControlState();
  const control = defaults.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0];
  assert.equal(control.version, 1);
  assert.equal(control.timing, 'post_tool');
  assert.equal(control.matchMode, 'or');
  assert.ok(control.conditions.every(condition => condition.kind === 'action_input'));
  assert.deepEqual(control.timeWindow, {
    field: 'event_time',
    operator: 'between',
    start: '09:30',
    end: '10:00',
  });
  const handoverControl = defaults.controlsByActionId[controls.GALILEO_ACTION_IDS.handover][0];
  assert.equal(handoverControl.name, 'Delay human handover until turn 5');
  assert.deepEqual(handoverControl.conditions, [{
    id: 'handover-conversation-turn',
    kind: 'action_input',
    field: 'conversation_turn',
    operator: 'less_than',
    value: 5,
  }]);
  assert.match(handoverControl.guidance, /estimated_human_wait_minutes/);

  const missingKeys = controls.readGalileoActionControlState({
    controlsByActionId: {},
    gatesByActionId: {},
  });
  assert.equal(missingKeys.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability].length, 1);
  assert.equal(
    controls.getGalileoActionStatus(controls.GALILEO_ACTION_IDS.handover, missingKeys).label,
    '1 active · Steer',
  );
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

  const legacyAll = controls.readGalileoActionControlState({
    controlsByActionId: {
      [controls.GALILEO_ACTION_IDS.checkAvailability]: [{ ...control, matchMode: 'all' }],
    },
  });
  assert.equal(
    legacyAll.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0].matchMode,
    'and',
    'legacy all controls should normalize to the canonical AND state',
  );
});

test('control previews format action inputs as template variables', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const control = state.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0];

  assert.equal(
    controls.getControlExpressionPreview(control),
    '({{party_size}} is greater than 100 or {{requested_bays}} is greater than 20) and {{event_time}} is between 9:30 AM and 10:00 AM',
  );
  assert.equal(
    controls.getControlExpressionPreview(
      state.controlsByActionId[controls.GALILEO_ACTION_IDS.handover][0],
    ),
    '{{conversation_turn}} is less than 5',
  );
});

test('Handover nudges early requests and transfers at turn 5', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const earlyRequest = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.handover,
    inputs: { conversation_turn: 3, estimated_human_wait_minutes: 8 },
    timing: 'pre_tool',
  });
  assert.equal(earlyRequest.decisions[0].matched, true);
  assert.equal(earlyRequest.decisions[0].result, 'steered');
  assert.equal(earlyRequest.shouldExecuteAction, false);

  const eligibleRequest = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.handover,
    inputs: { conversation_turn: 5, estimated_human_wait_minutes: 4 },
    timing: 'pre_tool',
  });
  assert.equal(eligibleRequest.decisions[0].matched, false);
  assert.equal(eligibleRequest.shouldExecuteAction, true);
});

test('EAGLE GREEN reports only payment data protection as triggered', () => {
  const agentId = 'golftop-vip-reservations';
  const sessions = demo.getCiscoLiveSessions(agentId);
  const triggeredGuardrails = sessions
    .filter(session => session.guardrailTriggered)
    .map(session => session.guardrail?.name);
  const reservationSession = sessions.find(session => session.id === 'SES-GT-1042');

  assert.deepEqual(triggeredGuardrails, ['Payment data protection']);
  assert.equal(demo.getCiscoLiveGuardrailTriggerCount('VIP event confidentiality', agentId), 0);
  assert.equal(demo.getCiscoLiveGuardrailTriggerCount('Payment data protection', agentId), 1);
  assert.equal(sessions.some(session => session.id === 'SES-GT-1045'), false);
  assert.equal(reservationSession?.guardrailTriggered, true);
  assert.equal(reservationSession?.actionControlTriggered, true);
  assert.equal(reservationSession?.messages, 9);
  assert.equal(reservationSession?.transcript.length, 12);
  assert.equal(reservationSession?.transcript[5]?.text.includes('[payment data automatically redacted]'), true);
  assert.equal(reservationSession?.transcript[6]?.kind, 'guardrail');
  assert.equal(reservationSession?.transcript[6]?.title, 'Payment data protection blocked sensitive input');
  assert.equal(reservationSession?.transcript[9]?.kind, 'action_control');
  assert.equal(reservationSession?.guardrail?.result, 'No payment card details were retained, repeated, or processed in the conversation');
});

test('post-tool compound evaluation uses strict thresholds and a required session-time window', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const snapshot = structuredClone(state);

  const oversized = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000 },
    timing: 'post_tool',
    occurredAt: '9:42 AM',
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
    occurredAt: '9:42 AM',
  });
  assert.equal(exactBoundary.decisions[0].matched, false);
  assert.equal(exactBoundary.shouldExecuteAction, true);
  assert.deepEqual(exactBoundary.unlockedActionIds, []);

  const secondAnyBranch = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 8, requested_bays: 21 },
    timing: 'post_tool',
    occurredAt: '9:42 AM',
  });
  assert.equal(secondAnyBranch.decisions[0].matched, true);
  assert.deepEqual(secondAnyBranch.unlockedActionIds, [controls.GALILEO_ACTION_IDS.transferVipConcierge]);

  const missingInputs = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: {},
    timing: 'post_tool',
    occurredAt: '9:42 AM',
  });
  assert.equal(missingInputs.decisions[0].matched, false);
  assert.deepEqual(missingInputs.unlockedActionIds, []);

  const wrongPhase = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000 },
    timing: 'pre_tool',
    occurredAt: '9:42 AM',
  });
  assert.deepEqual(wrongPhase.decisions, []);
  assert.deepEqual(wrongPhase.unlockedActionIds, []);

  const outsideTimeWindow = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000, requested_bays: 100 },
    timing: 'post_tool',
    occurredAt: '10:01 AM',
  });
  assert.equal(outsideTimeWindow.decisions[0].matched, false);
  assert.equal(outsideTimeWindow.decisions[0].timeWindowEvidence.matched, false);
  assert.deepEqual(outsideTimeWindow.unlockedActionIds, []);
  assert.deepEqual(state, snapshot, 'evaluation must not mutate persisted configuration');
});

test('OR and AND connector states preserve their distinct evaluation contracts', () => {
  const state = controls.createDefaultGalileoActionControlState();
  const control = state.controlsByActionId[controls.GALILEO_ACTION_IDS.checkAvailability][0];

  control.matchMode = 'or';
  const orResult = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000, requested_bays: 1 },
    timing: 'post_tool',
    occurredAt: '9:42 AM',
  });
  assert.equal(orResult.decisions[0].matched, true, 'OR should match when either condition matches');

  control.matchMode = 'and';
  const partialAndResult = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000, requested_bays: 1 },
    timing: 'post_tool',
    occurredAt: '9:42 AM',
  });
  assert.equal(partialAndResult.decisions[0].matched, false, 'AND should reject a partial match');

  const completeAndResult = controls.evaluateGalileoActionInvocation({
    state,
    actionId: controls.GALILEO_ACTION_IDS.checkAvailability,
    inputs: { party_size: 1000, requested_bays: 21 },
    timing: 'post_tool',
    occurredAt: '9:42 AM',
  });
  assert.equal(completeAndResult.decisions[0].matched, true, 'AND should match when every condition matches');
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
    occurredAt: '9:42 AM',
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
      occurredAt: '9:42 AM',
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
  assert.equal(
    next.controlsByActionId[controls.GALILEO_ACTION_IDS.sendPayment][0].matchMode,
    'or',
    'legacy any controls should normalize to the canonical OR state',
  );
  assert.equal(state.controlsByActionId[controls.GALILEO_ACTION_IDS.sendPayment], undefined);

  const duplicate = controls.addRecommendedGalileoControl(next, recommendation);
  assert.equal(duplicate, next, 'the same recommended control should not be added twice');
});

test('seeded Session telemetry preserves completed transfers and exposes machine time', () => {
  const now = new Date('2026-08-07T02:00:00.000Z');
  const defaults = controls.createDefaultGalileoActionControlState();
  const values = {
    selections: ['Check Availability', 'Send payment link', 'Transfer to VIP team', 'Handover'],
    ...defaults,
  };
  const decisions = demo.getCiscoLiveActionControlDecisions(
    demo.CISCO_LIVE_PRIMARY_AGENT_ID,
    values,
    now,
  );
  assert.deepEqual(decisions.map(decision => decision.result), ['steered', 'not_matched']);
  assert.deepEqual(
    decisions.map(decision => decision.timeWindowEvidence?.actual),
    ['9:42 AM', '9:31 AM'],
  );
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
