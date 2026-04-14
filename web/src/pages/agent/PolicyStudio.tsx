import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Badge, Dropdown, Input, Modal, ModalHeader, ModalFooter } from '../../components/shared';
import { Icon } from '../../icons';
import Illustration from '../../components/shared/Illustration';
import { sendPolicyChat } from '../../api/ciscoAi';
import type { ChatMessage } from '../../api/ciscoAi';

/* ── Types ── */

interface PolicyMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface PolicyRule {
  text: string;
}

export interface PolicyOverview {
  blocked: PolicyRule[];
  allowed: PolicyRule[];
  edgeCases: PolicyRule[];
}

export type PublishMode = 'new' | 'override' | 'new-version';

export interface PolicyStudioResult {
  name: string;
  description: string;
  overview: PolicyOverview;
  publishMode: PublishMode;
}

export interface PolicyVersionOption {
  value: string;
  label: string;
}

interface PolicyStudioProps {
  onClose: () => void;
  onPublish: (result: PolicyStudioResult) => void;
  initialData?: Omit<PolicyStudioResult, 'publishMode'>;
  versionOptions?: PolicyVersionOption[];
}

type OverviewKey = 'blocked' | 'allowed' | 'edgeCases';

const SUGGESTED_PROMPTS = [
  'Upload samples or documents to refine policy',
  'Analyze policy to identify improvement opportunities',
  'Evaluate policy efficiency',
];

/* ── Inline-editable rule item ── */

function EditableRule({
  text,
  onSave,
  onDelete,
}: {
  text: string;
  onSave: (newText: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== text) onSave(trimmed);
    else setDraft(text);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="ps-rule-item ps-rule-item--editing">
        <input
          ref={inputRef}
          className="ps-rule-inline-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(text); setEditing(false); } }}
        />
      </li>
    );
  }

  return (
    <li className="ps-rule-item">
      <span className="ps-rule-item__text">{text}</span>
      <span className="ps-rule-item__actions">
        <button className="ps-rule-action" aria-label="Edit rule" onClick={() => setEditing(true)}>
          <Icon name="edit" size={14} />
        </button>
        <button className="ps-rule-action ps-rule-action--delete" aria-label="Delete rule" onClick={onDelete}>
          <Icon name="delete" size={14} />
        </button>
      </span>
    </li>
  );
}

/* ── Clamped card body with "Show all" toggle ── */

function ClampedCardBody({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  });

  return (
    <div className={`ps-status-card-body ${expanded ? 'ps-status-card-body--expanded' : 'ps-status-card-body--clamped'}`}>
      <p className="ps-status-card-text" ref={textRef}>{children}</p>
      {(overflows || expanded) && (
        <button className="link link--standalone link--sm ps-status-card-show-all" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show all'}
        </button>
      )}
    </div>
  );
}

/* ── Component ── */

export default function PolicyStudio({ onClose, onPublish, initialData, versionOptions }: PolicyStudioProps) {
  const isEditing = !!initialData;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [policyName, setPolicyName] = useState(initialData?.name ?? '');
  const [policyDescription, setPolicyDescription] = useState(initialData?.description ?? '');
  const [overview, setOverview] = useState<PolicyOverview>(initialData?.overview ?? { blocked: [], allowed: [], edgeCases: [] });
  const versions = versionOptions && versionOptions.length > 0
    ? versionOptions
    : [{ value: 'v1', label: 'v1 (current)' }];
  const [selectedVersion, setSelectedVersion] = useState(versions[versions.length - 1]?.value ?? 'v1');
  const [statusMessage, setStatusMessage] = useState(initialData ? 'The profile now covers discovered patterns and improved general detection based on your insights verdicts.' : 'Waiting for your first prompt to generate a policy.');
  const [messages, setMessages] = useState<PolicyMessage[]>(() => {
    if (!initialData) return [];
    return [{
      id: 'msg-init',
      role: 'assistant' as const,
      text: `Loaded policy **${initialData.name}**. I understand the current rules — tell me what you'd like to change and I'll update them.`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
    }];
  });
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [insightsText, setInsightsText] = useState<string | null>(null);
  const [evaluationText, setEvaluationText] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(policyDescription);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDescriptionDraft(policyDescription); }, [policyDescription]);
  useEffect(() => { if (editingDescription) descInputRef.current?.focus(); }, [editingDescription]);

  const updateRule = (section: OverviewKey, index: number, newText: string) => {
    setOverview(prev => ({
      ...prev,
      [section]: prev[section].map((r, i) => i === index ? { text: newText } : r),
    }));
  };

  const deleteRule = (section: OverviewKey, index: number) => {
    setOverview(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const addRule = (section: OverviewKey) => {
    setOverview(prev => ({
      ...prev,
      [section]: [...prev[section], { text: 'New rule — click to edit' }],
    }));
  };

  const commitDescription = () => {
    const trimmed = descriptionDraft.trim();
    if (trimmed) setPolicyDescription(trimmed);
    else setDescriptionDraft(policyDescription);
    setEditingDescription(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, processing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || processing) return;

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    const userMsg: PolicyMessage = { id: `msg-${Date.now()}`, role: 'user', text: content, timestamp: now };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setProcessing(true);

    try {
      const chatHistory: ChatMessage[] = [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.text })),
        { role: 'user' as const, content },
      ];

      const existingContext = initialData ? {
        name: policyName || initialData.name,
        description: policyDescription || initialData.description,
        overview: overview.blocked.length > 0 ? overview : initialData.overview,
      } : undefined;

      const result = await sendPolicyChat(chatHistory, existingContext);

      if (result.name && !policyName) setPolicyName(result.name);
      if (result.description) setPolicyDescription(result.description);
      if (result.overview) {
        setOverview(result.overview);
        setStatusMessage('The profile now covers discovered patterns and improved general detection based on your insights verdicts.');
      }
      if (result.insights) setInsightsText(result.insights);
      if (result.evaluation) setEvaluationText(result.evaluation);

      const assistantMsg: PolicyMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Something went wrong';
      const errorMsg: PolicyMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: `**Error:** ${errMessage}\n\nPlease try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setProcessing(false);
    }
  }, [inputText, processing, policyName, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePublish = () => {
    if (!policyName) return;
    if (isEditing) {
      setShowPublishDialog(true);
    } else {
      onPublish({ name: policyName, description: policyDescription, overview, publishMode: 'new' });
    }
  };

  const handlePublishConfirm = (mode: 'override' | 'new-version') => {
    setShowPublishDialog(false);
    onPublish({ name: policyName, description: policyDescription, overview, publishMode: mode });
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      const boldReplaced = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: boldReplaced || '&nbsp;' }} />;
    });
  };

  return createPortal(
    <div className="fpmodal-overlay">
      <div className="fpmodal" role="dialog" aria-modal="true" aria-label="Policy Studio">

        {/* Header */}
        <div className="fpmodal-header">
          <div className="fpmodal-header__left">
            <h1 className="fpmodal-title">{isEditing ? 'Edit custom profile' : 'Create custom profile'}</h1>
            <div className="ps-header-row">
              <Input
                label="Policy name"
                required
                className="ps-name-input"
                value={policyName}
                onChange={e => setPolicyName(e.target.value)}
                placeholder="Enter policy name"
              />
              {isEditing && (
                <>
                  <Dropdown
                    label="Version"
                    options={versions}
                    value={selectedVersion}
                    onChange={setSelectedVersion}
                    size="compact"
                    className="ps-version-dropdown"
                  />
                  <button className="ps-history-btn">
                    <Icon name="recents" size={16} />
                    <span>View history</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <button className="fpmodal-close" onClick={onClose} aria-label="Close">
            <Icon name="cancel" weight="bold" size={32} />
          </button>
        </div>

        {/* Body — two-panel layout inside fpmodal-body */}
        <div className="fpmodal-body ps-body">
          {/* Left panel — Chat */}
          <div className="ps-chat">
            <h2 className="ps-panel-title">Policy Studio Assistant</h2>

            <div className="ps-messages">
              {messages.length === 0 && !processing && (
                <div className="ps-empty">
                  <p>Describe your policy requirements to get started. The AI assistant will generate a guardrail profile based on your description.</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`ps-msg ps-msg--${msg.role}`}>
                  <div className="ps-msg-header">
                    {msg.role === 'user' ? (
                      <div className="ps-msg-avatar ps-msg-avatar--user"><Icon name="person" weight="bold" size={14} /></div>
                    ) : (
                      <div className="ps-msg-avatar ps-msg-avatar--ai"><Icon name="bot" weight="bold" size={14} /></div>
                    )}
                    <span className="ps-msg-sender">{msg.role === 'user' ? 'You' : 'Policy studio'}</span>
                    <span className="ps-msg-time">{msg.timestamp}</span>
                  </div>
                  <div className="ps-msg-body">{renderMarkdown(msg.text)}</div>
                </div>
              ))}

              {processing && (
                <div className="ps-msg ps-msg--assistant">
                  <div className="ps-msg-header">
                    <div className="ps-msg-avatar ps-msg-avatar--ai"><Icon name="bot" weight="bold" size={14} /></div>
                    <span className="ps-msg-sender">Policy studio</span>
                  </div>
                  <div className="ps-msg-body ps-msg-body--processing">
                    <span className="ps-typing-dot" />
                    <span className="ps-typing-dot" />
                    <span className="ps-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length > 0 && !processing && (
              <div className="ps-suggestions">
                <span className="ps-suggestions-label">Suggested next steps:</span>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button key={i} className="ps-suggestion" onClick={() => handleSend(prompt)}>{prompt}</button>
                ))}
              </div>
            )}

            <div className="ps-input-area">
              <div className="ps-input-row">
                <textarea
                  ref={textareaRef}
                  className="ps-textarea"
                  placeholder="Describe your policy requirements"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={processing}
                />
                <div className="ps-input-actions">
                  <button className="ps-attach-btn" aria-label="Attach file"><Icon name="attachment" size={20} /></button>
                  <button
                    className="ps-send-btn"
                    disabled={!inputText.trim() || processing}
                    aria-label="Send"
                    onClick={() => handleSend()}
                  >
                    <Icon name="send" weight="bold" size={18} />
                  </button>
                </div>
              </div>
              <p className="ps-disclaimer">AI can make mistakes. Verify responses.</p>
            </div>
          </div>

          {/* Right panel — Policy details */}
          <div className="ps-details">
            <div className="ps-details-header">
              <h2 className="ps-panel-title">Policy details</h2>
              {policyDescription && <button className="ps-source-link">View source text</button>}
            </div>

            {!policyDescription ? (
              <div className="ps-details-empty">
                <Illustration name="message" size="oneninetwo" variant="empty-primary" width={120} height={120} />
                <p>Policy details will appear here once you create a policy using the assistant.</p>
              </div>
            ) : (
              <>
                {editingDescription ? (
                  <textarea
                    ref={descInputRef}
                    className="ps-description ps-description--editing"
                    value={descriptionDraft}
                    onChange={e => setDescriptionDraft(e.target.value)}
                    onBlur={commitDescription}
                    onKeyDown={e => { if (e.key === 'Escape') { setDescriptionDraft(policyDescription); setEditingDescription(false); } }}
                    rows={3}
                  />
                ) : (
                  <p className="ps-description ps-description--editable" onClick={() => setEditingDescription(true)}>
                    {policyDescription}
                    <span className="ps-description__edit-hint"><Icon name="edit" size={14} /></span>
                  </p>
                )}

                <div className="ps-status-cards">
                  <div className="ps-status-card">
                    <div className="ps-status-card-header">
                      <span className="ps-status-card-title">Status</span>
                      <Badge variant="default">{selectedVersion}</Badge>
                    </div>
                    <ClampedCardBody>{statusMessage}</ClampedCardBody>
                  </div>
                  <div className={`ps-status-card${insightsText ? '' : ' ps-status-card--empty'}`}>
                    <div className="ps-status-card-header">
                      <span className="ps-status-card-title">Insights</span>
                      {insightsText && <Icon name="check-circle" size={16} style={{ color: 'var(--success-color)' }} />}
                    </div>
                    {insightsText ? (
                      <ClampedCardBody>{insightsText}</ClampedCardBody>
                    ) : (
                      <div className="ps-status-card-body">
                        <p className="ps-status-card-text ps-status-card-text--empty">
                          Use the assistant to analyze your policy and discover patterns.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={`ps-status-card${evaluationText ? '' : ' ps-status-card--empty'}`}>
                    <div className="ps-status-card-header">
                      <span className="ps-status-card-title">Evaluation</span>
                      {evaluationText && <Icon name="check-circle" size={16} style={{ color: 'var(--success-color)' }} />}
                    </div>
                    {evaluationText ? (
                      <ClampedCardBody>{evaluationText}</ClampedCardBody>
                    ) : (
                      <div className="ps-status-card-body">
                        <p className="ps-status-card-text ps-status-card-text--empty">
                          Use the assistant to evaluate your policy's coverage and quality.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ps-overview">
                  <button className="ps-overview-toggle" onClick={() => setOverviewExpanded(!overviewExpanded)}>
                    <div className="ps-overview-toggle-row">
                      <span className="ps-overview-title">Policy overview</span>
                      <Icon name={overviewExpanded ? 'arrow-up' : 'arrow-down'} size={16} />
                    </div>
                    <div className="ps-overview-badges">
                      <span className="ps-overview-stat ps-overview-stat--blocked">
                        <Icon name="blocked" size={14} />
                        {overview.blocked.length} blocked behaviours
                      </span>
                      <span className="ps-overview-stat ps-overview-stat--allowed">
                        <Icon name="check-circle" size={14} />
                        {overview.allowed.length} allowed behaviours
                      </span>
                      <span className="ps-overview-stat ps-overview-stat--edge">
                        <Icon name="search" size={14} />
                        {overview.edgeCases.length} edge cases defined
                      </span>
                    </div>
                  </button>

                  {overviewExpanded && (
                    <div className="ps-overview-body">
                      <div className="ps-rule-section">
                        <div className="ps-rule-heading">
                          <Icon name="blocked" size={14} style={{ color: 'var(--mds-color-theme-text-error-normal, #fc8b98)' }} />
                          <span>Blocked behaviours</span>
                        </div>
                        <ul className="ps-rule-list">
                          {overview.blocked.map((r, i) => (
                            <EditableRule key={i} text={r.text} onSave={t => updateRule('blocked', i, t)} onDelete={() => deleteRule('blocked', i)} />
                          ))}
                        </ul>
                        <button className="ps-add-rule" onClick={() => addRule('blocked')}>
                          <Icon name="plus" size={14} /><span>Add rule</span>
                        </button>
                      </div>
                      <div className="ps-rule-section">
                        <div className="ps-rule-heading">
                          <Icon name="check-circle" size={16} className="ps-rule-icon--allowed" />
                          <span>Allows</span>
                        </div>
                        <ul className="ps-rule-list">
                          {overview.allowed.map((r, i) => (
                            <EditableRule key={i} text={r.text} onSave={t => updateRule('allowed', i, t)} onDelete={() => deleteRule('allowed', i)} />
                          ))}
                        </ul>
                        <button className="ps-add-rule" onClick={() => addRule('allowed')}>
                          <Icon name="plus" size={14} /><span>Add rule</span>
                        </button>
                      </div>
                      <div className="ps-rule-section">
                        <div className="ps-rule-heading">
                          <Icon name="search" size={16} className="ps-rule-icon--edge" />
                          <span>Edge cases</span>
                        </div>
                        <ul className="ps-rule-list">
                          {overview.edgeCases.map((r, i) => (
                            <EditableRule key={i} text={r.text} onSave={t => updateRule('edgeCases', i, t)} onDelete={() => deleteRule('edgeCases', i)} />
                          ))}
                        </ul>
                        <button className="ps-add-rule" onClick={() => addRule('edgeCases')}>
                          <Icon name="plus" size={14} /><span>Add rule</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer — uses fpmodal-footer layout */}
        <div className="fpmodal-footer">
          <div className="fpmodal-footer-divider" />
          <div className="fpmodal-footer-bar">
            <div className="fpmodal-footer__actions">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button disabled={!policyName} onClick={handlePublish}>
                <Icon name="alert" weight="bold" size={16} />
                {isEditing ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>

        {showPublishDialog && (
          <Modal size="sm" onClose={() => setShowPublishDialog(false)}>
            <ModalHeader
              title="Save changes"
              description={`A new version will be saved as "${policyName} ${selectedVersion}". You can also override the existing version.`}
              onClose={() => setShowPublishDialog(false)}
            />
            <ModalFooter>
              <Button variant="tertiary" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => handlePublishConfirm('override')}>Override</Button>
              <Button onClick={() => handlePublishConfirm('new-version')}>Save new version</Button>
            </ModalFooter>
          </Modal>
        )}

      </div>
    </div>,
    document.body,
  );
}
