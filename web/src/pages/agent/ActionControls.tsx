import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Card, CardBody } from '../../components/shared/Card';
import { Checkbox } from '../../components/shared/Checkbox';
import Dropdown from '../../components/shared/Dropdown';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../components/shared/Modal';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import { Icon } from '../../icons';

export const GALILEO_ACTION_IDS = {
  checkAvailability: 'check-bay-availability',
  sendPayment: 'send-payment-link',
  transferVipConcierge: 'transfer-large-event-vip-concierge',
} as const;

export const LARGE_EVENT_CONTROL_ID = 'large-event-approval-routing';
export const VIP_TEAM_ACTION_NAME = 'Transfer to VIP team';
const LARGE_EVENT_CONTROL_NAME = 'Route large event requests to the VIP team';
const LARGE_EVENT_CONTROL_DESCRIPTION = 'Check availability for every request. After it returns, route requests over 100 guests or more than 20 bays to the VIP team.';
const LARGE_EVENT_CONTROL_GUIDANCE = 'Tell the caller that availability was checked and the request needs VIP-team review. Transfer the caller, availability result, and reservation context to the VIP team.';
const LARGE_EVENT_SOURCE_EVIDENCE = 'Requests over 100 guests or more than 20 bays require review by the VIP event team.';
const LARGE_EVENT_RECOMMENDATION_REASON = 'Check Availability receives party size and requested bays, so Galileo can make a deterministic routing decision after the action returns.';
const LEGACY_VIP_TEAM_ACTION_NAMES = new Set([
  'transfer to concierge',
  'transfer large event to vip concierge',
]);

export type GalileoActionControlTiming = 'pre_tool' | 'post_tool';
export type GalileoActionControlBehavior = 'observe' | 'steer' | 'deny';
export type GalileoActionControlStatus = 'draft' | 'active' | 'disabled' | 'needs_review';
export type GalileoActionControlMatchMode = 'all' | 'any';
export type GalileoActionControlField = 'party_size' | 'requested_bays';

export interface GalileoActionControlCondition {
  id: string;
  kind: 'action_input';
  field: GalileoActionControlField;
  operator: 'greater_than';
  value: number;
}

export interface GalileoActionControl {
  id: string;
  actionId: string;
  name: string;
  description: string;
  status: GalileoActionControlStatus;
  timing: GalileoActionControlTiming;
  behavior: GalileoActionControlBehavior;
  matchMode: GalileoActionControlMatchMode;
  conditions: GalileoActionControlCondition[];
  guidance: string;
  steerToActionId?: string;
  source: 'manual' | 'recommended';
  sourceEvidence?: string;
  recommendationReason?: string;
  version: number;
}

export interface GalileoActionGate {
  actionId: string;
  sourceActionId: string;
  controlId: string;
  enabled: boolean;
  prerequisiteControlIds: string[];
}

type StoredGalileoActionGate = Omit<GalileoActionGate, 'prerequisiteControlIds'> & {
  prerequisiteControlIds?: string[];
};

export interface GalileoActionControlState {
  controlsByActionId: Record<string, GalileoActionControl[]>;
  gatesByActionId: Record<string, GalileoActionGate>;
}

export interface GalileoActionControlConditionEvidence {
  conditionId: string;
  field: GalileoActionControlField;
  operator: 'greater_than';
  expected: number;
  actual: number | 'missing';
  matched: boolean;
}

export interface GalileoActionControlEvaluationDecision {
  controlId: string;
  controlTitle: string;
  actionId: string;
  timing: GalileoActionControlTiming;
  behavior: GalileoActionControlBehavior;
  invoked: true;
  matched: boolean;
  evidence: GalileoActionControlConditionEvidence[];
  result: 'observed' | 'steered' | 'denied' | 'not_matched';
  toolExecuted: boolean;
  unlockedActionIds: string[];
}

export interface GalileoActionControlEvaluationResult {
  actionId: string;
  gateAllowed: boolean;
  missingPrerequisiteControlIds: string[];
  shouldExecuteAction: boolean;
  decisions: GalileoActionControlEvaluationDecision[];
  matchedControlIds: string[];
  satisfiedPrerequisiteControlIds: string[];
  unlockedActionIds: string[];
  lockedActionIds: string[];
}

export interface GalileoActionControlEvaluationRequest {
  state: GalileoActionControlState;
  actionId: string;
  inputs: Record<string, unknown>;
  timing?: GalileoActionControlTiming;
  satisfiedControlIds?: string[];
}

export interface GalileoActionOption {
  id: string;
  name: string;
}

type GalileoStatusTone = 'empty' | 'active' | 'draft' | 'review' | 'gated' | 'disabled';

export interface GalileoActionStatus {
  label: string;
  tone: GalileoStatusTone;
}

const FIELD_LABELS: Record<GalileoActionControlField, string> = {
  party_size: 'Party size',
  requested_bays: 'Requested bays',
};

const BEHAVIOR_LABELS: Record<GalileoActionControlBehavior, string> = {
  observe: 'Observe',
  steer: 'Steer',
  deny: 'Deny',
};

const TIMING_LABELS: Record<GalileoActionControlTiming, string> = {
  pre_tool: 'Before the action runs',
  post_tool: 'After the action returns',
};

const SEEDED_LARGE_EVENT_CONTROL: GalileoActionControl = {
  id: LARGE_EVENT_CONTROL_ID,
  actionId: GALILEO_ACTION_IDS.checkAvailability,
  name: LARGE_EVENT_CONTROL_NAME,
  description: LARGE_EVENT_CONTROL_DESCRIPTION,
  status: 'active',
  timing: 'post_tool',
  behavior: 'steer',
  matchMode: 'any',
  conditions: [
    {
      id: 'large-event-party-size',
      kind: 'action_input',
      field: 'party_size',
      operator: 'greater_than',
      value: 100,
    },
    {
      id: 'large-event-requested-bays',
      kind: 'action_input',
      field: 'requested_bays',
      operator: 'greater_than',
      value: 20,
    },
  ],
  guidance: LARGE_EVENT_CONTROL_GUIDANCE,
  steerToActionId: GALILEO_ACTION_IDS.transferVipConcierge,
  source: 'recommended',
  sourceEvidence: LARGE_EVENT_SOURCE_EVIDENCE,
  recommendationReason: LARGE_EVENT_RECOMMENDATION_REASON,
  version: 1,
};

const SEEDED_VIP_TRANSFER_GATE: GalileoActionGate = {
  actionId: GALILEO_ACTION_IDS.transferVipConcierge,
  sourceActionId: GALILEO_ACTION_IDS.checkAvailability,
  controlId: LARGE_EVENT_CONTROL_ID,
  enabled: true,
  prerequisiteControlIds: [LARGE_EVENT_CONTROL_ID],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneControl(control: GalileoActionControl): GalileoActionControl {
  const shouldRefreshSeededCopy = control.id === LARGE_EVENT_CONTROL_ID;
  return {
    ...control,
    name: shouldRefreshSeededCopy && control.name === 'Large event approval routing'
      ? LARGE_EVENT_CONTROL_NAME
      : control.name,
    description: shouldRefreshSeededCopy
      && (
        control.description === 'Keep large event requests out of the standard booking path until the VIP event team can review them.'
        || control.description === 'Route requests over 100 guests or more than 20 bays to the VIP team before Check Availability runs.'
        || control.description === 'Check availability first, then route requests over 100 guests or more than 20 bays to the VIP team.'
      )
      ? LARGE_EVENT_CONTROL_DESCRIPTION
      : control.description,
    guidance: shouldRefreshSeededCopy
      && (
        control.guidance === 'Explain that this request exceeds autonomous booking limits and needs review by the VIP event team. Tell the caller that their context will transfer with them.'
        || control.guidance === 'Tell the caller that the request needs VIP-team review, then transfer the caller and reservation context to the VIP team.'
        || control.guidance === 'Tell the caller that availability was checked and the request needs VIP-team review, then transfer the caller, availability result, and reservation context.'
      )
      ? LARGE_EVENT_CONTROL_GUIDANCE
      : control.guidance,
    sourceEvidence: shouldRefreshSeededCopy
      && control.sourceEvidence === 'Large event requests must transfer with the reservation context attached.'
      ? LARGE_EVENT_SOURCE_EVIDENCE
      : control.sourceEvidence,
    recommendationReason: shouldRefreshSeededCopy
      && (
        control.recommendationReason === 'The reservation threshold changes whether Check Availability should run or the request should move to VIP review.'
        || control.recommendationReason === 'This control applies the saved reservation thresholds before Check Availability runs and sends matching requests to the VIP team.'
        || control.recommendationReason === 'This control lets Check Availability finish, then applies the saved reservation thresholds to choose the next path.'
      )
      ? LARGE_EVENT_RECOMMENDATION_REASON
      : control.recommendationReason,
    version: control.version ?? 1,
    conditions: control.conditions.map(condition => ({
      ...condition,
      kind: condition.kind ?? 'action_input',
    })),
  };
}

function cloneState(state: GalileoActionControlState): GalileoActionControlState {
  return {
    controlsByActionId: Object.fromEntries(
      Object.entries(state.controlsByActionId).map(([actionId, controls]) => [
        actionId,
        controls.map(cloneControl),
      ]),
    ),
    gatesByActionId: Object.fromEntries(
      Object.entries(state.gatesByActionId).map(([actionId, gate]) => [actionId, { ...gate }]),
    ),
  };
}

export function createDefaultGalileoActionControlState(): GalileoActionControlState {
  return cloneState({
    controlsByActionId: {
      [GALILEO_ACTION_IDS.checkAvailability]: [SEEDED_LARGE_EVENT_CONTROL],
    },
    gatesByActionId: {
      [GALILEO_ACTION_IDS.transferVipConcierge]: SEEDED_VIP_TRANSFER_GATE,
    },
  });
}

function isCondition(value: unknown): value is GalileoActionControlCondition {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && (value.kind === undefined || value.kind === 'action_input')
    && (value.field === 'party_size' || value.field === 'requested_bays')
    && value.operator === 'greater_than'
    && typeof value.value === 'number'
    && Number.isFinite(value.value)
  );
}

function isControl(value: unknown): value is GalileoActionControl {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.actionId === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && ['draft', 'active', 'disabled', 'needs_review'].includes(String(value.status))
    && ['pre_tool', 'post_tool'].includes(String(value.timing))
    && ['observe', 'steer', 'deny'].includes(String(value.behavior))
    && ['all', 'any'].includes(String(value.matchMode))
    && Array.isArray(value.conditions)
    && value.conditions.every(isCondition)
    && typeof value.guidance === 'string'
    && (value.steerToActionId === undefined || typeof value.steerToActionId === 'string')
    && (value.source === 'manual' || value.source === 'recommended')
    && (value.sourceEvidence === undefined || typeof value.sourceEvidence === 'string')
    && (value.recommendationReason === undefined || typeof value.recommendationReason === 'string')
    && (value.version === undefined || (
      typeof value.version === 'number'
      && Number.isInteger(value.version)
      && value.version > 0
    ))
  );
}

function isGate(value: unknown): value is StoredGalileoActionGate {
  if (!isRecord(value)) return false;
  return (
    typeof value.actionId === 'string'
    && typeof value.sourceActionId === 'string'
    && typeof value.controlId === 'string'
    && typeof value.enabled === 'boolean'
    && (value.prerequisiteControlIds === undefined || (
      Array.isArray(value.prerequisiteControlIds)
      && value.prerequisiteControlIds.every(item => typeof item === 'string')
    ))
  );
}

/**
 * Reads the shared actions.values contract. Invalid or absent values fall back
 * to the stage-ready EAGLE GREEN control without disturbing other action data.
 */
export function readGalileoActionControlState(values: Record<string, unknown> | undefined): GalileoActionControlState {
  const defaults = createDefaultGalileoActionControlState();
  const rawControls = values?.controlsByActionId;
  const rawGates = values?.gatesByActionId;

  const controlsByActionId = isRecord(rawControls)
    ? {
      ...defaults.controlsByActionId,
      ...Object.fromEntries(
        Object.entries(rawControls).map(([actionId, controls]) => (
          Array.isArray(controls) && controls.every(isControl)
            ? [actionId, controls.map(cloneControl)]
            : [actionId, (defaults.controlsByActionId[actionId] ?? []).map(cloneControl)]
        )),
      ),
    }
    : defaults.controlsByActionId;

  const gatesByActionId = isRecord(rawGates)
    ? {
      ...defaults.gatesByActionId,
      ...Object.fromEntries(
        Object.entries(rawGates).flatMap(([actionId, gate]) => {
          if (isGate(gate)) {
            return [[actionId, {
              ...gate,
              prerequisiteControlIds: gate.prerequisiteControlIds ?? [gate.controlId],
            }]];
          }
          const fallback = defaults.gatesByActionId[actionId];
          return fallback ? [[actionId, { ...fallback }]] : [];
        }),
      ),
    }
    : defaults.gatesByActionId;

  return { controlsByActionId, gatesByActionId };
}

function isValidGatePrerequisite(
  state: GalileoActionControlState,
  sourceActionId: string,
  controlId: string,
): boolean {
  return (state.controlsByActionId[sourceActionId] ?? []).some(control => (
    control.id === controlId
    && control.status === 'active'
    && control.behavior === 'steer'
  ));
}

function evaluateCondition(
  condition: GalileoActionControlCondition,
  inputs: Record<string, unknown>,
): GalileoActionControlConditionEvidence {
  const rawActual = inputs[condition.field];
  const actual = typeof rawActual === 'number' && Number.isFinite(rawActual)
    ? rawActual
    : 'missing';
  return {
    conditionId: condition.id,
    field: condition.field,
    operator: condition.operator,
    expected: condition.value,
    actual,
    matched: actual !== 'missing' && actual > condition.value,
  };
}

/**
 * Deterministically evaluates the supported Galileo runtime contract.
 *
 * Active controls are evaluated at the lifecycle point supplied by the caller.
 * Post-tool controls can reuse the original structured action inputs after the
 * attached action has returned, so they can steer the next action without
 * suppressing the action that already completed.
 * A gate fails closed unless every prerequisite points to an active pre-tool
 * or post-tool Steer control and the caller supplies those ids from a matching
 * invocation.
 */
export function evaluateGalileoActionInvocation({
  state,
  actionId,
  inputs,
  timing = 'pre_tool',
  satisfiedControlIds = [],
}: GalileoActionControlEvaluationRequest): GalileoActionControlEvaluationResult {
  const currentGate = state.gatesByActionId[actionId];
  const suppliedPrerequisites = new Set(satisfiedControlIds);
  const configuredPrerequisites = currentGate?.prerequisiteControlIds ?? [];
  const missingPrerequisiteControlIds = currentGate?.enabled
    ? configuredPrerequisites.filter(controlId => (
      !isValidGatePrerequisite(state, currentGate.sourceActionId, controlId)
      || !suppliedPrerequisites.has(controlId)
    ))
    : [];
  const gateAllowed = !currentGate?.enabled
    || (configuredPrerequisites.length > 0 && missingPrerequisiteControlIds.length === 0);

  if (!gateAllowed) {
    return {
      actionId,
      gateAllowed: false,
      missingPrerequisiteControlIds,
      shouldExecuteAction: false,
      decisions: [],
      matchedControlIds: [],
      satisfiedPrerequisiteControlIds: [],
      unlockedActionIds: [],
      lockedActionIds: [actionId],
    };
  }

  const controls = (state.controlsByActionId[actionId] ?? []).filter(control => (
    control.status === 'active' && control.timing === timing
  ));
  const evaluated = controls.map(control => {
    const evidence = control.conditions.map(condition => evaluateCondition(condition, inputs));
    const matched = evidence.length > 0 && (
      control.matchMode === 'all'
        ? evidence.every(item => item.matched)
        : evidence.some(item => item.matched)
    );
    return { control, evidence, matched };
  });
  const matchedControlIds = evaluated
    .filter(item => item.matched)
    .map(item => item.control.id);
  const satisfiedPrerequisiteControlIds = evaluated
    .filter(item => item.matched && item.control.behavior === 'steer')
    .map(item => item.control.id);
  const satisfiedPrerequisites = new Set(satisfiedPrerequisiteControlIds);
  const shouldExecuteAction = timing === 'post_tool' || !evaluated.some(item => (
    item.matched && (item.control.behavior === 'steer' || item.control.behavior === 'deny')
  ));

  const gatesFromThisAction = Object.values(state.gatesByActionId).filter(gate => (
    gate.enabled && gate.sourceActionId === actionId
  ));
  const unlockedActionIds = gatesFromThisAction
    .filter(gate => (
      gate.prerequisiteControlIds.length > 0
      && gate.prerequisiteControlIds.every(controlId => (
        isValidGatePrerequisite(state, actionId, controlId)
        && satisfiedPrerequisites.has(controlId)
      ))
    ))
    .map(gate => gate.actionId);
  const unlockedActions = new Set(unlockedActionIds);
  const lockedActionIds = gatesFromThisAction
    .filter(gate => !unlockedActions.has(gate.actionId))
    .map(gate => gate.actionId);

  const decisions = evaluated.map<GalileoActionControlEvaluationDecision>(({ control, evidence, matched }) => ({
    controlId: control.id,
    controlTitle: control.name,
    actionId,
    timing: control.timing,
    behavior: control.behavior,
    invoked: true,
    matched,
    evidence,
    result: !matched
      ? 'not_matched'
      : control.behavior === 'steer'
        ? 'steered'
        : control.behavior === 'deny'
          ? 'denied'
          : 'observed',
    toolExecuted: shouldExecuteAction,
    unlockedActionIds: unlockedActionIds.filter(targetActionId => {
      const gate = state.gatesByActionId[targetActionId];
      return gate?.prerequisiteControlIds.includes(control.id);
    }),
  }));

  return {
    actionId,
    gateAllowed: true,
    missingPrerequisiteControlIds: [],
    shouldExecuteAction,
    decisions,
    matchedControlIds,
    satisfiedPrerequisiteControlIds,
    unlockedActionIds,
    lockedActionIds,
  };
}

export function getGalileoActionId(sourceActionId: number | string | undefined, actionName: string): string {
  const normalized = actionName.trim().toLowerCase();
  if (
    normalized === 'check availability'
    || normalized === 'check availability.'
    || normalized === 'check bay availability'
  ) {
    return GALILEO_ACTION_IDS.checkAvailability;
  }
  if (normalized === 'send payment link') return GALILEO_ACTION_IDS.sendPayment;
  if (LEGACY_VIP_TEAM_ACTION_NAMES.has(normalized) || normalized === VIP_TEAM_ACTION_NAME.toLowerCase()) {
    return GALILEO_ACTION_IDS.transferVipConcierge;
  }
  if (sourceActionId !== undefined) return `catalog-action-${String(sourceActionId)}`;
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled-action';
}

export function getGalileoActionDisplayName(actionName: string): string {
  return LEGACY_VIP_TEAM_ACTION_NAMES.has(actionName.trim().toLowerCase())
    ? VIP_TEAM_ACTION_NAME
    : actionName;
}

export function getGalileoActionStatus(
  actionId: string,
  state: GalileoActionControlState,
): GalileoActionStatus {
  const controls = state.controlsByActionId[actionId] ?? [];
  const activeCount = controls.filter(control => control.status === 'active').length;
  const reviewCount = controls.filter(control => control.status === 'needs_review').length;
  const draftCount = controls.filter(control => control.status === 'draft').length;
  const gate = state.gatesByActionId[actionId];

  if (reviewCount > 0) return { label: 'Needs review', tone: 'review' };
  if (activeCount > 0) {
    const activeControl = controls.find(control => control.status === 'active');
    const behavior = activeControl ? BEHAVIOR_LABELS[activeControl.behavior] : '';
    return { label: `${activeCount} active${behavior ? ` · ${behavior}` : ''}`, tone: 'active' };
  }
  if (draftCount > 0) return { label: `${draftCount} draft`, tone: 'draft' };
  if (gate?.enabled) return { label: 'Gated · 1 prerequisite', tone: 'gated' };
  if (gate) return { label: 'Gate draft', tone: 'draft' };
  if (controls.length > 0) return { label: 'Disabled', tone: 'disabled' };
  return { label: 'Add control', tone: 'empty' };
}

export function getControlExpressionPreview(control: GalileoActionControl): string {
  if (control.conditions.length === 0) return 'No conditions added';
  const joiner = control.matchMode === 'all' ? ' and ' : ' or ';
  return control.conditions
    .map(condition => `${FIELD_LABELS[condition.field]} is greater than ${condition.value}`)
    .join(joiner);
}

interface GalileoControlSummaryCopy {
  lead: string;
  evaluation: string;
  condition: string;
  matchedOutcome: string;
  unmatchedOutcome: string;
}

function getGalileoControlSummaryCopy(
  control: GalileoActionControl,
  actionName: string,
  actionNames: Record<string, string>,
): GalileoControlSummaryCopy {
  const condition = getControlExpressionPreview(control);
  const targetName = control.steerToActionId
    ? actionNames[control.steerToActionId] ?? control.steerToActionId
    : 'the configured next action';

  if (control.timing === 'post_tool') {
    const matchedOutcome = control.behavior === 'steer'
      ? `Keep the availability result, stop the standard automated path, and continue with ${targetName}`
      : control.behavior === 'deny'
        ? 'Stop the next automated step'
        : 'Record the match and continue';
    return {
      lead: `${actionName} always runs. After it returns, Galileo evaluates the original reservation inputs to choose what happens next.`,
      evaluation: `After ${actionName} returns`,
      condition,
      matchedOutcome,
      unmatchedOutcome: 'Continue on the standard automated path',
    };
  }

  const matchedOutcome = control.behavior === 'steer'
    ? `Skip ${actionName} and continue with ${targetName}`
    : control.behavior === 'deny'
      ? `Block ${actionName}`
      : `Record the match and run ${actionName}`;
  const matchedLead = control.behavior === 'steer'
    ? `skip ${actionName} and continue with ${targetName}`
    : control.behavior === 'deny'
      ? `block ${actionName}`
      : `record the match without changing ${actionName}`;

  return {
    lead: `Galileo checks the request before ${actionName} runs. Matching requests ${matchedLead}; all other requests continue to ${actionName}.`,
    evaluation: `Before ${actionName} runs`,
    condition,
    matchedOutcome,
    unmatchedOutcome: `Run ${actionName}`,
  };
}

interface RecommendedGalileoActionControl {
  id: string;
  controlId: string;
  actionId: string;
  actionName: string;
  title: string;
  evidence: string;
  why: string;
  happyPath: string;
  interventionPath: string;
  confidence: number;
  timing: GalileoActionControlTiming;
  recommendedBehavior: GalileoActionControlBehavior;
  matchMode: GalileoActionControlMatchMode;
  conditions: GalileoActionControlCondition[];
  guidance: string;
  steerToActionId?: string;
}

interface GalileoManualReviewGap {
  id: string;
  actionName: string;
  evidence: string;
  limitation: string;
  nextStep: string;
}

function buildLargeEventConditions(prefix: string): GalileoActionControlCondition[] {
  return [
    {
      id: `${prefix}-party-size`,
      kind: 'action_input',
      field: 'party_size',
      operator: 'greater_than',
      value: 100,
    },
    {
      id: `${prefix}-requested-bays`,
      kind: 'action_input',
      field: 'requested_bays',
      operator: 'greater_than',
      value: 20,
    },
  ];
}

function buildRecommendedGalileoControls(
  actions: GalileoActionOption[],
): RecommendedGalileoActionControl[] {
  const actionNames = new Map(actions.map(action => [action.id, action.name]));
  const recommendations: RecommendedGalileoActionControl[] = [];
  const checkAvailabilityName = actionNames.get(GALILEO_ACTION_IDS.checkAvailability);
  const sendPaymentName = actionNames.get(GALILEO_ACTION_IDS.sendPayment);

  if (checkAvailabilityName) {
    recommendations.push({
      id: 'recommend-large-event-vip-review',
      controlId: LARGE_EVENT_CONTROL_ID,
      actionId: GALILEO_ACTION_IDS.checkAvailability,
      actionName: checkAvailabilityName,
      title: 'Route large event requests to the VIP team',
      evidence: '“Requests over 100 guests or more than 20 bays require review by the VIP event team.”',
      why: 'Check Availability receives party size and requested bays for every request. Galileo evaluates those original inputs after the action returns to choose the next path.',
      happyPath: 'Check Availability completes and standard reservations continue on the automated path.',
      interventionPath: 'Keep the availability result, stop the standard automated path, and transfer the full reservation context to the VIP team.',
      confidence: 97,
      timing: 'post_tool',
      recommendedBehavior: 'steer',
      matchMode: 'any',
      conditions: buildLargeEventConditions('large-event-review'),
      guidance: 'Tell the caller that availability was checked and the request needs VIP-team review. Transfer the caller, availability result, and reservation context to the VIP team.',
      steerToActionId: GALILEO_ACTION_IDS.transferVipConcierge,
    });
  }

  if (sendPaymentName) {
    recommendations.push({
      id: 'recommend-large-event-payment-observation',
      controlId: 'large-event-payment-observation',
      actionId: GALILEO_ACTION_IDS.sendPayment,
      actionName: sendPaymentName,
      title: 'Monitor payment links for large event requests',
      evidence: '“Large event reservations require VIP-team review before the booking path is completed.”',
      why: 'A payment-link request for a large event is a useful signal for reviewing whether the specialist approval path is working as intended.',
      happyPath: 'Standard payment-link requests continue while existing PCI and provider checks remain authoritative.',
      interventionPath: 'Record the large-event payment attempt for review without claiming that approval or payment has succeeded.',
      confidence: 91,
      timing: 'pre_tool',
      recommendedBehavior: 'observe',
      matchMode: 'any',
      conditions: buildLargeEventConditions('large-event-payment'),
      guidance: 'Record that a payment link was requested for a large event. Do not infer VIP approval or payment status from this control alone.',
      steerToActionId: GALILEO_ACTION_IDS.transferVipConcierge,
    });
  }

  return recommendations;
}

function buildGalileoManualReviewGaps(actions: GalileoActionOption[]): GalileoManualReviewGap[] {
  const actionNames = new Map(actions.map(action => [action.id, action.name]));
  const transferName = actionNames.get(GALILEO_ACTION_IDS.transferVipConcierge) ?? VIP_TEAM_ACTION_NAME;
  const paymentName = actionNames.get(GALILEO_ACTION_IDS.sendPayment) ?? 'Send payment link';

  return [
    {
      id: 'verified-organizer-scope',
      actionName: transferName,
      evidence: '“Share confidential event details only with a verified organizer or an authorized vendor.”',
      limitation: 'The available evaluators cannot compare caller verification, role, or authorization scope.',
      nextStep: 'Expose verified requester role and permitted data scope as structured action context before automating this requirement.',
    },
    {
      id: 'provider-payment-status',
      actionName: paymentName,
      evidence: '“Never state that payment succeeded until the payment provider confirms it.”',
      limitation: 'The payment control evaluates reservation inputs and cannot compare the provider response with the agent’s claim.',
      nextStep: 'Add a normalized provider payment status and a post-action response evaluator.',
    },
    {
      id: 'complete-transfer-payload',
      actionName: transferName,
      evidence: '“Transfer the verified caller profile, transcript reference, customer context, and event summary together.”',
      limitation: 'Party size and requested bays cannot prove that every required handoff field is present.',
      nextStep: 'Add structured presence checks for the transfer payload before making this a deterministic control.',
    },
  ];
}

export function addRecommendedGalileoControl(
  state: GalileoActionControlState,
  control: GalileoActionControl,
): GalileoActionControlState {
  const existing = state.controlsByActionId[control.actionId] ?? [];
  if (existing.some(item => item.id === control.id)) return state;
  const next = cloneState(state);
  next.controlsByActionId[control.actionId] = [
    ...(next.controlsByActionId[control.actionId] ?? []),
    cloneControl(control),
  ];
  return next;
}

interface RecommendedActionControlsDialogProps {
  actions: GalileoActionOption[];
  state: GalileoActionControlState;
  onClose: () => void;
  onAdd: (control: GalileoActionControl) => void;
}

export function RecommendedActionControlsDialog({
  actions,
  state,
  onClose,
  onAdd,
}: RecommendedActionControlsDialogProps) {
  const recommendations = useMemo(() => buildRecommendedGalileoControls(actions), [actions]);
  const manualReviewGaps = useMemo(() => buildGalileoManualReviewGaps(actions), [actions]);
  const [generationRun, setGenerationRun] = useState(0);
  const [generationStep, setGenerationStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(() => new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set());
  const [selectedBehaviors, setSelectedBehaviors] = useState<Record<string, GalileoActionControlBehavior>>(
    () => Object.fromEntries(
      recommendations.map(recommendation => [recommendation.id, recommendation.recommendedBehavior]),
    ),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const interval = window.setInterval(() => setElapsedSeconds(current => current + 1), 1000);
    const analyzeTimer = window.setTimeout(() => setGenerationStep(1), 550);
    const validateTimer = window.setTimeout(() => setGenerationStep(2), 1200);
    const completeTimer = window.setTimeout(() => setIsGenerating(false), 2100);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(analyzeTimer);
      window.clearTimeout(validateTimer);
      window.clearTimeout(completeTimer);
    };
  }, [generationRun]);

  const regenerate = () => {
    setGenerationStep(0);
    setElapsedSeconds(0);
    setIsGenerating(true);
    setIgnoredIds(new Set());
    setGenerationRun(current => current + 1);
  };

  const isRecommendationAdded = (recommendation: RecommendedGalileoActionControl) => (
    addedIds.has(recommendation.id)
    || (state.controlsByActionId[recommendation.actionId] ?? []).some(control => (
      control.id === recommendation.controlId
    ))
  );

  const addRecommendation = (recommendation: RecommendedGalileoActionControl) => {
    if (isRecommendationAdded(recommendation)) return;
    const behavior = selectedBehaviors[recommendation.id] ?? recommendation.recommendedBehavior;
    onAdd({
      id: recommendation.controlId,
      actionId: recommendation.actionId,
      name: recommendation.title,
      description: recommendation.why,
      status: 'needs_review',
      timing: recommendation.timing,
      behavior,
      matchMode: recommendation.matchMode,
      conditions: recommendation.conditions.map(condition => ({ ...condition })),
      guidance: recommendation.guidance,
      steerToActionId: behavior === 'steer' ? recommendation.steerToActionId : undefined,
      source: 'recommended',
      sourceEvidence: recommendation.evidence,
      recommendationReason: recommendation.why,
      version: 1,
    });
    setAddedIds(current => new Set(current).add(recommendation.id));
  };

  const generationSteps = [
    {
      title: 'Preparing agent context',
      description: 'Loading saved instructions, available actions, existing controls, and supported evaluators.',
    },
    {
      title: 'Analyzing requirements',
      description: 'Comparing instruction requirements with action inputs, dependencies, and current control coverage.',
    },
    {
      title: 'Validating safe controls',
      description: 'Checking supported candidates, overlaps, and requirements that need manual review.',
    },
  ];

  const addedCount = recommendations.filter(isRecommendationAdded).length;

  return (
    <Modal
      size="lg"
      className="recommended-controls-dialog"
      overlayClassName="recommended-controls-dialog-overlay"
      onClose={onClose}
      ariaLabel="Recommended action controls"
    >
      <ModalHeader
        title="Recommended action controls"
        description="Review deterministic controls derived from the saved goal, instructions, actions, and current controls. Nothing is published automatically."
        onClose={onClose}
      />
      <ModalBody className="recommended-controls-dialog__body">
        {isGenerating ? (
          <div className="recommended-controls-generation" role="status" aria-live="polite">
            <div className="recommended-controls-generation__summary">
              <span className="recommended-controls-spinner" aria-hidden="true" />
              <strong>Analyzing saved instructions and actions…</strong>
            </div>
            <ol className="recommended-controls-generation__steps">
              {generationSteps.map((step, index) => {
                const status = index < generationStep ? 'complete' : index === generationStep ? 'current' : 'pending';
                return (
                  <li key={step.title} className={`recommended-controls-generation__step is-${status}`}>
                    <span className="recommended-controls-generation__marker" aria-hidden="true">
                      {status === 'complete' ? <Icon name="check" weight="bold" size={14} /> : null}
                    </span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="recommended-controls-generation__note">
              Analysis can take a few minutes. You can leave this dialog open while Studio works.
            </p>
            <span className="recommended-controls-generation__elapsed">Elapsed: {elapsedSeconds}s</span>
          </div>
        ) : (
          <div className="recommended-controls-results">
            <p className="recommended-controls-results__intro">
              Recommendations are starting points. Choose the behavior you want, then review each control before publishing.
            </p>
            <section aria-labelledby="recommended-controls-list-title">
              <h3 id="recommended-controls-list-title">Recommendations</h3>
              <div className="recommended-controls-list">
                {recommendations.map(recommendation => {
                  const selectedBehavior = selectedBehaviors[recommendation.id] ?? recommendation.recommendedBehavior;
                  const ignored = ignoredIds.has(recommendation.id);
                  const added = isRecommendationAdded(recommendation);
                  return (
                    <Card
                      key={recommendation.id}
                      className={`recommended-control-card${ignored ? ' is-ignored' : ''}${added ? ' is-added' : ''}`}
                    >
                      <CardBody className="recommended-control-card__body">
                        <div className="recommended-control-card__header">
                          <div>
                            <span className="recommended-control-card__action">{recommendation.actionName}</span>
                            <h4>{recommendation.title}</h4>
                          </div>
                          <span className={`recommended-control-card__recommended is-${recommendation.recommendedBehavior}`}>
                            Recommended behavior: {BEHAVIOR_LABELS[recommendation.recommendedBehavior]}
                          </span>
                        </div>
                        <div className="recommended-control-card__details">
                          <div>
                            <strong>Saved instruction evidence</strong>
                            <p>{recommendation.evidence}</p>
                          </div>
                          <div>
                            <strong>Why this control</strong>
                            <p>{recommendation.why}</p>
                          </div>
                          <div>
                            <strong>Happy path</strong>
                            <p>{recommendation.happyPath}</p>
                          </div>
                          <div>
                            <strong>Intervention path</strong>
                            <p>{recommendation.interventionPath}</p>
                          </div>
                        </div>
                        <div className="recommended-control-card__footer">
                          <span className="recommended-control-card__confidence">{recommendation.confidence}% confidence</span>
                          <div className="recommended-control-card__actions">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={added}
                              aria-label={`${ignored ? 'Restore' : 'Ignore'} ${recommendation.title}`}
                              onClick={() => setIgnoredIds(current => {
                                const next = new Set(current);
                                if (next.has(recommendation.id)) next.delete(recommendation.id);
                                else next.add(recommendation.id);
                                return next;
                              })}
                            >
                              {ignored ? 'Restore' : 'Ignore'}
                            </Button>
                            <span>Apply as</span>
                            <div
                              className="recommended-control-behaviors"
                              role="group"
                              aria-label={`Behavior for ${recommendation.title}`}
                            >
                              {(['observe', 'steer', 'deny'] as GalileoActionControlBehavior[]).map(behavior => (
                                <Button
                                  key={behavior}
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className={`is-${behavior}${selectedBehavior === behavior ? ' is-selected' : ''}`}
                                  aria-pressed={selectedBehavior === behavior}
                                  disabled={ignored || added}
                                  onClick={() => setSelectedBehaviors(current => ({
                                    ...current,
                                    [recommendation.id]: behavior,
                                  }))}
                                >
                                  {BEHAVIOR_LABELS[behavior]}
                                </Button>
                              ))}
                            </div>
                            <Button
                              type="button"
                              color="accent"
                              size="sm"
                              disabled={ignored || added}
                              aria-label={added
                                ? `${recommendation.title} added`
                                : `Add ${recommendation.title} as ${BEHAVIOR_LABELS[selectedBehavior].toLowerCase()}`}
                              onClick={() => addRecommendation(recommendation)}
                            >
                              {added ? 'Added' : `Add as ${BEHAVIOR_LABELS[selectedBehavior].toLowerCase()}`}
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section className="recommended-controls-gaps" aria-labelledby="manual-review-gaps-title">
              <h3 id="manual-review-gaps-title">Manual review gaps</h3>
              <p>These instruction requirements cannot be represented safely with the available action metadata and evaluators.</p>
              <div className="recommended-controls-gaps__list">
                {manualReviewGaps.map(gap => (
                  <Card key={gap.id} className="recommended-control-gap-card">
                    <CardBody>
                      <strong className="recommended-control-gap-card__action">{gap.actionName}</strong>
                      <blockquote>{gap.evidence}</blockquote>
                      <p>{gap.limitation}</p>
                      <p>{gap.nextStep}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </ModalBody>
      <ModalFooter className="recommended-controls-dialog__footer">
        {!isGenerating && <span>{addedCount} of {recommendations.length} added</span>}
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>Close</Button>
        <Button type="button" variant="secondary" size="sm" disabled={isGenerating} onClick={regenerate}>
          Regenerate
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function createBlankControl(actionId: string): GalileoActionControl {
  const stamp = Date.now().toString(36);
  return {
    id: `control-${stamp}`,
    actionId,
    name: 'New action control',
    description: 'Define when Galileo should intervene before this action runs.',
    status: 'draft',
    timing: 'pre_tool',
    behavior: 'steer',
    matchMode: 'any',
    conditions: [
      {
        id: `condition-${stamp}`,
        kind: 'action_input',
        field: 'party_size',
        operator: 'greater_than',
        value: 100,
      },
    ],
    guidance: '',
    steerToActionId: GALILEO_ACTION_IDS.transferVipConcierge,
    source: 'manual',
    version: 1,
  };
}

function statusBadgeVariant(status: GalileoActionControlStatus): 'success' | 'warning' | 'info' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'needs_review') return 'warning';
  if (status === 'draft') return 'info';
  return 'default';
}

interface ActionControlManagerDialogProps {
  actionId: string;
  actions: GalileoActionOption[];
  state: GalileoActionControlState;
  onChange: (next: GalileoActionControlState) => void;
  onClose: () => void;
}

export function ActionControlManagerDialog({
  actionId,
  actions,
  state,
  onChange,
  onClose,
}: ActionControlManagerDialogProps) {
  const [contextActionId, setContextActionId] = useState(actionId);
  const initialControl = state.controlsByActionId[actionId]?.[0] ?? null;
  const [draft, setDraft] = useState<GalileoActionControl | null>(
    initialControl ? cloneControl(initialControl) : null,
  );
  const [gateInterventionAction, setGateInterventionAction] = useState(() => Boolean(
    initialControl?.steerToActionId
    && state.gatesByActionId[initialControl.steerToActionId]?.controlId === initialControl.id
    && state.gatesByActionId[initialControl.steerToActionId]?.enabled,
  ));
  const [error, setError] = useState('');
  const studioRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nextControl = state.controlsByActionId[actionId]?.[0] ?? null;
    setContextActionId(actionId);
    setDraft(nextControl ? cloneControl(nextControl) : null);
    setGateInterventionAction(Boolean(
      nextControl?.steerToActionId
      && state.gatesByActionId[nextControl.steerToActionId]?.controlId === nextControl.id
      && state.gatesByActionId[nextControl.steerToActionId]?.enabled,
    ));
    setError('');
  }, [actionId]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      studioRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, []);

  const trapStudioFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const studio = studioRef.current;
    if (!studio) return;
    const focusable = Array.from(studio.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.offsetParent !== null);
    if (focusable.length === 0) {
      event.preventDefault();
      studio.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const actionNames = useMemo(
    () => Object.fromEntries(actions.map(action => [action.id, action.name])),
    [actions],
  );
  const contextActionName = actionNames[contextActionId] ?? 'Action';
  const controls = state.controlsByActionId[contextActionId] ?? [];
  const control = controls[0] ?? null;
  const gate = state.gatesByActionId[contextActionId];
  const gateSourceControl = gate
    ? state.controlsByActionId[gate.sourceActionId]?.find(item => item.id === gate.controlId) ?? null
    : null;
  const persistedGateInterventionAction = Boolean(
    control?.steerToActionId
    && state.gatesByActionId[control.steerToActionId]?.controlId === control.id
    && state.gatesByActionId[control.steerToActionId]?.enabled,
  );
  const hasUnsavedChanges = Boolean(draft && (
    !control
    || JSON.stringify(draft) !== JSON.stringify(cloneControl(control))
    || gateInterventionAction !== persistedGateInterventionAction
  ));
  const confirmDiscardChanges = () => (
    !hasUnsavedChanges
    || window.confirm('Discard your unsaved control changes?')
  );
  const requestClose = () => {
    if (confirmDiscardChanges()) onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!hasUnsavedChanges || window.confirm('Discard your unsaved control changes?')) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, onClose]);

  const beginEdit = (nextControl: GalileoActionControl) => {
    const editableControl = cloneControl(nextControl);
    setDraft(editableControl);
    setGateInterventionAction(Boolean(
      editableControl.steerToActionId
      && state.gatesByActionId[editableControl.steerToActionId]?.controlId === editableControl.id
      && state.gatesByActionId[editableControl.steerToActionId]?.enabled,
    ));
    setError('');
  };

  const saveControl = (status: 'draft' | 'active') => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError('Give this control a clear name.');
      return;
    }
    if (draft.conditions.length === 0 || draft.conditions.some(condition => condition.value <= 0)) {
      setError('Add at least one condition with a value greater than zero.');
      return;
    }
    if (draft.behavior === 'steer' && !draft.steerToActionId) {
      setError('Choose the action Galileo should steer to.');
      return;
    }
    const next = cloneState(state);
    const savedControl: GalileoActionControl = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      guidance: draft.guidance.trim(),
      status,
      steerToActionId: draft.behavior === 'steer' ? draft.steerToActionId : undefined,
      version: Math.max(1, draft.version || 1),
    };
    const existing = next.controlsByActionId[contextActionId] ?? [];
    next.controlsByActionId[contextActionId] = existing.some(item => item.id === savedControl.id)
      ? existing.map(item => item.id === savedControl.id ? savedControl : item)
      : [...existing, savedControl];

    const existingControlGates = Object.entries(next.gatesByActionId).filter(([, existingGate]) => (
      existingGate.sourceActionId === contextActionId && existingGate.controlId === savedControl.id
    ));
    existingControlGates.forEach(([targetActionId, existingGate]) => {
      next.gatesByActionId[targetActionId] = {
        ...existingGate,
        enabled: false,
        prerequisiteControlIds: existingGate.prerequisiteControlIds.length > 0
          ? existingGate.prerequisiteControlIds
          : [savedControl.id],
      };
    });

    const configuredGateTarget = draft.steerToActionId ?? existingControlGates[0]?.[0];
    if (configuredGateTarget) {
      next.gatesByActionId[configuredGateTarget] = {
        actionId: configuredGateTarget,
        sourceActionId: contextActionId,
        controlId: savedControl.id,
        enabled: Boolean(
          gateInterventionAction
          && savedControl.behavior === 'steer'
          && status === 'active',
        ),
        prerequisiteControlIds: [savedControl.id],
      };
    }

    onChange(next);
    setDraft(savedControl);
  };

  const updateCondition = (
    conditionId: string,
    patch: Partial<GalileoActionControlCondition>,
  ) => {
    setDraft(current => current ? {
      ...current,
      conditions: current.conditions.map(condition => (
        condition.id === conditionId ? { ...condition, ...patch } : condition
      )),
    } : current);
  };

  const addCondition = () => {
    const stamp = Date.now().toString(36);
    setDraft(current => current ? {
      ...current,
      conditions: [
        ...current.conditions,
        {
          id: `condition-${stamp}`,
          kind: 'action_input',
          field: current.conditions.some(condition => condition.field === 'party_size')
            ? 'requested_bays'
            : 'party_size',
          operator: 'greater_than',
          value: 20,
        },
      ],
    } : current);
  };

  const removeCondition = (conditionId: string) => {
    setDraft(current => current ? {
      ...current,
      conditions: current.conditions.filter(condition => condition.id !== conditionId),
    } : current);
  };

  const availableSteerActions = actions.filter(action => action.id !== contextActionId);
  const summaryControl = draft ?? control;
  const summaryCopy = summaryControl
    ? getGalileoControlSummaryCopy(summaryControl, contextActionName, actionNames)
    : null;

  return createPortal(
    <div
      className="security-ui-overlay security-ui-overlay--studio galileo-action-control-studio-overlay"
      tabIndex={-1}
    >
      <section
        ref={studioRef}
        className="security-ui-studio galileo-action-control-studio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="galileo-action-control-title"
        tabIndex={-1}
        onKeyDown={trapStudioFocus}
      >
        <header className="security-ui-studio-header galileo-action-control-studio__header">
          <div className="security-ui-studio-bar">
            <button
              type="button"
              className="security-ui-icon-text"
              onClick={requestClose}
              aria-label="Back to actions"
            >
              <Icon name="arrow-left" weight="bold" size={32} />
              <span>Action control</span>
            </button>
            <span className="security-ui-divider" aria-hidden="true" />
            <h2 id="galileo-action-control-title" className="security-ui-studio-name">
              {contextActionName}
            </h2>
          </div>
          <div className="galileo-action-control-studio__header-actions">
            {draft ? (
              <>
                <button
                  type="button"
                  className="security-ui-secondary"
                  onClick={() => saveControl('draft')}
                >
                  {draft.status === 'active' ? 'Deactivate and save as draft' : 'Save as draft'}
                </button>
                <button
                  type="button"
                  className="security-ui-publish"
                  onClick={() => saveControl('active')}
                >
                  {draft.status === 'active' ? 'Save changes' : 'Activate control'}
                </button>
              </>
            ) : gate ? (
              <button
                type="button"
                className="security-ui-publish"
                onClick={() => {
                  setContextActionId(gate.sourceActionId);
                  if (gateSourceControl) beginEdit(gateSourceControl);
                }}
              >
                View control
              </button>
            ) : (
              <button
                type="button"
                className="security-ui-publish"
                onClick={() => beginEdit(createBlankControl(contextActionId))}
              >
                Add control
              </button>
            )}
          </div>
        </header>

        <main className="galileo-action-control-workspace">
          {contextActionId !== actionId && (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="galileo-action-control-back"
              onClick={() => {
                if (!confirmDiscardChanges()) return;
                setContextActionId(actionId);
                setDraft(null);
                setError('');
              }}
            >
              <Icon name="arrow-left" weight="bold" size="sm" />
              Back to {actionNames[actionId] ?? 'action'}
            </Button>
          )}

          <div className="galileo-action-control-summary">
            {summaryControl && summaryCopy ? (
              <Card className="galileo-action-control-card galileo-action-control-card--overview">
                <CardBody>
                  <div className="galileo-action-control-card__header">
                    <div>
                      <span className="galileo-action-control-eyebrow">Control summary</span>
                      <h3>{summaryControl.name}</h3>
                    </div>
                    <div className="galileo-action-control-card__badges">
                      <Badge variant={hasUnsavedChanges ? 'warning' : statusBadgeVariant(summaryControl.status)}>
                        {hasUnsavedChanges
                          ? 'Unsaved changes'
                          : summaryControl.status === 'needs_review'
                          ? 'Needs review'
                          : summaryControl.status[0].toUpperCase() + summaryControl.status.slice(1)}
                      </Badge>
                      <Badge variant="info">{BEHAVIOR_LABELS[summaryControl.behavior]}</Badge>
                    </div>
                  </div>
                  <p className="galileo-action-control-summary__lead">{summaryCopy.lead}</p>
                  <dl className="galileo-action-control-summary__flow" aria-label="Control outcome">
                    <div>
                      <dt>Evaluation</dt>
                      <dd>{summaryCopy.evaluation}</dd>
                    </div>
                    <div>
                      <dt>If</dt>
                      <dd>{summaryCopy.condition}</dd>
                    </div>
                    <div>
                      <dt>Then</dt>
                      <dd>{summaryCopy.matchedOutcome}</dd>
                    </div>
                    <div>
                      <dt>Otherwise</dt>
                      <dd>{summaryCopy.unmatchedOutcome}</dd>
                    </div>
                  </dl>
                  {summaryControl.guidance && (
                    <div className="galileo-action-control-guidance">
                      <Icon name="info-circle" weight="bold" size="sm" />
                      <div>
                        <strong>Agent guidance</strong>
                        <p>{summaryControl.guidance}</p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ) : gate ? (
              <Card className="galileo-action-control-card galileo-action-control-card--gate">
                <CardBody>
                  <div className="galileo-action-control-card__header">
                    <div>
                      <span className="galileo-action-control-eyebrow">Action availability</span>
                      <h3>Available after Galileo intervenes</h3>
                    </div>
                    <Badge variant={gate.enabled ? 'info' : 'default'}>{gate.enabled ? 'Gated' : 'Gate draft'}</Badge>
                  </div>
                  <p className="galileo-action-control-card__description">
                    This action becomes available when <strong>{gateSourceControl?.name ?? gate.controlId}</strong> matches on{' '}
                    <strong>{actionNames[gate.sourceActionId] ?? gate.sourceActionId}</strong>.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="galileo-action-control-empty">
                <span aria-hidden="true"><Icon name="automation" weight="bold" size={24} /></span>
                <div>
                  <h3>No Galileo controls</h3>
                  <p>Add a control to define when this action can run or when the agent should take a safer path.</p>
                </div>
              </div>
            )}
          </div>

          {draft && (
          <div className="galileo-action-control-editor">
            <div className="galileo-action-control-editor__heading">
              <div>
                <h3>Edit control</h3>
                <p>Changes appear in the summary as you edit.</p>
              </div>
            </div>

            <section className="galileo-action-control-editor__section galileo-action-control-editor__section--details" aria-labelledby="galileo-details-title">
              <div className="galileo-action-control-editor__section-heading">
                <div>
                  <h3 id="galileo-details-title">Control details</h3>
                  <p>Name the control and tell the agent how to explain an intervention.</p>
                </div>
              </div>

            <Input
              label="Control name"
              required
              value={draft.name}
              onChange={event => setDraft(current => current ? { ...current, name: event.target.value } : current)}
              voiceInput={false}
            />

            <Textarea
              label="Control description"
              value={draft.description}
              rows={2}
              hint="Summarize the business outcome this control protects."
              onChange={event => setDraft(current => current ? { ...current, description: event.target.value } : current)}
              voiceInput={false}
            />

            <Textarea
              label="Agent-facing control guidance"
              value={draft.guidance}
              rows={3}
              hint="Explain what happened, what the agent should tell the customer, and which context to preserve."
              onChange={event => setDraft(current => current ? { ...current, guidance: event.target.value } : current)}
              voiceInput={false}
            />

            <Dropdown
              label="Evaluation timing"
              value={draft.timing}
              options={([
                { value: 'pre_tool', label: TIMING_LABELS.pre_tool },
                { value: 'post_tool', label: TIMING_LABELS.post_tool },
              ] satisfies Array<{ value: GalileoActionControlTiming; label: string }>)}
              onChange={value => setDraft(current => current
                ? { ...current, timing: value as GalileoActionControlTiming }
                : current)}
              hint={draft.timing === 'post_tool'
                ? `Galileo evaluates the original action inputs after ${contextActionName} returns.`
                : `Galileo evaluates the action inputs before ${contextActionName} runs.`}
            />
            </section>

            <section className="galileo-action-control-editor__section">
              <RadioGroup
                name={`galileo-action-control-behavior-${contextActionId}`}
                label="Control behavior"
                helperText="Choose what Galileo does when the conditions match."
                value={draft.behavior}
                onChange={behavior => setDraft(current => current
                  ? { ...current, behavior: behavior as GalileoActionControlBehavior }
                  : current)}
                className="galileo-action-control-behavior"
              >
                {(['observe', 'steer', 'deny'] as GalileoActionControlBehavior[]).map(behavior => (
                  <Radio key={behavior} value={behavior} label={BEHAVIOR_LABELS[behavior]} />
                ))}
              </RadioGroup>
            </section>

            <section className="galileo-action-control-editor__section" aria-labelledby="galileo-conditions-title">
              <div className="galileo-action-control-editor__section-heading">
                <div>
                  <h3 id="galileo-conditions-title">When this happens</h3>
                  <p>Evaluate only the reservation inputs available to this action.</p>
                </div>
              </div>

              <Dropdown
                label="Condition source"
                value="action_input"
                options={[{ value: 'action_input', label: 'Action input' }]}
                onChange={() => undefined}
                disabled
                hint="Galileo evaluates the structured inputs captured for this action."
              />

              <div className="galileo-action-control-condition-list">
                {draft.conditions.map((condition, index) => (
                  <div key={condition.id} className="galileo-action-control-condition">
                    <span className="galileo-action-control-condition__joiner">
                      {index === 0 ? 'When' : draft.matchMode.toUpperCase()}
                    </span>
                    <Dropdown
                      value={condition.field}
                      label={`Action input ${index + 1}`}
                      className="galileo-action-control-condition__field"
                      options={[
                        { value: 'party_size', label: FIELD_LABELS.party_size },
                        { value: 'requested_bays', label: FIELD_LABELS.requested_bays },
                      ]}
                      onChange={value => updateCondition(condition.id, { field: value as GalileoActionControlField })}
                    />
                    <span className="galileo-action-control-condition__operator">is greater than</span>
                    <Input
                      type="number"
                      min={1}
                      value={condition.value}
                      aria-label={`Condition ${index + 1} value`}
                      voiceInput={false}
                      onChange={event => updateCondition(condition.id, { value: Number(event.target.value) })}
                    />
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      disabled={draft.conditions.length === 1}
                      aria-label={`Remove condition ${index + 1}`}
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Icon name="delete" weight="bold" size="sm" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="tertiary" size="sm" onClick={addCondition}>
                <Icon name="plus" weight="bold" size="sm" />
                Add condition
              </Button>
              <div className="galileo-action-control-rule galileo-action-control-rule--preview" aria-live="polite">
                <span>Rule preview</span>
                <strong>{getControlExpressionPreview(draft)}</strong>
              </div>

              <details className="galileo-action-control-advanced">
                <summary>Advanced</summary>
                <div className="galileo-action-control-advanced__content">
                  <div>
                    <span className="galileo-action-control-advanced__label">Match mode</span>
                    <div className="galileo-action-control-choice-group" role="group" aria-label="Condition matching">
                      {(['any', 'all'] as GalileoActionControlMatchMode[]).map(matchMode => (
                        <button
                          key={matchMode}
                          type="button"
                          className={draft.matchMode === matchMode ? 'is-selected' : ''}
                          aria-pressed={draft.matchMode === matchMode}
                          onClick={() => setDraft(current => current ? { ...current, matchMode } : current)}
                        >
                          {matchMode === 'any' ? 'Any condition' : 'All conditions'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="galileo-action-control-advanced__label">Runtime metadata</span>
                    <p>Action key: {contextActionId} · {draft.timing} · {draft.behavior}</p>
                  </div>
                  <div>
                    <span className="galileo-action-control-advanced__label">JSON preview</span>
                    <pre>{JSON.stringify({
                      actionId: contextActionId,
                      version: draft.version,
                      timing: draft.timing,
                      behavior: draft.behavior,
                      matchMode: draft.matchMode,
                      conditions: draft.conditions,
                    }, null, 2)}</pre>
                  </div>
                </div>
              </details>
            </section>

            {draft.behavior === 'steer' && (
              <section className="galileo-action-control-editor__section" aria-labelledby="galileo-steer-title">
                <div className="galileo-action-control-editor__section-heading">
                  <div>
                    <h3 id="galileo-steer-title">Safer path</h3>
                    <p>Choose the action Galileo unlocks when this control matches.</p>
                  </div>
                </div>
                <Dropdown
                  label="Steer to action"
                  value={draft.steerToActionId ?? ''}
                  placeholder="Select an action"
                  options={availableSteerActions.map(action => ({ value: action.id, label: action.name }))}
                  onChange={value => setDraft(current => current ? { ...current, steerToActionId: value } : current)}
                />
                <Checkbox
                  checked={gateInterventionAction}
                  onChange={setGateInterventionAction}
                  label="Make this action available only after prerequisites match"
                  helperText="Authentication, authorization, and business rules still apply in the action backend."
                />
              </section>
            )}

            {error && (
              <div className="galileo-action-control-error" role="alert">
                <Icon name="error-legacy" weight="bold" size="sm" />
                {error}
              </div>
            )}
          </div>
          )}
        </main>
      </section>
    </div>,
    document.body,
  );
}
