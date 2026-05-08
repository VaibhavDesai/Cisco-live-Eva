import { useEffect, useState } from 'react';
import SharedButton from '../../../components/shared/Button';
import SharedBadge from '../../../components/shared/Badge';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../components/shared/Modal';
import Tabs, { Tab } from '../../../components/shared/Tabs';
import { Icon as SharedIcon } from '../../../icons/Icon';
import { Badge } from '../momentum';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import type {
  EvaluationMetricScore,
  ScenarioTranscriptMessage,
} from '../simulated-testing-data';

export type ScenarioDetailModalPayload = {
  title: string;
  duration: string;
  status: 'Success' | 'Failed';
  reasons: string[];
  metrics: EvaluationMetricScore[];
  transcript: ScenarioTranscriptMessage[];
};

type ScenarioDetailTabId = 'overview' | 'transcript';

function metricToneClass(score: number): string {
  if (score >= 80) return ck.textSuccess;
  if (score >= 60) return ck.textWarning;
  return ck.textError;
}

function transcriptTimeLabel(msg: ScenarioTranscriptMessage, index: number): string {
  if (msg.timeLabel) return msg.timeLabel;
  const totalSec = index * 2;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** Round avatar beside bubbles — same footprint as before (32×32), KPI interaction icons. */
function TranscriptBubbleAvatar({ role }: { role: 'user' | 'agent' }) {
  const isUser = role === 'user';
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${
        isUser ? ck.bgSubtle : ''
      }`}
      style={
        isUser
          ? undefined
          : { backgroundColor: 'var(--mds-color-theme-background-accent-normal)' }
      }
      aria-hidden
    >
      {isUser ? (
        <SharedIcon name="primary-participant" weight="bold" size={24} className={ck.text} />
      ) : (
        <SharedIcon
          name="bot-customer-assistant"
          weight="bold"
          size={24}
          className={ck.textOnAccent}
        />
      )}
    </div>
  );
}

function MetricLeadingIcon({ score }: { score: number }) {
  if (score >= 60) {
    return (
      <SharedIcon
        name="check-circle"
        weight="bold"
        size={20}
        className={`shrink-0 ${score >= 80 ? ck.textSuccess : ck.textWarning}`}
      />
    );
  }
  return <SharedIcon name="warning" weight="bold" size={20} className={`shrink-0 ${ck.textError}`} />;
}

export interface ScenarioDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, a Back button is shown that returns the user to the previous modal. */
  onBack?: () => void;
  data: ScenarioDetailModalPayload | null;
}

export function ScenarioDetailModal({ open, onClose, onBack, data }: ScenarioDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ScenarioDetailTabId>('overview');
  const [actionMainOpen, setActionMainOpen] = useState(true);
  const [actionValueOpen, setActionValueOpen] = useState(true);
  const [actionErrorOpen, setActionErrorOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    setActiveTab('overview');
    setActionMainOpen(true);
    setActionValueOpen(true);
    setActionErrorOpen(true);
  }, [open]);

  const collapseAllActionSections = () => {
    setActionMainOpen(false);
    setActionValueOpen(false);
    setActionErrorOpen(false);
  };

  if (!open || typeof document === 'undefined' || !data) {
    return null;
  }

  const reasonsHeading = data.status === 'Success' ? 'Success reasons' : 'Failure reasons';

  const useInlineHeader = Boolean(onBack);

  return (
    <Modal
      className={`scenario-detail-dialog${useInlineHeader ? ' scenario-detail-dialog--inline-header' : ''}`}
      size="lg"
      onClose={onClose}
      preventBackdropClose
    >
      {useInlineHeader ? (
        <div className="modal-header">
          <div className="scenario-detail-dialog-inline-header flex min-w-0 items-center gap-3">
            <SharedButton
              variant="tertiary"
              className="scenario-detail-dialog-back-button"
              aria-label="Back to evaluation details"
              onClick={onBack}
            >
              <span className="btn-icon" aria-hidden>
                <SharedIcon name="arrow-left" weight="bold" size={20} />
              </span>
            </SharedButton>
            <div className="min-w-0 flex-1">
              <h2 className={`m-0 ${ck.typo.bodyLargeMedium} ${ck.text}`}>{data.title}</h2>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close scenario details"
          >
            <SharedIcon name="cancel" weight="bold" size={16} />
          </button>
        </div>
      ) : (
        <ModalHeader title={data.title} onClose={onClose} />
      )}

      <ModalBody className="scenario-detail-dialog-body flex min-w-0 flex-col gap-4">

        <div
          className="scenario-detail-dialog-summary-banner"
          role="group"
          aria-label="Scenario duration and status"
        >
          <div
            className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSurface}`}
          >
            <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Duration</p>
            <p className={`m-0 tabular-nums ${ck.typo.sectionTitle} ${ck.text}`}>{data.duration}</p>
          </div>
          <div
            className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSurface}`}
          >
            <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Status</p>
            <div className="shrink-0">
              <SharedBadge variant={data.status === 'Success' ? 'success' : 'error'}>{data.status}</SharedBadge>
            </div>
          </div>
        </div>

        <Tabs
          variant="line"
          aria-label="Scenario detail sections"
          className="scenario-detail-tabs"
        >
          <Tab
            id="scenario-detail-tab-overview"
            aria-controls="scenario-detail-panel-overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Performance overview
          </Tab>
          <Tab
            id="scenario-detail-tab-transcript"
            aria-controls="scenario-detail-panel-transcript"
            active={activeTab === 'transcript'}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </Tab>
        </Tabs>

        {activeTab === 'overview' ? (
          <div
            id="scenario-detail-panel-overview"
            role="tabpanel"
            aria-labelledby="scenario-detail-tab-overview"
            className="flex min-w-0 flex-col gap-6"
          >
            <section
              className={`scenario-detail-reasons-section flex min-w-0 flex-col gap-4 rounded-lg border px-4 py-4 ${ck.borderDefault}`}
              aria-labelledby="scenario-detail-reasons-heading"
            >
              <div className="flex min-w-0 items-center gap-3">
                <SharedIcon
                  name={data.status === 'Success' ? 'check-circle' : 'warning'}
                  weight="bold"
                  size={20}
                  className={`shrink-0 ${data.status === 'Success' ? ck.textSuccess : ck.textError}`}
                />
                <h4 id="scenario-detail-reasons-heading" className={`m-0 ${ck.typo.sectionTitle} ${ck.text}`}>
                  {reasonsHeading}
                </h4>
              </div>
              <div
                className={`flex min-w-0 flex-col gap-3 pl-8 ${ck.typo.bodyMidsizeRegular} ${ck.text}`}
                role="list"
              >
                {data.reasons.map((reason, index) => (
                  <p key={`${index}-${reason.slice(0, 24)}`} className="m-0" role="listitem">
                    {reason}
                  </p>
                ))}
              </div>
            </section>

            <section
              className={`flex min-w-0 flex-col gap-4 rounded-lg border px-4 py-4 ${ck.borderDefault} ${ck.bgSurface}`}
              aria-label="Observability dashboard suggestion"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <h4 className={`m-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>Need more insights?</h4>
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                  Visit the observability dashboard for detailed performance trends and comprehensive analytics
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center">
                <SharedButton
                  variant="secondary"
                  size="sm"
                >
                  <span className="btn-icon" aria-hidden>
                    <SharedIcon name="pop-out" weight="bold" size={16} />
                  </span>
                  Go to observability dashboard
                  <span className="btn-icon" aria-hidden>
                    <SharedIcon name="arrow-right" weight="bold" size={16} />
                  </span>
                </SharedButton>
              </div>
            </section>

            <section
              className={`flex min-w-0 flex-col gap-4 rounded-lg border px-4 py-4 ${ck.borderDefault}`}
              aria-labelledby="scenario-performance-metrics-heading"
            >
              <h4 id="scenario-performance-metrics-heading" className={`m-0 ${ck.typo.sectionTitle} ${ck.text}`}>
                Performance metrics
              </h4>
              <div className="flex min-w-0 flex-col gap-3">
                {data.metrics.map((m) => (
                  <div key={m.label} className="flex min-w-0 items-center justify-between gap-4">
                    <span className="inline-flex min-w-0 items-center gap-3">
                      <MetricLeadingIcon score={m.scorePercent} />
                      <span className={`min-w-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>{m.label}</span>
                    </span>
                    <span
                      className={`shrink-0 tabular-nums ${ck.typo.bodyMidsizeMedium} ${metricToneClass(m.scorePercent)}`}
                    >
                      {m.valueDisplay ?? `${m.scorePercent}%`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /*
           * Single grid: row 1 = both headers side-by-side; row 2 = transcript | action card.
           * `sm:grid-cols-2` ties columns to viewport (not dialog width) but activates sooner than `lg:`.
           */
          <div
            id="scenario-detail-panel-transcript"
            role="tabpanel"
            aria-labelledby="scenario-detail-tab-transcript"
            className={`scenario-detail-transcript-layout grid min-h-[min(360px,50vh)] min-w-0 grid-cols-1 grid-rows-[auto_auto_auto_auto] gap-0 overflow-hidden rounded-xl border sm:min-h-[400px] sm:grid-cols-2 sm:grid-rows-[auto_minmax(0,1fr)] ${ck.borderDefault} ${ck.bgSurface}`}
            aria-label="Transcript and action details"
          >
            <div
              className={`min-w-0 border-b px-5 pb-4 pt-5 sm:border-r ${ck.borderDefault}`}
              aria-labelledby="scenario-transcript-heading"
            >
              <h4
                id="scenario-transcript-heading"
                className={`m-0 text-[20px] font-bold leading-7 ${ck.text}`}
              >
                Conversation transcript
              </h4>
            </div>

            <div
              className={`flex min-w-0 flex-wrap items-center justify-between gap-4 border-b px-5 py-5 ${ck.borderDefault}`}
              aria-labelledby="scenario-action-heading"
            >
              <h4
                id="scenario-action-heading"
                className={`m-0 min-w-0 text-[20px] font-bold leading-7 ${ck.text}`}
              >
                Action performed
              </h4>
              <SharedButton
                color="accent"
                variant="secondary"
                size="sm"
                onClick={collapseAllActionSections}
              >
                Collapse all
                <span className="btn-icon" aria-hidden>
                  <SharedIcon name="arrow-down" weight="bold" size={16} />
                </span>
              </SharedButton>
            </div>

            <div
              className={`min-h-0 min-w-0 overflow-y-auto border-b px-5 pb-5 pt-0 sm:border-b-0 sm:border-r ${ck.borderDefault}`}
              role="log"
              aria-live="polite"
              aria-labelledby="scenario-transcript-heading"
            >
              {data.transcript.length === 0 ? (
                <p className={`m-0 py-4 ${ck.typo.bodyMidsizeRegular} ${ck.textMuted}`}>
                  No transcript messages for this scenario.
                </p>
              ) : (
                data.transcript.map((msg, transcriptIndex) => {
                  const isUser = msg.speaker === 'User';
                  const time = transcriptTimeLabel(msg, transcriptIndex);
                  const bubbleBase = `min-w-0 w-fit max-w-[min(100%,420px)] box-border border px-3 py-2 ${ck.borderDefault}`;
                  const bubbleBg = {
                    backgroundColor: 'var(--mds-color-theme-background-solid-secondary-normal)',
                  } as const;
                  return (
                    <div key={`${transcriptIndex}-${msg.speaker}-${msg.message.slice(0, 32)}`} className="mb-4">
                      <div className={`flex items-end gap-3 ${isUser ? '' : 'justify-end'}`}>
                        {isUser ? <TranscriptBubbleAvatar role="user" /> : null}
                        <div
                          className={`flex min-w-0 max-w-[min(100%,420px)] flex-col gap-2 ${isUser ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={
                              isUser
                                ? `${bubbleBase} rounded-[12px] rounded-tl-none`
                                : `${bubbleBase} rounded-[12px_12px_0px_12px]`
                            }
                            style={bubbleBg}
                          >
                            <p className={`m-0 ${ck.typo.bodyMidsizeRegular} ${ck.text}`}>{msg.message}</p>
                          </div>
                          <span
                            className={`tabular-nums ${ck.typo.bodySmallRegular} ${ck.textMuted} ${isUser ? '' : 'text-right'}`}
                          >
                            {time}
                          </span>
                        </div>
                        {!isUser ? <TranscriptBubbleAvatar role="agent" /> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div
              className="scenario-detail-transcript-action-scroll min-h-0 min-w-0 overflow-y-auto px-4 py-4"
              aria-labelledby="scenario-action-heading"
            >
              {/* Outer collapsible card: booking_agent_transfer */}
              <div className={`overflow-hidden rounded-lg border ${ck.borderDefault} ${ck.bgSurface}`}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${ck.bgSubtle} ${ck.text}`}
                  aria-expanded={actionMainOpen}
                  onClick={() => setActionMainOpen((o) => !o)}
                >
                  <span className={`min-w-0 font-['Menlo','Monaco',monospace] text-[13px] ${ck.text}`}>
                    booking_agent_transfer
                  </span>
                  <SharedIcon
                    name={actionMainOpen ? 'arrow-up' : 'arrow-down'}
                    weight="bold"
                    size={20}
                    className="shrink-0"
                  />
                </button>

                {actionMainOpen ? (
                  <div
                    className={`flex flex-col gap-5 border-t border-solid px-4 py-4 ${ck.borderDefault}`}
                  >
                    {/* Status indicator row */}
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: 'var(--mds-color-theme-text-success-normal)' }}
                        aria-hidden
                      />
                      <span className={`min-w-0 ${ck.typo.bodyMidsizeRegular} ${ck.text}`}>
                        Unknown error code
                      </span>
                    </div>

                    {/* General information */}
                    <div className="min-w-0">
                      <p className={`m-0 font-bold ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                        General information:
                      </p>
                      <div
                        className={`mt-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSubtle}`}
                      >
                        <ul
                          className={`m-0 list-disc pl-5 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}
                        >
                          <li className="my-1">Provider type: Custom</li>
                          <li className="my-1">
                            Transfer condition: Execute this handoff if a customer wants to book a new
                            appointment for a patient after making sure that the hospital has availability
                            at this date and time.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Information to share */}
                    <div className="min-w-0">
                      <p className={`m-0 font-bold ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                        Information to share:
                      </p>
                      <div
                        className={`mt-2 overflow-hidden rounded-lg border ${ck.borderDefault} ${ck.bgSubtle}`}
                      >
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${ck.text}`}
                          aria-expanded={actionValueOpen}
                          onClick={() => setActionValueOpen((o) => !o)}
                        >
                          <span className={ck.typo.bodyMidsizeRegular}>Value:</span>
                          <SharedIcon
                            name={actionValueOpen ? 'arrow-up' : 'arrow-down'}
                            weight="bold"
                            size={20}
                            className="shrink-0"
                          />
                        </button>
                        {actionValueOpen ? (
                          <div
                            className={`border-t border-solid px-0 py-0 ${ck.borderDefault}`}
                            style={{ backgroundColor: 'var(--mds-color-theme-background-solid-primary-normal)' }}
                          >
                            <div className="flex min-w-0 gap-0">
                              <span
                                className={`shrink-0 select-none px-3 py-3 text-right tabular-nums ${ck.typo.bodySmallRegular} ${ck.textMuted}`}
                                style={{ minWidth: '2.5rem' }}
                              >
                                1
                              </span>
                              <pre
                                className={`m-0 min-w-0 flex-1 whitespace-pre-wrap px-3 py-3 font-['Menlo','Monaco',monospace] text-[12px] leading-5 ${ck.text}`}
                              >{`{}`}</pre>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Fulfillment */}
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                        <p className={`m-0 font-bold ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                          Fulfillment:
                        </p>
                        <Badge color="red">Failure (0ms)</Badge>
                      </div>
                      <div
                        className={`mt-2 overflow-hidden rounded-lg border ${ck.borderDefault} ${ck.bgSubtle}`}
                      >
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${ck.text}`}
                          aria-expanded={actionErrorOpen}
                          onClick={() => setActionErrorOpen((o) => !o)}
                        >
                          <span className={ck.typo.bodyMidsizeRegular}>Error details</span>
                          <SharedIcon
                            name={actionErrorOpen ? 'arrow-up' : 'arrow-down'}
                            weight="bold"
                            size={20}
                            className="shrink-0"
                          />
                        </button>
                        {actionErrorOpen ? (
                          <div className={`border-t border-solid px-4 py-3 ${ck.borderDefault}`}>
                            <p className={`m-0 ${ck.typo.bodyMidsizeRegular} ${ck.text}`}>
                              tool call function arguments did not match the json schema
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <SharedButton variant="primary" size="sm" onClick={onClose}>
          Close
        </SharedButton>
      </ModalFooter>
    </Modal>
  );
}
