import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Banner, Button, Dialog, Icon } from '../momentum';
import { AIDefenseBadge } from './AIDefenseBadge';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import type { AdvancedRailState, StandardRailId, StandardRailState } from '../security-tab-data';
import {
  STANDARD_RAILS,
  TOTAL_ADVANCED_RAILS,
  createDefaultAdvancedStates,
  createDefaultStandardStates,
} from '../security-tab-data';
import { StandardGuardrailsPanel } from './StandardGuardrailsPanel';
import { AdvancedGuardrailsPanel } from './AdvancedGuardrailsPanel';
import { AgentTabPanelHeader } from './AgentTabPanelHeader';

type Panel = 'standard' | 'advanced';

export function SecurityTabContent() {
  const [activePanel, setActivePanel] = useState<Panel>('standard');
  const [showBanner, setShowBanner] = useState(true);

  const [standardRails, setStandardRails] = useState(createDefaultStandardStates);
  const [advancedRails, setAdvancedRails] = useState(createDefaultAdvancedStates);

  const [advancedConfirmed, setAdvancedConfirmed] = useState(false);
  const [pendingAdvancedRailId, setPendingAdvancedRailId] = useState<string | null>(null);

  const standardEnabledCount = STANDARD_RAILS.filter((r) => standardRails[r.id].enabled).length;
  const advancedEnabledCount = Object.values(advancedRails).filter((r) => r.enabled).length;

  const handleStandardChange = (id: StandardRailId, next: StandardRailState) => {
    setStandardRails((prev) => ({ ...prev, [id]: next }));
  };

  const handleAdvancedRailChange = (railId: string, next: AdvancedRailState) => {
    const prev = advancedRails[railId];
    if (!prev) return;

    const enabling = !prev.enabled && next.enabled;
    if (enabling && !advancedConfirmed) {
      setPendingAdvancedRailId(railId);
      return;
    }

    setAdvancedRails((p) => ({ ...p, [railId]: next }));
  };

  const confirmAdvancedEnable = () => {
    if (pendingAdvancedRailId) {
      setAdvancedRails((prev) => ({
        ...prev,
        [pendingAdvancedRailId]: { ...prev[pendingAdvancedRailId], enabled: true },
      }));
    }
    setAdvancedConfirmed(true);
    setPendingAdvancedRailId(null);
  };

  const cancelAdvancedEnable = () => {
    setPendingAdvancedRailId(null);
  };

  return (
    <div className="sec-tab">
      <AgentTabPanelHeader
        title="Security"
        description="Configure protection rules to control agent behavior, enforce safety policies, and prevent misuse."
      />

      {/* Selector cards */}
      <div className="sec-tab__selector">
        <button
          type="button"
          className={`sec-tab__selector-card ${activePanel === 'standard' ? 'sec-tab__selector-card--active' : ''}`}
          onClick={() => setActivePanel('standard')}
        >
          <Icon name="shield-bold" size={20} lengthUnit="px" aria-hidden />
          <div>
            <span className={`text-sm font-semibold ${ck.text}`}>Standard guardrails</span>
            <p className={`text-xs ${ck.textMuted}`}>
              Basic protection with toxicity, harm detection, and jailbreak prevention.
            </p>
            <span className={`text-xs ${ck.textAccent}`}>{standardEnabledCount}/{STANDARD_RAILS.length} enabled</span>
          </div>
        </button>

        <button
          type="button"
          className={`sec-tab__selector-card ${activePanel === 'advanced' ? 'sec-tab__selector-card--active' : ''}`}
          onClick={() => setActivePanel('advanced')}
        >
          <Icon name="settings-bold" size={20} lengthUnit="px" aria-hidden />
          <div>
            <div className="sec-tab__selector-card-title-row">
              <span className={`text-sm font-semibold ${ck.text}`}>Advanced guardrails</span>
              <AIDefenseBadge />
            </div>
            <p className={`text-xs ${ck.textMuted}`}>
              Comprehensive security, privacy, and safety guardrails with custom profiles.
            </p>
            <span className={`text-xs ${ck.textAccent}`}>{advancedEnabledCount}/{TOTAL_ADVANCED_RAILS} enabled</span>
          </div>
        </button>
      </div>

      {/* Observability and Logging banner */}
      {showBanner && (
        <Banner variant="informational" style={{ marginTop: '20px' }}>
          <div slot="leading-text" className="sec-tab__obs-banner-leading">
            <span className={`mds-type-body-midsize-bold ${ck.text}`}>Observability &amp; Logging</span>
            <p className={`mds-type-body-midsize-regular sec-tab__obs-banner-desc ${ck.text}`}>
              All triggered rails are logged in the Sessions view. If a rail is set to &quot;Monitor&quot;, the
              interaction continues but the violation is logged for admin review. If set to &quot;Block&quot;, the
              individual prompt is rejected but the conversation remains active. This allows you to fine-tune
              confidence settings based on real-world data.{' '}
              <Link
                to="/simulated-testing?primaryTab=interactions"
                className={`sec-tab__obs-banner-learn-more ${ck.textAccent}`}
              >
                Learn more
              </Link>
            </p>
          </div>
          <Button
            slot="trailing-actions"
            variant="tertiary"
            color="default"
            size={28}
            prefixIcon="cancel-bold"
            aria-label="Dismiss observability banner"
            onClick={() => setShowBanner(false)}
          />
        </Banner>
      )}

      {/* Panel content */}
      {activePanel === 'standard' && (
        <StandardGuardrailsPanel rails={standardRails} onChange={handleStandardChange} />
      )}

      {activePanel === 'advanced' && (
        <AdvancedGuardrailsPanel rails={advancedRails} onRailChange={handleAdvancedRailChange} />
      )}

      {/* Confirmation dialog — portalled to body so position:absolute centres against the viewport */}
      {createPortal(
        <Dialog
          visible={pendingAdvancedRailId !== null}
          headerText="Enable advanced guardrail?"
          descriptionText="Advanced guardrails are powered by Cisco AI Defense and are billed based on usage. Each enabled rail will incur charges per message scanned. You can review pricing in your organization settings."
          closeButtonAriaLabel="Close dialog"
          onClose={cancelAdvancedEnable}
        >
          <Button slot="footer-button-secondary" color="default" variant="secondary" size={28} onClick={cancelAdvancedEnable}>
            Cancel
          </Button>
          <Button slot="footer-button-primary" color="default" variant="primary" size={28} onClick={confirmAdvancedEnable}>
            Enable
          </Button>
        </Dialog>,
        // Portal inside mdc-iconprovider so its context-request events reach the provider
        // (portalling to document.body puts it outside the provider's subtree, breaking icons)
        document.querySelector('mdc-iconprovider') ?? document.body,
      )}
    </div>
  );
}
