import { describe, it, expect } from 'vitest';
import {
  interpolateSubPolyline,
  haversineDistanceMeters,
  calculatePolylineGeodesicLengthMeters,
  isValidLatLng,
} from '../lib/geoUtils';
import { LatLng } from '../lib/types';
import { MOCK_ROAD_SEGMENTS } from '../lib/mockData';

describe('GIS Geodesic Subsegment Slicing & Geometry Processing', () => {
  // Simple L-shaped polyline: 3 vertices
  // (0,0) -> (0, 1) -> (1, 1) in lat/lng degrees
  const sampleRoad: LatLng[] = [
    { lat: 13.00, lng: 80.00 },
    { lat: 13.00, lng: 80.10 },
    { lat: 13.10, lng: 80.10 },
  ];

  describe('Haversine Distance & Length Utilities', () => {
    it('calculates 0 meters for identical points', () => {
      const p = { lat: 13.0418, lng: 80.2486 };
      expect(haversineDistanceMeters(p, p)).toBe(0);
    });

    it('calculates accurate distance between known Chennai coordinates', () => {
      // Roughly 1.8km along Anna Salai
      const p1 = { lat: 13.0280247, lng: 80.2353917 };
      const p2 = { lat: 13.0391271, lng: 80.2468172 };
      const d = haversineDistanceMeters(p1, p2);
      expect(d).toBeGreaterThan(1700);
      expect(d).toBeLessThan(2000);
    });

    it('validates coordinates accurately', () => {
      expect(isValidLatLng({ lat: 13.0, lng: 80.0 })).toBe(true);
      expect(isValidLatLng({ lat: 95.0, lng: 80.0 })).toBe(false);
      expect(isValidLatLng({ lat: NaN, lng: 80.0 })).toBe(false);
      expect(isValidLatLng(null)).toBe(false);
    });

    it('computes positive geodesic length of entire polyline', () => {
      const len = calculatePolylineGeodesicLengthMeters(sampleRoad);
      expect(len).toBeGreaterThan(20000); // ~22km
    });
  });

  describe('Subsegment Slicing along Polyline Centerline', () => {
    it('slices full extent (0.0 to 1.0) and preserves all vertices', () => {
      const result = interpolateSubPolyline(sampleRoad, 0.0, 1.0);
      expect(result).toHaveLength(3);
      expect(result[0].lat).toBeCloseTo(13.00, 4);
      expect(result[0].lng).toBeCloseTo(80.00, 4);
      expect(result[1].lat).toBeCloseTo(13.00, 4);
      expect(result[1].lng).toBeCloseTo(80.10, 4);
      expect(result[2].lat).toBeCloseTo(13.10, 4);
      expect(result[2].lng).toBeCloseTo(80.10, 4);
    });

    it('correctly handles curved roads with multiple vertices and preserves intermediate points', () => {
      const annaRoad = MOCK_ROAD_SEGMENTS.find(r => r.id === 'RD-CH-09-ANNA-01');
      expect(annaRoad).toBeDefined();
      expect(annaRoad!.coordinates.length).toBeGreaterThan(30);

      // Slice between 20% and 70% of Anna Salai
      const sub = interpolateSubPolyline(annaRoad!.coordinates, 0.20, 0.70);
      expect(sub.length).toBeGreaterThan(5); // Must contain multiple intermediate vertices

      // Start of subsegment must match 20% geodesic distance
      const totalLen = calculatePolylineGeodesicLengthMeters(annaRoad!.coordinates);
      const subLen = calculatePolylineGeodesicLengthMeters(sub);
      expect(subLen).toBeCloseTo(totalLen * 0.50, -1); // 0.70 - 0.20 = 0.50
    });

    it('interpolates accurately when a boundary falls between vertices', () => {
      // 25% of sampleRoad falls halfway through the first segment
      const sub = interpolateSubPolyline(sampleRoad, 0.25, 0.75);
      expect(sub.length).toBeGreaterThanOrEqual(3); // Start, corner vertex, End
      expect(sub[0].lat).toBeCloseTo(13.00, 3);
      expect(sub[0].lng).toBeCloseTo(80.05, 2);
    });

    it('handles different non-overlapping segment percentages on the same road', () => {
      const segA = interpolateSubPolyline(sampleRoad, 0.0, 0.3);
      const segB = interpolateSubPolyline(sampleRoad, 0.6, 0.9);

      // Verify no shared vertices between distant non-overlapping ranges
      expect(segA[segA.length - 1].lng).toBeLessThan(segB[0].lng);
    });

    it('handles strictly adjacent subsegments cleanly (touching boundary)', () => {
      const segA = interpolateSubPolyline(sampleRoad, 0.0, 0.5);
      const segB = interpolateSubPolyline(sampleRoad, 0.5, 1.0);

      expect(segA[segA.length - 1].lat).toBeCloseTo(segB[0].lat, 5);
      expect(segA[segA.length - 1].lng).toBeCloseTo(segB[0].lng, 5);
    });

    it('handles reversed boundary order (startPct > endPct) by normalizing consistently', () => {
      const normal = interpolateSubPolyline(sampleRoad, 0.2, 0.8);
      const reversed = interpolateSubPolyline(sampleRoad, 0.8, 0.2);

      expect(reversed).toEqual(normal);
    });

    it('handles reversed source-coordinate order gracefully', () => {
      const reversedRoad = [...sampleRoad].reverse();
      const sub = interpolateSubPolyline(reversedRoad, 0.0, 0.5);
      expect(sub.length).toBeGreaterThanOrEqual(2);
      expect(sub[0].lat).toBeCloseTo(reversedRoad[0].lat, 4);
    });

    it('rejects invalid inputs, NaN percentages, or zero-length geometries without crashing', () => {
      expect(interpolateSubPolyline([], 0.1, 0.5)).toEqual([]);
      expect(interpolateSubPolyline([{ lat: 13.0, lng: 80.0 }], 0.1, 0.5)).toHaveLength(1);
      expect(interpolateSubPolyline(sampleRoad, NaN, 0.5)).toEqual([]);
      expect(interpolateSubPolyline(sampleRoad, 0.1, Infinity)).toEqual([]);
    });

    it('correctly extracts the exact engine overlapping subsegment span', () => {
      // Overlap of [0.20, 0.70] and [0.40, 0.85] is [0.40, 0.70]
      const annaRoad = MOCK_ROAD_SEGMENTS.find(r => r.id === 'RD-CH-09-ANNA-01')!;
      const overlapSub = interpolateSubPolyline(annaRoad.coordinates, 0.40, 0.70);

      expect(overlapSub.length).toBeGreaterThan(2);
      const totalLen = calculatePolylineGeodesicLengthMeters(annaRoad.coordinates);
      const overlapLen = calculatePolylineGeodesicLengthMeters(overlapSub);
      expect(overlapLen).toBeCloseTo(totalLen * 0.30, -1);
    });
  });
});
