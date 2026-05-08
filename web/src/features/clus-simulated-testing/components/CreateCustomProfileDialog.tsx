import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { publicAssetUrl } from '../../../app/publicAsset';
import { Badge, Button, Dialog, Icon, Input, Textarea } from '../momentum';
import { LinkButton } from '../../clus-kpi-dashboard/momentum';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';

export interface CreateCustomProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerID: string;
}

type RuleCategory = 'blocked' | 'allowed' | 'edge';

interface RuleEntry {
  id: string;
  text: string;
}

function createRuleId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_RULE_TEXT = 'New rule — click to edit';

function ruleKey(category: RuleCategory, id: string): string {
  return `${category}:${id}`;
}

export function CreateCustomProfileDialog({ open, onOpenChange, triggerID }: CreateCustomProfileDialogProps) {
  const [policyName, setPolicyName] = useState('');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [manualPolicyDetails, setManualPolicyDetails] = useState(false);
  const [policyDescription, setPolicyDescription] = useState('');
  const [policyOverviewOpen, setPolicyOverviewOpen] = useState(true);
  const [blockedRules, setBlockedRules] = useState<RuleEntry[]>([]);
  const [allowedRules, setAllowedRules] = useState<RuleEntry[]>([]);
  const [edgeRules, setEdgeRules] = useState<RuleEntry[]>([]);
  const [editingRuleKey, setEditingRuleKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      /* eslint-disable react-hooks/set-state-in-effect -- Reset local wizard state when controlled `open` becomes false (may occur without `onClose`). */
      setPolicyName('');
      setAssistantPrompt('');
      setManualPolicyDetails(false);
      setPolicyDescription('');
      setPolicyOverviewOpen(true);
      setBlockedRules([]);
      setAllowedRules([]);
      setEdgeRules([]);
      setEditingRuleKey(null);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const canPublish = policyName.trim().length > 0;

  const setRulesForCategory = (category: RuleCategory, updater: (prev: RuleEntry[]) => RuleEntry[]) => {
    if (category === 'blocked') setBlockedRules(updater);
    else if (category === 'allowed') setAllowedRules(updater);
    else setEdgeRules(updater);
  };

  const addRule = (category: RuleCategory) => {
    const id = createRuleId();
    const entry: RuleEntry = { id, text: DEFAULT_RULE_TEXT };
    setRulesForCategory(category, (prev) => [...prev, entry]);
    setEditingRuleKey(ruleKey(category, id));
  };

  const updateRuleText = (category: RuleCategory, id: string, text: string) => {
    setRulesForCategory(category, (prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const deleteRule = (category: RuleCategory, id: string) => {
    setRulesForCategory(category, (prev) => prev.filter((r) => r.id !== id));
    setEditingRuleKey((k) => (k === ruleKey(category, id) ? null : k));
  };

  /* Portal to icon provider root so `position:fixed` fills the viewport (not `.app-main`, which uses backdrop-filter → new containing block). */
  const portalTarget =
    typeof document !== 'undefined' ? document.querySelector('mdc-iconprovider') ?? document.body : null;

  if (typeof document === 'undefined' || !portalTarget) {
    return null;
  }

  return createPortal(
    <Dialog
      className="create-custom-profile-dialog"
      visible={open}
      size="fullscreen"
      headerText="Create custom profile"
      descriptionText="Define a policy name, then describe requirements to the assistant or add policy details manually."
      closeButtonAriaLabel="Close dialog"
      triggerID={triggerID}
      onClose={handleClose}
    >
      <div slot="dialog-body" className="create-custom-profile-dialog-body">
        <div className="create-custom-profile-dialog__columns">
          <div className="create-custom-profile-dialog__assistant">
            <div className="create-custom-profile-dialog__policy">
              <Input
                label="Policy name"
                placeholder="Enter policy name"
                value={policyName}
                required
                onInput={(e: Event) =>
                  setPolicyName((e.target as HTMLInputElement & { value?: string }).value ?? '')
                }
              />
            </div>
            <h3 className={`create-custom-profile-dialog__panel-heading ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
              Policy Studio Assistant
            </h3>
            <div className="create-custom-profile-dialog__assistant-stage">
              <p className={`create-custom-profile-dialog__assistant-placeholder ${ck.typo.bodyMidsizeRegular} ${ck.textMuted}`}>
                Describe your policy requirements to get started. The AI assistant will generate a guardrail profile based on
                your description.
              </p>
            </div>
            <div className="create-custom-profile-dialog__composer">
              <div className="create-custom-profile-dialog__composer-inner">
                <Textarea
                  label=""
                  placeholder="Describe your policy requirements"
                  rows={3}
                  value={assistantPrompt}
                  aria-label="Policy requirements for the assistant"
                  onInput={(e: Event) =>
                    setAssistantPrompt((e.target as HTMLInputElement & { value?: string }).value ?? '')
                  }
                />
                <div className="create-custom-profile-dialog__composer-actions">
                  <Button
                    type="button"
                    color="default"
                    variant="secondary"
                    size={32}
                    prefixIcon="attachment-bold"
                    aria-label="Add attachment"
                  />
                  <Button
                    type="button"
                    color="accent"
                    variant="primary"
                    size={32}
                    prefixIcon="send-bold"
                    aria-label="Send message"
                    disabled={!assistantPrompt.trim()}
                  />
                </div>
              </div>
            </div>
            <p className={`create-custom-profile-dialog__disclaimer ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
              AI can make mistakes. Verify responses.
            </p>
          </div>

          <div className="create-custom-profile-dialog__divider" aria-hidden />

          <div className="create-custom-profile-dialog__details">
            <h3 className={`create-custom-profile-dialog__panel-heading ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
              Policy details
            </h3>

            {!manualPolicyDetails ? (
              <div className="create-custom-profile-dialog__details-empty">
                <div className="create-custom-profile-dialog__details-illustration" aria-hidden>
                  <img
                    src={publicAssetUrl('images/policy-details-empty-illustration.png')}
                    alt=""
                    width={192}
                    height={192}
                    decoding="async"
                    className="create-custom-profile-dialog__details-illustration-img"
                  />
                </div>
                <p className={`create-custom-profile-dialog__details-empty-text ${ck.typo.bodyMidsizeRegular} ${ck.textMuted}`}>
                  Policy details will appear here once you create a policy using the assistant.
                </p>
                <div className="create-custom-profile-dialog__or-rule">
                  <span className="create-custom-profile-dialog__or-line" />
                  <span className={`create-custom-profile-dialog__or-text ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                    OR
                  </span>
                  <span className="create-custom-profile-dialog__or-line" />
                </div>
                <Button
                  color="default"
                  variant="secondary"
                  size={32}
                  prefixIcon="edit-bold"
                  type="button"
                  onClick={() => setManualPolicyDetails(true)}
                >
                  Create manually
                </Button>
              </div>
            ) : (
              <div className="create-custom-profile-dialog__details-manual">
                <div className="create-custom-profile-dialog__policy-description">
                  <Textarea
                    label="Policy details"
                    placeholder="Describe what this policy does..."
                    rows={5}
                    value={policyDescription}
                    aria-label="Policy description"
                    onInput={(e: Event) =>
                      setPolicyDescription((e.target as HTMLInputElement & { value?: string }).value ?? '')
                    }
                  />
                </div>

                <div className="create-custom-profile-dialog__info-cards">
                  <div className="create-custom-profile-dialog__info-card create-custom-profile-dialog__info-card--enabled">
                    <Badge color="gray" className="create-custom-profile-dialog__info-card-badge">
                      v1
                    </Badge>
                    <p className={`create-custom-profile-dialog__info-card-title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                      Status
                    </p>
                    <p className={`create-custom-profile-dialog__info-card-body ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
                      Add rules below or use the assistant to generate them.
                    </p>
                  </div>
                  <div
                    className="create-custom-profile-dialog__info-card create-custom-profile-dialog__info-card--disabled"
                    aria-disabled="true"
                  >
                    <p className={`create-custom-profile-dialog__info-card-title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                      Insights
                    </p>
                    <p
                      className={`create-custom-profile-dialog__info-card-body create-custom-profile-dialog__info-card-body--muted ${ck.typo.bodySmallRegular} ${ck.textMuted}`}
                    >
                      Use the assistant to analyze your policy and discover patterns.
                    </p>
                  </div>
                  <div
                    className="create-custom-profile-dialog__info-card create-custom-profile-dialog__info-card--disabled"
                    aria-disabled="true"
                  >
                    <p className={`create-custom-profile-dialog__info-card-title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                      Evaluation
                    </p>
                    <p
                      className={`create-custom-profile-dialog__info-card-body create-custom-profile-dialog__info-card-body--muted ${ck.typo.bodySmallRegular} ${ck.textMuted}`}
                    >
                      Use the assistant to evaluate your policy&apos;s coverage and quality.
                    </p>
                  </div>
                </div>

                <div className="create-custom-profile-dialog__policy-overview">
                  <button
                    type="button"
                    className="create-custom-profile-dialog__policy-overview-header"
                    aria-expanded={policyOverviewOpen}
                    onClick={() => setPolicyOverviewOpen((o) => !o)}
                  >
                    <span className={`create-custom-profile-dialog__policy-overview-title ${ck.typo.bodyMidsizeMedium} ${ck.text}`}>
                      Policy overview
                    </span>
                    <span className="create-custom-profile-dialog__policy-overview-stats">
                      <span className={`create-custom-profile-dialog__policy-stat ${ck.textError}`}>
                        <Icon name="cancel-bold" size={16} lengthUnit="px" aria-hidden />
                        <span>{blockedRules.length} blocked behaviours</span>
                      </span>
                      <span className={`create-custom-profile-dialog__policy-stat ${ck.textSuccess}`}>
                        <Icon name="check-bold" size={16} lengthUnit="px" aria-hidden />
                        <span>{allowedRules.length} allowed behaviours</span>
                      </span>
                      <span className={`create-custom-profile-dialog__policy-stat ${ck.textWarning}`}>
                        <Icon name="search-bold" size={16} lengthUnit="px" aria-hidden />
                        <span>{edgeRules.length} edge cases defined</span>
                      </span>
                    </span>
                    <Icon
                      name={policyOverviewOpen ? 'arrow-up-bold' : 'arrow-down-bold'}
                      size={20}
                      lengthUnit="px"
                      aria-hidden
                      className="create-custom-profile-dialog__policy-overview-chevron"
                    />
                  </button>

                  {policyOverviewOpen ? (
                    <div className="create-custom-profile-dialog__policy-overview-body">
                      <PolicyRuleCategoryBlock
                        category="blocked"
                        title="Blocked behaviours"
                        iconName="cancel-bold"
                        iconColorClass={ck.textError}
                        rules={blockedRules}
                        editingRuleKey={editingRuleKey}
                        setEditingRuleKey={setEditingRuleKey}
                        onAdd={() => addRule('blocked')}
                        onUpdateText={(id, text) => updateRuleText('blocked', id, text)}
                        onDelete={(id) => deleteRule('blocked', id)}
                        typoRegular={ck.typo.bodyMidsizeRegular}
                        textClass={ck.text}
                        textMutedClass={ck.textMuted}
                      />
                      <PolicyRuleCategoryBlock
                        category="allowed"
                        title="Allows"
                        iconName="check-bold"
                        iconColorClass={ck.textSuccess}
                        rules={allowedRules}
                        editingRuleKey={editingRuleKey}
                        setEditingRuleKey={setEditingRuleKey}
                        onAdd={() => addRule('allowed')}
                        onUpdateText={(id, text) => updateRuleText('allowed', id, text)}
                        onDelete={(id) => deleteRule('allowed', id)}
                        typoRegular={ck.typo.bodyMidsizeRegular}
                        textClass={ck.text}
                        textMutedClass={ck.textMuted}
                      />
                      <PolicyRuleCategoryBlock
                        category="edge"
                        title="Edge cases"
                        iconName="search-bold"
                        iconColorClass={ck.textWarning}
                        rules={edgeRules}
                        editingRuleKey={editingRuleKey}
                        setEditingRuleKey={setEditingRuleKey}
                        onAdd={() => addRule('edge')}
                        onUpdateText={(id, text) => updateRuleText('edge', id, text)}
                        onDelete={(id) => deleteRule('edge', id)}
                        typoRegular={ck.typo.bodyMidsizeRegular}
                        textClass={ck.text}
                        textMutedClass={ck.textMuted}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button slot="footer-button-secondary" color="default" variant="secondary" size={32} onClick={handleClose}>
        Cancel
      </Button>
      <Button
        slot="footer-button-primary"
        color="accent"
        variant="primary"
        size={32}
        disabled={!canPublish}
        onClick={() => {
          if (!canPublish) return;
          handleClose();
        }}
      >
        Publish
      </Button>
    </Dialog>,
    portalTarget,
  );
}

interface PolicyRuleCategoryBlockProps {
  category: RuleCategory;
  title: string;
  iconName: 'cancel-bold' | 'check-bold' | 'search-bold';
  iconColorClass: string;
  rules: RuleEntry[];
  editingRuleKey: string | null;
  setEditingRuleKey: (key: string | null) => void;
  onAdd: () => void;
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  typoRegular: string;
  textClass: string;
  textMutedClass: string;
}

function PolicyRuleCategoryBlock({
  category,
  title,
  iconName,
  iconColorClass,
  rules,
  editingRuleKey,
  setEditingRuleKey,
  onAdd,
  onUpdateText,
  onDelete,
  typoRegular,
  textClass,
  textMutedClass,
}: PolicyRuleCategoryBlockProps) {
  const hasRules = rules.length > 0;

  return (
    <div className="create-custom-profile-dialog__overview-category">
      {!hasRules ? (
        <div className="create-custom-profile-dialog__overview-category-row">
          <span className={`create-custom-profile-dialog__overview-category-label ${typoRegular} ${textClass}`}>
            <Icon name={iconName} size={18} lengthUnit="px" className={iconColorClass} aria-hidden />
            {title}
          </span>
          <LinkButton type="button" size={14} onClick={onAdd}>
            + Add rule
          </LinkButton>
        </div>
      ) : (
        <div className="create-custom-profile-dialog__rules-panel">
          <div className="create-custom-profile-dialog__rules-panel-header">
            <span className={`create-custom-profile-dialog__rules-panel-title ${typoRegular} ${textClass}`}>
              <Icon name={iconName} size={18} lengthUnit="px" className={iconColorClass} aria-hidden />
              {title}
            </span>
          </div>
          <ul className="create-custom-profile-dialog__rules-list">
            {rules.map((entry) => {
              const key = ruleKey(category, entry.id);
              const isEditing = editingRuleKey === key;
              return (
                <li key={entry.id} className="create-custom-profile-dialog__rules-list-item">
                  {isEditing ? (
                    <div className="create-custom-profile-dialog__rule-row create-custom-profile-dialog__rule-row--editing">
                      <Input
                        label=""
                        value={entry.text}
                        aria-label={`Edit ${title}`}
                        onInput={(e: Event) =>
                          onUpdateText(entry.id, (e.target as HTMLInputElement & { value?: string }).value ?? '')
                        }
                        onBlur={() => setEditingRuleKey(null)}
                      />
                    </div>
                  ) : (
                    <div className="create-custom-profile-dialog__rule-row">
                      <span className={`${typoRegular} ${textMutedClass}`}>{entry.text}</span>
                      <div className="create-custom-profile-dialog__rule-row-actions">
                        <Button
                          type="button"
                          color="default"
                          variant="tertiary"
                          size={32}
                          prefixIcon="edit-bold"
                          aria-label={`Edit ${title} rule`}
                          onClick={() => setEditingRuleKey(key)}
                        />
                        <Button
                          type="button"
                          color="default"
                          variant="tertiary"
                          size={32}
                          prefixIcon="delete-bold"
                          aria-label={`Delete ${title} rule`}
                          onClick={() => onDelete(entry.id)}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="create-custom-profile-dialog__rules-panel-footer">
            <LinkButton type="button" size={14} onClick={onAdd}>
              + Add rule
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
