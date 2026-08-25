import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_HOME_DEMO_OPTIONS,
  AGENT_HOME_TEMPLATE_FAMILIES,
  AGENT_HOME_TEMPLATE_OPTIONS,
  createDraftFromHomeTemplate,
  getAgentHomePreviewChannelLabel,
  getAgentHomeTemplate,
  getAgentHomeTemplatesForFamily,
} from './agentHomeTemplateCatalog.ts';

test('template catalog has three ordered agent types with a useful set of choices', () => {
  assert.deepEqual(
    AGENT_HOME_TEMPLATE_FAMILIES.map(family => family.label),
    ['Customer service agent', 'Phone receptionist', 'Employee assistant'],
  );

  for (const family of AGENT_HOME_TEMPLATE_FAMILIES) {
    const templates = getAgentHomeTemplatesForFamily(family.id);
    assert.ok(templates.length >= 3, `${family.label} should have at least three templates`);
    assert.equal(templates.every(template => template.family === family.id), true);
  }

  const ids = AGENT_HOME_TEMPLATE_OPTIONS.map(template => template.id);
  assert.equal(new Set(ids).size, ids.length, 'template IDs should be unique');
});

test('every ready-made customer-service row has distinct functional detail content', () => {
  const readyMadeIds = [
    'contact_center:cx-concierge',
    'contact_center:technical-support',
    'contact_center:reservation-scheduler',
    'contact_center:order-management',
    'contact_center:returns-exchanges',
    'contact_center:product-discovery',
    'contact_center:patient-care',
    'contact_center:clinical-intake',
  ];
  const templates = readyMadeIds.map(templateId => {
    const template = getAgentHomeTemplate(templateId);
    assert.ok(template, `${templateId} should resolve to a real template`);
    return template;
  });

  assert.equal(new Set(templates.map(template => template.name)).size, readyMadeIds.length);
  assert.equal(
    new Set(templates.map(template => template.workflow.join('|'))).size,
    readyMadeIds.length,
  );
  assert.equal(
    new Set(templates.map(template => template.proposal.instructions)).size,
    readyMadeIds.length,
  );
});

test('every agent type offers multiple templates in each industry group', () => {
  for (const family of AGENT_HOME_TEMPLATE_FAMILIES) {
    const groups = Map.groupBy(
      getAgentHomeTemplatesForFamily(family.id),
      template => template.industry,
    );

    assert.ok(groups.size >= 3, `${family.label} should offer at least three industry groups`);
    for (const [industry, templates] of groups) {
      assert.ok(templates.length >= 2, `${industry} should offer at least two templates`);
    }
  }

  assert.deepEqual(
    [...Map.groupBy(
      getAgentHomeTemplatesForFamily('internal_assistant'),
      template => template.industry,
    ).keys()],
    ['Control Hub Assistant', 'CX Desktop Assistant', 'Webex Concierge'],
  );
});

test('every reviewed preset is valid for the created agent family', () => {
  for (const template of AGENT_HOME_TEMPLATE_OPTIONS) {
    const draft = createDraftFromHomeTemplate(template.id);
    assert.equal(draft.family, template.family);
    assert.equal(draft.basics.name, template.proposal.name);
    assert.equal(draft.basics.description, template.proposal.description);

    for (const preset of template.presets) {
      const capability = draft.familyConfiguration[preset.capabilityId];
      assert.ok(capability, `${template.id} should support ${preset.capabilityId}`);
      assert.notEqual(capability.progress, 'blocked');
      assert.equal(capability.progress, 'configured');
      assert.deepEqual(capability.values, preset.values);
    }

    const configuredBlockedCapability = Object.values(draft.familyConfiguration).find(
      capability => capability.availability === 'cx_only' && capability.progress === 'configured',
    );
    assert.equal(configuredBlockedCapability, undefined);
  }
});

test('contact-center channel presets match the channel shown in the catalog', () => {
  for (const template of getAgentHomeTemplatesForFamily('contact_center')) {
    const draft = createDraftFromHomeTemplate(template.id);
    const selectedChannels = draft.familyConfiguration.channels.values?.selectedChannels;
    const expected = template.previewChannel === 'both'
      ? ['voice', 'digital']
      : [template.previewChannel];
    assert.deepEqual(selectedChannels, expected);
  }
});

test('voice receptionist omits caller identity from its preset defaults', () => {
  const receptionist = AGENT_HOME_TEMPLATE_OPTIONS.find(
    template => template.id === 'calling:voice-receptionist',
  );

  assert.ok(receptionist);
  assert.equal(
    receptionist.presets.some(preset => preset.capabilityId === 'identity'),
    false,
  );
});

test('employee assistant templates use named prebuilt guardrails', () => {
  const prebuiltGuardrails = new Set([
    'Jailbreak',
    'Misinformation',
    'PII detection',
    'Prompt injection',
    'System prompt extraction',
    'Toxicity',
  ]);

  for (const template of getAgentHomeTemplatesForFamily('internal_assistant')) {
    const security = template.presets.find(preset => preset.capabilityId === 'security');
    assert.equal(security?.label, 'Prebuilt guardrails');
    assert.equal(security?.items.length, 3);
    assert.equal(
      security?.items.every(item => prebuiltGuardrails.has(item)),
      true,
      `${template.id} should only show supported prebuilt guardrails`,
    );
  }
});

test('demo cards remain a deterministic supported subset with explicit channels', () => {
  assert.deepEqual(
    AGENT_HOME_DEMO_OPTIONS.map(template => template.demo.fixture),
    ['retail', 'cx-desktop', 'incident', 'property'],
  );
  assert.deepEqual(
    AGENT_HOME_DEMO_OPTIONS.map(template => getAgentHomePreviewChannelLabel(template.previewChannel)),
    ['Voice', 'Digital', 'Digital', 'Voice + digital'],
  );
  assert.equal(AGENT_HOME_DEMO_OPTIONS.every(template => template.demo.prompts.length === 3), true);
});
