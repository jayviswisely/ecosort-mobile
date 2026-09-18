export interface AutopilotStation {
  id: string;
  name: string;
  shortName: string;
  district: 'North' | 'East' | 'Xiangshan';
  x: number;
  y: number;
  latitude: number;
  longitude: number;
  fillPercent: number;
  projectedFillPercent: number;
  predictedFullMinutes: number | null;
  itemsToday: number;
  diversionKg: number;
  sensorOnline: boolean;
  edgeConnected?: boolean;
}

export const AUTOPILOT_STATIONS: AutopilotStation[] = [
  {
    id: 'north-loop',
    name: 'Beimen Market Node',
    shortName: 'Beimen',
    district: 'North',
    x: 22,
    y: 24,
    latitude: 24.80774,
    longitude: 120.96536,
    fillPercent: 96,
    projectedFillPercent: 100,
    predictedFullMinutes: 12,
    itemsToday: 184,
    diversionKg: 31.6,
    sensorOnline: true,
  },
  {
    id: 'big-city',
    name: 'Big City Green Point',
    shortName: 'Big City',
    district: 'North',
    x: 43,
    y: 37,
    latitude: 24.80991,
    longitude: 120.97465,
    fillPercent: 78,
    projectedFillPercent: 94,
    predictedFullMinutes: 68,
    itemsToday: 142,
    diversionKg: 24.2,
    sensorOnline: true,
  },
  {
    id: 'edge-lab',
    name: 'Hsinchu Station Edge Lab',
    shortName: 'Station',
    district: 'East',
    x: 54,
    y: 58,
    latitude: 24.80164,
    longitude: 120.97159,
    fillPercent: 82,
    projectedFillPercent: 96,
    predictedFullMinutes: 47,
    itemsToday: 126,
    diversionKg: 21.8,
    sensorOnline: true,
    edgeConnected: true,
  },
  {
    id: 'nthu',
    name: 'NTHU Green Point',
    shortName: 'NTHU',
    district: 'East',
    x: 76,
    y: 34,
    latitude: 24.79616,
    longitude: 120.99671,
    fillPercent: 86,
    projectedFillPercent: 99,
    predictedFullMinutes: 52,
    itemsToday: 158,
    diversionKg: 28.1,
    sensorOnline: true,
  },
  {
    id: 'nycu',
    name: 'NYCU North Gate',
    shortName: 'NYCU',
    district: 'East',
    x: 84,
    y: 59,
    latitude: 24.78684,
    longitude: 120.99693,
    fillPercent: 63,
    projectedFillPercent: 73,
    predictedFullMinutes: 194,
    itemsToday: 97,
    diversionKg: 17.3,
    sensorOnline: true,
  },
  {
    id: 'xiangshan',
    name: 'Xiangshan Wetlands Hub',
    shortName: 'Wetlands',
    district: 'Xiangshan',
    x: 24,
    y: 78,
    latitude: 24.76388,
    longitude: 120.91494,
    fillPercent: 44,
    projectedFillPercent: 55,
    predictedFullMinutes: 286,
    itemsToday: 64,
    diversionKg: 12.4,
    sensorOnline: true,
  },
  {
    id: 'harbor',
    name: 'Nanliao Harbor Node',
    shortName: 'Nanliao',
    district: 'North',
    x: 13,
    y: 48,
    latitude: 24.84864,
    longitude: 120.92892,
    fillPercent: 0,
    projectedFillPercent: 0,
    predictedFullMinutes: null,
    itemsToday: 76,
    diversionKg: 13.1,
    sensorOnline: false,
  },
];
