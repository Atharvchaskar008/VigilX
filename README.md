VigilX – AI-Assisted Noise Violation Reporting
VigilX is an MVP web app that lets citizens upload audio/video evidence of noise disturbances. The system does not rely on phone loudness measurements. Instead, it uses time + location + permit data to suggest whether a disturbance is likely permitted or likely a violation and forwards everything to a police command center for final on-ground judgement.

Problem
Cities issue noise permits for events, construction, etc., with time windows and sometimes location limits.
Residents often experience disturbing noise and don’t know whether it is:
Within a valid permit, or
An illegal disturbance.
Existing apps that try to measure dB levels on phones are:
Inaccurate (phone mics, distance, environment).
Legally weak as evidence.
Hard to align with official permit rules.
Authorities need subjective citizen evidence (audio/video + notes) combined with objective context (permits, time, location) to decide what to do.

Solution
VigilX provides a citizen-to-HQ pipeline that looks like this:

Citizen report (field unit)

User records or uploads audio and/or video of the disturbance.
User sets the incident time (when noise occurred).
App captures GPS location and lets user add a human-readable location label.
User adds notes describing what’s happening.
AI permit matching (backend logic)

The system loads active permits (time windows, locations, optional geofences).
It compares the incident time + coordinates + location label against the permit list.
It produces an AI suggestion:
LikelyPermitted or LikelyViolation
Confidence score, match score, and a rationale.
This suggestion is only an assistant for HQ, not a legal verdict.
Command Center view (police HQ)

HQ sees a real-time feed of incoming reports.
Each report contains:
Audio/video evidence,
Incident time and geo-coordinates,
Citizen notes,
AI permit match verdict + confidence and which permits matched.
Officers can:
Mark as Verified, Resolved, or Dismissed.
Use the AI suggestion + on-ground knowledge to decide final action.
The key design choice: No dB calculations are used to declare violations. Audio/video is evidence, but the “smart” part is contextual permit matching, not phone-level meters.

Tech Stack
Frontend

React 19 + TypeScript
React Router
motion (Framer Motion v6 API) for animations
Tailwind-style utilities + clsx + tailwind-merge
lucide-react icons
Vite 6 for dev bundling + HMR
PWA support via vite-plugin-pwa
Backend / Infra

Firebase Authentication
Firestore (complaints, permits collections)
Firebase Storage (audio/video evidence)
Optional offline-friendly “mock mode” (via TypeScript types and fallbacks, if Firebase is not fully configured)
Other

TypeScript strict-ish config (moduleResolution: bundler, noEmit)
Node / npm for tooling
System Architecture
High-Level View
Web Client (React)

Feature modules:
Report – citizen upload + incident metadata
Permits – public permit registry
CommandCenter – HQ verification console
Home – landing + onboarding
Uses Auth context for user/guest sessions.
Uses Theme context (light/dark) for UI.
Domain Layer

Types
NoiseReport – canonical shape of a report:
id, timestamp, location, type (Music, Construction, etc.)
riskLevel (High, Medium, Low)
status (Pending, Verified, Resolved, Dismissed)
coordinates (lat/lng)
evidence { audioUrl?, videoUrl? }
ai { verdict, confidence, rationale, matchedPermitIds[], timeMatched, locationMatched, matchScore }
Permit – permit metadata:
id, eventName, organizer, location, startTime, endTime
maxDb? (optional, informational)
status (Active, Upcoming, Expired)
Optional geofence (center coordinates + radius in meters) for better matches.
Permit Matcher
Haversine distance for geo matching.
Time window check (incidentTime in [start, end]).
Location similarity:
Prefer geofence (distance ≤ radius),
Else fallback to location string normalization and substring matching.
Produces:
verdict: LikelyPermitted if any strong match, else LikelyViolation
confidence and matchScore (0–1)
Flags for timeMatched / locationMatched
matchedPermitIds list of best matches
Human-readable rationale.
Infra Layer

Firebase
firebase.ts: initializes auth, db, storage from .env (VITE_FIREBASE_*).
Report Service
submitReport():
Uploads audio/video to Storage.
Fetches active permits from Firestore.
Runs the permit matcher with: incidentTime, coordinates, location label, permits.
Derives riskLevel from verdict + confidence.
Stores a complaints document with evidence + ai block.
subscribeToPoliceFeed():
Live Firestore listener on complaints, ordered by timestamp.
Normalizes legacy docs and ensures evidence and ai are always present.
updateReportStatus():
Patches status field for HQ decisions.
getPermits():
Fetches permits collection for both registry UI and AI matcher.
seedInitialData():
Optional seeding of mock complaints + permits for demo.
Feature Layer

features/report/ReportPage
Upload audio file and/or video file (no “live waveform/analyzer”).
Set incident time via datetime picker.
Optional location label (string) to improve permit matching; otherwise GPS label.
Notes text area for human description.
Sends everything to submitReport(); shows success screen with report ID.
features/command/CommandCenterPage
Left: filtered list of reports (Pending, Verified, Resolved, Dismissed).
Right: detail view showing:
Audio player / video player.
Citizen notes.
AI Permit Verdict card (LikelyViolation vs LikelyPermitted, confidence, rationale).
Match factors (time matched/location matched/score).
Matched permit IDs.
Geo card with coordinates and formatted incident time.
HQ actions: Deploy Unit (Verified), Log Warning (Resolved), Dismiss.
features/permits/PermitsPage
Grid and table views for permits.
Shows time windows, max dB, status, etc.
features/home/HomePage
Marketing-style hero explaining how VigilX works.
Entry points to Report, Permits, and Command.
UI / Auth

ui/Navbar – top navigation with:
Links: Home, Report, Permits, Command.
Dark/light toggle.
Auth menu (user avatar, sign in/out).
ui/AuthModal – email/password + register + guest login.
ui/ThemeProvider – manages theme state and applies classes to <html>.
auth/AuthContext – wraps Firebase Auth into simple hooks for the rest of the app.
Folder Structure (MVP)
src/
  app/
    App.tsx              # Routing + layout + providers
  auth/
    AuthContext.tsx      # Auth hooks (Firebase-based)
  ui/
    Navbar.tsx
    AuthModal.tsx
    ThemeProvider.tsx
  features/
    home/
      HomePage.tsx
    report/
      ReportPage.tsx
    permits/
      PermitsPage.tsx
    command/
      CommandCenterPage.tsx
  domain/
    types.ts             # NoiseReport, Permit, Theme
    permitMatcher.ts     # Time+location permit matching logic
  infra/
    firebase.ts          # Firebase initialization
    reportService.ts     # Firestore/Storage integration
  lib/
    utils.ts             # cn() helper (clsx + tailwind-merge)
  index.css
  main.tsx
  vite-env.d.ts
This structure is intentionally feature-first (home/report/permits/command) with domain and infra isolated, so it’s easy to evolve into more micro-service or multi-client setups later.

Getting Started
Install Node.js (LTS) if you haven’t.

Clone / open the repo, then from the app folder:

cd vigilx        # if at the top project folder
cd vigilx        # second level: the actual Vite app
npm install
Configure environment variables in .env (or .env.local):

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
Run the app locally:

npm run dev
Then open: http://localhost:3000

How the AI Verdict Works (in one paragraph)
When a citizen submits a report, the system does not look at audio levels. It takes the incident time and coordinates (plus optional location label), looks up all permits from Firestore, and for each permit it scores: “Is this the right time?” and “Is this the right place?” using time window checks and geofence/string matching. The best score plus whether any permits strongly match are turned into a simple label: Likely Permitted vs Likely Violation, with a confidence percentage, a match score, and an explanation. This is sent to HQ as decision support only; real officers still make the final call.

Possible Next Steps
Add a reverse-geocoding step to convert GPS into street names automatically.
Improve permit editor so authorities can define geofences visually on a map.
Add history & analytics for repeated offenders/zones.
Add mobile-optimized PWA behaviors (offline queueing of reports, background sync)
