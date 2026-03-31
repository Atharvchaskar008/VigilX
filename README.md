## VigilX – AI-Assisted Noise Violation Reporting

VigilX is an MVP web app that lets citizens upload **audio/video evidence** of noise disturbances.  
The system does **not** rely on phone loudness (dB) readings.  
Instead, it uses **time + location + official permits** to produce an **AI suggestion** for police, while the **final verdict is always made on-ground by authorities**.

---

## Problem

- Cities issue **noise permits** for events, construction, and other activities, with specific **time windows** and sometimes **location limits**.
- Residents often cannot tell if a disturbing noise is:
  - Covered by a **valid permit**, or  
  - An **illegal disturbance**.
- Apps that try to measure noise with the **phone microphone** are:
  - Technically **inaccurate** (different phones, distance, reflections),
  - Hard to connect to **permit rules**,
  - Weak as **legal evidence**.

Authorities need **citizen evidence (audio/video + notes)** combined with **objective context (time, location, permits)** to make a decision.

---

## Solution

VigilX focuses on **reporting + AI permit matching**, not on raw dB analysis.

1. **Citizen report**
   - User uploads **audio** and/or **video** of the disturbance.
   - User sets the **incident time** (when the noise happened).
   - App captures **GPS coordinates** and allows a **free-text location label** (e.g. “Main St & 4th Ave”).
   - User adds **notes** with extra context (what’s happening, how often, etc.).

2. **AI permit matching (suggestion only)**
   - System reads **permits** (time windows, location strings, optional geofences).
   - Uses the incident **time + coordinates + label** to:
     - Check if the time falls inside any permit window.
     - Check if the location is inside a permit geofence, or matches its location text.
   - Returns an **AI verdict**:
     - `LikelyPermitted` or `LikelyViolation`
     - With a **confidence score**, **match score**, and a short **rationale**.
   - This is **only a suggestion**; real officers decide the outcome.

3. **Command Center (police HQ)**
   - Real-time feed of all incoming reports.
   - For each report, HQ sees:
     - Audio player / video player,
     - Incident time and coordinates,
     - Citizen notes,
     - AI permit verdict + confidence + which permits matched.
   - HQ can mark reports as `Pending`, `Verified`, `Resolved`, or `Dismissed` based on **on-ground checks**.

---

## Tech Stack

- **Frontend**
  - React 19 + TypeScript
  - React Router
  - `motion` (Framer Motion v6 API) for animations
  - Tailwind-style styling using `clsx` + `tailwind-merge`
  - `lucide-react` icon set
  - Vite 6 (bundler + dev server)
  - `vite-plugin-pwa` for PWA support  

- **Backend / Infra**
  - Firebase Authentication
  - Firestore (collections: `complaints`, `permits`)
  - Firebase Storage (audio/video evidence)

- **Tooling**
  - TypeScript (`tsc --noEmit` for lint)
  - Node.js / npm

---

## System Architecture

### High-Level Components

- **Web Client (React / Vite)**
  - `Home` – landing page and onboarding.
  - `Report` – citizen uploads + incident metadata.
  - `Permits` – public registry, showing authorized events/operations.
  - `Command Center` – HQ console to review and act on reports.

- **Domain Layer (`src/domain`)**
  - `types.ts`
    - `NoiseReport`:
      - `id`, `timestamp`, `location`
      - `type` (`Music`, `Construction`, `Traffic`, `Fireworks`, `Other`)
      - `riskLevel` (`High`, `Medium`, `Low`) – derived from permit match.
      - `status` (`Pending`, `Verified`, `Resolved`, `Dismissed`)
      - `coordinates` (`{ lat, lng }`)
      - `evidence`: `{ audioUrl?: string; videoUrl?: string }`
      - `ai`:
        - `verdict`: `LikelyPermitted` | `LikelyViolation`
        - `confidence`, `matchScore` (0–1)
        - `rationale`
        - `matchedPermitIds[]`
        - `timeMatched`, `locationMatched`
    - `Permit`:
      - `id`, `eventName`, `organizer`, `location`
      - `startTime`, `endTime`
      - `maxDb?` (optional informational field)
      - `status`: `Active` | `Upcoming` | `Expired`
      - Optional `geofence` (center `{lat,lng}`, `radiusMeters`) for spatial matching.
  - `permitMatcher.ts`
    - Uses **Haversine distance** for geofenced permits.
    - Checks **incident time ∈ [startTime, endTime]**.
    - Checks **location string similarity** if no geofence.
    - Produces a `PermitMatchResult` containing verdict, confidence, matchScore, factors, and matched permits.

- **Infra Layer (`src/infra`)**
  - `firebase.ts` – Firebase app initialization (`auth`, `db`, `storage`) using `.env` variables.
  - `reportService.ts`:
    - `submitReport()`:
      - Uploads audio/video to Storage (file-based, not audio level).
      - Loads permits from Firestore.
      - Runs the permit matcher with incident time + location.
      - Builds and writes a `complaints` document with evidence + `ai` verdict.
    - `subscribeToPoliceFeed()`:
      - Listens to `complaints` in real time (`onSnapshot`).
      - Normalizes legacy documents to always expose `evidence` and `ai`.
    - `updateReportStatus()` – updates the status from HQ.
    - `getPermits()` – loads the `permits` collection.
    - `seedInitialData()` – seeds demo complaints + permits.

- **Feature Layer (`src/features`)**
  - `home/HomePage.tsx`
    - Marketing / explanation of “Noise enforced” concept.
    - Buttons to **Access system**, **Report**, **Public registry**, **Command**.
  - `report/ReportPage.tsx`
    - Upload audio and/or video files.
    - Pick **incident time** via datetime-local input.
    - Optional **location label**; otherwise uses GPS-based label.
    - Notes textarea for detailed description.
    - Calls `submitReport()` and shows a success screen with the report ID.
  - `permits/PermitsPage.tsx`
    - Grid and table views of permits.
    - Shows status, time windows, location, and max dB when available.
  - `command/CommandCenterPage.tsx`
    - List of reports with filters by status.
    - Detail view with:
      - Audio / video playback.
      - Citizen notes.
      - AI permit verdict + confidence + rationale.
      - Time/Location match flags and matched permit IDs.
      - Geo info (location + coordinates + incident time).
    - Buttons for HQ:
      - `Deploy Unit` → marks `Verified`.
      - `Log Warning` → marks `Resolved`.
      - `Dismiss` → marks `Dismissed`.

- **UI + Auth**
  - `auth/AuthContext.tsx` – wraps Firebase Auth into `useAuth` hook (user, loading, login/register/guest/logout).
  - `ui/ThemeProvider.tsx` – manages dark/light mode using localStorage + CSS classes.
  - `ui/Navbar.tsx` – main navigation with theme toggle and user menu.
  - `ui/AuthModal.tsx` – sign-in, register, and guest access modal.

- **App Shell (`src/app/App.tsx`)**
  - Wraps everything with:
    - `<AuthProvider>` – authentication.
    - `<ThemeProvider>` – theme.
    - React Router `<Router>` and `<Routes>` for:
      - `/` → Home
      - `/report` → Report (protected, requires auth/guest)
      - `/permits` → Public registry
      - `/command` → Command center (protected)

---

## Folder Structure

```text
src/
  app/
    App.tsx
  auth/
    AuthContext.tsx
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
    types.ts
    permitMatcher.ts
  infra/
    firebase.ts
    reportService.ts
  lib/
    utils.ts
  index.css
  main.tsx
  vite-env.d.ts
```

---

## Running the App Locally

### 1. Prerequisites

- **Node.js** (LTS recommended, e.g. 18+)
- **npm** (comes with Node)

### 2. Install dependencies

From the Vite app folder:

```bash
cd vigilx/vigilx
npm install
```

### 3. Configure environment variables

Create `.env` (or `.env.local`) in `vigilx/vigilx`:

```bash
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

If Firebase is not fully configured yet, the app can still be demoed with mocked or partial data, but upload/storage functionality requires valid config.

### 4. Start the dev server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

You can:

- Browse **Home** to understand the concept.
- Use **Report** to upload an incident (audio/video + time + notes).
- Check **Permits** to see registered operations.
- Open **Command** to view AI suggestions and simulate HQ decisions.

---

## Future Directions

- Add reverse geocoding to convert GPS → human-readable addresses automatically.
- Add permit management UI for authorities (edit time windows, geofences).
- Enhance analytics for repeated offenders / hotspot mapping.
- Improve offline capabilities and background sync for poor-network scenarios.

=======
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
>>>>>>> ec3abe1abefc54fbc1939b11f0ef2202af3ccd57
