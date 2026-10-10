import { describe, it, expect } from 'vitest';
import { MOCK_PROJECTS, MOCK_ROAD_SEGMENTS } from '../lib/mockData';
import { detectConflicts } from '../lib/conflictEngine';
import {
  interpolateSubPolyline,
  haversineDistanceMeters,
  calculatePolylineGeodesicLengthMeters,
  isValidLatLng,
} from '../lib/geoUtils';
import { ROADS_GEOJSON } from '../lib/roadsGeoJson';

describe('GIS Integrity & Source Dataset Audit', () => {
  describe('Canonical Road Geometry Dataset (roads.geojson)', () => {
    it('contains exactly the 4 canonical Chennai–Kancheepuram corridor roads', () => {
      expect(ROADS_GEOJSON.features).toHaveLength(4);
      const roadIds = ROADS_GEOJSON.features.map((f) => f.id);
      expect(roadIds).toContain('RD-CH-09-ANNA-01');
      expect(roadIds).toContain('RD-CH-10-ARCOT-02');
      expect(roadIds).toContain('RD-CH-13-OMR-03');
      expect(roadIds).toContain('RD-KANCHI-01-RAIL-04');
    });

    it('retains verified OpenStreetMap way IDs and highway classifications for every road', () => {
      ROADS_GEOJSON.features.forEach((feature) => {
        expect(feature.properties.osmWayIds).toBeDefined();
        expect(feature.properties.osmWayIds.length).toBeGreaterThan(0);
        expect(feature.properties.highway).toBeDefined();
        expect(feature.properties.sourceAttribution).toContain('OpenStreetMap');
      });
    });

    it('has zero gaps between stitched OSM ways (continuous polyline)', () => {
      MOCK_ROAD_SEGMENTS.forEach((road) => {
        expect(road.coordinates.length).toBeGreaterThanOrEqual(25);
        for (let i = 0; i < road.coordinates.length - 1; i++) {
          const p1 = road.coordinates[i];
          const p2 = road.coordinates[i + 1];
          expect(isValidLatLng(p1)).toBe(true);
          expect(isValidLatLng(p2)).toBe(true);
          const dist = haversineDistanceMeters(p1, p2);
          // Vertices on real road ways should have smooth continuity (< 400m between GPS nodes)
          expect(dist).toBeLessThan(400);
          expect(dist).toBeGreaterThan(0.0001); // No duplicate zero-distance vertices
        }
      });
    });

    it('coordinates strictly obey GeoJSON [longitude, latitude] ordering and regional bounds', () => {
      ROADS_GEOJSON.features.forEach((feature) => {
        feature.geometry.coordinates.forEach((pt) => {
          const lng = pt[0];
          const lat = pt[1];
          // Regional corridor bounding box: 12.5°N - 13.5°N, 79.5°E - 80.5°E
          expect(lat).toBeGreaterThanOrEqual(12.5);
          expect(lat).toBeLessThanOrEqual(13.5);
          expect(lng).toBeGreaterThanOrEqual(79.5);
          expect(lng).toBeLessThanOrEqual(80.5);
        });
      });
    });

    it('recorded lengthMeters matches calculated geodesic length within 1%', () => {
      MOCK_ROAD_SEGMENTS.forEach((road) => {
        const calculatedLength = calculatePolylineGeodesicLengthMeters(road.coordinates);
        expect(Math.abs(calculatedLength - road.lengthMeters)).toBeLessThan(5);
      });
    });
  });

  describe('Project Integrity against Source Road Centerlines', () => {
    it('every simulated project references an existing canonical roadId', () => {
      const roadIds = new Set(MOCK_ROAD_SEGMENTS.map((r) => r.id));
      MOCK_PROJECTS.forEach((project) => {
        expect(roadIds.has(project.roadId)).toBe(true);
        expect(project.isSimulated).toBe(true);
      });
    });

    it('every project polyline coordinates exactly match geodesic slicing of its parent road', () => {
      MOCK_PROJECTS.forEach((project) => {
        const road = MOCK_ROAD_SEGMENTS.find((r) => r.id === project.roadId)!;
        const expectedSub = interpolateSubPolyline(
          road.coordinates,
          project.segmentStartPct,
          project.segmentEndPct
        );

        expect(project.coordinates).toHaveLength(expectedSub.length);
        for (let i = 0; i < expectedSub.length; i++) {
          const diff = haversineDistanceMeters(expectedSub[i], project.coordinates[i]);
          expect(diff).toBeLessThan(0.01); // Sub-centimeter exact match
        }
      });
    });
  });

  describe('Conflict Integrity against Source Geometry', () => {
    it('every detected conflict accurately reflects source overlapping subsegment', () => {
      const engineResult = detectConflicts(MOCK_PROJECTS);
      expect(engineResult.conflicts).toHaveLength(2);

      engineResult.conflicts.forEach((conflict) => {
        const road = MOCK_ROAD_SEGMENTS.find((r) => r.id === conflict.roadId);
        expect(road).toBeDefined();

        const pA = MOCK_PROJECTS.find((p) => p.id === conflict.projectAId)!;
        const pB = MOCK_PROJECTS.find((p) => p.id === conflict.projectBId)!;

        expect(pA.roadId).toBe(conflict.roadId);
        expect(pB.roadId).toBe(conflict.roadId);

        const expectedStart = Math.max(pA.segmentStartPct, pB.segmentStartPct);
        const expectedEnd = Math.min(pA.segmentEndPct, pB.segmentEndPct);

        expect(conflict.subsegmentOverlap.startPct).toBeCloseTo(expectedStart, 4);
        expect(conflict.subsegmentOverlap.endPct).toBeCloseTo(expectedEnd, 4);
        expect(conflict.subsegmentOverlap.overlapLengthPct).toBeCloseTo(
          expectedEnd - expectedStart,
          4
        );

        // Verify subsegment polyline on road has intermediate vertices and positive length
        const overlapPolyline = interpolateSubPolyline(
          road!.coordinates,
          conflict.subsegmentOverlap.startPct,
          conflict.subsegmentOverlap.endPct
        );
        expect(overlapPolyline.length).toBeGreaterThanOrEqual(2);
        const overlapLen = calculatePolylineGeodesicLengthMeters(overlapPolyline);
        expect(overlapLen).toBeGreaterThan(50); // Significant physical road section
      });
    });
  });
});
