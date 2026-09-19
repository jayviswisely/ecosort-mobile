import 'leaflet/dist/leaflet.css';

import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type * as Leaflet from 'leaflet';

import { AppText as Text } from '@/components/AppText';
import { MAP_RISK_COLORS, type HsinchuCityMapProps, type MapStation } from './mapTypes';

const INITIAL_CENTER: Leaflet.LatLngExpression = [24.802, 120.963];

interface CurrentMapState extends HsinchuCityMapProps {}

export default function HsinchuCityMap(props: HsinchuCityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const overlaysRef = useRef<Leaflet.LayerGroup | null>(null);
  const latestStateRef = useRef<CurrentMapState>(props);

  latestStateRef.current = props;

  useEffect(() => {
    let disposed = false;

    async function createMap() {
      const module = await import('leaflet');
      const L: typeof Leaflet = module.default ?? module;
      const container = containerRef.current;

      if (disposed || !container || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(container, {
        attributionControl: true,
        center: INITIAL_CENTER,
        minZoom: 11,
        maxZoom: 18,
        scrollWheelZoom: true,
        touchZoom: true,
        zoom: 12.5,
        zoomControl: false,
        zoomSnap: 0.5,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      installCollapsibleAttribution(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ imperial: false, maxWidth: 90, position: 'bottomleft' }).addTo(map);

      const overlays = L.layerGroup().addTo(map);
      mapRef.current = map;
      overlaysRef.current = overlays;

      addViewControls(L, map, () => latestStateRef.current.stations);
      drawOperationalLayers(L, map, overlays, latestStateRef.current);

      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void createMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      overlaysRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const overlays = overlaysRef.current;
    if (!L || !map || !overlays) return;

    drawOperationalLayers(L, map, overlays, props);
  }, [props.routeActive, props.routeGroups, props.selectedStationId, props.stations]);

  return (
    <View style={styles.wrap}>
      {createElement('div', {
        ref: containerRef,
        role: 'application',
        'aria-label': 'Interactive Hsinchu City operations map',
        style: {
          position: 'absolute',
          inset: 0,
          backgroundColor: '#DDE6DF',
        },
      })}

      <View style={styles.layerBadge}>
        <View style={styles.layerDot} />
        <View>
          <Text style={styles.layerTitle}>LIVE STREET OPERATIONS</Text>
          <Text style={styles.layerHint}>Drag to pan · Pinch or scroll to zoom</Text>
        </View>
      </View>
      <View style={styles.demoBadge}>
        <Text style={styles.demoText}>PROPOSED DEMO DEPLOYMENT</Text>
      </View>
    </View>
  );
}

function installCollapsibleAttribution(map: Leaflet.Map) {
  const control = map.attributionControl;
  control.setPrefix(false);

  const container = control.getContainer();
  if (!container) return;

  container.style.borderRadius = '8px 0 0 0';
  container.style.boxShadow = '0 1px 5px rgba(16,39,27,.12)';
  container.style.color = '#52645A';
  container.style.font = '700 9px/1.2 Manrope_700Bold, system-ui';
  container.style.padding = '4px 6px';

  const fullAttribution = container.innerHTML;
  let expanded = true;

  const collapse = () => {
    if (!expanded) return;
    expanded = false;
    container.innerHTML = '<button type="button" aria-label="Map data attribution" title="Map data attribution" style="appearance:none;border:0;background:transparent;color:#52645A;cursor:pointer;font:800 11px/1 Manrope_800ExtraBold,system-ui;padding:1px 2px;">ⓘ</button>';
    container.querySelector('button')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      expanded = true;
      container.innerHTML = fullAttribution;
    });
  };

  window.setTimeout(collapse, 5000);
  map.once('movestart', collapse);
  map.once('zoomstart', collapse);
}

function drawOperationalLayers(
  L: typeof Leaflet,
  map: Leaflet.Map,
  overlays: Leaflet.LayerGroup,
  state: CurrentMapState,
) {
  overlays.clearLayers();

  const stationById = new Map(state.stations.map((station) => [station.id, station]));

  if (state.routeActive) {
    state.routeGroups.forEach((group) => {
      const routePoints = group.stationIds
        .map((id) => stationById.get(id))
        .filter((station): station is MapStation => Boolean(station))
        .map((station) => [station.latitude, station.longitude] as Leaflet.LatLngTuple);

      if (routePoints.length < 2) return;

      L.polyline(routePoints, {
        color: '#FFFFFF',
        lineCap: 'round',
        lineJoin: 'round',
        opacity: 0.96,
        weight: 10,
      }).addTo(overlays);

      L.polyline(routePoints, {
        color: group.color,
        dashArray: '10 8',
        lineCap: 'round',
        lineJoin: 'round',
        opacity: 1,
        weight: 5,
      })
        .bindTooltip(`${group.name} · district-local route`, {
          direction: 'center',
          sticky: true,
        })
        .addTo(overlays);
    });
  }

  state.stations.forEach((station) => {
    const visual = MAP_RISK_COLORS[station.currentRisk];
    const selected = station.id === state.selectedStationId;
    const routeGroup = state.routeGroups.find((group) => group.stationIds.includes(station.id));
    const routeIndex = routeGroup?.stationIds.indexOf(station.id) ?? -1;
    const routeLabel = state.routeActive && routeGroup && routeIndex >= 0
      ? `${routeGroup.code}${routeIndex + 1}`
      : '';

    if (station.currentRisk === 'critical' || station.currentRisk === 'watch') {
      const isCritical = station.currentRisk === 'critical';
      L.circle([station.latitude, station.longitude], {
        color: visual.color,
        fillColor: visual.color,
        fillOpacity: isCritical ? 0.14 : 0.08,
        opacity: isCritical ? 0.75 : 0.5,
        radius: isCritical ? 480 : 280,
        weight: isCritical ? 2 : 1,
      }).addTo(overlays);
    }

    const icon = L.divIcon({
      className: 'ecosort-leaflet-marker',
      html: buildMarkerHtml(station, visual, selected, routeLabel),
      iconAnchor: [18, 29],
      iconSize: [36, 56],
      popupAnchor: [0, -27],
    });

    const marker = L.marker([station.latitude, station.longitude], {
      alt: `${station.name}, ${station.currentFill}% full`,
      icon,
      keyboard: true,
      riseOnHover: true,
      title: station.name,
      // Keep the selected marker below neighboring pins while its popup is open,
      // so dense downtown stations remain individually tappable.
      zIndexOffset: selected ? -500 : routeLabel ? 500 : 0,
    })
      .bindPopup(buildPopupHtml(station), {
        className: 'ecosort-map-popup',
        closeButton: false,
        maxWidth: 260,
        minWidth: 210,
        offset: [0, -3],
      })
      .on('click', () => {
        state.onSelectStation(station.id);
        if (map.getZoom() < 14) map.flyTo([station.latitude, station.longitude], 15, { duration: 0.65 });
      })
      .addTo(overlays);

    if (selected) marker.openPopup();
  });
}

function buildMarkerHtml(
  station: MapStation,
  visual: { color: string; dark: string },
  selected: boolean,
  routeLabel: string,
) {
  const content = routeLabel || station.currentFill;
  const ring = selected ? '#FFFFFF' : visual.color;
  const scale = selected ? 1.13 : 1;

  return `
    <div style="display:flex;flex-direction:column;align-items:center;width:36px;transform:scale(${scale});transform-origin:18px 28px;filter:drop-shadow(0 4px 6px rgba(16,39,27,.28));">
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:4px solid ${ring};border-radius:50% 50% 50% 4px;background:${visual.dark};color:${visual.color};font:800 10px/1 Manrope_800ExtraBold,system-ui;transform:rotate(-45deg);">
        <span style="transform:rotate(45deg);">${content}${routeLabel ? '' : '%'}</span>
      </div>
      <div style="pointer-events:none;margin-top:2px;padding:3px 6px;border-radius:6px;background:${selected ? '#FFFFFF' : 'rgba(16,39,27,.92)'};color:${selected ? '#164E31' : '#FFFFFF'};font:700 9px/1.1 Manrope_700Bold,system-ui;white-space:nowrap;">${station.shortName}</div>
    </div>`;
}

function buildPopupHtml(station: MapStation) {
  const visual = MAP_RISK_COLORS[station.currentRisk];
  const status = station.currentRisk.replace('_', ' ').toUpperCase();
  const instruction = station.currentRisk === 'critical'
    ? 'Collection intervention required now'
    : station.currentRisk === 'watch'
      ? 'Predicted capacity risk — monitor route'
      : station.currentRisk === 'offline'
        ? 'Sensor link offline — field check needed'
        : 'Capacity within operating target';

  return `
    <div style="font-family:Manrope_400Regular,system-ui;color:#173D2C;padding:2px 1px 3px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${visual.color};box-shadow:0 0 0 4px ${visual.color}22;"></span>
        <span style="font-size:9px;font-weight:900;letter-spacing:.7px;color:${visual.color};">${status}</span>
      </div>
      <div style="font-size:15px;font-weight:900;line-height:1.15;margin-bottom:8px;">${station.name}</div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:11px;color:#607067;">Current capacity</span>
        <span style="font-size:20px;font-weight:900;">${station.currentFill}%</span>
      </div>
      <div style="height:6px;border-radius:99px;background:#E3EAE6;overflow:hidden;margin-bottom:9px;">
        <div style="height:100%;width:${Math.max(2, station.currentFill)}%;background:${visual.color};border-radius:99px;"></div>
      </div>
      <div style="font-size:10px;font-weight:700;color:#52645A;">${instruction}</div>
    </div>`;
}

function addViewControls(
  L: typeof Leaflet,
  map: Leaflet.Map,
  getStations: () => MapStation[],
) {
  const control = new L.Control({ position: 'topright' });

  control.onAdd = () => {
    const container = L.DomUtil.create('div');
    container.style.display = 'flex';
    container.style.gap = '5px';
    container.style.marginTop = '8px';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const cityButton = createMapButton('City', 'Show all Hsinchu stations');
    const coreButton = createMapButton('Core', 'Focus on the central operating corridor');

    L.DomEvent.on(cityButton, 'click', () => {
      const bounds = L.latLngBounds(
        getStations().map((station) => [station.latitude, station.longitude] as Leaflet.LatLngTuple),
      );
      map.fitBounds(bounds.pad(0.16), { animate: true, maxZoom: 13 });
    });
    L.DomEvent.on(coreButton, 'click', () => map.flyTo([24.8, 120.979], 14.5, { duration: 0.75 }));

    container.append(cityButton, coreButton);
    return container;
  };

  control.addTo(map);
}

function createMapButton(label: string, title: string) {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = title;
  button.textContent = label;
  button.style.cssText = [
    'appearance:none',
    'border:1px solid rgba(22,78,49,.18)',
    'border-radius:8px',
    'background:rgba(255,255,255,.96)',
    'box-shadow:0 2px 8px rgba(16,39,27,.14)',
    'color:#164E31',
    'cursor:pointer',
    'font:800 9px/1 Manrope_800ExtraBold,system-ui',
    'letter-spacing:.4px',
    'padding:8px 9px',
  ].join(';');
  return button;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    height: 420,
    overflow: 'hidden',
    backgroundColor: '#DDE6DF',
  },
  layerBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    boxShadow: '0 3px 10px rgba(16,39,27,0.14)',
    pointerEvents: 'none',
  },
  layerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2F9E62',
    boxShadow: '0 0 0 4px rgba(47,158,98,0.15)',
  },
  layerTitle: { color: '#164E31', fontSize: 8, fontWeight: '900', letterSpacing: 0.65 },
  layerHint: { marginTop: 2, color: '#6C7C73', fontSize: 7, fontWeight: '700' },
  demoBadge: {
    position: 'absolute',
    left: 10,
    bottom: 26,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(16,39,27,0.9)',
    pointerEvents: 'none',
  },
  demoText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
});
