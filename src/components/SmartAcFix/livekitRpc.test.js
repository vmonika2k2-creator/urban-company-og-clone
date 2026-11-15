import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import RecommendationCard from './RecommendationCard.js';
import { registerVaayuRpcMethods } from './livekitRpc.js';
import { requestLiveKitToken } from './livekitClient.js';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const { initialSmartAcState, smartAcReducer } = await vite.ssrLoadModule('/src/components/SmartAcFix/context/SmartAcContext.jsx');
after(() => vite.close());

function createRpcHarness() {
  const handlers = new Map();
  const localParticipant = {
    registerRpcMethod: (method, handler) => handlers.set(method, handler),
    unregisterRpcMethod: (method) => handlers.delete(method),
  };
  let scene = initialSmartAcState;
  let recommendation = null;
  let language = 'en';
  let inspecting = false;
  const unregister = registerVaayuRpcMethods(localParticipant, {
    dispatch: (action) => { scene = smartAcReducer(scene, action); },
    getState: () => scene,
    setRecommendation: (value) => { recommendation = value; },
    setLanguage: (value) => { language = value; },
    setInspecting: (value) => { inspecting = Boolean(value); },
  });
  return { handlers, localParticipant, unregister, get scene() { return scene; }, get recommendation() { return recommendation; }, get language() { return language; }, get inspecting() { return inspecting; } };
}

test('update_visual_scene changes the whitelisted room state and replies ok', async () => {
  const harness = createRpcHarness();
  const result = await harness.handlers.get('update_visual_scene')({ payload: JSON.stringify({ environment: 'office', ac_status: 'off', issue: 'noise' }) });
  assert.equal(result, 'ok');
  assert.equal(harness.scene.env, 'office');
  assert.equal(harness.scene.acStatus, 'off');
  assert.equal(harness.scene.power, false);
  assert.equal(harness.scene.issue, 'noise');
});

test('invalid environment is ignored while valid scene fields still apply', async () => {
  const harness = createRpcHarness();
  await harness.handlers.get('update_visual_scene')({ payload: JSON.stringify({ environment: 'desert', ac_status: 'off', issue: 'dust' }) });
  assert.equal(harness.scene.env, 'home');
  assert.equal(harness.scene.acStatus, 'off');
  assert.equal(harness.scene.issue, 'dust');
  assert.equal(harness.scene.feel, 'hot');
  assert.equal(harness.scene.temp, 32);
});

test('antarctica sets cold room feeling and hidden ac sets relocation', async () => {
  const harness = createRpcHarness();
  await harness.handlers.get('update_visual_scene')({ payload: JSON.stringify({ environment: 'antarctica', ac_status: 'hidden', issue: 'none' }) });
  assert.equal(harness.scene.env, 'home');
  assert.equal(harness.scene.feel, 'cold');
  assert.equal(harness.scene.temp, 16);
  assert.equal(harness.scene.acStatus, 'hidden');
  assert.equal(harness.scene.reloc, true);
});

test('show_recommendation renders the supplied card and Indian-grouped total', async () => {
  const harness = createRpcHarness();
  assert.equal(harness.inspecting, false);
  await harness.handlers.get('inspection_start')({ payload: JSON.stringify({ steps: 3 }) });
  assert.equal(harness.inspecting, true);
  const result = await harness.handlers.get('show_recommendation')({ payload: JSON.stringify({ title: 'Foam-Jet service + leakage inspection', estimated_cost: 1198, why_best: 'This covers both AC issues and includes a free Co-Pilot gas check.', action_label: 'See service details' }) });
  assert.equal(result, 'ok');
  assert.equal(harness.inspecting, false);
  const markup = renderToStaticMarkup(RecommendationCard({ recommendation: harness.recommendation }));
  assert.match(markup, /Foam-Jet service \+ leakage inspection/);
  assert.match(markup, /₹1,198/);
  assert.match(markup, /free Co-Pilot gas check/);
  assert.match(markup, /See service details/);
});

test('set_language highlights only one of the six supported language tabs', async () => {
  const harness = createRpcHarness();
  const result = await harness.handlers.get('set_language')({ payload: JSON.stringify({ language: 'kn' }) });
  assert.equal(result, 'ok');
  assert.equal(harness.language, 'kn');
  await harness.handlers.get('set_language')({ payload: JSON.stringify({ language: 'fr' }) });
  assert.equal(harness.language, 'kn');
});

test('RPC registration can be cleaned up on disconnect', () => {
  const harness = createRpcHarness();
  harness.unregister();
  assert.equal(harness.handlers.size, 0);
});

test('token fetch failure returns a UI-safe error when the token server is down', async () => {
  await assert.rejects(
    requestLiveKitToken(async () => { throw new TypeError('Failed to fetch'); }),
    /Cannot reach the voice token server/,
  );
});
