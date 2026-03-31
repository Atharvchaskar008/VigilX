import type { Permit } from './types';

// Local helper type.
type Coordinates = { lat: number; lng: number };

export type PermitMatchResult = {
  verdict: 'LikelyViolation' | 'LikelyPermitted';
  confidence: number; // 0-1
  rationale: string;
  matchedPermitIds: string[];
  timeMatched: boolean;
  locationMatched: boolean;
  matchScore: number; // 0-1
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(a: Coordinates, b: Coordinates) {
  const R = 6371000; // Earth radius
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stringLocationMatch(a: string, b: string) {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  return na.includes(nb) || nb.includes(na);
}

export function matchPermits(params: {
  incidentTimeIso: string;
  coordinates: Coordinates;
  locationLabel: string;
  permits: Permit[];
}): PermitMatchResult {
  const incidentTime = new Date(params.incidentTimeIso);

  let bestScore = 0;
  let bestPermitId: string | undefined;
  const matchedPermitIds: string[] = [];

  let anyTimeMatched = false;
  let anyLocationMatched = false;

  for (const permit of params.permits) {
    const start = new Date(permit.startTime);
    const end = new Date(permit.endTime);

    const timeMatched = incidentTime >= start && incidentTime <= end;
    if (timeMatched) anyTimeMatched = true;

    let locationMatched = false;
    let locationScore = 0;

    if (permit.geofence) {
      const dist = haversineDistanceMeters(params.coordinates, permit.geofence.center);
      anyLocationMatched = anyLocationMatched || dist <= permit.geofence.radiusMeters;
      locationMatched = dist <= permit.geofence.radiusMeters;
      locationScore = Math.max(0, Math.min(1, 1 - dist / (permit.geofence.radiusMeters || 1)));
    } else {
      locationMatched = stringLocationMatch(params.locationLabel, permit.location);
      anyLocationMatched = anyLocationMatched || locationMatched;
      locationScore = locationMatched ? 1 : 0;
    }

    const scoreTime = timeMatched ? 1 : 0;
    const score = scoreTime * 0.7 + locationScore * 0.3;

    if (score >= bestScore) {
      bestScore = score;
      bestPermitId = permit.id;
    }

    if (timeMatched && locationMatched) {
      matchedPermitIds.push(permit.id);
    }
  }

  const timeMatched = anyTimeMatched;
  const locationMatched = anyLocationMatched;
  const verdict: PermitMatchResult['verdict'] =
    matchedPermitIds.length > 0 ? 'LikelyPermitted' : 'LikelyViolation';

  const confidence = Math.max(0, Math.min(1, bestScore));

  const rationale =
    verdict === 'LikelyPermitted'
      ? `Incident falls within an active permit window and within the permitted area.`
      : `Incident time/location does not match any permit. Best match: ${bestPermitId ?? 'none'} (score ${Math.round(
          confidence * 100
        )}%).`;

  return {
    verdict,
    confidence,
    rationale,
    matchedPermitIds,
    timeMatched,
    locationMatched,
    matchScore: confidence,
  };
}

