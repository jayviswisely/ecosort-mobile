# EcoSort

EcoSort is a hackathon-ready facility-management companion for an NXP FRDM-i.MX93 smart recycling station. The physical station classifies waste at the edge, opens the correct lid through a PCA9685/SG90 servo setup, and reports bin depth readings. The mobile app turns those readings into clear fill levels, alerts, and collection actions for cleaning staff.

The app is completely demoable without hardware. It starts with the NCKU Dormitory A station and three bins: Plastic (82%), Metal (41%), and General (63%).

## Features

- Polished dashboard with animated fill indicators and live-style hardware status
- Plastic, metal, and general bin detail screens
- Automatic Normal, Almost Full, Full, and Sensor Offline states
- Full-bin staff alarm with a repeating two-tone paging sound, native
  haptics/vibration, response instructions, and acknowledgement
- Threshold alerts with acknowledgement support
- “Mark as Emptied” workflow that resets the selected bin to 3%
- Simulated AI disposal events with classification confidence
- Presentation-friendly Demo Controls for fill level, sensor state, and item detection
- Local persistence with Zustand and AsyncStorage
- Replaceable edge-device data source abstraction

## Run the app

Requirements: Node.js 22.13 or newer (required by Expo SDK 57).

```bash
npm install
npx expo start
```

From the Expo terminal, scan the QR code with Expo Go or press `a`, `i`, or `w` for Android, iOS, or web.

Useful checks:

```bash
npm run typecheck
npm run check
```

## Demo flow

1. Open the Dashboard and point out the three live fill readings.
2. Tap **Demo** in the top-right.
3. Set a bin to 80% to create an **Almost Full** alert.
4. Set it to 95% to create a **Full** alert.
5. Simulate a PET Bottle or Aluminum Can and show the detection banner and activity log.
6. Open a bin card, review its sensor data, and tap **Mark as Emptied**.
7. Use **Reset Demo** to restore the starting state.

## Architecture

```text
app/
  _layout.tsx              App startup, persistence hydration, root stack
  (tabs)/
    _layout.tsx            Dashboard / Alerts bottom tabs
    index.tsx              Dashboard
    alerts.tsx             Alert inbox
  bin/
    [id].tsx               Dynamic bin detail route

src/
  components/              Reusable cards, indicators, badges, demo panel
  data/                    Initial demo data factories
  services/edge/           Device transport abstraction and adapters
  store/                   Zustand application state and alert rules
  types/                   Domain models and edge-update messages
  utils/                   Fill calculation, status, and date helpers
```

The UI reads from `useEcoStore`; it does not own or hard-code sensor readings. The store subscribes to an `EdgeDataSource`: demo mode uses `SimulatedEdgeDataSource`, while live mode uses `HttpEdgeDataSource` to poll the board. Both emit the same domain updates, keeping sensor transport, business rules, and presentation separate.

## Simulated sensor data

`SimulatedEdgeDataSource` owns the in-memory edge-device snapshot and provides:

- initial bins and recent events;
- update subscriptions;
- demo fill-level changes;
- simulated object classifications;
- sensor-offline events;
- mark-as-emptied and reset behavior.

Zustand applies each update, derives alerts on status transitions, and persists bins, events, and acknowledged alerts to AsyncStorage. The simulator is seeded from the restored state at startup, so a subsequent demo action continues from the displayed values.

Alert thresholds are:

| Fill | Status |
| --- | --- |
| 0–74% | Normal |
| 75–89% | Almost Full |
| 90–100% | Full |

## Fill calculation

The top-mounted depth sensor measures the air gap between the sensor and the waste. A smaller gap means a fuller bin.

```text
fillPercent = ((emptyDepthCm - currentDistanceCm) / emptyDepthCm) × 100
```

The result is rounded and clamped to `0…100`. The reusable implementation is `calculateFillPercentage` in `src/utils/bin.ts`.

Example: for an empty-bin depth of 40 cm and a current distance of 10 cm:

```text
((40 - 10) / 40) × 100 = 75%
```

## Connecting the FRDM-i.MX93

The live adapter is implemented. It polls the board every two seconds, maps the
board's snake-case JSON into the app model, deduplicates AI events, reports a
lost connection after three failed polls, and sends the **Mark as Emptied**
action back to the board.

Copy `.env.example` to `.env.local` and select live mode:

```env
EXPO_PUBLIC_EDGE_MODE=live
EXPO_PUBLIC_EDGE_URL=http://192.168.1.50:8080
```

Replace the IP address with the address printed by `hostname -I` on the board.
The phone and board must be on the same LAN. Reload Expo after changing the
environment file. Use `EXPO_PUBLIC_EDGE_MODE=demo` to return to the simulator.

The proposed REST contract is:

### `GET /api/status`

```json
{
  "device": "FRDM-i.MX93",
  "online": true,
  "timestamp": "2026-09-18T15:41:00.000Z"
}
```

### `GET /api/bins`

```json
{
  "bins": [
    {
      "id": "plastic",
      "distance_cm": 7.2,
      "empty_depth_cm": 40,
      "fill_percent": 82,
      "sensor_online": true
    }
  ]
}
```

### `GET /api/events`

```json
{
  "events": [
    {
      "object": "PET Bottle",
      "category": "plastic",
      "confidence": 0.94,
      "timestamp": "2026-09-18T15:41:00.000Z"
    }
  ]
}
```

For a first hardware integration, `subscribeToUpdates` can poll these endpoints every few seconds. It can later switch to WebSocket, server-sent events, or an MQTT-backed gateway while preserving the `EdgeDataSource` interface.

The board also accepts:

```text
POST /api/bins/{plastic|metal|general}/emptied
```

The NXP-side implementation and launch instructions live in the companion
`indobantaimeichu` repository.

## Scope

This MVP intentionally has no authentication, cloud database, mapping, or backend dependency. It is optimized for a reliable live hackathon demo and a clean path to the actual NXP edge device.
