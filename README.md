# EcoSort

EcoSort is a hackathon-ready facility-management companion for an NXP FRDM-i.MX93 smart recycling station. The physical station classifies waste at the edge, opens the correct lid through a PCA9685/SG90 servo setup, and reports bin depth readings. The mobile app turns those readings into clear fill levels, alerts, and collection actions for cleaning staff.

The app is completely demoable without hardware. It starts with the NCKU Dormitory A station and three bins: Plastic (82%), Metal (41%), and General (63%).

## Features

- Polished dashboard with animated fill indicators and live-style hardware status
- Zero-Overflow Autopilot with a Hsinchu city digital twin, two-hour capacity
  forecasting, optimized collection missions, and sensor-verified pickups
- Real Hsinchu street geography on iOS/Android, an OpenStreetMap web layer, and
  an explainable six-stage decision pipeline from edge signal to verified pickup
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

1. Open **Autopilot** and switch the Hsinchu command map from **Now** to **+2H**.
2. Show how the forecast identifies four overflow risks before they occur.
3. Tap **Generate smart route** to create the prioritized collection mission.
4. Verify each pickup to simulate the depth sensor returning to empty. Watch the
   station, mission progress, and impact estimates update after every stop.
5. Finish the route and show the closed-loop completion state: zero predicted
   overflows and four sensor-verified pickups.
6. Open **Station**, tap **Demo**, and simulate a PET Bottle or Aluminum Can to
   show the NXP edge-classification banner and activity log.
7. Use **Reset Demo** to restore the station data.

The Hsinchu nodes, route savings, and environmental impact values are clearly
identified in the interface as demo data and estimates.

## Hsinchu map layers

- iOS and Android use `react-native-maps` with real geographic coordinates,
  selectable custom markers, overflow-risk radii, and optimized route polylines.
- Web uses OpenStreetMap raster tiles with the required contributor attribution
  and the same coordinates, state, markers, and route sequence.
- The proposed demo nodes represent Beimen Market, Big City, Hsinchu Station,
  NTHU, NYCU, Xiangshan Wetlands, and Nanliao Harbor. They are not presented as
  existing EcoSort installations.

`react-native-maps` works without extra setup in Expo Go. A standalone Android
release must configure a Google Maps SDK key through the `react-native-maps`
config plugin before building for an app store.

## Architecture

```text
app/
  _layout.tsx              App startup, persistence hydration, root stack
  (tabs)/
    _layout.tsx            Autopilot / Station / Alerts bottom tabs
    index.tsx              Zero-Overflow Autopilot command map
    station.tsx            Live station dashboard
    alerts.tsx             Alert inbox
  bin/
    [id].tsx               Dynamic bin detail route

src/
  components/              Reusable cards, indicators, badges, demo panel
    autopilot/              Native/web city maps and explainable AI pipeline
  data/                    Initial demo data factories
  services/edge/           Device transport abstraction and adapters
  store/                   Zustand application state and alert rules
  types/                   Domain models and edge-update messages
  utils/                   Fill calculation, status, and date helpers
```

The UI reads from `useEcoStore`; it does not own or hard-code simulated readings. The store subscribes to an `EdgeDataSource`. `SimulatedEdgeDataSource` is used today and emits the same domain updates a future network adapter would emit. This keeps sensor transport, business rules, and presentation separate.

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

Implement the methods in `src/services/edge/HttpEdgeDataSource.ts`, then replace the active source imported by the store. No screen or visual component needs to change.

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

## Scope

This MVP intentionally has no authentication, cloud database, mapping, or backend dependency. It is optimized for a reliable live hackathon demo and a clean path to the actual NXP edge device.
