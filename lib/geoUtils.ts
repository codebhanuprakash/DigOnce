import { LatLng } from './types';

/**
 * Calculates a sub-segment polyline between startPct (0.0 to 1.0) and endPct (0.0 to 1.0)
 * along a multi-point polyline.
 *
 * Uses piecewise linear interpolation based on cumulative segment lengths.
 */
export function interpolateSubPolyline(
  points: LatLng[],
  startPct: number,
  endPct: number
): LatLng[] {
  if (points.length < 2) return [...points];

  // Clamp percentages to [0, 1]
  const s = Math.max(0, Math.min(1, Math.min(startPct, endPct)));
  const e = Math.max(0, Math.min(1, Math.max(startPct, endPct)));

  if (Math.abs(e - s) < 0.0001) {
    // Single point approximation
    const pt = getPointAtPct(points, s);
    return [pt, pt];
  }

  // 1. Calculate cumulative lengths
  const cumLengths: number[] = [0];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dLat = points[i + 1].lat - points[i].lat;
    const dLng = points[i + 1].lng - points[i].lng;
    const segDist = Math.sqrt(dLat * dLat + dLng * dLng);
    totalLength += segDist;
    cumLengths.push(totalLength);
  }

  if (totalLength === 0) return [...points];

  const targetStartDist = s * totalLength;
  const targetEndDist = e * totalLength;

  const result: LatLng[] = [];

  // Start point
  result.push(getPointAtDistance(points, cumLengths, targetStartDist));

  // Intermediate original points that fall strictly inside [targetStartDist, targetEndDist]
  for (let i = 1; i < points.length - 1; i++) {
    const dist = cumLengths[i];
    if (dist > targetStartDist + 0.000001 && dist < targetEndDist - 0.000001) {
      result.push({ lat: points[i].lat, lng: points[i].lng });
    }
  }

  // End point
  result.push(getPointAtDistance(points, cumLengths, targetEndDist));

  return result;
}

function getPointAtPct(points: LatLng[], pct: number): LatLng {
  const cumLengths: number[] = [0];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dLat = points[i + 1].lat - points[i].lat;
    const dLng = points[i + 1].lng - points[i].lng;
    totalLength += Math.sqrt(dLat * dLat + dLng * dLng);
    cumLengths.push(totalLength);
  }
  return getPointAtDistance(points, cumLengths, pct * totalLength);
}

function getPointAtDistance(points: LatLng[], cumLengths: number[], dist: number): LatLng {
  if (dist <= 0) return { lat: points[0].lat, lng: points[0].lng };
  const total = cumLengths[cumLengths.length - 1];
  if (dist >= total) {
    const last = points[points.length - 1];
    return { lat: last.lat, lng: last.lng };
  }

  // Find segment
  for (let i = 0; i < cumLengths.length - 1; i++) {
    const d1 = cumLengths[i];
    const d2 = cumLengths[i + 1];
    if (dist >= d1 && dist <= d2) {
      const segLen = d2 - d1;
      const t = segLen > 0 ? (dist - d1) / segLen : 0;
      const p1 = points[i];
      const p2 = points[i + 1];
      return {
        lat: Number((p1.lat + t * (p2.lat - p1.lat)).toFixed(6)),
        lng: Number((p1.lng + t * (p2.lng - p1.lng)).toFixed(6)),
      };
    }
  }

  return { lat: points[0].lat, lng: points[0].lng };
}
