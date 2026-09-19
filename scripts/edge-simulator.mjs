import http from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CATEGORIES = ['plastic', 'metal', 'general'];
const DETECTIONS = {
  plastic: { object: 'PET Bottle', confidence: 0.96 },
  metal: { object: 'Aluminum Can', confidence: 0.94 },
  general: { object: 'Snack Wrapper', confidence: 0.91 },
};

function now() {
  return new Date().toISOString();
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function categoryName(category) {
  return `${category[0].toUpperCase()}${category.slice(1)} Bin`;
}

export class SimulatorState {
  constructor({ monitoredBin = 'plastic', emptyDepthCm = 40 } = {}) {
    if (!CATEGORIES.includes(monitoredBin)) {
      throw new Error(`Unknown monitored bin: ${monitoredBin}`);
    }
    if (!Number.isFinite(emptyDepthCm) || emptyDepthCm <= 0) {
      throw new Error('emptyDepthCm must be a positive number.');
    }
    this.monitoredBin = monitoredBin;
    this.emptyDepthCm = emptyDepthCm;
    this.startedAt = Date.now();
    this.eventSequence = 0;
    this.reset();
  }

  reset() {
    const timestamp = now();
    this.sensorError = null;
    this.events = [];
    this.bins = new Map(
      CATEGORIES.map((category) => [
        category,
        {
          id: category,
          category,
          name: categoryName(category),
          distance_cm: this.emptyDepthCm,
          empty_depth_cm: this.emptyDepthCm,
          fill_percent: 0,
          sensor_online: category === this.monitoredBin,
          last_updated: timestamp,
          last_emptied: timestamp,
          item_count_today: 0,
        },
      ]),
    );
    this.setFill(this.monitoredBin, 20);
  }

  statusPayload() {
    return {
      device: 'EcoSort laptop simulator',
      online: true,
      simulator: true,
      timestamp: now(),
      uptime_seconds: Math.round((Date.now() - this.startedAt) / 100) / 10,
      monitored_bin: this.monitoredBin,
      depth_sensor_online: this.bins.get(this.monitoredBin).sensor_online,
      sensor_error: this.sensorError,
    };
  }

  binsPayload() {
    return { bins: CATEGORIES.map((category) => ({ ...this.bins.get(category) })) };
  }

  eventsPayload(limit = 50, since = null) {
    const boundedLimit = clamp(Math.trunc(limit) || 50, 1, 100);
    const events = since
      ? this.events.filter((event) => event.timestamp > since)
      : this.events;
    return { events: events.slice(0, boundedLimit).map((event) => ({ ...event })) };
  }

  setFill(category, fillPercent) {
    this.requireCategory(category);
    if (category !== this.monitoredBin) {
      throw new SimulatorError(
        409,
        `${categoryName(category)} has no level sensor in this one-sensor MVP.`,
      );
    }
    const numericFill = Number(fillPercent);
    if (!Number.isFinite(numericFill) || numericFill < 0 || numericFill > 100) {
      throw new SimulatorError(400, 'fill_percent must be between 0 and 100.');
    }

    const bin = this.bins.get(category);
    const fill = Math.round(numericFill);
    bin.fill_percent = fill;
    bin.distance_cm = Math.round(this.emptyDepthCm * (1 - fill / 100) * 10) / 10;
    bin.sensor_online = true;
    bin.last_updated = now();
    this.sensorError = null;
    return { ...bin };
  }

  setSensorOnline(online) {
    if (typeof online !== 'boolean') {
      throw new SimulatorError(400, 'online must be true or false.');
    }
    const bin = this.bins.get(this.monitoredBin);
    bin.sensor_online = online;
    bin.last_updated = now();
    this.sensorError = online ? null : 'simulated depth sensor disconnect';
    return { ...bin };
  }

  recordDetection({ category, object, confidence }) {
    this.requireCategory(category);
    const numericConfidence = Number(confidence);
    if (!Number.isFinite(numericConfidence) || numericConfidence < 0 || numericConfidence > 1) {
      throw new SimulatorError(400, 'confidence must be between 0 and 1.');
    }
    const detectedObject = String(object ?? '').trim();
    if (!detectedObject) {
      throw new SimulatorError(400, 'object is required.');
    }

    const event = {
      id: this.nextEventId(),
      object: detectedObject,
      category,
      confidence: Math.round(numericConfidence * 1_000_000) / 1_000_000,
      timestamp: now(),
    };
    this.events.unshift(event);
    this.events = this.events.slice(0, 100);
    this.bins.get(category).item_count_today += 1;
    return { ...event };
  }

  markEmptied(category) {
    this.requireCategory(category);
    const timestamp = now();
    const bin = this.bins.get(category);
    bin.distance_cm = bin.empty_depth_cm;
    bin.fill_percent = 0;
    bin.last_updated = timestamp;
    bin.last_emptied = timestamp;

    const event = {
      id: this.nextEventId(),
      object: 'Bin emptied by staff',
      category,
      timestamp,
      kind: 'maintenance',
    };
    this.events.unshift(event);
    this.events = this.events.slice(0, 100);
    return { bin: { ...bin }, event: { ...event } };
  }

  nextEventId() {
    this.eventSequence += 1;
    return `sim-${Date.now()}-${this.eventSequence}`;
  }

  requireCategory(category) {
    if (!CATEGORIES.includes(category)) {
      throw new SimulatorError(404, `Unknown bin category: ${String(category)}`);
    }
  }
}

class SimulatorError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(body);
}

function sendHtml(response, body) {
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/html; charset=utf-8',
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new SimulatorError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new SimulatorError(400, 'Request body must be valid JSON.');
  }
}

export function createSimulatorServer(state = new SimulatorState()) {
  return http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      });
      response.end();
      return;
    }

    const url = new URL(request.url ?? '/', 'http://localhost');
    try {
      if (request.method === 'GET' && url.pathname === '/') {
        sendHtml(response, controlPanelHtml());
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/status') {
        sendJson(response, 200, state.statusPayload());
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/bins') {
        sendJson(response, 200, state.binsPayload());
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/events') {
        sendJson(
          response,
          200,
          state.eventsPayload(Number(url.searchParams.get('limit') ?? 50), url.searchParams.get('since')),
        );
        return;
      }

      const emptiedMatch = url.pathname.match(/^\/api\/bins\/(plastic|metal|general)\/emptied$/);
      if (request.method === 'POST' && emptiedMatch) {
        sendJson(response, 200, state.markEmptied(emptiedMatch[1]));
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/simulator/fill') {
        const body = await readJson(request);
        sendJson(response, 200, { bin: state.setFill(body.category, body.fill_percent) });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/simulator/detection') {
        const body = await readJson(request);
        sendJson(response, 201, { event: state.recordDetection(body) });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/simulator/sensor') {
        const body = await readJson(request);
        sendJson(response, 200, { bin: state.setSensorOnline(body.online) });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/simulator/reset') {
        state.reset();
        sendJson(response, 200, { ...state.statusPayload(), ...state.binsPayload() });
        return;
      }

      sendJson(response, 404, { error: 'not found' });
    } catch (error) {
      const status = error instanceof SimulatorError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Unexpected simulator error.';
      sendJson(response, status, { error: message });
    }
  });
}

function controlPanelHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>EcoSort Edge Simulator</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background:#07170f; color:#edf7f0; }
    * { box-sizing:border-box; } body { margin:0; padding:24px; }
    main { width:min(900px,100%); margin:auto; }
    h1 { margin:0; font-size:28px; } h2 { margin:0 0 12px; font-size:16px; }
    .sub { color:#9eb5a6; margin:6px 0 24px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px; }
    .card { padding:18px; border:1px solid #274735; border-radius:18px; background:#10271b; }
    .bin { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 0; border-bottom:1px solid #294436; }
    .bin:last-child { border:0; } .fill { font-size:22px; font-weight:850; }
    .muted { color:#91a99a; font-size:12px; } .online { color:#9bef6b; } .offline { color:#f39a9d; }
    .buttons { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
    button { border:1px solid #3c684d; border-radius:10px; background:#1b3a28; color:#edf7f0; padding:9px 12px; font-weight:750; cursor:pointer; }
    button:hover { background:#285239; } button.danger { border-color:#87464a; background:#4a2427; }
    button.primary { color:#112318; background:#a7f36b; border-color:#a7f36b; }
    #message { min-height:20px; margin:14px 0; color:#a7f36b; font-size:13px; }
    .event { padding:9px 0; border-bottom:1px solid #294436; font-size:13px; }
    code { color:#b9e99c; } footer { margin-top:18px; color:#718a7b; font-size:11px; }
  </style>
</head>
<body><main>
  <h1>EcoSort Edge Simulator</h1>
  <p class="sub">Laptop replacement for the FRDM-i.MX93 API · one level sensor, three AI routes</p>
  <div class="grid">
    <section class="card"><h2>Live bins</h2><div id="bins">Loading…</div></section>
    <section class="card"><h2>Monitored-bin level</h2><div class="buttons">
      ${[20, 50, 80, 95].map((level) => `<button onclick="setFill(${level})">${level}%</button>`).join('')}
    </div><div class="buttons"><button onclick="sensor(true)">Sensor online</button><button class="danger" onclick="sensor(false)">Sensor offline</button></div></section>
    <section class="card"><h2>AI detections</h2><div class="buttons">
      ${CATEGORIES.map((category) => `<button onclick="detect('${category}')">${DETECTIONS[category].object}</button>`).join('')}
    </div><p class="muted">Detections work for every route even when that bin has no level sensor.</p></section>
    <section class="card"><h2>Scenario</h2><div class="buttons"><button class="primary" onclick="fullScenario()">Run full-bin scenario</button><button onclick="resetAll()">Reset</button></div><p class="muted">The scenario sends a plastic detection, then raises the monitored bin to 95%.</p></section>
  </div>
  <div id="message"></div>
  <section class="card"><h2>Recent API events</h2><div id="events" class="muted">No events yet.</div></section>
  <footer>Keep this window open. Point <code>EXPO_PUBLIC_EDGE_URL</code> at this computer's LAN address and port 8080.</footer>
</main>
<script>
  let monitoredBin = 'plastic';
  const samples = ${JSON.stringify(DETECTIONS)};
  async function request(path, body) {
    const response = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body ?? {}) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || ('HTTP ' + response.status));
    return payload;
  }
  async function refresh() {
    try {
      const [status, bins, events] = await Promise.all([
        fetch('/api/status').then(r => r.json()), fetch('/api/bins').then(r => r.json()), fetch('/api/events?limit=8').then(r => r.json())
      ]);
      monitoredBin = status.monitored_bin;
      document.getElementById('bins').innerHTML = bins.bins.map(bin =>
        '<div class="bin"><div><strong>' + bin.name + '</strong><div class="muted">' +
        (bin.id === monitoredBin ? 'GY-530 monitored' : 'Level sensor not installed') +
        '</div></div><div><div class="fill">' + bin.fill_percent + '%</div><div class="' +
        (bin.sensor_online ? 'online' : 'offline') + '">' + (bin.sensor_online ? 'online' : (bin.id === monitoredBin ? 'offline' : 'not installed')) + '</div></div></div>'
      ).join('');
      document.getElementById('events').innerHTML = events.events.length ? events.events.map(event =>
        '<div class="event"><strong>' + event.object + '</strong> → ' + event.category + '<div class="muted">' + new Date(event.timestamp).toLocaleTimeString() + '</div></div>'
      ).join('') : 'No events yet.';
    } catch (error) { show(error.message, true); }
  }
  async function act(action, success) { try { await action(); show(success); await refresh(); } catch (error) { show(error.message, true); } }
  function show(message, error=false) { const el=document.getElementById('message'); el.textContent=message; el.style.color=error?'#ff8b90':'#a7f36b'; }
  function setFill(fill) { return act(() => request('/api/simulator/fill',{category:monitoredBin,fill_percent:fill}), monitoredBin + ' set to ' + fill + '%'); }
  function sensor(online) { return act(() => request('/api/simulator/sensor',{online}), 'Level sensor set ' + (online?'online':'offline')); }
  function detect(category) { const item=samples[category]; return act(() => request('/api/simulator/detection',{category,object:item.object,confidence:item.confidence}), item.object + ' detected'); }
  function resetAll() { return act(() => request('/api/simulator/reset'), 'Simulator reset'); }
  async function fullScenario() { await detect('plastic'); setTimeout(() => setFill(95), 700); }
  refresh(); setInterval(refresh, 1000);
</script></body></html>`;
}

function parseArgs(argv) {
  const config = { host: '0.0.0.0', port: 8080, monitoredBin: 'plastic', emptyDepthCm: 40 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === '--host') config.host = value;
    else if (argument === '--port') config.port = Number(value);
    else if (argument === '--sensor-bin') config.monitoredBin = value;
    else if (argument === '--empty-depth-cm') config.emptyDepthCm = Number(value);
    else if (argument === '--help' || argument === '-h') config.help = true;
    else throw new Error(`Unknown option: ${argument}`);
    if (!['--help', '-h'].includes(argument)) index += 1;
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('--port must be an integer between 1 and 65535.');
  }
  return config;
}

function lanAddresses(port) {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) addresses.push(`http://${entry.address}:${port}`);
    }
  }
  return addresses;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) {
    console.log('Usage: npm run simulator -- [--port 8080] [--sensor-bin plastic|metal|general] [--empty-depth-cm 40]');
    return;
  }
  const state = new SimulatorState(config);
  const server = createSimulatorServer(state);
  server.listen(config.port, config.host, () => {
    console.log(`EcoSort simulator control panel: http://localhost:${config.port}`);
    for (const address of lanAddresses(config.port)) console.log(`Phone API URL: ${address}`);
    console.log(`Level sensor: ${config.monitoredBin} bin; AI detection: all three routes`);
    console.log('Press Ctrl+C to stop.');
  });
  const stop = () => server.close(() => process.exit(0));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
