import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createSiteSchema, updateSiteSchema } from '../validators/site.validator.js';
import { overviewQuerySchema } from '../validators/analytics.validator.js';

describe('site details', () => {
  test('organisation, state and consumer category default to blank', () => {
    const site = createSiteSchema.parse({ name: 'Plant A' });
    assert.equal(site.organisation, '');
    assert.equal(site.state, '');
    assert.equal(site.consumerCategory, '');
  });

  test('state must come from the list; blank clears it', () => {
    assert.equal(createSiteSchema.parse({ name: 'A', state: 'Maharashtra' }).state, 'Maharashtra');
    assert.equal(updateSiteSchema.parse({ state: '' }).state, '');
    const result = createSiteSchema.safeParse({ name: 'A', state: 'MH' });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path[0], 'state');
  });

  test('free-text details are trimmed', () => {
    const site = createSiteSchema.parse({ name: 'A', organisation: '  SAP Group ', consumerCategory: ' HT Industrial ' });
    assert.equal(site.organisation, 'SAP Group');
    assert.equal(site.consumerCategory, 'HT Industrial');
  });
});

describe('analysis filters', () => {
  test('accepts the site-detail filters and drops blanks', () => {
    const query = overviewQuerySchema.parse({ organisation: 'SAP Group', state: 'Maharashtra', consumerCategory: '' });
    assert.equal(query.organisation, 'SAP Group');
    assert.equal(query.state, 'Maharashtra');
    assert.equal(query.consumerCategory, undefined);
  });

  test('rejects an end month before the start', () => {
    assert.equal(overviewQuerySchema.safeParse({ from: '2026-04', to: '2026-03' }).success, false);
  });
});
