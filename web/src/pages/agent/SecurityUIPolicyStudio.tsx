import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Input } from '../../components/shared/FormInput';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import { Icon } from '../../icons';
import type { PolicyStudioResult } from './PolicyStudio';
import atomIcon from '../../assets/Magnetic icons/Atom.svg';
import backIcon from '../../assets/Magnetic icons/Back icon.svg';
import checkCircleIcon from '../../assets/Magnetic icons/CheckCircle.svg';
import clockIcon from '../../assets/Magnetic icons/Clock.svg';
import dropdownCaretDownIcon from '../../assets/Magnetic icons/DropdownCaretDown.svg';
import infoIcon from '../../assets/Magnetic icons/Info.svg';
import lightbulbFilamentIcon from '../../assets/Magnetic icons/LightbulbFilament.svg';
import magnifyingGlassIcon from '../../assets/Magnetic icons/MagnifyingGlass.svg';
import paperclipIcon from '../../assets/Magnetic icons/Paperclip.svg';
import pencilSimpleIcon from '../../assets/Magnetic icons/PencilSimple.svg';
import policyStatusBlockIcon from '../../assets/Magnetic icons/Policy status-block.svg';
import policyStatusCheckIcon from '../../assets/Magnetic icons/Policy status-check.svg';
import securityIcon from '../../assets/Magnetic icons/Security.svg';
import uploadSimpleIcon from '../../assets/Magnetic icons/UploadSimple.svg';
import vectorIcon from '../../assets/Magnetic icons/Vector.svg';
import type { PolicyOverview } from './PolicyStudio';
import { CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL } from '../../demo/ciscoLiveDemo';

export type SecurityUIGuardrailDirection = 'prompt' | 'response' | 'both';
export interface SecurityUIPolicyStudioResult extends PolicyStudioResult {
  direction: SecurityUIGuardrailDirection;
}

interface SecurityUIPolicyStudioProps {
  onClose: () => void;
  onPublish: (result: SecurityUIPolicyStudioResult) => void;
  initialBasicStep?: boolean;
  initialProfileName?: string;
  initialDirection?: SecurityUIGuardrailDirection;
  initialData?: Omit<PolicyStudioResult, 'publishMode'>;
  captureFlowStep?: string;
  captureInline?: boolean;
}

type StudioStage = 'empty' | 'creating' | 'created' | 'upload' | 'thinking' | 'insights' | 'evaluation' | 'source';

const POLICY_OVERVIEW: PolicyOverview = CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.overview;
const PROFILE_DESCRIPTION = CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.description;

const SUGGESTIONS = [
  'Upload policy documents or examples',
  'Analyze for coverage gaps',
  'Evaluate with test samples',
];

const DRAFTING_STEPS = [
  'Reading your guardrail request...',
  'Sketching a simple first rule...',
  'Preparing the draft policy...',
];

const REFINEMENT_STEPS = [
  'Reviewing the uploaded policy...',
  'Finding rules and examples to use...',
  'Updating the policy draft...',
];

const DEFAULT_POLICY_PROMPT = 'Block protected VIP guest, schedule, location, access, security, and reservation details when the requester is not verified or authorized. Allow public event information and task-specific logistics for verified organizers and vendors.';
const DEFAULT_CUSTOM_GUARDRAIL_NAME = 'VIP event confidentiality';
const ASSISTANT_STEP_INTERVAL_MS = 350;
const DRAFT_CREATION_DELAY_MS = 900;
const REFINEMENT_DELAY_MS = 900;

const EMPTY_OVERVIEW: PolicyOverview = {
  blocked: [],
  allowed: [],
  edgeCases: [],
};

function formatPolicyText(data: Omit<PolicyStudioResult, 'publishMode'>) {
  const sections = [
    `# ${data.name}`,
    '',
    'Purpose',
    data.description,
    '',
    'Blocked behaviors',
    ...(data.overview.blocked.length > 0
      ? data.overview.blocked.map(rule => `- ${rule.text}`)
      : ['- Add detection criteria here.']),
    '',
    'Allowed behaviors',
    ...(data.overview.allowed.length > 0
      ? data.overview.allowed.map(rule => `- ${rule.text}`)
      : ['- Add allowed behaviors here.']),
  ];

  if (data.overview.edgeCases.length > 0) {
    sections.push('', 'Edge cases', ...data.overview.edgeCases.map(rule => `- ${rule.text}`));
  }

  return sections.join('\n');
}

function replacePolicyHeading(policyText: string, name: string) {
  if (!policyText.trim()) return policyText;

  const lines = policyText.split(/\r?\n/);
  const headingIndex = lines.findIndex(line => line.trim().startsWith('# '));

  if (headingIndex >= 0) {
    lines[headingIndex] = `# ${name}`;
    return lines.join('\n');
  }

  return [`# ${name}`, '', policyText].join('\n');
}

function parsePolicyText(
  policyText: string,
  fallback: Omit<PolicyStudioResult, 'publishMode'>,
): Omit<PolicyStudioResult, 'publishMode'> {
  const lines = policyText.split(/\r?\n/);
  const nameFromHeading = lines.find(line => line.trim().startsWith('# '))?.replace(/^#\s+/, '').trim();
  const descriptionLines: string[] = [];
  const blocked: string[] = [];
  const allowed: string[] = [];
  const edgeCases: string[] = [];
  let section: 'description' | 'blocked' | 'allowed' | 'edgeCases' | null = null;

  lines.forEach((line) => {
    const text = line.trim();
    if (!text || text.startsWith('# ')) return;

    if (/^(purpose|description)$/i.test(text)) {
      section = 'description';
      return;
    }
    if (/^(detects|blocks|blocked)$/i.test(text)) {
      section = 'blocked';
      return;
    }
    if (/^(allows|allowed)$/i.test(text)) {
      section = 'allowed';
      return;
    }
    if (/^edge cases$/i.test(text)) {
      section = 'edgeCases';
      return;
    }

    const cleaned = text.replace(/^[-*]\s+/, '').trim();
    if (!cleaned) return;

    if (section === 'description') descriptionLines.push(cleaned);
    if (section === 'blocked') blocked.push(cleaned);
    if (section === 'allowed') allowed.push(cleaned);
    if (section === 'edgeCases') edgeCases.push(cleaned);
  });

  return {
    name: nameFromHeading || fallback.name,
    description: descriptionLines.join(' ') || fallback.description,
    overview: {
      blocked: blocked.length > 0 ? blocked.map(text => ({ text })) : fallback.overview.blocked,
      allowed: allowed.length > 0 ? allowed.map(text => ({ text })) : fallback.overview.allowed,
      edgeCases: edgeCases.length > 0 ? edgeCases.map(text => ({ text })) : fallback.overview.edgeCases,
    },
    policyText,
  };
}

const DEFAULT_VIP_EVENT_POLICY: Omit<PolicyStudioResult, 'publishMode'> = {
  name: DEFAULT_CUSTOM_GUARDRAIL_NAME,
  description: PROFILE_DESCRIPTION,
  overview: POLICY_OVERVIEW,
};

const DRAFT_VIP_EVENT_POLICY: Omit<PolicyStudioResult, 'publishMode'> = {
  name: DEFAULT_CUSTOM_GUARDRAIL_NAME,
  description: PROFILE_DESCRIPTION,
  overview: POLICY_OVERVIEW,
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return !el.hasAttribute('hidden') && style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function useDialogFocus(onClose: () => void, focusKey: string, disabled = false) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (disabled) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const siblings = Array.from(document.body.children)
      .filter(el => el !== overlay)
      .map((el) => {
        const htmlEl = el as HTMLElement & { inert?: boolean };
        const previousAriaHidden = htmlEl.getAttribute('aria-hidden');
        const hadAriaHidden = htmlEl.hasAttribute('aria-hidden');
        const previousInert = Boolean(htmlEl.inert);

        htmlEl.setAttribute('aria-hidden', 'true');
        htmlEl.inert = true;

        return { htmlEl, previousAriaHidden, hadAriaHidden, previousInert };
      });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(overlay);
      if (focusable.length === 0) {
        event.preventDefault();
        overlay.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === overlay)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      siblings.forEach(({ htmlEl, previousAriaHidden, hadAriaHidden, previousInert }) => {
        if (hadAriaHidden) htmlEl.setAttribute('aria-hidden', previousAriaHidden ?? '');
        else htmlEl.removeAttribute('aria-hidden');
        htmlEl.inert = previousInert;
      });
      previouslyFocusedRef.current?.focus({ preventScroll: true });
    };
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const frame = window.requestAnimationFrame(() => {
      const preferred = Array.from(overlay.querySelectorAll<HTMLElement>('[data-dialog-initial-focus]'));
      const target = preferred[preferred.length - 1] ?? getFocusableElements(overlay)[0] ?? overlay;
      target.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [disabled, focusKey]);

  return overlayRef;
}

function MagneticIcon({
  src,
  alt = '',
  className = '',
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return <img className={`security-ui-magnetic-icon ${className}`} src={src} alt={alt} aria-hidden={!alt} />;
}

function StudioHeader({
  policyName,
  canPublish,
  onBack,
  onPublish,
  onRename,
}: {
  policyName: string;
  canPublish: boolean;
  onBack: () => void;
  onPublish: () => void;
  onRename: (name: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(policyName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingName) setNameDraft(policyName);
  }, [editingName, policyName]);

  useEffect(() => {
    if (!editingName) return;

    const frame = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus({ preventScroll: true });
      nameInputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingName]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) onRename(trimmed);
    else setNameDraft(policyName);
    setEditingName(false);
  };

  const cancelNameEdit = () => {
    setNameDraft(policyName);
    setEditingName(false);
  };

  return (
    <header className="security-ui-studio-header">
      <div className="security-ui-studio-bar">
        <button className="security-ui-icon-text" onClick={onBack} aria-label="Back to guardrails">
          <MagneticIcon src={backIcon} className="security-ui-magnetic-icon--back" />
          <span>Policy Studio</span>
        </button>
        <span className="security-ui-divider" aria-hidden />
        {editingName ? (
          <input
            ref={nameInputRef}
            className="security-ui-studio-name-input"
            aria-label="Guardrail name"
            value={nameDraft}
            onChange={event => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitName();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelNameEdit();
              }
            }}
          />
        ) : (
          <strong className="security-ui-studio-name">{policyName}</strong>
        )}
        {!editingName && (
          <button
            type="button"
            className="security-ui-ghost-icon"
            aria-label="Rename guardrail"
            onClick={() => setEditingName(true)}
          >
            <MagneticIcon src={pencilSimpleIcon} />
          </button>
        )}
        <span className="security-ui-version">v1 (current)</span>
        <button className="security-ui-history" disabled>
          <MagneticIcon src={clockIcon} />
          View history
        </button>
      </div>
      <button className="security-ui-publish" disabled={!canPublish} onClick={onPublish}>
        <MagneticIcon src={checkCircleIcon} />
        Publish
      </button>
    </header>
  );
}

function ChatMessage({
  sender,
  children,
  muted,
}: {
  sender: 'John' | 'Policy studio';
  children: ReactNode;
  muted?: boolean;
}) {
  const isUser = sender === 'John';
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  return (
    <div className="security-ui-message">
      <div className="security-ui-message-head">
        <span className={`security-ui-avatar${isUser ? ' security-ui-avatar--user' : ''}`}>
          {isUser ? 'J' : <MagneticIcon src={atomIcon} />}
        </span>
        <strong>{sender}</strong>
        <time>{time}</time>
      </div>
      <div className={muted ? 'security-ui-message-muted' : undefined}>{children}</div>
    </div>
  );
}

function PolicySummary({
  data,
  showInsights = false,
}: {
  data: Omit<PolicyStudioResult, 'publishMode'>;
  showInsights?: boolean;
}) {
  const blockedCount = data.overview.blocked.length;
  const allowedCount = data.overview.allowed.length;
  const edgeCount = data.overview.edgeCases.length;

  return (
    <section className="security-ui-policy-details">
      <div className="security-ui-details-head">
        <div className="security-ui-details-copy">
          <h2>Policy details</h2>
          <p>{data.description}</p>
        </div>
        <span className="security-ui-source-summary">All rules shown below</span>
      </div>

      <div className="security-ui-stat-grid">
        <article className="security-ui-stat-card">
          <div><strong>Status</strong><span>v1</span></div>
          <p>This draft includes the blocked, allowed, and edge-case behaviors listed here.</p>
        </article>
        <article className="security-ui-stat-card">
          <div>
            <strong><MagneticIcon src={lightbulbFilamentIcon} />Insights</strong>
            <span className="security-ui-stat-icon"><MagneticIcon src={infoIcon} /></span>
          </div>
          <p>Analyze this guardrail to find missing rules or unclear edge cases.</p>
        </article>
        <article className="security-ui-stat-card">
          <div>
            <strong>Evaluation</strong>
            <span className="security-ui-stat-icon"><MagneticIcon src={infoIcon} /></span>
          </div>
          <p>Not evaluated yet</p>
        </article>
      </div>

      {showInsights ? (
        <InsightsPanel />
      ) : (
        <div className="security-ui-policy-overview">
          <div className="security-ui-overview-header">
            <strong>Policy overview</strong>
            <MagneticIcon src={dropdownCaretDownIcon} className="security-ui-magnetic-icon--caret-up" />
          </div>
          <div className="security-ui-overview-pills">
            <span className="security-ui-pill security-ui-pill--blocked"><MagneticIcon src={policyStatusBlockIcon} />{blockedCount} blocked behavior{blockedCount === 1 ? '' : 's'}</span>
            <span className="security-ui-pill security-ui-pill--allowed"><MagneticIcon src={policyStatusCheckIcon} />{allowedCount} allowed behavior{allowedCount === 1 ? '' : 's'}</span>
            <span className="security-ui-pill security-ui-pill--edge"><MagneticIcon src={magnifyingGlassIcon} />{edgeCount} edge case{edgeCount === 1 ? '' : 's'} defined</span>
          </div>
          <RuleSection title="Blocked behaviors" tone="blocked" items={data.overview.blocked.map(item => item.text)} />
          <RuleSection title="Allowed behaviors" tone="allowed" items={data.overview.allowed.map(item => item.text)} />
          <RuleSection
            title="Edge cases"
            tone="edge"
            items={data.overview.edgeCases.length > 0 ? data.overview.edgeCases.map(item => item.text) : ['No edge cases defined']}
          />
        </div>
      )}
    </section>
  );
}

function InsightsPanel() {
  const insights = [
    {
      severity: 'Critical',
      summary: 'The guardrail covers direct disclosures but does not explicitly address details reconstructed across multiple questions.',
      detail: 'Evaluate related requests across the conversation before allowing a response that could reveal protected guest, schedule, or access details.',
      response: 'Agreed. Treat related questions as one request when they could reconstruct protected event details.',
      verdict: 'Agreed',
    },
    {
      severity: 'Medium',
      summary: 'Verified vendors may need limited logistics, but the current rule does not state how to handle requests beyond their assigned task.',
      detail: 'Allow only the logistics required for the verified vendor’s task and redirect broader requests to the verified organizer.',
      verdict: 'Disagreed',
    },
  ];

  return (
    <section className="security-ui-insights-panel">
      <header>
        <strong><MagneticIcon src={atomIcon} />2 policy insights found</strong>
        <MagneticIcon src={dropdownCaretDownIcon} />
      </header>
      <div className="security-ui-insight-list">
        {insights.map(insight => (
          <article className="security-ui-insight-card" key={insight.severity}>
            <span className="security-ui-insight-severity">{insight.severity}</span>
            <p>{insight.summary}</p>
            <p className="security-ui-insight-detail">Accept this insight to: {insight.detail} <button type="button">See more</button></p>
            {insight.response && <p className="security-ui-insight-response">{insight.response}</p>}
            <div className="security-ui-insight-verdict">
              <span className={insight.verdict === 'Agreed' ? 'is-agreed' : 'is-disagreed'}>
                {insight.verdict === 'Agreed' && <Icon name="chat" weight="bold" size={10} />}
                {insight.verdict}
              </span>
              <button type="button">Change</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReviewInsightsCard() {
  return (
    <section className="security-ui-review-card">
      <button className="security-ui-card-close" type="button" aria-label="Dismiss insights">×</button>
      <strong>Review insights</strong>
      <p>Accept an insight to update the guardrail, or dismiss it without changing the policy.</p>
      <div className="security-ui-review-choices">
        <div><span className="is-agreed">Agreed</span><span>Related questions can reconstruct protected event details</span><button type="button" aria-label="Dismiss insight">×</button></div>
        <div><span className="is-disagreed">Disagreed</span><span>Allow venue details for any vendor with an event reference</span><button type="button" aria-label="Dismiss insight">×</button></div>
      </div>
      <button className="security-ui-rewrite-button" type="button">Update policy with 2 reviewed insights</button>
    </section>
  );
}

function EvaluationSettingsCard() {
  return (
    <section className="security-ui-evaluation-card">
      <button className="security-ui-card-close" type="button" aria-label="Close evaluation settings">×</button>
      <strong>Evaluation settings</strong>
      <p>Policy Studio will test this guardrail against the selected datasets and models. <button type="button">Learn more</button></p>
      <div className="security-ui-evaluation-section">
        <h3>Existing datasets <MagneticIcon src={infoIcon} /></h3>
        {['spectrum:2026-02-03', 'spectrum:2026-02-03', 'spectrum:2026-02-03', 'spectrum:2026-02-03'].map((dataset, index) => (
          <div className="security-ui-dataset-row" key={`${dataset}-${index}`}>
            <span>{dataset}</span>
            <button type="button">{index % 2 === 0 ? 'Exclude' : 'Include'}</button>
          </div>
        ))}
      </div>
      <div className="security-ui-evaluation-section security-ui-import-section">
        <h3>Import samples</h3>
        <p>Upload a CSV file with prompts and expected outcomes for this evaluation.</p>
        <button className="security-ui-upload-link" type="button"><MagneticIcon src={uploadSimpleIcon} />Upload</button>
      </div>
      <div className="security-ui-synthetic-row">
        <button className="security-ui-toggle" type="button" role="switch" aria-checked="false"><span /></button>
        <div>
          <strong>Use synthetic samples (optional) <MagneticIcon src={infoIcon} /></strong>
          <p>Generate additional samples to test this guardrail.</p>
        </div>
      </div>
      <button className="security-ui-run-evaluation" type="button">Run evaluation</button>
    </section>
  );
}

function RuleSection({ title, items, tone }: { title: string; items: string[]; tone: 'blocked' | 'allowed' | 'edge' }) {
  const marker = tone === 'blocked'
    ? policyStatusBlockIcon
    : tone === 'allowed'
      ? policyStatusCheckIcon
      : magnifyingGlassIcon;

  return (
    <section className={`security-ui-rule-section security-ui-rule-section--${tone}`}>
      <h3><MagneticIcon src={marker} />{title}</h3>
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export default function SecurityUIPolicyStudio({
  onClose,
  onPublish,
  initialBasicStep = true,
  initialProfileName = DEFAULT_CUSTOM_GUARDRAIL_NAME,
  initialDirection = 'both',
  initialData,
  captureFlowStep,
  captureInline = false,
}: SecurityUIPolicyStudioProps) {
  const capturePolicyName = initialProfileName || DEFAULT_CUSTOM_GUARDRAIL_NAME;
  const captureDraftPolicyText = formatPolicyText({ ...DRAFT_VIP_EVENT_POLICY, name: capturePolicyName });
  const captureFullPolicyText = formatPolicyText({ ...DEFAULT_VIP_EVENT_POLICY, name: capturePolicyName });
  const captureStudioStep = captureFlowStep && captureFlowStep !== 'basic-info';
  const capturePolicyCreatedStep = ['draft-created', 'refined-policy', 'insights', 'evaluation'].includes(captureFlowStep ?? '');
  const fallbackPolicyData = initialData ?? DEFAULT_VIP_EVENT_POLICY;
  const initialPolicyText = initialData
    ? (initialData.policyText ?? formatPolicyText(initialData))
    : capturePolicyCreatedStep
      ? (captureFlowStep === 'draft-created' ? captureDraftPolicyText : captureFullPolicyText)
      : '';
  const [basicStep, setBasicStep] = useState(captureStudioStep ? false : initialBasicStep);
  const [profileName, setProfileName] = useState(initialData?.name ?? initialProfileName ?? '');
  const [direction, setDirection] = useState<SecurityUIGuardrailDirection>(initialDirection);
  const [stage, setStage] = useState<StudioStage>(() => {
    if (captureFlowStep === 'drafting') return 'creating';
    if (captureFlowStep === 'refining') return 'thinking';
    if (captureFlowStep === 'insights') return 'insights';
    if (captureFlowStep === 'evaluation') return 'evaluation';
    if (capturePolicyCreatedStep) return 'created';
    return initialData ? 'created' : 'empty';
  });
  const [input, setInput] = useState(captureFlowStep === 'studio-empty' ? DEFAULT_POLICY_PROMPT : '');
  const [submittedPrompt, setSubmittedPrompt] = useState(
    captureFlowStep === 'drafting' || captureFlowStep === 'draft-created' ? DEFAULT_POLICY_PROMPT : '',
  );
  const [policyText, setPolicyText] = useState(initialPolicyText);
  const [uploadOpen, setUploadOpen] = useState(captureFlowStep === 'upload-empty' || captureFlowStep === 'upload-selected');
  const [uploadFileSelected, setUploadFileSelected] = useState(captureFlowStep === 'upload-selected');
  const [attachmentSubmitted, setAttachmentSubmitted] = useState(
    captureFlowStep === 'refining' || captureFlowStep === 'refined-policy' || captureFlowStep === 'insights' || captureFlowStep === 'evaluation',
  );
  const [reasoningVisible, setReasoningVisible] = useState(true);
  const [assistantStepIndex, setAssistantStepIndex] = useState(0);
  const overlayRef = useDialogFocus(onClose, `${basicStep}-${stage}-${uploadOpen}`, captureInline || basicStep);

  useEffect(() => {
    if (!basicStep) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [basicStep, onClose]);

  useEffect(() => {
    const isAssistantWorking = stage === 'creating' || stage === 'thinking';
    if (!isAssistantWorking) {
      setAssistantStepIndex(0);
      return;
    }

    setAssistantStepIndex(0);
    const steps = stage === 'thinking' ? REFINEMENT_STEPS : DRAFTING_STEPS;
    const interval = window.setInterval(() => {
      setAssistantStepIndex(current => Math.min(current + 1, steps.length - 1));
    }, ASSISTANT_STEP_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'creating') return;

    const timer = window.setTimeout(() => {
      const generatedName = profileName.trim() || DEFAULT_VIP_EVENT_POLICY.name;
      setPolicyText(formatPolicyText({ ...DEFAULT_VIP_EVENT_POLICY, name: generatedName }));
      setStage('created');
    }, DRAFT_CREATION_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [profileName, stage]);

  useEffect(() => {
    if (stage !== 'thinking') return;

    const timer = window.setTimeout(() => {
      const generatedName = profileName.trim() || DEFAULT_VIP_EVENT_POLICY.name;
      setPolicyText(formatPolicyText({ ...DEFAULT_VIP_EVENT_POLICY, name: generatedName }));
      setStage('created');
    }, REFINEMENT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [profileName, stage]);

  const isCreatingPolicy = stage === 'creating';
  const policyCreated = stage !== 'empty' && stage !== 'thinking' && !isCreatingPolicy;
  const parsedPolicyData = policyCreated
    ? parsePolicyText(policyText, fallbackPolicyData)
    : null;
  const effectiveProfileName = profileName.trim()
    || parsedPolicyData?.name
    || 'Unnamed guardrail';
  const currentPolicyData = policyCreated && parsedPolicyData
    ? {
      ...parsedPolicyData,
      name: effectiveProfileName,
      policyText: replacePolicyHeading(parsedPolicyData.policyText ?? policyText, effectiveProfileName),
    }
    : {
      name: effectiveProfileName,
      description: '',
      overview: EMPTY_OVERVIEW,
      policyText: '',
    };
  const policyName = currentPolicyData.name;
  const assistantSteps = stage === 'thinking' ? REFINEMENT_STEPS : DRAFTING_STEPS;
  const assistantStatus = assistantSteps[Math.min(assistantStepIndex, assistantSteps.length - 1)];

  const renameProfile = (name: string) => {
    setProfileName(name);
    setPolicyText(prev => replacePolicyHeading(prev, name));
  };

  const createPolicy = () => {
    if (stage === 'creating' || stage === 'thinking') return;

    setSubmittedPrompt(input.trim() || DEFAULT_POLICY_PROMPT);
    setInput('');
    setPolicyText('');
    setAttachmentSubmitted(false);
    setStage('creating');
  };

  const publish = () => {
    onPublish({
      name: currentPolicyData.name,
      description: currentPolicyData.description,
      overview: currentPolicyData.overview,
      publishMode: 'new',
      policyText: currentPolicyData.policyText,
      direction,
    });
  };

  const handleSuggestion = (suggestion: string) => {
    if (suggestion.startsWith('Upload')) {
      setUploadFileSelected(false);
      setUploadOpen(true);
      return;
    }
    if (suggestion.startsWith('Analyze')) {
      setStage('insights');
      return;
    }
    setStage('evaluation');
  };

  const modal = (
    <div
      ref={overlayRef}
      className={`security-ui-overlay${basicStep ? ' security-ui-overlay--basic' : ' security-ui-overlay--studio'}`}
      tabIndex={-1}
    >
      {basicStep ? (
        <Modal size="md" onClose={onClose} className="create-guardrail-modal">
          <ModalHeader
            title="Create adaptive guardrail"
            description="Define what this agent must block and where the guardrail evaluates content. You can review and refine the policy in Policy Studio."
            onClose={onClose}
          />
          <ModalBody className="create-guardrail-modal-body">
            <Input
              label="Guardrail name (optional)"
              value={profileName}
              onChange={event => setProfileName(event.target.value)}
              hint="Enter a name, or let Policy Studio use the suggested name."
            />
            <RadioGroup
              name="guardrail-direction"
              label="Guardrail direction"
              required
              value={direction}
              onChange={value => setDirection(value as SecurityUIGuardrailDirection)}
              helperText="Apply this guardrail to customer prompts, agent responses, or both."
            >
              <Radio value="response" label="Responses" />
              <Radio value="prompt" label="Prompts" />
              <Radio value="both" label="Both prompts and responses (Recommended)" />
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => setBasicStep(false)}>Open Policy Studio</Button>
          </ModalFooter>
        </Modal>
      ) : (
        <section className="security-ui-studio" role="dialog" aria-modal="true" aria-label="Policy Studio">
          <StudioHeader
            policyName={policyName}
            canPublish={policyCreated}
            onBack={onClose}
            onPublish={publish}
            onRename={renameProfile}
          />
          <main className="security-ui-workspace">
            <section className="security-ui-chat">
              <header>Policy Studio assistant</header>
              <div className={`security-ui-chat-scroll${stage === 'created' || stage === 'insights' || stage === 'evaluation' ? ' security-ui-chat-scroll--top' : ''}`}>
                {stage === 'empty' ? (
                  <div className="security-ui-get-started">
                    <MagneticIcon src={securityIcon} className="security-ui-shield" />
                    <h2>Create an adaptive guardrail</h2>
                    <p>Describe what the agent must block and what it can share. You can also upload policies or labeled examples.</p>
                    <span>Suggested next steps:</span>
                    <button onClick={() => setInput(DEFAULT_POLICY_PROMPT)}>Describe the protection rules</button>
                    <button onClick={() => {
                      setUploadFileSelected(false);
                      setUploadOpen(true);
                    }}>Upload a policy document</button>
                    <button onClick={() => {
                      setUploadFileSelected(false);
                      setUploadOpen(true);
                    }}>Upload labeled examples</button>
                  </div>
                ) : (
                  <>
                    {stage === 'evaluation' ? (
                      <div className="security-ui-evaluation-response">
                        <p>Test this guardrail with an existing dataset, upload new samples, or generate synthetic samples.</p>
                        <EvaluationSettingsCard />
                      </div>
                    ) : stage === 'insights' ? (
                      <>
                        <ChatMessage sender="Policy studio">
                          <p>Updated policy <strong>{currentPolicyData.name}</strong> (v2)</p>
                          <p>The policy now protects against multi-turn reconstruction and limits vendor access to task-specific logistics.</p>
                          <p>I added one blocked behavior, one allowed behavior, and two edge-case rules.</p>
                          <p>Review the changes, add more examples, or evaluate the policy with test samples.</p>
                        </ChatMessage>
                        <ChatMessage sender="Policy studio">
                          <p><strong>Analysis complete. 2 policy insights found.</strong> Review each insight and choose whether to update the policy.</p>
                        </ChatMessage>
                        <ReviewInsightsCard />
                      </>
                    ) : initialData ? (
                      <ChatMessage sender="Policy studio">
                        <p>Loaded policy <strong>{currentPolicyData.name}</strong> (current version)</p>
                        <p>Review the blocked, allowed, and edge-case behaviors. Publish when the policy is ready.</p>
                      </ChatMessage>
                    ) : (
                      <>
                        {(submittedPrompt || attachmentSubmitted) && (
                          <ChatMessage sender="John">
                            {submittedPrompt && <p>{submittedPrompt}</p>}
                            {attachmentSubmitted && (
                              <div className="security-ui-file-tags">
                                <span><MagneticIcon src={paperclipIcon} />vip-event-confidentiality-policy.pdf</span>
                              </div>
                            )}
                          </ChatMessage>
                        )}
                        {isCreatingPolicy ? (
                          <ChatMessage sender="Policy studio">
                            <div className="security-ui-loading-message" role="status" aria-live="polite">
                              <span className="security-ui-loading-spinner" aria-hidden />
                              <div>
                                <strong>Creating draft</strong>
                                <p>{assistantStatus}</p>
                                <span className="security-ui-loading-dots" aria-hidden>
                                  <i />
                                  <i />
                                  <i />
                                </span>
                              </div>
                            </div>
                          </ChatMessage>
                        ) : stage !== 'thinking' ? (
                          <ChatMessage sender="Policy studio">
                            {attachmentSubmitted ? (
                              <>
                                <p>Created policy <strong>{currentPolicyData.name}</strong> (v1)</p>
                                <p>{currentPolicyData.description}</p>
                                <p>Add authorized-access rules or labeled examples to refine this policy.</p>
                              </>
                            ) : (
                              <>
                                <p>Created policy <strong>{currentPolicyData.name}</strong> (v1)</p>
                                <p>{currentPolicyData.description}</p>
                                <p>Add policy documents or labeled examples to refine the rules.</p>
                                <p>When the draft is ready, analyze it for coverage gaps or evaluate it with test samples.</p>
                              </>
                            )}
                          </ChatMessage>
                        ) : null}
                      </>
                    )}
                    {stage === 'thinking' && (
                      <ChatMessage sender="Policy studio">
                        <div className="security-ui-thinking-head">
                          <strong><MagneticIcon src={atomIcon} />Thinking...</strong>
                          <button
                            type="button"
                            aria-expanded={reasoningVisible}
                            onClick={() => setReasoningVisible(visible => !visible)}
                          >
                            {reasoningVisible ? 'Hide reasoning' : 'Show reasoning'}
                            <MagneticIcon
                              src={dropdownCaretDownIcon}
                              className={reasoningVisible ? 'security-ui-magnetic-icon--caret-up' : undefined}
                            />
                          </button>
                        </div>
                        <p className="security-ui-thinking-status">{assistantStatus}</p>
                        {reasoningVisible && (
                          <>
                            <p><em>Analyzing uploaded files...</em></p>
                            <div className="security-ui-reasoning">
                              <strong>Generating plan</strong>
                              <p><em>Looking for protected disclosures, authorized requests, and unclear access scenarios.</em></p>
                              <ul>
                                <li>Guest attendance or identity confirmation</li>
                                <li>Arrival times, private entrances, and access routes</li>
                                <li>Verified vendor requests beyond the assigned task</li>
                              </ul>
                            </div>
                          </>
                        )}
                      </ChatMessage>
                    )}
                    {!isCreatingPolicy && stage !== 'insights' && stage !== 'evaluation' && (
                      <div className="security-ui-suggestions">
                        <span>Suggested next steps:</span>
                        {SUGGESTIONS.map(suggestion => (
                          <button key={suggestion} onClick={() => handleSuggestion(suggestion)}>{suggestion}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="security-ui-composer">
                <textarea
                  value={input}
                  disabled={stage === 'thinking' || isCreatingPolicy}
                  onChange={event => setInput(event.target.value)}
                  placeholder="Describe what the agent must block or allow"
                />
                <div>
                  <button
                    onClick={() => {
                      setUploadFileSelected(false);
                      setUploadOpen(true);
                    }}
                    aria-label="Attach files"
                  >
                    <MagneticIcon src={paperclipIcon} />
                  </button>
                  <button
                    disabled={stage === 'thinking' || isCreatingPolicy || !input.trim()}
                    onClick={createPolicy}
                    aria-label="Send"
                  >
                    <MagneticIcon src={vectorIcon} />
                  </button>
                </div>
                <small>AI can make mistakes. Verify responses.</small>
              </div>
            </section>
            <section className="security-ui-canvas">
              {policyCreated ? (
                <PolicySummary
                  data={currentPolicyData}
                  showInsights={stage === 'insights'}
                />
              ) : (
                <p>Your guardrail policy will appear here</p>
              )}
            </section>
          </main>
        </section>
      )}

      {uploadOpen && (
        <div className="security-ui-upload-backdrop" role="presentation">
          <section className="security-ui-upload-modal" role="dialog" aria-modal="true" aria-label="Upload files">
            <h2>Upload files</h2>
            <p>Upload policies or labeled examples to create or refine this guardrail.</p>
            <p>Upload up to 4 files, 2 MB each, in .txt, .xlsx, .csv, .md, .json, or .pdf format.</p>
            <button
              className={`security-ui-dropzone${uploadFileSelected ? ' security-ui-dropzone--uploaded' : ''}`}
              onClick={() => setUploadFileSelected(true)}
              data-dialog-initial-focus
              type="button"
            >
              {uploadFileSelected ? (
                <span className="security-ui-dropzone-file">
                  <MagneticIcon src={paperclipIcon} />One attachment: vip-event-confidentiality-policy.pdf
                </span>
              ) : (
                <>
                  <MagneticIcon src={uploadSimpleIcon} />
                  Click or drag a file to this area to upload
                </>
              )}
            </button>
            <footer>
              <button
                className="security-ui-secondary"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadFileSelected(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <div>
                <button className="security-ui-secondary" onClick={() => setUploadFileSelected(true)} type="button">Browse</button>
                <button
                  className="security-ui-primary"
                  disabled={!uploadFileSelected}
                  onClick={() => {
                    setUploadOpen(false);
                    setUploadFileSelected(false);
                    setAttachmentSubmitted(true);
                    setSubmittedPrompt(input.trim());
                    setInput('');
                    setPolicyText('');
                    setReasoningVisible(true);
                    setStage('thinking');
                  }}
                  type="button"
                >
                  Upload
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );

  if (captureInline) return modal;

  return createPortal(modal, document.body);
}
