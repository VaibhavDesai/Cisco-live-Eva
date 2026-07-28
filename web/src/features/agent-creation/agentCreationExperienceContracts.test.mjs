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
    /<Banner[\s\S]*?className="agent-studio-operational-event-banner"[\s\S]*?\/>[\s\S]*?<section[\s\S]*?className="agent-studio-session-events"[\s\S]*?<Table className="agent-studio-session-events__table"/,
    'the session table should appear directly below the operational banner',
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

test('operational status presents its metrics as a compact table with a dashboard link', () => {
  const studioSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
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

test('operational session banner opens a concrete session detail', () => {
  const studioSource = readSource('../../pages/agent/AgentStudioLanding.tsx');
  const sessionsSource = readSource('../../pages/agent/AgentSessions.tsx');

  assert.match(
    studioSource,
    /<Banner[\s\S]*?type="success"[\s\S]*?className="agent-studio-operational-event-banner"[\s\S]*?label: 'View session →'[\s\S]*?navigate\(operationalSessionPath\)/,
    'the operational event should reuse the success banner and link to its session',
  );
  assert.match(studioSource, /source=observability/);
  assert.match(sessionsSource, /const activeSession = sessionIdQuery[\s\S]*?sessions\.find/);
  assert.match(sessionsSource, />Session details</);
  assert.match(sessionsSource, /Conversation transcript/);
  assert.match(sessionsSource, /Back to agent overview/);
});

test('landing restores the conversational composer before the centered family chooser', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');
  const styles = readSource('../../products/ai-agent-studio/components.css');
  const composerIndex = source.indexOf('className="eva-landing-composer"');
  const familyChooserIndex = source.indexOf('className="eva-dialogue eva-family-choice-thread"');

  assert.ok(composerIndex >= 0, 'the original landing composer should be present');
  assert.ok(familyChooserIndex > composerIndex, 'the composer should remain before the family-card section');
  assert.match(
    source.slice(composerIndex, familyChooserIndex),
    /<AiFooter[\s\S]*?onSend=\{handleSend\}[\s\S]*?voiceActive=\{voiceActive\}/,
    'the landing must reuse the established conversational composer',
  );
  assert.match(
    styles,
    /\.eva-family-choice-thread\s*>\s*\.eva-ai-response\.ai-response\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;[\s\S]*?margin-inline:\s*auto;/,
    'the family response should fill and center within the landing composition',
  );
  assert.match(
    styles,
    /\.eva-family-choice-thread[^{]*\.ai-response__content\s*\{[\s\S]*?text-align:\s*center;/,
    'the family prompt should use the centered landing alignment',
  );
  assert.match(
    styles,
    /\.eva-landing-shell:not\(\.eva-first-interface--generated\) \.eva-first-interface__hero,\s*\.eva-landing-shell:not\(\.eva-first-interface--generated\) \.eva-landing-composer,\s*\.eva-landing-shell:not\(\.eva-first-interface--generated\) \.eva-family-choice-thread\s*\{[\s\S]*?animation:\s*evaLandingHeroSettle/,
    'hero, composer, and family content should enter as one connected animation',
  );
});

test('landing family labels and recommendation actions use the requested visual hierarchy', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');

  assert.match(
    source,
    /const FAMILY_CHOICE_LABELS[\s\S]*?contact_center:\s*['"]CX concierge['"][\s\S]*?internal_assistant:\s*['"]Ai Assistant['"]/,
  );
  assert.match(source, /<strong>\{FAMILY_CHOICE_LABELS\[family\]\}<\/strong>/);
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

test('Show templates reveals all four legacy starters through the family-aware proposal flow', () => {
  const source = readSource('../eva/EvaChatExperience.tsx');

  assert.match(source, />\s*\{showOtherTemplates\s*\?\s*['"]Hide templates['"]\s*:\s*['"]Show templates['"]\}\s*</);
  assert.match(source, /aria-expanded=\{showOtherTemplates\}/);
  assert.match(source, /aria-controls=['"]eva-landing-template-options['"]/);
  assert.match(
    source,
    /\{showOtherTemplates\s*&&\s*\([\s\S]*?id=['"]eva-landing-template-options['"][\s\S]*?starterPrompts\.slice\(0,\s*4\)\.map/,
    'the template button should disclose the previous four template cards',
  );

  const expectedTargets = [
    ['customer-support', 'calling', 'voice-receptionist'],
    ['knowledge-assistant', 'contact_center', 'cx-concierge'],
    ['policy-compliance', 'internal_assistant', 'it-help-desk'],
    ['workflow-automation', 'contact_center', 'order-management'],
  ];
  for (const [templateId, family, starterId] of expectedTargets) {
    assert.match(
      source,
      new RegExp(`['"]${templateId}['"]\\s*:\\s*\\{[^}]*family:\\s*['"]${family}['"][^}]*starterId:\\s*['"]${starterId}['"]`),
      `${templateId} should open the compatible ${family} proposal`,
    );
  }

  assert.match(source, /setSelectedAgentFamily\(target\.family\)/);
  assert.match(source, /setFamilyProposal\(proposal\)/);
  assert.match(source, /setFamilyProposalApplied\(false\)/);
  assert.doesNotMatch(
    source,
    /handleLandingStarterSelect[\s\S]{0,2500}applyProposalToConfiguration\(/,
    'choosing a template must present a proposal instead of applying configuration automatically',
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
  assert.match(sidebarSource, /item\.path === ['"]\/['"][\s\S]*?setVariation\(['"]dashboard['"]\)/);
  assert.match(sidebarSource, /navigate\(item\.path\)/);
});
