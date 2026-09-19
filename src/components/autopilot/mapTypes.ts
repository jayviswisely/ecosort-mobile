export type MapRisk = 'normal' | 'watch' | 'critical' | 'offline' | 'collected';

export interface MapStation {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  currentFill: number;
  currentRisk: MapRisk;
  edgeConnected?: boolean;
}

export interface MapRouteGroup {
  id: string;
  code: string;
  name: string;
  zone: string;
  color: string;
  stationIds: readonly string[];
}

export interface HsinchuCityMapProps {
  stations: MapStation[];
  selectedStationId: string;
  routeActive: boolean;
  routeGroups: readonly MapRouteGroup[];
  onSelectStation: (stationId: string) => void;
}

export const MAP_RISK_COLORS: Record<MapRisk, { color: string; dark: string }> = {
  normal: { color: '#2F9E62', dark: '#173D2C' },
  watch: { color: '#E59A24', dark: '#4B3514' },
  critical: { color: '#E44E55', dark: '#4A2023' },
  offline: { color: '#7D8B84', dark: '#2B3630' },
  collected: { color: '#64C832', dark: '#224421' },
};
