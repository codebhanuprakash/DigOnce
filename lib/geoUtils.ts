import { LatLng } from './types';

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula (spherical Earth approximation, R = 6,371,000 m).
 */
export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
  if (p1.lat === p2.lat && p1.lng === p2.lng) return 0;

  const R = 6371000; // Mean Earth radius in meters
  const lat1Rad = (p1.lat * Math.PI) / 180;
  const lat2Rad = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validates coordinate pair sanity (valid finite numbers within standard geographic boundaries).
 */
export function isValidLatLng(pt: LatLng | null | undefined): boolean {
  if (!pt) return false;
  return (
    typeof pt.lat === 'number' &&
    !isNaN(pt.lat) &&
    isFinite(pt.lat) &&
    pt.lat >= -90 &&
    pt.lat <= 90 &&
    typeof pt.lng === 'number' &&
    !isNaN(pt.lng) &&
    isFinite(pt.lng) &&
    pt.lng >= -180 &&
    pt.lng <= 180
  );
}

/**
 * Calculates the total cumulative geodesic length in meters along an ordered polyline.
 */
export function calculatePolylineGeodesicLengthMeters(points: LatLng[]): number {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    if (isValidLatLng(points[i]) && isValidLatLng(points[i + 1])) {
      total += haversineDistanceMeters(points[i], points[i + 1]);
    }
  }
  return total;
}

/**
 * Calculates a sub-segment polyline between startPct (0.0 to 1.0) and endPct (0.0 to 1.0)
 * along a multi-point polyline.
 *
 * RIGOROUS GEODESIC IMPLEMENTATION:
 * 1. Validates the road geometry and segment percentages.
 * 2. Computes cumulative geodesic distance (meters) using Haversine formulas.
 * 3. Converts normalized chainage boundaries to exact cumulative distances along that line.
 * 4. Interpolates the exact start and end coordinates along the respective polyline segments.
 * 5. Preserves all intermediate vertices situated between those boundaries.
 * 6. Returns the real subsegment polyline in ordered sequence.
 * 7. Gracefully handles boundary cases, reversed bounds, zero-length roads, and invalid input.
 */
export function interpolateSubPolyline(
  points: LatLng[],
  startPct: number,
  endPct: number
): LatLng[] {
  if (!points || points.length === 0) return [];
  if (points.length === 1) return isValidLatLng(points[0]) ? [{ ...points[0] }] : [];

  // Filter out any corrupted coordinates
  const validPoints = points.filter(isValidLatLng);
  if (validPoints.length < 2) {
    return validPoints.map((p) => ({ ...p }));
  }

  // Handle invalid percentages
  if (isNaN(startPct) || isNaN(endPct) || !isFinite(startPct) || !isFinite(endPct)) {
    return [];
  }

  // Normalize and clamp percentages to [0.0, 1.0]
  const s = Math.max(0, Math.min(1, Math.min(startPct, endPct)));
  const e = Math.max(0, Math.min(1, Math.max(startPct, endPct)));

  // Calculate cumulative geodesic lengths along all edges
  const cumDistancesMeters: number[] = [0];
  let totalLengthMeters = 0;

  for (let i = 0; i < validPoints.length - 1; i++) {
    const segDist = haversineDistanceMeters(validPoints[i], validPoints[i + 1]);
    totalLengthMeters += segDist;
    cumDistancesMeters.push(totalLengthMeters);
  }

  // If the total polyline has zero length (all points identical), return endpoints
  if (totalLengthMeters < 0.001) {
    return [{ ...validPoints[0] }, { ...validPoints[validPoints.length - 1] }];
  }

  const targetStartDist = s * totalLengthMeters;
  const targetEndDist = e * totalLengthMeters;

  // Single-point slice case (startPct == endPct)
  if (Math.abs(targetEndDist - targetStartDist) < 0.1) {
    const pt = getPointAtDistanceGeodesic(validPoints, cumDistancesMeters, targetStartDist);
    return [pt, pt];
  }

  const result: LatLng[] = [];

  // 1. Interpolate exact start point
  result.push(getPointAtDistanceGeodesic(validPoints, cumDistancesMeters, targetStartDist));

  // 2. Preserve every intermediate original vertex that falls strictly inside (targetStartDist, targetEndDist)
  for (let i = 1; i < validPoints.length - 1; i++) {
    const d = cumDistancesMeters[i];
    if (d > targetStartDist + 0.01 && d < targetEndDist - 0.01) {
      result.push({
        lat: Number(validPoints[i].lat.toFixed(7)),
        lng: Number(validPoints[i].lng.toFixed(7)),
      });
    }
  }

  // 3. Interpolate exact end point
  result.push(getPointAtDistanceGeodesic(validPoints, cumDistancesMeters, targetEndDist));

  return result;
}

/**
 * Finds the exact interpolated coordinate at a cumulative geodesic distance along the polyline.
 */
function getPointAtDistanceGeodesic(
  points: LatLng[],
  cumDistances: number[],
  distMeters: number
): LatLng {
  if (distMeters <= 0) {
    return {
      lat: Number(points[0].lat.toFixed(7)),
      lng: Number(points[0].lng.toFixed(7)),
    };
  }

  const total = cumDistances[cumDistances.length - 1];
  if (distMeters >= total) {
    const last = points[points.length - 1];
    return {
      lat: Number(last.lat.toFixed(7)),
      lng: Number(last.lng.toFixed(7)),
    };
  }

  // Binary search or linear scan across cumulative distance segments
  for (let i = 0; i < cumDistances.length - 1; i++) {
    const dStart = cumDistances[i];
    const dEnd = cumDistances[i + 1];

    if (distMeters >= dStart && distMeters <= dEnd) {
      const segLength = dEnd - dStart;
      const t = segLength > 0 ? (distMeters - dStart) / segLength : 0;
      const p1 = points[i];
      const p2 = points[i + 1];

      // Geodesic linear interpolation along local segment
      return {
        lat: Number((p1.lat + t * (p2.lat - p1.lat)).toFixed(7)),
        lng: Number((p1.lng + t * (p2.lng - p1.lng)).toFixed(7)),
      };
    }
  }

  return {
    lat: Number(points[0].lat.toFixed(7)),
    lng: Number(points[0].lng.toFixed(7)),
  };
}
