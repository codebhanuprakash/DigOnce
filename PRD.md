# Product Requirements Document (PRD): DigOnce

**Product Name:** DigOnce (Chennai–Kancheepuram Civic Works Coordination Portal)  
**Status:** Approved Specification  
**Version:** 1.0  
**Target Delivery Window:** Hackathon Timeline (~21.5 hours remaining, Deadline: 10-Oct 20:30 IST)

---

## 1. Problem Statement
In urban India (specifically demonstrated through the Greater Chennai Corporation [GCC] and Kancheepuram districts), municipal roads are repeatedly excavated by siloed infrastructure agencies (e.g., GCC Roads, CMWSSB Water & Sewerage, TANGEDCO Electricity Board, telecom operators, and CMRL Metro Rail). 

A newly laid bitumen road is frequently dug up within weeks or months by another agency, wasting public capital, worsening traffic congestion, damaging underground utilities, and causing severe citizen frustration. Current inter-agency coordination relies on paper NOCs (No Objection Certificates) without spatial-temporal visibility or automated conflict detection.

## 2. Target Users & Personas

1. **Municipal Executive Engineer / Ward Officer (GCC / CMWSSB / TANGEDCO)**
   - *Needs:* Spatial map view of all upcoming and active road cuts across jurisdictions; instant notification of repeat-dig conflicts on identical road segments; capability to adjust schedules or coordinate trench-sharing.
2. **Civic Oversight Official / Urban Planner**
   - *Needs:* Ward-level excavation metrics, repeat-dig density hotspots, estimated financial waste/savings calculation from trench sharing.
3. **Engaged Citizen / Ward Committee Member / Journalist**
   - *Needs:* Public transparency portal to inspect active works on their street, identify responsible contractors and agencies, check completion deadlines, and report untracked or stalled excavations.

---

## 3. Value Proposition & Core Differentiator
- **Deterministic Repeat-Dig Conflict Engine:** Unlike opaque AI guesses or naive bounding-box coordinate proximity (which causes false alarms on parallel streets or overpasses), DigOnce evaluates exact road segment identity (`roadId`), linear excavation chainage, and temporal scheduling intervals (with configurable moratorium windows post-resurfacing) to pinpoint preventable duplicate excavations.
- **Explainable Civic Coordination:** Provides clear conflict evidence (e.g., *"CMWSSB pipeline dig scheduled 12 days after GCC re-laying on Anna Salai Segment #104; recommend joint trenching to avoid ₹4.2 Lakh duplicate restoration cost"*).
- **Lightweight, Responsive GIS Interface:** Real-time spatial exploration optimized for standard web and tablet viewports without expensive proprietary map licenses.

---

## 4. Minimum Viable Product (MVP) Scope

### 4.1. Interactive Map Canvas
- Interactive Leaflet-powered GIS map centered on Chennai–Kancheepuram corridor (`[13.0827, 80.2707]`).
- Vector rendering for road segments, active excavation polygons, and trench lines categorized by civic agency color tokens.
- Dynamic clustering/markers for municipal work sites with status badges (Planned, Active, Completed, Moratorium).
- OpenStreetMap / CARTO Positron tile layer with required ODbL attribution.

### 4.2. Project Explorer & Filtering
- Collapsible sidebar providing faceted filtering by:
  - **Agency** (GCC, CMWSSB, TANGEDCO, Telecom, CMRL)
  - **Work Type** (Road Resurfacing, Water Pipeline, Stormwater Drain, Underground Cable, Fiber Laying)
  - **Ward / Zone** (e.g., Zone 9 T. Nagar, Zone 10 Kodambakkam, Zone 13 Adyar, Kancheepuram Urban)
  - **Timeline Status** (Upcoming, Ongoing, Closed)
- Quick search by street/road name.
- Bidirectional interaction: clicking a project card pans and zooms to the map feature; clicking a map feature selects and displays the card.

### 4.3. Repeat-Dig Conflict Engine
- Deterministic TypeScript engine evaluating the project dataset.
- Detects two distinct conflict classes:
  1. **Direct Temporal Overlap:** Two agencies scheduling active excavation on the same road segment concurrently.
  2. **Moratorium Violation (Post-Paving Dig):** Utility excavation scheduled within a statutory moratorium window (e.g., 180 days) immediately following road resurfacing.
- Computes estimated cost waste avoided if coordinated.
- Conflict drawer / alert badge detailing the exact overlap window, affected entities, and recommended mitigation (Joint Trenching or Reschedule).

### 4.4. Project Detail & Evidence View
- Detailed drawer showing agency badge, tender/work order ID, contractor name, planned start and completion dates, budget, and estimated public impact.
- Visual timeline with simulated phase milestones (Trenching, Pipe Laying, Backfilling, Asphalt Curing).

### 4.5. Civic Issue Flagging (Demo/Client-Side)
- Lightweight "Report Stalled / Unauthorized Dig" submission flow.
- Stores report in browser session (`localStorage`), immediately rendering a citizen marker on the map for instant verification during judge evaluation.

---

## 5. Explicit Exclusions (Out of Scope for MVP)
To guarantee completion and deployment within the remaining hackathon window, the following are strictly excluded:
- Real-time governmental database write-back or live TNGIS API synchronization.
- Complex user authentication, RBAC, OAuth, or Multi-Factor Login (the app will operate in demonstration mode with role-switching toggles: Official View vs. Citizen View).
- Heavy 3D GIS terrain elevation models.
- Machine-learning computer vision for satellite pothole detection.
- Multi-language localization beyond English with standard Tamil nomenclature for zones and landmarks.

---

## 6. Acceptance Criteria

| ID | Feature | Acceptance Criteria |
|---|---|---|
| **AC-01** | Map Load & Performance | Map loads within 1.5s on desktop and mobile viewports with smooth pan/zoom; tiles render without CORS or Mixed-Content errors. |
| **AC-02** | Geospatial Accuracy | Markers and polylines reflect accurate coordinates in Chennai/Kancheepuram; clicking a feature triggers active highlight state. |
| **AC-03** | Conflict Engine Precision | Engine flags 100% of defined conflict pairs in test dataset; produces zero false positives for projects on differing road IDs or non-overlapping schedules; unit tests pass with 100% code coverage. |
| **AC-04** | Explainable Conflict Alert | When a conflict is selected, UI presents the conflicting agencies, affected dates, overlapping road segment name, and recommended action. |
| **AC-05** | Production Readiness | App builds cleanly (`npm run build`) without TypeScript errors or ESLint warnings; achieves 0 critical audit issues. |
| **AC-06** | Open Source Licensing & Data | Prominently displays map attribution (OpenStreetMap / CARTO) and disclaimer stating all project work orders are simulated demonstration datasets. |

---

## 7. Delivery Milestones & Priority Ranking

1. **P0 (Must-Have - Hours 1-8):** Project scaffolding, robust data schema, conflict engine algorithm + unit tests, interactive Leaflet map integration, basic project list.
2. **P1 (Should-Have - Hours 9-14):** Conflict visualization overlays, project detail drawer, faceted search/filtering, official vs citizen view toggle.
3. **P2 (Nice-to-Have - Hours 15-18):** Citizen issue reporting modal with local persistence, summary analytics banner (total conflicts avoided, potential ₹ savings), Playwright E2E verification.
4. **P3 (Packaging - Hours 19-21.5):** Live Vercel deployment, GitHub repository polish, README documentation, demo video recording.
