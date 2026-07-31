/**
 * Phase 1 Observability metric catalog — aligned with `observability-metrics-phase1.csv`.
 * Demo values are synthetic but directionally consistent with illustrative targets.
 */

import type { KpiChartType, KpiThresholdStatus, SparklineKind } from '../kpiTypes';

/** Section order on the Observability dashboard (matches CSV). */
export const KPI_OBSERVABILITY_CATEGORY_ORDER = [
  'Voice usage',
  'Digital usage',
  'Action Performance',
  'AI Quality',
  'Security',
  'Business Impact',
  'Customer Experience',
  'Digital-specific',
  'Knowledge Performance',
  'Voice-specific',
] as const;

/** Right-side Observability section header: projection title + date chip (Voice/Digital usage). */
export type ObservabilitySectionHeaderSupplement = {
  title: string;
  dateLabel: string;
  /** Threshold chrome on projection KPI card (demo). */
  thresholdStatus?: KpiThresholdStatus;
};

/** Stable ids for pin/drag and pinned-bar lookup (not in metric catalog). */
export const OBSERVABILITY_PROJECTION_VOICE_ID = 'obs-projection-voice';
export const OBSERVABILITY_PROJECTION_DIGITAL_ID = 'obs-projection-digital';

export function observabilityProjectionIdForCategory(category: string): string | null {
  if (category === 'Voice usage') return OBSERVABILITY_PROJECTION_VOICE_ID;
  if (category === 'Digital usage') return OBSERVABILITY_PROJECTION_DIGITAL_ID;
  return null;
}

export const KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT: Partial<
  Record<(typeof KPI_OBSERVABILITY_CATEGORY_ORDER)[number], ObservabilitySectionHeaderSupplement>
> = {
  'Voice usage': {
    title: 'Projected voice exhaustion',
    dateLabel: 'Jun 14',
    thresholdStatus: 'good',
  },
  'Digital usage': {
    title: 'Projected message exhaustion',
    dateLabel: 'Jul 02',
    thresholdStatus: 'good',
  },
};

export interface Phase1MetricSeed {
  id: string;
  category: (typeof KPI_OBSERVABILITY_CATEGORY_ORDER)[number];
  /** Card title — unit may appear in parentheses in the CSV; we expose `unit` separately when useful. */
  heading: string;
  /** Shown in KPI card tooltips: define the metric, how it is computed, and how to read changes. */
  description: string;
  value: string;
  unit: string;
  change: string;
  isPositive: boolean;
  chartType: KpiChartType;
  curveType?: 'monotone' | 'linear' | 'step';
  sparklineKind: SparklineKind;
}

/**
 * Converts title-style metric headings to sentence case while preserving acronyms
 * (e.g. AI, CSAT, RAG, PCI) and mixed-case product terms (e.g. AutoCSAT).
 */
export function toSentenceCaseMetricHeading(heading: string): string {
  let seenFirstWord = false;
  return heading.replace(/[A-Za-z]+/g, (word) => {
    if (!seenFirstWord) {
      seenFirstWord = true;
      return word;
    }
    // Lower only simple Title Case words; preserve acronyms/mixed-case identifiers.
    if (/^[A-Z][a-z]+$/.test(word)) {
      return word.toLowerCase();
    }
    return word;
  });
}

export const phase1ObservabilityMetricSeeds: Phase1MetricSeed[] = [
  {
    id: 'us-voice-seconds-consumed',
    category: 'Voice usage',
    heading: 'Voice seconds consumed',
    description:
      'Total voice seconds used in the current period against the allotted budget. Calculated as live, test, and debug seconds combined, divided by the contracted voice allotment. Shown as consumed of total with 17,700s remaining; use the section header projection to see whether the current burn rate will land inside the period.',
    value: '42,300',
    unit: '',
    change: '+12%',
    isPositive: false,
    chartType: 'area',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-voice-seconds-live',
    category: 'Voice usage',
    heading: 'Live voice seconds',
    description:
      'Voice seconds consumed by live production traffic in the current period. Excludes test runs and observability or debug sessions so you can see real customer demand. Use it to size capacity and to understand how much of the budget is supporting paid workloads.',
    value: '31,800',
    unit: 's',
    change: '+8%',
    isPositive: false,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-voice-seconds-test',
    category: 'Voice usage',
    heading: 'Test run voice seconds',
    description:
      'Voice seconds consumed by simulated testing runs in the current period. Helps separate evaluation cost from live traffic so test cycles do not surprise the budget. Spikes typically follow new agent versions, regression suites, or scenario expansions.',
    value: '6,200',
    unit: 's',
    change: '+22%',
    isPositive: false,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-voice-seconds-debug',
    category: 'Voice usage',
    heading: 'Observability and debug voice seconds',
    description:
      'Voice seconds consumed by replay, debug sessions, and observability tooling that re-runs audio for inspection. Useful for understanding how much budget supports investigation work. Sustained high values may indicate ongoing incidents or heavy QA review.',
    value: '4,300',
    unit: 's',
    change: '-5%',
    isPositive: true,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-digital-messages-consumed',
    category: 'Digital usage',
    heading: 'Messages consumed',
    description:
      'Total digital messages used in the current period against the allotted budget. Combines live, test, and debug messages, divided by the contracted message allotment. Shown as consumed of total with 121,600 remaining; use the section header projection to confirm the period will hold.',
    value: '128,400',
    unit: '',
    change: '+9%',
    isPositive: false,
    chartType: 'area',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-digital-messages-live',
    category: 'Digital usage',
    heading: 'Live messages',
    description:
      'Digital messages consumed by live production conversations in the current period. Excludes test and debug traffic so the value reflects real customer activity. Use it for capacity planning and to understand which share of the allotment is supporting paid workloads.',
    value: '92,100',
    unit: '',
    change: '+6%',
    isPositive: false,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-digital-messages-test',
    category: 'Digital usage',
    heading: 'Test run messages',
    description:
      'Digital messages consumed by simulated testing runs in the current period. Separates evaluation cost from live traffic so QA activity does not erode the live budget unnoticed. Spikes typically align with new agent versions or larger scenario suites.',
    value: '24,300',
    unit: '',
    change: '+18%',
    isPositive: false,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'us-digital-messages-debug',
    category: 'Digital usage',
    heading: 'Observability and debug messages',
    description:
      'Digital messages consumed by replay, debug sessions, and observability tooling that re-runs transcripts for inspection. Indicates how much budget supports investigation work. Sustained high values often follow incidents or heavy QA review cycles.',
    value: '12,000',
    unit: '',
    change: '-2%',
    isPositive: true,
    chartType: 'line',
    curveType: 'monotone',
    sparklineKind: 'default',
  },
  {
    id: 'ap-intent-success-rate',
    category: 'Action Performance',
    heading: 'Action/Intent Success Rate',
    description:
      'Measures how often the agent successfully completes an action or intent path after the user’s intent is recognised. Calculated as successful action or intent calls divided by correctly recognised intents for the same period. Use it to spot regressions in routing, policy, or backend fulfilment; drill into the chart to compare intents or actions side by side.',
    value: '97.4',
    unit: '%',
    change: '-0.8%',
    isPositive: false,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-autonomous-action-coverage',
    category: 'Action Performance',
    heading: 'Autonomous Action Coverage',
    description:
      'Shows what share of required work the agent completes without human intervention. Computed as actions the agent took on its own divided by all actions the workflow required. Higher coverage usually means fewer handoffs; drops often indicate missing tools, permissions, or unclear prompts.',
    value: '82',
    unit: '%',
    change: '+2%',
    isPositive: true,
    chartType: 'area',
    curveType: 'linear',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-workflow-completion-rate',
    category: 'Action Performance',
    heading: 'Workflow Completion Rate',
    description:
      'Tracks whether multi-step business processes reach a successful terminal state. It is the number of workflows completed end to end divided by workflows that were started in the window. Pair it with fallback or escalation metrics to see whether failures are early exits or late-stage drops.',
    value: '93%',
    unit: '',
    change: '+1%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-avg-actions-per-conversation',
    category: 'Action Performance',
    heading: 'Average Actions per Conversation',
    description:
      'A density signal for how "busy" each conversation is on the backend. Divide total recorded actions by total conversations in the range. Rising averages can mean richer flows or inefficiency; falling averages can mean containment or skipped steps. Compare with latency and error rates before changing prompts.',
    value: '3.8',
    unit: '',
    change: '-3%',
    isPositive: true,
    chartType: 'histogram',
    sparklineKind: 'default',
  },
  {
    id: 'ap-fallback-rate',
    category: 'Action Performance',
    heading: 'Fallback Rate',
    description:
      'Share of turns where the agent fell back to a safer or generic path instead of the primary skill. Calculated as fallback turns divided by all conversational turns. Spikes often follow knowledge gaps, classifier drift, or tightened guardrails; review transcripts around the change window.',
    value: '5.1%',
    unit: '',
    change: '+0.9%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-fulfilment-success-rate',
    category: 'Action Performance',
    heading: 'Fulfilment Success Rate',
    description:
      'Measures backend reliability once an action is invoked. Count actions whose downstream API response matched the expected contract or business outcome, divided by all fulfilment attempts. It isolates integration health from NLU quality. Use it when latency is fine but customers still see failures.',
    value: '91%',
    unit: '',
    change: '+2%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-fulfilment-latency-p95',
    category: 'Action Performance',
    heading: 'Fulfilment Latency P95',
    description:
      'The 95th percentile round-trip time for fulfilment calls, from request dispatch until a response the agent can use. It highlights tail risk for slow customers even when the median looks healthy. Watch this alongside success rate: long tails with high success may still hurt CSAT.',
    value: '1,850',
    unit: 'ms',
    change: '-8%',
    isPositive: true,
    chartType: 'line-threshold',
    sparklineKind: 'latency-ms',
  },
  {
    id: 'aq-hallucination-rate',
    category: 'AI Quality',
    heading: 'Hallucination Rate',
    description:
      'Estimated share of model answers that assert facts or commitments not supported by evidence or policy. Computed as flagged hallucination events divided by total LLM-generated answers in scope. Use it after prompt, retrieval, or model upgrades; pair with RAG relevance when facts should come from documents.',
    value: '2.1%',
    unit: '',
    change: '+0.3%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-answer-correctness',
    category: 'AI Quality',
    heading: 'Answer Correctness',
    description:
      'Human or golden-set evaluation of factual and procedural accuracy. Expressed as correct labels divided by all labelled answers for the cohort. It complements automated guardrails because it catches subtle wrong guidance; trend drops often precede customer complaints.',
    value: '88%',
    unit: '',
    change: '-3%',
    isPositive: false,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'sec-guardrails-trigger-flag',
    category: 'Security',
    heading: 'Guardrails Trigger Flag',
    description:
      'Portion of conversations where any safety, policy, or compliance guardrail fired at least once. Calculated as flagged conversations divided by total conversations. A low percentage can still matter if triggers cluster on high-value journeys. Segment by intent or channel when investigating.',
    value: '0.05%',
    unit: '',
    change: '+0.03%',
    isPositive: false,
    chartType: 'column',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-goal-completion-rate',
    category: 'AI Quality',
    heading: 'Goal Completion Rate',
    description:
      'Whether the agent finishes the outcomes defined for a session, such as booking, verification, or ticket update. Completed goals divided by goals that were explicitly set or inferred for the conversation. Improving this with stable containment usually indicates a healthier end-to-end experience.',
    value: '86%',
    unit: '',
    change: '+4%',
    isPositive: true,
    chartType: 'area',
    curveType: 'monotone',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-intent-recognition-accuracy',
    category: 'AI Quality',
    heading: 'Intent Recognition Accuracy',
    description:
      'Classifier or NLU quality at the intent level. Correctly predicted intents divided by intents that received a human or offline label. Track it when you change training data, slot models, or languages; misroutes here amplify cost in downstream actions and latency.',
    value: '89%',
    unit: '',
    change: '+1%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-rag-context-relevance',
    category: 'AI Quality',
    heading: 'RAG Context Relevance',
    description:
      'How well retrieved passages support the answer the model produces. Typically scored by annotators or an LLM judge against the user question and ground truth. Higher scores mean fewer “right sounding but wrong” answers; investigate drops together with knowledge staleness and chunking changes.',
    value: '93%',
    unit: '',
    change: '+2%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-instruction-adherence',
    category: 'AI Quality',
    heading: 'Instruction Adherence',
    description:
      'Checks whether the agent follows scripted or policy-mandated steps in order, such as disclosures, confirmations, or verification order. Usually evaluated by an LLM or rules engine over transcripts. High adherence reduces compliance risk; sudden drops may follow prompt edits or tool timeouts.',
    value: '97%',
    unit: '',
    change: '+1%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-context-switch-accuracy',
    category: 'AI Quality',
    heading: 'Context Switch Accuracy',
    description:
      'Quality when users change topic mid-thread. Count correct topic switches divided by all detected switches, often judged by an LLM against the conversation state. Poor accuracy shows up as wrong answers after a pivot even when single-topic performance looks fine.',
    value: '94%',
    unit: '',
    change: '+3%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'aq-multi-intent-accuracy',
    category: 'AI Quality',
    heading: 'Multi-intent Accuracy',
    description:
      'Whether the agent addresses every sub-intent when a user bundles multiple asks in one message. Scored by an LLM or rules over structured intent lists. Missed sub-intents drive repeat contacts; watch this metric after broadening skills or shortening responses.',
    value: '87%',
    unit: '',
    change: '+5%',
    isPositive: true,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'bi-aht-reduction',
    category: 'Business Impact',
    heading: 'AHT Reduction',
    description:
      'Quantifies average handle time saved when AI assists or fully resolves cases. Computed as baseline AHT minus AI-assisted AHT, divided by baseline AHT for the same queue or intent mix. Negative movement can mean harder traffic, staffing gaps, or agent friction with the copilot. Compare with containment and CSAT.',
    value: '9%',
    unit: '',
    change: '-3%',
    isPositive: false,
    chartType: 'area',
    curveType: 'linear',
    sparklineKind: 'percent-100',
  },
  {
    id: 'bi-first-contact-resolution',
    category: 'Business Impact',
    heading: 'First-Contact Resolution',
    description:
      'Share of sessions resolved on the first try without a repeat contact within your configured lookback window for the same issue or intent. Higher FCR usually lowers cost and improves satisfaction. Drops often correlate with knowledge gaps, policy ambiguity, or brittle fulfilment.',
    value: '63%',
    unit: '',
    change: '-5%',
    isPositive: false,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'bi-autocsat-improvement',
    category: 'Business Impact',
    heading: 'AutoCSAT Improvement',
    description:
      'Change in predicted or survey-linked customer satisfaction after automation or model updates. Sourced from AutoCSAT-style models averaged over conversations in the window. Treat it as an early warning alongside human samples. Calibrate when you change channels, languages, or sampling rules.',
    value: '5.2%',
    unit: '',
    change: '+6%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'bi-ai-agent-productivity-voice',
    category: 'Business Impact',
    heading: 'AI Agent productivity (voice)',
    description:
      'Share of voice handle time where the conversation achieved a positive goal completion rate (GCR). Calculated as total minutes in conversations with positive GCR divided by total minutes across conversations, excluding abandoned calls with GCR 0 from the denominator. Higher values suggest the agent is driving productive, goal-aligned talk time rather than empty or drop-off volume.',
    value: '78%',
    unit: '',
    change: '+4%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'bi-ai-agent-productivity-digital',
    category: 'Business Impact',
    heading: 'AI Agent productivity (digital)',
    description:
      'Share of digital message volume tied to conversations with positive GCR. Calculated as total messages in conversations with positive GCR divided by total messages across conversations, excluding abandoned sessions with GCR 0 from the denominator (parallel to the voice definition). Use it to compare digital productivity alongside voice without double-counting zero-outcome traffic.',
    value: '81%',
    unit: '',
    change: '+2%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ap-action-call-ack-latency',
    category: 'Action Performance',
    heading: 'Action call Acknowledgement Latency',
    description:
      'Time from the customer’s last relevant message until the agent signals that an action call has been accepted or started, measured at the 95th percentile across events. It reflects perceived responsiveness on transactional flows. Improve by tightening orchestration, reducing queueing, or prefetching context.',
    value: '1,280',
    unit: 'ms',
    change: '-6%',
    isPositive: true,
    chartType: 'line-threshold',
    sparklineKind: 'latency-ms',
  },
  {
    id: 'ce-negative-sentiment-rate',
    category: 'Customer Experience',
    heading: 'Negative Sentiment Rate',
    description:
      'Share of conversations where recent customer language is classified as negative by an LLM or sentiment model over the last N turns. It is directional, not a legal outcome. Use it to prioritise review queues. Sudden spikes may follow outages, policy changes, or confusing copy.',
    value: '14%',
    unit: '',
    change: '+2%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ce-csat-predictor',
    category: 'Customer Experience',
    heading: 'CSAT Predictor (AutoCSAT)',
    description:
      'Model-estimated customer satisfaction on a 1–5 scale for each conversation, aggregated for the dashboard. It smooths sparse survey data so you can react before formal scores arrive. Validate shifts with sampled human ratings when you change models or channels.',
    value: '3.7',
    unit: '/5',
    change: '-6%',
    isPositive: false,
    chartType: 'line',
    sparklineKind: 'rating-5',
  },
  {
    id: 'ce-politeness-score',
    category: 'Customer Experience',
    heading: 'Politeness Score',
    description:
      'LLM-graded courtesy of the agent’s latest reply against your tone guidelines, on a 1–5 scale. It helps catch abrupt or overly terse responses that still technically answer the question. Pair with empathy match when coaching style or localising content.',
    value: '4.3',
    unit: '/5',
    change: '+3%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'rating-5',
  },
  {
    id: 'ce-empathy-match',
    category: 'Customer Experience',
    heading: 'Empathy Match',
    description:
      'Measures whether the agent’s emotional tone aligns with the customer’s expressed need or stress level, usually via LLM judgement over the latest turns. High scores indicate supportive language; mismatches may appear when scripts are too rigid or agents mirror frustration.',
    value: '91%',
    unit: '',
    change: '+2%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ce-containment-rate',
    category: 'Customer Experience',
    heading: 'Containment Rate',
    description:
      'Percentage of conversations that never transfer to a human or external queue across the selected agents. It is a headline self-service metric: higher containment lowers cost, but monitor quality metrics so containment does not come from dead ends or loops.',
    value: '72%',
    unit: '',
    change: '+4%',
    isPositive: true,
    chartType: 'area',
    curveType: 'linear',
    sparklineKind: 'containment',
  },
  {
    id: 'ce-transfer-escalation-rate',
    category: 'Customer Experience',
    heading: 'Transfer / Escalation Rate',
    description:
      'Conversations that ended in a transfer or escalation divided by all conversations. Use it with containment and AHT to see whether automation is offloading work cleanly or pushing frustration to humans. Segment by intent to find brittle journeys.',
    value: '14%',
    unit: '',
    change: '-1%',
    isPositive: true,
    chartType: 'stacked-bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'ce-avg-turns-to-solve',
    category: 'Customer Experience',
    heading: 'Avg. Turns-to-Solve',
    description:
      'Average number of conversational turns needed to reach resolution. Sum turns across resolved sessions and divide by the number of those sessions. Higher counts can mean unclear prompts, missing data collection, or users struggling with confirmations.',
    value: '4.8',
    unit: '',
    change: '-7%',
    isPositive: true,
    chartType: 'histogram',
    sparklineKind: 'default',
  },
  {
    id: 'dig-avg-response-latency',
    category: 'Digital-specific',
    heading: 'Average Response Latency',
    description:
      '95th percentile latency for assistant turns on digital channels such as web chat or messaging. Measures time from user send to first visible agent response token or message envelope. Use it with fulfilment latency to separate typing delays from backend work.',
    value: '540',
    unit: 'ms',
    change: '+12%',
    isPositive: false,
    chartType: 'line-threshold',
    sparklineKind: 'latency-ms',
  },
  {
    id: 'kp-knowledge-staleness-rate',
    category: 'Knowledge Performance',
    heading: 'Knowledge Staleness Rate',
    description:
      'Share of knowledge-backed queries that hit sources past their freshness SLA or marked deprecated. Calculated as stale-source queries divided by all queries that used the knowledge base. Rising rates often follow publishing process gaps or forgotten articles.',
    value: '4.8%',
    unit: '',
    change: '+1.6%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'kp-rag-context-sufficiency',
    category: 'Knowledge Performance',
    heading: 'RAG Context Sufficiency',
    description:
      'Whether retrieved passages contain enough material to answer without guessing. Often expressed as average precision or sufficiency scores across RAG calls. Low scores drive hallucinations and handoffs even when search returns something. Inspect chunk size and metadata filters.',
    value: '82%',
    unit: '',
    change: '+3%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'kp-missing-content-trigger',
    category: 'Knowledge Performance',
    heading: 'Missing-Content Trigger',
    description:
      'How often the agent had no relevant knowledge chunk for a user question after retrieval and filtering, excluding benign small talk. Count those triggers per day to prioritise authoring gaps. Pair with missing-content transcripts to decide whether to add articles or tune embeddings.',
    value: '38',
    unit: '/ day',
    change: '-4%',
    isPositive: true,
    chartType: 'column',
    sparklineKind: 'default',
  },
  {
    id: 'kp-knowledge-coverage',
    category: 'Knowledge Performance',
    heading: 'Knowledge Coverage',
    description:
      'Portion of queries where retrieval confidence and sufficiency scores both exceed your thresholds, meaning the agent had strong material to answer. Computed as qualifying queries divided by all knowledge-backed queries. Declines can precede spikes in fallback or hallucination.',
    value: '87%',
    unit: '',
    change: '-4%',
    isPositive: false,
    chartType: 'area',
    curveType: 'linear',
    sparklineKind: 'percent-100',
  },
  {
    id: 'kp-knowledge-confidence',
    category: 'Knowledge Performance',
    heading: 'Knowledge Confidence',
    description:
      'Mean confidence score returned by the retrieval layer for the chunks actually used in answers. Higher averages suggest tight alignment between query and documents; drifting averages after index changes may indicate embedding or taxonomy regressions.',
    value: '0.71',
    unit: '',
    change: '+0.02',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'default',
  },
  {
    id: 'sec-adversarial-block-rate',
    category: 'Security',
    heading: 'Adversarial Prompt Detection & Block Rate',
    description:
      'Effectiveness of automated defences against jailbreaks, prompt injection, or probing attacks. Calculated as blocked or contained adversarial prompts divided by attempted attacks in telemetry. Sustained 100% is rare in live traffic. Validate with red-team logs when flatlining.',
    value: '100%',
    unit: '',
    change: '0%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'sec-adversarial-block-count',
    category: 'Security',
    heading: 'Adversarial Prompt Detection & Block Count',
    description:
      'Raw count of adversarial or abusive prompts that were detected and blocked in the window. Useful for capacity planning and incident review when rate alone hides low-volume spikes. Correlate with model or ruleset releases.',
    value: '0',
    unit: '',
    change: '0',
    isPositive: true,
    chartType: 'column',
    sparklineKind: 'default',
  },
  {
    id: 'sec-toxic-content-generation',
    category: 'Security',
    heading: 'Toxic Content Generation',
    description:
      'Share of model outputs flagged by safety classifiers for harassment, hate, self-harm, or other disallowed content. Calculated as flagged outputs divided by total generated answers. Even tiny percentages deserve investigation because customer exposure is high impact.',
    value: '0.04%',
    unit: '',
    change: '+0.02%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'sec-policy-violation-guardrail-block-rate',
    category: 'Security',
    heading: 'Policy Violation / Guardrail Block Rate',
    description:
      'Messages blocked or rewritten because they violated organisational policy, industry rules, or channel-specific guardrails, divided by all messages. Helps separate generic moderation from business-specific controls; trend analysis should include false-positive audits.',
    value: '0.35%',
    unit: '',
    change: '-0.05%',
    isPositive: true,
    chartType: 'column',
    sparklineKind: 'percent-100',
  },
  {
    id: 'sec-pci-leakage',
    category: 'Security',
    heading: 'PCI Leakage',
    description:
      'Incidents where cardholder data appeared in logs, transcripts, or UI without required masking, divided by total payment-related interactions. Target is near zero; any upward movement should trigger immediate forensic review and masking pipeline checks.',
    value: '0.4%',
    unit: '',
    change: '-0.1%',
    isPositive: true,
    chartType: 'line',
    sparklineKind: 'percent-100',
  },
  {
    id: 'vo-client-barge-in-rate',
    category: 'Voice-specific',
    heading: 'Client Barge-in Rate',
    description:
      'Percentage of voice sessions where the customer spoke over the agent or TTS playback, indicating pacing or latency issues. High rates can mean overly long prompts, slow first-byte audio, or users trying to correct misheard intents. Compare with ASR confidence where available.',
    value: '4.5%',
    unit: '',
    change: '+0.2%',
    isPositive: false,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'vo-dtmf-fallback-rate',
    category: 'Voice-specific',
    heading: 'DTMF Fallback Rate',
    description:
      'Share of calls that moved from speech-first capture to keypad (DTMF) entry, usually after repeated recognition failures or user preference. Spikes can signal acoustic or grammar issues; drops may reflect better models or clearer prompts.',
    value: '2.4%',
    unit: '',
    change: '-0.3%',
    isPositive: true,
    chartType: 'bar',
    sparklineKind: 'percent-100',
  },
  {
    id: 'vo-avg-response-latency',
    category: 'Voice-specific',
    heading: 'Average Response Latency',
    description:
      '95th percentile latency for assistant turns on voice calls, from end-of-user speech (or end-of-barge-in window) to first agent audio or streamed text. It captures perceived snappiness on telephony networks; compare with digital latency only after normalising measurement points.',
    value: '520',
    unit: 'ms',
    change: '+9%',
    isPositive: false,
    chartType: 'line-threshold',
    sparklineKind: 'latency-ms',
  },
];
