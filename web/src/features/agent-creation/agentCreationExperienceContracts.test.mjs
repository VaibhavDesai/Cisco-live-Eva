import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

test('Observability omits projected exhaustion metrics', () => {
  const metricSource = readSource('../clus-kpi-dashboard/data/phase1ObservabilityMetrics.ts');
  const dashboardSource = readSource('../clus-kpi-dashboard/components/ObservabilityView.tsx');
  const agentDashboardSource = readSource('../clus-kpi-dashboard/components/SingleAgentView.tsx');

  assert.doesNotMatch(metricSource, /Projected (?:voice|message) exhaustion|obs-projection-(?:voice|digital)/);
  assert.doesNotMatch(dashboardSource, /ObservabilityProjectionCard|observabilityProjectionIdForCategory/);
  assert.doesNotMatch(agentDashboardSource, /ObservabilityProjectionCard|observabilityProjectionIdForCategory/);
});

test('Observability and AI Agents share the borderless transparent shell and prioritize Business Impact', () => {
  const layoutSource = readSource('../../components/layout/MainLayout.tsx');
  const studioStyles = readSource('../../products/ai-agent-studio/components.css');
  const observabilityStyles = readSource('../../builder-testing.css');
  const observabilityRootSource = readSource('../clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');
  const observabilityViewSource = readSource('../clus-kpi-dashboard/components/ObservabilityView.tsx');
  const chartSource = readSource('../clus-kpi-dashboard/components/KPIChart.tsx');
  const splunkSource = readSource('../clus-kpi-dashboard/components/SplunkSessionModal.tsx');
  const metricSource = readSource('../clus-kpi-dashboard/data/phase1ObservabilityMetrics.ts');
  const configurationSource = readSource('../clus-kpi-dashboard/observabilityConfiguration.ts');

  assert.match(
    layoutSource,
    /const isAgentTesting[\s\S]*?const isObservability\s*=\s*\/\^\\\/observability[\s\S]*?usesStudioAurora\s*=[\s\S]*?isAgentsList \|\| isAgentOverview \|\| isAgentConfigure \|\| isAgentTesting \|\| isObservability/,
  );
  assert.match(
    studioStyles,
    /\.app--ai--studio-aurora \.primary-content\.ai-agents-page,\s*\.app--ai--studio-aurora \.clus-kpi-dashboard-root\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.5\);[^}]*border:\s*none;/,
    'Observability and AI Agents should share one 50%-opaque black surface without a container border',
  );
  assert.match(
    metricSource,
    /KPI_OBSERVABILITY_CATEGORY_ORDER\s*=\s*\[\s*['"]Business Impact['"]/,
  );
  assert.match(
    configurationSource,
    /pinnedFirstCategory\s*=\s*['"]Business Impact['"][\s\S]*?out:\s*string\[\]\s*=\s*\[pinnedFirstCategory\]/,
    'saved layouts should migrate Business Impact directly below Pinned',
  );
  assert.match(chartSource, /clus-kpi-chart-toolbar[\s\S]*?aria-label="Chart view"[\s\S]*?aria-label="Table view"[\s\S]*?aria-label="Box zoom"[\s\S]*?aria-label="Reset zoom"[\s\S]*?aria-label="View interactions in Splunk"[\s\S]*?<StudioIcon name="launch"/);
  assert.match(
    observabilityStyles,
    /\.clus-kpi-chart-toolbar \.btn-group \.btn\s*\{[^}]*width:\s*32px;[^}]*min-width:\s*32px;[^}]*height:\s*32px;[^}]*padding:\s*0;[^}]*border-radius:\s*50%;/,
    'all chart toolbar icon buttons should render as equal circular controls',
  );
  assert.match(
    observabilityStyles,
    /\.clus-kpi-chart-toolbar \.clus-kpi-splunk-launch\s*\{[^}]*width:\s*32px;[^}]*min-width:\s*32px;[^}]*height:\s*32px;[^}]*padding:\s*0;[^}]*border-radius:\s*50%;/,
    'the Splunk cross-launch should match the circular chart controls',
  );
  assert.match(
    chartSource,
    /className="clus-kpi-splunk-launch"[\s\S]*?onClick=\{\(\) => setSplunkSessionOpen\(true\)\}[\s\S]*?<SplunkSessionModal[\s\S]*?sourceMetric=\{heading\}/,
    'the Splunk control should open the full-page local cross-launch preview',
  );
  assert.doesNotMatch(chartSource, /window\.open\(/);
  assert.match(
    splunkSource,
    /AGENT_NAME = 'EAGLE GREEN VIP Reservations'[\s\S]*?AI goal completion'[\s\S]*?value: 'false'[\s\S]*?Transfer action completed'[\s\S]*?value: 'true'[\s\S]*?AI productivity contribution'[\s\S]*?value: 'false'/,
    'the preview should distinguish a successful handoff from an incomplete AI goal',
  );
  assert.match(
    splunkSource,
    /goal_completion_rate'[\s\S]*?value: '0%'[\s\S]*?contained'[\s\S]*?value: 'false'[\s\S]*?handoff_completed'[\s\S]*?value: 'true'[\s\S]*?fallback_triggered'[\s\S]*?value: 'false'/,
    'session metrics should remain internally consistent with an intentional transfer',
  );
  assert.match(
    splunkSource,
    /action\.check_availability[\s\S]*?150 guests[\s\S]*?control\.large_event_transfer[\s\S]*?Representative session contributing to 77\.9% voice productivity[\s\S]*?human event specialist[\s\S]*?Availability checked/,
    'the trace should connect the early human request to the large-event control and productivity story',
  );
  assert.doesNotMatch(splunkSource, /containment_percentage|fulfilment_success_rate|goal_completion_percentage|AVERAGE/);
  assert.match(
    observabilityStyles,
    /\.splunk-preview-modal\.modal\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100dvh;[^}]*border-radius:\s*0;/,
    'the simulated cross-launch should fill the viewport',
  );
  assert.match(
    observabilityStyles,
    /\.splunk-preview-session-grid\s*\{[^}]*grid-row:\s*4;[\s\S]*?\.splunk-preview-alt-view\s*\{[^}]*grid-row:\s*4;/,
    'all Splunk detail views should occupy the flexible final row so dividers reach the viewport edge',
  );
  assert.match(
    observabilityStyles,
    /\.kpi-card\s*\{[^}]*--kpi-card-surface:\s*color-mix\([\s\S]*?background-solid-primary-normal\) 32%,[\s\S]*?background-glass-normal[\s\S]*?\.kpi-card--glass\s*\{[^}]*background:\s*var\(--kpi-card-surface\);/,
    'metric cards should use a more solid glass surface so the aurora stays behind the data',
  );
  assert.match(
    observabilityRootSource,
    /className="clus-kpi-toolbar[\s\S]*?aria-label="Search metrics"[\s\S]*?aria-label="Date range"/,
    'the dashboard toolbar should retain filters, metric search, and date range controls',
  );
  assert.doesNotMatch(observabilityRootSource, /Customize with Splunk|clus-kpi-splunk-button/);
  assert.doesNotMatch(observabilityViewSource, /Customize with Splunk/);
  assert.doesNotMatch(observabilityStyles, /\.clus-kpi-splunk-button/);
});

test('EAGLE GREEN combines adaptive guardrails and Galileo routing in its session evidence', () => {
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const seedSource = readSource('../../demo/ciscoLiveSeed.ts');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const controlsSource = readSource('../../pages/agent/ActionControls.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');
  const policyStudioSource = readSource('../../pages/agent/SecurityUIPolicyStudio.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const studioStyles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    demoSource,
    /CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL[\s\S]*?id:\s*['"]custom-vip-event-confidentiality['"][\s\S]*?name:\s*['"]VIP event confidentiality['"][\s\S]*?action:\s*['"]block['"][\s\S]*?direction:\s*['"]both['"]/,
  );
  assert.match(
    demoSource,
    /CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL[\s\S]*?id:\s*['"]custom-no-personalized-dietary-alcohol-advice['"][\s\S]*?name:\s*['"]No Personalized Dietary & Alcohol Advice['"][\s\S]*?action:\s*['"]block['"][\s\S]*?direction:\s*['"]response['"]/,
    'the medical-context policy should block unsafe agent responses without blocking the customer prompt',
  );
  assert.match(
    demoSource,
    /CISCO_LIVE_PRIMARY_GUARDRAILS\s*=\s*\[\s*CISCO_LIVE_PAYMENT_DATA_GUARDRAIL,\s*CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL,\s*\]/,
    'the primary seed should contain only the two configured adaptive policies',
  );
  assert.match(
    demoSource,
    /id:\s*CISCO_LIVE_PRIMARY_AGENT_ID[\s\S]*?prebuiltGuardrailIds:\s*\[['"]priv-pii['"],\s*['"]priv-credit-card['"]\]/,
    'the primary seed should enable only prebuilt policies present in the current Security catalog',
  );
  assert.match(
    demoSource,
    /id:\s*CISCO_LIVE_PRIMARY_AGENT_ID[\s\S]*?customGuardrails:\s*CISCO_LIVE_PRIMARY_GUARDRAILS/,
    'EAGLE GREEN should receive the seeded adaptive guardrails',
  );
  assert.match(
    configureSource,
    /ciscoLiveAgent\.customGuardrails\.map\(guardrail => \(\{[\s\S]*?enabled:\s*true/,
    'seeded adaptive guardrails should start enabled',
  );
  assert.match(
    seedSource,
    /markConfigured\(draft\.familyConfiguration,\s*['"]security['"],\s*getCiscoLiveGuardrailNames\(definition\),\s*now\)/,
    'the seeded policy should configure the Overview Security capability',
  );
  assert.match(
    seedSource,
    /['"]Handover['"][\s\S]*?name:\s*['"]Delay human handover until turn 5['"][\s\S]*?behavior:\s*['"]steer['"][\s\S]*?estimated_human_wait_minutes[\s\S]*?field:\s*['"]conversation_turn['"][\s\S]*?operator:\s*['"]less_than['"][\s\S]*?value:\s*5/,
    'the Handover action should nudge requests before turn 5 and expose the human wait estimate',
  );
  assert.match(
    seedSource,
    /EAGLE_GREEN_ACTION_CONTROL_VALUES[\s\S]*?name:\s*['"]Route large event requests to the VIP team['"][\s\S]*?timing:\s*['"]post_tool['"][\s\S]*?behavior:\s*['"]steer['"][\s\S]*?field:\s*['"]party_size['"][\s\S]*?value:\s*100[\s\S]*?field:\s*['"]requested_bays['"][\s\S]*?value:\s*20[\s\S]*?timeWindow:\s*\{\s*field:\s*['"]event_time['"][\s\S]*?start:\s*['"]09:30['"][\s\S]*?end:\s*['"]10:00['"][\s\S]*?prerequisiteControlIds/,
    'the large-event threshold should be stored as an agent control and gate, not a guardrail',
  );
  assert.match(controlsSource, /label:\s*`\$\{activeCount\} active\$\{behavior \? ` · \$\{behavior\}` : ''\}`/);
  assert.match(controlsSource, /Gated · 1 prerequisite/);
  assert.match(controlsSource, /Make this action available only after prerequisites match/);
  assert.match(
    configureSource,
    /customGuardrails:\s*advancedCustomItems[\s\S]*?initialDirection=\{editItem\?\.direction\}[\s\S]*?direction:\s*result\.direction/,
    'adaptive guardrail definitions and Direction should survive save and refresh',
  );
  assert.match(configureSource, /Adaptive guardrails/);
  assert.match(configureSource, /Create guardrail/);
  assert.match(policyStudioSource, /DEFAULT_CUSTOM_GUARDRAIL_NAME\s*=\s*['"]VIP event confidentiality['"]/);
  assert.doesNotMatch(policyStudioSource, /medical advice|healthcare clinic|Large reservation approval/);
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1042['"][\s\S]*?messages:\s*9[\s\S]*?guardrailTriggered:\s*true[\s\S]*?actionControlTriggered:\s*LARGE_EVENT_ACTION_CONTROL\.event\.actionControl\.matched/,
    'the full Kristin conversation should combine payment protection and agent control evidence in one session',
  );
  assert.doesNotMatch(demoSource, /id:\s*['"]SES-GT-1045['"]/);
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1042['"][\s\S]*?connectedSystems:\s*\[['"]VIP customer profile['"],\s*['"]CRM['"],\s*['"]AI Defense['"],\s*['"]Secure payment flow['"],\s*['"]VIP event concierge['"]\]/,
    'the combined session should list every system represented in its transcript',
  );
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1042['"][\s\S]*?text:\s*['"]Hello Kristin! Thank you for being a Super Uber Diamond Elite Golfer\. We truly value your business\. How can we help you today\?['"][\s\S]*?AI Memory: customer profile[\s\S]*?CRM integration/,
    'the combined transcript should preserve the requested memory and CRM evidence',
  );
  assert.match(
    demoSource,
    /id:\s*['"]evt-6['"][\s\S]*?text:\s*['"]For this, we need a credit card down payment\. We have your American Express Centurion Black Card on file, but it is expired\.['"][\s\S]*?time:\s*['"]9:41 AM['"]/,
    'the payment prompt should stop after explaining that the saved card is expired',
  );
  assert.doesNotMatch(
    demoSource,
    /id:\s*['"]evt-6['"][\s\S]*?annotations:\s*\[[\s\S]*?id:\s*['"]evt-7['"]/,
    'the payment prompt should not show a PCI compliance chip',
  );
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1042['"][\s\S]*?id:\s*['"]evt-12['"][\s\S]*?text:\s*['"]That’s quite a crowd! For a group that size, let me get you over to our Events team\. One moment please\./,
    'the large-event handoff should use the approved conversational response',
  );
  assert.match(
    demoSource,
    /title:\s*['"]Payment data protection blocked sensitive input['"][\s\S]*?text:\s*['"]Card details were blocked and redacted before storage\.[\s\S]*?detail:\s*['"]Adaptive guardrail triggered['"]/,
    'the transcript event should identify the payment-data guardrail trigger without retaining the spoken details',
  );
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1029['"][\s\S]*?customer:\s*['"]Marcus Chen['"][\s\S]*?topic:\s*['"]Retirement celebration['"][\s\S]*?messages:\s*5[\s\S]*?outcome:\s*['"]In progress['"][\s\S]*?guardrailTriggered:\s*true[\s\S]*?name:\s*['"]No Personalized Dietary & Alcohol Advice['"]/,
    'the Marcus retirement session should carry the new adaptive guardrail evidence',
  );
  assert.match(
    demoSource,
    /id:\s*['"]SES-GT-1029['"][\s\S]*?text:\s*['"]I’d like a private bay for six this Saturday\. We’re celebrating my father’s retirement\. It’s also his first big outing since heart surgery\.['"][\s\S]*?title:\s*['"]No Personalized Dietary & Alcohol Advice blocked response['"][\s\S]*?text:\s*['"]Personalized dish and alcohol-safety recommendations were blocked before delivery\.['"][\s\S]*?text:\s*['"]I can share the published sodium and nutrition information for our dishes and show you our non-alcoholic beverage options\. I cannot determine which items or amount of alcohol would be safe based on a medical condition or medication\. Once you make your selections, I can add them to the reservation\.['"]/,
    'the blocked draft should be replaced with the approved safe response in Marcus’s transcript',
  );
  assert.match(sessionsSource, /event\.kind === ['"]action_control['"][\s\S]*?Agent control/);
  assert.match(
    sessionsSource,
    /event\.annotations[\s\S]*?<ConfigurationCategoryIcon[\s\S]*?annotation\.kind === ['"]memory['"][\s\S]*?['"]memory['"][\s\S]*?annotation\.kind === ['"]integration['"][\s\S]*?['"]action['"][\s\S]*?['"]guardrail['"]/,
    'session evidence chips should reuse the Configure icons for memory, actions, and guardrails',
  );
  assert.match(sessionsSource, /type="action"[\s\S]*?\{session\.outcome\}/);
  assert.match(sessionsSource, /event\.kind === ['"]action_control['"][\s\S]*?icon="automation"/);
  assert.match(
    sessionsSource,
    /agent-session-detail-title-row[\s\S]*?<h1>\{session\.id\}<\/h1>/,
    'session details should use the Session ID as the page title while the topic stays in the list',
  );
  assert.doesNotMatch(
    sessionsSource,
    /Connected systems|Systems used in this session|agent-session-systems-card/,
    'session details should not render a connected-systems sidebar section',
  );
  assert.match(
    sessionsSource,
    /\{actionControl && actionControlExpanded && \([\s\S]*?agent-session-policy-card--action-control[\s\S]*?<ConfigurationCategoryIcon type="action-control" size=\{20\}[\s\S]*?\{session\.guardrail && guardrailExpanded && \([\s\S]*?<ConfigurationCategoryIcon type="guardrail" size=\{20\}[\s\S]*?Edit guardrail/,
    'the combined session should show both agent control and guardrail evidence cards',
  );
  assert.match(
    studioStyles,
    /\.agent-session-policy-card__header > \.configuration-category-icon:first-child\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;[^}]*flex-basis:\s*32px;/,
    'session policy cards should give the existing 20px icons a roomy 32px wrapper',
  );
  const sessionPolicyIconRule = studioStyles.match(
    /\.agent-session-policy-card__header > \.configuration-category-icon:first-child\s*\{[^}]*\}/,
  )?.[0] ?? '';
  assert.doesNotMatch(
    sessionPolicyIconRule,
    /color:/,
    'session policy icons should inherit their category accent instead of being forced into a warning color',
  );
  assert.match(
    sessionsSource,
    /<h2 id=\{`\$\{ACTION_CONTROL_PANEL_ID\}-heading`\}>[\s\S]*?\{actionControl\.unlockedActionNames\[0\] \?\? actionControl\.controlTitle\}[\s\S]*?<\/h2>/,
    'the session policy card should identify the unlocked action as Transfer to VIP team',
  );
  assert.match(
    sessionsSource,
    /label:\s*['"]View control['"][\s\S]{0,260}onClick:\s*\(\) => showPolicyPanel\(['"]action-control['"]\)[\s\S]{0,180}ariaControls:\s*ACTION_CONTROL_PANEL_ID/,
    'the action-control transcript banner should reveal its matching sidebar evidence',
  );
  assert.match(
    sessionsSource,
    /label:\s*['"]View guardrail['"][\s\S]{0,260}onClick:\s*\(\) => showPolicyPanel\(['"]guardrail['"]\)[\s\S]{0,180}ariaControls:\s*GUARDRAIL_PANEL_ID/,
    'the guardrail transcript banner should reveal its matching sidebar evidence',
  );
  assert.match(
    sessionsSource,
    /target\.focus\(\{ preventScroll: true \}\);[\s\S]*?target\.scrollIntoView\(\{ behavior: ['"]smooth['"], block: ['"]nearest['"] \}\)/,
    'revealed sidebar evidence should receive focus and scroll into view',
  );
  assert.match(sessionsSource, /\{actionControl && actionControlExpanded && \(/);
  assert.match(sessionsSource, /\{session\.guardrail && guardrailExpanded && \(/);
  assert.doesNotMatch(
    sessionsSource,
    /agent-session-policy-card__toggle|Collapse control evidence|Collapse guardrail evidence/,
    'policy evidence should appear as a complete card instead of a collapsed disclosure',
  );
  assert.match(sessionsSource, />\s*Edit control\s*<\/Button>/);
  assert.match(sessionsSource, />\s*Edit guardrail\s*<\/Button>/);
  assert.match(
    sessionsSource,
    /<dt>Event time<\/dt>[\s\S]*?actionControlTimeWindowLabel\(actionControl\)/,
    'the session detail should show that the recorded event time matched the configured window',
  );
  assert.match(
    sessionsSource,
    /onReviewActionControl=\{\(\) => navigate\([\s\S]*?`\/agents\/\$\{agent\.id\}\/configure\?section=Action`/,
    'Review control should open the Actions page without deep-linking into the control editor',
  );
  assert.doesNotMatch(
    sessionsSource,
    /onReviewActionControl=\{[\s\S]{0,240}(?:actionId|controlId)=/,
    'Review control should not pass editor-selection parameters',
  );
  assert.match(
    studioStyles,
    /\.agent-session-metadata-icons\s*>\s*span\s*\{[^}]*color:\s*var\(--mds-color-theme-common-text-primary-normal,\s*#fff\)/,
    'all session metadata icons should use the same white foreground',
  );
  assert.match(
    studioStyles,
    /\.agent-session-detail-header\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1\.65fr\) minmax\(300px, 0\.75fr\);[^}]*padding:\s*0;/,
    'the session detail header should align to the transcript column without adding vertical padding',
  );
  assert.match(
    studioStyles,
    /@media \(max-width:\s*1180px\)[\s\S]*?\.agent-session-detail-header\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/,
    'the session detail header should return to full width with the single-column detail layout',
  );
  assert.match(
    studioStyles,
    /\.agent-session-message--customer\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--bg-secondary\) 78%, transparent\);/,
    'guest transcript messages should use a neutral grey bubble instead of an accent surface',
  );
  assert.match(
    demoSource,
    /createSeededActionControlEvent[\s\S]*?evaluateGalileoActionInvocation[\s\S]*?LARGE_EVENT_ACTION_CONTROL/,
    'seeded session decisions should be generated by the deterministic evaluator',
  );
  assert.match(
    sessionsSource,
    /getSessionActionControlDecision[\s\S]*?session\.transcript\.flatMap[\s\S]*?event\.actionControl/,
    'Session detail should derive its decision from the transcript event',
  );
  assert.doesNotMatch(sessionsSource, /session\.actionControl(?:\?|\.|!)/);
  assert.doesNotMatch(demoSource, /CISCO_LIVE_LARGE_RESERVATION_GUARDRAIL|custom-large-reservation-approval/);
  assert.match(
    overviewSource,
    /const configuredSecurity = configuredCapabilityLabels\(agentDraft,\s*['"]security['"]\)[\s\S]*?const connectedGuardrailActivity = configuredSecurity\.map\(item => \(\{[\s\S]*?getCiscoLiveGuardrailTriggerCount\(item, agent\.id\)/,
    'the Capability usage card should derive guardrail activity from configured Security policies',
  );
  assert.match(
    overviewSource,
    /configuredAdaptiveGuardrailCount\s*=\s*configuredSecurity\.filter[\s\S]*?configuredPrebuiltGuardrailCount\s*=\s*Math\.max\([\s\S]*?configuredSecurity\.length\s*-\s*configuredAdaptiveGuardrailCount/,
    'the Overview should derive its prebuilt and adaptive counts from enabled Security policies',
  );
  assert.match(
    overviewSource,
    /guardrails:\s*configuredSecurity\.length[\s\S]*?`\$\{configuredPrebuiltGuardrailCount\} prebuilt · \$\{configuredAdaptiveGuardrailCount\} adaptive`/,
    'the guardrail total and breakdown should stay synchronized with the enabled configuration',
  );
});

test('EAGLE GREEN upgrades legacy state and normalizes action names', () => {
  const contextSource = readSource('../../contexts/AppContext.tsx');
  const seedSource = readSource('../../demo/ciscoLiveSeed.ts');
  const policyStudioSource = readSource('../../pages/agent/SecurityUIPolicyStudio.tsx');

  assert.match(contextSource, /schemaVersion:\s*14/);
  assert.match(
    contextSource,
    /shouldMigrateLegacyActions\s*=\s*storedSchemaVersion\s*<\s*4[\s\S]*?hasStoredSelections[\s\S]*?hasCheckAvailabilityControls[\s\S]*?!Array\.isArray\(checkAvailabilityControls\)/,
    'schema-3 drafts should receive missing Galileo defaults while explicit empty control arrays remain intact',
  );
  assert.match(
    contextSource,
    /shouldMigrateHandoverAction\s*=\s*storedSchemaVersion\s*<\s*9[\s\S]*?!normalizedSelections\.includes\(['"]Handover['"]\)[\s\S]*?EAGLE_GREEN_HANDOVER_ACTION_ID/,
    'schema-8 drafts should receive the Handover action and its seeded control',
  );
  assert.match(
    contextSource,
    /shouldMigrateHandoverTurnRule\s*=\s*storedSchemaVersion\s*<\s*10[\s\S]*?control\.id === EAGLE_GREEN_HANDOVER_CONTROL_ID[\s\S]*?structuredClone\(seededHandoverControl\)/,
    'schema-9 drafts should receive the turn-based Handover rule',
  );
  assert.match(
    contextSource,
    /shouldMigrateCheckAvailabilityName\s*=\s*storedSchemaVersion\s*<\s*6[\s\S]*?item === ['"]Check Availability\.['"][\s\S]*?return ['"]Check Availability['"]/,
    'schema-5 drafts should normalize the Check Availability display name without changing its stable action ID',
  );
  assert.match(
    contextSource,
    /shouldMigrateLargeEventControlTiming\s*=\s*storedSchemaVersion\s*<\s*7[\s\S]*?control\.id === EAGLE_GREEN_ACTION_CONTROL_ID[\s\S]*?nextControl\.timing = seededLargeEventControl\.timing/,
    'schema-6 drafts should migrate only the canonical large-event control to post-action timing',
  );
  assert.match(
    contextSource,
    /shouldMigrateLargeEventControlMatchMode\s*=\s*storedSchemaVersion\s*<\s*8[\s\S]*?control\.id === EAGLE_GREEN_ACTION_CONTROL_ID[\s\S]*?nextControl\.matchMode = seededLargeEventControl\.matchMode/,
    'schema-7 drafts should restore the canonical large-event control to OR matching',
  );
  assert.match(
    contextSource,
    /LEGACY_LARGE_RESERVATION_GUARDRAIL_ID\s*=\s*['"]custom-large-reservation-approval['"][\s\S]*?LEGACY_LARGE_RESERVATION_GUARDRAIL_NAME\s*=\s*['"]large reservation approval['"]/,
  );
  assert.match(
    contextSource,
    /migrateStoredCustomGuardrails\([\s\S]*?securityValues\.customGuardrails,[\s\S]*?shouldAddPersonalizedDietaryAlcoholGuardrail,[\s\S]*?shouldRemoveVipEventConfidentialityGuardrail[\s\S]*?customGuardrails:\s*customGuardrailsMigration\.value/,
    'stored adaptive guardrail objects should migrate during AppContext hydration',
  );
  assert.match(
    contextSource,
    /shouldRemoveVipEventConfidentialityGuardrail\s*=\s*storedSchemaVersion\s*<\s*14/,
    'schema-13 drafts should opt into the retired-policy migration',
  );
  assert.match(
    contextSource,
    /removeVipEventConfidentialityGuardrail[\s\S]*?value\.filter\(item\s*=>\s*\([\s\S]*?!isLegacyLargeReservationGuardrail\(item\)[\s\S]*?!isCurrentVipConfidentialityGuardrail\(item\)/,
    'schema-13 drafts should remove only the retired VIP policy and its legacy predecessor',
  );
  assert.match(
    contextSource,
    /RETIRED_PRIMARY_PREBUILT_GUARDRAIL_NAMES\s*=\s*new Set\(\[['"]toxicity['"],\s*['"]jailbreak['"]\]\)[\s\S]*?!RETIRED_PRIMARY_PREBUILT_GUARDRAIL_NAMES\.has\(normalizedItem\)/,
    'schema-13 drafts should also remove prebuilt selections that the current catalog cannot enable',
  );
  assert.match(
    contextSource,
    /shouldAddPersonalizedDietaryAlcoholGuardrail\s*=\s*storedSchemaVersion\s*<\s*11/,
    'schema-10 drafts should opt into the new adaptive-guardrail migration',
  );
  assert.match(
    contextSource,
    /addPersonalizedDietaryAlcoholGuardrail[\s\S]*?!migrated\.some\(isCurrentPersonalizedDietaryAlcoholGuardrail\)[\s\S]*?structuredClone\(CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL\)[\s\S]*?enabled:\s*true/,
    'schema-10 drafts should receive the new enabled adaptive guardrail without replacing stored policies',
  );
  assert.match(
    contextSource,
    /hasPersonalizedGuardrailSelection[\s\S]*?personalizedGuardrailIsEnabled[\s\S]*?!hasPersonalizedGuardrailSelection[\s\S]*?CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL\.name/,
    'the new policy should be added to Security selections only when its stored profile is enabled',
  );
  assert.match(
    seedSource,
    /EAGLE_GREEN_VIP_RESERVATION_INSTRUCTIONS[\s\S]*?complete VIP reservation journey[\s\S]*?changes, cancellations, waitlists, special occasions, private dining[\s\S]*?Primary goals[\s\S]*?General guardrails[\s\S]*?Food, dietary, and alcohol safety[\s\S]*?published nutrition information, non-alcoholic options, or human support/,
    'the primary demo instructions should define a complete luxury reservation concierge, not only its configured actions',
  );
  assert.match(
    contextSource,
    /shouldMigratePrimaryInstructions\s*=\s*storedSchemaVersion\s*<\s*13[\s\S]*?knownSeededPrimaryInstructions[\s\S]*?EAGLE_GREEN_LEGACY_VIP_RESERVATION_INSTRUCTIONS[\s\S]*?knownSeededPrimaryInstructions\.some\([\s\S]*?storedPrimaryInstructions\s*===\s*instructions\.trim\(\)[\s\S]*?content:\s*buildCiscoLiveInstructions\(primaryDefinition\)/,
    'schema-12 drafts should replace only known seeded instructions and preserve custom edits',
  );
  assert.match(policyStudioSource, /All rules shown below/);
  assert.doesNotMatch(policyStudioSource, /items\.slice|overview\.edgeCases\.slice/);
});

test('operational status shows a compact session event table filtered by the selected time range', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    source,
    /const operationalSessions = getCiscoLiveSessions\(agent\.id(?:,\s*actionConfigurationValues)?\)[\s\S]*?\.filter\(session => sessionAgeHours\(session\.updated\) <= operationalTimeRangeHours\)[\s\S]*?\.slice\(0,\s*3\)/,
    'sessions should respect the selected time range and stay compact',
  );
  assert.match(
    source,
    /className="agent-studio-operational-overview"[\s\S]*?<\/div>[\s\S]*?<section[\s\S]*?className="agent-studio-session-events"[\s\S]*?<Table className="agent-studio-session-events__table"/,
    'the session table should remain directly below the operational metrics',
  );
  assert.match(
    source,
    /<section[\s\S]*?className="agent-studio-session-events"[\s\S]*?className="agent-studio-session-events__actions"[\s\S]*?Open Sessions[\s\S]*?<Table className="agent-studio-session-events__table"/,
    'Open Sessions should sit in the session events header',
  );
  assert.match(
    source,
    /<TableHeader>Channel<\/TableHeader>[\s\S]*?<TableHeader>Session ID<\/TableHeader>[\s\S]*?<TableHeader>Customer<\/TableHeader>[\s\S]*?<TableHeader>Messages<\/TableHeader>[\s\S]*?<TableHeader>Updated<\/TableHeader>[\s\S]*?<TableHeader>Outcome<\/TableHeader>[\s\S]*?<TableHeader>Event<\/TableHeader>/,
  );
  assert.match(
    source,
    /if \(outcome === ['"]Transferred['"]\) return ['"]success['"][\s\S]*?if \(outcome === ['"]Resolved['"]\) return ['"]success['"]/,
    'transferred and resolved sessions should both use the green success treatment',
  );
  assert.match(
    styles,
    /\.agent-studio-session-events\s*\{[^}]*background:[^}]*background-glass-normal[^}]*backdrop-filter:\s*blur\(24px\) saturate\(130%\)[^}]*box-shadow:/,
    'the session events card should use the shared glass surface with enough blur to preserve table readability',
  );
  assert.match(
    styles,
    /\.agent-studio-session-events__table thead tr\s*\{[^}]*background:\s*transparent;/,
    'the table header should share the card glass instead of introducing a different surface color',
  );
});

test('Agent Studio header saves configuration changes before publishing a new version', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const handlerStart = source.indexOf('const handlePublishVersion');
  const headerActionsStart = source.indexOf('const headerActions =');
  const headerActionsEnd = source.indexOf('const sessionsDeepLink', headerActionsStart);
  const handlerSource = source.slice(handlerStart, headerActionsStart);
  const headerActionsSource = source.slice(headerActionsStart, headerActionsEnd);

  assert.ok(handlerStart >= 0 && headerActionsStart > handlerStart && headerActionsEnd > headerActionsStart);
  assert.match(handlerSource, /publishAgentVersion\(agent\.id\)/);
  assert.match(handlerSource, /Published version \$\{publishedDraft\.version\}/);
  assert.match(handlerSource, /const hasUnsavedConfigurationChanges[\s\S]*?currentAgentRevision !== overviewReleaseState\.savedRevision/);
  assert.match(handlerSource, /const releaseActionLabel = lifecycle === ['"]published['"][\s\S]*?['"]Unpublish['"][\s\S]*?hasSavedConfigurationReadyToPublish[\s\S]*?['"]Publish['"][\s\S]*?['"]Save['"]/);
  assert.match(handlerSource, /const handleReleaseAction[\s\S]*?lifecycle === ['"]published['"][\s\S]*?toggleAgentPublish\(agent\.id\)[\s\S]*?showToast\(['"]Agent unpublished successfully['"], ['"]success['"]\)[\s\S]*?showToast\(['"]Configuration saved['"], ['"]success['"]\)[\s\S]*?handlePublishVersion\(\)/);
  assert.match(
    headerActionsSource,
    /<AgentHeaderActions[\s\S]*?releaseLabel=\{releaseActionLabel\}[\s\S]*?releaseDisabled=\{releaseActionDisabled\}[\s\S]*?releaseVariant=\{lifecycle === ['"]published['"] \? ['"]secondary['"] : ['"]primary['"]\}[\s\S]*?onRelease=\{handleReleaseAction\}/,
    'the action should progress from Save to Publish, then become a secondary Unpublish action',
  );
  assert.doesNotMatch(headerActionsSource, /Duplicate as…/);
});

test('all Agent Studio pages share the Preview, release, and overflow action group', () => {
  const sharedActionsSource = readSource('../../components/agents/AgentHeaderActions.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');
  const historySource = readSource('../../pages/agent/AgentHistory.tsx');
  const testingSource = readSource('../../pages/agent/AgentAnalytics.tsx');
  const contextSource = readSource('../../contexts/AppContext.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(sharedActionsSource, /Preview[\s\S]*?releaseLabel[\s\S]*?agent-studio-header-more-button/);
  assert.match(sharedActionsSource, /label="Make this agent as a template"[\s\S]*?label="Delete"[\s\S]*?danger/);
  assert.match(sharedActionsSource, /deleteConfirmationOpen[\s\S]*?This action cannot be undone[\s\S]*?Delete agent/);
  assert.match(contextSource, /removeAgent:\s*\(agentId: string\) => boolean[\s\S]*?const removeAgent = useCallback[\s\S]*?delete nextAgents\[agentId\][\s\S]*?delete nextDrafts\[agentId\]/);
  [overviewSource, configureSource, sessionsSource, historySource, testingSource].forEach(source => {
    assert.match(source, /<AgentHeaderActions\s+agent=\{agent\}/);
  });
  assert.match(styles, /\.agent-studio-header-more-button\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;[^}]*border-radius:\s*50%;/);
  assert.match(
    styles,
    /\.agent-studio-header-actions \.btn\s*\{[^}]*height:\s*28px;[^}]*min-height:\s*28px;[^}]*font-size:\s*13px;/,
    'shared header buttons should retain the compact Overview dimensions on every workspace page',
  );
});

test('overview cards can be reordered and persist their layout per agent', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    source,
    /const DEFAULT_OVERVIEW_CARD_ORDER:\s*OverviewCardId\[\]\s*=\s*\[[\s\S]*?['"]capability['"][\s\S]*?['"]operational['"][\s\S]*?\]/,
  );
  assert.match(source, /readOverviewTileOrder\(agentId,\s*['"]cards['"],\s*DEFAULT_OVERVIEW_CARD_ORDER\)/);
  assert.match(source, /persistOverviewTileOrder\(agent\.id,\s*group,\s*nextOrder\)/);
  assert.match(
    source,
    /overviewCardOrder\.map\(\(cardId,\s*index\)[\s\S]*?handleOverviewTileDragStart\(event,\s*['"]cards['"],\s*cardId\)[\s\S]*?handleOverviewTileKeyDown\(event,\s*['"]cards['"],\s*cardId\)/,
    'the main cards should share the drag and keyboard reordering model',
  );
  assert.match(
    styles,
    /\.agent-studio-overview-card__drag-handle\s*\{[^}]*top:\s*var\(--spacing-x-small\);[^}]*right:\s*var\(--spacing-x-small\);[^}]*width:\s*28px;/,
    'large overview card handles should align with the smaller tile handles in the upper-right corner',
  );
  assert.match(
    styles,
    /\.agent-studio-card--operational\.card,\s*\.agent-studio-card--connections\.card\s*\{[^}]*border:\s*0;/,
    'Capability usage and Operational status should share a borderless outer container',
  );
  assert.match(
    styles,
    /\.agent-studio-card\.card,\s*\.agent-studio-step-card\.card\s*\{[^}]*background:\s*var\(--mds-color-theme-background-glass-medium, rgba\(0, 0, 0, 0\.6\)\);/,
    'Overview outer cards should use the dark translucent surface token',
  );
});

test('capability summary cards navigate to their respective configuration sections', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  const sectionMapPattern =
    /OVERVIEW_SUMMARY_CONFIGURATION_SECTION[\s\S]*?knowledge:\s*['"]Knowledge['"][\s\S]*?memory:\s*['"]Knowledge['"][\s\S]*?actions:\s*['"]Action['"][\s\S]*?actionControl:\s*['"]Action['"][\s\S]*?guardrails:\s*['"]Security['"]/;
  assert.match(
    source,
    sectionMapPattern,
    'summary cards should map to the matching configuration destinations',
  );
  assert.doesNotMatch(
    source,
    /connectedViewMode|setConnectedViewMode|Capability usage view|agent-studio-connected-view-switcher/,
    'Capability usage should use one summary presentation without a redundant Chart/List switcher',
  );
  assert.match(
    source,
    /className="agent-studio-connected-summary__link"[\s\S]*?configure\?section=\$\{OVERVIEW_SUMMARY_CONFIGURATION_SECTION\[item\.id\]\}[\s\S]*?aria-label=\{`Open \$\{item\.label\} configuration`\}/,
    'each summary card should expose a native, named configuration link',
  );
  assert.match(
    source,
    /className="agent-studio-overview-tile__drag-handle"[\s\S]*?draggable[\s\S]*?handleOverviewTileDragStart\(event,\s*['"]summary['"],\s*item\.id\)/,
    'reordering should remain isolated to the drag handle',
  );
  assert.match(styles, /\.agent-studio-connected-summary__link\s*\{[^}]*height:\s*100%;/);
  assert.match(
    styles,
    /\.agent-studio-connected-summary__link:hover\s*\{[^}]*background:[^}]*text-decoration:\s*none;/,
    'the hover surface should fill the card without inheriting the global link underline',
  );
  assert.match(styles, /\.agent-studio-connected-summary__link:focus-visible\s*\{[^}]*outline:/);
  assert.match(
    source,
    /label:\s*['"]Actions['"][\s\S]*?value:\s*connectedCapabilityTotals\.actions[\s\S]*?['"]2 Transfers, 2 MCPs['"][\s\S]*?id:\s*['"]actionControl['"][\s\S]*?label:\s*['"]Agent control['"][\s\S]*?value:\s*connectedCapabilityTotals\.actionControls[\s\S]*?['"]2 active · Steer['"]/,
    'Actions should remain intact while Agent control receives its own active-control summary tile',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-summary\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/,
    'the wide capability summary should accommodate all five cards in one row',
  );
});

test('Voice channel progressively reveals and persists its three routing fields', () => {
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const formConfigSource = readSource('../eva/evaFormConfig.ts');
  const dropdownSource = readSource('../../components/shared/Dropdown.tsx');
  const modelSource = readSource('./agentCreationModel.ts');
  const styles = readSource('../../components.css');

  assert.match(
    configureSource,
    /selectedChannels\.includes\(['"]voice['"]\)[\s\S]*?<fieldset className="v2-voice-channel-fields">[\s\S]*?label="Location"[\s\S]*?label="Phone number"[\s\S]*?label="Extension"/,
    'Voice should reveal exactly the location, phone number, and extension fields',
  );
  assert.match(
    formConfigSource,
    /export const VOICE_LOCATION_OPTIONS[\s\S]*?🇺🇸 San Francisco headquarters[\s\S]*?🇺🇸 New York customer support[\s\S]*?🇬🇧 London reservations desk/,
    'each location should pair a visible country flag with a specific geographic label',
  );
  assert.match(
    configureSource,
    /VOICE_LOCATION_OPTIONS,[\s\S]*?VOICE_PHONE_NUMBER_OPTIONS,[\s\S]*?from ['"]\.\.\/\.\.\/features\/eva\/evaFormConfig['"]/,
    'the configuration page should reuse the preset-flow endpoint catalog',
  );
  assert.match(
    configureSource,
    /const updateVoiceChannelField[\s\S]*?\[capabilityId\]:\s*\{[\s\S]*?values:\s*\{[\s\S]*?\.\.\.\(channelsCap\?\.values \?\? \{\}\),[\s\S]*?\[field\]: value/,
    'voice edits should merge into the existing channel values instead of replacing channel selection',
  );
  assert.match(
    configureSource,
    /configurationFingerprint[\s\S]*?channelConfigurationValues[\s\S]*?\[[\s\S]*?channelConfigurationValues/,
    'all voice fields should participate in the Save fingerprint',
  );
  assert.match(
    configureSource,
    /label="Extension"[\s\S]*?inputMode="numeric"[\s\S]*?pattern="\[0-9\]\*"[\s\S]*?maxLength=\{8\}[\s\S]*?replace\(\/\\D\/g, ['"]['"]\)/,
    'the extension should preserve leading zeroes while accepting no more than eight digits',
  );
  assert.match(
    modelSource,
    /interface ContactCenterChannelValues[\s\S]*?voiceLocation\?: string;[\s\S]*?voicePhoneNumber\?: string;[\s\S]*?voiceExtension\?: string;/,
  );
  assert.match(
    styles,
    /\.v2-voice-channel-fields__grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[\s\S]*?@media \(max-width:\s*900px\)[\s\S]*?grid-template-columns:\s*1fr;/,
    'the three fields should align in one desktop row and stack on narrow screens',
  );
  assert.match(
    dropdownSource,
    /htmlFor=\{triggerId\}[\s\S]*?aria-labelledby=\{label \? `\$\{labelId\} \$\{valueId\}` : valueId\}[\s\S]*?aria-describedby=\{hint \? hintId : undefined\}/,
    'Dropdown labels, selected values, and hints should be announced together',
  );
});

test('Galileo table controls use the shared Momentum button component', () => {
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const styles = readSource('../../components.css');

  assert.match(
    configureSource,
    /<td className="col-galileo">[\s\S]*?<Button[\s\S]*?variant="secondary"[\s\S]*?color=\{galileoButtonColor\}[\s\S]*?size="sm"[\s\S]*?className=\{`galileo-action-control-button is-\$\{galileoStatus\.tone\}`\}/,
    'table status actions should use the shared Momentum button and its semantic color API',
  );
  assert.match(
    styles,
    /\.galileo-action-control-button\.btn\s*\{[^}]*justify-content:\s*flex-start;[^}]*max-width:\s*100%;/,
    'table-specific styling should only constrain the Momentum button layout',
  );
  assert.doesNotMatch(
    styles,
    /\.galileo-action-control-status\s*\{/,
    'the table should not keep a parallel custom button implementation',
  );
});

test('Actions exposes the Galileo recommendation flow beside Add actions', () => {
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const controlsSource = readSource('../../pages/agent/ActionControls.tsx');
  const styles = readSource('../../components.css');

  assert.match(
    configureSource,
    /className="action-config-v2-action-actions"[\s\S]*?<Button[\s\S]*?variant="secondary"[\s\S]*?className="action-config-v2-recommended-btn"[\s\S]*?aria-haspopup="dialog"[\s\S]*?<Icon name="sparkle"[\s\S]*?Recommend Controls[\s\S]*?className="add-action-menu-wrapper"/,
    'Recommend Controls should be the first page action and use the sparkle icon beside Add actions',
  );
  assert.match(
    configureSource,
    /const openRecommendedControls = \(\) => \{[\s\S]*?setShowAddMenu\(false\);[\s\S]*?setShowRecommendedControls\(true\);[\s\S]*?onClick=\{openRecommendedControls\}/,
    'opening recommendations should close the Add actions menu before showing the dialog',
  );
  assert.match(
    controlsSource,
    /title="Recommended agent controls"[\s\S]*?Nothing is published automatically\./,
    'the dialog should explain that generated controls are not published automatically',
  );
  assert.match(
    controlsSource,
    /Preparing agent context[\s\S]*?Analyzing requirements[\s\S]*?Validating safe controls/,
    'the dialog should preserve the staged Galileo analysis flow from the demo',
  );
  assert.match(
    controlsSource,
    /Saved instruction evidence[\s\S]*?Why this control[\s\S]*?Happy path[\s\S]*?Intervention path[\s\S]*?Manual review gaps/,
    'recommendations should explain their evidence and known evaluator gaps',
  );
  assert.match(
    controlsSource,
    /status: 'needs_review'[\s\S]*?source: 'recommended'/,
    'adding a recommendation should require review instead of publishing it automatically',
  );
  assert.match(
    styles,
    /\.action-config-v2-action-actions\s*\{[^}]*flex-wrap:\s*wrap;[\s\S]*?\.recommended-controls-dialog\s*\{[^}]*width:\s*min\(1120px/,
    'the paired actions and recommendation dialog should remain responsive',
  );
  assert.match(
    styles,
    /\.action-config-v2-recommended-btn svg\s*\{[^}]*color:\s*currentColor;/,
    'the sparkle icon should match the white button label instead of using the accent color',
  );
});

test('Galileo intervention behavior uses a native radio group', () => {
  const controlsSource = readSource('../../pages/agent/ActionControls.tsx');
  const styles = readSource('../../components.css');

  assert.match(
    controlsSource,
    /\{!isCreatingControl && \([\s\S]*?<h3>Control behavior<\/h3>[\s\S]*?Choose what Galileo does when the conditions match\.[\s\S]*?\)\}[\s\S]*?<h3>Control action<\/h3>[\s\S]*?<MomentumRadioGroup[\s\S]*?name=\{`galileo-action-control-behavior-\$\{contextActionId\}`\}[\s\S]*?dataAriaLabel="Control action"[\s\S]*?<MomentumRadio[\s\S]*?value=\{behavior\}[\s\S]*?checked=\{draft\.behavior === behavior\}[\s\S]*?onChange=/,
    'the inline editor should retain its behavior heading while the wizard proceeds directly to the native Momentum RadioGroup',
  );
  assert.doesNotMatch(
    controlsSource,
    /aria-label="Intervention behavior"[\s\S]*?aria-pressed=\{draft\.behavior === behavior\}/,
    'the behavior selector should not retain segmented-button semantics',
  );
  assert.match(
    styles,
    /\.galileo-action-control-behavior \.radio-group-list\s*\{[^}]*flex-direction:\s*row;[^}]*flex-wrap:\s*wrap;/,
    'the compact behavior radio group should stay horizontal and wrap safely',
  );
});

test('Galileo evaluation timing uses a native radio group', () => {
  const controlsSource = readSource('../../pages/agent/ActionControls.tsx');
  const styles = readSource('../../components.css');

  assert.match(
    controlsSource,
    /className="galileo-action-control-timing-column"[\s\S]*?Evaluation timing[\s\S]*?<MomentumRadioGroup[\s\S]*?name=\{`galileo-action-control-timing-\$\{contextActionId\}`\}[\s\S]*?dataAriaLabel="Evaluation timing"[\s\S]*?className="galileo-action-control-timing"[\s\S]*?<MomentumRadio[\s\S]*?value=\{option\.value\}[\s\S]*?checked=\{draft\.timing === option\.value\}[\s\S]*?onChange=[\s\S]*?<UpliftMomentumButton[\s\S]*?className="galileo-action-control-timing-info"[\s\S]*?<Icon name="info-circle"[\s\S]*?<MomentumTooltip[\s\S]*?\{option\.description\}/,
    'evaluation timing should use the direct Momentum RadioGroup pattern',
  );
  assert.doesNotMatch(
    controlsSource,
    /<UpliftMomentumSelect[\s\S]*?label="Evaluation timing"/,
    'evaluation timing should no longer use a dropdown select',
  );
  assert.match(
    styles,
    /\.galileo-action-control-timing::part\(container\)\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;[^}]*align-items:\s*center;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*8px;/,
    'the evaluation timing radio options and their info buttons should stay aligned and wrap safely',
  );
  assert.doesNotMatch(
    controlsSource,
    /galileo-action-control-timing-help/,
    'timing guidance should live in the option tooltips instead of a detached helper line',
  );
});

test('Adaptive guardrail Action and Direction guidance lives in accessible info tooltips', () => {
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const styles = readSource('../../components.css');

  assert.match(
    configureSource,
    /function GuardrailControlLabel[\s\S]*?<Tooltip content=\{help\} placement="top">[\s\S]*?className="security-control-info-button"[\s\S]*?aria-label=\{`\$\{label\} information: \$\{help\}`\}[\s\S]*?<Icon name="info-circle"/,
    'the shared label should expose its guidance from a keyboard-focusable information icon',
  );
  assert.match(
    configureSource,
    /renderCustomGuardrailDirection[\s\S]*?<GuardrailControlLabel label="Direction" help=\{CUSTOM_GUARDRAIL_DIRECTION_HELP\}/,
    'every adaptive Direction row should use the shared information tooltip',
  );
  assert.match(
    configureSource,
    /renderCustomGuardrailAction[\s\S]*?<GuardrailControlLabel label="Action" help=\{CUSTOM_GUARDRAIL_ACTION_HELP\}/,
    'every adaptive Action row should use the shared information tooltip',
  );
  assert.doesNotMatch(
    configureSource,
    /security-control-help/,
    'Action and Direction guidance should no longer render as detached helper text',
  );
  assert.match(
    styles,
    /\.security-control-info-button:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent-color\);[^}]*outline-offset:\s*2px;/,
    'information icons should retain a visible keyboard focus indicator',
  );
});

test('Galileo agent controls use the Figma summary and a direct-entry creation wizard', () => {
  const controlsSource = readSource('../../pages/agent/ActionControls.tsx');
  const upliftFieldsSource = readSource('../../components/shared/UpliftMomentumField.tsx');
  const upliftButtonSource = readSource('../../components/shared/UpliftMomentumButton.tsx');
  const styles = readSource('../../components.css');
  const figmaStyles = styles.slice(styles.lastIndexOf('/* ── Figma action-control editor'));

  assert.match(
    controlsSource,
    /const shouldStartCreation = !initialControl && !state\.gatesByActionId\[actionId\];[\s\S]*?createBlankControl\(actionId\)[\s\S]*?const \[isEditing, setIsEditing\] = useState\(shouldStartCreation\)/,
    'an action without a control or gate should open directly in creation instead of showing an empty intermediate screen',
  );
  assert.match(
    controlsSource,
    /GALILEO_CONTROL_WIZARD_STEPS = \[[\s\S]*?label: 'Details'[\s\S]*?label: 'Conditions'[\s\S]*?label: 'Behavior'[\s\S]*?\{isCreatingControl && \([\s\S]*?<MomentumStepper[\s\S]*?aria-label="Control setup progress"[\s\S]*?<MomentumStepperItem[\s\S]*?<MomentumStepperConnector/,
    'only control creation should expose the labeled three-step Momentum wizard',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-studio__header-copy"[\s\S]*?\{isCreatingControl \? 'Create agent control' : 'Agent control'\}: \{contextActionDisplayName\}[\s\S]*?Configure when Galileo evaluates/,
    'the header should include the action name and retain its contextual subtitle',
  );
  assert.match(
    controlsSource,
    /<UpliftMomentumButton[\s\S]*?className="galileo-action-control-studio__close"[\s\S]*?aria-label="Close agent control"[\s\S]*?<Icon name="cancel" weight="regular" size=\{32\}/,
    'the header should use a React-safe Momentum close icon inside the reusable Uplift button',
  );
  assert.match(
    controlsSource,
    /<footer className="galileo-action-control-wizard__footer">[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="secondary"[\s\S]*?onClick=\{requestClose\}[\s\S]*?Cancel[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="primary"[\s\S]*?color="default"[\s\S]*?onClick=\{advanceWizard\}[\s\S]*?Next[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="primary"[\s\S]*?color="default"[\s\S]*?Create control/,
    'the creation-only Momentum footer should use standard primary actions and end with Create control',
  );
  assert.doesNotMatch(
    controlsSource,
    /Step \{wizardStep \+ 1\} of \{GALILEO_CONTROL_WIZARD_STEPS\.length\}/,
    'the Momentum stepper should be the wizard’s only progress indicator',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-wizard__progress mdc-stepperconnector\s*\{[^}]*margin-top:\s*calc\(\(1\.75rem - 0\.0625rem\) \/ 2\);/,
    'the horizontal wizard connector should be centered on the 28px Momentum step status icon',
  );
  assert.match(
    controlsSource,
    /<StaticChip color=\{summaryStatusColor\} label=\{summaryStatusLabel\} \/>[\s\S]*?iconName="automation-bold"[\s\S]*?label=\{BEHAVIOR_LABELS\[summaryControl\.behavior\]\}/,
    'status and behavior should use Momentum chips, including the Steer icon',
  );
  assert.match(
    controlsSource,
    /className=\{`galileo-action-control-edit-toggle\$\{isEditing \? ' is-expanded' : ''\}`\}[\s\S]*?aria-expanded=\{isEditing\}[\s\S]*?aria-controls="galileo-action-control-editor"[\s\S]*?else if \(control\) beginEdit\(control\)/,
    'Edit control should disclose the existing-control editor without moving to another modal',
  );
  assert.match(
    controlsSource,
    /id=\{isCreatingControl \? undefined : 'galileo-action-control-editor'\}[\s\S]*?galileo-action-control-editor--inline[\s\S]*?Edit control[\s\S]*?\{\(!isCreatingControl \|\| wizardStep === 0\) && \([\s\S]*?\{\(!isCreatingControl \|\| wizardStep === 1\) && \([\s\S]*?\{\(!isCreatingControl \|\| wizardStep === 2\) && draft\.behavior === 'steer'[\s\S]*?galileo-action-control-editor__footer[\s\S]*?Save changes/,
    'editing an existing control should expand the complete form and direct save actions in one continuous editor',
  );
  assert.doesNotMatch(
    controlsSource,
    /<h3>Control details<\/h3>|Use a specific name so teammates can understand this control later\./,
    'the Details step should proceed directly to the form fields without a redundant helper heading',
  );
  assert.doesNotMatch(
    controlsSource,
    /Condition setup|Build the rule from inputs that are available to this action\./,
    'the Conditions step should not repeat its purpose in an extra setup heading',
  );
  assert.match(
    controlsSource,
    /galileo-action-control-conditions-column[\s\S]*?aria-labelledby=\{isCreatingControl \? 'galileo-conditions-title' : undefined\}[\s\S]*?\{isCreatingControl && \(\s*<div className="galileo-action-control-editor__section-heading galileo-action-control-editor__section-heading--stacked">[\s\S]*?When this happens[\s\S]*?Evaluate only the reservation inputs available to this action/,
    'the When this happens helper heading should remain wizard-only and stay out of the inline editor',
  );
  assert.match(
    controlsSource,
    /const deleteControl = \(\) => \{[\s\S]*?window\.confirm[\s\S]*?delete next\.controlsByActionId\[contextActionId\][\s\S]*?delete next\.gatesByActionId\[targetActionId\][\s\S]*?onChange\(next\);[\s\S]*?onClose\(\);[\s\S]*?className="galileo-action-control-delete"[\s\S]*?onClick=\{deleteControl\}[\s\S]*?Delete/,
    'the existing-control footer should expose a confirmed destructive delete action and remove dependent gates',
  );
  assert.match(
    controlsSource,
    /<footer className="galileo-action-control-editor__footer">[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="secondary"[\s\S]*?color="negative"[\s\S]*?size=\{40\}[\s\S]*?Delete[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="secondary"[\s\S]*?color="default"[\s\S]*?size=\{40\}[\s\S]*?Cancel[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="primary"[\s\S]*?color="default"[\s\S]*?size=\{40\}[\s\S]*?Save changes/,
    'the edit footer should use native Momentum variants, including a standard primary action',
  );
  assert.doesNotMatch(
    figmaStyles,
    /\.galileo-action-control-editor__footer mdc-button\s*\{[^}]*min-width:/,
    'footer buttons should keep Momentum intrinsic sizing without a legacy width override',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-editor mdc-textarea\s*\{[^}]*--mdc-textarea-background-color:\s*transparent;[^}]*--mdc-textarea-container-background-color:\s*transparent;[\s\S]*?\.galileo-action-control-editor mdc-textarea::part\(textarea-container\),[\s\S]*?\.galileo-action-control-editor mdc-textarea::part\(textarea\)\s*\{[^}]*background:\s*transparent;/,
    'editor textareas should retain their borders without painting a filled background',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-editor--inline[\s\S]*?\.galileo-action-control-editor__section--details:not\(\.galileo-action-control-editor__section--behavior\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 680px\);[^}]*justify-content:\s*start;[^}]*row-gap:\s*20px;[\s\S]*?\.galileo-action-control-editor--inline \.galileo-action-control-timing-column\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;[^}]*grid-column:\s*1;[\s\S]*?\.galileo-action-control-editor--inline \.galileo-action-control-conditions-column\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;[^}]*grid-column:\s*1;/,
    'existing-control timing and conditions should stack within the same 680px measure as the detail fields',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-wizard__body \.galileo-action-control-conditions-column\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;/,
    'the creation wizard condition builder should use the same 680px form measure as the detail fields',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-wizard__body \.galileo-action-control-rule-preview\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;/,
    'the creation wizard rule preview should align to the condition builder’s 680px form measure',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-advanced-trigger::part\(button-text\)\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*gap:\s*6px;/,
    'the Advanced condition Momentum button should center its icon and label in the exposed text part',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition-actions > \.uplift-momentum-button::part\(button-text\),/,
    'the Add condition Momentum button should share the centered icon-and-label treatment',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-summary__decision-body\s*\{[^}]*gap:\s*8px;[\s\S]*?\.galileo-action-control-summary__decision-body strong\s*\{[^}]*color:\s*rgba\(255, 255, 255, 0\.95\);[^}]*font-size:\s*16px;[^}]*font-weight:\s*600;[^}]*line-height:\s*20px;[\s\S]*?\.galileo-action-control-summary__decision-body p\s*\{[^}]*color:\s*rgba\(255, 255, 255, 0\.7\);[^}]*font-size:\s*13px;[^}]*line-height:\s*18px;/,
    'the Decision summary should distinguish its primary action from the supporting rule text',
  );
  assert.match(
    controlsSource,
    /<code className="galileo-action-control-summary__variable" translate="no">[\s\S]*?`\{\{\$\{condition\.field\}\}\}`[\s\S]*?<GalileoControlExpression control=\{summaryControl\} \/>/,
    'the Decision summary should render action inputs as non-translatable code tokens',
  );
  assert.match(
    figmaStyles,
    /--galileo-code-variable:\s*#ffa657;[\s\S]*?\.galileo-action-control-summary__variable\s*\{[^}]*color:\s*var\(--galileo-code-variable, #ffa657\);[^}]*font-family:\s*ui-monospace,[^}]*font-weight:\s*600;/,
    'action-input variables should use the dark-editor syntax color and a monospace code treatment',
  );
  assert.match(
    controlsSource,
    /<UpliftMomentumTextarea[\s\S]*?className="galileo-action-control-guidance-field"[\s\S]*?<div className="galileo-action-control-steer-field"/,
    'guidance and steer fields should expose stable form-measure hooks',
  );
  assert.match(
    controlsSource,
    /const steerMenuTriggerId = `galileo-steer-menu-trigger-\$\{contextActionId\}`;[\s\S]*?<UpliftMomentumButton[\s\S]*?id=\{steerMenuTriggerId\}[\s\S]*?postfixIcon="arrow-down-bold"[\s\S]*?<MomentumMenuPopover[\s\S]*?triggerID=\{steerMenuTriggerId\}[\s\S]*?<MomentumMenuItemRadio[\s\S]*?indicator="checkmark"/,
    'Steer to action should use the native Momentum menu popover and single-select menu items',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-editor__section--behavior > \.galileo-action-control-guidance-field\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;[\s\S]*?\.galileo-action-control-steer-field\s*\{[^}]*width:\s*min\(680px, 100%\);[^}]*max-width:\s*680px;/,
    'guidance and steer fields should match the 680px control-name measure',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-editor__footer \.galileo-action-control-delete\s*\{[^}]*margin-right:\s*auto;/,
    'the destructive action should sit apart from the Cancel and Save group',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition-actions\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 139px 1px 179px;[\s\S]*?\.galileo-action-control-advanced\s*\{[^}]*display:\s*contents;[\s\S]*?\.galileo-action-control-advanced > \.galileo-action-control-advanced-trigger\s*\{[^}]*display:\s*flex;[^}]*width:\s*179px;[^}]*grid-column:\s*4;[^}]*grid-row:\s*1;[\s\S]*?\.galileo-action-control-advanced__content\s*\{[^}]*position:\s*static;[^}]*width:\s*100%;[^}]*grid-column:\s*1 \/ -1;[^}]*grid-row:\s*2;[^}]*margin-top:\s*12px;[^}]*box-sizing:\s*border-box;/,
    'expanded advanced conditions should fill the conditions column, stay in flow, and push the rule preview downward',
  );
  assert.match(
    controlsSource,
    /const \[advancedConditionOpen, setAdvancedConditionOpen\] = useState\(false\);[\s\S]*?<UpliftMomentumButton[\s\S]*?variant="tertiary"[\s\S]*?className="galileo-action-control-advanced-trigger"[\s\S]*?aria-expanded=\{advancedConditionOpen \? 'true' : 'false'\}[\s\S]*?onClick=\{\(\) => setAdvancedConditionOpen\(current => !current\)\}[\s\S]*?Advanced condition[\s\S]*?advancedConditionOpen &&/,
    'Advanced condition should use the shared Momentum tertiary button as an accessible disclosure',
  );
  assert.match(
    controlsSource,
    /<MomentumBanner[\s\S]*?variant="informational"[\s\S]*?label="Rule preview"[\s\S]*?secondaryLabel=\{getControlExpressionPreview\(draft\)\}/,
    'both creation and editing should retain the native Momentum rule preview',
  );
  assert.match(
    controlsSource,
    /MATCH_MODE_CYCLE:[^=]*= \['or', 'and'\][\s\S]*?MATCH_MODE_CONNECTOR_LABELS[\s\S]*?or: 'OR'[\s\S]*?and: 'AND'[\s\S]*?index === 0 \? \([\s\S]*?>When<\/span>[\s\S]*?galileo-action-control-condition__joiner--toggle[\s\S]*?getNextMatchMode\(current\.matchMode\)[\s\S]*?MATCH_MODE_CONNECTOR_LABELS\[normalizeMatchMode\(draft\.matchMode\)\]/,
    'later condition connectors should toggle accessibly between OR and AND',
  );
  assert.match(
    upliftFieldsSource,
    /Input as MomentumInput[\s\S]*?Select as MomentumSelect[\s\S]*?Textarea as MomentumTextarea[\s\S]*?UPLIFT_FIELD_CLASS = 'uplift-momentum-field'[\s\S]*?<MomentumInput[\s\S]*?<MomentumTextarea[\s\S]*?<MomentumSelect/,
    'the reusable Uplift field layer should remain a thin wrapper over native Momentum controls',
  );
  assert.match(
    controlsSource,
    /<UpliftMomentumInput[\s\S]*?onInput=[\s\S]*?<UpliftMomentumTextarea[\s\S]*?helpText=[\s\S]*?<UpliftMomentumSelect[\s\S]*?<MomentumSelectlistbox>[\s\S]*?<MomentumOption/,
    'every editable Agent control field should reuse the Uplift Momentum layer and keystroke-level events',
  );
  assert.match(
    upliftButtonSource,
    /Button as MomentumButton[\s\S]*?UPLIFT_BUTTON_CLASS = 'uplift-momentum-button'[\s\S]*?size === 'sm' \? 32[\s\S]*?<MomentumButton/,
    'the stored Uplift button should remain a thin Momentum wrapper with canonical 40px and 32px sizes',
  );
  assert.match(
    controlsSource,
    /<UpliftMomentumButton[\s\S]*?className=\{`galileo-action-control-edit-toggle[\s\S]*?<UpliftMomentumButton[\s\S]*?className="galileo-action-control-delete"[\s\S]*?Save changes/,
    'Agent control buttons should reuse the stored Uplift Momentum component',
  );
  assert.match(
    figmaStyles,
    /Webex Uplift Input[^]*?\.uplift-momentum-field\s*\{[^}]*--mdc-label-font-size:\s*14px;[^}]*--mdc-input-border-color:\s*rgba\(255, 255, 255, 0\.2\);[^}]*--mdc-input-background-color:\s*transparent;[^}]*--mdc-select-background-color:\s*transparent;[^}]*--mdc-textarea-container-background-color:\s*transparent;/,
    'the reusable field tokens should match the Uplift normal-state input specification',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-editor \.uplift-momentum-field\s*\{[^}]*--mdc-label-font-size:\s*14px;[^}]*--mdc-label-font-weight:\s*500;[^}]*--mdc-input-background-color:\s*transparent;[^}]*--mdc-textarea-container-background-color:\s*transparent;/,
    'the Uplift field tokens should outrank the legacy editor field defaults',
  );
  assert.match(
    figmaStyles,
    /mdc-textarea\.uplift-momentum-field::part\(textarea-container\),\s*mdc-textarea\.uplift-momentum-field::part\(textarea\)\s*\{[^}]*background:\s*transparent;/,
    'Uplift textareas should remain unfilled in every interaction state',
  );
  assert.match(
    controlsSource,
    /<IconProvider[\s\S]*?className="galileo-action-control-icon-provider"[\s\S]*?<section[\s\S]*?<MomentumBanner[\s\S]*?<MomentumCheckbox/,
    'the full studio should provide Momentum icons to nested fields, banners, and checkboxes',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-action-chip"[\s\S]*?<StaticChip[\s\S]*?label=\{summaryTargetName\}[\s\S]*?<MomentumTooltip[\s\S]*?\{summaryTargetDescription\}/,
    'the summary action chip should disclose the action description through a Momentum tooltip',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-condition-source"[\s\S]*?<span>Available variables<\/span>[\s\S]*?ACTION_INPUT_VARIABLES\.map[\s\S]*?\{\{event_time\}\}/,
    'the editor should list every available condition variable in template format',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-condition galileo-action-control-condition--time-window"[\s\S]*?>AND<\/span>[\s\S]*?\{\{event_time\}\}[\s\S]*?>is between<\/span>[\s\S]*?type="time"[\s\S]*?timeWindow\.start[\s\S]*?type="time"[\s\S]*?timeWindow\.end[\s\S]*?aria-label="Remove event time condition"[\s\S]*?onClick=\{removeTimeWindow\}[\s\S]*?<Icon name="delete"/,
    'the seeded control should show an editable time window with the same delete affordance as other conditions',
  );
  assert.match(
    controlsSource,
    /const removeTimeWindow = \(\) => \{[\s\S]*?timeWindow:\s*undefined/,
    'removing the event-time row should clear only the time-window condition from the draft',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-guidance">[\s\S]*?<Icon name="open-pages"/,
    'Agent guidance should use the Momentum open-pages icon from the Figma design',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-guidance\s*\{[^}]*border:\s*1px solid #212630;[^}]*border-radius:\s*6px;[^}]*background:\s*rgba\(22, 27, 34, 0\.72\);/,
    'Agent guidance should reuse the neutral filled card treatment from the no-match branch above it',
  );
  assert.match(
    controlsSource,
    /previousDocumentOverflow[\s\S]*?document\.documentElement\.style\.overflow = ['"]hidden['"][\s\S]*?document\.body\.style\.overflow = ['"]hidden['"][\s\S]*?document\.documentElement\.style\.overflow = previousDocumentOverflow[\s\S]*?document\.body\.style\.overflow = previousBodyOverflow/,
    'the full-page editor should lock and restore document scrolling',
  );
  assert.match(
    controlsSource,
    /<h2 id="galileo-action-control-title">[\s\S]*?\{isCreatingControl \? 'Create agent control' : 'Agent control'\}: \{contextActionDisplayName\}[\s\S]*?<\/h2>[\s\S]*?Review how Galileo evaluates \$\{contextActionDisplayName\}/,
    'the workspace should show the action name in the title and retain the contextual subheading',
  );
  assert.doesNotMatch(
    controlsSource,
    /aria-label="Back to actions"|className="security-ui-icon-text"/,
    'the header should not use a back-button treatment',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-studio\s*\{[^}]*gap:\s*24px;[^}]*padding:\s*24px;[\s\S]*?\.galileo-action-control-studio__header\s*\{[^}]*padding:\s*24px 0 32px;[\s\S]*?\.galileo-action-control-summary,[\s\S]*?\.galileo-action-control-editor\s*\{[^}]*align-self:\s*stretch;[^}]*max-width:\s*none;[^}]*width:\s*100%;/,
    'the header should use 24px top and 32px bottom spacing while both cards fill the workspace width',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-workspace\s*\{[^}]*padding:\s*0 0 40px;[\s\S]*?\.galileo-action-control-summary__flow\s*\{[^}]*min-height:\s*160px;[^}]*grid-template-columns:\s*210px 32px 380px 32px minmax\(0, 1fr\);[^}]*gap:\s*4px;/,
    'the summary should give compound decisions more room while keeping two Momentum-arrow slots and a flexible outcomes column',
  );
  assert.match(
    controlsSource,
    /aria-label="Control decision flow"[\s\S]*?Evaluation point[\s\S]*?Decision[\s\S]*?Matches[\s\S]*?No match/,
    'the summary should expose its sequence and both branches without requiring users to infer the relationship',
  );
  assert.doesNotMatch(
    controlsSource,
    /Then · Steer/,
    'the matched outcome should use the concise Steer label',
  );
  assert.doesNotMatch(
    figmaStyles,
    /\.galileo-action-control-summary__(?:branches|branch)::(?:before|after)/,
    'branch labels should not be crossed by decorative connector lines',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-studio__header\s*\{[^}]*height:\s*64px;[^}]*min-height:\s*64px;[^}]*flex:\s*0 0 64px;[^}]*padding:\s*0;[\s\S]*?\.galileo-action-control-studio__header-copy h2\s*\{[^}]*font-size:\s*24px;[^}]*line-height:\s*32px;[\s\S]*?\.galileo-action-control-studio__close\s*\{[^}]*flex:\s*0 0 64px;[^}]*--mdc-button-prefix-icon-size:\s*32px;/,
    'the full-page header should preserve the measured title typography and 64px close target',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-workspace\.is-wizard\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\) auto;[^}]*gap:\s*24px;[^}]*padding:\s*0;[^}]*overflow:\s*hidden;[\s\S]*?\.galileo-action-control-wizard__progress\s*\{[^}]*width:\s*min\(660px, 100%\);[^}]*justify-self:\s*center;[\s\S]*?\.galileo-action-control-wizard__body\s*\{[^}]*padding:\s*16px;[^}]*border-radius:\s*12px;[^}]*background:\s*var\(--galileo-card\);/,
    'the guided editor should reproduce the measured 24px rhythm, centered 660px stepper, and glass content surface',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-wizard__footer\s*\{[^}]*justify-content:\s*flex-end;[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;/,
    'the full-page footer should remain detached from the content surface and right-align its Momentum actions',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition-actions > span\s*\{[^}]*height:\s*16px;[^}]*margin-top:\s*8px;/,
    'the condition-action divider should be vertically centered within the 32px button row',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition\s*\{[^}]*grid-template-columns:\s*48px minmax\(140px, 1fr\) auto 112px 24px;/,
    'condition rows should trade dropdown width for a roomier numeric field',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition > \.uplift-momentum-button\s*\{[^}]*width:\s*24px;[^}]*min-width:\s*24px;[^}]*padding-inline:\s*3px !important;[^}]*box-sizing:\s*border-box;/,
    'the Momentum delete action should stay inside its 24px condition-grid track',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-studio mdc-staticchip\s*\{[^}]*padding-inline:\s*8px;/,
    'every Momentum chip should retain the specified 8px side padding despite the global reset',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-card--overview\.card[^}]*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.4\);[^}]*backdrop-filter:\s*blur\(30px\) saturate\(120%\);[\s\S]*?\.galileo-action-control-editor\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.4\);[^}]*backdrop-filter:\s*blur\(30px\) saturate\(120%\);/,
    'the summary and editor should use the requested 40%-black glass surface treatment',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-card--gate\.card[^}]*\{[^}]*border:\s*0;[^}]*background:\s*rgba\(0, 0, 0, 0\.4\);[^}]*backdrop-filter:\s*blur\(30px\) saturate\(120%\);/,
    'the gated-action availability card should share the borderless 40%-black glass surface',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-card--overview\.card[^}]*\{[^}]*border:\s*0;[\s\S]*?\.galileo-action-control-summary__branches\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[\s\S]*?\.galileo-action-control-editor\s*\{[^}]*border:\s*0;/,
    'the two glass surfaces and the branches group should not add wrapper borders around the Figma cards',
  );
  assert.match(
    controlsSource,
    /\{error && \([\s\S]*?\{error\}[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\{!isCreatingControl && \(\s*<footer className="galileo-action-control-editor__footer">[\s\S]*?<UpliftMomentumButton[\s\S]*?Delete[\s\S]*?<UpliftMomentumButton[\s\S]*?Cancel[\s\S]*?<UpliftMomentumButton[\s\S]*?Save changes/,
    'the existing-control footer should be outside the glass content card and use Momentum actions',
  );
  assert.match(
    controlsSource,
    /className="galileo-action-control-gate__relationship"[\s\S]*?<StaticChip color="default" label=\{actionNames\[gate\.sourceActionId\][\s\S]*?className="galileo-action-control-gate__view"[\s\S]*?>\s*View source control/,
    'the gated action should keep its source-action chip and white View source control action inside the relationship card',
  );
  assert.match(
    controlsSource,
    /<h3>Available after agent control intervenes<\/h3>/,
    'the gated action title should describe the agent control intervention directly',
  );
  assert.doesNotMatch(
    controlsSource,
    /confirmDiscardChanges|Discard your unsaved control changes/,
    'Close, Escape, and internal navigation should dismiss without a discard confirmation',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-condition__joiner\s*\{[^}]*height:\s*32px;[^}]*align-self:\s*end;/,
    'condition connectors should align to the visible 32px Momentum field surface',
  );
  assert.match(
    figmaStyles,
    /\.galileo-action-control-rule-preview::part\(leading\)\s*\{[^}]*padding:\s*12px 16px;/,
    'the Momentum rule-preview banner should retain four-sided content padding',
  );
});

test('the Actions table owns Galileo control status without a duplicate page banner', () => {
  const source = readSource('../../pages/agent/ActionConfigureV2.tsx');

  assert.doesNotMatch(
    source,
    /Galileo recommendation is active|Galileo found 1 recommended control|galileo-action-control-recommendation/,
    'the Actions page should not repeat row-level Galileo status in a page banner',
  );
  assert.doesNotMatch(source, /Provider type|col-provider-type|providerType/, 'the Actions table should omit provider type');
  assert.match(
    source,
    /className="col-galileo">Controls<[\s\S]*?className="galileo-action-control-button/,
    'control status and its entry point should remain available in each action row',
  );
});

test('agent control activity matches the Figma card and discloses its selected state', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    source,
    /const DEFAULT_OVERVIEW_CHART_ORDER:[^=]*=\s*\[\s*'signals',\s*'guardrails',\s*'actions',\s*\]/,
    'the overview should place Guardrail activity before Agent control activity without changing either card',
  );

  assert.match(
    source,
    /<figure[\s\S]*?className="agent-studio-action-control-flow"[\s\S]*?aria-labelledby="agent-studio-action-control-flow-caption"[\s\S]*?<figcaption[\s\S]*?\{actionControlFlowLabel\}/,
    'the aggregate should retain a screen-reader summary without hiding its interactive branch',
  );
  assert.match(
    source,
    /Agent control activity during \$\{operationalTimeRangeLabel\.toLowerCase\(\)\}[\s\S]*?Evaluated[\s\S]*?agent-studio-action-control-flow__divider[\s\S]*?Matched/,
    'the visible hierarchy should identify the time-scoped activity before the evaluated and matched totals',
  );
  assert.doesNotMatch(source, />\s*Control checks\s*</, 'the evaluated row should not repeat a redundant eyebrow label');
  assert.match(
    source,
    /actionControlSpotlightActionName[\s\S]*?<StaticChip[\s\S]*?color="lime"[\s\S]*?iconName="automation-bold"[\s\S]*?label="Steered"[\s\S]*?<img src=\{actionControlArrow\} alt="" \/>[\s\S]*?actionControlSpotlightUnlockedName[\s\S]*?<StaticChip[\s\S]*?color="cobalt"[\s\S]*?label="Unlocked"/,
    'the matched path should use an icon-labelled Momentum Lime chip and a text-only Cobalt chip with the two concrete action names',
  );
  assert.match(
    source,
    /<IconProvider[\s\S]*?iconSet="custom-icons"[\s\S]*?url=\{publicAssetUrl\('icons'\)[\s\S]*?<StaticChip[\s\S]*?iconName="automation-bold"/,
    'the Momentum status chips should resolve their icon through the local Momentum icon provider',
  );
  assert.match(
    source,
    /const actionControlSpotlightDecision = \[\.\.\.actionControlDecisions\][\s\S]*?\.filter\(decision => decision\.matched\)[\s\S]*?\.sort\(/,
    'the spotlight should independently resolve the latest matched decision',
  );
  assert.match(
    source,
    /useState<OverviewIntervention \| null>\([\s\S]*?agentId === CISCO_LIVE_PRIMARY_AGENT_ID \? ['"]action_control['"] : null[\s\S]*?setSelectedOverviewIntervention\(agentId === CISCO_LIVE_PRIMARY_AGENT_ID \? ['"]action_control['"] : null\)/,
    'EAGLE GREEN should open with its latest matched decision selected and restore that default when the agent changes',
  );
  assert.match(
    source,
    /className="agent-studio-connected-chart__disclosure"[\s\S]*?Agent control activity, latest matched decision[\s\S]*?Guardrail activity, latest trigger[\s\S]*?aria-expanded=\{isDetailSelected\}[\s\S]*?aria-controls=\{detailId\}/,
    'both activity cards should expose one full-card disclosure control linked to their detail banner',
  );
  assert.match(
    source,
    /id=\{detailId\}[\s\S]*?hidden=\{!isDetailSelected\}[\s\S]*?<Banner[\s\S]*?className="agent-studio-operational-event-banner agent-studio-connected-event-banner"[\s\S]*?title=\{tileId === ['"]guardrails['"][\s\S]*?['"]Large event transfer unlocked['"][\s\S]*?['"]Standard path redirected['"]/,
    'the selected card should reveal the original event banner while the stable controlled region remains mounted',
  );
  assert.doesNotMatch(
    source,
    /OverviewContextualDetail|agent-studio-contextual-detail|Latest matched decision|Hide latest decision|View latest decision/,
    'the banner relationship should not add a source pill or visible accordion copy',
  );
  assert.match(
    source,
    /const nextGuardrail = showSelectedGuardrailDecision[\s\S]*?defaultTriggeredGuardrailName;[\s\S]*?setSelectedGuardrailActivity\(nextGuardrail\);[\s\S]*?setSelectedOverviewIntervention\(nextGuardrail \? ['"]guardrail['"] : null\)/,
    'the whole Guardrail activity card should open its first concrete trigger and close as one unit',
  );
  assert.match(
    styles,
    /\/\* Figma node 628:11105[\s\S]*?\.agent-studio-action-control-flow__summary\s*\{[^}]*display:\s*flex;[^}]*border:\s*0;[^}]*background:\s*transparent;/,
    'the evaluated total should be an unboxed full-width row from the Figma card',
  );
  assert.match(
    styles,
    /\.agent-studio-action-control-flow__summary-copy strong\s*\{[^}]*font-size:\s*var\(--font-size-body-large\);[^}]*line-height:\s*var\(--font-lineheight-body-large\);[\s\S]*?\.agent-studio-action-control-flow__summary-value\s*\{[^}]*font-size:\s*var\(--font-size-heading-midsize\);[^}]*line-height:\s*var\(--font-lineheight-heading-midsize\);/,
    'Evaluated and its count should use adjacent type-scale steps instead of competing display sizes',
  );
  assert.match(
    styles,
    /\.agent-studio-action-control-flow__matched-heading strong:first-child\s*\{[^}]*font-size:\s*var\(--font-size-body-large\);[^}]*line-height:\s*var\(--font-lineheight-body-large\);[\s\S]*?\.agent-studio-action-control-flow__matched-heading strong:last-child\s*\{[^}]*font-size:\s*var\(--font-size-heading-midsize\);[^}]*line-height:\s*var\(--font-lineheight-heading-midsize\);/,
    'Matched and its count should use the same type scale as Evaluated and its count',
  );
  assert.match(
    styles,
    /\.agent-studio-action-control-flow__matched-heading\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between;[\s\S]*?\.agent-studio-action-control-flow__action-item\s*\{[^}]*min-height:\s*40px;[^}]*justify-content:\s*space-between;[^}]*padding:\s*var\(--spacing-xx-small\)\s*var\(--spacing-medium\)\s*var\(--spacing-xx-small\)\s*var\(--spacing-x-small\);[^}]*background:\s*var\(--mds-color-theme-background-glass-normal, var\(--bg-glass\)\);/,
    'Matched and each action row should use the full-width Figma layout with clear trailing chip space',
  );
  assert.doesNotMatch(
    styles,
    /\.agent-studio-action-control-flow__matched-trigger\.is-selected|\.agent-studio-guardrail-chart__item\.is-selected/,
    'selected activity should not add an inner row fill or accent',
  );
  assert.doesNotMatch(
    styles,
    /\.agent-studio-action-control-flow__matched-trigger:hover[^}]*\{[^}]*padding(?:-top)?:/,
    'hovering the matched group should not shift the card content',
  );
  assert.match(
    styles,
    /\.agent-studio-action-control-flow__outcome-connector img\s*\{[^}]*width:\s*16px;[^}]*height:\s*7px;[^}]*transform:\s*rotate\(90deg\);/,
    'the connector should keep the original arrow aspect ratio when rotated vertically',
  );
  assert.match(
    styles,
    /\.agent-studio-action-control-flow__chip\s*\{[^}]*padding-inline:\s*var\(--spacing-xx-small\);/,
    'both Momentum chips should use the requested 8px side padding',
  );
  assert.match(
    source,
    /isDetailInteractive && detailSelectionType[\s\S]*?`is-detail-interactive--\$\{detailSelectionType\}`/,
    'each full-card disclosure should carry its action-control or guardrail accent identity',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-chart\.is-detail-selected\s*\{[^}]*border-width:\s*var\(--border-width-medium\);[^}]*border-color:\s*color-mix\(in srgb, var\(--agent-studio-detail-accent\) 72%, var\(--border-color\)\);[^}]*\}/,
    'the selected activity card should use a clear two-pixel semantic border',
  );
  const selectedActivityCardRule = styles.match(
    /\.agent-studio-connected-chart\.is-detail-selected\s*\{[^}]*\}/,
  )?.[0] ?? '';
  assert.doesNotMatch(
    selectedActivityCardRule,
    /background:|box-shadow:/,
    'the selected activity card should not add a fill or shadow',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-chart\.is-detail-interactive--action-control,[\s\S]*?--agent-studio-detail-accent:\s*var\(--accent-color\);[\s\S]*?\.agent-studio-connected-chart\.is-detail-interactive--guardrail,[\s\S]*?--agent-studio-detail-accent:\s*var\(--accent-color\);/,
    'Agent control and Guardrail activity cards should share the same blue interaction accent',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-chart\.is-detail-interactive:hover:not\(\.is-detail-selected\)\s*\{[^}]*border-color:[^}]*var\(--agent-studio-detail-accent\)[^}]*background:[^}]*var\(--agent-studio-detail-accent\)/,
    'both full-card disclosure targets should provide a subtle semantic hover state',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-chart\.is-detail-interactive\.is-detail-selected:hover\s*\{[^}]*border-color:[^}]*var\(--agent-studio-detail-accent\)/,
    'hovering an active card should keep its semantic border responsive',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-chart__disclosure\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*cursor:\s*pointer;/,
    'the native disclosure target should cover the complete activity card',
  );
  assert.doesNotMatch(
    source,
    /agent-studio-action-control-flow__(?:summary-icon|decision|column-headings|row-divider)|Original action ran|No match|Gated action unlocked/,
    'the replacement should remove the previous icon tile, decision boxes, and legacy outcome labels',
  );
  assert.doesNotMatch(
    source,
    /selectedActionControlMetric|ActionControlActivityMetricId|aria-pressed=\{isSelected\}/,
    'aggregate action-control counts should not pretend to be mutually exclusive filters',
  );
});

test('overview and navigation reuse the same capability icon language', () => {
  const categoryIconSource = readSource('../../components/shared/ConfigurationCategoryIcon.tsx');
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');

  assert.match(
    categoryIconSource,
    /type === ['"]action['"][\s\S]*?<Icon name="tools" weight="regular"/,
    'Actions should use the Tools icon with the same visual weight as the other overview glyphs',
  );
  assert.match(
    categoryIconSource,
    /type === ['"]action-control['"][\s\S]*?<Icon name="automation" weight="bold"/,
    'Agent control should use the same steer icon as its Steered status',
  );
  assert.match(
    sidebarSource,
    /section:\s*['"]Knowledge['"][\s\S]*?icon:\s*<KnowledgeBookIcon size=\{24\} \/>/,
    'Knowledge navigation should reuse the overview book icon',
  );
  assert.match(
    overviewSource,
    /Maintain healthy coverage[\s\S]*?<KnowledgeBookIcon size=\{16\} \/>|<KnowledgeBookIcon size=\{16\} \/>[\s\S]*?Maintain healthy coverage/,
    'the knowledge coverage suggestion should use the same book icon',
  );
});

test('agent navigation uses the floating Uplift rail with collapse and expand handles', () => {
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');
  const layoutSource = readSource('../../components/layout/MainLayout.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    sidebarSource,
    /className="sidebar uplift-agent-panel"[\s\S]*?aria-label="Collapse agent navigation"[\s\S]*?className="sidebar-agent-back-link"[\s\S]*?<SideNav aria-label="Agent navigation"/,
    'the expanded agent rail should move directly from its back link into agent navigation',
  );
  assert.doesNotMatch(sidebarSource, /<h2>Progress<\/h2>|sidebar-agent-progress-title/);
  assert.match(
    sidebarSource,
    /className="uplift-agent-panel-handle"[\s\S]*?aria-label="Open agent navigation"[\s\S]*?openAgentPanel\(true\)/,
    'the collapsed rail should leave a discoverable expand handle',
  );
  assert.match(
    sidebarSource,
    /icon="dashboard-bold"[\s\S]*?label="Overview"[\s\S]*?active=\{isOverviewRoute\}/,
    'Overview should use the same icon and selected state as the Uplift rail',
  );
  assert.doesNotMatch(
    sidebarSource,
    /sidebar-agent-pill__name|sidebar-agent-pill__meta/,
    'the agent identity belongs in the page header instead of competing with navigation',
  );
  assert.match(
    styles,
    /\.uplift-agent-panel\s*\{[^}]*position:\s*absolute\s*!important;[^}]*width:\s*232px\s*!important;[^}]*border-radius:\s*12px\s*!important;/,
    'the rail should use the Uplift floating glass-card contract',
  );
  assert.match(
    styles,
    /\.uplift-agent-panel-handle\s*\{[^}]*width:\s*20px;[^}]*height:\s*40px;/,
    'the collapsed handle should retain the Uplift dimensions',
  );
  assert.match(
    styles,
    /\.sidebar-agent-back-link:hover\s*\{[^}]*background:[^;}]+;[^}]*text-decoration:\s*none;/,
    'the back link should use a subtle fill instead of an underline on hover',
  );
  assert.match(
    layoutSource,
    /agentPanelOpen[\s\S]*?app--ai--agent-panel-open[\s\S]*?agentPanelOpen=\{agentPanelOpen\}[\s\S]*?onAgentPanelOpenChange=\{setAgentPanelOpen\}/,
    'the application shell should own and expose the floating rail state',
  );
});

test('agent navigation groups deployment destinations under Deploy and renders Flow', () => {
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');

  assert.doesNotMatch(
    sidebarSource,
    /const CONFIGURE_ITEMS[\s\S]*?section:\s*['"]Channels['"][\s\S]*?const DEPLOY_ITEMS/,
    'Channels should no longer belong to the Configure section',
  );
  assert.match(
    sidebarSource,
    /const DEPLOY_ITEMS[\s\S]*?section:\s*['"]Channels['"][\s\S]*?section:\s*['"]Flow['"][\s\S]*?<SideNav\.Section header="Deploy">[\s\S]*?deployItems\.map/,
    'Deploy should contain Channels followed by Flow',
  );
  assert.match(
    sidebarSource,
    /const TESTING_ITEM:[\s\S]*?path:\s*['"]analytics['"][\s\S]*?<SideNav\.Section header="Configure">[\s\S]*?configureItems\.map[\s\S]*?label=\{TESTING_ITEM\.label\}[\s\S]*?<\/SideNav\.Section>[\s\S]*?<SideNav\.Section header="Deploy">/,
    'Testing should be the final destination in Configure while preserving its analytics route',
  );
  assert.doesNotMatch(
    sidebarSource,
    /<SideNav\.Section header="Monitor">[\s\S]*?label=\{TESTING_ITEM\.label\}/,
    'Monitor should no longer render Testing',
  );
  assert.match(
    sidebarSource,
    /sidenav__tab--active['"]\)[\s\S]*?scrollIntoView\(\{ block: ['"]nearest['"] \}\)/,
    'the selected destination should remain visible when the longer agent rail scrolls',
  );
  assert.match(
    configureSource,
    /type ConfigurationSection[^;]*['"]Flow['"][\s\S]*?Flow:\s*['"]Flow['"][\s\S]*?activeSection === ['"]Flow['"][\s\S]*?title="No flow configured"/,
    'Flow should be a selectable configuration destination with its own page state',
  );
});

test('agent list, Overview, configuration, Testing, and Observability share the responsive high-visibility aurora', () => {
  const layoutSource = readSource('../../components/layout/MainLayout.tsx');
  const testingSource = readSource('../../pages/agent/AgentAnalytics.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.ok(
    layoutSource.includes("const isAgentsList = /^\\/agents\\/?$/.test(location.pathname);") &&
      layoutSource.includes("isAgentContext && /^\\/agents\\/[^/]+\\/configure\\/?$/.test(location.pathname);") &&
      layoutSource.includes("isAgentContext && /^\\/agents\\/[^/]+\\/analytics\\/?$/.test(location.pathname);") &&
      layoutSource.includes('isAgentsList || isAgentOverview || isAgentConfigure || isAgentTesting || isObservability') &&
      layoutSource.includes('app--ai__bg--studio-aurora') &&
      layoutSource.includes('app--ai--studio-aurora'),
    'the agent list, exact Overview, all configuration sections, Testing, and Observability should receive the shared aurora modifiers',
  );
  assert.match(
    testingSource,
    /className="primary-content agent-workspace-page agent-testing-workspace-page"/,
    'Testing should expose a dedicated workspace class for the shared aurora glass treatment',
  );
  assert.match(
    styles,
    /\.app--ai__bg--studio-aurora::before\s*\{[^}]*left:\s*clamp\([^;]+;[^}]*width:\s*clamp\([^;]+;[^}]*filter:\s*blur\(clamp\(/,
    'the blue field should use responsive positioning, scale, and blur instead of fixed viewport coordinates',
  );
  assert.match(
    styles,
    /\.app--ai--studio-aurora:not\(\.app--ai--agent-context\) > \.sidebar\s*\{[^}]*background:\s*none;/,
    'the workspace navigation rail should remain transparent over the shared aurora',
  );
  assert.match(
    styles,
    /:has\(\.app--ai--studio-aurora\)[\s\S]*?\.app--ai__bg--studio-aurora::before\s*\{[^}]*bottom:\s*clamp\(-18rem,\s*-18vh,\s*-10rem\);/,
    'the shared aurora should continue underneath the fixed global header on workspace and agent-detail routes',
  );
  assert.match(
    styles,
    /:has\(\.app--ai--studio-aurora:not\(\.app--ai--agent-context\)\)[\s\S]*?\.app--ai__bg--studio-aurora::before\s*\{[^}]*left:\s*clamp\(-2rem,\s*2vw,\s*2rem\);/,
    'the workspace aurora should continue underneath the transparent navigation rail',
  );
  assert.match(
    styles,
    /html\[data-product=['"]ai-agent-studio['"]\] \.app-header\s*\{[^}]*background:\s*none;[^}]*border-bottom:\s*0;/,
    'the global AI Agent Studio header should not paint a separate background or bottom border',
  );
  assert.match(
    styles,
    /\.app--ai--studio-aurora \.primary-content\.ai-agents-page,[\s\S]*?\.primary-content\.agent-studio-landing,[\s\S]*?\.primary-content\.action-config-v2-page,[\s\S]*?\.primary-content\.agent-testing-workspace-page,[\s\S]*?\.clus-kpi-dashboard-root\s*\{[^}]*backdrop-filter:\s*blur\(28px\)/,
    'the list, Overview, configuration, Testing, and Observability surfaces should share the same responsive glass blur',
  );
  assert.match(
    styles,
    /\.app--ai--studio-aurora \.primary-content\.agent-studio-landing,\s*\.app--ai--studio-aurora \.primary-content\.action-config-v2-page,\s*\.app--ai--studio-aurora \.primary-content\.agent-testing-workspace-page\s*\{[^}]*36%/,
    'Overview, configuration, and Testing should retain the same lighter theme-colored glass surface',
  );
  assert.match(
    styles,
    /@media \(max-width:\s*767px\)[\s\S]*?\.app--ai__bg--studio-aurora::before\s*\{[^}]*width:\s*160vw;/,
    'compact screens should retain a broad center-crossing blue field',
  );
  assert.match(
    styles,
    /@media \(max-width:\s*767px\)[\s\S]*?\.app--ai--studio-aurora \.primary-content\.agent-studio-landing,\s*\.app--ai--studio-aurora \.primary-content\.action-config-v2-page,\s*\.app--ai--studio-aurora \.primary-content\.agent-testing-workspace-page\s*\{[^}]*42%/,
    'compact Overview, configuration, and Testing screens should keep a slightly stronger readable glass layer',
  );
  assert.match(
    styles,
    /\[data-theme=['"]light['"]\] \.app--ai--studio-aurora \.primary-content\.ai-agents-page,\s*\[data-theme=['"]light['"]\] \.app--ai--studio-aurora \.clus-kpi-dashboard-root\s*\{[^}]*60%[^}]*border:\s*none;/,
    'AI Agents and Observability should continue sharing one borderless surface in light mode',
  );
  assert.match(
    styles,
    /\.primary-content\.agent-studio-landing\s*>\s*\.agent-header-sticky,[\s\S]*?\.agent-header-sticky::before\s*\{[^}]*background:\s*transparent;[\s\S]*?\.agent-header-sticky\.agent-header-stuck,[\s\S]*?\.agent-header-sticky\.agent-header-stuck::before\s*\{[^}]*background:\s*var\(--mds-color-theme-background-solid-primary-normal\);/,
    'the Overview identity bar should stay transparent at rest and become solid only while stuck',
  );
  assert.match(
    styles,
    /\.primary-content\.agent-workspace-page\s*>\s*\.agent-header-sticky,[\s\S]*?\.primary-content\.agent-workspace-page\s*>\s*\.agent-header-sticky::before\s*\{[^}]*background:\s*transparent;[\s\S]*?\.primary-content\.agent-workspace-page\s*>\s*\.agent-header-sticky\.agent-header-stuck,[\s\S]*?\.primary-content\.agent-workspace-page\s*>\s*\.agent-header-sticky\.agent-header-stuck::before\s*\{[^}]*background:\s*var\(--mds-color-theme-background-solid-primary-normal\);/,
    'configuration and monitor identity bars should stay transparent until scrolling makes them sticky',
  );
});

test('configuration and monitor destinations reuse the Overview page-heading contract', () => {
  const headingSource = readSource('../../components/agents/AgentWorkspacePageHeading.tsx');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const testingSource = readSource('../../pages/agent/AgentAnalytics.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');
  const historySource = readSource('../../pages/agent/AgentHistory.tsx');
  const productStyles = readSource('../../products/ai-agent-studio/components.css');
  const sharedStyles = readSource('../../components.css');

  assert.match(
    headingSource,
    /className="agent-workspace-page-heading"[\s\S]*?<h1 id=\{id\}>\{title\}<\/h1>[\s\S]*?agent-workspace-page-heading__actions/,
    'each destination should render one reusable page-level heading and action row',
  );
  assert.match(
    configureSource,
    /CONFIGURATION_PAGE_TITLES[\s\S]*?Knowledge:\s*['"]Knowledge & Memory['"][\s\S]*?Action:\s*['"]Actions['"][\s\S]*?className="primary-content action-config-v2-page agent-workspace-page"[\s\S]*?<AgentWorkspacePageHeading title=\{pageTitle\} actions=\{pageActions\}/,
    'all configuration destinations should use the shared title contract',
  );
  assert.match(testingSource, /className="primary-content agent-workspace-page agent-testing-workspace-page"[\s\S]*?<AgentWorkspacePageHeading title="Testing"/);
  assert.match(sessionsSource, /className="primary-content agent-workspace-page"[\s\S]*?<AgentWorkspacePageHeading[\s\S]*?title="Sessions"/);
  assert.match(historySource, /className="primary-content agent-workspace-page"[\s\S]*?<AgentWorkspacePageHeading title="History"/);
  assert.match(configureSource, /className="action-config-v2-shell agent-workspace-section-canvas"/);
  assert.match(testingSource, /className="secondary-content agent-testing-page agent-testing-page--builder agent-workspace-section-canvas"/);
  assert.match(sessionsSource, /agent-sessions-page agent-workspace-section-canvas/);
  assert.match(historySource, /className="secondary-content agent-workspace-section-canvas"/);
  assert.match(
    productStyles,
    /\.agent-studio-landing,\s*\.agent-workspace-page\s*\{[^}]*gap:\s*var\(--spacing-medium\);/,
    'Overview and the other agent pages should share the same vertical rhythm',
  );
  assert.match(
    productStyles,
    /\.agent-workspace-section-canvas\s*\{[^}]*padding:\s*var\(--spacing-medium\);[^}]*border:\s*0;[^}]*border-radius:\s*var\(--border-radius-medium, 8px\);[^}]*background:\s*var\(--mds-color-theme-background-glass-medium, rgba\(0, 0, 0, 0\.6\)\);[^}]*box-shadow:\s*none;/,
    'Configure, Deploy, and Monitor content should reuse the dark Overview section surface',
  );
  assert.match(
    productStyles,
    /\.agent-studio-hero h1,\s*\.agent-workspace-page-heading h1\s*\{[^}]*font-size:\s*var\(--font-size-heading-midsize\);[^}]*font-weight:\s*var\(--font-weight-bold\);[^}]*line-height:\s*var\(--font-lineheight-heading-midsize\);[^}]*letter-spacing:\s*-0\.01em;/,
    'all destination titles should inherit the exact Overview typography declaration',
  );
  assert.match(
    sharedStyles,
    /\.action-config-v2-page\s*\{[^}]*padding-top:\s*var\(--spacing-large\);/,
    'configuration pages should use the same 24px top offset as Overview',
  );
  assert.match(
    sharedStyles,
    /\.action-config-v2-page\s*>\s*\.agent-workspace-page-heading\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*3;/,
    'configuration page menus should stack above the table content',
  );
  assert.match(
    sharedStyles,
    /\.action-config-v2-table\s*\{[^}]*min-width:\s*1232px;[\s\S]*?\.action-config-v2-table \.col-action-name\s*\{\s*width:\s*168px;[\s\S]*?\.action-config-v2-table \.col-created-by\s*\{\s*width:\s*112px;[\s\S]*?\.action-config-v2-table \.col-description\s*\{\s*width:\s*350px;/,
    'the Actions table should keep identity columns compact and reserve enough width for readable descriptions',
  );
  assert.match(
    configureSource,
    /action-config-v2-table-wrap action-config-v2-table-wrap--actions[\s\S]*?action-config-v2-table action-config-v2-table--actions/,
    'the Actions table should use its responsive, no-horizontal-scroll layout',
  );
  assert.match(
    sharedStyles,
    /\.action-config-v2-table-wrap--actions\s*\{[^}]*overflow-x:\s*hidden;[\s\S]*?\.action-config-v2-table--actions\s*\{[^}]*min-width:\s*0;[\s\S]*?\.action-config-v2-table--actions \.col-action-name\s*\{\s*width:\s*18%;[\s\S]*?\.action-config-v2-table--actions \.col-created-by\s*\{\s*width:\s*8%;[\s\S]*?\.action-config-v2-table--actions \.col-description\s*\{\s*width:\s*22%;[\s\S]*?\.action-config-v2-table--actions \.col-galileo\s*\{\s*width:\s*21%;/,
    'the responsive Actions table should fit the Galileo status and row actions without horizontal scrolling',
  );
  assert.match(
    sharedStyles,
    /\.add-action-menu\s*\{[^}]*isolation:\s*isolate;[^}]*overflow:\s*hidden;[^}]*border:\s*var\(--border-width-small\) solid var\(--border-color\);[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.84\);[^}]*backdrop-filter:\s*blur\(40px\) saturate\(115%\);[^}]*-webkit-backdrop-filter:\s*blur\(40px\) saturate\(115%\);/,
    'the Add actions menu should retain a complete dark-glass border and strong backdrop blur',
  );
  assert.doesNotMatch(configureSource, /<h3 className="(?:v2-channels__title|action-config-v2-title)">(?:Channels|Profile|Actions)<\/h3>/);
});

test('overview suggestions stay hidden while the section is paused', () => {
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  assert.match(
    overviewSource,
    /const SHOW_CONNECTED_SUGGESTIONS = false;[\s\S]*?\{SHOW_CONNECTED_SUGGESTIONS && \([\s\S]*?className="agent-studio-connected-insights"/,
    'the Suggestions section should remain out of the rendered overview',
  );
});

test('operational status presents its metrics as a compact table with a dashboard link', () => {
  const studioSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  assert.match(
    studioSource,
    /const observabilityPath = `\/observability\?agent=\$\{encodeURIComponent\(agent\.name\)\}`;/,
    'the dashboard action should preserve the current agent filter',
  );
  assert.match(
    studioSource,
    /className="agent-studio-operational-metrics-table"[\s\S]*?<th scope="col">Metric<\/th>[\s\S]*?<th scope="col">Value<\/th>[\s\S]*?<th scope="col">Change<\/th>[\s\S]*?OPERATIONAL_HEALTH_METRICS\.map/,
    'the operational metrics should remain compact and scannable',
  );
  assert.match(
    studioSource,
    /onClick=\{\(\) => navigate\(observabilityPath\)\}[\s\S]*?View observability dashboard/,
    'the detailed dashboard should remain one explicit action away',
  );
  assert.match(
    demoSource,
    /label: 'Control evaluations',[\s\S]*?value: '18'[\s\S]*?change: '6h aggregate'[\s\S]*?label: 'Steer outcomes',[\s\S]*?value: '3'[\s\S]*?change: '6h aggregate'/,
    'the operational table should include the two six-hour aggregate agent control metrics',
  );
  assert.doesNotMatch(
    studioSource,
    /label: 'Fulfilment latency P95'/,
    'the operational table should no longer include fulfilment latency P95',
  );
  assert.doesNotMatch(studioSource, /<KPICard|<KPIChart/);
  assert.match(
    styles,
    /\.agent-studio-grid > \.agent-studio-card\.card\s*\{[^}]*margin-bottom:\s*0;/,
    'overview cards should rely on the responsive grid gap instead of adding a second bottom margin',
  );
});

test('EAGLE GREEN pins agent control metrics instead of fulfilment latency', () => {
  const dashboardSource = readSource('../../features/clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');
  const defaultPins = dashboardSource.match(/const DEFAULT_PINNED_CARD_IDS = \[([\s\S]*?)\];/)?.[1] ?? '';

  assert.match(defaultPins, /'ac-control-evaluations'/);
  assert.match(defaultPins, /'ac-steer-outcomes'/);
  assert.doesNotMatch(defaultPins, /'ap-fulfilment-latency-p95'/);
});

test('EAGLE GREEN pinned metrics share the exact Overview values', () => {
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const dashboardSource = readSource('../../features/clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');

  assert.match(
    demoSource,
    /CISCO_LIVE_OPERATIONAL_HEALTH_METRICS[\s\S]*?observabilityKpiId: 'kp-knowledge-coverage'[\s\S]*?value: '94\.8%'[\s\S]*?observabilityKpiId: 'sec-guardrails-trigger-flag'[\s\S]*?value: '0\.8%'[\s\S]*?observabilityKpiId: 'ce-containment-rate'[\s\S]*?value: '91\.6%'[\s\S]*?observabilityKpiId: 'ap-intent-success-rate'[\s\S]*?value: '97\.8%'[\s\S]*?observabilityKpiId: 'bi-autocsat-improvement'[\s\S]*?value: '8\.6%'[\s\S]*?observabilityKpiId: 'ce-csat-predictor'[\s\S]*?value: '4\.7\/5'/,
    'the shared demo source should preserve every Overview headline value',
  );
  assert.match(
    overviewSource,
    /OPERATIONAL_HEALTH_METRICS\s*=\s*CISCO_LIVE_OPERATIONAL_HEALTH_METRICS/,
    'Overview should render the shared metric source',
  );
  assert.match(
    dashboardSource,
    /function alignKpiWithCiscoLiveOverview[\s\S]*?CISCO_LIVE_OPERATIONAL_HEALTH_METRICS\.find[\s\S]*?thresholdStatus: 'good'[\s\S]*?overviewAlignedKpis[\s\S]*?actionControlKpis[\s\S]*?alignKpiWithCiscoLiveOverview\(kpi, dateRange\)/,
    'Observability should align both regular and trace-derived pinned metrics with Overview and keep their healthy status',
  );
});

test('EAGLE GREEN uses proportionate six-hour and 24-hour agent control aggregates', () => {
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const dashboardSource = readSource('../../features/clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');

  assert.match(
    demoSource,
    /CISCO_LIVE_ACTION_CONTROL_SUMMARY_6H[\s\S]*?evaluated: 18[\s\S]*?matched: 4[\s\S]*?notMatched: 14[\s\S]*?steered: 3[\s\S]*?unlocked: 1[\s\S]*?matchRate: 22[\s\S]*?CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H[\s\S]*?evaluated: 64[\s\S]*?matched: 14[\s\S]*?notMatched: 50[\s\S]*?steered: 11[\s\S]*?unlocked: 3[\s\S]*?matchRate: 22/,
    'the aggregates should remain credible for a focused demo window',
  );
  assert.match(overviewSource, /useState\('6h'\)/);
  assert.match(
    overviewSource,
    /operationalTimeRange === '6h'[\s\S]*?CISCO_LIVE_ACTION_CONTROL_SUMMARY_6H[\s\S]*?operationalTimeRange === '24h'[\s\S]*?CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H/,
    'Overview should use the six-hour aggregate by default and preserve the 24-hour option',
  );
  assert.match(
    dashboardSource,
    /function alignKpiWithCiscoLiveActionControl24h[\s\S]*?summary\.evaluated[\s\S]*?summary\.matchRate[\s\S]*?summary\.steered[\s\S]*?dateRange === '24h'/,
    'Observability should use the same evaluated, match-rate, and steer totals',
  );
});

test('EAGLE GREEN Business Impact isolates the voice productivity alert', () => {
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const dashboardSource = readSource('../../features/clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');

  assert.match(
    demoSource,
    /CISCO_LIVE_BUSINESS_IMPACT_METRICS[\s\S]*?observabilityKpiId: 'bi-aht-reduction'[\s\S]*?value: '32\.4%'[\s\S]*?change: '\+4\.8%'[\s\S]*?thresholdStatus: 'good'[\s\S]*?observabilityKpiId: 'bi-first-contact-resolution'[\s\S]*?value: '92\.4%'[\s\S]*?thresholdStatus: 'good'[\s\S]*?observabilityKpiId: 'bi-ai-agent-productivity-voice'[\s\S]*?value: '77\.9%'[\s\S]*?change: '-5\.6%'[\s\S]*?thresholdStatus: 'bad'[\s\S]*?observabilityKpiId: 'bi-ai-agent-productivity-digital'[\s\S]*?value: '92\.9%'[\s\S]*?thresholdStatus: 'good'/,
    'the demo should keep Voice productivity as the only Business Impact alert',
  );
  assert.match(
    dashboardSource,
    /function alignKpiWithCiscoLiveBusinessImpact[\s\S]*?CISCO_LIVE_BUSINESS_IMPACT_METRICS\.find[\s\S]*?alignKpiWithCiscoLiveBusinessImpact\(kpi, dateRange\)/,
    'the Eagle Green dashboard should apply the curated Business Impact story after agent scoping',
  );
});

test('EAGLE GREEN card and expanded trends share one constrained series', () => {
  const dashboardSource = readSource('../../features/clus-kpi-dashboard/ClusKpiDashboardRoot.tsx');
  const cardSource = readSource('../../features/clus-kpi-dashboard/components/KPICard.tsx');
  const chartSource = readSource('../../features/clus-kpi-dashboard/components/KPIChart.tsx');
  const chartAxisSource = readSource('../../features/clus-kpi-dashboard/kpiChartAxis.ts');

  assert.match(
    dashboardSource,
    /function buildReportedTrendSeries[\s\S]*?currentValue \/ priorPeriodFactor[\s\S]*?noiseState \* 0\.62 \+ innovation \* 0\.58[\s\S]*?bridgeNoise[\s\S]*?series\[0\][\s\S]*?series\[series\.length - 1\]/,
    'curated cards should keep exact reported endpoints around non-periodic correlated variation',
  );
  assert.match(
    dashboardSource,
    /function alignKpiWithCiscoLiveOverview[\s\S]*?sparklineData: buildReportedTrendSeries[\s\S]*?function alignKpiWithCiscoLiveBusinessImpact[\s\S]*?sparklineData: buildReportedTrendSeries/,
    'the pinned Overview and Business Impact cards should share the reported trend series with their expanded charts',
  );
  assert.match(
    dashboardSource,
    /function alignKpiWithCiscoLiveActionControl24h[\s\S]*?sparklineData: undefined[\s\S]*?sparklineType: undefined/,
    'curated 24-hour action-control totals should not display incomplete drill-down samples as their trend',
  );
  assert.match(
    dashboardSource,
    /function scopeKpiToAgent[\s\S]*?scopedChangeFactor = 0\.78[\s\S]*?Math\.min\(14\.8, Math\.max\(1\.2[\s\S]*?buildReportedTrendSeries\(scopedKpi, value, unit, change, dateRange\)/,
    'agent-scoped metrics should keep varied, plausible changes and align their card trend to the displayed delta',
  );
  assert.doesNotMatch(
    dashboardSource,
    /aggregateToAgentScale - 1/,
    'agent population scaling must not masquerade as a time-over-time trend',
  );
  assert.match(
    cardSource,
    /scale === 'relative-change'[\s\S]*?\(value - priorPeriodValue\) \/ Math\.abs\(priorPeriodValue\)[\s\S]*?relativeChange \/ 0\.1/,
    'reported trends should share one relative-change scale',
  );
  assert.doesNotMatch(chartSource, /idx % safeSparklineData\.length/);
  assert.match(
    chartSource,
    /AutoCSAT[\s\S]*?const isCSAT = unit === '\/5'/,
    'expanded charts should derive the rating scale from the unit instead of misclassifying AutoCSAT percentages',
  );
  assert.match(
    chartSource,
    /sourcePosition[\s\S]*?lowerValue \+ \(upperValue - lowerValue\) \* interpolation/,
    'expanded charts should resample source data instead of repeating a short pattern',
  );
  assert.match(
    chartAxisSource,
    /sparklineScale === 'relative-change'[\s\S]*?dataSpan \* 1\.5[\s\S]*?minimumWindow[\s\S]*?domainMin[\s\S]*?domainMax/,
    'reported trends should use a bounded data-focused axis instead of flattening percentages onto 0–100',
  );
  assert.match(
    cardSource,
    /type === 'area' \? \([\s\S]*?<polygon points=\{areaPoints\}/,
    'line sparklines should avoid implying cumulative area beneath a point-in-time trend',
  );
});

test('selected guardrail activity opens its original event banner', () => {
  const studioSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    studioSource,
    /id=\{detailId\}[\s\S]*?hidden=\{!isDetailSelected\}[\s\S]*?<Banner[\s\S]*?type="info"[\s\S]*?eagleGuardrailSessionPath/,
    'the selected guardrail event should share the agent-control information banner and link to its session',
  );
  assert.match(
    studioSource,
    /Guardrail activity, latest trigger[\s\S]*?aria-expanded=\{isDetailSelected\}[\s\S]*?aria-controls=\{detailId\}/,
    'the whole guardrail card should disclose the shared guardrail banner',
  );
  assert.match(
    studioSource,
    /guardrail\.count > 0 \? \([\s\S]*?<button[\s\S]*?guardrailExpanded \? ['"]is-selected['"] : ['"]["'][\s\S]*?aria-expanded=\{guardrailExpanded\}[\s\S]*?aria-controls=\{GUARDRAIL_DETAIL_ID\}[\s\S]*?setSelectedGuardrailActivity\(guardrail\.item\);[\s\S]*?setSelectedOverviewIntervention\(['"]guardrail['"]\)[\s\S]*?: \([\s\S]*?<div className="agent-studio-guardrail-chart__plot">/,
    'each triggered guardrail bar should switch to its own banner while zero-count rows remain noninteractive',
  );
  assert.match(
    styles,
    /button\.agent-studio-guardrail-chart__plot\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;[^}]*cursor:\s*pointer;[\s\S]*?button\.agent-studio-guardrail-chart__plot:hover\s*\{[^}]*background:/,
    'triggered guardrail bars should remain clickable above the full-card target and expose a hover state',
  );
  assert.match(
    styles,
    /button\.agent-studio-guardrail-chart__plot\.is-selected \.agent-studio-guardrail-chart__track i\s*\{[^}]*background:\s*var\(--mds-color-theme-outline-label-lime\);/,
    'the selected guardrail should highlight only its filled bar in the protection accent',
  );
  assert.match(
    styles,
    /\.configuration-category-icon--guardrail\s*\{[^}]*color:\s*var\(--mds-color-theme-outline-label-lime\);[\s\S]*?\.agent-studio-capability-signal__track--guardrail > span\s*\{[^}]*background:\s*var\(--mds-color-theme-outline-label-lime\);|\.agent-studio-capability-signal__track--guardrail > span\s*\{[^}]*background:\s*var\(--mds-color-theme-outline-label-lime\);[\s\S]*?\.configuration-category-icon--guardrail\s*\{[^}]*color:\s*var\(--mds-color-theme-outline-label-lime\);/,
    'guardrail capability icons and signal bars should use a non-warning protection accent',
  );
  assert.doesNotMatch(
    styles,
    /button\.agent-studio-guardrail-chart__plot\.is-selected(?:\s*|:hover)\s*\{[^}]*(?:background|box-shadow|border):/,
    'the selected guardrail row should not add a background, border, or inset outline',
  );
  assert.doesNotMatch(
    styles,
    /button\.agent-studio-guardrail-chart__plot\.is-selected \.agent-studio-guardrail-chart__track\s*\{/,
    'the selected guardrail should not recolor the empty track',
  );
  assert.match(
    styles,
    /button\.agent-studio-guardrail-chart__plot:focus-visible\s*\{[^}]*outline:\s*none;[\s\S]*?button\.agent-studio-guardrail-chart__plot:focus-visible \.agent-studio-guardrail-chart__track i\s*\{[^}]*filter:\s*brightness/,
    'normal focus feedback should stay on the bar instead of drawing a row border',
  );
  assert.match(
    studioSource,
    /const nextGuardrail = showSelectedGuardrailDecision[\s\S]*?\? null[\s\S]*?: defaultTriggeredGuardrailName;[\s\S]*?setSelectedGuardrailActivity\(nextGuardrail\)/,
    'clicking the selected guardrail card should clear the selection and hide its event detail',
  );
  assert.match(
    studioSource,
    /actionControlSpotlightDecision\.sessionId[\s\S]*?allAgentSessions\.find\(session => \([\s\S]*?session\.guardrailTriggered[\s\S]*?eagleGuardrailSession\.id/,
    'the action-control and guardrail spotlights should each resolve the concrete Session that owns their event',
  );
  assert.match(
    studioSource,
    /const eagleGuardrailSession = allAgentSessions\.find\(session => \([\s\S]*?session\.guardrail\?\.name === selectedGuardrailName[\s\S]*?\)\) \?\? allAgentSessions\.find/,
    'each selected guardrail should open the session that contains its own decision evidence',
  );
  assert.match(studioSource, /eagleGuardrailSessionPath[\s\S]*?source=overview/);
  assert.match(
    sessionsSource,
    /const canonicalSessionId = sessionIdQuery\.toLowerCase\(\) === ['"]ses-gt-1045['"][\s\S]*?['"]SES-GT-1042['"][\s\S]*?const activeSession = canonicalSessionId[\s\S]*?sessions\.find/,
    'legacy payment-session links should resolve to the combined session detail',
  );
  assert.match(
    sessionsSource,
    /sessionIdQuery\.toLowerCase\(\) === ['"]ses-gt-1045['"][\s\S]*?<Navigate[\s\S]*?sessionId=SES-GT-1042[\s\S]*?replace/,
    'legacy payment-session URLs should normalize to the combined session ID',
  );
  assert.doesNotMatch(
    sessionsSource,
    />Session details</,
    'the session detail topbar should show only its source-aware back action',
  );
  assert.match(sessionsSource, /Conversation transcript/);
  const sessionTitleRow = sessionsSource.match(/<div className="agent-session-detail-title-row">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.match(sessionTitleRow, /session\.outcome/);
  assert.doesNotMatch(sessionTitleRow, /Agent control|Guardrail triggered/);
  assert.match(sessionsSource, /agent-session-message__annotation--\$\{annotation\.kind\}/);
  assert.match(
    sessionsSource,
    /Back to observability[\s\S]*?\/observability\?agent=\$\{encodeURIComponent\(agent\.name\)\}/,
    'sessions opened from Observability should return to the filtered dashboard',
  );
  assert.match(
    studioSource,
    /eagleActionControlSessionPath[\s\S]*?source=overview/,
    'the action-control banner on Overview should identify Overview as its return destination',
  );
  assert.match(
    sessionsSource,
    /sourceQuery === ['"]overview['"][\s\S]*?label: ['"]Back to overview['"][\s\S]*?path: `\/agents\/\$\{encodeURIComponent\(agent\.id\)\}`/,
    'sessions opened from the Overview action-control banner should return to the agent Overview',
  );
});

test('Agent Home and start-from-scratch remove free composers without dead-ending intake', () => {
  const dashboardSource = readSource('../../pages/Dashboard.tsx');
  const homeSource = readSource('../agent-home/AgentHomeDashboard.tsx');
  const firstTimeFlowsSource = readSource('../agent-home/AgentHomeFirstTimeFlows.tsx');
  const homeStyles = readSource('../agent-home/agent-home.css');
  const evaSource = readSource('../eva/EvaChatExperience.tsx');
  const modelSource = readSource('./agentCreationModel.ts');
  const studioStyles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(dashboardSource, /<AgentHomeDashboard[\s\S]*?mode=\{mode\}[\s\S]*?snapshot=\{snapshot\}/);
  assert.doesNotMatch(homeSource, /agent-home__composer|composer:\s*ReactNode/);
  assert.match(
    dashboardSource,
    /agentHomeFlow === 'home' && \([\s\S]*?new-mvo-home__hero[\s\S]*?onFirstTimeFlowChange=\{setAgentHomeFlow\}/,
    'the large landing hero should only render on Agent Home, not inside template or demo flows',
  );
  assert.match(
    dashboardSource,
    /mode === 'recurring'[\s\S]*?new-mvo-home__hero--recurring[\s\S]*?mode === 'recurring' \? 'Hi Jackie' : 'AI Agent Studio'[\s\S]*?mode === 'first-time' && \([\s\S]*?Build, deploy, and manage AI agents for every interaction\./,
    'the recurring home should use the compact Hi Jackie hero while first-time keeps the branded supporting line',
  );
  assert.match(
    homeSource,
    /const changeFirstTimeFlow = useCallback[\s\S]*?setFirstTimeFlow\(nextFlow\);[\s\S]*?onFirstTimeFlowChange\?\.\(nextFlow\)/,
    'Agent Home should report a next-step flow before the next render can retain the Home hero',
  );
  assert.match(
    homeSource,
    /onFlowChange=\{changeFirstTimeFlow\}[\s\S]*?onBrowseTemplates=\{\(\) => changeFirstTimeFlow\('templates'\)\}/,
    'template and demo subflows should share the same route-level flow transition',
  );
  assert.match(
    dashboardSource,
    /const openGuidedIntake = \(\) => \{[\s\S]*?setAgentHomeFlow\('home'\);[\s\S]*?setSurface\('guided'\);[\s\S]*?action\.intent === 'start-intake'[\s\S]*?openGuidedIntake\(\)/,
    'every create-from-scratch entry should open the existing guided intake from a clean Agent Home state',
  );
  assert.match(
    homeSource,
    /const createFromScratchAction = snapshot\.actions\.find\(action => action\.intent === 'start-intake'\);[\s\S]*?<AgentHomeFirstTimeFlows[\s\S]*?onCreateFromScratch=\{createFromScratchAction[\s\S]*?\? \(\) => onAction\(createFromScratchAction\)/,
    'the ready-made flow should reuse the licensed start-intake action instead of creating a parallel route',
  );
  assert.match(
    firstTimeFlowsSource,
    /titleAction\?: ReactNode[\s\S]*?agent-home-flow__title-row[\s\S]*?titleAction=\{\([\s\S]*?<UpliftMomentumButton[\s\S]*?variant="secondary"[\s\S]*?size="sm"[\s\S]*?className="agent-home-flow__create-from-scratch"[\s\S]*?disabled=\{!onCreateFromScratch\}[\s\S]*?onClick=\{onCreateFromScratch\}[\s\S]*?Create from scratch/,
    'the ready-made heading should expose an accessible secondary Momentum action for the existing scratch flow',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow--templates \.agent-home-flow__title-row\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;[^}]*gap:\s*16px;[\s\S]*?\.agent-home-flow--templates \.agent-home-flow__create-from-scratch\s*\{[^}]*margin-top:\s*4px;/,
    'the desktop header action should align to the title line without squeezing the title copy',
  );
  assert.match(
    homeStyles,
    /@media \(max-width:\s*720px\)[\s\S]*?\.agent-home-flow--templates \.agent-home-flow__title-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*gap:\s*12px;[\s\S]*?\.agent-home-flow--templates \.agent-home-flow__create-from-scratch\s*\{[^}]*justify-self:\s*start;[^}]*margin-top:\s*0;/,
    'the secondary action should move below the complete title group on narrow screens',
  );
  assert.match(
    homeSource,
    /useEffect\(\(\) => \{\s*changeFirstTimeFlow\('home'\);\s*\}, \[changeFirstTimeFlow, mode\]\)/,
    'switching scenarios should reset both the child flow and route-level hero state',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home__hero\.eva-first-interface__hero\s*\{[^}]*animation:\s*none !important;/,
    'the landing hero should enter without a settle animation',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home__landing-shell:has\(\.agent-home--flow\) > \.new-mvo-home__hero\s*\{[^}]*display:\s*none/,
    'Home hero should remain hidden throughout every template and demo next step',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home--subflow > \.new-mvo-home__landing-shell\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.5\);[^}]*backdrop-filter:\s*blur\(28px\);/,
    'the outer landing shell should own the dark overlay throughout every subflow',
  );
  assert.match(
    homeStyles,
    /\.agent-home--flow\s*\{[^}]*background:\s*transparent;[^}]*backdrop-filter:\s*none;/,
    'the nested Agent Home flow should stay transparent so the overlay is not doubled',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow--templates \.agent-home-flow__industry-group > h3\s*\{[^}]*padding-bottom:\s*4px;/,
    'ready-made template category headings should keep a 4px separation from their first option',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home__landing-shell \.new-mvo-home__hero--recurring\.eva-first-interface__hero \.eva-landing-hero-brand h1\s*\{[^}]*font-size:\s*40px/,
    'the recurring dashboard should use a smaller Agent Studio heading',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home__hero--recurring\.eva-first-interface__hero\s*\{[^}]*padding-inline-start:\s*clamp\(20px, 4cqi, 56px\)[^}]*padding-inline-end:\s*calc\(clamp\(20px, 4cqi, 56px\) \+ 4px\)[^}]*text-align:\s*left/,
    'the recurring greeting should reuse the dashboard content insets',
  );
  assert.match(
    homeStyles,
    /\.new-mvo-home__hero--recurring\.eva-first-interface__hero \.eva-landing-hero-brand\s*\{[^}]*width:\s*min\(100%, 1200px\);[^}]*margin-inline:\s*auto/,
    'the recurring greeting should share the dashboard max width and centered container',
  );
  assert.match(
    homeStyles,
    /\.agent-home__first-action-card\.eva-landing-task-card\.card\s*\{[^}]*rgba\(7, 10, 18, 0\.68\)[^}]*rgba\(3, 5, 10, 0\.5\)[^}]*backdrop-filter:\s*blur\(24px\)/,
    'the first-time builder should use the requested translucent dark glass surface',
  );
  assert.match(
    homeStyles,
    /\.agent-home--first-time:not\(\.agent-home--flow\):not\(\.agent-home--recurring-create\)\s*\.agent-home__first-actions\s*\{[^}]*width:\s*min\(100%, 960px\);[^}]*margin-inline:\s*auto;/,
    'the first-time builder should stay centered and stop stretching beyond 960px',
  );
  assert.match(
    homeStyles,
    /\.agent-home__first-action-card--builder\.eva-landing-task-card\.card::before\s*\{[^}]*padding:\s*var\(--border-ai-special-width\);[^}]*background:\s*var\(--border-ai-special-source\);[^}]*mask-composite:\s*exclude;/,
    'the first-agent builder should reuse the Uplift AI angular gradient border',
  );
  assert.match(
    homeStyles,
    /\.eva-landing-task-card__agent-types\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);[^}]*gap:\s*32px;/,
    'the three agent type groups should be separated by spacing',
  );
  assert.match(
    homeSource,
    /<h3 id="agent-home-agent-types-title" className="eva-landing-task-card__agent-types-title">\s*Available agent types\s*<\/h3>[\s\S]*?<ul[\s\S]*?aria-labelledby="agent-home-agent-types-title"/,
    'the first-agent card should label its available agent type group',
  );
  assert.match(
    homeStyles,
    /\.eva-landing-task-card__agent-types-title\s*\{[^}]*color:\s*rgba\(255, 255, 255, 0\.5\);[^}]*font-weight:\s*400;/,
    'the available-agent-types heading should use subdued secondary text styling',
  );
  const firstAgentTypeRuleStart = homeStyles.indexOf('.eva-landing-task-card__agent-types > li {');
  const firstAgentTypeRuleEnd = homeStyles.indexOf('}', firstAgentTypeRuleStart);
  const firstAgentTypeRule = homeStyles.slice(firstAgentTypeRuleStart, firstAgentTypeRuleEnd);
  assert.doesNotMatch(
    firstAgentTypeRule,
    /background:|border-radius:|box-shadow:/,
    'agent type information should remain flat text groups rather than nested cards',
  );
  assert.match(
    homeStyles,
    /\.eva-landing-task-card__agent-type-content\s*\{[^}]*padding-inline:\s*0;/,
    'flat agent type groups should not retain the former card side padding',
  );
  assert.doesNotMatch(
    homeStyles,
    /@container uplift-assistant \(min-width: 1001px\) and \(max-width: 1200px\)[\s\S]*?\.eva-landing-task-card__agent-type-heading > strong/,
    'the original agent type typography should not shrink at intermediate widths',
  );
  const demoPreviewStart = firstTimeFlowsSource.indexOf('function DemoPreview');
  const demoPreviewEnd = firstTimeFlowsSource.indexOf('export default function AgentHomeFirstTimeFlows', demoPreviewStart);
  const demoPreviewSource = firstTimeFlowsSource.slice(demoPreviewStart, demoPreviewEnd);
  assert.doesNotMatch(
    demoPreviewSource,
    /agent-home-flow__preview-context|What this agent can do|Configured agent/,
    'the preview should no longer render a separate configured-agent summary card',
  );
  assert.match(
    demoPreviewSource,
    /agent-home-flow__test-actions[\s\S]*?Start with this agent/,
    'the template adoption action should live inside the remaining test panel',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow__preview-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/,
    'the remaining preview panel should use the full available width',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow--demo-preview \.agent-home-flow__title-group\s*\{[^}]*gap:\s*8px;[^}]*font-family:\s*['"]Momentum['"]/,
    'the preview title group should share the ready-made template header rhythm',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow--demo-preview \.agent-home-flow__header h1\s*\{[^}]*margin:\s*0;[^}]*font-size:\s*32px;[^}]*font-weight:\s*400;[^}]*line-height:\s*40px;/,
    'the preview heading should match the ready-made template heading typography',
  );
  assert.match(
    homeStyles,
    /\.agent-home-flow__voice-widget \.agent-home-flow__voice-avatar\s*\{[^}]*align-self:\s*center;[^}]*justify-content:\s*center;[^}]*margin-inline:\s*auto;/,
    'the voice preview icon should stay centered in its panel',
  );
  assert.match(
    homeStyles,
    /\.agent-home__focus-card\.card,[\s\S]*?rgba\(7, 10, 18, 0\.82\)[^}]*backdrop-filter:\s*blur\(24px\)/,
    'the recurring dashboard cards should use the same dark glass surface',
  );
  assert.match(
    dashboardSource,
    /<EvaChatExperience[\s\S]*?resetSessionOnInitialMount[\s\S]*?choiceOnlyGuidedFlow/,
    'Start from scratch should opt into the choice-only conversational flow',
  );
  assert.match(
    evaSource,
    /!choiceOnlyGuidedFlow && showBuildFlow[\s\S]*?eva-generated-composer/,
    'the generated-side composer should stay hidden in the choice-only flow',
  );
  assert.match(
    evaSource,
    /!choiceOnlyGuidedFlow && showBuildFlow && !showGeneratedSidePanel[\s\S]*?<AiFooter/,
    'the bottom composer should stay hidden in the choice-only flow',
  );
  assert.match(
    evaSource,
    /isChoiceOnlyFreeformIntake[\s\S]*?<PresetIntakeAnswer[\s\S]*?onSubmit=\{handleFamilyIntakeAnswer\}/,
    'non-option questions need an inline suggested answer and edit path',
  );
  assert.match(
    evaSource,
    /const resumePromptIndex = resumeMessage[\s\S]*?previous\.findLastIndex[\s\S]*?messagesWithoutSuspendedPrompt = resumePromptIndex >= 0[\s\S]*?previous\.filter\(\(_, index\) => index !== resumePromptIndex\)/,
    'editing a previous answer should temporarily remove the unanswered current prompt',
  );
  assert.match(
    evaSource,
    /aria-label="Edit agent name"[\s\S]*?familyIntakeEditingQuestion[\s\S]*?Cancel editing[\s\S]*?Use edited name/,
    'the name editor should place Cancel editing beside its primary confirmation action',
  );
  assert.match(
    evaSource,
    /CHOICE_ONLY_GUIDED_START[\s\S]*?What type of agent do you want to create\?[\s\S]*?getAdaptiveIntakeQuestions\(family, \{\}\)\[0\][\s\S]*?getAdaptiveIntakeQuestions\(selectedAgentFamily, nextAnswers\)/,
    'choice-only creation should follow the fixed main intake model from agent type through every family question',
  );
  assert.match(
    evaSource,
    /const FAMILY_CHOICE_LABELS[\s\S]*?contact_center:\s*'Customer service agent'[\s\S]*?calling:\s*'Phone receptionist'[\s\S]*?internal_assistant:\s*'Employee assistant'[\s\S]*?const AGENT_FAMILIES:\s*AgentFamily\[\]\s*=\s*\['contact_center',\s*'calling',\s*'internal_assistant'\]/,
    'the fixed intake should use the same three agent types and order as first-time Home',
  );
  assert.match(
    evaSource,
    /isFamilyChoicePrompt[\s\S]*?followups=\{[^}]*isFamilyChoicePrompt[^}]*\? \[\] : followups\}[\s\S]*?className="eva-family-choice-grid"[\s\S]*?AGENT_FAMILIES\.map\(family => \{[\s\S]*?getFamilyIntakeSequence\(family\)\.length \+ 1[\s\S]*?<Card[\s\S]*?clickable[\s\S]*?onClick=\{\(\) => handleAgentFamilySelect\(family, label\)\}/,
    'the guided family prompt should replace generic chips with large clickable cards whose step counts include Review',
  );
  assert.match(
    evaSource,
    /const FAMILY_CHOICE_DETAILS[\s\S]*?Serves customers across channels[\s\S]*?Handles customer service across voice, digital, and video[\s\S]*?Answers and routes calls[\s\S]*?Greets callers, answers common questions[\s\S]*?Helps employees get work done[\s\S]*?Uses company knowledge and tools/,
    'each agent-family card should explain the experience before selection',
  );
  assert.match(
    studioStyles,
    /\.eva-family-choice-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);[^}]*gap:[^;}]+;[\s\S]*?\.eva-family-choice-card\.card\s*\{[^}]*min-height:\s*188px;[^}]*border-radius:\s*12px;[^}]*var\(--bg-glass-overlay\)[^}]*backdrop-filter:\s*blur\(20px\) saturate\(125%\);/,
    'agent-family choices should use the larger three-column glass-card treatment',
  );
  assert.match(
    studioStyles,
    /@media \(max-width:\s*860px\)[\s\S]*?\.eva-family-choice-grid,[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\.eva-family-choice-card\.card\s*\{[^}]*min-height:\s*0;/,
    'agent-family cards should stack without fixed height on narrow screens',
  );
  assert.match(
    evaSource,
    /getFamilyIntakeSequence\(selectedAgentFamily\)[\s\S]*?eva-first-interface--guided-intake[\s\S]*?<aside[\s\S]*?eva-family-intake-stepper--collapsed[\s\S]*?id="eva-family-intake-stepper-body"[\s\S]*?hidden=\{!familyIntakeStepperExpanded\}[\s\S]*?<MomentumStepper[\s\S]*?orientation="vertical"[\s\S]*?variant="inline"/,
    'choice-only intake should show the complete family-specific sequence in a vertical Momentum stepper',
  );
  assert.match(
    evaSource,
    /FAMILY_INTAKE_COMPACT_WIDTH[\s\S]*?familyIntakeSurfaceRef[\s\S]*?setFamilyIntakeStepperExpanded\(!compact\)[\s\S]*?new ResizeObserver[\s\S]*?aria-expanded=\{familyIntakeStepperExpanded\}[\s\S]*?aria-controls="eva-family-intake-stepper-body"[\s\S]*?'Collapse progress'\s*:\s*'Expand progress'[\s\S]*?setFamilyIntakeStepperExpanded\(expanded => !expanded\)/,
    'the progress rail should default compact from its available surface width and expose one accessible disclosure control',
  );
  assert.match(
    evaSource,
    /id="eva-family-intake-stepper-title">Progress<\/h2>/,
    'the intake rail heading should use the concise Progress label',
  );
  assert.match(
    evaSource,
    /const handleActivateFamilyIntakeQuestion[\s\S]*?question\.id === familyIntakeQuestion\?\.id[\s\S]*?setPendingFamilyIntakeFocusKey\(question\.answerKey\)[\s\S]*?setFamilyIntakeEditingAnswerKey\(question\.answerKey\)[\s\S]*?setContactCenterSelectedChannels[\s\S]*?setFamilyAgentNameInput\(savedAnswer\)[\s\S]*?setFamilyGreetingInput\(savedAnswer\)[\s\S]*?setFamilyKnowledgeSelection[\s\S]*?setFamilyActionSelection[\s\S]*?originStep:\s*FAMILY_INTAKE_ORIGIN/,
    'reopening a completed step should restore its saved control value and add the matching intake prompt',
  );
  assert.match(
    evaSource,
    /initialAnswer=\{familyIntakeAnswers\[familyIntakeQuestion\.answerKey\]\}[\s\S]*?const isAvailable = \(isComplete \|\| isCurrent\) && !evaThinking && !familyProposalApplied;[\s\S]*?aria-disabled=\{!isAvailable \? true : undefined\}[\s\S]*?tabIndex=\{isAvailable \? 0 : -1\}[\s\S]*?onClick=\{isAvailable \? \(\) => handleActivateFamilyIntakeQuestion\(question\) : undefined\}/,
    'completed, skipped, and current steps should be keyboard-editable while unreached steps stay unavailable',
  );
  assert.match(
    evaSource,
    /setFamilyIntakeEditingAnswerKey\(null\);[\s\S]*?setFamilyIntakeAnswers\(nextAnswers\)[\s\S]*?buildStarterProposal\(selectedAgentFamily, nextAnswers\)/,
    'saving an edited answer should leave edit mode and rebuild the next question or proposal from the updated answers',
  );
  assert.match(
    evaSource,
    /eva-family-intake-editor-\$\{pendingFamilyIntakeFocusKey\}[\s\S]*?target\.focus\(\{ preventScroll: true \}\)[\s\S]*?target\.scrollIntoView\(\{ block: 'nearest' \}\)[\s\S]*?id=\{isLatestFamilyIntakePrompt[\s\S]*?eva-family-intake-editor-\$\{familyIntakeQuestion\.answerKey\}/,
    'activating a progress step should move focus to its reopened or current editor',
  );
  assert.match(
    evaSource,
    /const handleCancelFamilyIntakeEdit[\s\S]*?setFamilyIntakeEditingAnswerKey\(null\)[\s\S]*?setPendingFamilyIntakeFocusKey\(resumeQuestion\.answerKey\)[\s\S]*?setPendingFamilyIntakeFocusKey\('review'\)[\s\S]*?Cancel editing/,
    'a reopened step should provide a non-destructive way back to the pending question or Review',
  );
  assert.match(
    evaSource,
    /getProposalAnswerOverrides\(familyProposal\)[\s\S]*?Save proposal edits/,
    'review edits should be synchronized before a completed intake step is reopened',
  );
  assert.match(
    modelSource,
    /requestedInstructions = normalize\(answers\.instructions\)[\s\S]*?if \(requestedInstructions\) instructions = requestedInstructions/,
    'custom Review instructions should survive proposal regeneration after an intake edit',
  );
  assert.match(
    studioStyles,
    /mdc-stepperitem\s*\{[^}]*cursor:\s*default;[\s\S]*?mdc-stepperitem\.eva-family-intake-stepper__step--actionable\s*\{[^}]*cursor:\s*pointer;[\s\S]*?mdc-stepperitem\[aria-disabled='true'\]\s*\{[^}]*pointer-events:\s*none;/,
    'actionable steps should use Momentum interaction while unavailable future steps remain inert',
  );
  assert.match(
    studioStyles,
    /\.eva-first-interface--guided-intake\s*\{[^}]*--eva-intake-rail-expanded:\s*232px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--eva-intake-rail-expanded\);[\s\S]*?\.eva-family-intake-stepper\s*\{[^}]*grid-column:\s*2;[^}]*border:[^;]*var\(--outline-glass-overlay\);[^}]*var\(--bg-glass-overlay\);[^}]*backdrop-filter:\s*blur\(28px\) saturate\(140%\);/,
    'the expanded guided flow should use a narrower semantic glass rail',
  );
  assert.match(
    studioStyles,
    /\.eva-first-interface--guided-intake-collapsed\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--eva-intake-rail-collapsed\);[\s\S]*?\.eva-family-intake-stepper--collapsed\s*\{[^}]*width:\s*var\(--eva-intake-rail-collapsed\);[\s\S]*?\.eva-family-intake-stepper__body\[hidden\]\s*\{[^}]*display:\s*none;/,
    'collapsed progress should reserve only the compact rail and hide its detailed body',
  );
  assert.match(
    studioStyles,
    /mdc-stepperconnector\s*\{[^}]*width:\s*var\(--eva-intake-marker-size\);[^}]*padding-inline-start:\s*0 !important;[\s\S]*?mdc-stepperconnector::part\(connector\)\s*\{[^}]*margin-inline:\s*auto;/,
    'each connector line should be centered on the same track as its step marker',
  );
  assert.match(
    studioStyles,
    /@media \(max-width:\s*820px\)[\s\S]*?\.eva-first-interface--guided-intake\s*\{[^}]*display:\s*grid;[^}]*overflow:\s*clip !important;[\s\S]*?\.eva-family-intake-stepper\s*\{[^}]*position:\s*relative;[^}]*grid-column:\s*2;[^}]*width:\s*var\(--eva-intake-rail-expanded\);[\s\S]*?padding-inline-end:\s*0;/,
    'expanding progress on a narrow screen should reserve a right column and reflow the conversation without overlap',
  );
  assert.match(
    studioStyles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.eva-family-intake-stepper\s*\{[^}]*transition:\s*none;/,
    'progress rail resizing should respect reduced-motion preferences',
  );
  assert.match(
    modelSource,
    /calling:\s*\[[\s\S]*?answerKey:\s*['"]voice_destination['"][\s\S]*?answerKey:\s*['"]outcome['"][\s\S]*?answerKey:\s*['"]name['"][\s\S]*?answerKey:\s*['"]greeting['"][\s\S]*?answerKey:\s*['"]knowledge['"]/,
    'Phone receptionist should use the fixed five-question preset sequence',
  );
  assert.match(
    modelSource,
    /contact_center:\s*\[[\s\S]*?answerKey:\s*['"]channel['"][\s\S]*?answerKey:\s*['"]outcome['"][\s\S]*?answerKey:\s*['"]name['"][\s\S]*?answerKey:\s*['"]greeting['"][\s\S]*?answerKey:\s*['"]knowledge['"][\s\S]*?required:\s*false[\s\S]*?answerKey:\s*['"]actions['"][\s\S]*?required:\s*false/,
    'Customer service should use the fixed six-question sequence with two optional steps',
  );
  assert.match(
    modelSource,
    /internal_assistant:\s*\[[\s\S]*?answerKey:\s*['"]outcome['"][\s\S]*?answerKey:\s*['"]name['"][\s\S]*?answerKey:\s*['"]knowledge['"]/,
    'Employee assistant should use the fixed three-question preset sequence',
  );
});

test('configuration recommendation actions use the requested visual hierarchy', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');

  assert.doesNotMatch(
    source,
    /className="eva-family-recommendation__header"[\s\S]{0,180}<Badge/,
    'the Recommended next steps heading makes per-card requirement tags redundant',
  );
  assert.match(
    source,
    /<Button variant="secondary" onClick=\{handleReviewPreviewAction\}>\s*Preview\s*<\/Button>/,
    'Preview should remain secondary to Create Agent',
  );
  const actionsStart = source.indexOf("{visibleSteps.includes('actions')");
  const securityStart = source.indexOf("{visibleSteps.includes('security')", actionsStart);
  assert.ok(actionsStart >= 0 && securityStart > actionsStart);
  assert.doesNotMatch(
    source.slice(actionsStart, securityStart),
    />\s*Not needed\s*</,
    'Actions should move forward with Set up action or Continue to security only',
  );
});

test('landing quick templates use the original direct template flow', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');

  assert.match(
    source,
    /aria-label="Quick templates"[\s\S]*?starterPrompts\.slice\(0,\s*4\)\.map[\s\S]*?onClick=\{\(\) => handleTemplateSelect\(prompt\.templateId\)\}/,
    'the four starter cards should be visible on the homepage and use the direct template handler',
  );
  assert.match(
    source,
    /const handleTemplateSelect[\s\S]*?createOrSelectDraftAgent[\s\S]*?navigate\(`\/agents\/\$\{agent\.id\}\/studio`\)/,
    'choosing a homepage template should continue into the existing agent studio',
  );
});

test('homepage free-form prompts can start and continue the original Acme retail workflow', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const intentSource = readSource('../eva/evaFormConfig.ts');
  const handleSendStart = source.indexOf('const handleSend = (text: string)');
  const handleSendEnd = source.indexOf('const matchTemplateFromText', handleSendStart);
  const handleSendSource = source.slice(handleSendStart, handleSendEnd);

  assert.ok(handleSendStart >= 0 && handleSendEnd > handleSendStart);
  assert.doesNotMatch(
    handleSendSource,
    /Choose one agent area before describing the agent/,
    'the homepage prompt should not be blocked by the removed family chooser',
  );
  assert.match(
    handleSendSource,
    /retailPrototypeStep !== ['"]idle['"][\s\S]*?handleRetailReceptionistStoryAnswer\(text\)[\s\S]*?getVoiceAgentWorkflowIntent\(text\)[\s\S]*?beginRetailReceptionistStory\(voiceAgentIntent\)/,
    'active retail replies and new Acme trigger prompts should route through the original guided flow',
  );
  assert.match(
    source,
    /const beginRetailReceptionistStory[\s\S]*?setFreeChatActive\(true\)[\s\S]*?setRetailPrototypeStep\(['"]discovering['"]\)[\s\S]*?originStep[\s\S]*?retail-channel-choice/,
    'the trigger should open the conversational thread and advance to the channel choice',
  );
  assert.match(
    intentSource,
    /hasStoreSignal[\s\S]*?\\b\(store\|shop\|retail\)\\b[\s\S]*?hasRequestIntent/,
    'shop creation prompts should remain recognized as retail workflow intents',
  );
});

test('logistics requests continue from discovery into the pre-built guided flow', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const handleSendStart = source.indexOf('const handleSend = (text: string)');
  const handleSendEnd = source.indexOf('const matchTemplateFromText', handleSendStart);
  const handleSendSource = source.slice(handleSendStart, handleSendEnd);

  assert.match(
    source,
    /const isLogisticsAgentCreationIntent[\s\S]*?normalized\.includes\('logistics'\)[\s\S]*?normalized\.includes\('reservation'\)/,
    'logistics requests should be recognized without requiring an exact prompt match',
  );
  assert.match(
    handleSendSource,
    /isLogisticsAgentCreationIntent\(normalized\)[\s\S]*?beginLogisticsContactCenterIntake\(\)/,
    'a recognized logistics request should check connected systems before opening the guided flow',
  );
  assert.match(
    source,
    /const beginLogisticsContactCenterIntake[\s\S]*?VIP_LOGISTICS_DISCOVERY_ROWS\.length[\s\S]*?setRetailPrototypeStep\('channel'\)[\s\S]*?retail-channel-choice/,
    'the logistics discovery should continue into the structured channel, name, greeting, knowledge, and action flow',
  );
  assert.match(
    source,
    /title: 'Hours of operation'[\s\S]*?title: 'Inventory System – Food, Beverage'[\s\S]*?title: 'Internal Staffing & Scheduling System'[\s\S]*?title: 'Facilities: Space & Equipment'/,
    'the discovery panel should show the four requested operational-system checks',
  );
  assert.match(
    source,
    /const renderRetailDiscoveryTrace = \(showVipLogisticsTrace: boolean\)[\s\S]*?showVipLogisticsTrace\s*\? VIP_LOGISTICS_DISCOVERY_ROWS\s*:\s*RETAIL_DISCOVERY_ROWS[\s\S]*?Checked operating hours, food and beverage inventory, staffing, and facilities/,
    'the completed discovery trace should reuse the Eagle Green rows and summary',
  );
  assert.match(
    source,
    /renderRetailDiscoveryTrace\(\s*message\.text === VIP_LOGISTICS_WORKFLOW_CONTEXT\.discoveryCompleteText/,
    'the persisted Eagle Green completion message should reopen the matching discovery trace',
  );
  assert.match(
    source,
    /agentName: 'Eagle Green Facilities Agent'/,
    'the guided flow should suggest the requested facilities-focused agent name',
  );
  assert.ok(
    source.includes("welcomeMessage: 'Hi, thanks for calling the Eagle Green Facilities line. I can check event readiness, flag issues, or help you resolve something that\\'s been flagged for you. How can I help?'"),
    'the logistics proposal should use the approved Eagle Green Facilities greeting',
  );
  assert.match(
    source,
    /knowledgeBases:\s*\['Reservation System', 'Inventory System – Food & Beverage'\]/,
    'the logistics flow should start with the requested reservation and food-and-beverage systems',
  );
  assert.match(
    source,
    /const VIP_LOGISTICS_RECOMMENDED_KNOWLEDGE_BASES = \[[\s\S]*?name: 'Internal Staffing & Scheduling System'[\s\S]*?name: 'Facilities: Space & Equipment'/,
    'the logistics flow should recommend the two requested operational knowledge sources',
  );
  assert.match(
    source,
    /const VIP_LOGISTICS_CONNECTED_ACTIONS = \['Check Escalation Status'\][\s\S]*?name: 'Create a Service Ticket'[\s\S]*?provider: 'ServiceNow'[\s\S]*?name: 'Look Up Reservation History'[\s\S]*?provider: 'Salesforce'/,
    'the logistics flow should start with escalation status and recommend the requested ServiceNow and Salesforce actions',
  );
  assert.match(
    source,
    /const beginLogisticsContactCenterIntake[\s\S]*?setSelectedKnowledgeBases\(VIP_LOGISTICS_WORKFLOW_CONTEXT\.knowledgeBases\)[\s\S]*?setSelectedActions\(VIP_LOGISTICS_CONNECTED_ACTIONS\)/,
    'starting a logistics flow should reset inherited generic knowledge and actions',
  );
  assert.doesNotMatch(
    source.slice(source.indexOf('const beginLogisticsContactCenterIntake'), source.indexOf('const handleLandingStarterSelect')),
    /handleAgentFamilySelect/,
    'the logistics flow should not fall back to the open-ended Contact Center intake',
  );
});

test('guided prompts from greeting onward keep a stable centered stop position', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const previewCardStyles = styles.slice(
    styles.indexOf('.eva-retail-preview-card {'),
    styles.indexOf('button.eva-retail-preview-card {'),
  );

  assert.match(
    source,
    /RETAIL_CENTERED_ORIGIN_BY_STEP[\s\S]*?welcome:\s*'retail-welcome-choice'[\s\S]*?knowledge:\s*'retail-knowledge-choice'[\s\S]*?actions:\s*'retail-actions-choice'[\s\S]*?phone:\s*'retail-phone-choice'/,
    'the greeting and each upcoming setup question should share one focus contract',
  );
  assert.match(
    source,
    /'ready-to-preview':\s*'retail-final-actions'/,
    'the completed overview should use the same centered stop position as the guided prompts',
  );
  assert.match(
    source,
    /centeredRetailOrigin\s*=\s*RETAIL_CENTERED_ORIGIN_BY_STEP\[retailPrototypeStep\][\s\S]*?shouldCenterRetailActivePrompt\s*=\s*Boolean\([\s\S]*?centeredRetailOrigin\s*&&[\s\S]*?window\.innerHeight/,
    'the current guided response should scroll to the viewport center when it appears',
  );
  assert.match(
    source,
    /centeredRetailOrigin\s*&&\s*latestAssistantMessage\?\.originStep\s*!==\s*centeredRetailOrigin[\s\S]*?return;/,
    'a step transition should preserve the current position until the next prompt is ready',
  );
  assert.match(
    source,
    /captureRetailTransitionScrollTop[\s\S]*?retailTransitionScrollTopRef\.current\s*=\s*scrollContainer\?\.scrollTop[\s\S]*?willAdvanceCenteredRetailStep[\s\S]*?captureRetailTransitionScrollTop\(\)[\s\S]*?useLayoutEffect[\s\S]*?scrollContainer\.scrollTop\s*=\s*retailTransitionScrollTopRef\.current/,
    'the current scroll position should be restored before paint while a centered-step response is pending',
  );
  assert.match(
    source,
    /const selectRetailPhoneNumber[\s\S]*?captureRetailTransitionScrollTop\(\)[\s\S]*?handleRetailReceptionistStoryAnswer\(phoneValue\)/,
    'choosing a connected number should preserve the phone prompt position until the overview is ready',
  );
  assert.match(
    source,
    /shouldHoldPhoneFocusSpacing[\s\S]*?retailPrototypeStep === 'ready-to-preview'[\s\S]*?evaThinking[\s\S]*?retail-final-actions[\s\S]*?eva-first-interface__free-chat--phone-focus/,
    'the phone step should keep its reserved space throughout the transition to the overview',
  );
  assert.match(
    source,
    /phoneMenu[\s\S]*?eva-retail-phone-selector__menu[\s\S]*?phoneMenu\.getBoundingClientRect\(\)\.bottom[\s\S]*?composer\.getBoundingClientRect\(\)\.top/,
    'opening the connected-number menu should scroll it clear of the composer',
  );
  assert.match(
    source,
    /hasCenteredRetailPrompt[\s\S]*?shouldHoldActiveRetailPromptPosition[\s\S]*?evaThinking\s*&&\s*hasCenteredRetailPrompt[\s\S]*?eva-first-interface__free-chat--active-prompt-focus/,
    'the active guided step should retain its focus spacing while the next response is generated',
  );
  assert.match(
    styles,
    /\.eva-first-interface__free-chat--active-prompt-focus[\s\S]*?padding-bottom:\s*clamp\(280px, 42vh, 520px\)/,
    'active prompts should reserve enough trailing space for centering',
  );
  assert.match(
    styles,
    /\.eva-first-interface__free-chat--phone-focus[\s\S]*?padding-bottom:\s*clamp\(360px, 50vh, 600px\)/,
    'the phone step should reserve enough space for its open menu above the composer',
  );
  assert.match(
    styles,
    /\.eva-first-interface__free-chat[\s\S]*?overflow-anchor:\s*none/,
    'browser scroll anchoring should not move the prompt while response content is appended',
  );
  assert.doesNotMatch(
    source,
    /meta: '(?:San Francisco|Austin|San Jose) store'/,
    'connected phone-number locations should not repeat the word store',
  );
  assert.match(
    previewCardStyles,
    /width:\s*min\(100%, 332px\)/,
    'the final overview should retain its original compact card width',
  );
  assert.doesNotMatch(
    previewCardStyles,
    /min-width:\s*100%/,
    'the final overview card should not stretch to the full response width',
  );
});

test('preset proposal review shows the verified setup choices and preserves them for the Draft', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const proposalStart = source.indexOf('className="eva-family-proposal"');
  const proposalEnd = source.indexOf('className="eva-family-proposal__actions"', proposalStart);

  assert.ok(proposalStart >= 0 && proposalEnd > proposalStart, 'the family proposal card should be present');
  const proposalSource = source.slice(proposalStart, proposalEnd);
  for (const label of ['Channel', 'Location', 'Phone number', 'Name', 'Welcome message', 'Knowledge base', 'Action', 'Instructions']) {
    assert.match(
      proposalSource,
      new RegExp(`<dt>${label}<\\/dt>`),
      `the proposal should let the user verify ${label.toLowerCase()}`,
    );
  }

  const applyStart = source.indexOf('const applyProposalToConfiguration');
  const applyEnd = source.indexOf('const handleAgentFamilySelect', applyStart);
  const applySource = source.slice(applyStart, applyEnd);
  assert.match(applySource, /proposal\.selectedChannels/);
  assert.match(applySource, /setSelectedChannels\(/);
  assert.match(applySource, /setSelectedKnowledgeBases\(selectedKnowledge\)/);
  assert.match(applySource, /setSelectedActions\(selectedPresetActions\)/);
  assert.doesNotMatch(applySource, /setSelectedKnowledgeBases\(\[\]\)|setSelectedActions\(\[\]\)/);
  assert.match(
    applySource,
    /setWelcomeMessage\(proposal\.greeting\)/,
    'applying the reviewed proposal should preserve its greeting instead of regenerating one',
  );
});

test('preset intake reuses established channel and verification patterns with structured selectors', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const homeStyles = readSource('../agent-home/agent-home.css');

  assert.match(
    source,
    /const CONTACT_CENTER_INTAKE_CHANNEL_OPTIONS = \[[\s\S]*?label:\s*['"]Voice['"][\s\S]*?label:\s*['"]Digital['"][\s\S]*?label:\s*['"]Video['"]/,
  );
  assert.match(
    source,
    /return \['Voice', 'Digital', 'Video'\][\s\S]*?\.filter\(option => normalized\.includes\(option\.toLowerCase\(\)\)\)[\s\S]*?\.join\(', '\)/,
    'channel normalization should preserve every selected channel',
  );
  assert.match(
    source,
    /isContactCenterChannelPrompt[\s\S]*?<Card[\s\S]*?role="checkbox"[\s\S]*?setContactCenterSelectedChannels[\s\S]*?>\s*Continue\s*</,
    'channel selection should use the existing selectable Acme cards',
  );
  assert.match(
    source,
    /label="Channel"[\s\S]*?value:\s*'Voice'[\s\S]*?value:\s*'Digital'[\s\S]*?value:\s*'Video'[\s\S]*?value:\s*'Voice, Video'[\s\S]*?value:\s*'Digital, Video'[\s\S]*?value:\s*'Voice, Digital, Video'/,
    'proposal editing should preserve every single- and multi-channel Video selection',
  );
  assert.match(
    source,
    /isFamilyNamePrompt[\s\S]*?className="eva-retail-agent-name-options"[\s\S]*?>\s*Edit name\s*<[\s\S]*?>\s*Use edited name\s*</,
    'the suggested name should reuse the existing accept-or-edit layout',
  );
  assert.match(
    source,
    /isFamilyGreetingPrompt[\s\S]*?className="eva-retail-welcome-options"[\s\S]*?>\s*Use suggested message\s*<[\s\S]*?>\s*Edit message\s*</,
    'the welcome message should reuse the existing accept-or-edit card',
  );
  assert.match(
    source,
    /isCallingDestinationPrompt[\s\S]*?label="Location"[\s\S]*?label="Phone number"[\s\S]*?disabled=\{!familyVoiceLocation \|\| !familyVoicePhoneNumber\}/,
    'Phone receptionist should require both endpoint selections before continuing',
  );
  assert.match(source, /isFamilyKnowledgePrompt[\s\S]*?familyKnowledgeDropdownOptions[\s\S]*?Skip for now/);
  assert.match(source, /isFamilyActionPrompt[\s\S]*?familyActionDropdownOptions[\s\S]*?Skip for now/);
  assert.match(styles, /\.eva-retail-channel-option\.card\s*\{/);
  assert.match(styles, /\.eva-retail-agent-name-options\s*\{/);
  assert.match(styles, /\.eva-retail-welcome-option\s*\{/);
  assert.match(homeStyles, /\.eva-family-structured-step\s*\{[^}]*display:\s*grid;[^}]*gap:/);
});

test('family intake uses the established thinking interval before each assistant reply', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const responseSource = readSource('../../components/shared/ai/AiResponseMessage.jsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const timerStart = source.indexOf('const addOnboardingAssistantMessage');
  const timerEnd = source.indexOf('const applyProposalToConfiguration', timerStart);
  const familySelectStart = source.indexOf('const handleAgentFamilySelect');
  const familySelectEnd = source.indexOf('const handleLandingStarterSelect', familySelectStart);
  const answerStart = source.indexOf('const handleFamilyIntakeAnswer');
  const answerEnd = source.indexOf('const handleAskForProposalChanges', answerStart);

  assert.match(
    source.slice(timerStart, timerEnd),
    /setEvaThinking\(true\)[\s\S]*?window\.setTimeout\([\s\S]*?setEvaThinking\(false\)[\s\S]*?,\s*850\)/,
  );
  assert.match(source.slice(familySelectStart, familySelectEnd), /addOnboardingAssistantMessage\(/);
  assert.ok(
    [...source.slice(answerStart, answerEnd).matchAll(/addOnboardingAssistantMessage\(/g)].length >= 3,
    'invalid answers, subsequent questions, and the proposal should all wait before replying',
  );
  assert.match(
    source,
    /\{evaThinking\s*&&\s*\([\s\S]*?assistantName="AI Assistant is thinking\.\.\."[\s\S]*?assistantState="processing"/,
  );
  assert.match(
    source,
    /isFamilyIntakePrompt\s*&&\s*\(!isLatestFamilyIntakePrompt\s*\|\|\s*evaThinking\)/,
    'the previous prompt controls should be hidden while its next reply is being prepared',
  );
  assert.match(responseSource, /import aiSimplifiedAnimationUrl from ['"].*ai simplified\.json\?url['"]/);
  assert.match(
    responseSource,
    /function AiGeneratingIcon\(\)[\s\S]*?lottie\.loadAnimation\([\s\S]*?loop:\s*true,[\s\S]*?path:\s*aiSimplifiedAnimationUrl/,
    'the wait state should reuse the animated AI icon from the Acme creation flow',
  );
  assert.match(
    styles,
    /\.app--ai \.eva-first-interface__free-chat \.ai-response__generating-icon\s*\{\s*display:\s*inline-flex;/,
    'the shared animated icon should remain visible during conversational family intake',
  );
});

test('starter proposal actions edit the plan or create a draft on its overview', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const handlerStart = source.indexOf('const saveFamilyProposalDraft');
  const handlerEnd = source.indexOf('const handleCreateAgent', handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);
  const persistenceStart = source.indexOf('const createPersistedFamilyDraft');
  const persistenceEnd = source.indexOf('const saveFamilyProposalDraft', persistenceStart);
  const persistenceSource = source.slice(persistenceStart, persistenceEnd);
  const proposalStart = source.indexOf('{isLatestFamilyProposalPrompt');
  const proposalEnd = source.indexOf('{isRetailChannelChoice', proposalStart);
  const proposalSource = source.slice(proposalStart, proposalEnd);

  assert.match(
    proposalSource,
    /onClick=\{\(\)\s*=>\s*setFamilyProposalEditing\(true\)\}[\s\S]*?>\s*Edit plan\s*<\/Button>/,
  );
  assert.match(
    persistenceSource,
    /createDraftFromProposal\([\s\S]*?applyPresetAnswersToDraft\(baseDraft, familyProposal, familyIntakeAnswers\)[\s\S]*?createAgentDraft\(nextDraft\)/,
    'structured endpoint, knowledge, and action answers must be applied before the Draft is persisted',
  );
  assert.match(
    proposalSource,
    /onClick=\{handleCreateFamilyDraft\}[\s\S]*?>\s*Create draft\s*<\/Button>/,
  );
  assert.match(
    handlerSource,
    /const handleCreateFamilyDraft[\s\S]*?saveFamilyProposalDraft\(\)[\s\S]*?navigate\(`\/agents\/\$\{agent\.id\}`\)/,
    'Create draft should persist the proposal and open the canonical agent overview',
  );
  assert.doesNotMatch(proposalSource, />\s*(Create agent|Continue configuration)\s*</);
  assert.doesNotMatch(handlerSource, /handleCreateFamilyAgent|handleContinueFamilyConfiguration/);
  assert.match(
    proposalSource,
    /className="eva-family-proposal__next"[\s\S]*?>What’s next<[\s\S]*?Continue configuring knowledge, actions, and guardrails so your agent can answer[\s\S]*?accurately, complete tasks, and stay within policy\./,
    'the proposal should explain the next configuration areas below a dedicated section',
  );
  assert.doesNotMatch(proposalSource, /AI suggestions do not change the configuration until you apply them\./);
  assert.doesNotMatch(proposalSource, />\s*(Apply draft|Ask for changes|Configure more)\s*</);

  const instructionsStart = source.indexOf("{visibleSteps.includes('instructions')");
  const knowledgeStart = source.indexOf("{visibleSteps.includes('knowledge')", instructionsStart);
  assert.ok(instructionsStart >= 0 && knowledgeStart > instructionsStart, 'the Instructions section should be present');
  assert.match(
    source.slice(instructionsStart, knowledgeStart),
    /renderRankedNextStepsAfter\(['"]instructions['"]\)/,
    'ranked recommendations should be visible without making the user jump ahead to Review',
  );
  assert.match(
    source,
    /onClick=\{\(\)\s*=>\s*openRecommendationSection\(recommendation\.targetSection,\s*recommendation\.id\)\}[\s\S]*?\{getRecommendationActionLabel\(recommendation\)\}/,
    'the recommendation-specific action should open the section named by the recommendation',
  );
});

test('recommendation actions use concise labels that describe their destination', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const labelStart = source.indexOf('const getRecommendationActionLabel');
  const labelEnd = source.indexOf('type EvaVoicePreviewSocketMessage', labelStart);
  const labelSource = source.slice(labelStart, labelEnd);

  assert.ok(labelStart >= 0 && labelEnd > labelStart);
  assert.match(labelSource, /actionKind === ['"]open_external['"][\s\S]*?return ['"]Connect['"]/);
  assert.match(labelSource, /case ['"]actions['"]:[\s\S]*?case ['"]handoff['"]:[\s\S]*?return ['"]Add action['"]/);
  assert.match(labelSource, /case ['"]knowledge['"]:[\s\S]*?return ['"]Add knowledge['"]/);
  assert.match(labelSource, /case ['"]identity['"]:[\s\S]*?return ['"]Add identity check['"]/);
  assert.match(labelSource, /case ['"]security['"]:[\s\S]*?case ['"]audit['"]:[\s\S]*?return ['"]Review security['"]/);
  assert.match(labelSource, /case ['"]preview['"]:[\s\S]*?case ['"]testing['"]:[\s\S]*?return ['"]Test agent['"]/);
  assert.doesNotMatch(
    source,
    /recommendation\.actionKind === ['"]open_external['"] \? ['"]Connect['"] : ['"]Set up['"]/,
  );
});

test('Recommended next steps owns a dynamic Next action that opens the first unresolved item', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const navigatorStart = source.indexOf('const handleNextRecommendedStep =');
  const recommendationsStart = source.indexOf('const renderRankedNextSteps =');
  const recommendationsEnd = source.indexOf('const renderRankedNextStepsAfter', recommendationsStart);
  const navigatorSource = source.slice(navigatorStart, recommendationsEnd);
  const recommendationsSource = source.slice(recommendationsStart, recommendationsEnd);
  const channelsStart = source.indexOf("{visibleSteps.includes('channels')");
  const instructionsStart = source.indexOf("{visibleSteps.includes('instructions')", channelsStart);
  const channelsSource = source.slice(channelsStart, instructionsStart);

  assert.ok(navigatorStart >= 0 && recommendationsStart > navigatorStart && recommendationsEnd > recommendationsStart);
  assert.match(
    navigatorSource,
    /const nextRecommendation = activeAgentRecommendations\[0\][\s\S]*?const isFinalRecommendation = activeAgentRecommendations\.length === 1[\s\S]*?dismissRecommendation\(activeDraftAgentId,\s*nextRecommendation\.id\)[\s\S]*?openRecommendationSection\([\s\S]*?nextRecommendation\.targetSection,[\s\S]*?undefined,[\s\S]*?isFinalRecommendation,[\s\S]*?\)/,
    'Next should consume the first visible recommendation before opening its destination',
  );
  assert.match(
    recommendationsSource,
    /className="eva-dialogue__actions eva-next-step-block__actions"[\s\S]*?onClick=\{handleNextRecommendedStep\}[\s\S]*?>\s*Next\s*</,
    'the navigator should keep one compact Next action inside the recommendation container',
  );
  assert.doesNotMatch(recommendationsSource, /setEvaStep\(['"]knowledge['"]\)/);
  assert.match(
    channelsSource,
    /evaStep === ['"]channels['"]\s*&&\s*!shouldRenderRankedNextStepsAfter\(['"]channels['"]\)[\s\S]*?Continue to instructions/,
    'the fixed channel continuation should disappear whenever the recommendation navigator is visible',
  );
});

test('guided recommendation surfaces share the configuration form measure', () => {
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    styles,
    /\.eva-first-interface--generated:not\(\.eva-first-interface--free-chat\) \.eva-dialogue > \.eva-next-step-block,\s*\.eva-first-interface--generated:not\(\.eva-first-interface--free-chat\) \.eva-dialogue > \.eva-recommendation-review-actions\s*\{[\s\S]*?width:\s*min\(100%,\s*960px\);[\s\S]*?margin-inline:\s*auto;/,
    'ranked recommendations and the review handoff should align to the same centered 960px measure as the guided configuration response',
  );
});

test('entering evaluation removes the preview handoff actions before rendering the scenario builder', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const previewStart = source.indexOf("{visibleSteps.includes('preview')");
  const testingStart = source.indexOf("{visibleSteps.includes('testing')", previewStart);
  const previewSource = source.slice(previewStart, testingStart);

  assert.ok(previewStart >= 0 && testingStart > previewStart);
  assert.match(
    previewSource,
    /\{evaStep !== ['"]testing['"] && \([\s\S]*?className="eva-dialogue__actions"[\s\S]*?Evaluate my agent[\s\S]*?Save changes/,
    'the preview handoff row should disappear once evaluation is active so the scenario builder moves up',
  );
  assert.match(
    source,
    /className=\{`eva-dialogue\$\{evaStep === ['"]testing['"] \? ['"] eva-dialogue--testing-active['"] : ['"]['"]\}`\}/,
    'the active evaluation should identify the configuration scroll surface',
  );
  assert.match(
    styles,
    /\.eva-generated-layout__main > \.eva-dialogue\.eva-dialogue--testing-active\s*\{[\s\S]*?padding-bottom:\s*calc\(100vh - 120px\);/,
    'evaluation should reserve enough trailing scroll space to align the scenario question at the top',
  );
});

test('ranked next steps follow the selected setup section until the journey is resolved', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const contextSource = readSource('../../contexts/AppContext.tsx');
  const sessionSource = readSource('../eva/evaFormConfig.ts');
  const openStart = source.indexOf('const openRecommendationSection');
  const openEnd = source.indexOf('const refreshDraftBasics', openStart);
  const openSource = source.slice(openStart, openEnd);
  const dismissStart = contextSource.indexOf('const dismissRecommendation');
  const dismissEnd = contextSource.indexOf('const regenerateAgentRecommendations', dismissStart);
  const dismissSource = contextSource.slice(dismissStart, dismissEnd);

  assert.match(openSource, /audit:\s*['"]security['"]/);
  assert.match(
    openSource,
    /setRecommendationAnchorStep\(resolvedStep\)[\s\S]*setRecommendationPendingId\(recommendationId\s*\?\?\s*null\)[\s\S]*setEvaStep\(resolvedStep\)/,
  );
  assert.match(
    source,
    /recommendationJourneyIds\s*\.map\([\s\S]*?actionableAgentRecommendations\.find/,
    'the initial three-item journey should stay frozen instead of backfilling a fourth item',
  );
  assert.match(
    source,
    /familyConfiguration\.audience\s*=\s*\{[\s\S]*?progress:\s*audience\.trim\(\)\s*\?\s*['"]configured['"]\s*:\s*['"]not_started['"]/,
    'the verified audience should be resolved before the initial three recommendations are ranked',
  );
  assert.match(
    source,
    /familyConfiguration\.placement\s*=\s*\{[\s\S]*?progress:\s*internalPlacements\.length\s*>\s*0\s*\?\s*['"]configured['"]\s*:\s*['"]not_started['"]/,
    'the default employee placement should not displace Actions from the frozen recommendation journey',
  );
  assert.match(source, /if\s*\(activeAgentRecommendations\.length\s*===\s*0\)\s*\{\s*return null;/);
  assert.match(
    source,
    /const shouldRenderRankedNextStepsAfter[\s\S]*?recommendationAnchorStep\s*!==\s*step[\s\S]*?recommendationPendingId[\s\S]*?const renderRankedNextStepsAfter[\s\S]*?shouldRenderRankedNextStepsAfter\(step\)[\s\S]*?renderRankedNextSteps\(\)/,
  );
  assert.match(
    source,
    /if\s*\(!recommendationPendingId\s*\|\|\s*evaStep\s*===\s*recommendationAnchorStep\)\s*return;[\s\S]*?setRecommendationPendingId\(null\);[\s\S]*?setRecommendationAnchorStep\(evaStep\);/,
    'leaving an unresolved setup section should restore the remaining recommendation dock at the new step',
  );
  assert.equal((source.match(/aria-label="Ranked next steps"/g) ?? []).length, 1);

  for (const step of [
    'profile',
    'channels',
    'instructions',
    'knowledge',
    'actions',
    'security',
    'review',
    'preview',
    'testing',
  ]) {
    assert.match(source, new RegExp(`renderRankedNextStepsAfter\\(['"]${step}['"]\\)`));
  }

  assert.match(sessionSource, /recommendationJourneyIds\?:\s*string\[\]/);
  assert.match(sessionSource, /recommendationAnchorStep\?:\s*EvaConversationStep/);
  assert.match(sessionSource, /recommendationPendingId\?:\s*string\s*\|\s*null/);
  assert.match(sessionSource, /recommendationReviewStep\?:\s*EvaConversationStep\s*\|\s*null/);
  assert.match(
    source,
    /const completeRecommendationJourney = \(\) => \{[\s\S]*?setRecommendationReviewStep\(null\);[\s\S]*?setRecommendationAnchorStep\(['"]review['"]\);[\s\S]*?setEvaStep\(['"]review['"]\);/,
    'finishing the last navigator task should hand the user to Review',
  );
  assert.match(
    source,
    /const renderRecommendationReviewHandoff[\s\S]*?Continue to review/,
    'non-security recommendation destinations should expose a direct Review handoff',
  );
  assert.match(
    source,
    /shouldRouteRecommendationJourneyToReview\(['"]security['"]\)[\s\S]*?completeRecommendationJourney\(\)/,
    'the Security completion action should also finish the journey at Review',
  );
  assert.match(
    source,
    /setActiveDraftAgentId\(null\);[\s\S]*?setRecommendationJourneyAgentId\(null\);[\s\S]*?setRecommendationJourneyIds\(\[\]\);[\s\S]*?setRecommendationAnchorStep\(['"]instructions['"]\);[\s\S]*?setRecommendationPendingId\(null\);[\s\S]*?setRecommendationReviewStep\(null\);/,
    'a new thread should not reuse recommendation journey state from the previous agent',
  );
  assert.match(
    dismissSource,
    /dismissedRecommendationIds:\s*\[\.\.\.draft\.dismissedRecommendationIds,\s*recommendationId\]/,
  );
  assert.match(
    dismissSource,
    /recommendations:\s*draft\.recommendations\.filter\(item => item\.id !== recommendationId\)/,
  );
});

test('guided configuration toolbar restores summary, progress, and save actions', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const controlsStart = source.indexOf('<div className="eva-view-actions__controls">');
  const controlsEnd = source.indexOf('</div>', controlsStart);

  assert.ok(controlsStart >= 0 && controlsEnd > controlsStart, 'the guided configuration toolbar should be present');
  const controlsSource = source.slice(controlsStart, controlsEnd);

  assert.match(controlsSource, /onClick=\{handleViewSummary\}/);
  assert.match(controlsSource, /aria-label="View agent summary"/);
  assert.match(controlsSource, /name="meeting-summary"/);
  assert.match(controlsSource, /setShowEvaGeneratedSidePanel\(previous\s*=>\s*!previous\)/);
  assert.match(controlsSource, /Collapse progress sidebar/);
  assert.match(controlsSource, /Expand progress sidebar/);
  assert.match(controlsSource, /aria-expanded=\{showEvaGeneratedSidePanel\}/);
  assert.match(controlsSource, /aria-controls="eva-generated-progress-sidebar"/);
  assert.match(controlsSource, /name="side-panel"/);
  assert.match(
    controlsSource,
    /onClick=\{configurationMode === ['"]edit['"] \? handleSaveConfigurations : handleCreateAgent\}[\s\S]*?Save changes[\s\S]*?Create Agent/,
  );
  assert.doesNotMatch(controlsSource, /Create new agent/);
  assert.doesNotMatch(controlsSource, /Publish version/);

  const saveHandlerStart = source.indexOf('const handleSaveConfigurations');
  const saveHandlerEnd = source.indexOf('const enterRetailAgentStudio', saveHandlerStart);
  const saveHandlerSource = source.slice(saveHandlerStart, saveHandlerEnd);
  assert.match(saveHandlerSource, /persistEvaSession\(/);
  assert.match(saveHandlerSource, /updateAgentDraft\(activeDraftAgentId,\s*current\s*=>\s*current\)/);
  assert.match(
    saveHandlerSource,
    /setVariation\(['"]dashboard['"]\)[\s\S]*?navigate\(['"]\/agents['"]\)/,
    'saving an existing configuration should return to the all-agents view',
  );
  assert.match(saveHandlerSource, /showToast\(['"]Changes saved\./);
  assert.match(source, /id="eva-generated-progress-sidebar"/);
});

test('existing agents progressively disclose untouched optional configuration', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    source,
    /const \[generatedChatPanelMode,\s*setGeneratedChatPanelMode\] = useState<GeneratedChatPanelMode>\(\s*configurationMode === ['"]edit['"] \? ['"]collapsed['"] : ['"]rail['"],?\s*\);/,
    'reopening an existing agent should default the conversation rail to collapsed',
  );
  assert.match(
    source,
    /const progressivelyDisclosedSteps = new Set<EvaConversationStep>\(\[[\s\S]*?['"]channels['"][\s\S]*?['"]knowledge['"][\s\S]*?['"]actions['"][\s\S]*?['"]security['"][\s\S]*?\]\);/,
    'optional configuration sections should use progressive disclosure',
  );
  assert.match(
    source,
    /familyStepOrder[\s\S]*?\.slice\(0,\s*visibleStepIndex \+ 1\)[\s\S]*?\.filter\(step => \{[\s\S]*?step === evaStep[\s\S]*?progress !== undefined && progress !== ['"]not_started['"]/,
    'edit mode should show an optional section only when it is active or has recorded progress',
  );
  assert.match(
    styles,
    /\.eva-generated-layout__main > \.eva-dialogue\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;[\s\S]*?overflow-y:\s*auto;/,
    'the configuration workspace should own a full-height vertical scroll surface',
  );
});

test('Knowledge setup lists every ready collection from the shared knowledge inventory', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const serviceSource = readSource('../../services/knowledgeService.ts');
  const knowledgeStart = source.indexOf("{visibleSteps.includes('knowledge')");
  const actionsStart = source.indexOf("{visibleSteps.includes('actions')", knowledgeStart);

  assert.ok(knowledgeStart >= 0 && actionsStart > knowledgeStart, 'the Knowledge setup section should be present');
  const knowledgeSource = source.slice(knowledgeStart, actionsStart);

  assert.match(source, /import \{ listReadyCollections \} from ['"]\.\.\/\.\.\/services\/knowledgeService['"]/);
  assert.match(source, /listReadyCollections\(\)[\s\S]*?setAvailableKnowledgeBases/);
  assert.match(knowledgeSource, /knowledgeBaseOptions\.map\(source =>/);
  assert.match(knowledgeSource, /loading=\{availableKnowledgeBases === null\}/);
  assert.match(knowledgeSource, /Knowledge bases could not be loaded/);
  assert.match(knowledgeSource, /label: ['"]Retry['"]/);
  assert.match(knowledgeSource, /ready to enable/);
  assert.doesNotMatch(knowledgeSource, /blank organization|No recommended knowledge sources/);
  assert.match(serviceSource, /source\.status === ['"]processed['"]/);
  assert.match(serviceSource, /name: ['"]Customer Support['"]/);
  assert.match(serviceSource, /name: ['"]Technical Support['"]/);
});

test('final creation actions publish once and return to the existing-agent list', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const handlerStart = source.indexOf('const handleCreateAgent');
  const handlerEnd = source.indexOf('const openRecommendationSection', handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);

  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);
  assert.match(handlerSource, /getMinimumPublishIssues\(draftToPublish\)/);
  assert.match(handlerSource, /publishAgentVersion\(activeDraftAgentId\)/);
  assert.match(handlerSource, /setVariation\(['"]dashboard['"]\)/);
  assert.match(handlerSource, /navigate\(['"]\/agents['"]\)/);
  assert.match(handlerSource, /removeItem\(EVA_SESSION_STORAGE_KEY\)/);
  assert.match(handlerSource, /removeItem\(EVA_AUTO_START_VOICE_PREVIEW_KEY\)/);
  assert.doesNotMatch(source, /handlePublishCurrentVersion/);
});

test('create versus edit mode keeps both primary configuration actions synchronized', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const landingSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const listSource = readSource('../eva/EvaAgentsTable.tsx');
  const dynamicActionPattern =
    /variant="primary"[\s\S]{0,180}onClick=\{configurationMode === ['"]edit['"] \? handleSaveConfigurations : handleCreateAgent\}[\s\S]{0,180}\{configurationMode === ['"]edit['"] \? ['"]Save changes['"] : ['"]Create Agent['"]\}/g;

  assert.ok(
    [...source.matchAll(dynamicActionPattern)].length >= 4,
    'top, Review, Preview, and post-test actions should share the same mode-aware primary CTA',
  );
  assert.match(source, /const \[configurationMode, setConfigurationMode\] = useState<['"]create['"] \| ['"]edit['"]>/);
  assert.match(source, /configurationMode,\s*landingMode/);
  assert.match(landingSource, /configurationMode: ['"]edit['"]/);
  assert.match(listSource, /configurationMode: ['"]edit['"]/);
  assert.match(
    listSource,
    /family === ['"]calling['"] \? agentDraft\?\.familyConfiguration\.voice\?\.values[\s\S]*?channelPhoneNumber:\s*savedPhoneNumber[\s\S]*?phoneNumberDeferred:\s*!savedPhoneNumber/,
    'reopening a Phone receptionist should restore its saved voice endpoint',
  );
  assert.match(
    landingSource,
    /selectedKnowledgeBases:\s*sessionMatchesAgent[\s\S]*?selectedActions:\s*sessionMatchesAgent[\s\S]*?channelPhoneNumber:\s*sessionMatchesAgent/,
    'an unrelated stale session must not replace selections from the opened Draft',
  );

  const saveHandlerStart = source.indexOf('const handleSaveConfigurations');
  const saveHandlerEnd = source.indexOf('const enterRetailAgentStudio', saveHandlerStart);
  const saveHandlerSource = source.slice(saveHandlerStart, saveHandlerEnd);
  assert.match(saveHandlerSource, /updateAgentDraft\(activeDraftAgentId,\s*current\s*=>\s*current\)/);
  assert.match(saveHandlerSource, /setVariation\(['"]dashboard['"]\)/);
  assert.match(saveHandlerSource, /navigate\(['"]\/agents['"]\)/);
  assert.doesNotMatch(saveHandlerSource, /publishAgentVersion|navigateToAgentStudio/);
});

test('AI agent list cards use the native Uplift card with a stable hover surface and visible 16px grid gap', () => {
  const tableSource = readSource('../eva/EvaAgentsTable.tsx');
  const styles = readSource('../../components.css');
  const spacingTokens = readSource('../../tokens/spacing-tokens.css');
  const gridRuleStart = styles.indexOf('.ai-agents-grid {');
  const gridRuleEnd = styles.indexOf('}', gridRuleStart);
  const cardRuleStart = styles.indexOf('.ai-agents-agent-card {');
  const cardRuleEnd = styles.indexOf('}', cardRuleStart);

  assert.ok(gridRuleStart >= 0 && gridRuleEnd > gridRuleStart);
  assert.ok(cardRuleStart >= 0 && cardRuleEnd > cardRuleStart);
  assert.match(styles.slice(gridRuleStart, gridRuleEnd), /gap:\s*var\(--spacing-small\)/);
  assert.match(spacingTokens, /--spacing-small:\s*16px/);
  assert.match(
    tableSource,
    /Card as MomentumCard[^]*?<MomentumCard[^]*?orientation="vertical"[^]*?variant="border"[^]*?<div slot="body" className="ai-agents-agent-card-slot"/,
    'every agent tile should use the native Momentum Card structure',
  );
  assert.doesNotMatch(
    styles.slice(cardRuleStart, cardRuleEnd),
    /max-width:/,
    'cards must fill their grid tracks so extra track width does not inflate the visible gap',
  );
  assert.match(
    styles.slice(cardRuleStart, cardRuleEnd),
    /--ai-agents-agent-card-surface:\s*var\([^}]*background-solid-primary-normal[^}]*#121212[^}]*background:[^}]*var\(--ai-agents-agent-card-surface\)[^}]*box-shadow:/,
    'every agent tile should use a stable opaque surface that does not reveal GPU compositing artifacts',
  );
  assert.doesNotMatch(
    styles.slice(cardRuleStart, cardRuleEnd),
    /backdrop-filter|background-glass-normal/,
    'agent tiles should not depend on a filtered glass layer',
  );
  assert.match(
    styles,
    /\.ai-agents-agent-card::part\(body\)\s*\{[^}]*background:\s*transparent;/,
    'the native Momentum card body should not cover the host glass treatment',
  );
  const hoverRuleStart = styles.indexOf(
    '.secondary-content.ai-agents-dashboard mdc-card.ai-agents-agent-card--clickable:hover,',
  );
  const hoverRuleEnd = styles.indexOf('}', hoverRuleStart);
  assert.ok(hoverRuleStart >= 0 && hoverRuleEnd > hoverRuleStart);
  const hoverRule = styles.slice(hoverRuleStart, hoverRuleEnd);
  assert.match(
    hoverRule,
    /border-color:\s*color-mix\(in srgb, var\(--text-primary\) 42%, var\(--outline-color\)\);[^}]*background:[^}]*var\(--ai-agents-agent-card-surface\)[^}]*box-shadow:/,
    'hover should preserve the opaque surface and use a neutral elevated outline rather than a blue border',
  );
  assert.doesNotMatch(
    hoverRule,
    /transform:/,
    'hover should not promote the card onto a separate compositing layer',
  );
  assert.doesNotMatch(
    tableSource,
    /className="ai-agents-agent-meta"[^]*?\{tile\.description\}/,
    'agent cards should not repeat the description in their metadata',
  );
  assert.doesNotMatch(
    tableSource,
    /family\.badgeLabel|family\.badgeVariant/,
    'agent cards should not repeat the agent family as a tag',
  );
  assert.match(
    tableSource,
    /className=\{`ai-agents-agent-lifecycle ai-agents-agent-lifecycle--\$\{tile\.lifecycle\}`\}/,
    'agent cards should keep their lifecycle status visible after family tags are removed',
  );
  assert.match(
    tableSource,
    /className="ai-agents-agent-footer"[\s\S]*?aria-label=\{`Preview \$\{tile\.name\}`\}[\s\S]*?onClick=\{\(event\) => \{[\s\S]*?handleAgentClick\(tile\);[\s\S]*?>\s*Preview\s*<\/Button>/,
    'Preview should open the same agent overview as the full-card hit area',
  );
  assert.doesNotMatch(
    styles,
    /\.ai-agents-agent-name-button:hover\s*\{[^}]*text-decoration:\s*underline;/,
    'agent card titles should not underline independently on hover',
  );
});

test('Studio routes keep document scrolling locked to one route-level surface', () => {
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    styles,
    /html\[data-product=['"]ai-agent-studio['"]\]:has\(\.app--ai\),[\s\S]*?\.app-shell-root\s*\{[^}]*height:\s*100dvh;[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/,
    'Studio routes should not create a second document-level scrollbar',
  );
  assert.match(
    styles,
    /\.app--ai \.main\s*\{[^}]*height:\s*calc\(100dvh - var\(--spacing-big\)\);/,
    'the main region should account for the full 64px application header',
  );
  assert.match(
    styles,
    /\.app--ai \.primary-content\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/,
    'the primary content should remain the single vertical scroll owner',
  );
});

test('agent overview header omits the family tag and keeps lifecycle status', () => {
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');

  assert.doesNotMatch(overviewSource, /familyBadgeLabel|familyBadgeVariant/);
  assert.match(
    overviewSource,
    /className="agent-studio-agent-metadata" aria-label=\{lifecycleStatusLabel\(lifecycle\)\}[\s\S]*?agent-studio-lifecycle-status--\$\{lifecycle\}/,
  );
});

test('AI agent list imports the design-variation hook it invokes', () => {
  const source = readSource('../eva/EvaAgentsTable.tsx');

  assert.match(
    source,
    /import \{ useDesignVariation \} from ['"]\.\.\/\.\.\/contexts\/DesignVariationContext['"];?/,
  );
  assert.match(source, /const \{ setVariation \} = useDesignVariation\(\);/);
  assert.doesNotMatch(
    source,
    /previewTile|previewCallActive|previewCloseRef|closePreview/,
    'the removed inline preview panel must not leave unresolved runtime references',
  );
});

test('session action-control evidence formats evaluated inputs as template variables', () => {
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');

  assert.match(
    sessionsSource,
    /<code className="galileo-action-control-summary__variable" translate="no">[\s\S]*?`\{\{\$\{evidence\.field\}\}\}`[\s\S]*?` \$\{actual\} \$\{operator\} \$\{expected\}`/,
    'the evaluated input should render its field as a highlighted {{variable}} token',
  );
});

test('Control Hub landing routes AI Agent Studio into the adaptive Home experience', () => {
  const dashboardSource = readSource('../../pages/Dashboard.tsx');
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');
  const appSource = readSource('../../App.tsx');
  const controlHubSource = readSource('../../pages/ControlHubLanding.tsx');

  assert.match(dashboardSource, /<AgentHomeDashboard[\s\S]*?mode=\{mode\}[\s\S]*?snapshot=\{snapshot\}/);
  assert.match(dashboardSource, /<EvaChatExperience[\s\S]*?resetSessionOnInitialMount[\s\S]*?choiceOnlyGuidedFlow/);
  assert.match(appSource, /<Route index element=\{<ControlHubLanding \/>\} \/>/);
  assert.match(appSource, /<Route path="new-agent" element=\{<Dashboard \/>\} \/>/);
  assert.match(controlHubSource, /label="AI Agent Studio"[\s\S]*?navigate\('\/new-agent'\)/);
  assert.match(sidebarSource, /\{\s*path:\s*['"]\/new-agent['"],\s*label:\s*['"]Home['"]/);
  assert.doesNotMatch(sidebarSource, /\{\s*path:\s*['"]\/['"],\s*label:\s*['"](?:Dashboard|Home)['"]/);
  assert.match(sidebarSource, /item\.path === ['"]\/new-agent['"][\s\S]*?setVariation\(['"]dashboard['"]\)/);
  assert.match(
    sidebarSource,
    /item\.path === ['"]\/new-agent['"] \|\| item\.path === ['"]\/agents['"][\s\S]*?setVariation\(['"]dashboard['"]\)/,
    'AI Agents should explicitly select the current dashboard list instead of reusing a legacy variation',
  );
  assert.match(sidebarSource, /navigate\(item\.path\)/);
  assert.match(
    sidebarSource,
    /agentsRouteShowsBuildingExperience[\s\S]*?location\.pathname === '\/agents\/eva-canvas'[\s\S]*?location\.pathname === '\/agents'[\s\S]*?variation !== 'dashboard'/,
    'creation experiences rendered under an agents route should still belong to Home navigation',
  );
  assert.match(
    sidebarSource,
    /item\.path === '\/new-agent'[\s\S]*?isNewAgentActive[\s\S]*?item\.path === '\/agents'[\s\S]*?!agentsRouteShowsBuildingExperience && isActive\(item\.path\)/,
    'Home and AI Agents should never both be selected while the builder is active',
  );
  const agentsSource = readSource('../../pages/Agents.tsx');
  assert.match(
    agentsSource,
    /if \(variation === ['"]dashboard['"]\) \{\s*variationView = <EvaAgentsTable \/>;/,
    'the current dashboard variation should always render the AI Agents list, including its empty state',
  );
  assert.doesNotMatch(
    agentsSource,
    /hasFamilyAgents[\s\S]*?<EvaChatExperience/,
    'the AI Agents list should not fall back to the legacy creation landing when it is empty',
  );
});
