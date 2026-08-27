import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALL_LICENSED_ENTITLEMENTS,
  FAMILY_CAPABILITIES,
  FAMILY_METADATA,
  SKIPPED_INTAKE_ANSWER,
  applyPresetAnswersToDraft,
  buildStarterProposal,
  createBlankAgentDraft,
  createDraftFromProposal,
  decodeVoiceDestinationAnswer,
  duplicateDraftAs,
  encodeVoiceDestinationAnswer,
  getAdaptiveIntakeQuestions,
  getFamilyIntakeSequence,
  getActionableStoredRecommendations,
  getCapabilityTrackerStatus,
  getMinimumPublishIssues,
  getRecommendationSourceRevision,
  getRankedRecommendations,
  isMinimumPublishable,
} from './agentCreationModel.ts';

test('exposes all three licensed agent families and their capability matrices', () => {
  assert.deepEqual(Object.keys(FAMILY_METADATA), [
    'calling',
    'contact_center',
    'internal_assistant',
  ]);
  assert.deepEqual(ALL_LICENSED_ENTITLEMENTS, {
    calling: 'licensed',
    contact_center: 'licensed',
    internal_assistant: 'licensed',
  });

  for (const family of Object.keys(FAMILY_METADATA)) {
    assert.equal(FAMILY_CAPABILITIES[family][0].availability, 'minimum');
    assert.equal(FAMILY_CAPABILITIES[family][1].id, 'instructions');
  }
  assert.equal(
    FAMILY_CAPABILITIES.calling.find(item => item.id === 'actions').availability,
    'cx_only',
  );
  assert.equal(
    FAMILY_CAPABILITIES.calling.find(item => item.id === 'deployment').availability,
    'external',
  );
  assert.equal(
    FAMILY_CAPABILITIES.calling.find(item => item.id === 'calling_queues').section,
    'external',
  );
  assert.equal(
    FAMILY_CAPABILITIES.calling.find(item => item.id === 'omnichannel').availability,
    'cx_only',
  );
  assert.ok(FAMILY_CAPABILITIES.contact_center.some(item => item.id === 'observability'));
  assert.ok(FAMILY_CAPABILITIES.internal_assistant.some(item => item.id === 'placement'));
});

test('reveals each family preset in its exact order as answers arrive', () => {
  const scenarios = [
    {
      family: 'calling',
      keys: ['voice_destination', 'outcome', 'name', 'greeting', 'knowledge'],
      answers: {
        voice_destination: encodeVoiceDestinationAnswer({
          location: 'San Francisco headquarters',
          phoneNumber: '+1 (415) 555-0142',
        }),
        outcome: 'Answer common questions and schedule appointments',
        name: 'Front Desk Receptionist',
        greeting: 'Thanks for calling. How can I help?',
        knowledge: 'Visitor information',
      },
    },
    {
      family: 'contact_center',
      keys: ['channel', 'outcome', 'name', 'greeting', 'knowledge', 'actions'],
      answers: {
        channel: 'Voice, Digital',
        outcome: 'Resolve customer questions and route complex requests',
        name: 'Customer Service Agent',
        greeting: 'Hi. How can I help today?',
        knowledge: SKIPPED_INTAKE_ANSWER,
        actions: SKIPPED_INTAKE_ANSWER,
      },
    },
    {
      family: 'internal_assistant',
      keys: ['outcome', 'name', 'knowledge'],
      answers: {
        outcome: 'Help employees find approved policies',
        name: 'Employee Assistant',
        knowledge: 'Employee handbook',
      },
    },
  ];

  for (const { family, keys, answers } of scenarios) {
    for (let completedCount = 0; completedCount <= keys.length; completedCount += 1) {
      const completedAnswers = Object.fromEntries(
        keys.slice(0, completedCount).map(key => [key, answers[key]]),
      );
      const expectedVisibleCount = Math.min(completedCount + 1, keys.length);
      assert.deepEqual(
        getAdaptiveIntakeQuestions(family, completedAnswers).map(question => question.answerKey),
        keys.slice(0, expectedVisibleCount),
        `${family} should reveal only the next unanswered preset question`,
      );
    }
  }

  const calling = getAdaptiveIntakeQuestions('calling', scenarios[0].answers);
  assert.equal(calling[0].prompt, 'Select a location and phone number');
  assert.equal(calling[1].prompt, "What's your agent goal?");
  assert.equal(calling.every(question => question.required), true);

  const contactCenter = getAdaptiveIntakeQuestions('contact_center', scenarios[1].answers);
  assert.deepEqual(contactCenter[0].options, ['Voice', 'Digital', 'Video']);
  assert.equal(contactCenter.find(question => question.answerKey === 'knowledge').required, false);
  assert.equal(contactCenter.find(question => question.answerKey === 'actions').required, false);

  const employee = getAdaptiveIntakeQuestions('internal_assistant', scenarios[2].answers);
  assert.equal(employee.every(question => question.required), true);
});

test('exposes each complete family intake sequence for progress UI', () => {
  assert.notStrictEqual(
    getFamilyIntakeSequence('calling'),
    getFamilyIntakeSequence('calling'),
    'callers should receive a copy of the ordered sequence',
  );
  assert.deepEqual(
    getFamilyIntakeSequence('calling').map(question => question.answerKey),
    ['voice_destination', 'outcome', 'name', 'greeting', 'knowledge'],
  );
  assert.deepEqual(
    getFamilyIntakeSequence('contact_center').map(question => question.answerKey),
    ['channel', 'outcome', 'name', 'greeting', 'knowledge', 'actions'],
  );
  assert.deepEqual(
    getFamilyIntakeSequence('internal_assistant').map(question => question.answerKey),
    ['outcome', 'name', 'knowledge'],
  );
});

test('round trips structured voice destinations and rejects incomplete values', () => {
  const destination = {
    location: 'San Francisco headquarters',
    phoneNumber: '+1 (415) 555-0142',
  };

  assert.deepEqual(decodeVoiceDestinationAnswer(encodeVoiceDestinationAnswer(destination)), destination);
  assert.equal(decodeVoiceDestinationAnswer('{not-json'), null);
  assert.equal(decodeVoiceDestinationAnswer(JSON.stringify({ location: 'San Francisco' })), null);
  assert.equal(decodeVoiceDestinationAnswer(JSON.stringify({ location: ' ', phoneNumber: '+1' })), null);
});

test('builds deterministic, use-case-aware starter proposals', () => {
  const answers = {
    purpose: 'Schedule and reschedule clinic appointments',
    name: 'Clinic Receptionist',
    language: 'French (France)',
  };
  const first = buildStarterProposal('calling', answers);
  const second = buildStarterProposal('calling', answers);

  assert.deepEqual(first, second);
  assert.equal(first.name, 'Clinic Receptionist');
  assert.equal(first.language, 'French (France)');
  assert.match(first.instructions, /Schedule and reschedule clinic appointments/);
  assert.match(first.instructions, /calling assistant/i);
  assert.match(first.instructions, /human handoff/i);

  const internal = buildStarterProposal('internal_assistant', {
    purpose: 'Coordinate outages with incident runbooks and deployment updates',
  });
  assert.equal(internal.name, 'AI Incident Command Agent');
  assert.match(internal.instructions, /incident command/i);

  const customerCx = buildStarterProposal('contact_center', {
    use_case: 'Resolve order status and returns',
    mode: 'Employee assist',
  });
  assert.match(customerCx.instructions, /Help customers with/i);
  assert.doesNotMatch(customerCx.instructions, /employees assisting|employee assist|hybrid/i);

  const reviewEdited = buildStarterProposal('contact_center', {
    channel: 'Voice, Digital',
    outcome: 'Resolve billing questions',
    instructions: 'Use the billing playbook and confirm every account change.',
  });
  assert.equal(
    reviewEdited.instructions,
    'Use the billing playbook and confirm every account change.',
    'explicit Review instructions should survive proposal regeneration after an earlier step is edited',
  );
});

test('creates a goal-led draft for the direct start-from-scratch path', () => {
  const draft = createBlankAgentDraft(
    '  My support agent  ',
    'contact_center',
    '  Help employees resolve approved access and device issues.  ',
  );

  assert.equal(draft.family, 'contact_center');
  assert.equal(draft.basics.name, 'My support agent');
  assert.equal(draft.basics.purpose, 'Help employees resolve approved access and device issues.');
  assert.equal(draft.basics.description, 'Help employees resolve approved access and device issues.');
  assert.match(draft.instructions.content, /You are My support agent/);
  assert.match(draft.instructions.content, /Help employees resolve approved access and device issues/);
  assert.equal(draft.instructions.applied, true);
  assert.equal(draft.familyConfiguration.profile.progress, 'configured');
  assert.equal(draft.familyConfiguration.instructions.progress, 'configured');
  assert.equal(draft.lifecycle, 'draft');
});

test('builds the Contact Center draft proposal from the verified channel, name, and greeting', () => {
  const proposal = buildStarterProposal('contact_center', {
    channel: 'Both',
    use_case: 'Help customers place and track pizza orders',
    name: 'Pizza Concierge',
    greeting: 'Welcome to Acme Pizza. How can I help with your order?',
  });

  assert.equal(proposal.channel, 'Both');
  assert.equal(proposal.name, 'Pizza Concierge');
  assert.equal(proposal.greeting, 'Welcome to Acme Pizza. How can I help with your order?');
  assert.match(proposal.instructions, /Pizza Concierge/);
  assert.match(proposal.instructions, /place and track pizza orders/i);
  assert.match(proposal.instructions, /Contact Center AI agent/i);

  const voiceAndVideo = buildStarterProposal('contact_center', {
    channel: 'Voice, Video',
    use_case: 'Provide visual troubleshooting and voice support',
    name: 'Visual Support Concierge',
  });
  assert.equal(voiceAndVideo.channel, 'Voice, Video');
  assert.deepEqual(voiceAndVideo.selectedChannels, ['voice', 'video']);
  assert.match(voiceAndVideo.instructions, /voice and video channels/i);
  assert.equal(voiceAndVideo.greetings.video, voiceAndVideo.greeting);
});

test('applies Phone Receptionist preset answers to a new draft without mutating the source', () => {
  const answers = {
    voice_destination: encodeVoiceDestinationAnswer({
      location: 'headquarters',
      phoneNumber: '+1-415-555-0142',
    }),
    outcome: 'Answer common questions and schedule appointments',
    name: 'Front Desk Receptionist',
    greeting: 'Thanks for calling. You are speaking with Front Desk Receptionist. How can I help?',
    knowledge: 'Visitor information',
  };
  const proposal = buildStarterProposal('calling', answers);
  const source = createDraftFromProposal('calling', proposal);
  const applied = applyPresetAnswersToDraft(source, proposal, answers);

  assert.notStrictEqual(applied, source);
  assert.notStrictEqual(applied.familyConfiguration, source.familyConfiguration);
  assert.equal(source.familyConfiguration.voice.progress, 'not_started');
  assert.deepEqual(source.familyConfiguration.voice.values, {});
  assert.equal(source.familyConfiguration.knowledge.progress, 'not_started');
  assert.deepEqual(source.deploymentReferences, []);

  assert.equal(applied.familyConfiguration.voice.progress, 'configured');
  assert.deepEqual(applied.familyConfiguration.voice.values, {
    selectedChannels: ['voice'],
    greetings: { voice: answers.greeting },
    voiceLocation: 'headquarters',
    voicePhoneNumber: '+1-415-555-0142',
  });
  assert.equal(applied.familyConfiguration.knowledge.progress, 'configured');
  assert.deepEqual(applied.familyConfiguration.knowledge.values, {
    selections: ['Visitor information'],
  });
  assert.equal(applied.familyConfiguration.deployment.progress, 'configured');
  assert.deepEqual(applied.familyConfiguration.deployment.values, {
    voiceLocation: 'headquarters',
    voicePhoneNumber: '+1-415-555-0142',
  });
  assert.deepEqual(applied.deploymentReferences, [{
    id: 'calling-phone-number',
    kind: 'phone_number',
    label: '+1-415-555-0142',
    status: 'connected',
  }]);
});

test('persists Customer Service optional skips and actions, and Employee Assistant knowledge', () => {
  const customerAnswers = {
    channel: 'Digital',
    outcome: 'Resolve order questions and route complex requests',
    name: 'Customer Service Agent',
    greeting: 'Hi. How can I help today?',
    knowledge: SKIPPED_INTAKE_ANSWER,
    actions: 'Create ticket',
  };
  const customerProposal = buildStarterProposal('contact_center', customerAnswers);
  const customerSource = createDraftFromProposal('contact_center', customerProposal);
  const customerDraft = applyPresetAnswersToDraft(
    customerSource,
    customerProposal,
    customerAnswers,
  );

  assert.equal(customerSource.familyConfiguration.knowledge.progress, 'not_started');
  assert.equal(customerSource.familyConfiguration.actions.progress, 'not_started');
  assert.equal(customerDraft.familyConfiguration.knowledge.progress, 'skipped');
  assert.deepEqual(customerDraft.familyConfiguration.knowledge.values, { selections: [] });
  assert.equal(customerDraft.familyConfiguration.actions.progress, 'configured');
  assert.deepEqual(customerDraft.familyConfiguration.actions.values, {
    selections: ['Create ticket'],
  });
  assert.deepEqual(customerDraft.familyConfiguration.channels.values, {
    selectedChannels: ['digital'],
    greetings: { digital: customerAnswers.greeting },
  });

  const employeeAnswers = {
    outcome: 'Help employees find approved policies and process guidance',
    name: 'Employee Assistant',
    knowledge: 'Employee handbook',
  };
  const employeeProposal = buildStarterProposal('internal_assistant', employeeAnswers);
  const employeeSource = createDraftFromProposal('internal_assistant', employeeProposal);
  const employeeDraft = applyPresetAnswersToDraft(
    employeeSource,
    employeeProposal,
    employeeAnswers,
  );

  assert.equal(employeeSource.familyConfiguration.knowledge.progress, 'not_started');
  assert.equal(employeeDraft.familyConfiguration.knowledge.progress, 'configured');
  assert.deepEqual(employeeDraft.familyConfiguration.knowledge.values, {
    selections: ['Employee handbook'],
  });
});

test('keeps Knowledge setup actionable from the Contact Center ranked next steps', () => {
  const draft = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      channel: 'Digital',
      use_case: 'Answer product questions from approved support information',
      name: 'Product Support',
      greeting: 'Hi, how can I help with your product today?',
    }),
  );
  const knowledge = getRankedRecommendations(draft)
    .find(recommendation => recommendation.id === 'contact_center:knowledge');

  assert.ok(knowledge, 'Knowledge should remain a ranked next step until it is configured or skipped');
  assert.equal(knowledge.targetSection, 'knowledge');
  assert.equal(knowledge.actionKind, 'open_section');
});

test('routes Contact Center handoff through Actions and removes recommendations resolved by visible sections', () => {
  const draft = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      channel: 'Voice',
      use_case: 'Help customers with orders and transfer exceptions to a specialist',
      name: 'Order Concierge',
      greeting: 'Welcome. How can I help with your order?',
    }),
  );
  draft.familyConfiguration.knowledge.progress = 'skipped';
  draft.familyConfiguration.identity.progress = 'skipped';
  draft.familyConfiguration.security.progress = 'skipped';

  const unresolved = getRankedRecommendations(draft);
  assert.equal(
    unresolved.find(item => item.id === 'contact_center:handoff')?.targetSection,
    'actions',
  );
  assert.equal(
    unresolved.find(item => item.id === 'contact_center:actions')?.title,
    'Connect actions',
  );

  draft.familyConfiguration.actions.progress = 'configured';
  draft.familyConfiguration.security.progress = 'configured';
  draft.familyConfiguration.identity.progress = 'not_started';
  const afterVisibleSectionsAreConfigured = getRankedRecommendations(draft);
  assert.equal(
    afterVisibleSectionsAreConfigured.some(item => item.id === 'contact_center:handoff'),
    false,
  );
  assert.equal(
    afterVisibleSectionsAreConfigured.some(item => item.id === 'contact_center:identity'),
    false,
  );
});

test('filters resolved stale recommendations without reranking the remaining cards', () => {
  const draft = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      channel: 'Digital',
      use_case: 'Answer product questions and update customer orders',
      name: 'Product Support',
      greeting: 'Hi. How can I help today?',
    }),
  );
  const stored = getRankedRecommendations(draft);
  draft.recommendations = stored;
  draft.recommendationsStale = true;

  const resolvedId = stored[0].id;
  const capabilityId = resolvedId.split(':').at(-1);
  draft.familyConfiguration[capabilityId].progress = 'configured';

  const visible = getActionableStoredRecommendations(draft);
  assert.equal(visible.some(item => item.id === resolvedId), false);
  assert.deepEqual(
    visible.map(item => item.id),
    stored.slice(1).map(item => item.id),
  );
  assert.equal(draft.recommendationsStale, true);
});

test('derives progress indicators from persisted capability state, not navigation order', () => {
  assert.equal(getCapabilityTrackerStatus('configured'), 'done');
  assert.equal(getCapabilityTrackerStatus('skipped'), 'skipped');
  assert.equal(getCapabilityTrackerStatus('not_started'), 'queued');
  assert.equal(getCapabilityTrackerStatus('not_started', true), 'active');
  assert.equal(getCapabilityTrackerStatus('in_progress'), 'active');
  assert.equal(getCapabilityTrackerStatus('blocked'), 'blocked');
  assert.equal(getCapabilityTrackerStatus(undefined), 'queued');
});

test('creates a publishable minimum Calling draft with contextual recommendations', () => {
  const proposal = buildStarterProposal('calling', {
    purpose: 'Answer product questions for store callers',
    name: 'Store Receptionist',
  });
  const draft = createDraftFromProposal('calling', proposal, [
    { id: 'message-1', role: 'user', text: 'Create a store receptionist', createdAt: '2026-07-22T00:00:00.000Z' },
  ]);

  assert.equal(draft.lifecycle, 'draft');
  assert.equal(draft.version, 1);
  assert.equal(draft.familyConfiguration.profile.progress, 'configured');
  assert.equal(draft.familyConfiguration.instructions.progress, 'configured');
  assert.equal(draft.familyConfiguration.actions.progress, 'blocked');
  assert.equal(draft.chatHistory.length, 1);
  assert.equal(isMinimumPublishable(draft), true);
  assert.ok(draft.recommendations.length > 0);
  assert.ok(draft.recommendations.length <= 3);
  assert.equal(new Set(draft.recommendations.map(item => item.id)).size, draft.recommendations.length);
});

test('allows Contact Center publishing with only the shared minimum profile', () => {
  const draft = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      purpose: 'Resolve order status and return questions',
      name: 'Order Concierge',
    }),
  );

  assert.equal(isMinimumPublishable(draft), true);
  for (const id of ['channels', 'knowledge', 'actions', 'security', 'testing']) {
    assert.equal(draft.familyConfiguration[id].progress, 'not_started');
  }
  draft.language.defaultLanguage = '';
  assert.equal(isMinimumPublishable(draft), false);
  assert.match(getMinimumPublishIssues(draft).join(' '), /default language/i);
});

test('blocks publishing when the selected family is unavailable', () => {
  const draft = createDraftFromProposal(
    'internal_assistant',
    buildStarterProposal('internal_assistant', {
      purpose: 'Help employees troubleshoot VPN access',
      name: 'IT Helper',
    }),
  );
  draft.entitlement = 'unavailable';

  assert.equal(isMinimumPublishable(draft), false);
  assert.match(getMinimumPublishIssues(draft)[0], /not licensed/i);
  assert.equal(getRankedRecommendations(draft)[0].actionKind, 'review_entitlement');
});

test('ranks at most three recommendations and honors dismissed recommendation ids', () => {
  const draft = createDraftFromProposal(
    'internal_assistant',
    buildStarterProposal('internal_assistant', {
      purpose: 'Help employees find policies, create tickets, and handle sensitive HR requests',
      name: 'Employee Help Desk',
    }),
  );
  const ranked = getRankedRecommendations(draft);
  assert.equal(ranked.length, 3);
  assert.deepEqual(ranked, getRankedRecommendations(draft));

  draft.dismissedRecommendationIds = [ranked[0].id];
  const afterDismissal = getRankedRecommendations(draft);
  assert.ok(afterDismissal.length <= 3);
  assert.equal(afterDismissal.some(item => item.id === ranked[0].id), false);
});

test('filters a frozen recommendation journey without backfilling configured or dismissed work', () => {
  const draft = createDraftFromProposal(
    'internal_assistant',
    buildStarterProposal('internal_assistant', {
      mode: 'Employee Help',
      audience: 'Tiger team',
      outcome: 'Find approved HR policy and employee account information',
    }),
  );
  draft.familyConfiguration.audience.progress = 'configured';
  draft.familyConfiguration.placement.progress = 'configured';

  const journey = getRankedRecommendations(draft);
  assert.deepEqual(journey.map(item => item.id), [
    'internal_assistant:security',
    'internal_assistant:knowledge',
    'internal_assistant:actions',
  ]);

  draft.familyConfiguration.security.progress = 'configured';
  assert.deepEqual(
    getActionableStoredRecommendations(draft, journey).map(item => item.id),
    ['internal_assistant:knowledge', 'internal_assistant:actions'],
  );

  draft.dismissedRecommendationIds.push('internal_assistant:knowledge');
  assert.deepEqual(
    getActionableStoredRecommendations(draft, journey).map(item => item.id),
    ['internal_assistant:actions'],
  );

  draft.dismissedRecommendationIds.push('internal_assistant:actions');
  assert.deepEqual(getActionableStoredRecommendations(draft, journey), []);

  assert.deepEqual(
    getRankedRecommendations(draft).map(item => item.id),
    ['internal_assistant:testing'],
  );
});

test('keeps unresolved capabilities actionable without presenting blocked work as complete', () => {
  const draft = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      use_case: 'Answer order questions and update delivery details',
      name: 'Order Support',
    }),
  );

  assert.equal(draft.familyConfiguration.knowledge.progress, 'not_started');
  assert.equal(getRankedRecommendations(draft).some(item => item.id.endsWith(':knowledge')), true);

  draft.familyConfiguration.knowledge.progress = 'blocked';
  assert.equal(getCapabilityTrackerStatus(draft.familyConfiguration.knowledge.progress), 'blocked');
  assert.equal(getRankedRecommendations(draft).some(item => item.id.endsWith(':knowledge')), false);

  draft.familyConfiguration.knowledge.progress = 'configured';
  assert.equal(getCapabilityTrackerStatus(draft.familyConfiguration.knowledge.progress), 'done');
  assert.equal(getRankedRecommendations(draft).some(item => item.id.endsWith(':knowledge')), false);
});

test('seeds each internal assistant starter mode with the correct boundaries', () => {
  const employeeHelp = buildStarterProposal('internal_assistant', {
    mode: 'Employee Help',
    audience: 'Store managers',
    outcome: 'Find approved HR and IT answers',
  });
  assert.equal(employeeHelp.name, 'Employee Help Assistant');
  assert.match(employeeHelp.instructions, /permission-appropriate/i);

  const agentAssist = buildStarterProposal('internal_assistant', {
    mode: 'Contact Center Agent Assist',
    audience: 'Support agents',
    outcome: 'Find approved answers during conversations',
  });
  assert.match(agentAssist.instructions, /Never send or execute anything/i);

  const companion = buildStarterProposal('internal_assistant', {
    mode: 'Meeting and Calling Companion',
    audience: 'All employees',
    outcome: 'Prepare and follow up on calls',
  });
  assert.match(companion.instructions, /without implying/i);
});

test('does not recommend deployment until a configuration version is published', () => {
  const draft = createDraftFromProposal(
    'calling',
    buildStarterProposal('calling', {
      outcome: 'Answer common business questions',
      tasks: 'share hours and route unsupported requests',
    }),
  );

  assert.equal(getRankedRecommendations(draft).some(item => item.id.endsWith(':deployment')), false);
  draft.familyConfiguration.knowledge.progress = 'skipped';
  draft.familyConfiguration.handoff.progress = 'configured';
  draft.familyConfiguration.testing.progress = 'configured';
  draft.previewState.status = 'passed';
  draft.lifecycle = 'published';
  assert.equal(getRankedRecommendations(draft).some(item => item.id.endsWith(':deployment')), true);
});

test('targets family-aware workspace sections and tracks recommendation source changes', () => {
  const calling = createDraftFromProposal(
    'calling',
    buildStarterProposal('calling', {
      outcome: 'Answer common business questions',
      tasks: 'share hours and route unsupported requests',
    }),
  );
  const callingRecommendations = getRankedRecommendations(calling);
  assert.equal(
    callingRecommendations.find(item => item.title === 'Try a voice preview')?.targetSection,
    'preview',
  );

  const internal = createDraftFromProposal(
    'internal_assistant',
    buildStarterProposal('internal_assistant', {
      mode: 'Employee Help',
      audience: 'All employees',
      outcome: 'Find sensitive HR policy and employee account information',
    }),
  );
  assert.equal(
    getRankedRecommendations(internal).find(item => item.title === 'Review access and data controls')?.targetSection,
    'audit',
  );

  const revision = getRecommendationSourceRevision(internal);
  internal.basics.purpose = 'Help employees prepare for meetings';
  assert.notEqual(getRecommendationSourceRevision(internal), revision);
});

test('duplicates shared configuration while resetting incompatible target state', () => {
  const source = createDraftFromProposal(
    'contact_center',
    buildStarterProposal('contact_center', {
      purpose: 'Resolve customer support requests and create tickets',
      name: 'Support Concierge',
    }),
    [{ id: 'message-1', role: 'user', text: 'Build this agent', createdAt: '2026-07-22T00:00:00.000Z' }],
  );
  source.lifecycle = 'live';
  source.previewState = { status: 'passed', lastRunAt: '2026-07-22T00:00:00.000Z' };
  source.deploymentReferences = [
    { id: 'channel-1', kind: 'contact_center_channel', label: 'Customer chat', status: 'connected' },
  ];
  source.familyConfiguration.knowledge.progress = 'configured';
  source.familyConfiguration.knowledge.values = { selections: ['Support articles'] };
  source.familyConfiguration.actions.progress = 'configured';
  source.familyConfiguration.actions.values = { selections: ['Create ticket'] };

  const duplicate = duplicateDraftAs(source, 'internal_assistant');

  assert.notEqual(duplicate.id, source.id);
  assert.equal(duplicate.family, 'internal_assistant');
  assert.equal(duplicate.basics.name, 'Support Concierge copy');
  assert.equal(duplicate.instructions.content, source.instructions.content);
  assert.deepEqual(duplicate.familyConfiguration.knowledge.values, {});
  assert.equal(duplicate.familyConfiguration.knowledge.progress, 'not_started');
  assert.equal(duplicate.familyConfiguration.actions.progress, 'not_started');
  assert.deepEqual(duplicate.familyConfiguration.actions.values, {});
  assert.equal(duplicate.lifecycle, 'draft');
  assert.equal(duplicate.previewState.status, 'not_started');
  assert.deepEqual(duplicate.deploymentReferences, []);
  assert.deepEqual(duplicate.chatHistory, []);
});
