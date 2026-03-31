import { db, storage } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { NoiseReport, Permit } from '../domain/types';
import { matchPermits } from '../domain/permitMatcher';

export async function submitReport(data: {
  type: NoiseReport['type'];
  summary: string;
  coordinates: { lat: number; lng: number };
  location: string;
  incidentTimeIso: string;
  audioBlob?: Blob | File | null;
  videoBlob?: Blob | File | null;
}): Promise<string> {
  const reportId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
  let audioUrl: string | undefined;
  let videoUrl: string | undefined;

  const inferExt = (blobOrFile: Blob | File, fallback: string) => {
    const name = 'name' in blobOrFile ? (blobOrFile as File).name : '';
    if (name.includes('.')) return name.split('.').pop() || fallback;
    if (blobOrFile.type.includes('/')) return blobOrFile.type.split('/').pop() || fallback;
    return fallback;
  };

  if (data.audioBlob) {
    const ext = inferExt(data.audioBlob, 'webm');
    const storageRef = ref(storage, `evidence/${reportId}/audio.${ext}`);
    await uploadBytes(storageRef, data.audioBlob);
    audioUrl = await getDownloadURL(storageRef);
  }

  if (data.videoBlob) {
    const ext = inferExt(data.videoBlob, 'mp4');
    const storageRef = ref(storage, `evidence/${reportId}/video.${ext}`);
    await uploadBytes(storageRef, data.videoBlob);
    videoUrl = await getDownloadURL(storageRef);
  }

  const permits = await getPermits();
  const match = matchPermits({
    incidentTimeIso: data.incidentTimeIso,
    coordinates: data.coordinates,
    locationLabel: data.location,
    permits,
  });

  const riskLevel: NoiseReport['riskLevel'] =
    match.verdict === 'LikelyPermitted'
      ? 'Low'
      : match.confidence >= 0.65
        ? 'High'
        : 'Medium';

  const docData: Record<string, any> = {
    reportId,
    timestamp: Timestamp.fromDate(new Date(data.incidentTimeIso)),
    location: data.location,
    type: data.type,
    riskLevel,
    status: 'Pending',
    summary: data.summary,
    coordinates: data.coordinates,
    evidence: {
      audioUrl,
      videoUrl,
    },
    ai: {
      verdict: match.verdict,
      confidence: match.confidence,
      rationale: match.rationale,
      matchedPermitIds: match.matchedPermitIds,
      timeMatched: match.timeMatched,
      locationMatched: match.locationMatched,
      matchScore: match.matchScore,
    },
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'complaints'), docData);
  return docRef.id;
}

export function subscribeToPoliceFeed(callback: (reports: NoiseReport[]) => void) {
  const q = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(d => {
      const data = d.data();
      const anyData = data as any;

      const fallbackEvidence = (() => {
        const evidence = anyData.evidence || {};
        // Backward compatibility with old schema: mediaUrl + mediaType
        if (!evidence.audioUrl && anyData.mediaUrl && anyData.mediaType === 'audio') {
          return { ...evidence, audioUrl: anyData.mediaUrl };
        }
        if (!evidence.videoUrl && anyData.mediaUrl && anyData.mediaType === 'video') {
          return { ...evidence, videoUrl: anyData.mediaUrl };
        }
        return evidence;
      })();

      const fallbackAi = (() => {
        if (anyData.ai) return anyData.ai;
        const severity = anyData.riskLevel ?? anyData.severity ?? 'Medium';
        const verdict =
          severity === 'High' ? 'LikelyViolation' : 'LikelyPermitted';
        return {
          verdict,
          confidence: typeof anyData.confidence === 'number' ? anyData.confidence : (severity === 'High' ? 0.75 : 0.45),
          rationale: 'Legacy report: inferred verdict from stored risk/severity.',
          matchedPermitIds: [],
          timeMatched: false,
          locationMatched: false,
          matchScore: typeof anyData.confidence === 'number' ? anyData.confidence : (severity === 'High' ? 0.7 : 0.4),
        };
      })();

      return {
        id: d.id,
        ...data,
        timestamp: anyData.timestamp?.toDate?.()?.toISOString() || anyData.createdAt,
        riskLevel: anyData.riskLevel ?? anyData.severity ?? 'Medium',
        evidence: fallbackEvidence,
        ai: fallbackAi,
      };
    }) as NoiseReport[];
    callback(reports);
  });
}

export async function updateReportStatus(id: string, status: NoiseReport['status']) {
  const ref = doc(db, 'complaints', id);
  await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
}

export async function getPermits(): Promise<Permit[]> {
  const snapshot = await getDocs(collection(db, 'permits'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Permit[];
}

export async function seedInitialData() {
  const compRef = collection(db, 'complaints');
  const snap = await getDocs(compRef);
  if (snap.size > 0) return; // Already seeded

  const mockComplaints = [
    {
      reportId: 'R-4829',
      timestamp: Timestamp.now(),
      location: '128 Sector 7, Downtown',
      type: 'Music',
      riskLevel: 'High',
      status: 'Pending',
      summary: 'Extreme bass from Level 9 Club. Exceeding 85dB limit.',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      evidence: { audioUrl: '', videoUrl: '' },
      ai: {
        verdict: 'LikelyViolation',
        confidence: 0.9,
        rationale: 'Mock: out of permit window or location.',
        matchedPermitIds: ['P-5521'],
        timeMatched: false,
        locationMatched: false,
        matchScore: 0.9,
      },
      createdAt: new Date().toISOString()
    },
    {
      reportId: 'R-5102',
      timestamp: Timestamp.now(),
      location: 'Industrial Zone A',
      type: 'Construction',
      riskLevel: 'Medium',
      status: 'Verified',
      summary: 'After-hours drilling at the Central Spire site.',
      coordinates: { lat: 40.7306, lng: -73.9352 },
      evidence: { audioUrl: '', videoUrl: '' },
      ai: {
        verdict: 'LikelyViolation',
        confidence: 0.65,
        rationale: 'Mock: time mismatch for permit.',
        matchedPermitIds: ['P-5522'],
        timeMatched: false,
        locationMatched: true,
        matchScore: 0.65,
      },
      createdAt: new Date().toISOString()
    }
  ];

  const mockPermits = [
    {
      eventName: 'Sector 7 Block Party',
      organizer: 'Downtown Community Board',
      location: 'Main St & 4th Ave',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 14400000).toISOString(),
      maxDb: 85,
      status: 'Active'
      ,
      geofence: {
        center: { lat: 40.7128, lng: -74.0060 },
        radiusMeters: 800
      }
    },
    {
      eventName: 'Central Transit Hub Construction',
      organizer: 'City Infrastructure Dept',
      location: 'Hub Plaza',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 259200000).toISOString(),
      maxDb: 75,
      status: 'Upcoming',
      geofence: {
        center: { lat: 40.7306, lng: -73.9352 },
        radiusMeters: 1200
      }
    }
  ];

  for (const c of mockComplaints) await addDoc(collection(db, 'complaints'), c);
  for (const p of mockPermits) await addDoc(collection(db, 'permits'), p);
}
