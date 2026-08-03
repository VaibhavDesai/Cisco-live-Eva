import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

test('EAGLE GREEN starts with the large-reservation approval policy created, enabled, and connected', () => {
  const demoSource = readSource('../../demo/ciscoLiveDemo.ts');
  const seedSource = readSource('../../demo/ciscoLiveSeed.ts');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');

  assert.match(
    demoSource,
    /CISCO_LIVE_LARGE_RESERVATION_GUARDRAIL[\s\S]*?id:\s*['"]custom-large-reservation-approval['"][\s\S]*?name:\s*['"]Large reservation approval['"]/,
  );
  assert.match(
    demoSource,
    /CISCO_LIVE_PRIMARY_GUARDRAILS\s*=\s*\[[\s\S]*?CISCO_LIVE_LARGE_RESERVATION_GUARDRAIL[\s\S]*?\]/,
    'the approval policy should be part of the primary agent seed',
  );
  assert.match(
    demoSource,
    /id:\s*CISCO_LIVE_PRIMARY_AGENT_ID[\s\S]*?customGuardrails:\s*CISCO_LIVE_PRIMARY_GUARDRAILS/,
    'EAGLE GREEN should receive the seeded custom guardrails',
  );
  assert.match(
    configureSource,
    /ciscoLiveAgent\.customGuardrails\.map\(guardrail => \(\{[\s\S]*?enabled:\s*true/,
    'seeded custom guardrails should start enabled',
  );
  assert.match(
    seedSource,
    /markConfigured\(draft\.familyConfiguration,\s*['"]security['"],\s*getCiscoLiveGuardrailNames\(definition\),\s*now\)/,
    'the seeded policy should configure the Overview Security capability',
  );
  assert.match(
    overviewSource,
    /const configuredSecurity = configuredCapabilityLabels\(agentDraft,\s*['"]security['"]\)[\s\S]*?chips:\s*configuredSecurity\.map\(item => \(\{\s*item,\s*type:\s*['"]guardrail['"]/,
    'the Connected card should render configured Security policies as guardrail chips',
  );
});

test('operational status shows a compact session event table filtered by the selected time range', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');

  assert.match(
    source,
    /const operationalSessions = getCiscoLiveSessions\(agent\.id\)[\s\S]*?\.filter\(session => sessionAgeHours\(session\.updated\) <= operationalTimeRangeHours\)[\s\S]*?\.slice\(0,\s*3\)/,
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
    /if \(outcome === ['"]Transferred['"]\) return ['"]warning['"][\s\S]*?if \(outcome === ['"]Resolved['"]\) return ['"]success['"]/,
    'transferred sessions should use the yellow warning treatment while resolved sessions remain green',
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
  assert.match(handlerSource, /const releaseActionLabel = hasSavedConfigurationReadyToPublish \? ['"]Publish['"] : ['"]Save['"]/);
  assert.match(handlerSource, /const handleReleaseAction[\s\S]*?showToast\(['"]Configuration saved['"], ['"]success['"]\)[\s\S]*?handlePublishVersion\(\)/);
  assert.match(
    headerActionsSource,
    /disabled=\{releaseActionDisabled\}[\s\S]*?onClick=\{handleReleaseAction\}[\s\S]*?\{releaseActionLabel\}/,
    'the action should be disabled without changes, then progress from Save to Publish',
  );
  assert.doesNotMatch(headerActionsSource, /Duplicate as…/);
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
    /className="sidebar uplift-agent-panel"[\s\S]*?aria-label="Collapse agent navigation"[\s\S]*?className="sidebar-agent-back-link"[\s\S]*?<Icon name="list-menu" weight="bold" size=\{20\}[\s\S]*?<h2>Progress<\/h2>/,
    'the expanded agent rail should preserve the Uplift hierarchy and collapse control',
  );
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
    layoutSource,
    /agentPanelOpen[\s\S]*?app--ai--agent-panel-open[\s\S]*?agentPanelOpen=\{agentPanelOpen\}[\s\S]*?onAgentPanelOpenChange=\{setAgentPanelOpen\}/,
    'the application shell should own and expose the floating rail state',
  );
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
  assert.match(
    studioSource,
    /const observabilityPath = ['"]\/observability['"];/,
    'the dashboard action should match the workspace Observability navigation',
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
  assert.doesNotMatch(studioSource, /<KPICard|<KPIChart/);
});

test('selected guardrail banner opens a concrete session detail', () => {
  const studioSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');

  assert.match(
    studioSource,
    /selectedGuardrail && selectedGuardrail\.count > 0[\s\S]*?<Banner[\s\S]*?className="agent-studio-operational-event-banner agent-studio-connected-event-banner"[\s\S]*?label: 'View session →'[\s\S]*?navigate\(operationalSessionPath\)/,
    'the selected guardrail event should appear below the capability charts and link to its session',
  );
  assert.match(studioSource, /aria-pressed=\{selectedGuardrailName === guardrail\.item\}/);
  assert.match(
    studioSource,
    /selectedGuardrailName === guardrail\.item \? null : guardrail\.item/,
    'clicking the selected guardrail should clear the selection and hide its event banner',
  );
  assert.match(studioSource, /source=observability/);
  assert.match(sessionsSource, /const activeSession = sessionIdQuery[\s\S]*?sessions\.find/);
  assert.match(sessionsSource, />Session details</);
  assert.match(sessionsSource, /Conversation transcript/);
  assert.match(sessionsSource, /Back to agent overview/);
});

test('landing restores the design-exploration composer and quick-template entry points', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const composerIndex = source.indexOf('className="eva-landing-composer"');
  const quickTemplatesIndex = source.indexOf('aria-label="Quick templates"');

  assert.ok(composerIndex >= 0, 'the design-exploration landing composer should be present');
  assert.ok(quickTemplatesIndex > composerIndex, 'the composer should remain before the quick-template section');
  assert.match(
    source.slice(composerIndex, quickTemplatesIndex),
    /<AiFooter[\s\S]*?onSend=\{handleSend\}[\s\S]*?friendly banking assistant[\s\S]*?voiceActive=\{voiceActive\}/,
    'the landing should reuse the design-exploration composer and example prompt',
  );
  assert.match(
    source,
    /aria-label="quick start with"[\s\S]*?aria-label="Quick templates"[\s\S]*?starterPrompts\.slice\(0,\s*4\)\.map/,
    'the four design-exploration starters should appear below the Quick start with divider',
  );
  assert.match(
    source,
    /onClick=\{\(\) => handleTemplateSelect\(prompt\.templateId\)\}/,
    'each starter should retain the original direct template flow',
  );
  assert.match(
    source,
    />\s*All agents\s*<[\s\S]*?>\s*Start from scratch\s*</,
    'the original secondary landing actions should remain available',
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

test('Contact Center proposal review shows the verified channel, name, greeting, and instructions', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const proposalStart = source.indexOf('className="eva-family-proposal"');
  const proposalEnd = source.indexOf('className="eva-family-proposal__actions"', proposalStart);

  assert.ok(proposalStart >= 0 && proposalEnd > proposalStart, 'the family proposal card should be present');
  const proposalSource = source.slice(proposalStart, proposalEnd);
  for (const label of ['Channel', 'Name', 'Greeting', 'Instructions']) {
    assert.match(
      proposalSource,
      new RegExp(`<dt>${label}<\\/dt>`),
      `the proposal should let the user verify ${label.toLowerCase()}`,
    );
  }

  const applyStart = source.indexOf('const applyProposalToConfiguration');
  const applyEnd = source.indexOf('const handleAgentFamilySelect', applyStart);
  const applySource = source.slice(applyStart, applyEnd);
  assert.match(applySource, /proposal\.channel/);
  assert.match(applySource, /setSelectedChannels\(/);
  assert.match(
    applySource,
    /setWelcomeMessage\(proposal\.greeting\)/,
    'applying the reviewed proposal should preserve its greeting instead of regenerating one',
  );
});

test('Contact Center intake reuses the Acme option and verification card patterns', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    source,
    /const CONTACT_CENTER_INTAKE_CHANNEL_OPTIONS = \[[\s\S]*?label:\s*['"]Voice['"][\s\S]*?label:\s*['"]Digital['"][\s\S]*?label:\s*['"]Both['"]/,
  );
  assert.match(
    source,
    /isContactCenterChannelPrompt[\s\S]*?<Card[\s\S]*?className="eva-retail-channel-option card-selectable"[\s\S]*?onClick=\{\(\)\s*=>\s*handleFamilyIntakeAnswer\(option\.label\)\}/,
    'channel selection should use the existing selectable Acme cards',
  );
  assert.match(
    source,
    /isContactCenterNamePrompt[\s\S]*?className="eva-retail-agent-name-options"[\s\S]*?>\s*Edit name\s*<[\s\S]*?>\s*Use edited name\s*</,
    'the suggested name should reuse the existing accept-or-edit layout',
  );
  assert.match(
    source,
    /isContactCenterGreetingPrompt[\s\S]*?className="eva-retail-welcome-options"[\s\S]*?>\s*Accept greeting\s*<[\s\S]*?>\s*Edit greeting\s*</,
    'the opening greeting should reuse the existing accept-or-edit card',
  );
  assert.match(styles, /\.eva-retail-channel-option\.card\s*\{/);
  assert.match(styles, /\.eva-retail-agent-name-options\s*\{/);
  assert.match(styles, /\.eva-retail-welcome-option\s*\{/);
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

test('starter proposal actions edit the plan, create a draft, or continue to its overview', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const handlerStart = source.indexOf('const saveFamilyProposalDraft');
  const handlerEnd = source.indexOf('const handleCreateAgent', handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);

  assert.match(
    source,
    /onClick=\{\(\)\s*=>\s*setFamilyProposalEditing\(true\)\}[\s\S]*?>\s*Edit plan\s*<\/Button>/,
  );
  assert.match(
    source,
    /onClick=\{handleCreateFamilyAgent\}[\s\S]*?>\s*Create agent\s*<\/Button>/,
  );
  assert.match(
    source,
    /onClick=\{handleContinueFamilyConfiguration\}[\s\S]*?>\s*Continue configuration\s*<\/Button>/,
  );
  assert.match(
    handlerSource,
    /const handleCreateFamilyAgent[\s\S]*?saveFamilyProposalDraft\(\)[\s\S]*?setVariation\(['"]dashboard['"]\)[\s\S]*?navigate\(['"]\/agents['"]\)/,
    'Create agent should save the proposal as a draft and return to All Agents',
  );
  assert.match(
    handlerSource,
    /const handleContinueFamilyConfiguration[\s\S]*?saveFamilyProposalDraft\(\)[\s\S]*?navigate\(`\/agents\/\$\{agent\.id\}\/studio`\)/,
    'Continue configuration should save the draft and open its overview',
  );
  assert.doesNotMatch(source, />\s*(Apply draft|Ask for changes|Configure more)\s*</);

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

  const saveHandlerStart = source.indexOf('const handleSaveConfigurations');
  const saveHandlerEnd = source.indexOf('const enterRetailAgentStudio', saveHandlerStart);
  const saveHandlerSource = source.slice(saveHandlerStart, saveHandlerEnd);
  assert.match(saveHandlerSource, /updateAgentDraft\(activeDraftAgentId,\s*current\s*=>\s*current\)/);
  assert.match(saveHandlerSource, /setVariation\(['"]dashboard['"]\)/);
  assert.match(saveHandlerSource, /navigate\(['"]\/agents['"]\)/);
  assert.doesNotMatch(saveHandlerSource, /publishAgentVersion|navigateToAgentStudio/);
});

test('AI agent list cards keep a visible 16px grid gap', () => {
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
  assert.doesNotMatch(
    styles.slice(cardRuleStart, cardRuleEnd),
    /max-width:/,
    'cards must fill their grid tracks so extra track width does not inflate the visible gap',
  );
});

test('Dashboard home starts the first conversational creation landing', () => {
  const dashboardSource = readSource('../../pages/Dashboard.tsx');
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');

  assert.match(dashboardSource, /<EvaChatExperience resetSessionOnInitialMount \/>/);
  assert.match(sidebarSource, /\{\s*path:\s*['"]\/['"],\s*label:\s*['"]New agent['"]/);
  assert.doesNotMatch(sidebarSource, /\{\s*path:\s*['"]\/['"],\s*label:\s*['"]Dashboard['"]/);
  assert.match(sidebarSource, /item\.path === ['"]\/['"][\s\S]*?setVariation\(['"]dashboard['"]\)/);
  assert.match(sidebarSource, /navigate\(item\.path\)/);
});
