import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStarterProposal,
  createDraftFromProposal,
} from './agentCreationModel.ts';
import {
  buildAgentDraftOverviewViewModel,
  buildAgentListViewModels,
  familyOptionsExcept,
} from './agentCreationViewModel.ts';

test('presents all families with the approved accessible color system', () => {
  const calling = createDraftFromProposal('calling', buildStarterProposal('calling', {
    purpose: 'Answer common caller questions',
    name: 'Caller Guide',
  }));
  const contactCenter = createDraftFromProposal('contact_center', buildStarterProposal('contact_center', {
    use_case: 'Resolve order questions',
  }));
  const internal = createDraftFromProposal('internal_assistant', buildStarterProposal('internal_assistant', {
    mode: 'Employee Help',
    audience: 'All employees',
    outcome: 'Find approved policy answers',
  }));
  const drafts = Object.fromEntries([calling, contactCenter, internal].map(draft => [draft.id, draft]));
  const agents = Object.fromEntries(Object.values(drafts).map(draft => [draft.id, {
    id: draft.id,
    name: draft.basics.name,
    description: draft.basics.description,
    family: draft.family,
  }]));

  const list = buildAgentListViewModels(agents, drafts);
  const colors = Object.fromEntries(list.map(item => [item.family.key, item.family.color]));
  assert.deepEqual(colors, {
    calling: '#a65f00',
    contact_center: '#087f72',
    internal_assistant: '#1769aa',
  });
  assert.deepEqual(new Set(list.map(item => item.family.label)), new Set([
    'Calling',
    'Contact Center',
    'AI Assistant',
  ]));
});

test('shows a publishable starter overview without implying deployment', () => {
  const draft = createDraftFromProposal('contact_center', buildStarterProposal('contact_center', {
    use_case: 'Resolve account questions',
  }));
  const agents = {
    [draft.id]: {
      id: draft.id,
      name: draft.basics.name,
      description: draft.basics.description,
      family: draft.family,
    },
  };
  const overview = buildAgentDraftOverviewViewModel(draft.id, agents, { [draft.id]: draft });

  assert.ok(overview);
  assert.equal(overview.canPublish, true);
  assert.equal(overview.lifecycle.label, 'Draft');
  assert.equal(overview.minimumRequirements.every(requirement => requirement.complete), true);
  assert.ok(overview.recommendations.length <= 3);
  assert.equal(overview.recommendations.every(item => item.requirement === 'Recommended'), true);
  assert.equal(overview.recommendationsStale, false);

  draft.recommendationsStale = true;
  const stale = buildAgentDraftOverviewViewModel(draft.id, agents, { [draft.id]: draft });
  assert.equal(stale.recommendationsStale, true);

  draft.lifecycle = 'published';
  const published = buildAgentDraftOverviewViewModel(draft.id, agents, { [draft.id]: draft });
  assert.equal(published.lifecycle.label, 'Published version');
  assert.match(published.versionLabel, /Published version/);
});

test('offers only the other families for Duplicate as', () => {
  assert.deepEqual(
    familyOptionsExcept('calling').map(option => option.key),
    ['contact_center', 'internal_assistant'],
  );
});

test('never infers an entitlement family from legacy agent copy', () => {
  const agents = {
    legacy: {
      id: 'legacy',
      name: 'Customer voice helper',
      description: 'Answers calls for the service team',
    },
  };

  assert.deepEqual(buildAgentListViewModels(agents, {}), []);
  assert.equal(buildAgentDraftOverviewViewModel('legacy', agents, {}), null);
});
