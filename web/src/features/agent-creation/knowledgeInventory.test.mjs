import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterReadyCollections,
  listReadyCollections,
} from '../../services/knowledgeService.ts';

test('ready knowledge collections require at least one processed source', () => {
  const collections = [
    { id: 'ready', name: 'Ready' },
    { id: 'syncing', name: 'Syncing' },
    { id: 'failed', name: 'Failed' },
    { id: 'empty', name: 'Empty' },
  ];
  const sources = [
    { collectionId: 'ready', status: 'processed' },
    { collectionId: 'ready', status: 'has_issues' },
    { collectionId: 'syncing', status: 'syncing' },
    { collectionId: 'failed', status: 'failed' },
  ];

  assert.deepEqual(
    filterReadyCollections(collections, sources).map(collection => collection.id),
    ['ready'],
  );
});

test('seed inventory exposes the two knowledge bases that are ready to enable', async () => {
  assert.deepEqual(
    (await listReadyCollections()).map(collection => collection.name),
    ['Customer Support', 'Technical Support'],
  );
});
