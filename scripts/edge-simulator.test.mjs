import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { createSimulatorServer, SimulatorState } from './edge-simulator.mjs';

const state = new SimulatorState({ monitoredBin: 'plastic', emptyDepthCm: 40 });
const server = createSimulatorServer(state);
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { response, payload: await response.json() };
}

test('models one level sensor while accepting detections for every route', async () => {
  const bins = await json('/api/bins');
  assert.equal(bins.response.status, 200);
  assert.deepEqual(
    bins.payload.bins.map((bin) => [bin.id, bin.sensor_online]),
    [['plastic', true], ['metal', false], ['general', false]],
  );

  for (const category of ['plastic', 'metal', 'general']) {
    const detection = await json('/api/simulator/detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, object: `${category} test`, confidence: 0.9 }),
    });
    assert.equal(detection.response.status, 201);
    assert.equal(detection.payload.event.category, category);
  }

  const events = await json('/api/events?limit=10');
  assert.deepEqual(events.payload.events.map((event) => event.category), ['general', 'metal', 'plastic']);
});

test('drives full-bin and emptied flows through the board-compatible API', async () => {
  const full = await json('/api/simulator/fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'plastic', fill_percent: 95 }),
  });
  assert.equal(full.payload.bin.fill_percent, 95);
  assert.equal(full.payload.bin.distance_cm, 2);

  const unsupported = await json('/api/simulator/fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'metal', fill_percent: 95 }),
  });
  assert.equal(unsupported.response.status, 409);

  const emptied = await json('/api/bins/plastic/emptied', { method: 'POST' });
  assert.equal(emptied.response.status, 200);
  assert.equal(emptied.payload.bin.fill_percent, 0);
  assert.equal(emptied.payload.event.kind, 'maintenance');
});
