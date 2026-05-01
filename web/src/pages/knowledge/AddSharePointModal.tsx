import { useMemo, useReducer, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../components/shared/Button';
import Dropdown from '../../components/shared/Dropdown';
import { Banner } from '../../components/shared/Banner';
import { Checkbox } from '../../components/shared/Checkbox';
import { Input, Textarea } from '../../components/shared/FormInput';
import { Radio, RadioGroup } from '../../components/shared/Radio';
import Spinner from '../../components/shared/Spinner';
import { AccordionGroup, AccordionItem } from '../../components/shared/Accordion';
import { useToast } from '../../components/shared/Toast';
import { Icon } from '../../icons';
import {
  type Collection,
  type ConnectionOption,
  type KnowledgeSource,
  SHAREPOINT_CONTENT_TYPES,
  SHAREPOINT_LIMITS,
  createSharePointSource,
  listConnections,
} from '../../services/knowledgeService';
import { knowledgeCopy } from './copy';

const cp = knowledgeCopy.sharepointModal;

interface AddSharePointModalProps {
  collection: Collection;
  onClose: () => void;
  onCreated: (source: KnowledgeSource) => void;
}

/* ── Form state ───────────────────────────────────────────────── */

/* Hard cap enforced by the UI so the pattern list can't grow unbounded. The
   cap of 100 mirrors the copy shown in the accordion description. */
const MAX_PATTERNS = 100;

/* Regex pattern fields support a free-form list of strings — each string is
   one pattern entry. Using a dedicated alias keeps the `PatternField` type
   usable as a discriminator in the reducer actions below. */
type PatternField = 'entityRegex' | 'attachmentRegex';

interface FormState {
  name: string;
  description: string;
  domain: string;
  siteUrls: string[];
  connectionId: string;
  contentTypes: string[];
  entities: string[];
  entityRegex: string[];
  attachmentRegex: string[];
  includeAcl: boolean;
  syncMode: 'incremental' | 'full';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'custom';
  customDays: string[];
  customTime: string;
}

type Action =
  | { type: 'set'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'setSiteUrl'; index: number; value: string }
  | { type: 'addSiteUrl' }
  | { type: 'removeSiteUrl'; index: number }
  | { type: 'toggleContentType'; id: string }
  | { type: 'toggleCustomDay'; day: string }
  | { type: 'setPattern'; field: PatternField; index: number; value: string }
  | { type: 'addPattern'; field: PatternField }
  | { type: 'removePattern'; field: PatternField; index: number };

const initialState: FormState = {
  name: '',
  description: '',
  domain: '',
  siteUrls: [''],
  connectionId: '',
  contentTypes: ['docs'],
  entities: [],
  entityRegex: [],
  attachmentRegex: [],
  includeAcl: false,
  syncMode: 'incremental',
  frequency: 'daily',
  customDays: ['Mon', 'Wed', 'Fri'],
  customTime: '02:00',
};

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.field]: action.value } as FormState;
    case 'setSiteUrl': {
      const next = [...state.siteUrls];
      next[action.index] = action.value;
      return { ...state, siteUrls: next };
    }
    case 'addSiteUrl':
      return { ...state, siteUrls: [...state.siteUrls, ''] };
    case 'removeSiteUrl':
      return {
        ...state,
        siteUrls: state.siteUrls.filter((_, i) => i !== action.index),
      };
    case 'toggleContentType': {
      const has = state.contentTypes.includes(action.id);
      return {
        ...state,
        contentTypes: has
          ? state.contentTypes.filter((t) => t !== action.id)
          : [...state.contentTypes, action.id],
      };
    }
    case 'toggleCustomDay': {
      const has = state.customDays.includes(action.day);
      return {
        ...state,
        customDays: has
          ? state.customDays.filter((d) => d !== action.day)
          : [...state.customDays, action.day],
      };
    }
    case 'setPattern': {
      const next = [...state[action.field]];
      next[action.index] = action.value;
      return { ...state, [action.field]: next };
    }
    case 'addPattern': {
      const current = state[action.field];
      if (current.length >= MAX_PATTERNS) return state;
      return { ...state, [action.field]: [...current, ''] };
    }
    case 'removePattern': {
      const next = state[action.field].filter((_, i) => i !== action.index);
      return { ...state, [action.field]: next };
    }
    default:
      return state;
  }
}

/* ── Validation helpers ───────────────────────────────────────── */

const ONLINE_DOMAIN_RE = /^([a-z0-9-]+\.)?(sharepoint\.(com|us)|sharepointonline\.com)$/i;

function validateDomain(domain: string): string | undefined {
  if (!domain.trim()) return cp.errors.domainRequired;
  if (!ONLINE_DOMAIN_RE.test(domain.trim())) return cp.fields.domainError;
  return undefined;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'custom', label: 'Custom interval' },
];

type MicrosoftPickerItem = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  meta: string;
  parentId: string | null;
};

const MICROSOFT_PICKER_ITEMS: MicrosoftPickerItem[] = [
  { id: 'shared-docs', name: 'Shared Documents', type: 'folder', meta: 'Folder', parentId: null },
  { id: 'support-playbooks', name: 'Support playbooks', type: 'folder', meta: 'Folder', parentId: null },
  { id: 'faq-pdf', name: 'Contoso FAQ.pdf', type: 'file', meta: '280 KB', parentId: null },
  { id: 'roadmap-xlsx', name: 'Product roadmap.xlsx', type: 'file', meta: '246 KB', parentId: null },
  { id: 'release-notes-md', name: 'Release notes.md', type: 'file', meta: '42 KB', parentId: null },
  { id: 'policies', name: 'Policies', type: 'folder', meta: 'Folder', parentId: 'shared-docs' },
  { id: 'templates', name: 'Templates', type: 'folder', meta: 'Folder', parentId: 'shared-docs' },
  { id: 'benefits-pdf', name: 'Benefits guide.pdf', type: 'file', meta: '318 KB', parentId: 'shared-docs' },
  { id: 'returns-docx', name: 'Return policy.docx', type: 'file', meta: '128 KB', parentId: 'policies' },
  { id: 'security-md', name: 'Security policy.md', type: 'file', meta: '64 KB', parentId: 'policies' },
  { id: 'case-template-docx', name: 'Case template.docx', type: 'file', meta: '96 KB', parentId: 'templates' },
  { id: 'tier-one', name: 'Tier 1', type: 'folder', meta: 'Folder', parentId: 'support-playbooks' },
  { id: 'tier-two', name: 'Tier 2', type: 'folder', meta: 'Folder', parentId: 'support-playbooks' },
  { id: 'triage-pdf', name: 'Triage guide.pdf', type: 'file', meta: '402 KB', parentId: 'tier-one' },
  { id: 'escalation-pdf', name: 'Escalation guide.pdf', type: 'file', meta: '512 KB', parentId: 'tier-two' },
];

const getMicrosoftPickerItems = (parentId: string | null) =>
  MICROSOFT_PICKER_ITEMS.filter((item) => item.parentId === parentId);

const getMicrosoftPickerItemLabels = (ids: string[]) =>
  MICROSOFT_PICKER_ITEMS
    .filter((item) => ids.includes(item.id))
    .map((item) => item.name);

const getMicrosoftPickerItemIdsByLabel = (labels: string[]) =>
  MICROSOFT_PICKER_ITEMS
    .filter((item) => labels.includes(item.name))
    .map((item) => item.id);

const getMicrosoftPickerBreadcrumbs = (folderId: string | null) => {
  const breadcrumbs: MicrosoftPickerItem[] = [];
  let currentId = folderId;

  while (currentId) {
    const current = MICROSOFT_PICKER_ITEMS.find((item) => item.id === currentId);
    if (!current) break;
    breadcrumbs.unshift(current);
    currentId = current.parentId;
  }

  return breadcrumbs;
};

const getMicrosoftPickerPath = (item: MicrosoftPickerItem) => {
  const breadcrumbs = getMicrosoftPickerBreadcrumbs(item.parentId);
  return ['My files', ...breadcrumbs.map((folder) => folder.name)].join(' / ');
};

/* ── Wizard ───────────────────────────────────────────────────── */

type WizardStep = 1 | 2 | 3 | 4;

interface StepDef {
  num: WizardStep;
  label: string;
}

const STEPS: StepDef[] = [
  { num: 1, label: cp.steps.basics },
  { num: 2, label: cp.steps.scopeAuth },
  { num: 3, label: cp.steps.selectFiles },
  { num: 4, label: cp.steps.syncSettings },
];

/* Encapsulates per-step required-field checks. Kept next to the reducer /
   validators so the Next button's enablement logic is easy to audit. */
function isStepValid(step: WizardStep, state: FormState): boolean {
  if (step === 1) {
    return !!state.name.trim() && !!state.description.trim();
  }
  if (step === 2) {
    return (
      !validateDomain(state.domain) &&
      state.siteUrls.some((u) => u.trim().length > 0) &&
      !!state.connectionId
    );
  }
  if (step === 3) {
    return state.entities.length > 0;
  }
  return state.contentTypes.length > 0;
}

/* ── Component ────────────────────────────────────────────────── */

export default function AddSharePointModal({
  collection,
  onClose,
  onCreated,
}: AddSharePointModalProps) {
  const { notify } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);
  const [microsoftStage, setMicrosoftStage] = useState<'signin' | 'picker'>('signin');
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  /* Tracks which steps the user has already tried to advance past so that
     error hints only appear after a Next/Save attempt on that step. A plain
     state Set is used (instead of per-step booleans) so future steps can be
     added without adding another flag. */
  const [attemptedSteps, setAttemptedSteps] = useState<Set<WizardStep>>(new Set());

  useEffect(() => {
    listConnections().then(setConnections);
  }, []);

  useEffect(() => {
    if (!microsoftModalOpen || microsoftStage !== 'signin') return undefined;
    const timer = window.setTimeout(() => setMicrosoftStage('picker'), 3000);
    return () => window.clearTimeout(timer);
  }, [microsoftModalOpen, microsoftStage]);

  const quotaGB = Math.round(collection.storageQuotaBytes / (1024 * 1024 * 1024));
  const usedMB = Math.round(collection.storageUsedBytes / (1024 * 1024));
  const wouldExceedQuota = false; // placeholder hook for backend quota preview

  const step1Attempted = attemptedSteps.has(1);
  const step2Attempted = attemptedSteps.has(2);
  const step3Attempted = attemptedSteps.has(3);
  const step4Attempted = attemptedSteps.has(4);

  const nameError = step1Attempted && !state.name.trim() ? cp.errors.nameRequired : undefined;
  const descriptionError =
    step1Attempted && !state.description.trim() ? cp.errors.descriptionRequired : undefined;
  const domainError = step2Attempted ? validateDomain(state.domain) : undefined;
  const liveDomainError =
    state.domain && !ONLINE_DOMAIN_RE.test(state.domain.trim()) ? cp.fields.domainError : undefined;
  const siteError =
    step2Attempted && !state.siteUrls.some((u) => u.trim().length > 0)
      ? cp.errors.siteUrlsRequired
      : undefined;
  const connectionError =
    step2Attempted && !state.connectionId ? cp.errors.connectionRequired : undefined;
  const contentTypesError =
    step4Attempted && state.contentTypes.length === 0
      ? cp.errors.contentTypesRequired
      : undefined;
  const selectedItemsError =
    step3Attempted && state.entities.length === 0 ? cp.errors.entitiesRequired : undefined;

  const formValid = useMemo(
    () =>
      isStepValid(1, state) &&
      isStepValid(2, state) &&
      isStepValid(3, state) &&
      isStepValid(4, state) &&
      !wouldExceedQuota,
    [state, wouldExceedQuota],
  );

  const connectionOptions = useMemo(
    () => connections.map((c) => ({ value: c.id, label: c.label })),
    [connections],
  );
  const selectedItems = useMemo(
    () => MICROSOFT_PICKER_ITEMS.filter((item) => state.entities.includes(item.name)),
    [state.entities],
  );

  const markAttempted = (s: WizardStep) =>
    setAttemptedSteps((prev) => {
      if (prev.has(s)) return prev;
      const next = new Set(prev);
      next.add(s);
      return next;
    });

  const focusFirstInvalid = () => {
    // After state flushes to DOM, scroll the first invalid field into view.
    requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>('.sp-fpmodal .fpmodal-body');
      if (!root) return;
      const firstInvalid = root.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid="true"]',
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
      }
    });
  };

  const handleNext = () => {
    if (!isStepValid(step, state)) {
      markAttempted(step);
      focusFirstInvalid();
      return;
    }
    if (step === 2) {
      setMicrosoftStage('signin');
      setPickerSelection(getMicrosoftPickerItemIdsByLabel(state.entities));
      setMicrosoftModalOpen(true);
      return;
    }
    if (step < 4) {
      setStep((step + 1) as WizardStep);
      // Scroll the new step's content back to the top so long forms don't
      // leave the user stranded mid-way through the previous step's fields.
      requestAnimationFrame(() => {
        const body = document.querySelector<HTMLElement>('.sp-fpmodal .fpmodal-body');
        if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const focusWizard = () => {
    requestAnimationFrame(() => modalRef.current?.focus({ preventScroll: true }));
  };

  const handleMicrosoftCancel = () => {
    setMicrosoftModalOpen(false);
    focusWizard();
  };

  const handleMicrosoftSelect = () => {
    const selectedLabels = getMicrosoftPickerItemLabels(pickerSelection);

    dispatch({ type: 'set', field: 'entities', value: selectedLabels });
    setMicrosoftModalOpen(false);
    setStep(3);
    requestAnimationFrame(() => {
      const body = document.querySelector<HTMLElement>('.sp-fpmodal .fpmodal-body');
      if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      modalRef.current?.focus({ preventScroll: true });
    });
  };

  const handleRemoveSelectedItem = (name: string) => {
    dispatch({
      type: 'set',
      field: 'entities',
      value: state.entities.filter((entity) => entity !== name),
    });
  };

  const handleAddMoreFiles = () => {
    setMicrosoftStage('picker');
    setPickerSelection(getMicrosoftPickerItemIdsByLabel(state.entities));
    setMicrosoftModalOpen(true);
  };

  const onSave = async () => {
    markAttempted(4);
    if (!formValid) {
      // Mark every step as attempted so earlier-step errors also surface if
      // the user somehow reached step 3 with stale/invalid data.
      setAttemptedSteps(new Set<WizardStep>([1, 2, 3, 4]));
      notify({
        type: 'error',
        title: cp.errors.submitBlockedTitle,
        message: cp.errors.submitBlockedMessage,
      });
      // If the first invalid field is on an earlier step, jump back so the
      // user can see and fix it rather than being left on step 3 with an
      // inert Save button.
      if (!isStepValid(1, state)) setStep(1);
      else if (!isStepValid(2, state)) setStep(2);
      else if (!isStepValid(3, state)) setStep(3);
      focusFirstInvalid();
      return;
    }
    setSubmitting(true);
    try {
      const created = await createSharePointSource(collection.id, {
        name: state.name.trim(),
        description: state.description.trim(),
        hostingMethod: 'online',
        domain: state.domain.trim(),
        siteUrls: state.siteUrls.filter((u) => u.trim().length > 0),
        connectionId: state.connectionId,
        contentTypes: state.contentTypes,
        entities: state.entities,
        entityRegex: state.entityRegex,
        attachmentRegex: state.attachmentRegex,
        includeAcl: state.includeAcl,
        syncMode: state.syncMode,
        frequency: state.frequency,
        customInterval:
          state.frequency === 'custom'
            ? { days: state.customDays, time: state.customTime }
            : undefined,
      });
      notify({
        type: 'success',
        title: knowledgeCopy.detail.firstSyncToast.title,
        message: knowledgeCopy.detail.firstSyncToast.message,
      });
      onCreated(created);
    } catch (err) {
      notify({
        type: 'error',
        title: "Couldn't create source",
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepValid = isStepValid(step, state);

  return createPortal(
    <div className="fpmodal-overlay">
      <div
        ref={modalRef}
        className="fpmodal sp-fpmodal"
        role="dialog"
        aria-modal="true"
        aria-label={cp.title}
        tabIndex={-1}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">{cp.title}</h1>
            <p className="fpmodal-subtitle">{cp.subtitle}</p>
          </div>
          <button
            type="button"
            className="fpmodal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="cancel" weight="bold" size="xl" />
          </button>
        </div>

        {/* ── Stepper ─────────────────────────────────────────── */}
        <div className="fpmodal-stepper">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            const cls = [
              'wizard-step',
              isActive && 'active',
              isCompleted && 'completed',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <span key={s.num} style={{ display: 'contents' }}>
                {i > 0 && (
                  <div
                    className={`wizard-step-line${step > s.num ? ' completed' : ''}`}
                  />
                )}
                <div className={cls}>
                  <div className="wizard-step-number">
                    {isCompleted ? (
                      <Icon name="check" weight="bold" size={16} />
                    ) : isActive ? (
                      <Icon name="edit" weight="bold" size={16} />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className="wizard-step-label">{s.label}</span>
                </div>
              </span>
            );
          })}
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="fpmodal-body">
          <div className="fpmodal-content-area">
            {/* Step 1 — Basics */}
            {step === 1 && (
              <section className="fpmodal-section">
                <div className="fpmodal-card-row">
                {/* Source details card */}
                <div className="fpmodal-card-col">
                <h3 className="sp-card-title">{cp.sections.details}</h3>
                <div className="fpmodal-card">
                  <Input
                    label={cp.fields.name}
                    required
                    value={state.name}
                    onChange={(e) =>
                      dispatch({ type: 'set', field: 'name', value: e.target.value })
                    }
                    maxLength={80}
                    placeholder="e.g. Contoso Support Hub"
                    validation={nameError ? 'error' : undefined}
                    hint={nameError}
                  />
                  <Textarea
                    label={cp.fields.description}
                    required
                    value={state.description}
                    onChange={(e) =>
                      dispatch({ type: 'set', field: 'description', value: e.target.value })
                    }
                    maxLength={500}
                    showCharCount
                    rows={5}
                    placeholder="Describe what this source contains and when to use it."
                    validation={descriptionError ? 'error' : undefined}
                    hint={descriptionError}
                  />
                </div>
                </div>

                {/* Source type card */}
                <div className="fpmodal-card-col">
                <h3 className="sp-card-title">{cp.sections.source}</h3>
                <div className="fpmodal-card">
                  <p className="sp-card-sub">{cp.fields.hostingLabel}</p>

                  <div className="sp-hosting-card" aria-current="true">
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        border: '2px solid var(--accent-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: 'var(--accent-color)',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p className="sp-hosting-card__title">{cp.fields.hostingCardTitle}</p>
                      <p className="sp-hosting-card__sub">{cp.fields.hostingCardSub}</p>
                    </div>
                  </div>

                  <Banner type="info" title={cp.banners.onlineOnly} />
                </div>
                </div>
                </div>
              </section>
            )}

            {/* Step 2 — Authentication */}
            {step === 2 && (
              <section className="fpmodal-section">
                <div className="fpmodal-card-row">
                {/* Authentication / connection card */}
                <div className="fpmodal-card-col">
                <h3 className="sp-card-title">{cp.sections.authentication}</h3>
                <div
                  className="fpmodal-card"
                  data-invalid={connectionError ? 'true' : undefined}
                  tabIndex={connectionError ? -1 : undefined}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="form-label">
                      {cp.fields.domain}
                      <span className="required">*</span>
                    </label>
                    <Input
                      prefix={cp.fields.domainPrefix}
                      value={state.domain}
                      placeholder={cp.fields.domainPlaceholder}
                      validation={domainError || liveDomainError ? 'error' : undefined}
                      onChange={(e) =>
                        dispatch({ type: 'set', field: 'domain', value: e.target.value })
                      }
                    />
                    <span
                      className="form-hint"
                      style={{
                        color:
                          domainError || liveDomainError ? 'var(--danger-color)' : undefined,
                      }}
                    >
                      {domainError ?? liveDomainError ?? cp.fields.domainHint}
                    </span>
                  </div>

                  <div
                    className="sp-site-urls-field"
                    data-invalid={siteError ? 'true' : undefined}
                    tabIndex={siteError ? -1 : undefined}
                  >
                    <label className="form-label">
                      {cp.fields.siteUrls}
                      <span className="required">*</span>
                    </label>
                    {state.siteUrls.map((url, i) => (
                      <div key={i} className="sp-site-url-row">
                        <Input
                          value={url}
                          placeholder={cp.fields.sitePlaceholder}
                          validation={siteError && !url.trim() ? 'error' : undefined}
                          onChange={(e) =>
                            dispatch({ type: 'setSiteUrl', index: i, value: e.target.value })
                          }
                          aria-label={`Site URL ${i + 1}`}
                        />
                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-label="Remove site URL"
                          disabled={state.siteUrls.length === 1}
                          onClick={() => dispatch({ type: 'removeSiteUrl', index: i })}
                        >
                          <Icon name="cancel" weight="bold" size="sm" />
                        </Button>
                      </div>
                    ))}
                    {siteError && (
                      <span className="form-hint" style={{ color: 'var(--danger-color)' }}>
                        {siteError}
                      </span>
                    )}
                    <div className="sp-site-urls-field__add">
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => dispatch({ type: 'addSiteUrl' })}
                      >
                        {cp.fields.siteUrlsAdd}
                      </Button>
                    </div>
                  </div>

                  <Dropdown
                    label={cp.fields.connection}
                    required
                    options={connectionOptions}
                    value={state.connectionId}
                    onChange={(v) => dispatch({ type: 'set', field: 'connectionId', value: v })}
                    placeholder="Select a connection"
                    hint={connectionError}
                  />
                </div>
                </div>

                </div>
              </section>
            )}

            {/* Step 3 — Select files */}
            {step === 3 && (
              <section className="fpmodal-section">
                <h3 className="sp-card-title">{cp.fields.selectedFilesTitle}</h3>
                <div className="fpmodal-card sp-selected-files-card">
                  <div
                    className="sp-selected-scope"
                    data-invalid={selectedItemsError ? 'true' : undefined}
                    tabIndex={selectedItemsError ? -1 : undefined}
                  >
                    <div className="sp-selected-scope__header">
                      <div>
                        <label className="form-label">
                          {cp.fields.entities}
                          <span className="required">*</span>
                        </label>
                        <p className="sp-selected-scope__hint">
                          {selectedItemsError ?? cp.fields.selectedFilesHint}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddMoreFiles}
                      >
                        {cp.fields.addMoreFiles}
                      </Button>
                    </div>
                    <div className="sp-selected-files-table" role="table" aria-label={cp.fields.selectedFilesTitle}>
                      <div className="sp-selected-files-table__head" role="row">
                        <span role="columnheader">{cp.fields.selectedName}</span>
                        <span role="columnheader">{cp.fields.selectedType}</span>
                        <span role="columnheader">{cp.fields.selectedLocation}</span>
                        <span role="columnheader">{cp.fields.selectedSize}</span>
                        <span role="columnheader">{cp.fields.selectedActions}</span>
                      </div>
                      {selectedItems.map((item) => (
                        <div key={item.id} className="sp-selected-files-table__row" role="row">
                          <span className="sp-selected-files-table__name" role="cell">
                            <Icon name={item.type === 'folder' ? 'folder' : 'document'} weight="bold" size="sm" />
                            {item.name}
                          </span>
                          <span role="cell">{item.type === 'folder' ? 'Folder' : 'File'}</span>
                          <span role="cell">{getMicrosoftPickerPath(item)}</span>
                          <span role="cell">{item.meta}</span>
                          <span role="cell">
                            <Button
                              variant="tertiary"
                              size="sm"
                              onClick={() => handleRemoveSelectedItem(item.name)}
                            >
                              <Icon name="cancel" weight="bold" size="sm" />
                              {cp.fields.removeSelected}
                            </Button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Step 4 — Sync settings */}
            {step === 4 && (
              <section className="fpmodal-section">
                <div className="fpmodal-card-row sp-sync-settings-grid">
                  <div className="fpmodal-card-col">
                {/* Content scope */}
                <h3 className="sp-card-title">{cp.sections.scope}</h3>
                <div className="fpmodal-card">
                  <div
                    data-invalid={contentTypesError ? 'true' : undefined}
                    tabIndex={contentTypesError ? -1 : undefined}
                    className="sp-content-scope-field"
                  >
                    <label className="form-label">
                      {cp.fields.contentTypes}
                      <span className="required">*</span>
                    </label>
                    <span
                      className="form-hint"
                      style={{ color: contentTypesError ? 'var(--danger-color)' : undefined }}
                    >
                      {contentTypesError ?? cp.fields.contentTypesHint}
                    </span>
                    <div
                      role="group"
                      aria-label={cp.fields.contentTypes}
                      className="sp-content-type-grid"
                    >
                      {SHAREPOINT_CONTENT_TYPES.map((ct) => (
                        <Checkbox
                          key={ct.id}
                          label={ct.label}
                          checked={state.contentTypes.includes(ct.id)}
                          onChange={() => dispatch({ type: 'toggleContentType', id: ct.id })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="sp-additional">
                    <div className="sp-additional__head">
                      <span className="sp-additional__title">
                        {cp.fields.additionalConfig}
                      </span>
                      <span className="sp-additional__sub">
                        {cp.fields.additionalConfigSub}
                      </span>
                    </div>
                    <AccordionGroup type="contained">
                      <AccordionItem
                        title={
                          <span className="sp-pattern-accordion__title">
                            <span className="sp-pattern-accordion__heading">
                              {cp.fields.entityRegex}
                            </span>
                            <span className="sp-pattern-accordion__desc">
                              {cp.fields.entityRegexDesc}
                            </span>
                          </span>
                        }
                      >
                        <PatternList
                          patterns={state.entityRegex}
                          placeholder={cp.fields.entityRegexPlaceholder}
                          max={MAX_PATTERNS}
                          onChange={(index, value) =>
                            dispatch({ type: 'setPattern', field: 'entityRegex', index, value })
                          }
                          onAdd={() => dispatch({ type: 'addPattern', field: 'entityRegex' })}
                          onRemove={(index) =>
                            dispatch({ type: 'removePattern', field: 'entityRegex', index })
                          }
                          ariaLabel={cp.fields.entityRegex}
                        />
                      </AccordionItem>
                      <AccordionItem
                        title={
                          <span className="sp-pattern-accordion__title">
                            <span className="sp-pattern-accordion__heading">
                              {cp.fields.attachmentRegex}
                            </span>
                            <span className="sp-pattern-accordion__desc">
                              {cp.fields.attachmentRegexDesc}
                            </span>
                          </span>
                        }
                      >
                        <PatternList
                          patterns={state.attachmentRegex}
                          placeholder={cp.fields.attachmentRegexPlaceholder}
                          max={MAX_PATTERNS}
                          onChange={(index, value) =>
                            dispatch({
                              type: 'setPattern',
                              field: 'attachmentRegex',
                              index,
                              value,
                            })
                          }
                          onAdd={() => dispatch({ type: 'addPattern', field: 'attachmentRegex' })}
                          onRemove={(index) =>
                            dispatch({
                              type: 'removePattern',
                              field: 'attachmentRegex',
                              index,
                            })
                          }
                          ariaLabel={cp.fields.attachmentRegex}
                        />
                      </AccordionItem>
                    </AccordionGroup>
                  </div>
                </div>

                  </div>

                  <div className="fpmodal-card-col">

                {/* Sync mode */}
                <h3 className="sp-card-title">{cp.sections.syncMode}</h3>
                <div className="fpmodal-card">
                  <RadioGroup
                    name="sync-mode"
                    value={state.syncMode}
                    onChange={(v) =>
                      dispatch({
                        type: 'set',
                        field: 'syncMode',
                        value: v as FormState['syncMode'],
                      })
                    }
                  >
                    <Radio
                      value="incremental"
                      label={cp.fields.syncMode.incremental}
                      helperText={cp.fields.syncMode.incrementalHelp}
                    />
                    <Radio
                      value="full"
                      label={cp.fields.syncMode.full}
                      helperText={cp.fields.syncMode.fullHelp}
                    />
                  </RadioGroup>
                </div>

                {/* Sync schedule */}
                <h3 className="sp-card-title">{cp.sections.syncSchedule}</h3>
                <div className="fpmodal-card">
                  <Dropdown
                    label={cp.fields.frequency}
                    options={FREQUENCY_OPTIONS}
                    value={state.frequency}
                    onChange={(v) =>
                      dispatch({
                        type: 'set',
                        field: 'frequency',
                        value: v as FormState['frequency'],
                      })
                    }
                    hint={cp.fields.firstRunNote}
                  />
                  {state.frequency === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="form-label">Days</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {WEEK_DAYS.map((d) => (
                          <Checkbox
                            key={d}
                            label={d}
                            checked={state.customDays.includes(d)}
                            onChange={() => dispatch({ type: 'toggleCustomDay', day: d })}
                          />
                        ))}
                      </div>
                      <Input
                        type="time"
                        label="Time"
                        value={state.customTime}
                        onChange={(e) =>
                          dispatch({
                            type: 'set',
                            field: 'customTime',
                            value: e.target.value,
                          })
                        }
                      />
                      <span className="form-hint">{cp.fields.customIntervalHelp}</span>
                    </div>
                  )}
                </div>

                {/* Limits & quotas */}
                <h3 className="sp-card-title">{cp.sections.limits}</h3>
                <div className="fpmodal-card">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sp-limit-row">
                      <span>{cp.fields.maxFileSize}</span>
                      <strong>{SHAREPOINT_LIMITS.maxFileSizeMB} MB</strong>
                    </div>
                    <div className="sp-limit-row">
                      <span>{cp.fields.maxSources}</span>
                      <strong>{SHAREPOINT_LIMITS.maxSourcesPerCollection}</strong>
                    </div>
                    <div className="sp-limit-row">
                      <span>{cp.fields.indexedVolume}</span>
                      <strong>
                        {usedMB} MB / {quotaGB} GB
                      </strong>
                    </div>
                    {wouldExceedQuota && (
                      <Banner type="error" title={cp.banners.quotaExceeded} />
                    )}
                  </div>
                </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              {step > 1 && (
                <button
                  type="button"
                  className="fpmodal-back-btn"
                  onClick={handleBack}
                  disabled={submitting}
                >
                  <Icon name="arrow-left" weight="bold" size={16} />
                  {cp.actions.back}
                </button>
              )}
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                {cp.actions.cancel}
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext} disabled={!currentStepValid}>
                  {cp.actions.next}
                </Button>
              ) : (
                <Button onClick={onSave} disabled={submitting}>
                  {submitting ? 'Saving…' : cp.actions.save}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {microsoftModalOpen && (
        <MicrosoftConnectModal
          stage={microsoftStage}
          selection={pickerSelection}
          onToggleSelection={(id) =>
            setPickerSelection((prev) =>
              prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
            )
          }
          onCancel={handleMicrosoftCancel}
          onSelect={handleMicrosoftSelect}
        />
      )}
    </div>,
    document.body,
  );
}

/* ── Microsoft picker interstitial ───────────────────────────────── */

function MicrosoftConnectModal({
  stage,
  selection,
  onToggleSelection,
  onCancel,
  onSelect,
}: {
  stage: 'signin' | 'picker';
  selection: string[];
  onToggleSelection: (id: string) => void;
  onCancel: () => void;
  onSelect: () => void;
}) {
  const selectDisabled = selection.length === 0;
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const currentItems = getMicrosoftPickerItems(currentFolderId);
  const breadcrumbs = getMicrosoftPickerBreadcrumbs(currentFolderId);

  return (
    <div className="sp-ms-window" role="dialog" aria-modal="true" aria-label="Connect Microsoft account">
      <div className="sp-ms-window__chrome">
        <span className="sp-ms-window__dot" />
        <span className="sp-ms-window__dot" />
        <span className="sp-ms-window__dot" />
        <strong>{stage === 'signin' ? 'Connect Microsoft account' : 'Select a file to share'}</strong>
      </div>
      {stage === 'signin' ? (
        <div className="sp-ms-signin">
          <div className="sp-ms-signin__card">
            <div className="sp-ms-brand">
              <span className="sp-ms-brand__mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>Microsoft</span>
            </div>
            <h2>Sign in</h2>
            <div className="sp-ms-signin__spinner-area">
              <div className="sp-ms-autologin" aria-live="polite">
                <Spinner size="large" aria-label="Signing in" />
                <span>Signing in automatically…</span>
              </div>
            </div>
          </div>
          <div className="sp-ms-signin__options">
            <Icon name="shield" weight="bold" size="md" />
            Sign-in options
          </div>
        </div>
      ) : (
        <div className="sp-ms-picker">
          <aside className="sp-ms-picker__nav" aria-label="Microsoft file navigation">
            <h2>Pick files</h2>
            {['My files', 'Recent', 'Shared', 'Favorites'].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`sp-ms-picker__nav-item${index === 0 ? ' active' : ''}`}
              >
                <Icon name={index === 0 ? 'folder' : 'document'} weight="bold" size="sm" />
                {label}
              </button>
            ))}
          </aside>
          <main className="sp-ms-picker__content">
            <div className="sp-ms-picker__toolbar">
              <div className="sp-ms-picker__crumbs" aria-label="Current folder path">
                <button type="button" onClick={() => setCurrentFolderId(null)}>
                  My files
                </button>
                {breadcrumbs.map((folder) => (
                  <span key={folder.id} className="sp-ms-picker__crumb">
                    <Icon name="arrow-right" size="xs" />
                    <button type="button" onClick={() => setCurrentFolderId(folder.id)}>
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
              <div className="sp-ms-picker__search">
                <Icon name="search" size="sm" />
                Search
              </div>
            </div>
            <div className="sp-ms-picker__table" role="listbox" aria-label="SharePoint files and folders">
              <div className="sp-ms-picker__head">
                <span />
                <span>Name</span>
                <span>Modified</span>
                <span>Modified By</span>
              </div>
              {currentItems.map((item) => {
                const selected = selection.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={selected}
                    className={`sp-ms-picker__row${selected ? ' selected' : ''}`}
                  >
                    <Checkbox
                      checked={selected}
                      onChange={() => onToggleSelection(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                    {item.type === 'folder' ? (
                      <button
                        type="button"
                        className="sp-ms-picker__file sp-ms-picker__folder-link"
                        onClick={() => setCurrentFolderId(item.id)}
                      >
                        <Icon name="folder" weight="bold" size="md" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.meta}</small>
                        </span>
                      </button>
                    ) : (
                    <span className="sp-ms-picker__file">
                      <Icon name={item.type === 'folder' ? 'folder' : 'document'} weight="bold" size="md" />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.meta}</small>
                      </span>
                    </span>
                    )}
                    <span>January 14, 2021</span>
                    <span>Stewart Curry</span>
                  </div>
                );
              })}
              {currentItems.length === 0 && (
                <div className="sp-ms-picker__empty">This folder is empty.</div>
              )}
            </div>
            <div className="sp-ms-picker__footer">
              <Button disabled={selectDisabled} onClick={onSelect}>Select</Button>
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

/* ── Pattern list helper ─────────────────────────────────────────── */

/* Renders an editable list of regex pattern inputs with a per-row remove
   icon, an "+ Add pattern" CTA, and a live "X/100" counter. Extracted here
   so both accordions (Entity regex, Attachment regex) share one UI and
   one interaction contract instead of re-implementing the list twice. */
function PatternList({
  patterns,
  placeholder,
  max,
  onChange,
  onAdd,
  onRemove,
  ariaLabel,
}: {
  patterns: string[];
  placeholder: string;
  max: number;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  ariaLabel: string;
}) {
  const atMax = patterns.length >= max;

  return (
    <div className="sp-pattern-list" role="group" aria-label={ariaLabel}>
      {patterns.map((value, i) => (
        <div key={i} className="sp-pattern-row">
          <Input
            value={value}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={placeholder}
            aria-label={`${ariaLabel} ${i + 1}`}
          />
          <button
            type="button"
            className="sp-pattern-row__remove"
            onClick={() => onRemove(i)}
            aria-label={knowledgeCopy.sharepointModal.fields.removePattern}
          >
            <Icon name="cancel" weight="bold" size="sm" />
          </button>
        </div>
      ))}
      <div className="sp-pattern-list__footer">
        <Button
          variant="tertiary"
          size="sm"
          onClick={onAdd}
          disabled={atMax}
        >
          {knowledgeCopy.sharepointModal.fields.addPattern}
        </Button>
        <span className="sp-pattern-list__count" aria-live="polite">
          {knowledgeCopy.sharepointModal.fields.patternsCount(patterns.length)}
        </span>
      </div>
    </div>
  );
}
