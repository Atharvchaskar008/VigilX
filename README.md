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
