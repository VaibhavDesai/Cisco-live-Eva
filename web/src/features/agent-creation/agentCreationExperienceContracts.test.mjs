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
    /const overviewSnapshot = buildAgentOverviewSnapshot\([\s\S]*?security:\s*configuredSecurity[\s\S]*?chips:\s*configuredSecurity\.map\(item => \(\{\s*item,\s*type:\s*['"]guardrail['"]/,
    'the Connected card should render configured Security policies as guardrail chips',
  );
});

test('operational status shows a compact session event table filtered by the selected time range', () => {
  const source = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const snapshotSource = readSource('../agent-overview/agentOverviewSnapshot.ts');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(
    snapshotSource,
    /const recentSessions = operationalAvailable[\s\S]*?allSessions[\s\S]*?\.filter\(session => getAgentOverviewSessionAgeHours\(session\.updated\) <= resolvedTimeRange\.hours\)[\s\S]*?\.slice\(0,\s*3\)/,
    'sessions should respect the selected time range and stay compact',
  );
  assert.match(source, /const operationalSessions = overviewSnapshot\.operational\.recentSessions/);
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
  assert.match(
    styles,
    /\.agent-studio-session-events\s*\{[\s\S]*?border:\s*var\(--border-width-small\) solid var\(--color-theme-outline-secondary-normal,\s*#FFFFFF33\);[\s\S]*?background:\s*var\(--color-theme-background-secondary-normal,\s*#FFFFFF1C\);/,
    'the session table should use the same secondary surface and outline tokens as the dashboard cards',
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
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');

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
    /className="agent-studio-operational-metrics-table"[\s\S]*?<th scope="col">Metric<\/th>[\s\S]*?<th scope="col">Value<\/th>[\s\S]*?<th scope="col">Change<\/th>[\s\S]*?AGENT_OVERVIEW_OPERATIONAL_METRICS\.map/,
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
    /const handleTemplateSelect[\s\S]*?createOrSelectDraftAgent[\s\S]*?navigateProduct\(`\/agents\/\$\{agent\.id\}\/studio`\)/,
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
    /const handleCreateFamilyAgent[\s\S]*?saveFamilyProposalDraft\(\)[\s\S]*?setVariation\(['"]dashboard['"]\)[\s\S]*?navigateProduct\(['"]\/agents['"]\)/,
    'Create agent should save the proposal as a draft and return to All Agents',
  );
  assert.match(
    handlerSource,
    /const handleContinueFamilyConfiguration[\s\S]*?saveFamilyProposalDraft\(\)[\s\S]*?navigateProduct\(`\/agents\/\$\{agent\.id\}\/studio`\)/,
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
    /setVariation\(['"]dashboard['"]\)[\s\S]*?navigateProduct\(['"]\/agents['"]\)/,
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
  assert.match(handlerSource, /navigateProduct\(['"]\/agents['"]\)/);
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
  assert.match(saveHandlerSource, /navigateProduct\(['"]\/agents['"]\)/);
  assert.doesNotMatch(saveHandlerSource, /publishAgentVersion|navigateToAgentStudio/);
});

test('AI agent list cards keep a visible 16px grid gap', () => {
  const styles = readSource('../../components.css');
  const spacingTokens = readSource('../../tokens/spacing-tokens.css');
  const gridRuleStart = styles.indexOf('.ai-agents-grid {');
  const gridRuleEnd = styles.indexOf('}', gridRuleStart);
  const cardRuleStart = styles.indexOf('\n.ai-agents-agent-card {', gridRuleEnd) + 1;
  const cardRuleEnd = styles.indexOf('}', cardRuleStart);
  const footerRuleStart = styles.indexOf('.ai-agents-agent-footer {');
  const footerRuleEnd = styles.indexOf('}', footerRuleStart);

  assert.ok(gridRuleStart >= 0 && gridRuleEnd > gridRuleStart);
  assert.ok(cardRuleStart >= 0 && cardRuleEnd > cardRuleStart);
  assert.ok(footerRuleStart >= 0 && footerRuleEnd > footerRuleStart);
  assert.match(styles.slice(gridRuleStart, gridRuleEnd), /gap:\s*var\(--spacing-small\)/);
  assert.match(
    styles.slice(gridRuleStart, gridRuleEnd),
    /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*220px\),\s*1fr\)\)/,
    'agent cards should use responsive fractional tracks with a 220px floor so narrow workspaces can fit multiple columns',
  );
  assert.match(spacingTokens, /--spacing-small:\s*16px/);
  assert.doesNotMatch(
    styles.slice(cardRuleStart, cardRuleEnd),
    /max-width:/,
    'cards must fill their grid tracks so extra track width does not inflate the visible gap',
  );
  assert.match(
    styles.slice(cardRuleStart, cardRuleEnd),
    /display:\s*flex;[\s\S]*?flex-direction:\s*column;/,
    'agent cards should expose a full-height flex column for consistent action placement',
  );
  assert.match(
    styles.slice(footerRuleStart, footerRuleEnd),
    /margin-top:\s*auto;/,
    'the Preview action should stay pinned to the bottom of every agent card',
  );
});

test('Uplift shell makes the assistant persistent and removes the New Agent destination', () => {
  const appSource = readSource('../../App.tsx');
  const layoutSource = readSource('../../components/layout/MainLayout.tsx');
  const agentsSource = readSource('../../pages/Agents.tsx');
  const dashboardSource = readSource('../../pages/Dashboard.tsx');
  const sidebarSource = readSource('../../products/ai-agent-studio/components/Sidebar.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const configureSource = readSource('../../pages/agent/ActionConfigureV2.tsx');
  const monitorHeaderSource = readSource('../../pages/agent/AgentMonitorHeader.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');
  const testingSource = readSource('../../pages/agent/AgentAnalytics.tsx');
  const historySource = readSource('../../pages/agent/AgentHistory.tsx');
  const sharedStyles = readSource('../../components.css');
  const styles = readSource('../../products/ai-agent-studio/components.css');

  assert.match(appSource, /<Route path="\/" element=\{<Navigate to="\/agents" replace \/>\} \/>/);
  assert.equal((layoutSource.match(/<EvaChatExperience/g) ?? []).length, 1);
  assert.match(layoutSource, /shellMode/);
  assert.match(layoutSource, /<AssistantControlRail \/>/);
  assert.match(
    layoutSource,
    /className="uplift-assistant-base app--ai"/,
    'the persistent assistant must retain the original AI Agent Studio presentation scope',
  );
  assert.match(
    layoutSource,
    /onProductNavigate=\{options => \{[\s\S]*?options\?\.keepAssistantVisible[\s\S]*?setSnap\('split'\)[\s\S]*?setSnap\('expanded'\)/,
  );
  assert.match(
    layoutSource,
    /preserveAssistantOnNextRouteRef\.current = true[\s\S]*?setSnap\('split'\)/,
    'agent configuration handoffs should not be overridden by the route-change workspace safeguard',
  );
  assert.match(layoutSource, /role="separator"[\s\S]*?aria-label="Resize AI Agent Studio workspace"/);
  assert.doesNotMatch(agentsSource, /EvaChatExperience/);
  assert.match(dashboardSource, /<Navigate to="\/agents" replace \/>/);
  assert.doesNotMatch(sidebarSource, /New agent/);
  assert.match(sidebarSource, /className="sidebar uplift-agent-panel"/);
  assert.match(sidebarSource, /aria-label="Open agent navigation"/);
  assert.match(sidebarSource, /aria-label="Compact agent navigation"/);
  assert.match(sidebarSource, /className="sidebar sidebar--collapsed uplift-agent-compact-rail"/);
  assert.doesNotMatch(sidebarSource, /onMouseEnter=\{\(\) => openAgentPanel\(\)\}/);
  assert.doesNotMatch(sidebarSource, /onMouseLeave=\{\(\) => onAgentPanelOpenChange\?\.\(false\)\}/);
  assert.doesNotMatch(layoutSource, /if \(agentPanelVisible\) setAgentPanelOpen\(false\)/);
  assert.match(
    sidebarSource,
    /<Link[\s\S]*?className="sidebar-agent-back-link"[\s\S]*?to="\/agents"[\s\S]*?Back to AI Agents[\s\S]*?<\/Link>/,
    'the docked Progress panel should provide a semantic route back to the AI Agents list',
  );
  assert.match(sidebarSource, /<h2>Progress<\/h2>/);
  assert.doesNotMatch(sidebarSource, /header="Configuration"/);
  assert.match(
    sidebarSource,
    /className="sidebar-agent-nav"[\s\S]*?<SideNav\.Upper>[\s\S]*?<SideNav\.Item[\s\S]*?label="Overview"[\s\S]*?\/>[\s\S]*?<SideNav\.Section header="Configure">/,
    'Overview should sit directly below Progress without a separate Configuration section or divider',
  );
  assert.match(sidebarSource, /header="Configure"/);
  assert.match(sidebarSource, /header="Monitor"/);
  assert.match(overviewSource, /Back to AI Agents/);
  assert.match(overviewSource, /className="agent-studio-back-link"/);
  assert.doesNotMatch(overviewSource, /agent-studio-header-action--back/);
  assert.match(overviewSource, /primary-content agent-studio-landing agent-workspace-page/);
  assert.match(configureSource, /primary-content action-config-v2-page agent-workspace-page/);
  assert.match(configureSource, /className="agent-studio-back-link"[\s\S]*?Back to AI Agents/);
  assert.match(configureSource, /statusContent=\{headerStatus\}/);
  assert.match(configureSource, /className="agent-studio-header-actions"/);
  assert.match(configureSource, /aria-label=\{`Save \$\{agent\.name\} configuration`\}/);
  assert.match(configureSource, /v2-channels__title agent-config-section-title/);
  assert.match(configureSource, /instructions-sidebar-title agent-config-section-title/);
  assert.match(configureSource, /guardrails-title agent-config-section-title/);
  assert.match(configureSource, /action-config-v2-title agent-config-section-title/);
  assert.match(monitorHeaderSource, /className="agent-studio-back-link"[\s\S]*?Back to AI Agents/);
  assert.match(monitorHeaderSource, /statusContent=\{headerStatus\}/);
  assert.match(monitorHeaderSource, /className="agent-studio-header-actions"/);
  assert.match(monitorHeaderSource, /aria-label=\{`Save \$\{agent\.name\} configuration`\}/);
  assert.match(sessionsSource, /primary-content agent-monitor-page agent-workspace-page/);
  assert.match(sessionsSource, /agent-workspace-section-title">Sessions/);
  assert.match(testingSource, /primary-content agent-monitor-page agent-workspace-page/);
  assert.match(testingSource, /agent-workspace-section-title">Testing/);
  assert.match(historySource, /primary-content agent-monitor-page agent-workspace-page/);
  assert.match(historySource, /agent-workspace-section-title">History/);
  assert.match(
    sharedStyles,
    /\.action-config-v2-page\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;[\s\S]*?gap:\s*var\(--spacing-medium\);/,
  );
  assert.match(
    styles,
    /\.agent-monitor-page\s*\{[\s\S]*?flex-direction:\s*column;[\s\S]*?gap:\s*var\(--spacing-medium\);/,
  );
  assert.match(
    styles,
    /\.agent-monitor-page \.agent-workspace-section-title\s*\{[\s\S]*?font-size:\s*var\(--font-size-heading-midsize\);[\s\S]*?line-height:\s*var\(--font-lineheight-heading-midsize\);/,
  );
  assert.match(
    sharedStyles,
    /\.action-config-v2-page \.agent-config-section-title\s*\{[\s\S]*?font-size:\s*var\(--font-size-heading-midsize\);[\s\S]*?line-height:\s*var\(--font-lineheight-heading-midsize\);/,
  );
  assert.match(sidebarSource, /navigate\(item\.path\)/);
  assert.match(
    sidebarSource,
    /const workspaceNavCollapsed =[\s\S]*?collapsed \|\| \(!workspaceNavHovered && !workspaceNavFocusWithin\)/,
    'the workspace sidenav should be collapsed by default and expand for pointer or keyboard focus',
  );
  assert.match(sidebarSource, /onMouseEnter=\{\(\) => setWorkspaceNavHovered\(true\)\}/);
  assert.match(sidebarSource, /onMouseLeave=\{\(\) => setWorkspaceNavHovered\(false\)\}/);
  assert.match(sidebarSource, /onFocusCapture=\{\(\) => setWorkspaceNavFocusWithin\(true\)\}/);
  assert.match(
    styles,
    /\.uplift-product-surface \.main\s*\{[\s\S]*?inset:\s*0 0 0 60px;/,
    'the product content should use the collapsed rail width while the hover-expanded sidenav overlays it',
  );
});

test('Uplift shell includes responsive drawers, reduced motion, and accessible compact controls', () => {
  const layoutSource = readSource('../../components/layout/MainLayout.tsx');
  const railSource = readSource('../../products/ai-agent-studio/components/AssistantControlRail.tsx');
  const overviewSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const assistantSource = readSource('../eva/EvaChatExperience.tsx');
  const footerSource = readSource('../../components/shared/ai/AiFooter.jsx');
  const knowledgeSource = readSource('../../pages/Knowledge.tsx');
  const knowledgeDetailSource = readSource('../../pages/KnowledgeBaseDetail.tsx');
  const aiEngineSource = readSource('../../pages/Settings.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const viteConfigSource = readSource('../../../vite.config.ts');

  assert.match(
    viteConfigSource,
    /name:\s*['"]write-spa-route-entries['"][\s\S]*?apply:\s*['"]build['"][\s\S]*?path\.join\(distDir,\s*['"]agents['"]\)[\s\S]*?fs\.copyFileSync\(appEntry,\s*path\.join\(agentsEntryDir,\s*['"]index\.html['"]\)\)/,
    'production builds should emit an /agents route entry for static Pages deep links',
  );

  assert.match(layoutSource, /aria-valuemin=\{PRODUCT_RAIL_WIDTH\}/);
  assert.match(layoutSource, /aria-valuemax=\{maxSurfaceWidth\}/);
  assert.match(layoutSource, /aria-valuetext=\{`\$\{Math\.round\(surfaceWidth\)\} pixels wide`\}/);
  assert.match(
    layoutSource,
    /const step = event\.shiftKey \? KEYBOARD_RESIZE_LARGE_STEP : KEYBOARD_RESIZE_STEP;[\s\S]*?setDragWidth\(surfaceWidth \+ direction \* step\)/,
    'the workspace separator should support fine-grained keyboard resizing',
  );
  assert.match(
    layoutSource,
    /window\.addEventListener\('pointermove', handlePointerMove\)[\s\S]*?window\.addEventListener\('pointerup', finishPointerResize\)/,
    'pointer resizing should continue after the pointer leaves the visible edge handle',
  );
  assert.doesNotMatch(
    layoutSource,
    /onBlur=\{\(\) => snapToNearestWidth\(surfaceWidth\)\}/,
    'the workspace should retain a freely chosen width when the resize handle loses focus',
  );
  assert.match(layoutSource, /event\.key === 'Home'/);
  assert.match(layoutSource, /event\.key === 'End'/);
  assert.match(railSource, /event\.key === 'Escape'/);
  assert.match(railSource, /title="Chat history"/);
  assert.match(railSource, /title="New chat"/);
  assert.match(
    layoutSource,
    /aria-label="Start a new chat"[\s\S]*?createThread\(\);[\s\S]*?closeThreadHistory\(\);/,
    'the Assistant header new-chat action should create and reveal a fresh home thread',
  );
  assert.match(
    railSource,
    /const assistantOpen = state\.productSurface\.snap !== 'expanded'/,
    'the Assistant rail should derive a clear open or closed state',
  );
  assert.match(
    railSource,
    /const openSnap = viewportWidth < MOBILE_SHELL_BREAKPOINT \? 'compact' : 'split';[\s\S]*?setSnap\(assistantOpen \? 'expanded' : openSnap\)/,
    'the Assistant rail should only toggle between closed and the screen-appropriate open view',
  );
  assert.doesNotMatch(
    railSource,
    /state\.productSurface\.snap === 'split'[\s\S]*?setSnap\('compact'\)/,
    'the Assistant rail should not cycle through workspace sizes on repeated activation',
  );
  assert.match(
    railSource,
    /aria-label=\{assistantOpen \? 'Close AI Assistant' : 'Open AI Assistant'\}[\s\S]*?aria-pressed=\{assistantOpen\}/,
    'the Assistant toggle should expose its current state and next action',
  );
  assert.match(styles, /@media \(max-width: 1023px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /backdrop-filter:\s*blur\(10px\)/);
  assert.match(knowledgeSource, /className="primary-content knowledge-page-surface"/);
  assert.match(knowledgeDetailSource, /className="primary-content knowledge-page-surface"/);
  assert.match(aiEngineSource, /className="primary-content ai-engine-page-surface"/);
  assert.match(
    styles,
    /\.primary-content\.knowledge-page-surface,[\s\S]*?\.primary-content\.ai-engine-page-surface,[\s\S]*?> \.clus-kpi-dashboard-root\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*rgba\(25, 25, 25, 0\.8\);/,
    'Observability, Knowledge, and AI Engine should share the borderless AI Agents product surface',
  );
  assert.match(
    styles,
    /\.uplift-product-surface \.sidebar:not\(\.uplift-agent-panel\)\s*\{[\s\S]*?background-color:\s*rgba\(25, 25, 25, 0\.8\);[\s\S]*?background-image:\s*linear-gradient\(\s*90deg,\s*rgba\(25, 25, 25, 0\) 72\.95%,\s*rgba\(41, 41, 41, 0\.2\) 100\.82%[\s\S]*?backdrop-filter:\s*blur\(20px\);[\s\S]*?-webkit-backdrop-filter:\s*blur\(20px\);/,
    'the product sidenav should layer the horizontal glass gradient over the 80% core container color without changing the floating Progress panel',
  );
  assert.match(
    styles,
    /\.sidebar:not\(\.sidebar--collapsed\):not\(\.uplift-agent-panel\) \.sidenav\s*\{[\s\S]*?width:\s*100%;/,
    'the expanded sidenav should stay within the sidebar content box so pill corners remain visible',
  );
  assert.match(
    layoutSource,
    /const assistantWorkspaceWidth = Math\.max\([\s\S]*?viewportWidth[\s\S]*?- surfaceWidth[\s\S]*?- ASSISTANT_RAIL_WIDTH/,
    'assistant content should be sized from the workspace that remains beside the product surface',
  );
  assert.match(layoutSource, /data-assistant-workspace-width=\{Math\.round\(assistantWorkspaceWidth\)\}/);
  assert.match(
    layoutSource,
    /state\.productSurface\.snap === 'split'[\s\S]*?activeThread\.messages\.length === 0/,
    'only the default side-panel Assistant should request the empty-thread experience',
  );
  assert.match(
    assistantSource,
    /AGENT_ASSISTANT_STARTER_PROMPTS\.map\(prompt => \([\s\S]*?onClick=\{\(\) => handleSend\(prompt\)\}/,
    'contextual starter prompts should send through the normal message path',
  );
  assert.match(
    assistantSource,
    /const showSideEmptyState =[\s\S]*?sideEmptyState[\s\S]*?!guidanceVisible/,
    'all empty side-panel threads should replace the annotated Assistant home with the empty state',
  );
  assert.doesNotMatch(
    assistantSource,
    /const showSideEmptyState =[\s\S]*?Boolean\(contextOverviewSnapshot\)[\s\S]*?const showLandingOptions/,
    'the side-panel empty state should not require an agent context',
  );
  assert.match(
    assistantSource,
    /<section className="eva-first-interface__hero"[\s\S]*?<EvaHeroAnimation \/>[\s\S]*?Build, deploy, and manage AI agents for every interaction\./,
    'the full-screen Assistant should retain the animated home and slogan',
  );
  const sideEmptyComposerSource = assistantSource.match(
    /\{showSideEmptyState && \([\s\S]*?<\/section>\s*\)\}/,
  )?.[0] ?? '';
  assert.ok(sideEmptyComposerSource, 'the side-panel empty state should render its composer');
  assert.doesNotMatch(
    sideEmptyComposerSource,
    /\bfillContainer\b/,
    'the side-panel empty composer should keep the shared compact height instead of stretching vertically',
  );
  assert.match(
    styles,
    /\.uplift-assistant-empty-composer[\s\S]*?\.ai-footer__textarea\s*\{[\s\S]*?min-height:\s*20px;[\s\S]*?\.ai-footer__textarea:placeholder-shown\s*\{[\s\S]*?height:\s*44px !important;/,
    'the empty side-panel composer should preserve the shared compact textarea height',
  );
  assert.match(
    assistantSource,
    /if \(landingMode === 'existing' && !contextOverviewSnapshot\)/,
    'an agent-bound thread must not render the global Agents landing table',
  );
  assert.match(
    styles,
    /\.uplift-assistant-base\s*\{[\s\S]*?left:\s*min\(calc\(var\(--uplift-product-width\) \+ 4px\), calc\(100vw - 48px\)\);[\s\S]*?container-type:\s*inline-size/,
    'the assistant content surface should move with the draggable product edge while its background stays fixed',
  );
  assert.match(
    styles,
    /\.uplift-workspace--expanded \.uplift-assistant-base\s*\{[\s\S]*?left:\s*calc\(100vw - 48px\);[\s\S]*?visibility:\s*hidden;[\s\S]*?pointer-events:\s*none;/,
    'the minimized Assistant should collapse its content surface instead of exposing an interactive strip beside the control rail',
  );
  assert.match(styles, /@container uplift-assistant \(max-width: 720px\)/);
  assert.match(
    styles,
    /\.uplift-workspace--expanded \.uplift-assistant-base \.eva-first-interface__chat--sticky\s*\{[\s\S]*?display:\s*none;/,
    'only the collapsed Assistant workspace should hide the composer',
  );
  assert.doesNotMatch(
    styles,
    /\.uplift-workspace--split \.uplift-assistant-base \.eva-first-interface__chat--sticky\s*\{[\s\S]*?display:\s*none;/,
    'the default Assistant workspace should keep the composer visible',
  );
  assert.match(footerSource, /e\.key === 'Enter' && !e\.shiftKey/);
  assert.match(footerSource, /Math\.min\(ta\.scrollHeight,\s*200\)/);
  assert.match(
    styles,
    /\.uplift-assistant-base[\s\S]*?\.eva-first-interface[\s\S]*?\.ai-footer__group:focus-within[\s\S]*?0 0 0 6px var\(--focus-ring-2\)/,
    'the focused contextual composer should retain a visible multi-ring focus treatment',
  );
  assert.match(
    styles,
    /\.uplift-assistant-base \.eva-ai-footer \.ai-footer__action-bar\s*\{[\s\S]*?flex:\s*0 0 40px;/,
    'the composer action row should remain a separate 40px control strip',
  );
  assert.match(
    styles,
    /@media \(min-width:\s*720px\)\s*\{[\s\S]*?\.uplift-workspace--agent-panel-open[\s\S]*?\.main[\s\S]*?> \.primary-content\.agent-workspace-page\s*\{[\s\S]*?padding-left:\s*calc\(244px \+ var\(--spacing-small\)\);/,
    'desktop Overview and Configure content should reserve the floating Progress panel column',
  );
  assert.match(
    styles,
    /\.uplift-workspace--agent \.uplift-product-surface \.main > \.primary-content\.agent-workspace-page\s*\{[\s\S]*?background:\s*rgba\(25,\s*25,\s*25,\s*0\.8\);/,
    'the Agent Studio content surface should use #191919 at 80% opacity',
  );
  assert.match(
    styles,
    /\.uplift-product-surface \.main > \.primary-content\.ai-agents-list-surface\s*\{[\s\S]*?background:\s*rgba\(25,\s*25,\s*25,\s*0\.8\);/,
    'the AI Agents list should share the Agent Studio content surface background',
  );
  assert.match(
    styles,
    /@media \(min-width:\s*720px\)\s*\{[\s\S]*?\.uplift-workspace--agent-panel-open[\s\S]*?\.agent-workspace-page[\s\S]*?> \.agent-header-sticky\s*\{[\s\S]*?margin-left:\s*calc\(-244px - var\(--spacing-small\)\);/,
    'the agent header should span the full product surface while the floating Progress panel is open',
  );
  assert.match(
    styles,
    /@media \(min-width:\s*720px\)\s*\{[\s\S]*?\.uplift-workspace--agent \.uplift-agent-panel\s*\{[\s\S]*?inset:\s*151px auto auto 12px !important;[\s\S]*?height:\s*calc\(100% - 163px\) !important;[\s\S]*?max-height:\s*calc\(100% - 163px\) !important;/,
    'the floating Progress panel should align its top edge with the desktop Overview heading and retain the bottom inset',
  );
  assert.match(
    styles,
    /\.agent-studio-grid--published \.agent-studio-connected-summary__item,[\s\S]*?\.agent-studio-grid--published \.agent-studio-connected-chart\s*\{[\s\S]*?border:\s*var\(--border-width-small\) solid var\(--color-theme-outline-secondary-normal,\s*#FFFFFF33\);[\s\S]*?background:\s*var\(--color-theme-background-secondary-normal,\s*#FFFFFF1C\);/,
    'capability summary and chart cards should use the secondary background and outline tokens',
  );
  assert.match(
    styles,
    /\.agent-studio-grid--published \.agent-studio-connected-insights\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*var\(--color-theme-background-secondary-normal,\s*#FFFFFF1C\);/,
    'overview dashboard insights should remain a borderless secondary surface',
  );
  assert.match(
    styles,
    /\.agent-studio-grid--published :is\([\s\S]*?\.agent-studio-card--connections\.card,[\s\S]*?\.agent-studio-card--operational\.card[\s\S]*?\)\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*var\(--bg-glass\);[\s\S]*?backdrop-filter:\s*blur\(20px\) saturate\(120%\);/,
    'Capability usage and Operational status should share the same glass surface treatment',
  );
  assert.match(
    styles,
    /\.agent-studio-connected-metrics\s*\{[\s\S]*?gap:\s*16px;/,
    'capability dashboard rows should keep 16px of vertical space',
  );
  assert.match(
    overviewSource,
    /<Icon name="side-panel" weight="regular" size="sm" \/>/,
    'agent headers should use the outlined side-panel icon for workspace sizing',
  );
  assert.match(
    overviewSource,
    /upliftWorkspaceState\.productSurface\.snap === 'expanded' \? 'split' : 'expanded'/,
    'agent headers should toggle between split and expanded workspace sizes',
  );
  assert.match(layoutSource, /name="side-panel"[\s\S]*?weight="bold"/);
  assert.doesNotMatch(layoutSource, /name="sign-out"/);
  assert.match(
    layoutSource,
    /if \(snap === 'split'\) return 'compact';[\s\S]*?if \(snap === 'compact'\) return 'expanded';[\s\S]*?return 'split';/,
    'the Assistant header size control should cycle Default, Full screen, and Collapse',
  );
  assert.match(
    layoutSource,
    /Make AI Assistant full screen[\s\S]*?Collapse AI Assistant workspace[\s\S]*?Restore default AI Assistant workspace/,
    'each Assistant workspace state should expose a clear next-action label',
  );
  assert.doesNotMatch(layoutSource, /aria-label="Hide AI Assistant workspace"/);
  assert.match(
    assistantSource,
    /navigateProduct\(`\/agents\/\$\{agentId\}\/studio`\);[\s\S]*?setStudioTransitioning\(false\);/,
    'the persistent Assistant must return after its product-navigation transition finishes',
  );
});
