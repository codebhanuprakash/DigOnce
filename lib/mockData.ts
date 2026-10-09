import { PublicWorkProject, RoadSegment } from './types';
import { ROADS_GEOJSON } from './roadsGeoJson';
import { interpolateSubPolyline } from './geoUtils';

/**
 * Real Chennai–Kancheepuram Road Segments extracted from OpenStreetMap.
 * See public/data/roads.geojson for authoritative GeoJSON features, OSM way IDs, and ODbL attribution.
 */
export const MOCK_ROAD_SEGMENTS: RoadSegment[] = ROADS_GEOJSON.features.map((feature: any) => ({
  id: feature.properties.id,
  name: feature.properties.name,
  wardNumber: feature.properties.wardNumber,
  zone: feature.properties.zone,
  lengthMeters: feature.properties.lengthMeters,
  osmWayIds: feature.properties.osmWayIds,
  highway: feature.properties.highway,
  coordinates: feature.geometry.coordinates.map((pt: [number, number]) => ({
    lat: pt[1],
    lng: pt[0],
  })),
}));

// Helper to look up a road segment by ID
function getRoadCoords(roadId: string) {
  const road = MOCK_ROAD_SEGMENTS.find((r) => r.id === roadId);
  if (!road) throw new Error(`Road not found: ${roadId}`);
  return road.coordinates;
}

/**
 * Synthetic demonstration public works projects.
 * Explicitly labeled as simulated scenarios designed to test and demonstrate
 * the conflict detection engine.
 *
 * CRITICAL REALISM FIX: Every project's polyline coordinates are deterministically
 * derived from its parent road's canonical OpenStreetMap geometry using geodesic
 * cumulative distance slicing (`interpolateSubPolyline`).
 */
export const MOCK_PROJECTS: PublicWorkProject[] = [
  // 1 & 2: Valid Concurrent Work Conflict on Anna Salai
  // Subsegments: 0.20-0.70 vs 0.40-0.85 (Overlapping: 0.40-0.70), Dates: Nov 2026
  {
    id: 'PRJ-2026-GCC-041',
    roadId: 'RD-CH-09-ANNA-01',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'Anna Salai Bitumen Milling & Resurfacing',
    description: 'Milling and relaying wearing coat along Anna Salai arterial corridor.',
    contractor: 'Southern Infrastructure Ltd',
    startDate: '2026-11-01',
    endDate: '2026-11-20',
    status: 'PLANNED',
    segmentStartPct: 0.20,
    segmentEndPct: 0.70,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-09-ANNA-01'), 0.20, 0.70),
    isSimulated: true,
  },
  {
    id: 'PRJ-2026-CMWSSB-082',
    roadId: 'RD-CH-09-ANNA-01',
    agency: 'CMWSSB',
    category: 'WATER_SUPPLY',
    title: 'Water Feeder Main Replacement',
    description: 'Replacement of aged 300mm cast-iron water distribution conduit under road carriageway.',
    contractor: 'Chennai Metro Utilities Ltd',
    startDate: '2026-11-10',
    endDate: '2026-11-28',
    status: 'PLANNED',
    segmentStartPct: 0.40,
    segmentEndPct: 0.85,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-09-ANNA-01'), 0.40, 0.85),
    isSimulated: true,
  },

  // 3 & 4: Valid Recent-Resurfacing Coordination Risk on Arcot Road
  // Project 3 is COMPLETED resurfacing on 2026-08-15 (subsegment 0.10-0.60).
  // Project 4 is PLANNED excavation starting 2026-10-20 (subsegment 0.25-0.50, 66 days later within 180-day heuristic).
  {
    id: 'PRJ-2026-GCC-012',
    roadId: 'RD-CH-10-ARCOT-02',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'Arcot Road High-Density Asphalt Overlay',
    description: 'Post-monsoon surface rectification and micro-surfacing in Kodambakkam.',
    contractor: 'Apex Paving Engineers',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    status: 'COMPLETED',
    segmentStartPct: 0.10,
    segmentEndPct: 0.60,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-10-ARCOT-02'), 0.10, 0.60),
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
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-10-ARCOT-02'), 0.25, 0.50),
    isSimulated: true,
  },

  // 5 & 6: Same Road (Rajiv Gandhi Salai / OMR) but NON-OVERLAPPING Subsegments (No Conflict Expected)
  // Subsegments: 0.00-0.30 vs 0.60-0.95
  {
    id: 'PRJ-2026-GCC-055',
    roadId: 'RD-CH-13-OMR-03',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'OMR Rajiv Gandhi Salai Wearing Coat Rectification',
    description: 'Pavement rehabilitation from Madhya Kailash junction southward.',
    contractor: 'Capital Roads Works',
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    status: 'PLANNED',
    segmentStartPct: 0.00,
    segmentEndPct: 0.30,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-13-OMR-03'), 0.00, 0.30),
    isSimulated: true,
  },
  {
    id: 'PRJ-2026-TELECOM-099',
    roadId: 'RD-CH-13-OMR-03',
    agency: 'TELECOM',
    category: 'TELECOM_FIBER',
    title: 'Tidel Park Optical Fiber Ducting',
    description: 'Micro-trenching for urban high-speed IT corridor broadband connectivity.',
    contractor: 'Metro Optical Telecom',
    startDate: '2026-11-05',
    endDate: '2026-11-12',
    status: 'PLANNED',
    segmentStartPct: 0.60,
    segmentEndPct: 0.95,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-13-OMR-03'), 0.60, 0.95),
    isSimulated: true,
  },

  // 7: Distinct Road Segment in Kancheepuram (Different Road ID - No Conflict Expected)
  {
    id: 'PRJ-2026-CMRL-077',
    roadId: 'RD-KANCHI-01-RAIL-04',
    agency: 'CMRL',
    category: 'METRO_STATION',
    title: 'Railway Road Intermodal Transit Prep',
    description: 'Pavement leveling and pedestrian interchange lane construction near railway hub.',
    contractor: 'Tamil Nadu Urban Construction',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    status: 'PLANNED',
    segmentStartPct: 0.10,
    segmentEndPct: 0.40,
    coordinates: interpolateSubPolyline(getRoadCoords('RD-KANCHI-01-RAIL-04'), 0.10, 0.40),
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
    coordinates: interpolateSubPolyline(getRoadCoords('RD-CH-09-ANNA-01'), 0.30, 0.60),
    isSimulated: true,
  },
];
