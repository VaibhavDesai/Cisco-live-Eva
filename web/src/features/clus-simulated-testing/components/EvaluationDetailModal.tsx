import SharedButton from '../../../components/shared/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../components/shared/Modal';
import { Icon as SharedIcon } from '../../../icons/Icon';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import type { EvaluationMetricScore } from '../simulated-testing-data';

export type EvaluationDetailScenarioCard = {
  index: number;
  name: string;
  status: 'Success' | 'Failed' | 'Running';
  metrics: EvaluationMetricScore[];
};

export type EvaluationDetailModalPayload = {
  title: string;
  subtitle: string;
  totalScenarios: number;
  totalDuration: string;
  status: 'Success' | 'Failed' | 'Running';
  aggregatedMetrics: EvaluationMetricScore[];
  scenarioCards: EvaluationDetailScenarioCard[];
};

function scoreToneClass(score: number): string {
  if (score >= 80) return ck.textSuccess;
  if (score >= 60) return ck.textWarning;
  return ck.textError;
}

function evaluationStatusToneClass(status: EvaluationDetailModalPayload['status']): string {
  if (status === 'Success') return ck.textSuccess;
  if (status === 'Failed') return ck.textError;
  return ck.textWarning;
}

function MetricLeadingIcon({ score }: { score: number }) {
  if (score >= 80) {
    return <SharedIcon name="check-circle" weight="bold" size={20} className={`shrink-0 ${ck.textSuccess}`} />;
  }
  if (score >= 60) {
    return <SharedIcon name="check-circle" weight="bold" size={20} className={`shrink-0 ${ck.textWarning}`} />;
  }
  return <SharedIcon name="warning" weight="bold" size={20} className={`shrink-0 ${ck.textError}`} />;
}

function MetricRow({
  label,
  scorePercent,
  valueDisplay,
  variant = 'card',
}: EvaluationMetricScore & { variant?: 'card' | 'plain' }) {
  const valueText = valueDisplay ?? `${scorePercent}%`;
  const surface =
    variant === 'plain'
      ? `flex min-w-0 items-center justify-between gap-4`
      : `flex min-w-0 items-center justify-between gap-4 rounded-md border px-3 py-3 ${ck.borderDefault} ${ck.bgSubtle}`;
  return (
    <div className={surface}>
      <span className="inline-flex min-w-0 items-center gap-3">
        <MetricLeadingIcon score={scorePercent} />
        <span className={`min-w-0 ${ck.typo.bodyMidsizeRegular} ${ck.text}`}>{label}</span>
      </span>
      <span className={`shrink-0 tabular-nums ${ck.typo.bodyMidsizeMedium} ${scoreToneClass(scorePercent)}`}>
        {valueText}
      </span>
    </div>
  );
}

export interface EvaluationDetailModalProps {
  open: boolean;
  onClose: () => void;
  data: EvaluationDetailModalPayload | null;
  /**
   * When provided, the per-scenario "Scenario #N" labels become clickable (accent link style)
   * and open the scenario detail modal at the given 1-based card index.
   */
  onScenarioOpen?: (cardIndex: number) => void;
}

export function EvaluationDetailModal({ open, onClose, data, onScenarioOpen }: EvaluationDetailModalProps) {
  if (!open || typeof document === 'undefined' || !data) {
    return null;
  }

  return (
    <Modal
      className="evaluation-detail-dialog"
      size="lg"
      onClose={onClose}
      preventBackdropClose
    >
      <ModalHeader title={data.title} description={data.subtitle} onClose={onClose} />
      <ModalBody className="evaluation-detail-dialog-body flex min-w-0 flex-col gap-4">
        <div
          className="evaluation-detail-dialog-summary"
          role="group"
          aria-label="Evaluation summary"
        >
          <div
            className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSurface}`}
          >
            <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Total scenarios</p>
            <p className={`m-0 tabular-nums ${ck.typo.sectionTitle} ${ck.text}`}>{data.totalScenarios}</p>
          </div>
          <div
            className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSurface}`}
          >
            <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Total duration</p>
            <p className={`m-0 max-w-full truncate whitespace-nowrap tabular-nums ${ck.typo.sectionTitle} ${ck.text}`}>
              {data.totalDuration}
            </p>
          </div>
          <div
            className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border px-4 py-3 ${ck.borderDefault} ${ck.bgSurface}`}
          >
            <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Status</p>
            <p className={`m-0 ${ck.typo.sectionTitle} ${evaluationStatusToneClass(data.status)}`}>{data.status}</p>
          </div>
        </div>

        <section className="min-w-0">
          <h4 className={`m-0 ${ck.typo.sectionTitle} ${ck.text}`}>Aggregated performance metrics</h4>
          <p className={`m-0 mt-2 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
            Workflow completion, answer correctness, and RAG sufficiency from the observability catalog — aggregated across scenarios in this evaluation run.
          </p>
          <div
            className={`evaluation-detail-dialog-aggregated-metrics-surface mt-4 min-w-0 rounded-lg border px-5 ${ck.borderDefault}`}
            role="group"
            aria-label="Aggregated metric scores"
          >
            <div className="flex min-w-0 flex-col gap-4">
              {data.aggregatedMetrics.map((m) => (
                <MetricRow
                  key={m.label}
                  variant="plain"
                  label={m.label}
                  scorePercent={m.scorePercent}
                  valueDisplay={m.valueDisplay}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <h4 className={`m-0 ${ck.typo.sectionTitle} ${ck.text}`}>Scenario breakdown</h4>
          <div className="mt-2 flex min-w-0 flex-col gap-4">
            {data.scenarioCards.map((card) => (
              <div
                key={card.index}
                className={`evaluation-detail-dialog-aggregated-metrics-surface min-w-0 rounded-lg border px-5 ${ck.borderDefault}`}
                role="group"
                aria-label={`Scenario ${card.index}: ${card.name}`}
              >
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className={`min-w-0 ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>{card.name}</span>
                    {onScenarioOpen ? (
                      <button
                        type="button"
                        onClick={() => onScenarioOpen(card.index)}
                        className="clus-kpi-eval-id-link shrink-0 cursor-pointer p-0 text-left font-['Inter',sans-serif] text-xs font-medium"
                        aria-label={`Open scenario ${card.index} — ${card.name}`}
                      >
                        Scenario #{card.index}
                      </button>
                    ) : (
                      <span
                        className={`shrink-0 font-['Inter',sans-serif] text-xs font-medium ${ck.textAccent}`}
                      >
                        Scenario #{card.index}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-4">
                    {card.metrics.map((m) => (
                      <MetricRow
                        key={m.label}
                        variant="plain"
                        label={m.label}
                        scorePercent={m.scorePercent}
                        valueDisplay={m.valueDisplay}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ModalBody>
      <ModalFooter>
        <SharedButton variant="primary" size="sm" onClick={onClose}>
          Close
        </SharedButton>
      </ModalFooter>
    </Modal>
  );
}
