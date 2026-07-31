import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCiscoLiveSeed } from '../../demo/ciscoLiveSeed.ts';
import { createDraftFromProposal } from './agentCreationModel.ts';
import {
  buildAgentOverviewSnapshot,
} from '../agent-overview/agentOverviewSnapshot.ts';
import {
  buildAgentAssistantFallback,
  buildAgentAssistantReply,
  getAgentAssistantConfigurationSections,
  getAllowlistedAgentAssistantAction,
  matchAgentAssistantIntent,
} from '../agent-overview/agentAssistantDemo.ts';

const createAgent = (overrides = {}) => ({
  id: 'property-management-service-agent',
  name: 'Property Management Service Agent',
  initials: 'PM',
  description: 'Handles tenant service requests.',
  gradient: 'linear-gradient(#0051af, #13234f)',
  status: 'Draft',
  statusClass: 'badge-warning',
  sessions: '0',
  successRate: '0%',
  messages: '0',
  avgResponse: '0s',
  meta: 'Handles tenant service requests.',
  knowledgeBases: [],
  lifecycle: 'draft',
  version: 1,
  ...overrides,
});

const createPropertyDraft = () => {
  const draft = createDraftFromProposal('contact_center', {
    name: 'Property Management Service Agent',
    purpose: 'Resolve tenant service requests',
    description: 'Handles identity verification, triage, and scheduling.',
    language: 'English',
    instructions: 'Verify the tenant before creating a service request.',
  });
  draft.id = 'property-management-service-agent';
  draft.lifecycle = 'draft';
  draft.familyConfiguration.knowledge.progress = 'configured';
  draft.familyConfiguration.knowledge.values = {
    selections: ['Tenant service handbook', 'Property access policy'],
  };
  draft.familyConfiguration.actions.progress = 'configured';
  draft.familyConfiguration.actions.values = {
    selections: ['Create maintenance ticket'],
  };
  draft.familyConfiguration.security.progress = 'not_started';
  draft.familyConfiguration.security.values = { selections: [] };
  return draft;
};

test('overview snapshots stay aligned for EAGLE GREEN, Property Management, draft, published, and zero-data fixtures', () => {
  const seed = buildCiscoLiveSeed();
  const eagle = buildAgentOverviewSnapshot({
    agent: seed.agents['golftop-vip-reservations'],
    draft: seed.agentDrafts['golftop-vip-reservations'],
    timeRange: '6h',
  });
  assert.deepEqual(eagle.capabilityCounts, {
    knowledge: 14,
    memory: 3,
    actions: 6,
    guardrails: 6,
  });
  assert.equal(eagle.operational.available, true);
  assert.equal(eagle.guardrailActivity.triggerTotal, 1);
  assert.equal(eagle.operational.recentSessions[0].id, 'SES-GT-1042');

  const propertyDraft = createPropertyDraft();
  const property = buildAgentOverviewSnapshot({
    agent: createAgent(),
    draft: propertyDraft,
    timeRange: '24h',
  });
  assert.deepEqual(property.capabilityCounts, {
    knowledge: 2,
    memory: 0,
    actions: 1,
    guardrails: 0,
  });
  assert.equal(property.signals.find(signal => signal.id === 'knowledge').value, 84);
  assert.equal(property.operational.available, false);
  assert.deepEqual(property.operational.metrics, []);

  const persistedProperty = buildAgentOverviewSnapshot({
    agent: createAgent({
      knowledgeBases: ['Tenant service handbook', 'Property access policy'],
    }),
  });
  assert.deepEqual(persistedProperty.capabilityCounts, {
    knowledge: 2,
    memory: 0,
    actions: 1,
    guardrails: 0,
  });

  propertyDraft.lifecycle = 'published';
  const publishedProperty = buildAgentOverviewSnapshot({
    agent: createAgent({ lifecycle: 'published', status: 'Published' }),
    draft: propertyDraft,
  });
  assert.equal(publishedProperty.operational.available, true);
  assert.equal(publishedProperty.operational.health.score, 95.8);

  const zero = buildAgentOverviewSnapshot({
    agent: createAgent({ id: 'zero-data-agent', name: 'Zero data agent' }),
    fallbackActions: [],
  });
  assert.deepEqual(zero.capabilityCounts, {
    knowledge: 0,
    memory: 0,
    actions: 0,
    guardrails: 0,
  });
  assert.equal(zero.signals.every(signal => signal.value === 0), true);
});

test('designed intents recognize paraphrases and explain knowledge metrics instead of navigating', () => {
  assert.equal(matchAgentAssistantIntent('Walk me through the Overview'), 'explain');
  assert.equal(matchAgentAssistantIntent('What does the knowledge percentage mean?'), 'explain');
  assert.equal(matchAgentAssistantIntent('Where should I start troubleshooting?'), 'troubleshoot');
  assert.equal(matchAgentAssistantIntent('What should I configure next?'), 'configure');
  assert.equal(matchAgentAssistantIntent('How does this agent handle pets?'), null);

  const snapshot = buildAgentOverviewSnapshot({
    agent: createAgent(),
    draft: createPropertyDraft(),
  });
  const reply = buildAgentAssistantReply('explain', snapshot, {
    userText: 'What does the knowledge percentage mean?',
  });
  assert.match(reply.text, /Knowledge referenced signal of 84%/);
  assert.equal(reply.followups.includes('Open Knowledge'), true);
  assert.equal(reply.contextLabel, 'Overview · Past 6 hours');
});

test('troubleshooting uses the designed priority and configuration actions stay allowlisted', () => {
  const seed = buildCiscoLiveSeed();
  const eagle = buildAgentOverviewSnapshot({
    agent: seed.agents['golftop-vip-reservations'],
    draft: seed.agentDrafts['golftop-vip-reservations'],
  });
  const runtimeReply = buildAgentAssistantReply('troubleshoot', eagle);
  assert.match(runtimeReply.text, /Start with session SES-GT-1042/);
  assert.deepEqual(runtimeReply.followups, ['Open Sessions', 'Continue configuring']);

  const property = buildAgentOverviewSnapshot({
    agent: createAgent(),
    draft: createPropertyDraft(),
  });
  const draftReply = buildAgentAssistantReply('troubleshoot', property);
  assert.match(draftReply.text, /Start with Security/);
  assert.match(draftReply.text, /publish or test/);

  const sections = getAgentAssistantConfigurationSections(
    property,
    ['security', 'knowledge', 'actions', 'testing'],
  );
  assert.deepEqual(sections, ['Security', 'Knowledge', 'Action']);
  const configureReply = buildAgentAssistantReply('configure', property, {
    configurationSections: sections,
  });
  assert.deepEqual(configureReply.followups, [
    'Open Security',
    'Open Knowledge',
    'Open Action',
  ]);
  assert.equal(getAllowlistedAgentAssistantAction('Open Security'), 'Security');
  assert.equal(getAllowlistedAgentAssistantAction('Open Billing'), null);
  assert.equal(getAllowlistedAgentAssistantAction('Delete agent'), null);
});

test('model failure fallback keeps the conversation useful without exposing configuration variables', () => {
  const snapshot = buildAgentOverviewSnapshot({
    agent: createAgent(),
    draft: createPropertyDraft(),
  });
  const fallback = buildAgentAssistantFallback(snapshot);
  assert.match(fallback.text, /model is unavailable/);
  assert.match(fallback.text, /lowest visible capability signal/);
  assert.doesNotMatch(fallback.text, /CISCO_AI_AUTH|CISCO_AI_APPKEY/);
  assert.equal(fallback.followups.length, 3);
});
