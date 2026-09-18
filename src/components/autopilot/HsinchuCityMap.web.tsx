import { createElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAP_RISK_COLORS, type HsinchuCityMapProps } from './mapTypes';

const BOUNDS = {
  west: 120.849609375,
  east: 121.11328125,
  south: 24.686952412,
  north: 24.926294766,
};
const MAP_TILES = Array.from({ length: 9 }, (_, index) => ({
  x: 3423 + (index % 3),
  y: 1755 + Math.floor(index / 3),
  column: index % 3,
  row: Math.floor(index / 3),
}));

function mapPosition(latitude: number, longitude: number) {
  return {
    left: `${((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100}%` as const,
    top: `${((BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south)) * 100}%` as const,
  };
}

export default function HsinchuCityMap({
  stations,
  selectedStationId,
  routeActive,
  routeStationIds,
  onSelectStation,
}: HsinchuCityMapProps) {
  return (
    <View style={styles.wrap}>
      {MAP_TILES.map((tile) =>
        createElement('img', {
          key: `${tile.x}-${tile.y}`,
          alt: '',
          src: `https://tile.openstreetmap.org/12/${tile.x}/${tile.y}.png`,
          style: {
            position: 'absolute',
            left: `${tile.column * 33.333333}%`,
            top: `${tile.row * 33.333333}%`,
            width: '33.5%',
            height: '33.5%',
            objectFit: 'fill',
            pointerEvents: 'none',
            filter: 'saturate(0.72) contrast(1.03)',
          },
          draggable: false,
          'aria-hidden': true,
        }),
      )}
      <View style={styles.mapTint} />

      {routeActive && (
        <View style={[StyleSheet.absoluteFill, styles.nonInteractive]}>
          <View style={[styles.routePath, { left: '46%', top: '46%', width: '9%', transform: [{ rotate: '-13deg' }] }]} />
          <View style={[styles.routePath, { left: '50%', top: '50%', width: '11%', transform: [{ rotate: '71deg' }] }]} />
          <View style={[styles.routePath, { left: '53%', top: '56%', width: '18%', transform: [{ rotate: '-16deg' }] }]} />
        </View>
      )}

      {stations.map((station) => {
        const selected = station.id === selectedStationId;
        const routeNumber = routeActive ? routeStationIds.indexOf(station.id) + 1 : 0;
        const visual = MAP_RISK_COLORS[station.currentRisk];
        return (
          <Pressable
            key={station.id}
            accessibilityRole="button"
            accessibilityLabel={`${station.name}, ${station.currentFill}% full`}
            onPress={() => onSelectStation(station.id)}
            style={[styles.marker, mapPosition(station.latitude, station.longitude), selected && styles.markerSelected]}
          >
            {station.currentRisk === 'critical' && (
              <View style={[styles.riskHalo, { borderColor: visual.color, backgroundColor: `${visual.color}18` }]} />
            )}
            <View style={[styles.pin, { borderColor: visual.color, backgroundColor: visual.dark }]}>
              <Text style={[styles.pinText, { color: visual.color }]}>
                {routeNumber > 0 ? routeNumber : station.currentFill}
              </Text>
            </View>
            <View style={[styles.label, selected && styles.labelSelected]}>
              <Text style={[styles.labelText, selected && styles.labelTextSelected]}>{station.shortName}</Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.layerBadge}>
        <View style={styles.layerDot} />
        <Text style={styles.layerText}>OPENSTREETMAP · LIVE STREET LAYER</Text>
      </View>
      <View style={styles.demoBadge}>
        <Text style={styles.demoText}>PROPOSED DEMO DEPLOYMENT</Text>
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', height: 350, overflow: 'hidden', backgroundColor: '#DDE6DF' },
  mapTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
    backgroundColor: 'rgba(22,78,49,0.08)',
  },
  marker: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
    marginLeft: -30,
    marginTop: -16,
    zIndex: 4,
  },
  markerSelected: { zIndex: 10, transform: [{ scale: 1.1 }] },
  riskHalo: { position: 'absolute', top: -7, width: 46, height: 46, borderRadius: 23, borderWidth: 2 },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    boxShadow: '0 4px 9px rgba(16,39,27,0.26)',
  },
  pinText: { fontSize: 10, fontWeight: '900' },
  label: { marginTop: 3, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(16,39,27,0.9)' },
  labelSelected: { backgroundColor: '#FFFFFF' },
  labelText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  labelTextSelected: { color: '#164E31' },
  routePath: { position: 'absolute', height: 5, borderRadius: 3, backgroundColor: '#246B43', boxShadow: '0 0 8px rgba(36,107,67,0.65)' },
  nonInteractive: { pointerEvents: 'none' },
  layerBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  layerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F9E62' },
  layerText: { color: '#164E31', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  demoBadge: { position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(16,39,27,0.9)' },
  demoText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  attribution: { position: 'absolute', right: 6, bottom: 4, color: '#33483A', fontSize: 7, backgroundColor: 'rgba(255,255,255,0.82)', paddingHorizontal: 3 },
});
