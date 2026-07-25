import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Input, FormHint } from '../../components/shared/FormInput';
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

interface SecurityUIPolicyStudioProps {
  onClose: () => void;
  onPublish: (result: PolicyStudioResult) => void;
  initialBasicStep?: boolean;
  initialProfileName?: string;
  initialData?: Omit<PolicyStudioResult, 'publishMode'>;
  captureFlowStep?: string;
  captureInline?: boolean;
}

type StudioStage = 'empty' | 'creating' | 'created' | 'upload' | 'thinking' | 'insights' | 'evaluation' | 'source';

const POLICY_OVERVIEW = {
  blocked: [
    { text: 'Providing medical, clinical, or prescription advice.' },
    { text: 'Diagnosing medical conditions.' },
    { text: 'Recommending medications, dosages, or treatment plans.' },
    { text: 'Advising users to start, stop, or change medications or treatments.' },
    { text: 'Interpreting symptoms as evidence of a specific condition.' },
    { text: 'Comparing prescription options for an individual user.' },
    { text: 'Suggesting that professional medical care is unnecessary.' },
    { text: 'Providing instructions that conflict with a clinician’s guidance.' },
    { text: 'Presenting emergency medical guidance as a substitute for emergency services.' },
  ],
  allowed: [
    { text: 'General health and wellness information in non-diagnostic terms.' },
    { text: 'High-level educational content from reputable public health sources.' },
    { text: 'Encouraging healthy habits (e.g. sleep, hydration, exercise).' },
    { text: 'Referring users to licensed healthcare professionals or pharmacists.' },
    { text: 'Helping users schedule, change, or cancel an appointment.' },
    { text: 'Explaining how to prepare for a scheduled appointment.' },
    { text: 'Sharing published clinic hours, locations, and contact information.' },
    { text: 'Providing neutral definitions of common medical terminology.' },
    { text: 'Directing users to approved patient education resources.' },
  ],
  edgeCases: [
    { text: 'If the situation appears urgent or life-threatening, advise contacting emergency services immediately or escalate to an agent.' },
    { text: 'If a user asks about a prescribed medication, provide neutral label information and refer them to a clinician or pharmacist.' },
    { text: 'If a request mixes scheduling with medical advice, complete only the scheduling portion and redirect the advice request.' },
    { text: 'If intent is ambiguous, ask a clarifying question before deciding whether to block or allow the response.' },
  ],
};

const PROFILE_DESCRIPTION = 'Defines and restricts medical, clinical, and prescription-related guidance. Clarifies what content should be blocked, allowed, or treated as an edge case to ensure the AI assistant does not provide medical advice.';

const SUGGESTIONS = [
  'Upload samples or documents to refine policy',
  'Analyze policy to identify improvement opportunities',
  'Evaluate policy efficiency',
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

const DEFAULT_POLICY_PROMPT = 'Block medical advice, diagnoses, and medication guidance. Allow scheduling, wellness info, and clinician referrals.';
const DEFAULT_CUSTOM_GUARDRAIL_NAME = 'Medical & Prescription Safety Policy';
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
    'Detects',
    ...(data.overview.blocked.length > 0
      ? data.overview.blocked.map(rule => `- ${rule.text}`)
      : ['- Add detection criteria here.']),
    '',
    'Allows',
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
    if (/^detects$/i.test(text)) {
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

const DEFAULT_MEDICAL_POLICY: Omit<PolicyStudioResult, 'publishMode'> = {
  name: 'Medical & Prescription Safety Policy',
  description: PROFILE_DESCRIPTION,
  overview: POLICY_OVERVIEW,
};

const DRAFT_MEDICAL_POLICY: Omit<PolicyStudioResult, 'publishMode'> = {
  name: 'Medical & Prescription Safety Policy',
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
            aria-label="Policy profile name"
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
            aria-label="Rename profile"
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
        <span className="security-ui-source-link">View source text</span>
      </div>

      <div className="security-ui-stat-grid">
        <article className="security-ui-stat-card">
          <div><strong>Status</strong><span>v1</span></div>
          <p>The profile now covers discovered patterns and improved general detection based on your insights verdicts</p>
        </article>
        <article className="security-ui-stat-card">
          <div>
            <strong><MagneticIcon src={lightbulbFilamentIcon} />Insights</strong>
            <span className="security-ui-stat-icon"><MagneticIcon src={infoIcon} /></span>
          </div>
          <p>Analyze your profile to discover patterns and get actionable insights.</p>
        </article>
        <article className="security-ui-stat-card">
          <div>
            <strong>Evaluation</strong>
            <span className="security-ui-stat-icon"><MagneticIcon src={infoIcon} /></span>
          </div>
          <p>Policy not evaluated</p>
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
            <span className="security-ui-pill security-ui-pill--blocked"><MagneticIcon src={policyStatusBlockIcon} />{blockedCount} blocked behaviour{blockedCount === 1 ? '' : 's'}</span>
            <span className="security-ui-pill security-ui-pill--allowed"><MagneticIcon src={policyStatusCheckIcon} />{allowedCount} allowed behaviour{allowedCount === 1 ? '' : 's'}</span>
            <span className="security-ui-pill security-ui-pill--edge"><MagneticIcon src={magnifyingGlassIcon} />{edgeCount} edge case{edgeCount === 1 ? '' : 's'} defined</span>
          </div>
          <RuleSection title="Blocked behaviours" tone="blocked" items={data.overview.blocked.map(item => item.text)} />
          <RuleSection title="Allows" tone="allowed" items={data.overview.allowed.map(item => item.text)} />
          <RuleSection
            title="Edge cases"
            tone="edge"
          items={data.overview.edgeCases.length > 0 ? data.overview.edgeCases.slice(0, 3).map(item => item.text) : ['No edge cases defined']}
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
      summary: 'Policies with no conditional rules for edge cases often lead to more “needs review” classifications, as the system lacks guidance for ambiguous scenarios.',
      detail: 'Add conditional rules for common ambiguous patterns, such as hypothetical scenarios, comparative questions, mixed-intent multi-step requests, and educational framing used to seek actionable advice.',
      response: 'Agreed, but please consider educational framing and other ambiguous medical-advice edge cases.',
      verdict: 'Agreed',
    },
    {
      severity: 'Medium',
      summary: 'The policy defines only 3 conditional rules (edge cases). Policies with fewer edge case definitions tend to produce more “needs review” classifications during evaluation.',
      detail: 'Add conditional rules for common ambiguous patterns such as hypothetical scenarios, comparative questions, multi-step requests that mix allowed and flagged intents, and requests that use educational framing to seek actionable advice.',
      verdict: 'Disagreed',
    },
  ];

  return (
    <section className="security-ui-insights-panel">
      <header>
        <strong><MagneticIcon src={atomIcon} />2 Policy insights discovered</strong>
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
      <p>Agree or disagree to refine your profile and better align it with your intent. Choose dismiss to ignore the insight without making any changes.</p>
      <div className="security-ui-review-choices">
        <div><span className="is-agreed">Agreed</span><span>The system sometimes misses when advice is framed as education</span><button type="button" aria-label="Dismiss insight">×</button></div>
        <div><span className="is-disagreed">Disagreed</span><span>The policy defines only 3 conditional rules</span><button type="button" aria-label="Dismiss insight">×</button></div>
      </div>
      <button className="security-ui-rewrite-button" type="button">Rewrite policy (2 insights reviewed)</button>
    </section>
  );
}

function EvaluationSettingsCard() {
  return (
    <section className="security-ui-evaluation-card">
      <button className="security-ui-card-close" type="button" aria-label="Close evaluation settings">×</button>
      <strong>Evaluation settings</strong>
      <p>Policy profile will be evaluated by applying it as a guardrail against standard models such as oss-mp4,gpt-5. <button type="button">Learn more</button></p>
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
        <p>Upload CSV file containing evaluate prompts that you want to use for this evaluate.</p>
        <button className="security-ui-upload-link" type="button"><MagneticIcon src={uploadSimpleIcon} />Upload</button>
      </div>
      <div className="security-ui-synthetic-row">
        <button className="security-ui-toggle" type="button" role="switch" aria-checked="false"><span /></button>
        <div>
          <strong>Evaluate using synthetic samples (optional) <MagneticIcon src={infoIcon} /></strong>
          <p>Use a generated synthetic sample set to evaluate your profile</p>
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
        {items.slice(0, 3).map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export default function SecurityUIPolicyStudio({
  onClose,
  onPublish,
  initialBasicStep = true,
  initialProfileName = DEFAULT_CUSTOM_GUARDRAIL_NAME,
  initialData,
  captureFlowStep,
  captureInline = false,
}: SecurityUIPolicyStudioProps) {
  const capturePolicyName = initialProfileName || DEFAULT_CUSTOM_GUARDRAIL_NAME;
  const captureDraftPolicyText = formatPolicyText({ ...DRAFT_MEDICAL_POLICY, name: capturePolicyName });
  const captureFullPolicyText = formatPolicyText({ ...DEFAULT_MEDICAL_POLICY, name: capturePolicyName });
  const captureStudioStep = captureFlowStep && captureFlowStep !== 'basic-info';
  const capturePolicyCreatedStep = ['draft-created', 'refined-policy', 'insights', 'evaluation'].includes(captureFlowStep ?? '');
  const fallbackPolicyData = initialData ?? DEFAULT_MEDICAL_POLICY;
  const initialPolicyText = initialData
    ? (initialData.policyText ?? formatPolicyText(initialData))
    : capturePolicyCreatedStep
      ? (captureFlowStep === 'draft-created' ? captureDraftPolicyText : captureFullPolicyText)
      : '';
  const [basicStep, setBasicStep] = useState(captureStudioStep ? false : initialBasicStep);
  const [profileName, setProfileName] = useState(initialData?.name ?? initialProfileName ?? '');
  const [direction, setDirection] = useState('responses');
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
      const generatedName = profileName.trim() || DEFAULT_MEDICAL_POLICY.name;
      setPolicyText(formatPolicyText({ ...DEFAULT_MEDICAL_POLICY, name: generatedName }));
      setStage('created');
    }, DRAFT_CREATION_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [profileName, stage]);

  useEffect(() => {
    if (stage !== 'thinking') return;

    const timer = window.setTimeout(() => {
      const generatedName = profileName.trim() || DEFAULT_MEDICAL_POLICY.name;
      setPolicyText(formatPolicyText({ ...DEFAULT_MEDICAL_POLICY, name: generatedName }));
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
    || 'Unnamed profile';
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
            title="Create custom guardrail"
            description="Create a business-specific guardrail for this agent. In the next step, you’ll define its logic in Policy Studio."
            onClose={onClose}
          />
          <ModalBody className="create-guardrail-modal-body">
            <Input
              label="Guardrail name (optional)"
              value={profileName}
              onChange={event => setProfileName(event.target.value)}
              hint="Give this custom guardrail a name, or let Policy Studio suggest one."
            />
            <RadioGroup
              name="guardrail-direction"
              label="Guardrail direction"
              required
              value={direction}
              onChange={setDirection}
              helperText="Choose where this profile applies: prompts, responses, or both."
            >
              <Radio value="responses" label="Responses (Recommended)" />
              <Radio value="prompts" label="Prompts" />
              <Radio value="both" label="Both prompts and responses" />
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => setBasicStep(false)}>Launch policy studio</Button>
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
              <header>Policy Studio Assistant</header>
              <div className={`security-ui-chat-scroll${stage === 'created' || stage === 'insights' || stage === 'evaluation' ? ' security-ui-chat-scroll--top' : ''}`}>
                {stage === 'empty' ? (
                  <div className="security-ui-get-started">
                    <MagneticIcon src={securityIcon} className="security-ui-shield" />
                    <h2>Get started with a new profile</h2>
                    <p>I’ll help you define, evaluate and refine your guardrail profile. Describe what behaviors you want to prevent or upload any compliance documents, policies or sample sets with ground truth.</p>
                    <span>Suggested next steps:</span>
                    <button onClick={() => setInput(DEFAULT_POLICY_PROMPT)}>Describe the policy you want to create</button>
                    <button onClick={() => {
                      setUploadFileSelected(false);
                      setUploadOpen(true);
                    }}>Upload any documents, internal regulations, sample sets with ground truth</button>
                    <button onClick={() => {
                      setUploadFileSelected(false);
                      setUploadOpen(true);
                    }}>Upload sample set with ground truth</button>
                  </div>
                ) : (
                  <>
                    {stage === 'evaluation' ? (
                      <div className="security-ui-evaluation-response">
                        <p>Let’s evaluate your policy against samples to evaluate its performance. You can use datasets created from your previously uploaded data, upload new samples or optionally generate synthetic samples.</p>
                        <EvaluationSettingsCard />
                      </div>
                    ) : stage === 'insights' ? (
                      <>
                        <ChatMessage sender="Policy studio">
                          <p>Updated policy <strong>{currentPolicyData.name}</strong> (v2)</p>
                          <p>I’ve updated the policy based on your input. The policy now includes specific guardrails for the concerns you mentioned.</p>
                          <p>I’ve added 3 new blocks, 1 allowed behaviour, and 4 conditional rules.</p>
                          <p>You can continue iterating on the policy by providing additional prompts or files or you can run the analysis mode to refine the policy based on discovered policy insights.</p>
                        </ChatMessage>
                        <ChatMessage sender="Policy studio">
                          <p><strong>Analysis complete. 2 policy insight discovered.</strong> You can review them in the Insights panel on the right and accept/dismiss them to refine the policy.</p>
                        </ChatMessage>
                        <ReviewInsightsCard />
                      </>
                    ) : initialData ? (
                      <ChatMessage sender="Policy studio">
                        <p>Loaded policy <strong>{currentPolicyData.name}</strong> (current version)</p>
                        <p>The policy overview is preserved on the right. Review the behaviors, then publish a new version when it is ready.</p>
                      </ChatMessage>
                    ) : (
                      <>
                        {(submittedPrompt || attachmentSubmitted) && (
                          <ChatMessage sender="John">
                            {submittedPrompt && <p>{submittedPrompt}</p>}
                            {attachmentSubmitted && (
                              <div className="security-ui-file-tags">
                                <span><MagneticIcon src={paperclipIcon} />AI-medical-advice-policy.pdf</span>
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
                                <p>Defines and restricts medical, clinical, and prescription-related guidance. Clarifies what content should be blocked, allowed, or treated as an edge case to ensure the AI assistant does not provide medical advice.</p>
                                <p>To improve this policy, add additional instructions, ground-truth examples, or internal compliance guidelines.</p>
                              </>
                            ) : (
                              <>
                                <p>Created policy <strong>{currentPolicyData.name}</strong> (v1)</p>
                                <p>Clarifies what constitutes medical advice, diagnosis, prescription guidance, and recommendation. Defines what gets blocked, allowed, or treated as an edge case.</p>
                                <p>To enhance the policy you can either continue prompting, upload ground-truth samples, or add relevant files such as internal policy guidelines and best practices for your use case.</p>
                                <p>When finished, run the analysis mode to refine the policy based on discovered insights.</p>
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
                              <p><em>Looking for patterns that should be blocked, allowed or reviewed as edge cases.</em></p>
                              <ul>
                                <li>General medical advice (explaining what the flu is)</li>
                                <li>Factual information without recommendations</li>
                                <li>Describing healthcare services</li>
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
                  placeholder="Describe your policy requirements"
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
                <p>Your policy will appear here</p>
              )}
            </section>
          </main>
        </section>
      )}

      {uploadOpen && (
        <div className="security-ui-upload-backdrop" role="presentation">
          <section className="security-ui-upload-modal" role="dialog" aria-modal="true" aria-label="Upload files">
            <h2>Upload files</h2>
            <p>Upload a sample policy document to help Policy Studio create or refine this profile.</p>
            <p>Upload up to 4 files (maximum 2 MB each) in .txt, .xlsx, .csv, .md, .json or .pdf format.</p>
            <button
              className={`security-ui-dropzone${uploadFileSelected ? ' security-ui-dropzone--uploaded' : ''}`}
              onClick={() => setUploadFileSelected(true)}
              data-dialog-initial-focus
              type="button"
            >
              {uploadFileSelected ? (
                <span className="security-ui-dropzone-file">
                  <MagneticIcon src={paperclipIcon} />One attachment: AI-medical-advice-policy.pdf
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
