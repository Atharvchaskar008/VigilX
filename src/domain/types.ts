export interface NoiseReport {
  id: string;
  timestamp: string; // ISO incident time provided by user (used for permit matching)
  location: string; // human readable location label (may be derived from GPS)
  type: 'Music' | 'Construction' | 'Traffic' | 'Fireworks' | 'Other';
  riskLevel: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Verified' | 'Resolved' | 'Dismissed';
  summary: string;
  coordinates: { lat: number; lng: number };
  evidence: {
    audioUrl?: string;
    videoUrl?: string;
  };
  ai: {
    verdict: 'LikelyViolation' | 'LikelyPermitted';
    confidence: number; // 0-1 (derived from time+location match)
    rationale: string;
    matchedPermitIds: string[];
    timeMatched: boolean;
    locationMatched: boolean;
    matchScore: number; // 0-1
  };
}

export interface Permit {
  id: string;
  eventName: string;
  organizer: string;
  location: string;
  startTime: string;
  endTime: string;
  maxDb?: number;
  status: 'Active' | 'Upcoming' | 'Expired';
  // Optional geofence for better permit matching.
  // If missing, we fall back to string matching on `location`.
  geofence?: {
    center: { lat: number; lng: number };
    radiusMeters: number;
  };
}

export type Theme = 'light' | 'dark';
