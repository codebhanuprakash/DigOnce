# DigOnce — Civic Works Coordination Portal

> **Civic Infrastructure Coordination & Repeat-Dig Conflict Detection Platform for Chennai–Kancheepuram, Tamil Nadu, India.**

---

## 1. Problem Statement & Objective
In urban Indian municipalities, road surfaces are repeatedly excavated by siloed public infrastructure agencies (Greater Chennai Corporation [GCC] Roads, Chennai Metro Water [CMWSSB], TANGEDCO Electricity Board, telecom operators, and CMRL Metro Rail). A newly resurfaced road is frequently dug up weeks later for utility trenching, causing immense traffic congestion, damage to existing subterranean utilities, and citizen frustration.

**DigOnce** provides a unified, map-centric coordination portal equipped with a **deterministic Repeat-Dig Conflict Engine** to flag schedule collisions and post-resurfacing coordination risks before physical excavation begins.

---

## 2. Implemented & Verified Capabilities
- **Interactive GIS Map & Layer Controls (Chennai–Kancheepuram Corridor):** Real OpenStreetMap centerline geometries with layer toggles (Roads, Projects, Conflicts), scale bar, reset extent, and high-performance raster tiles.
- **Traceable OpenStreetMap Dataset (`public/data/roads.geojson`):** Real ordered multi-point road geometries extracted from OpenStreetMap via Overpass API with verified OSM way IDs, highway classes, and ODbL attribution.
- **Deterministic Repeat-Dig Conflict Engine:**
  - **Rule A (Concurrent Work Collision):** Flags active/planned projects scheduling excavation on overlapping subsegment chainages during overlapping calendar dates.
  - **Rule B (Recent-Resurfacing Coordination Risk):** Flags planned excavations on road subsegments completed within a configurable demonstration heuristic window (180 calendar days post-paving).
- **Rigorous Geodesic Subsegment Slicing:** Project and conflict lines are derived dynamically from canonical road centerlines using Haversine cumulative distance interpolation (`interpolateSubPolyline`), ensuring work lines physically trace real street bends and intersections.
- **Faceted Project Discovery:** Real-time text search (street names, contractors, titles) and filtering by civic agency (`GCC`, `CMWSSB`, `TANGEDCO`, `CMRL`, `TELECOM`) and work category (`Resurfacing`, `Water`, `Power`, `Fiber`, `Metro`).
- **Contextual Inspector:** Detail drawer displaying agency allocation, tender specifications, inclusive date boundaries, exact conflict trigger rules, and actionable coordination advisories.
- **Coordination Action Workflow:** Reviewers can mark findings as `REVIEWED` or propose synchronization via `COORDINATION_PROPOSED`, updating the UI instantly and safely persisting in the browser's `localStorage`.
- **Responsive Civic Design System:** Clean, accessible layout built on Tailwind CSS tokens (`civic-navy`, `civic-blue`, `civic-red`, `civic-amber`) with mobile bottom-sheet adaptability.

---

## 3. Technology Stack & Architecture
- **Framework:** Next.js 15.5.27 (App Router, React 19.0.0, Node.js v24 LTS compatible).
- **Language:** TypeScript 5.7.3 (Strict Type Checking).
- **Styling:** Tailwind CSS 3.4.17 with Radix UI design tokens.
- **GIS Engine:** Leaflet 1.9.4 with dynamic client-side SSR isolation.
- **Testing:**
  - **Unit Tests:** Vitest 2.1.9 (36 automated test cases covering date boundaries, order-independence, subsegments, and geodesic geometry slicing).
  - **Browser E2E Tests:** Playwright 1.50.0 (Chromium headless testing verifying discovery, inspection, coordination actions, persistence, and mobile viewports).

---

## 4. Getting Started & Installation

### Prerequisites
- Node.js >= 18.18 (Verified on Node.js v24.15.0 LTS)
- npm >= 10.0 (Verified on npm 11.12.1)

### Setup & Execution
```bash
# Clone the repository
git clone <repository-url>
cd DigOnce

# Install dependencies
npm install

# Run the development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 5. Verification Commands

All checks are automated and reproducible locally:

```bash
# 1. Run unit test suite (Vitest)
npm test

# 2. Run browser end-to-end journey (Playwright)
npx playwright test

# 3. Run strict TypeScript compilation check
npm run typecheck

# 4. Run ESLint checks
npm run lint

# 5. Build optimized production bundle
npm run build

# 6. Serve production build locally
npm run start
```

---

## 6. Data Provenance & Demonstration Disclosures
- **Canonical Road Geometries (`public/data/roads.geojson`):** Extracted from OpenStreetMap (OSM) on 2026-10-10 using Overpass API and OSM API v0.6. Features include:
  - `RD-CH-09-ANNA-01`: Anna Salai (Teynampet to Nandanam) — OSM Ways 102457954, 1195527180, 1309829162, 1211074461 (47 vertices, 1,847m).
  - `RD-CH-10-ARCOT-02`: Arcot Road (Kodambakkam to Vadapalani) — OSM Ways 27346902, 1092250361 (36 vertices, 931m).
  - `RD-CH-13-OMR-03`: Rajiv Gandhi Salai / OMR (Madhya Kailash to Tidel Park) — OSM Ways 95222407, 1235214293, 1235214291, 1517503899, 1517503898, 1517503900, 1235211589, 1231030954 (29 vertices, 2,094m).
  - `RD-KANCHI-01-RAIL-04`: Railway Road (Kancheepuram Town) — OSM Ways 48891297, 910309591, 1533440888, 910309590 (29 vertices, 1,492m).
  - **Attribution & License:** OpenStreetMap data is &copy; OpenStreetMap contributors, licensed under the Open Data Commons Open Database License (ODbL) 1.0 (https://opendatacommons.org/licenses/odbl/1.0/).
- **Synthetic Public Works Projects:** All 8 public works projects, contractor names, work order numbers, and schedules are **fictional demonstration records** created solely for evaluating the conflict detection algorithm. They do not represent active government tenders or verified contractor activity.
- **Geodesic Slicing Guarantee:** Every project's polyline is calculated along its parent road's real coordinate array using Haversine cumulative distance interpolation. No project geometry is manually drawn or fabricated.
- **Local Persistence Limitation:** Coordination review actions are stored exclusively in the current browser session (`localStorage`). The prototype does not transmit NOC applications or write-back data to municipal databases.
- **Demonstration Heuristic:** The 180-day post-paving coordination rule is implemented as an operational demonstration heuristic, not a verified statutory mandate.

---

## 7. Open-Source Libraries & Attribution
- [Next.js](https://nextjs.org/) (MIT)
- [React](https://react.dev/) (MIT)
- [Leaflet](https://leafletjs.com/) (BSD 2-Clause)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)
- [Tailwind CSS](https://tailwindcss.com/) (MIT)
- [Vitest](https://vitest.dev/) (MIT)
- [Playwright](https://playwright.dev/) (Apache 2.0)

---

## 8. Verified Interface Screenshot

![DigOnce Interface](public/digonce-verified-interface.png)
