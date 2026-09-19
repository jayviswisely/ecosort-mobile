import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polyline, type MapStyleElement } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/AppText';

import {
  MAP_RISK_COLORS,
  type HsinchuCityMapProps,
  type MapRisk,
} from './mapTypes';

const HSINCHU_REGION = {
  latitude: 24.802,
  longitude: 120.958,
  latitudeDelta: 0.102,
  longitudeDelta: 0.13,
};

const MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#e9efe9' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#395144' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f3f7f3' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#b8c8bd' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#dce9dc' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#d7e5d9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c5dfc8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d1dcd4' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f2d4a4' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#9baba1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#9fd0d2' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#477b7e' }] },
];

export default function HsinchuCityMap({
  stations,
  selectedStationId,
  routeActive,
  routeStationIds,
  onSelectStation,
}: HsinchuCityMapProps) {
  const routeCoordinates = routeStationIds
    .map((id) => stations.find((station) => station.id === id))
    .filter((station): station is NonNullable<typeof station> => Boolean(station))
    .map(({ latitude, longitude }) => ({ latitude, longitude }));

  return (
    <View style={styles.wrap}>
      <MapView
        initialRegion={HSINCHU_REGION}
        customMapStyle={MAP_STYLE}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled
        showsBuildings
        showsCompass={false}
        showsPointsOfInterests
        toolbarEnabled={false}
        style={StyleSheet.absoluteFill}
      >
        {stations
          .filter((station) => station.currentRisk === 'critical')
          .map((station) => (
            <Circle
              key={`risk-${station.id}`}
              center={{ latitude: station.latitude, longitude: station.longitude }}
              radius={720}
              fillColor="rgba(228,78,85,0.13)"
              strokeColor="rgba(228,78,85,0.38)"
              strokeWidth={1}
            />
          ))}

        {routeActive && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#246B43"
            strokeWidth={5}
            lineDashPattern={[2, 1]}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {stations.map((station) => {
          const selected = station.id === selectedStationId;
          const routeNumber = routeActive ? routeStationIds.indexOf(station.id) + 1 : 0;
          return (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              onPress={() => onSelectStation(station.id)}
              tracksViewChanges
              zIndex={selected ? 20 : station.currentRisk === 'critical' ? 10 : 2}
            >
              <NativeMarker
                label={station.shortName}
                fill={station.currentFill}
                risk={station.currentRisk}
                routeNumber={routeNumber}
                selected={selected}
              />
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.layerBadge}>
        <View style={styles.layerDot} />
        <Text style={styles.layerText}>LIVE STREET LAYER</Text>
      </View>
      <View style={styles.networkBadge}>
        <Ionicons name="radio-outline" size={13} color="#246B43" />
        <Text style={styles.networkText}>7 NODES</Text>
      </View>
      <View style={styles.demoBadge}>
        <Text style={styles.demoText}>PROPOSED DEMO DEPLOYMENT</Text>
      </View>
    </View>
  );
}

function NativeMarker({
  label,
  fill,
  risk,
  routeNumber,
  selected,
}: {
  label: string;
  fill: number;
  risk: MapRisk;
  routeNumber: number;
  selected: boolean;
}) {
  const visual = MAP_RISK_COLORS[risk];
  return (
    <View style={styles.markerWrap}>
      <View
        style={[
          styles.pin,
          { backgroundColor: visual.dark, borderColor: visual.color },
          selected && styles.pinSelected,
        ]}
      >
        {routeNumber > 0 ? (
          <Text style={[styles.routeNumber, { color: visual.color }]}>{routeNumber}</Text>
        ) : (
          <Text style={[styles.fillText, { color: visual.color }]}>{fill}</Text>
        )}
      </View>
      <View style={[styles.pinLabel, selected && styles.pinLabelSelected]}>
        <Text style={[styles.pinLabelText, selected && styles.pinLabelTextSelected]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 350,
    overflow: 'hidden',
    backgroundColor: '#DDE7DF',
  },
  markerWrap: { alignItems: 'center', width: 86 },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#10271B',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  pinSelected: { width: 44, height: 44, borderRadius: 22, borderWidth: 4 },
  fillText: { fontSize: 10, fontWeight: '900' },
  routeNumber: { fontSize: 15, fontWeight: '900' },
  pinLabel: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(16,39,27,0.9)',
  },
  pinLabelSelected: { backgroundColor: '#FFFFFF' },
  pinLabelText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  pinLabelTextSelected: { color: '#164E31' },
  layerBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  layerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F9E62' },
  layerText: { color: '#164E31', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  networkBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  networkText: { color: '#246B43', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  demoBadge: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(16,39,27,0.88)',
  },
  demoText: { color: '#D9E8DD', fontSize: 7, fontWeight: '900', letterSpacing: 0.65 },
});
