import {
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Banner as MomentumBanner,
  Checkbox as MomentumCheckbox,
  IconProvider,
  MenuItemRadio as MomentumMenuItemRadio,
  MenuPopover as MomentumMenuPopover,
  Option as MomentumOption,
  Radio as MomentumRadio,
  RadioGroup as MomentumRadioGroup,
  Selectlistbox as MomentumSelectlistbox,
  StaticChip,
  Stepper as MomentumStepper,
  StepperConnector as MomentumStepperConnector,
  StepperItem as MomentumStepperItem,
  Tooltip as MomentumTooltip,
} from '@momentum-design/components/react';
import { publicAssetUrl } from '../../app/publicAsset';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { Card, CardBody } from '../../components/shared/Card';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../components/shared/Modal';
import {
  UpliftMomentumInput,
  UpliftMomentumSelect,
  UpliftMomentumTextarea,
} from '../../components/shared/UpliftMomentumField';
import { UpliftMomentumButton } from '../../components/shared/UpliftMomentumButton';
import { Icon } from '../../icons';

export const GALILEO_ACTION_IDS = {
  checkAvailability: 'check-bay-availability',
  sendPayment: 'send-payment-link',
  transferVipConcierge: 'transfer-large-event-vip-concierge',
  handover: 'handover-human-agent',
} as const;

export const LARGE_EVENT_CONTROL_ID = 'large-event-approval-routing';
export const HANDOVER_CONTROL_ID = 'handover-human-agent-steer';
export const VIP_TEAM_ACTION_NAME = 'Transfer to VIP team';
const LARGE_EVENT_CONTROL_NAME = 'Route large event requests to the VIP team';
const LARGE_EVENT_CONTROL_DESCRIPTION = 'After Check availability returns, between 9:30 AM and 10:00 AM, route requests over 100 guests or more than 20 bays to the VIP team.';
const LARGE_EVENT_CONTROL_GUIDANCE = 'Tell the caller that availability was checked and the request needs VIP-team review. Transfer the caller, availability result, and reservation context to the VIP team.';
const LARGE_EVENT_SOURCE_EVIDENCE = 'Requests over 100 guests or more than 20 bays require review by the VIP event team.';
const LARGE_EVENT_RECOMMENDATION_REASON = 'Check Availability receives party size and requested bays, so Galileo can make a deterministic routing decision after the action returns.';
const HANDOVER_CONTROL_NAME = 'Delay human handover until turn 5';
const HANDOVER_CONTROL_DESCRIPTION = 'Before Handover runs, nudge requests made before turn 5 to continue with the AI agent and share the estimated wait time. At turn 5 or later, allow Handover to transfer to a human agent.';
const HANDOVER_CONTROL_GUIDANCE = 'Before turn 5, encourage the user to continue with the AI agent and tell them: “A human agent is available in about {{estimated_human_wait_minutes}} minutes.” At turn 5 or later, run Handover and transfer the user and conversation context to a human agent.';
const LEGACY_VIP_TEAM_ACTION_NAMES = new Set([
  'transfer to concierge',
  'transfer large event to vip concierge',
]);

export type GalileoActionControlTiming = 'pre_tool' | 'post_tool';
export type GalileoActionControlBehavior = 'observe' | 'steer' | 'deny';
export type GalileoActionControlStatus = 'draft' | 'active' | 'disabled' | 'needs_review';
export type GalileoActionControlMatchMode = 'and' | 'or';
export type GalileoActionControlField = 'party_size' | 'requested_bays' | 'conversation_turn' | 'estimated_human_wait_minutes';
export type GalileoActionControlOperator = 'greater_than' | 'less_than';

export interface GalileoActionControlTimeWindow {
  field: 'event_time';
  operator: 'between';
  start: string;
  end: string;
}

type LegacyGalileoActionControlMatchMode = 'all' | 'any';
type StoredGalileoActionControlMatchMode = GalileoActionControlMatchMode | LegacyGalileoActionControlMatchMode;

const MATCH_MODE_CYCLE: GalileoActionControlMatchMode[] = ['or', 'and'];
const MATCH_MODE_CONNECTOR_LABELS: Record<GalileoActionControlMatchMode, string> = {
  or: 'OR',
  and: 'AND',
};

function normalizeMatchMode(matchMode: StoredGalileoActionControlMatchMode): GalileoActionControlMatchMode {
  return matchMode === 'all' || matchMode === 'and' ? 'and' : 'or';
}

function getNextMatchMode(matchMode: StoredGalileoActionControlMatchMode): GalileoActionControlMatchMode {
  const currentIndex = MATCH_MODE_CYCLE.indexOf(normalizeMatchMode(matchMode));
  return MATCH_MODE_CYCLE[(currentIndex + 1) % MATCH_MODE_CYCLE.length];
}

export interface GalileoActionControlCondition {
  id: string;
  kind: 'action_input';
  field: GalileoActionControlField;
  operator: GalileoActionControlOperator;
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
  timeWindow?: GalileoActionControlTimeWindow;
  guidance: string;
  steerToActionId?: string;
  source: 'manual' | 'recommended';
  sourceEvidence?: string;
  recommendationReason?: string;
  version: number;
}

type StoredGalileoActionControl = Omit<GalileoActionControl, 'matchMode'> & {
  matchMode: StoredGalileoActionControlMatchMode;
};

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
  operator: GalileoActionControlOperator;
  expected: number;
  actual: number | 'missing';
  matched: boolean;
}

export interface GalileoActionControlTimeWindowEvidence {
  field: 'event_time';
  operator: 'between';
  expected: { start: string; end: string };
  actual: string | 'missing';
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
  timeWindowEvidence?: GalileoActionControlTimeWindowEvidence;
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
  occurredAt?: string | Date;
  satisfiedControlIds?: string[];
}

export interface GalileoActionOption {
  id: string;
  name: string;
  description?: string;
}

type GalileoStatusTone = 'empty' | 'active' | 'draft' | 'review' | 'gated' | 'disabled';

export interface GalileoActionStatus {
  label: string;
  tone: GalileoStatusTone;
}

const ACTION_INPUT_VARIABLES: Array<{ value: GalileoActionControlField; label: string }> = [
  { value: 'party_size', label: '{{party_size}}' },
  { value: 'requested_bays', label: '{{requested_bays}}' },
  { value: 'conversation_turn', label: '{{conversation_turn}}' },
  { value: 'estimated_human_wait_minutes', label: '{{estimated_human_wait_minutes}}' },
];

const CONDITION_OPERATOR_LABELS: Record<GalileoActionControlOperator, string> = {
  greater_than: 'is greater than',
  less_than: 'is less than',
};

const LARGE_EVENT_TIME_WINDOW: GalileoActionControlTimeWindow = {
  field: 'event_time',
  operator: 'between',
  start: '09:30',
  end: '10:00',
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

const GALILEO_CONTROL_WIZARD_STEPS = [
  {
    id: 'details',
    label: 'Details',
    title: 'Define the control',
    description: 'Give the control a clear purpose and choose when Galileo evaluates it.',
  },
  {
    id: 'conditions',
    label: 'Conditions',
    title: 'Set the conditions',
    description: 'Choose the action inputs that determine when this control matches.',
  },
  {
    id: 'behavior',
    label: 'Behavior',
    title: 'Choose what happens',
    description: 'Define how Galileo responds when the conditions match.',
  },
] as const;

const SEEDED_LARGE_EVENT_CONTROL: GalileoActionControl = {
  id: LARGE_EVENT_CONTROL_ID,
  actionId: GALILEO_ACTION_IDS.checkAvailability,
  name: LARGE_EVENT_CONTROL_NAME,
  description: LARGE_EVENT_CONTROL_DESCRIPTION,
  status: 'active',
  timing: 'post_tool',
  behavior: 'steer',
  matchMode: 'or',
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
  timeWindow: LARGE_EVENT_TIME_WINDOW,
  guidance: LARGE_EVENT_CONTROL_GUIDANCE,
  steerToActionId: GALILEO_ACTION_IDS.transferVipConcierge,
  source: 'recommended',
  sourceEvidence: LARGE_EVENT_SOURCE_EVIDENCE,
  recommendationReason: LARGE_EVENT_RECOMMENDATION_REASON,
  version: 1,
};

const SEEDED_HANDOVER_CONTROL: GalileoActionControl = {
  id: HANDOVER_CONTROL_ID,
  actionId: GALILEO_ACTION_IDS.handover,
  name: HANDOVER_CONTROL_NAME,
  description: HANDOVER_CONTROL_DESCRIPTION,
  status: 'active',
  timing: 'pre_tool',
  behavior: 'steer',
  matchMode: 'and',
  conditions: [
    {
      id: 'handover-conversation-turn',
      kind: 'action_input',
      field: 'conversation_turn',
      operator: 'less_than',
      value: 5,
    },
  ],
  guidance: HANDOVER_CONTROL_GUIDANCE,
  source: 'manual',
  sourceEvidence: 'Early handover requests should remain with the AI agent until turn 5 while the user receives the current human-agent wait estimate.',
  recommendationReason: 'Handover receives the current conversation turn and human-agent wait estimate, so Galileo can delay early requests and transfer later ones.',
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

function cloneControl(control: StoredGalileoActionControl): GalileoActionControl {
  const shouldRefreshSeededCopy = control.id === LARGE_EVENT_CONTROL_ID;
  return {
    ...control,
    matchMode: normalizeMatchMode(control.matchMode),
    name: shouldRefreshSeededCopy && control.name === 'Large event approval routing'
      ? LARGE_EVENT_CONTROL_NAME
      : control.name,
    description: shouldRefreshSeededCopy
      && (
        control.description === 'Keep large event requests out of the standard booking path until the VIP event team can review them.'
        || control.description === 'Route requests over 100 guests or more than 20 bays to the VIP team before Check Availability runs.'
        || control.description === 'Check availability first, then route requests over 100 guests or more than 20 bays to the VIP team.'
        || control.description === 'Check availability for every request. After it returns, route requests over 100 guests or more than 20 bays to the VIP team.'
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
    timeWindow: shouldRefreshSeededCopy
      ? { ...(control.timeWindow ?? LARGE_EVENT_TIME_WINDOW) }
      : control.timeWindow
        ? { ...control.timeWindow }
        : undefined,
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
      [GALILEO_ACTION_IDS.handover]: [SEEDED_HANDOVER_CONTROL],
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
    && ['party_size', 'requested_bays', 'conversation_turn', 'estimated_human_wait_minutes'].includes(String(value.field))
    && ['greater_than', 'less_than'].includes(String(value.operator))
    && typeof value.value === 'number'
    && Number.isFinite(value.value)
  );
}

function isTimeWindow(value: unknown): value is GalileoActionControlTimeWindow {
  if (!isRecord(value)) return false;
  return (
    value.field === 'event_time'
    && value.operator === 'between'
    && typeof value.start === 'string'
    && typeof value.end === 'string'
  );
}

function isControl(value: unknown): value is StoredGalileoActionControl {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.actionId === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && ['draft', 'active', 'disabled', 'needs_review'].includes(String(value.status))
    && ['pre_tool', 'post_tool'].includes(String(value.timing))
    && ['observe', 'steer', 'deny'].includes(String(value.behavior))
    && ['and', 'or', 'all', 'any'].includes(String(value.matchMode))
    && Array.isArray(value.conditions)
    && value.conditions.every(isCondition)
    && (value.timeWindow === undefined || isTimeWindow(value.timeWindow))
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
    matched: actual !== 'missing' && (
      condition.operator === 'less_than'
        ? actual < condition.value
        : actual > condition.value
    ),
  };
}

function timeValueToMinutes(value: string | Date | undefined): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : (value.getHours() * 60) + value.getMinutes();
  }
  if (!value) return null;
  const normalized = value.trim();
  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    const rawHour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    if (rawHour < 1 || rawHour > 12 || minute < 0 || minute > 59) return null;
    const period = twelveHourMatch[3].toUpperCase();
    const hour = (rawHour % 12) + (period === 'PM' ? 12 : 0);
    return (hour * 60) + minute;
  }
  const twentyFourHourMatch = normalized.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!twentyFourHourMatch) return null;
  return (Number(twentyFourHourMatch[1]) * 60) + Number(twentyFourHourMatch[2]);
}

function formatTimeValue(value: string): string {
  const minutes = timeValueToMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function evaluateTimeWindow(
  timeWindow: GalileoActionControlTimeWindow,
  occurredAt: string | Date | undefined,
): GalileoActionControlTimeWindowEvidence {
  const actualMinutes = timeValueToMinutes(occurredAt);
  const startMinutes = timeValueToMinutes(timeWindow.start);
  const endMinutes = timeValueToMinutes(timeWindow.end);
  const withinWindow = actualMinutes !== null && startMinutes !== null && endMinutes !== null
    && (startMinutes <= endMinutes
      ? actualMinutes >= startMinutes && actualMinutes <= endMinutes
      : actualMinutes >= startMinutes || actualMinutes <= endMinutes);
  return {
    field: timeWindow.field,
    operator: timeWindow.operator,
    expected: { start: timeWindow.start, end: timeWindow.end },
    actual: occurredAt instanceof Date
      ? `${String(occurredAt.getHours()).padStart(2, '0')}:${String(occurredAt.getMinutes()).padStart(2, '0')}`
      : occurredAt ?? 'missing',
    matched: withinWindow,
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
  occurredAt,
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
    const actionInputsMatched = evidence.length > 0 && (
      normalizeMatchMode(control.matchMode) === 'and'
        ? evidence.every(item => item.matched)
        : evidence.some(item => item.matched)
    );
    const timeWindowEvidence = control.timeWindow
      ? evaluateTimeWindow(control.timeWindow, occurredAt)
      : undefined;
    const matched = actionInputsMatched && (timeWindowEvidence?.matched ?? true);
    return { control, evidence, timeWindowEvidence, matched };
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

  const decisions = evaluated.map<GalileoActionControlEvaluationDecision>(({ control, evidence, timeWindowEvidence, matched }) => ({
    controlId: control.id,
    controlTitle: control.name,
    actionId,
    timing: control.timing,
    behavior: control.behavior,
    invoked: true,
    matched,
    evidence,
    timeWindowEvidence,
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
  if (normalized === 'handover') return GALILEO_ACTION_IDS.handover;
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
  const joiner = normalizeMatchMode(control.matchMode) === 'and' ? ' and ' : ' or ';
  const actionInputExpression = control.conditions
    .map(condition => `{{${condition.field}}} ${CONDITION_OPERATOR_LABELS[condition.operator]} ${condition.value}`)
    .join(joiner);
  if (!control.timeWindow) return actionInputExpression;
  return `(${actionInputExpression}) and {{event_time}} is between ${formatTimeValue(control.timeWindow.start)} and ${formatTimeValue(control.timeWindow.end)}`;
}

function GalileoControlExpression({ control }: { control: GalileoActionControl }) {
  if (control.conditions.length === 0) return <>No conditions added</>;
  const joiner = normalizeMatchMode(control.matchMode) === 'and' ? ' and ' : ' or ';

  return (
    <>
      {control.timeWindow ? '(' : null}
      {control.conditions.map((condition, index) => (
        <Fragment key={condition.id}>
          {index > 0 ? joiner : null}
          <code className="galileo-action-control-summary__variable" translate="no">
            {`{{${condition.field}}}`}
          </code>
          {` ${CONDITION_OPERATOR_LABELS[condition.operator]} ${condition.value}`}
        </Fragment>
      ))}
      {control.timeWindow ? (
        <>
          {') and '}
          <code className="galileo-action-control-summary__variable" translate="no">
            {'{{event_time}}'}
          </code>
          {` is between ${formatTimeValue(control.timeWindow.start)} and ${formatTimeValue(control.timeWindow.end)}`}
        </>
      ) : null}
    </>
  );
}

interface GalileoControlSummaryCopy {
  lead: string;
  evaluation: string;
  decisionTitle: string;
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

  if (control.id === HANDOVER_CONTROL_ID) {
    return {
      lead: 'Galileo checks how early the human handover was requested. Requests before turn 5 pause Handover and continue with the AI agent; requests at turn 5 or later continue to Handover.',
      evaluation: `Before ${actionName} runs`,
      decisionTitle: 'Evaluate handover request',
      condition,
      matchedOutcome: 'Pause Handover, continue with the AI agent, and share the estimated human wait time',
      unmatchedOutcome: 'Run Handover and transfer to a human agent',
    };
  }

  if (control.timing === 'post_tool') {
    const matchedOutcome = control.behavior === 'steer'
      ? `Keep the availability result, stop the standard automated path, and continue with ${targetName}`
      : control.behavior === 'deny'
        ? 'Stop the next automated step'
        : 'Record the match and continue';
    return {
      lead: `${actionName} always runs. After it returns, Galileo evaluates the original reservation inputs to choose what happens next.`,
      evaluation: `After ${actionName} returns`,
      decisionTitle: 'Evaluate reservation inputs',
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
    decisionTitle: 'Evaluate reservation inputs',
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
      matchMode: 'or',
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
      matchMode: 'or',
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
      ariaLabel="Recommended agent controls"
    >
      <ModalHeader
        title="Recommended agent controls"
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
    name: 'New agent control',
    description: 'Define when Galileo should intervene before this action runs.',
    status: 'draft',
    timing: 'pre_tool',
    behavior: 'steer',
    matchMode: 'or',
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
  const shouldStartCreation = !initialControl && !state.gatesByActionId[actionId];
  const [draft, setDraft] = useState<GalileoActionControl | null>(
    initialControl
      ? cloneControl(initialControl)
      : shouldStartCreation
        ? createBlankControl(actionId)
        : null,
  );
  const [isEditing, setIsEditing] = useState(shouldStartCreation);
  const [wizardStep, setWizardStep] = useState(0);
  const [advancedConditionOpen, setAdvancedConditionOpen] = useState(false);
  const [gateInterventionAction, setGateInterventionAction] = useState(() => Boolean(
    initialControl?.steerToActionId
    && state.gatesByActionId[initialControl.steerToActionId]?.controlId === initialControl.id
    && state.gatesByActionId[initialControl.steerToActionId]?.enabled,
  ));
  const [error, setError] = useState('');
  const studioRef = useRef<HTMLElement>(null);
  const wizardHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const nextControl = state.controlsByActionId[actionId]?.[0] ?? null;
    const startCreation = !nextControl && !state.gatesByActionId[actionId];
    setContextActionId(actionId);
    setDraft(nextControl
      ? cloneControl(nextControl)
      : startCreation
        ? createBlankControl(actionId)
        : null);
    setIsEditing(startCreation);
    setWizardStep(0);
    setAdvancedConditionOpen(false);
    setGateInterventionAction(Boolean(
      nextControl?.steerToActionId
      && state.gatesByActionId[nextControl.steerToActionId]?.controlId === nextControl.id
      && state.gatesByActionId[nextControl.steerToActionId]?.enabled,
    ));
    setError('');
  }, [actionId]);

  useEffect(() => {
    if (!isEditing) return undefined;
    const frame = window.requestAnimationFrame(() => wizardHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isEditing, wizardStep]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      studioRef.current?.focus();
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
  const actionDescriptions = useMemo(
    () => Object.fromEntries(actions.map(action => [action.id, action.description ?? ''])),
    [actions],
  );
  const contextActionName = actionNames[contextActionId] ?? 'Action';
  const controls = state.controlsByActionId[contextActionId] ?? [];
  const control = controls[0] ?? null;
  const gate = state.gatesByActionId[contextActionId];
  const gateSourceControl = gate
    ? state.controlsByActionId[gate.sourceActionId]?.find(item => item.id === gate.controlId) ?? null
    : null;
  const requestClose = () => onClose();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const beginEdit = (nextControl: GalileoActionControl) => {
    const editableControl = cloneControl(nextControl);
    setDraft(editableControl);
    setGateInterventionAction(Boolean(
      editableControl.steerToActionId
      && state.gatesByActionId[editableControl.steerToActionId]?.controlId === editableControl.id
      && state.gatesByActionId[editableControl.steerToActionId]?.enabled,
    ));
    setWizardStep(0);
    setAdvancedConditionOpen(false);
    setIsEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    if (control) {
      const persistedControl = cloneControl(control);
      setDraft(persistedControl);
      setGateInterventionAction(Boolean(
        persistedControl.steerToActionId
        && state.gatesByActionId[persistedControl.steerToActionId]?.controlId === persistedControl.id
        && state.gatesByActionId[persistedControl.steerToActionId]?.enabled,
      ));
    }
    setIsEditing(false);
    setWizardStep(0);
    setAdvancedConditionOpen(false);
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
    setIsEditing(false);
    setWizardStep(0);
    setAdvancedConditionOpen(false);
    setError('');
  };

  const deleteControl = () => {
    if (!control) return;
    if (!window.confirm(`Delete ${control.name}? This action cannot be undone.`)) return;

    const next = cloneState(state);
    const remainingControls = (next.controlsByActionId[contextActionId] ?? [])
      .filter(item => item.id !== control.id);
    if (remainingControls.length > 0) {
      next.controlsByActionId[contextActionId] = remainingControls;
    } else {
      delete next.controlsByActionId[contextActionId];
    }
    Object.entries(next.gatesByActionId).forEach(([targetActionId, existingGate]) => {
      if (
        existingGate.controlId === control.id
        || existingGate.prerequisiteControlIds.includes(control.id)
      ) {
        delete next.gatesByActionId[targetActionId];
      }
    });

    onChange(next);
    onClose();
  };

  const advanceWizard = () => {
    if (!draft) return;
    if (wizardStep === 0 && !draft.name.trim()) {
      setError('Give this control a clear name before continuing.');
      return;
    }
    if (
      wizardStep === 1
      && (draft.conditions.length === 0 || draft.conditions.some(condition => condition.value <= 0))
    ) {
      setError('Add at least one condition with a value greater than zero before continuing.');
      return;
    }
    setError('');
    setWizardStep(current => Math.min(current + 1, GALILEO_CONTROL_WIZARD_STEPS.length - 1));
  };

  const returnToWizardStep = (nextStep: number) => {
    setError('');
    setWizardStep(Math.max(0, Math.min(nextStep, wizardStep)));
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

  const updateTimeWindow = (patch: Partial<GalileoActionControlTimeWindow>) => {
    setDraft(current => current?.timeWindow ? {
      ...current,
      timeWindow: { ...current.timeWindow, ...patch },
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
  const steerMenuTriggerId = `galileo-steer-menu-trigger-${contextActionId}`;
  const selectedSteerActionName = draft?.steerToActionId
    ? actionNames[draft.steerToActionId] ?? draft.steerToActionId
    : 'Select an action';
  const summaryControl = draft ?? control;
  const summaryCopy = summaryControl
    ? getGalileoControlSummaryCopy(summaryControl, contextActionName, actionNames)
    : null;
  const contextActionDisplayName = contextActionName === 'Check Availability'
    ? 'Check availability'
    : contextActionName;
  const summaryTargetName = summaryControl?.steerToActionId
    ? actionNames[summaryControl.steerToActionId] ?? summaryControl.steerToActionId
    : 'the configured next action';
  const summaryTargetDescription = summaryControl?.steerToActionId
    ? actionDescriptions[summaryControl.steerToActionId] || `Continue with ${summaryTargetName}.`
    : 'Continue with the configured next action.';
  const summaryTargetTooltipId = summaryControl
    ? `galileo-action-target-${summaryControl.id}`
    : 'galileo-action-target';
  const summaryStatusLabel = summaryControl
    ? summaryControl.status === 'needs_review'
      ? 'Needs review'
      : summaryControl.status[0].toUpperCase() + summaryControl.status.slice(1)
    : '';
  const summaryStatusColor = summaryControl?.status === 'active'
    ? 'mint'
    : summaryControl?.status === 'needs_review'
      ? 'orange'
      : 'cobalt';
  const activeWizardStep = GALILEO_CONTROL_WIZARD_STEPS[wizardStep];
  const isCreatingControl = !control;
  const isCreationWizard = isEditing && isCreatingControl;

  return createPortal(
    <div
      className="security-ui-overlay security-ui-overlay--studio galileo-action-control-studio-overlay"
      tabIndex={-1}
    >
      <IconProvider
        className="galileo-action-control-icon-provider"
        iconSet="custom-icons"
        url={publicAssetUrl('icons').replace(/\/$/, '')}
        fileExtension="svg"
      >
      <section
        ref={studioRef}
        className={`security-ui-studio galileo-action-control-studio${isEditing ? ' is-editing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="galileo-action-control-title"
        tabIndex={-1}
        onKeyDown={trapStudioFocus}
      >
        <header className="security-ui-studio-header galileo-action-control-studio__header">
          <div className="galileo-action-control-studio__header-copy">
            <h2 id="galileo-action-control-title">
              {isCreatingControl ? 'Create agent control' : 'Agent control'}: {contextActionDisplayName}
            </h2>
            <p>
              {isCreatingControl
                ? `Configure when Galileo evaluates ${contextActionDisplayName} and what happens next.`
                : `Review how Galileo evaluates ${contextActionDisplayName}.`}
            </p>
          </div>
          <UpliftMomentumButton
            type="button"
            variant="tertiary"
            color="default"
            size={64}
            className="galileo-action-control-studio__close"
            aria-label="Close agent control"
            onClick={requestClose}
          >
            <Icon name="cancel" weight="regular" size={32} />
          </UpliftMomentumButton>
        </header>

        <main
          className={`galileo-action-control-workspace${isCreationWizard ? ' is-wizard' : isEditing ? ' is-editing-inline' : ''}`}
          data-wizard-step={isCreationWizard ? activeWizardStep.id : undefined}
        >
          {contextActionId !== actionId && (
            <UpliftMomentumButton
              type="button"
              variant="tertiary"
              size="sm"
              className="galileo-action-control-back"
              onClick={() => {
                setContextActionId(actionId);
                setDraft(null);
                setError('');
              }}
            >
              <Icon name="arrow-left" weight="bold" size="sm" />
              Back to {actionNames[actionId] ?? 'action'}
            </UpliftMomentumButton>
          )}

          {(!isEditing || !isCreatingControl) && (
          <div className="galileo-action-control-summary">
            {summaryControl && summaryCopy ? (
              <Card className="galileo-action-control-card galileo-action-control-card--overview">
                <CardBody>
                  <div className="galileo-action-control-summary__header">
                    <div className="galileo-action-control-summary__header-copy">
                      <h3>Control summary: {summaryControl.name}</h3>
                      <p className="galileo-action-control-summary__lead">{summaryCopy.lead}</p>
                    </div>
                    <StaticChip color={summaryStatusColor} label={summaryStatusLabel} />
                  </div>
                  <div className="galileo-action-control-summary__content">
                    <div
                      className="galileo-action-control-summary__flow"
                      role="group"
                      aria-label="Control decision flow"
                    >
                      <div className="galileo-action-control-summary__stage galileo-action-control-summary__stage--timing">
                        <span className="galileo-action-control-summary__stage-label">
                          <span className="galileo-action-control-summary__step">1.</span>
                          Evaluation point
                        </span>
                        <div className="galileo-action-control-summary__stage-title">
                          <StaticChip color="default" label={summaryControl.timing === 'post_tool' ? 'Post' : 'Pre'} />
                          <strong>{contextActionDisplayName}</strong>
                        </div>
                      </div>

                      <span className="galileo-action-control-summary__arrow" aria-hidden="true">
                        <Icon name="arrow-right" weight="bold" size="sm" />
                      </span>

                      <div className="galileo-action-control-summary__stage galileo-action-control-summary__stage--decision">
                        <span className="galileo-action-control-summary__stage-label">
                          <span className="galileo-action-control-summary__step">2.</span>
                          Decision
                        </span>
                        <div className="galileo-action-control-summary__decision-body">
                          <strong>{summaryCopy.decisionTitle}</strong>
                          <p><GalileoControlExpression control={summaryControl} /></p>
                        </div>
                      </div>

                      <span className="galileo-action-control-summary__arrow" aria-hidden="true">
                        <Icon name="arrow-right" weight="bold" size="sm" />
                      </span>

                      <div className="galileo-action-control-summary__branches">
                        <div className="galileo-action-control-summary__branch galileo-action-control-summary__branch--matched">
                          <span className="galileo-action-control-summary__branch-label">
                            <span aria-hidden="true" />
                            Matches:
                            <StaticChip
                              color={summaryControl.behavior === 'steer' ? 'lime' : 'default'}
                              iconName="automation-bold"
                              label={BEHAVIOR_LABELS[summaryControl.behavior]}
                            />
                          </span>
                          <div className="galileo-action-control-summary__branch-copy">
                            {summaryControl.timing === 'post_tool' && summaryControl.behavior === 'steer' ? (
                              <>
                                <span>Keep the availability result and continue with</span>
                                <span
                                  id={summaryTargetTooltipId}
                                  className="galileo-action-control-action-chip"
                                  tabIndex={0}
                                >
                                  <StaticChip color="default" label={summaryTargetName} />
                                </span>
                                <MomentumTooltip
                                  triggerID={summaryTargetTooltipId}
                                  trigger="mouseenter focusin"
                                  placement="top"
                                  color="contrast"
                                >
                                  {summaryTargetDescription}
                                </MomentumTooltip>
                              </>
                            ) : summaryCopy.matchedOutcome}
                          </div>
                        </div>
                        <div className="galileo-action-control-summary__branch galileo-action-control-summary__branch--unmatched">
                          <span className="galileo-action-control-summary__branch-label">
                            <span aria-hidden="true" />
                            No match
                          </span>
                          <p>{summaryCopy.unmatchedOutcome}</p>
                        </div>
                      </div>
                    </div>
                    {summaryControl.guidance && (
                      <div className="galileo-action-control-guidance">
                        <Icon name="open-pages" weight="bold" size="sm" />
                        <div>
                          <strong>Agent guidance</strong>
                          <p>{summaryControl.guidance}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <UpliftMomentumButton
                    type="button"
                    variant="tertiary"
                    color="default"
                    size={28}
                    prefixIcon="edit-bold"
                    postfixIcon={isEditing ? 'arrow-up-bold' : 'arrow-down-bold'}
                    className={`galileo-action-control-edit-toggle${isEditing ? ' is-expanded' : ''}`}
                    aria-expanded={isEditing}
                    aria-controls="galileo-action-control-editor"
                    onClick={() => {
                      if (isEditing) cancelEdit();
                      else if (control) beginEdit(control);
                    }}
                  >
                    {isEditing ? 'Close editor' : 'Edit control'}
                  </UpliftMomentumButton>
                </CardBody>
              </Card>
            ) : gate ? (
              <Card className="galileo-action-control-card galileo-action-control-card--gate">
                <CardBody>
                  <div className="galileo-action-control-gate__intro">
                    <div>
                      <span className="galileo-action-control-eyebrow">Action availability</span>
                      <h3>Available after agent control intervenes</h3>
                      <p>This action is available only after its required control matches.</p>
                    </div>
                    <Badge variant={gate.enabled ? 'info' : 'default'}>{gate.enabled ? 'Gated' : 'Gate draft'}</Badge>
                  </div>
                  <div className="galileo-action-control-gate__relationship" aria-label="Action availability prerequisite">
                    <div className="galileo-action-control-gate__node">
                      <span>Source action</span>
                      <StaticChip color="default" label={actionNames[gate.sourceActionId] ?? gate.sourceActionId} />
                    </div>
                    <Icon
                      name="arrow-right"
                      weight="bold"
                      size="sm"
                      className="galileo-action-control-gate__arrow"
                    />
                    <div className="galileo-action-control-gate__node galileo-action-control-gate__node--control">
                      <span>Required control</span>
                      <strong>{gateSourceControl?.name ?? gate.controlId}</strong>
                    </div>
                    <UpliftMomentumButton
                      type="button"
                      variant="primary"
                      color="default"
                      size="sm"
                      className="galileo-action-control-gate__view"
                      onClick={() => {
                        setContextActionId(gate.sourceActionId);
                        if (gateSourceControl) beginEdit(gateSourceControl);
                      }}
                    >
                      View source control
                    </UpliftMomentumButton>
                  </div>
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
          )}

          {draft && isEditing && (
          <>
            {isCreatingControl && (
              <MomentumStepper
                id="galileo-action-control-wizard"
                className="galileo-action-control-wizard__progress"
                orientation="horizontal"
                variant="stacked"
                aria-label="Control setup progress"
              >
                {GALILEO_CONTROL_WIZARD_STEPS.map((step, index) => {
                  const isComplete = index < wizardStep;
                  const isCurrent = index === wizardStep;
                  return (
                    <Fragment key={step.id}>
                      <MomentumStepperItem
                        status={isComplete ? 'completed' : isCurrent ? 'current' : 'not-started'}
                        stepNumber={index + 1}
                        label={step.label}
                        aria-current={isCurrent ? 'step' : undefined}
                        aria-label={isComplete ? `Return to ${step.label}` : `${step.label}, step ${index + 1}`}
                        aria-disabled={!isComplete}
                        tabIndex={isComplete ? 0 : -1}
                        onClick={() => {
                          if (isComplete) returnToWizardStep(index);
                        }}
                      />
                      {index < GALILEO_CONTROL_WIZARD_STEPS.length - 1 && (
                        <MomentumStepperConnector status={index < wizardStep ? 'complete' : 'incomplete'} />
                      )}
                    </Fragment>
                  );
                })}
              </MomentumStepper>
            )}

            <div
              id={isCreatingControl ? undefined : 'galileo-action-control-editor'}
              className={`galileo-action-control-editor${isCreatingControl ? ' galileo-action-control-wizard__body' : ' galileo-action-control-editor--inline'}`}
            >
            <div className="galileo-action-control-editor__heading">
              {isCreatingControl ? (
                <>
                  <h3
                    id="galileo-wizard-step-title"
                    ref={wizardHeadingRef}
                    tabIndex={-1}
                  >
                    {activeWizardStep.title}
                  </h3>
                  <p>{activeWizardStep.description}</p>
                </>
              ) : (
                <>
                  <h3
                    id="galileo-inline-editor-title"
                    ref={wizardHeadingRef}
                    tabIndex={-1}
                  >
                    Edit control
                  </h3>
                  <p>Update the control details, conditions, and behavior, then save your changes.</p>
                </>
              )}
            </div>

            <section
              className="galileo-action-control-editor__section galileo-action-control-editor__section--details"
              aria-labelledby={isCreatingControl ? 'galileo-wizard-step-title' : 'galileo-inline-editor-title'}
              hidden={isCreatingControl && wizardStep === 2}
            >
              {(!isCreatingControl || wizardStep === 0) && (
                <div className="galileo-action-control-wizard__details-fields">
                  <UpliftMomentumInput
                    label="Control name"
                    required
                    value={draft.name}
                    trailingButton
                    clearAriaLabel="Clear control name"
                    onClear={() => setDraft(current => current ? { ...current, name: '' } : current)}
                    onInput={event => setDraft(current => current
                      ? { ...current, name: (event.target as { value: string }).value }
                      : current)}
                  />

                  <UpliftMomentumTextarea
                    label="Control description"
                    value={draft.description}
                    rows={5}
                    className="galileo-action-control-description"
                    helpText="Summarize the business outcome this control protects."
                    onInput={event => setDraft(current => current
                      ? { ...current, description: (event.target as { value: string }).value }
                      : current)}
                  />

                  <div className="galileo-action-control-timing-column">
                    <span className="form-label">Evaluation timing</span>
                    <MomentumRadioGroup
                      name={`galileo-action-control-timing-${contextActionId}`}
                      dataAriaLabel="Evaluation timing"
                      className="galileo-action-control-timing"
                    >
                      {([
                        {
                          value: 'pre_tool',
                          label: TIMING_LABELS.pre_tool,
                          description: `Galileo evaluates the action inputs before ${contextActionDisplayName} runs.`,
                        },
                        {
                          value: 'post_tool',
                          label: TIMING_LABELS.post_tool,
                          description: `Galileo evaluates the original action inputs after ${contextActionDisplayName} returns.`,
                        },
                      ] satisfies Array<{
                        value: GalileoActionControlTiming;
                        label: string;
                        description: string;
                      }>).map(option => (
                        <Fragment key={option.value}>
                          <MomentumRadio
                            value={option.value}
                            label={option.label}
                            checked={draft.timing === option.value}
                            onChange={() => setDraft(current => current
                              ? { ...current, timing: option.value }
                              : current)}
                          />
                          <UpliftMomentumButton
                            id={`galileo-action-control-timing-info-${contextActionId}-${option.value}`}
                            type="button"
                            variant="tertiary"
                            size={24}
                            className="galileo-action-control-timing-info"
                            aria-label={`${option.label}: ${option.description}`}
                          >
                            <Icon name="info-circle" weight="bold" size={16} />
                          </UpliftMomentumButton>
                          <MomentumTooltip
                            triggerID={`galileo-action-control-timing-info-${contextActionId}-${option.value}`}
                            trigger="mouseenter focusin"
                            placement="top"
                            color="contrast"
                          >
                            {option.description}
                          </MomentumTooltip>
                        </Fragment>
                      ))}
                    </MomentumRadioGroup>
                  </div>
                </div>
              )}

              {(!isCreatingControl || wizardStep === 1) && (
                <div
                  className="galileo-action-control-conditions-column"
                  aria-labelledby={isCreatingControl ? 'galileo-conditions-title' : undefined}
                >
                  {isCreatingControl && (
                    <div className="galileo-action-control-editor__section-heading galileo-action-control-editor__section-heading--stacked">
                      <h3 id="galileo-conditions-title">When this happens</h3>
                      <p>Evaluate only the reservation inputs available to this action.</p>
                    </div>
                  )}

                  <div className="galileo-action-control-condition-source">
                    <span>Available variables</span>
                    <div className="galileo-action-control-condition-source__variables">
                      {ACTION_INPUT_VARIABLES.map(variable => (
                        <code key={variable.value} translate="no">{variable.label}</code>
                      ))}
                      <code translate="no">{'{{event_time}}'}</code>
                    </div>
                  </div>

                  <div className="galileo-action-control-condition-list">
                    {draft.conditions.map((condition, index) => (
                      <div key={condition.id} className="galileo-action-control-condition">
                        {index === 0 ? (
                          <span className="galileo-action-control-condition__joiner">When</span>
                        ) : (
                          <button
                            type="button"
                            className="galileo-action-control-condition__joiner galileo-action-control-condition__joiner--toggle"
                            aria-label={`Change condition connector from ${MATCH_MODE_CONNECTOR_LABELS[normalizeMatchMode(draft.matchMode)]} to ${MATCH_MODE_CONNECTOR_LABELS[getNextMatchMode(draft.matchMode)]}`}
                            onClick={() => setDraft(current => current
                              ? { ...current, matchMode: getNextMatchMode(current.matchMode) }
                              : current)}
                          >
                            {MATCH_MODE_CONNECTOR_LABELS[normalizeMatchMode(draft.matchMode)]}
                          </button>
                        )}
                        <UpliftMomentumSelect
                          value={condition.field}
                          label={`Action input ${index + 1}`}
                          className="galileo-action-control-condition__field"
                          onChange={event => updateCondition(condition.id, {
                            field: (event.target as { value: string }).value as GalileoActionControlField,
                          })}
                        >
                          <MomentumSelectlistbox>
                            {ACTION_INPUT_VARIABLES.map(option => (
                              <MomentumOption
                                key={option.value}
                                value={option.value}
                                label={option.label}
                                selected={condition.field === option.value}
                              />
                            ))}
                          </MomentumSelectlistbox>
                        </UpliftMomentumSelect>
                        <span className="galileo-action-control-condition__operator">
                          {CONDITION_OPERATOR_LABELS[condition.operator]}
                        </span>
                        <UpliftMomentumInput
                          type="number"
                          min={1}
                          value={String(condition.value)}
                          dataAriaLabel={`Condition ${index + 1} value`}
                          trailingButton
                          clearAriaLabel={`Clear condition ${index + 1} value`}
                          onClear={() => updateCondition(condition.id, { value: 0 })}
                          onInput={event => updateCondition(condition.id, {
                            value: Number((event.target as { value: string }).value),
                          })}
                        />
                        <UpliftMomentumButton
                          type="button"
                          variant="tertiary"
                          size={24}
                          disabled={draft.conditions.length === 1}
                          aria-label={`Remove condition ${index + 1}`}
                          onClick={() => removeCondition(condition.id)}
                        >
                          <Icon name="delete" weight="bold" size="sm" />
                        </UpliftMomentumButton>
                      </div>
                    ))}
                    {draft.timeWindow && (
                      <div className="galileo-action-control-condition galileo-action-control-condition--time-window">
                        <span className="galileo-action-control-condition__joiner">AND</span>
                        <code className="galileo-action-control-condition__variable" translate="no">
                          {'{{event_time}}'}
                        </code>
                        <span className="galileo-action-control-condition__operator">is between</span>
                        <div className="galileo-action-control-time-window">
                          <UpliftMomentumInput
                            type="time"
                            value={draft.timeWindow.start}
                            dataAriaLabel="Event time window start"
                            onInput={event => updateTimeWindow({
                              start: (event.target as { value: string }).value,
                            })}
                          />
                          <span>to</span>
                          <UpliftMomentumInput
                            type="time"
                            value={draft.timeWindow.end}
                            dataAriaLabel="Event time window end"
                            onInput={event => updateTimeWindow({
                              end: (event.target as { value: string }).value,
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="galileo-action-control-condition-actions">
                    <UpliftMomentumButton type="button" variant="tertiary" size="sm" onClick={addCondition}>
                      <Icon name="plus" weight="bold" size={14} />
                      Add condition
                    </UpliftMomentumButton>
                    <span aria-hidden="true" />
                    <div className="galileo-action-control-advanced">
                      <UpliftMomentumButton
                        type="button"
                        variant="tertiary"
                        size="sm"
                        className="galileo-action-control-advanced-trigger"
                        aria-expanded={advancedConditionOpen ? 'true' : 'false'}
                        aria-controls={`galileo-action-control-advanced-content-${contextActionId}`}
                        onClick={() => setAdvancedConditionOpen(current => !current)}
                      >
                        <Icon name="code-block" weight="bold" size="sm" />
                        Advanced condition
                      </UpliftMomentumButton>
                      {advancedConditionOpen && (
                        <div
                          id={`galileo-action-control-advanced-content-${contextActionId}`}
                          className="galileo-action-control-advanced__content"
                        >
                          <div>
                            <span className="galileo-action-control-advanced__label">Match mode</span>
                            <div className="galileo-action-control-choice-group" role="group" aria-label="Condition matching">
                              {MATCH_MODE_CYCLE.map(matchMode => (
                                <button
                                  key={matchMode}
                                  type="button"
                                  className={draft.matchMode === matchMode ? 'is-selected' : ''}
                                  aria-pressed={draft.matchMode === matchMode}
                                  onClick={() => setDraft(current => current ? { ...current, matchMode } : current)}
                                >
                                  {MATCH_MODE_CONNECTOR_LABELS[matchMode]}
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
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(!isCreatingControl || wizardStep === 1) && (
                <MomentumBanner
                  className="galileo-action-control-rule-preview"
                  variant="informational"
                  label="Rule preview"
                  secondaryLabel={getControlExpressionPreview(draft)}
                  aria-live="polite"
                />
              )}
            </section>

            <section
              className="galileo-action-control-editor__section galileo-action-control-editor__section--behavior galileo-action-control-editor__section--details"
              aria-labelledby={isCreatingControl ? 'galileo-wizard-step-title' : 'galileo-inline-editor-title'}
              hidden={isCreatingControl && wizardStep !== 2}
            >
              {!isCreatingControl && (
                <div className="galileo-action-control-editor__section-heading galileo-action-control-editor__section-heading--stacked">
                  <h3>Control behavior</h3>
                  <p>Choose what Galileo does when the conditions match.</p>
                </div>
              )}

              <div className="galileo-action-control-direction">
                <div className="galileo-action-control-editor__section-heading galileo-action-control-editor__section-heading--stacked">
                  <h3>Control action</h3>
                  <p>Choose what control does when the conditions match.</p>
                </div>
                <MomentumRadioGroup
                  name={`galileo-action-control-behavior-${contextActionId}`}
                  dataAriaLabel="Control action"
                  className="galileo-action-control-behavior"
                >
                  {(['observe', 'steer', 'deny'] as GalileoActionControlBehavior[]).map(behavior => (
                    <MomentumRadio
                      key={behavior}
                      value={behavior}
                      label={BEHAVIOR_LABELS[behavior]}
                      checked={draft.behavior === behavior}
                      onChange={() => setDraft(current => current
                        ? { ...current, behavior }
                        : current)}
                    />
                  ))}
                </MomentumRadioGroup>
              </div>

              <UpliftMomentumTextarea
                label="Agent instruction"
                value={draft.guidance}
                rows={4}
                className="galileo-action-control-guidance-field"
                helpText="Explain what happened, what the agent should tell the customer, and which context to preserve."
                onInput={event => setDraft(current => current
                  ? { ...current, guidance: (event.target as { value: string }).value }
                  : current)}
              />
            </section>

            {(!isCreatingControl || wizardStep === 2) && draft.behavior === 'steer' && (
              <section className="galileo-action-control-editor__section" aria-labelledby="galileo-steer-title">
                <div className="galileo-action-control-editor__section-heading">
                  <div>
                    <h3 id="galileo-steer-title">Safer path</h3>
                    <p>Choose the action Galileo unlocks when this control matches.</p>
                  </div>
                </div>
                <div className="galileo-action-control-steer-field">
                  <span
                    id={`${steerMenuTriggerId}-label`}
                    className="galileo-action-control-steer-field__label"
                  >
                    Steer to action
                  </span>
                  <UpliftMomentumButton
                    id={steerMenuTriggerId}
                    type="button"
                    variant="secondary"
                    color="default"
                    size={40}
                    className="galileo-action-control-steer-trigger"
                    aria-labelledby={`${steerMenuTriggerId}-label ${steerMenuTriggerId}`}
                    postfixIcon="arrow-down-bold"
                  >
                    {selectedSteerActionName}
                  </UpliftMomentumButton>
                  <MomentumMenuPopover
                    triggerID={steerMenuTriggerId}
                    placement="bottom-start"
                    color="tonal"
                    hideOnEscape
                    hideOnOutsideClick
                    focusBackToTrigger
                    interactive
                    className="galileo-action-control-steer-menu"
                  >
                    {availableSteerActions.map(action => (
                      <MomentumMenuItemRadio
                        key={action.id}
                        name={`galileo-steer-target-${contextActionId}`}
                        value={action.id}
                        label={action.name}
                        checked={draft.steerToActionId === action.id}
                        indicator="checkmark"
                        onChange={() => setDraft(current => current
                          ? { ...current, steerToActionId: action.id }
                          : current)}
                      />
                    ))}
                  </MomentumMenuPopover>
                </div>
                <div className="galileo-action-control-gate-setting">
                  <MomentumCheckbox
                    checked={gateInterventionAction}
                    onChange={event => setGateInterventionAction(
                      Boolean((event.target as { checked: boolean }).checked),
                    )}
                    label="Make this action available only after prerequisites match"
                    helpText="Authentication, authorization, and business rules still apply in the action backend."
                  />
                </div>
              </section>
            )}

            {error && (
              <div className="galileo-action-control-error" role="alert">
                <Icon name="error-legacy" weight="bold" size="sm" />
                {error}
              </div>
            )}
            </div>

            {!isCreatingControl && (
              <footer className="galileo-action-control-editor__footer">
                <UpliftMomentumButton
                  type="button"
                  variant="secondary"
                  color="negative"
                  size={40}
                  className="galileo-action-control-delete"
                  onClick={deleteControl}
                >
                  Delete
                </UpliftMomentumButton>
                <UpliftMomentumButton
                  type="button"
                  variant="secondary"
                  color="default"
                  size={40}
                  onClick={cancelEdit}
                >
                  Cancel
                </UpliftMomentumButton>
                <UpliftMomentumButton
                  type="button"
                  variant="primary"
                  color="default"
                  size={40}
                  onClick={() => saveControl('active')}
                >
                  Save changes
                </UpliftMomentumButton>
              </footer>
            )}

            {isCreatingControl && (
              <footer className="galileo-action-control-wizard__footer">
                <div>
                  <UpliftMomentumButton
                    type="button"
                    variant="secondary"
                    color="default"
                    size={40}
                    onClick={requestClose}
                  >
                    Cancel
                  </UpliftMomentumButton>
                  {wizardStep < GALILEO_CONTROL_WIZARD_STEPS.length - 1 ? (
                    <UpliftMomentumButton
                      type="button"
                      variant="primary"
                      color="default"
                      size={40}
                      onClick={advanceWizard}
                    >
                      Next
                    </UpliftMomentumButton>
                  ) : (
                    <UpliftMomentumButton
                      type="button"
                      variant="primary"
                      color="default"
                      size={40}
                      onClick={() => saveControl('active')}
                    >
                      Create control
                    </UpliftMomentumButton>
                  )}
                </div>
              </footer>
            )}
          </>
          )}
        </main>
      </section>
      </IconProvider>
    </div>,
    document.body,
  );
}
