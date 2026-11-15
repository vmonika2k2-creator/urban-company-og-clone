import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalysis, symptomsFromText, symptomsFromControls, describeControls, rankServices } from './analysis.js';

test('typed: warm air and a rattle suggests cooling repair plus noise', () => {
  const a = buildAnalysis({ source: 'text', text: 'my AC is blowing warm air and making a rattling sound', brand: 'Voltas' });
  assert.ok(a.confirmed.includes('warm'));
  assert.ok(a.confirmed.includes('noise'));
  assert.deepEqual(a.ranked, ['cool', 'noise']);
  assert.equal(a.primary, 'cool');
  assert.equal(a.scenario, 'cooling');
  assert.equal(a.brand, 'Voltas');
  assert.equal(a.fallback, false);
});

test('typed: water dripping is a leak, but a "gas leak" is a gas problem', () => {
  assert.deepEqual(symptomsFromText('water is dripping from the indoor unit').confirmed, ['leak']);
  const gas = symptomsFromText('I think there is a gas leak');
  assert.ok(gas.confirmed.includes('weak'));
  assert.ok(!gas.confirmed.includes('leak'));
});

test('typed: an AC that will not start is a power issue, not a cooling one', () => {
  const a = buildAnalysis({ source: 'text', text: "the AC won't turn on at all" });
  assert.equal(a.primary, 'power');
  assert.equal(a.scenario, 'power');
});

test('typed: dust and weak airflow suggest the foam-jet service', () => {
  const a = buildAnalysis({ source: 'text', text: 'the filter is dirty and the airflow is weak' });
  assert.equal(a.primary, 'clean');
});

test('typed: words we cannot place fall back to a diagnosis visit', () => {
  const a = buildAnalysis({ source: 'text', text: 'something feels off' });
  assert.deepEqual(a.confirmed, []);
  assert.equal(a.fallback, true);
  assert.equal(a.primary, 'cool');
});

test('typed: moving the AC is flagged as relocation, and the AC type is picked up', () => {
  const a = buildAnalysis({ source: 'text', text: 'I want to relocate my window AC' });
  assert.equal(a.relocation, true);
  assert.equal(a.acType, 'Window AC');
});

test('controls: hot room with the AC on means cooling', () => {
  const state = { power: true, acStatus: 'on', feel: 'hot', dust: 0, noise: 0, water: 0, type: 'split', brand: 'LG' };
  const a = buildAnalysis({ source: 'controls', state });
  assert.deepEqual(a.confirmed.sort(), ['on', 'warm']);
  assert.equal(a.primary, 'cool');
  assert.equal(a.acType, 'Split AC');
  assert.equal(a.brand, 'LG');
  assert.match(a.quote, /room feels hot/);
});

test('controls: each slider maps to its own service', () => {
  assert.deepEqual(symptomsFromControls({ power: true, feel: 'ok', dust: 70 }).confirmed, ['dust']);
  assert.deepEqual(symptomsFromControls({ power: true, feel: 'ok', noise: 50 }).confirmed, ['noise']);
  assert.deepEqual(symptomsFromControls({ power: true, feel: 'ok', water: 2 }).confirmed, ['leak']);
  assert.deepEqual(symptomsFromControls({ power: false, acStatus: 'off', feel: 'hot' }).confirmed, ['off']);
  assert.equal(symptomsFromControls({ reloc: true }).relocation, true);
});

test('controls: nothing wrong set means nothing confirmed', () => {
  const a = buildAnalysis({ source: 'controls', state: { power: true, feel: 'ok', dust: 0, noise: 0, water: 0 } });
  assert.deepEqual(a.confirmed, []);
  assert.equal(a.fallback, true);
});

test('voice: combines the scene the assistant set with what was said and recommended', () => {
  const a = buildAnalysis({
    source: 'voice',
    state: { power: true, acStatus: 'on', feel: 'ok', dust: 0, noise: 70, water: 0, type: 'split', brand: 'Daikin' },
    recommendation: { title: 'Noise or Smell Inspection', estimated_cost: 499 },
    transcript: 'there is a rattle when it starts',
  });
  assert.equal(a.primary, 'noise');
  assert.equal(a.quote, 'there is a rattle when it starts');
  assert.equal(a.source, 'voice');
});

test('voice: with no transcript the quote still says something useful', () => {
  const a = buildAnalysis({
    source: 'voice',
    state: { power: true, feel: 'hot', dust: 0, noise: 0, water: 0 },
    recommendation: { title: 'Gas Refill & Check-Up' },
    transcript: '',
  });
  assert.ok(a.quote.length > 0);
  assert.ok(a.ranked.includes('gas'));
});

test('ranking: ties go to the service earlier in the priority list', () => {
  const { ranked, primary } = rankServices(['noise', 'leak']);
  assert.deepEqual(ranked, ['noise', 'leak']);
  assert.equal(primary, 'noise');
});

test('describeControls reads like a sentence', () => {
  assert.equal(describeControls({ power: true, feel: 'hot', noise: 60 }), 'My AC is on, the room feels hot and it is making noise.');
});
