import { useMemo, useState } from 'react';
import {
  CISCO_LIVE_PRIMARY_AGENT_ID,
  getCiscoLiveActionControlDecisions,
  type CiscoLiveActionControlDecisionRecord,
  type CiscoLiveActionControlEvidence,
} from '../../demo/ciscoLiveDemo';
import SharedButton from '../../components/shared/Button';
import { Icon } from '../../icons/Icon';
import type { KPIData } from './kpiTypes';
import './actionControlObservability.css';

export const ACTION_CONTROL_OBSERVABILITY_CATEGORY = 'Agent controls';

export type ActionControlDateRange = '24h' | 'week' | 'month' | '90d' | 'custom';

export interface ActionControlTimeRange {
  dateRange: ActionControlDateRange;
  customDateRange?: {
    from?: Date;
    to?: Date;
  };
  actionValues?: Record<string, unknown>;
}

interface ActionControlTimeWindow {
  startMs: number;
  endMs: number;
}

const SPARKLINE_BUCKET_COUNT = 12;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function isEagleGreenObservabilityAgent(agentName: string | null | undefined): boolean {
  return Boolean(agentName?.trim().toLowerCase().startsWith('eagle green vip reservation'));
}

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] ?? 0;
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function endOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() - 1;
}

function resolveTimeWindow(
  { dateRange, customDateRange }: ActionControlTimeRange,
  now = new Date(),
): ActionControlTimeWindow | null {
  const endMs = now.getTime();

  if (dateRange !== 'custom') {
    const durationMs = dateRange === '24h'
      ? DAY_MS
      : dateRange === 'week'
        ? 7 * DAY_MS
        : dateRange === 'month'
          ? 30 * DAY_MS
          : 90 * DAY_MS;
    return { startMs: endMs - durationMs, endMs };
  }

  const from = customDateRange?.from;
  const to = customDateRange?.to ?? from;
  if (!from || !to) return null;

  const firstDay = startOfLocalDay(from);
  const lastDay = endOfLocalDay(to);
  return firstDay <= lastDay
    ? { startMs: firstDay, endMs: lastDay }
    : { startMs: startOfLocalDay(to), endMs: endOfLocalDay(from) };
}

function decisionTimestampMs(decision: CiscoLiveActionControlDecisionRecord): number {
  // The human-readable timestamp remains available for display. Filtering uses
  // the deterministic ISO timestamp generated with the seeded Session event.
  return Date.parse(decision.occurredAt);
}

function decisionsInTimeRange(
  { actionValues, ...timeRange }: ActionControlTimeRange,
): {
  decisions: CiscoLiveActionControlDecisionRecord[];
  window: ActionControlTimeWindow | null;
} {
  const now = new Date();
  const window = resolveTimeWindow(timeRange, now);
  if (!window) return { decisions: [], window };

  const decisions = getCiscoLiveActionControlDecisions(
    CISCO_LIVE_PRIMARY_AGENT_ID,
    actionValues,
    now,
  ).filter((decision) => {
    const timestampMs = decisionTimestampMs(decision);
    return Number.isFinite(timestampMs)
      && timestampMs >= window.startMs
      && timestampMs <= window.endMs;
  });

  return { decisions, window };
}

function bucketDecisions(
  decisions: CiscoLiveActionControlDecisionRecord[],
  window: ActionControlTimeWindow | null,
): CiscoLiveActionControlDecisionRecord[][] {
  const buckets: CiscoLiveActionControlDecisionRecord[][] = Array.from(
    { length: SPARKLINE_BUCKET_COUNT },
    () => [],
  );
  if (!window) return buckets;

  const durationMs = Math.max(1, window.endMs - window.startMs);
  decisions.forEach((decision) => {
    const timestampMs = decisionTimestampMs(decision);
    if (!Number.isFinite(timestampMs)) return;
    const rawIndex = Math.floor(((timestampMs - window.startMs) / durationMs) * SPARKLINE_BUCKET_COUNT);
    const bucketIndex = Math.max(0, Math.min(SPARKLINE_BUCKET_COUNT - 1, rawIndex));
    buckets[bucketIndex].push(decision);
  });
  return buckets;
}

function metric(
  id: string,
  heading: string,
  description: string,
  value: number,
  history: number[],
  unit = '',
  sparklineKind: KPIData['sparklineKind'] = 'default',
): KPIData {
  return {
    id,
    category: ACTION_CONTROL_OBSERVABILITY_CATEGORY,
    heading,
    description,
    value: String(value),
    unit,
    change: 'Trace derived',
    isPositive: true,
    changeTone: 'neutral',
    thresholdStatus: 'neutral',
    chartType: sparklineKind === 'latency-ms' ? 'line' : 'bar',
    sparklineKind,
    sparklineData: history,
    sparklineType: sparklineKind === 'latency-ms' ? 'line' : 'bar',
  };
}

/** Exact KPI values calculated from the same decision records used by Sessions. */
export function buildEagleActionControlKpis(
  timeRange: ActionControlTimeRange = { dateRange: '24h' },
): KPIData[] {
  const { decisions, window } = decisionsInTimeRange(timeRange);
  const invokedDecisions = decisions.filter(decision => decision.invoked);
  const evaluations = invokedDecisions.length;
  const matched = invokedDecisions.filter(decision => decision.matched).length;
  const matchRate = evaluations > 0 ? Math.round((matched / evaluations) * 100) : 0;
  const steered = invokedDecisions.filter(decision => decision.result === 'steered').length;
  const denied = invokedDecisions.filter(decision => decision.result === 'denied').length;
  const gatedUnlocks = invokedDecisions.filter(decision => decision.unlockedActionIds.length > 0).length;
  const latencyP95 = percentile95(invokedDecisions.map(decision => decision.latencyMs));
  const decisionBuckets = bucketDecisions(decisions, window);
  const invokedBuckets = decisionBuckets.map(bucket => bucket.filter(decision => decision.invoked));
  const evaluationHistory = invokedBuckets.map(bucket => bucket.length);
  const matchRateHistory = invokedBuckets.map((bucket) => {
    if (bucket.length === 0) return 0;
    return Math.round((bucket.filter(decision => decision.matched).length / bucket.length) * 100);
  });
  const steerHistory = invokedBuckets.map(
    bucket => bucket.filter(decision => decision.result === 'steered').length,
  );
  const deniedHistory = invokedBuckets.map(
    bucket => bucket.filter(decision => decision.result === 'denied').length,
  );
  const unlockHistory = invokedBuckets.map(
    bucket => bucket.filter(decision => decision.unlockedActionIds.length > 0).length,
  );
  const latencyHistory = invokedBuckets.map(
    bucket => percentile95(bucket.map(decision => decision.latencyMs)),
  );

  return [
    metric(
      'ac-control-evaluations',
      'Control evaluations',
      'Number of pre-tool and post-tool Galileo control evaluations recorded on action spans. Evaluations include both matched and unmatched decisions.',
      evaluations,
      evaluationHistory,
    ),
    metric(
      'ac-control-match-rate',
      'Match rate',
      'Share of invoked controls whose deterministic conditions matched the captured action inputs.',
      matchRate,
      matchRateHistory,
      '%',
      'percent-100',
    ),
    metric(
      'ac-steer-outcomes',
      'Steer outcomes',
      'Number of matched controls that directed the agent to the configured next step.',
      steered,
      steerHistory,
    ),
    metric(
      'ac-denied-actions',
      'Denied actions',
      'Number of action attempts Galileo prevented from running. Zero is informational and is not scored as good or bad.',
      denied,
      deniedHistory,
    ),
    metric(
      'ac-gated-action-unlocks',
      'Gated action unlocks',
      'Number of control decisions that made a prerequisite-gated action available to the agent.',
      gatedUnlocks,
      unlockHistory,
    ),
    metric(
      'ac-evaluation-latency-p95',
      'Control evaluation latency P95',
      'The 95th percentile time Galileo spent evaluating a control on its attached action span.',
      latencyP95,
      latencyHistory,
      'ms',
      'latency-ms',
    ),
  ];
}

function formatTiming(timing: CiscoLiveActionControlDecisionRecord['timing']): string {
  return timing === 'pre_tool' ? 'Before action runs (pre-tool)' : 'After action returns (post-action)';
}

function formatEvidenceValue(value: CiscoLiveActionControlEvidence['actual']): string {
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'number' ? value.toLocaleString('en-US') : value;
}

function formatOperator(operator: CiscoLiveActionControlEvidence['operator']): string {
  if (operator === 'greater_than') return '>';
  if (operator === 'less_than') return '<';
  if (operator === 'in') return 'is in';
  return '=';
}

function formatEvidence(evidence: CiscoLiveActionControlEvidence): string {
  return `${evidence.field} ${formatEvidenceValue(evidence.actual)} ${formatOperator(evidence.operator)} ${formatEvidenceValue(evidence.expected)}`;
}

function decisionLabel(decision: CiscoLiveActionControlDecisionRecord): string {
  if (!decision.matched) return 'Not matched';
  if (decision.result === 'steered') return 'Steered';
  if (decision.result === 'denied') return 'Denied';
  return 'Observed';
}

function outcomeLabel(decision: CiscoLiveActionControlDecisionRecord): string {
  if (decision.unlockedActionNames.length > 0) {
    return decision.toolExecuted
      ? `${decision.actionName} completed · Continued with ${decision.unlockedActionNames.join(', ')}`
      : `${decision.actionName} skipped · ${decision.unlockedActionNames.join(', ')} unlocked`;
  }
  if (decision.timing === 'post_tool' && decision.toolExecuted) {
    return decision.matched
      ? `${decision.actionName} completed · Next automated step changed`
      : `${decision.actionName} completed · Standard automated path continued`;
  }
  return decision.toolExecuted ? `${decision.actionName} executed` : `${decision.actionName} skipped`;
}

function studioSessionHref(sessionId: string): string {
  return `/agents/${encodeURIComponent(CISCO_LIVE_PRIMARY_AGENT_ID)}/sessions?sessionId=${encodeURIComponent(sessionId)}&source=observability`;
}

export function ActionControlTracePanel({
  dateRange = '24h',
  customDateRange,
  actionValues,
}: Partial<ActionControlTimeRange>) {
  const decisions = useMemo(
    () => decisionsInTimeRange({ dateRange, customDateRange, actionValues }).decisions,
    [dateRange, customDateRange, actionValues],
  );
  const [symptom, setSymptom] = useState<'wrong_parameters' | 'should_not_run'>('wrong_parameters');
  const [desiredBehavior, setDesiredBehavior] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<'draft' | 'capability_gap' | 'missing_input' | null>(null);

  const diagnoseControl = () => {
    const normalized = desiredBehavior.trim().toLowerCase();
    if (!normalized) {
      setDiagnosisResult('missing_input');
      return;
    }

    const usesSupportedReservationInputs = [
      'large event',
      'party size',
      'guest',
      'requested bay',
      'vip team',
      'vip concierge',
    ].some(term => normalized.includes(term));
    setDiagnosisResult(usesSupportedReservationInputs ? 'draft' : 'capability_gap');
  };

  return (
    <section className="action-control-observability" aria-labelledby="action-control-trace-title">
      <header className="action-control-observability__header">
        <div>
          <span className="action-control-observability__eyebrow">Galileo runtime trace</span>
          <h3 id="action-control-trace-title">Agent control decisions</h3>
          <p>
            Deterministic local prototype telemetry—not a live Galileo or Splunk connection.
            Each control is a child span of its attached action; the transcript remains in Studio.
          </p>
        </div>
        <span className="action-control-observability__trace-count">
          {decisions.length} evaluation{decisions.length === 1 ? '' : 's'}
        </span>
      </header>

      {decisions.length > 0 ? (
        <div className="action-control-observability__trace-list">
          {decisions.map(decision => (
            <article
              className={`action-control-observability__trace${decision.matched ? ' is-matched' : ''}`}
              key={`${decision.sessionId}-${decision.controlId}`}
            >
              <div className="action-control-observability__trace-heading">
                <div>
                  <strong>{decision.sessionId}</strong>
                  <span>{decision.timestamp}</span>
                </div>
                <span className={`action-control-observability__decision action-control-observability__decision--${decision.result}`}>
                  {decisionLabel(decision)}
                </span>
              </div>

              <ol className="action-control-observability__span-flow" aria-label={`Trace for ${decision.sessionId}`}>
                <li>
                  <span>Session</span>
                  <strong>{decision.sessionId}</strong>
                </li>
                <li>
                  <span>Action span</span>
                  <strong>{decision.actionName}</strong>
                </li>
                <li className="is-control">
                  <span>Control span · {formatTiming(decision.timing)}</span>
                  <strong>{decision.controlTitle}</strong>
                </li>
                <li>
                  <span>Tool/action outcome</span>
                  <strong>{outcomeLabel(decision)}</strong>
                </li>
              </ol>

              <dl className="action-control-observability__attributes">
                <div><dt>Invoked</dt><dd>True</dd></div>
                <div><dt>Matched</dt><dd>{decision.matched ? 'True' : 'False'}</dd></div>
                <div><dt>Behavior</dt><dd>{decision.behavior[0].toUpperCase() + decision.behavior.slice(1)}</dd></div>
                <div><dt>Tool executed</dt><dd>{decision.toolExecuted ? 'True' : 'False'}</dd></div>
                <div><dt>Latency</dt><dd>{decision.latencyMs} ms</dd></div>
              </dl>

              <div className="action-control-observability__evidence">
                <span>Evaluated input</span>
                <strong>
                  {decision.evidence.length > 0
                    ? decision.evidence.map(formatEvidence).join(' · ')
                    : 'No condition evidence captured'}
                </strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="action-control-observability__empty">No Galileo control evaluations in this time range.</p>
      )}

      <div className="action-control-observability__interactions">
        <div className="action-control-observability__section-heading">
          <div>
            <h4>Control interactions</h4>
            <p>Open the owning Session to review the complete transcript and action sequence.</p>
          </div>
        </div>
        <div className="action-control-observability__table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Session</th>
                <th scope="col">Action</th>
                <th scope="col">Control</th>
                <th scope="col">Timing</th>
                <th scope="col">Match</th>
                <th scope="col">Decision</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(decision => (
                <tr key={`interaction-${decision.sessionId}-${decision.controlId}`}>
                  <td>{decision.timestamp}</td>
                  <td><a href={studioSessionHref(decision.sessionId)}>{decision.sessionId}</a></td>
                  <td>{decision.actionName}</td>
                  <td>{decision.controlTitle}</td>
                  <td>{decision.timing === 'pre_tool' ? 'Pre-tool' : 'Post-tool'}</td>
                  <td>{decision.matched ? 'Matched' : 'Not matched'}</td>
                  <td>{decisionLabel(decision)}</td>
                  <td>{outcomeLabel(decision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="action-control-observability__diagnose">
        <div className="action-control-observability__diagnose-heading">
          <span className="action-control-observability__diagnose-icon" aria-hidden="true">
            <Icon name="automation" weight="bold" size={20} />
          </span>
          <div>
            <h4>Diagnose and propose a control</h4>
            <p>Describe the runtime issue, then review the deterministic Draft before adding it in Action settings.</p>
          </div>
        </div>
        <div className="action-control-observability__diagnose-fields">
          <label>
            <span>What happened?</span>
            <select value={symptom} onChange={event => setSymptom(event.target.value as typeof symptom)}>
              <option value="wrong_parameters">Action used with wrong parameters</option>
              <option value="should_not_run">Action should not have run</option>
            </select>
          </label>
          <label>
            <span>What should the agent do instead?</span>
            <textarea
              rows={3}
              value={desiredBehavior}
              onChange={event => {
                setDesiredBehavior(event.target.value);
                setDiagnosisResult(null);
              }}
              placeholder="For example, after checking availability, transfer large events to the VIP team."
            />
          </label>
          <SharedButton
            type="button"
            size="sm"
            onClick={diagnoseControl}
          >
            Diagnose and propose control
          </SharedButton>
        </div>

        {diagnosisResult === 'draft' ? (
          <div className="action-control-observability__proposal" role="status">
            <div>
              <span>Draft proposal · Needs review</span>
              <strong>Route large event requests to the VIP team</strong>
              <p>
                Attach to <b>Check Availability</b> · After action returns · Steer when
                <code> party_size &gt; 100 </code> or <code>requested_bays &gt; 20</code>.
              </p>
              {desiredBehavior.trim() ? <p className="action-control-observability__proposal-guidance">Guidance: {desiredBehavior.trim()}</p> : null}
            </div>
            <a href={`/agents/${encodeURIComponent(CISCO_LIVE_PRIMARY_AGENT_ID)}/configure?section=Action&actionId=check-bay-availability&controlId=large-event-approval-routing`}>
              Review in Action settings
            </a>
          </div>
        ) : null}

        {diagnosisResult === 'missing_input' ? (
          <p className="action-control-observability__diagnosis-message" role="alert">
            Describe the expected behavior before generating a Draft control.
          </p>
        ) : null}

        {diagnosisResult === 'capability_gap' ? (
          <div className="action-control-observability__capability-gap-result" role="status">
            <strong>Capability gap</strong>
            <p>
              This request cannot be expressed with the current deterministic evaluator. Use an implemented action input
              such as party size or requested bays; an LLM-as-judge control is not available in this prototype.
            </p>
          </div>
        ) : null}

        <p className="action-control-observability__capability-gap">
          Capability boundary: requests that require an LLM judge are shown as unsupported. This proposal uses captured action inputs and a numeric comparison.
        </p>
      </div>
    </section>
  );
}
