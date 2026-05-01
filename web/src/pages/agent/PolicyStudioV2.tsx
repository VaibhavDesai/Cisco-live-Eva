import { useEffect, useState } from 'react';
import { Icon } from '../../icons';
import type { IconName } from '../../icons/types';
import './PolicyStudioV2.css';

/*
 * PolicyStudioV2 — standalone "cross-launched" portal page.
 *
 * Mirrors the Figma Policy Studio (Security Cloud Control) design. Rendered
 * outside the main app shell so it looks like a separate product opened in a
 * new tab.
 */

interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'ai-assets', label: 'AI Assets', icon: 'apps' },
  { id: 'applications', label: 'Applications', icon: 'applications' },
  { id: 'validation', label: 'Validation', icon: 'check-circle' },
  { id: 'policy-studio', label: 'Policy Studio', icon: 'document-create', active: true },
  { id: 'secure', label: 'Secure', icon: 'shield' },
  { id: 'events', label: 'Events', icon: 'alert' },
  { id: 'discovery', label: 'AI App Discovery', icon: 'search-ai' },
  { id: 'scans', label: 'Scans', icon: 'scan' },
  { id: 'administration', label: 'Administration', icon: 'settings' },
];

interface Insight {
  id: string;
  severity: 'critical' | 'medium';
  text: string;
  accept: string;
}

const INSIGHTS: Insight[] = [
  {
    id: 'i1',
    severity: 'critical',
    text: 'Policies with no conditional rules for edge cases often lead to more "needs review" classifications, as the system lacks guidance for ambiguous scenarios.',
    accept:
      'Add conditional rules for common ambiguous patterns, such as hypothetical scenarios, comparative questions, mixed-intent multi-step requests, and educational framing used to seek actionable advice.',
  },
  {
    id: 'i2',
    severity: 'medium',
    text: 'The policy defines only 3 conditional rules (edge cases). Policies with fewer edge case definitions tend to produce more "needs review" classifications during evaluating, as the system lacks guidance for ambiguous scenarios.',
    accept:
      'Add conditional rules for common ambiguous patterns: hypothetical scenarios, comparative questions, multi-step requests that mix allowed and flagged intents, and requests that use educational framing to seek actionable advice.',
  },
];

export default function PolicyStudioV2() {
  // Scope the dark theme to the html element only while this page is mounted
  // so we don't bleed styles into the rest of the SPA when the user navigates
  // back in the same tab.
  useEffect(() => {
    const root = document.documentElement;
    const prevTitle = document.title;
    root.classList.add('psv2-root');
    document.title = 'Policy Studio — Security Cloud Control';
    return () => {
      root.classList.remove('psv2-root');
      document.title = prevTitle;
    };
  }, []);

  const [insightsOpen, setInsightsOpen] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [calloutOpen, setCalloutOpen] = useState(true);

  const visibleInsights = INSIGHTS.filter((i) => !dismissed.has(i.id));

  return (
    <div className="psv2-shell">
      <TopBar />
      <div className="psv2-body">
        <SideNav />
        <div className="psv2-main">
          <MainHeader />
          <div className="psv2-content">
            <Assistant
              calloutOpen={calloutOpen}
              onCloseCallout={() => setCalloutOpen(false)}
            />
            <div className="psv2-details">
              <div className="psv2-details__header">
                <div className="psv2-details__title">Policy details</div>
                <button type="button" className="psv2-details__link">
                  View source text
                </button>
              </div>
              <p className="psv2-details__desc">
                This guardrail stops the AI from giving personalized financial or
                investment advice, protects sensitive customer data, and forces
                escalation to human advisors when needed.
              </p>

              <div className="psv2-status-grid">
                <StatusCard
                  title="Status"
                  pill={<span className="psv2-pill psv2-pill--version">v1 → v2</span>}
                  body="Updated profile based on your files. The policy profile now includes specific guardrails informed by your uploaded files."
                />
                <StatusCard
                  title="Insights"
                  pill={<span className="psv2-pill psv2-pill--warning">Review needed</span>}
                  body={`${visibleInsights.length} insights generated. Please review them`}
                />
                <StatusCard
                  title="Evaluation"
                  pill={<Icon name="info-circle" size={14} />}
                  body="Policy not evaluated"
                />
              </div>

              <div className={`psv2-insights${insightsOpen ? ' psv2-insights--open' : ''}`}>
                <button
                  type="button"
                  className="psv2-insights__header"
                  onClick={() => setInsightsOpen((p) => !p)}
                  aria-expanded={insightsOpen}
                >
                  <span className="psv2-insights__header-left">
                    <span className="psv2-insights__header-icon">
                      <Icon name="sparkle" size={16} />
                    </span>
                    {visibleInsights.length} Policy insights discovered
                  </span>
                  <span className="psv2-insights__chevron">
                    <Icon name="arrow-down" size={16} />
                  </span>
                </button>

                {insightsOpen && (
                  <div className="psv2-insights__list">
                    {visibleInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onDismiss={() =>
                          setDismissed((prev) => {
                            const next = new Set(prev);
                            next.add(insight.id);
                            return next;
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Top bar ─────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="psv2-topbar">
      <div className="psv2-topbar__left">
        <svg
          className="psv2-topbar__logo"
          viewBox="0 0 60 18"
          fill="none"
          aria-hidden="true"
        >
          {[0, 10, 20, 30, 40, 50].map((x, i) => {
            const h = [6, 10, 14, 14, 10, 6][i];
            const y = (18 - h) / 2;
            return (
              <rect
                key={x}
                x={x}
                y={y}
                width="4"
                height={h}
                fill="#6ab4ff"
                rx="1"
              />
            );
          })}
        </svg>
        <span className="psv2-topbar__brand">Security Cloud Control</span>
      </div>
      <div className="psv2-topbar__right">
        <button type="button" className="psv2-topbar__icon-btn" aria-label="Search">
          <Icon name="search" size={18} />
        </button>
        <button type="button" className="psv2-topbar__icon-btn" aria-label="Help">
          <Icon name="help-circle" size={18} />
        </button>
        <button
          type="button"
          className="psv2-topbar__icon-btn"
          aria-label="Notifications"
        >
          <Icon name="alert" size={18} />
          <span className="psv2-topbar__notification-dot" aria-hidden="true" />
        </button>
        <button type="button" className="psv2-topbar__user">
          <span className="psv2-topbar__avatar">A</span>
          <span className="psv2-topbar__user-meta">
            <span>Admin</span>
            <span className="psv2-topbar__user-role">FinCorp</span>
          </span>
          <Icon name="arrow-down" size={12} />
        </button>
      </div>
    </header>
  );
}

/* ── Side nav ────────────────────────────────────────────────────── */

function SideNav() {
  return (
    <aside className="psv2-sidenav" aria-label="AI Defense navigation">
      <div className="psv2-sidenav__hamburger" aria-hidden="true">
        <Icon name="list-menu" size={18} />
      </div>
      <div className="psv2-sidenav__org">
        <span className="psv2-sidenav__org-icon" aria-hidden="true">
          <Icon name="company" size={16} />
        </span>
        <span className="psv2-sidenav__org-name">Acme Corp</span>
      </div>
      <button type="button" className="psv2-sidenav__platform-link">
        ← Platform menu
      </button>
      <div className="psv2-sidenav__section-label">AI Defense</div>
      <div className="psv2-sidenav__items">
        {NAV_ITEMS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className={`psv2-sidenav__item${item.active ? ' psv2-sidenav__item--active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
          >
            <span className="psv2-sidenav__item-icon">
              <Icon name={item.icon} size={22} weight={item.active ? 'bold' : 'regular'} />
            </span>
            <span className="psv2-sidenav__item-label">{item.label}</span>
            {idx === 3 && <hr className="psv2-sidenav__divider" />}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ── Main content header ─────────────────────────────────────────── */

function MainHeader() {
  return (
    <div className="psv2-main__header">
      <div className="psv2-breadcrumbs">
        <button
          type="button"
          className="psv2-backlink"
          onClick={() => window.close()}
        >
          <Icon name="arrow-left" size={14} />
          Policy Studio
        </button>
        <span className="psv2-title">
          No financial advice
          <button
            type="button"
            className="psv2-title__edit"
            aria-label="Rename policy"
          >
            <Icon name="edit" size={14} />
          </button>
        </span>
        <button type="button" className="psv2-version-pill">
          v2 (current)
          <Icon name="arrow-down" size={12} />
        </button>
        <button type="button" className="psv2-history-link">
          <Icon name="recents" size={14} />
          View history
        </button>
      </div>
      <button type="button" className="psv2-publish-btn">
        Publish
      </button>
    </div>
  );
}

/* ── Assistant panel ─────────────────────────────────────────────── */

interface AssistantProps {
  calloutOpen: boolean;
  onCloseCallout: () => void;
}

function Assistant({ calloutOpen, onCloseCallout }: AssistantProps) {
  return (
    <div className="psv2-assistant">
      <div className="psv2-assistant__header">Policy Studio Assistant</div>
      <div className="psv2-assistant__thread">
        <div className="psv2-message">
          <div className="psv2-message__head">
            <span className="psv2-message__avatar">
              <Icon name="bot" size={14} />
            </span>
            <span className="psv2-message__name">Policy studio</span>
            <span className="psv2-message__time">11:05 am</span>
          </div>
          <div className="psv2-message__body">
            {'Updated policy '}
            <strong>No Financial Advice (v2)</strong>
            {'\n'}I've updated the policy based on your files. The policy now
            includes specific guardrails informed by your uploaded files.
            {'\n\n'}
            This update adds{' '}
            <strong>
              3 new blocks, 1 allowed behaviour, and 4 conditional rules
            </strong>{' '}
            to better align with your compliance requirements.
            {'\n\n'}
            You can continue refining the policy by providing additional prompts
            or uploading more files, or you can run the analysis mode to further
            enhance the policy based on insights discovered.
          </div>
        </div>

        <div className="psv2-message">
          <div className="psv2-message__head">
            <span className="psv2-message__avatar">
              <Icon name="bot" size={14} />
            </span>
            <span className="psv2-message__name">Policy studio</span>
            <span className="psv2-message__time">11:05 am</span>
          </div>
          <div className="psv2-message__body">
            ✅ Analysis complete. <strong>2 policy insight discovered.</strong>{' '}
            You can review them in the Insights panel on the right and
            accept/dismiss them to refine the policy.
          </div>
        </div>

        {calloutOpen && (
          <div className="psv2-callout">
            <div className="psv2-callout__header">
              Review insights
              <button
                type="button"
                className="psv2-callout__close"
                onClick={onCloseCallout}
                aria-label="Dismiss review insights callout"
              >
                <Icon name="cancel" size={14} />
              </button>
            </div>
            <div className="psv2-callout__body">
              Agree or disagree with the insights on the right side to refine
              your profile and better align it with your intent. Choose dismiss
              to ignore the insight without making any changes.
            </div>
            <button
              type="button"
              className="psv2-version-pill psv2-callout__cta"
              disabled
            >
              <Icon name="sparkle" size={14} />
              Rewrite policy (0 insights reviewed)
            </button>
          </div>
        )}
      </div>

      <div className="psv2-composer">
        <div className="psv2-composer__box">
          <textarea
            className="psv2-composer__input"
            placeholder="Describe your policy profile requirements…"
          />
          <div className="psv2-composer__actions">
            <button
              type="button"
              className="psv2-composer__attach"
              aria-label="Attach file"
            >
              <Icon name="attachment" size={16} />
            </button>
            <button
              type="button"
              className="psv2-composer__send"
              aria-label="Send message"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
        <div className="psv2-composer__footnote">
          AI can make mistakes. Verify responses.
        </div>
      </div>
    </div>
  );
}

/* ── Status card ─────────────────────────────────────────────────── */

interface StatusCardProps {
  title: string;
  pill: React.ReactNode;
  body: string;
}

function StatusCard({ title, pill, body }: StatusCardProps) {
  return (
    <div className="psv2-status-card">
      <div className="psv2-status-card__header">
        <span className="psv2-status-card__title">{title}</span>
        {pill}
      </div>
      <div className="psv2-status-card__body">{body}</div>
    </div>
  );
}

/* ── Insight card ────────────────────────────────────────────────── */

interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
}

function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const pillClass =
    insight.severity === 'critical' ? 'psv2-pill--critical' : 'psv2-pill--medium';
  const pillLabel = insight.severity === 'critical' ? 'Critical' : 'Medium';

  const accept = expanded
    ? insight.accept
    : insight.accept.length > 180
      ? insight.accept.slice(0, 180).trimEnd() + '…'
      : insight.accept;

  return (
    <div className="psv2-insight-card">
      <div className="psv2-insight-card__top">
        <span className={`psv2-pill ${pillClass}`}>{pillLabel}</span>
        <button
          type="button"
          className="psv2-insight-card__dismiss"
          onClick={onDismiss}
        >
          <Icon name="cancel" size={14} />
          Dismiss
        </button>
      </div>
      <div className="psv2-insight-card__text">{insight.text}</div>
      <div className="psv2-insight-card__accept">
        <strong>Accept this insight to:</strong> {accept}{' '}
        {insight.accept.length > 180 && (
          <button
            type="button"
            className="psv2-insight-card__see-more"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>
      <div className="psv2-insight-card__prompt">
        Choose a verdict below. You can optionally add a comment to provide the
        AI with additional context.
      </div>
      <input
        type="text"
        className="psv2-insight-card__comment"
        placeholder="Add comment (optional)"
      />
      <div className="psv2-insight-card__actions">
        <button type="button">Agree</button>
        <button type="button">Disagree</button>
      </div>
    </div>
  );
}
