import { PublicWorkProject, RoadSegment } from './types';

/**
 * Canonical Chennai–Kancheepuram Road Segments
 * Geometry coordinates represent real landmark thoroughfares in Chennai & Kancheepuram.
 */
export const MOCK_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'RD-CH-09-ANNA-01',
    name: 'Anna Salai (Teynampet to Nandanam)',
    wardNumber: 118,
    zone: 'Zone IX (Teynampet)',
    lengthMeters: 1800,
    coordinates: [
      { lat: 13.0418, lng: 80.2486 },
      { lat: 13.0335, lng: 80.2412 },
      { lat: 13.0232, lng: 80.2319 },
    ],
  },
  {
    id: 'RD-CH-10-ARCOT-02',
    name: 'Arcot Road (Kodambakkam to Vadapalani)',
    wardNumber: 130,
    zone: 'Zone X (Kodambakkam)',
    lengthMeters: 2200,
    coordinates: [
      { lat: 13.0515, lng: 80.2223 },
      { lat: 13.0510, lng: 80.2105 },
      { lat: 13.0505, lng: 80.2012 },
    ],
  },
  {
    id: 'RD-CH-13-LB-03',
    name: 'Lattice Bridge (LB) Road (Adyar to Thiruvanmiyur)',
    wardNumber: 175,
    zone: 'Zone XIII (Adyar)',
    lengthMeters: 1600,
    coordinates: [
      { lat: 13.0067, lng: 80.2570 },
      { lat: 12.9925, lng: 80.2588 },
      { lat: 12.9830, lng: 80.2595 },
    ],
  },
  {
    id: 'RD-KANCHI-01-GANDHI-04',
    name: 'Gandhi Road (Kancheepuram Town)',
    wardNumber: 22,
    zone: 'Kancheepuram Urban',
    lengthMeters: 1400,
    coordinates: [
      { lat: 12.8342, lng: 79.7036 },
      { lat: 12.8365, lng: 79.7088 },
      { lat: 12.8390, lng: 79.7142 },
    ],
  },
];

/**
 * Synthetic demonstration public works projects.
 * Explicitly labeled as simulated scenarios designed to test and demonstrate
 * the conflict detection engine.
 */
export const MOCK_PROJECTS: PublicWorkProject[] = [
  // 1 & 2: Valid Concurrent Work Conflict on Anna Salai (subsegments 0.20-0.70 vs 0.40-0.85, dates Nov 2026)
  {
    id: 'PRJ-2026-GCC-041',
    roadId: 'RD-CH-09-ANNA-01',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'Anna Salai Bitumen Milling & Resurfacing',
    description: 'Milling and relaying wearing coat from Eldams Rd junction to Cenotaph Rd.',
    contractor: 'Southern Infrastructure Ltd',
    startDate: '2026-11-01',
    endDate: '2026-11-20',
    status: 'PLANNED',
    segmentStartPct: 0.20,
    segmentEndPct: 0.70,
    coordinates: [
      { lat: 13.0390, lng: 80.2460 },
      { lat: 13.0335, lng: 80.2412 },
    ],
    isSimulated: true,
  },
  {
    id: 'PRJ-2026-CMWSSB-082',
    roadId: 'RD-CH-09-ANNA-01',
    agency: 'CMWSSB',
    category: 'WATER_SUPPLY',
    title: 'Water Feeder Main Replacement',
    description: 'Replacement of aged 300mm cast-iron water distribution conduit.',
    contractor: 'Chennai Metro Utilities Ltd',
    startDate: '2026-11-10',
    endDate: '2026-11-28',
    status: 'PLANNED',
    segmentStartPct: 0.40,
    segmentEndPct: 0.85,
    coordinates: [
      { lat: 13.0350, lng: 80.2425 },
      { lat: 13.0270, lng: 80.2350 },
    ],
    isSimulated: true,
  },

  // 3 & 4: Valid Recent-Resurfacing Coordination Risk on Arcot Road
  // Project 3 is COMPLETED resurfacing on 2026-08-15.
  // Project 4 is PLANNED excavation starting 2026-10-20 (66 days later, within 180-day heuristic).
  {
    id: 'PRJ-2026-GCC-012',
    roadId: 'RD-CH-10-ARCOT-02',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'Arcot Road High-Density Asphalt Overlay',
    description: 'Post-monsoon surface rectification and micro-surfacing.',
    contractor: 'Apex Paving Engineers',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    status: 'COMPLETED',
    segmentStartPct: 0.10,
    segmentEndPct: 0.60,
    coordinates: [
      { lat: 13.0514, lng: 80.2200 },
      { lat: 13.0510, lng: 80.2105 },
    ],
    isSimulated: true,
  },
  {
    id: 'PRJ-2026-TANGEDCO-034',
    roadId: 'RD-CH-10-ARCOT-02',
    agency: 'TANGEDCO',
    category: 'POWER_CABLE',
    title: '11kV High-Tension Underground Cable Laying',
    description: 'Installation of subterranean feeder cables for substation capacity upgrade.',
    contractor: 'PowerGrid Infra EPC',
    startDate: '2026-10-20',
    endDate: '2026-11-05',
    status: 'PLANNED',
    segmentStartPct: 0.25,
    segmentEndPct: 0.50,
    coordinates: [
      { lat: 13.0512, lng: 80.2150 },
      { lat: 13.0510, lng: 80.2105 },
    ],
    isSimulated: true,
  },

  // 5 & 6: Same Road (LB Road) but NON-OVERLAPPING Subsegments (No Conflict Expected)
  // Subsegments: 0.00-0.30 vs 0.60-0.95
  {
    id: 'PRJ-2026-GCC-055',
    roadId: 'RD-CH-13-LB-03',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'LB Road Adyar Junction Resurfacing',
    description: 'Traffic circle intersection re-paving near Adyar signal.',
    contractor: 'Capital Roads Works',
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    status: 'PLANNED',
    segmentStartPct: 0.00,
    segmentEndPct: 0.30,
    coordinates: [
      { lat: 13.0067, lng: 80.2570 },
      { lat: 13.0000, lng: 80.2576 },
    ],
    isSimulated: true,
  },
  {
    id: 'PRJ-2026-TELECOM-099',
    roadId: 'RD-CH-13-LB-03',
    agency: 'TELECOM',
    category: 'TELECOM_FIBER',
    title: 'Thiruvanmiyur Optical Fiber Ducting',
    description: 'Micro-trenching for urban high-speed broadband corridor.',
    contractor: 'Metro Optical Telecom',
    startDate: '2026-11-05',
    endDate: '2026-11-12',
    status: 'PLANNED',
    segmentStartPct: 0.60,
    segmentEndPct: 0.95,
    coordinates: [
      { lat: 12.9880, lng: 80.2590 },
      { lat: 12.9835, lng: 80.2595 },
    ],
    isSimulated: true,
  },

  // 7: Distinct Road Segment in Kancheepuram (Different Road ID - No Conflict Expected)
  {
    id: 'PRJ-2026-CMRL-077',
    roadId: 'RD-KANCHI-01-GANDHI-04',
    agency: 'CMRL',
    category: 'METRO_STATION',
    title: 'Gandhi Road Feeder Bus Terminal Prep',
    description: 'Pavement leveling and pedestrian interchange lane construction.',
    contractor: 'Tamil Nadu Urban Construction',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    status: 'PLANNED',
    segmentStartPct: 0.10,
    segmentEndPct: 0.40,
    coordinates: [
      { lat: 12.8350, lng: 79.7050 },
      { lat: 12.8375, lng: 79.7100 },
    ],
    isSimulated: true,
  },

  // 8: Sequential Non-Overlapping Project on Anna Salai (Dates far apart: Feb 2027 - No Conflict)
  {
    id: 'PRJ-2027-TELECOM-101',
    roadId: 'RD-CH-09-ANNA-01',
    agency: 'TELECOM',
    category: 'TELECOM_FIBER',
    title: 'Anna Salai Smart City Sensor Fiber',
    description: 'Installation of civic IoT network ducting along Anna Salai median.',
    contractor: 'Smart City Fiber Net',
    startDate: '2027-02-01',
    endDate: '2027-02-14',
    status: 'PLANNED',
    segmentStartPct: 0.30,
    segmentEndPct: 0.60,
    coordinates: [
      { lat: 13.0360, lng: 80.2440 },
      { lat: 13.0300, lng: 80.2380 },
    ],
    isSimulated: true,
  },
];
