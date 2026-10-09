# Technical Architecture: DigOnce

**System:** DigOnce Civic Operations & Conflict Coordination Platform  
**Target Environment:** Node.js v24 LTS (Windows 11 / Vercel Edge/Serverless)  
**Architecture Style:** Client-first Next.js App Router with Deterministic Pure-TypeScript Domain Logic

---

## 1. Selected Stack & Dependency Decisions

To prevent dependency drift, build breakage on Windows/Node 24, and unnecessary weight, we select the verified minimal stable package set:

| Component | Selected Library | Exact Package Specifier | Rationale & Verified Compatibility |
|---|---|---|---|
| **Framework** | Next.js 15 (Stable) | `next@^15.2.1`, `react@^19.0.0`, `react-dom@^19.0.0` | Official stable LTS branch with active security patches. Verified compatible with React 19 and Node 24. Replaces outdated `14.2.15`. |
| **Language** | TypeScript | `typescript@^5.7.0` | Strict type safety for geospatial coordinates, chainage percentages, and date intervals. |
| **Styling** | Tailwind CSS | `tailwindcss@^3.4.17`, `postcss`, `autoprefixer` | Proven utility engine with full shadcn/Radix component support. |
| **UI Components** | Radix UI + shadcn primitives | Direct CLI installation via `npx shadcn@latest` | Standard accessible UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-slot`, `clsx`, `tailwind-merge`). Verified compatible with React 19. |
| **Icons** | Lucide React | `lucide-react@^1.54.0` | Official icon package. Corrected from deprecated `lucide-icons-react`. |
| **GIS Mapping** | Leaflet | `leaflet@^1.9.4`, `@types/leaflet@^1.9.22` | Lightweight, zero-billing, cross-platform GIS. Dynamically imported with SSR disabled (`next/dynamic`) to prevent `window is not defined` errors. |
| **Unit Testing** | Vitest | `vitest@^2.1.8` | Native ESM and TypeScript test runner; runs unit tests for conflict engine in <200ms. |
| **E2E Testing** | Playwright | `@playwright/test@^1.50.0` | Headless verification of map rendering and sidebar interactions on Windows and CI. |

---

## 2. Geospatial & Domain Data Model

The data layer models civic infrastructure entities with spatial subsegments and inclusive temporal intervals.

```typescript
// types/civic.ts

export type AgencyType = 'GCC' | 'CMWSSB' | 'TANGEDCO' | 'CMRL' | 'TELECOM';

export type WorkCategory = 
  | 'ROAD_RESURFACING'
  | 'WATER_SUPPLY'
  | 'SEWERAGE'
  | 'POWER_CABLE'
  | 'TELECOM_FIBER'
  | 'METRO_STATION';

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadSegment {
  id: string;             // e.g. "RD-CH-09-ANNA-01"
  name: string;           // "Anna Salai (Teynampet to Nandanam)"
  wardNumber: number;     // 118
  zone: string;           // "Zone IX (Teynampet)"
  lengthMeters: number;   // 1450
  coordinates: LatLng[];  // Polyline coordinates for map rendering
  moratoriumUntil?: string; // ISO date string "YYYY-MM-DD" (if recently resurfaced)
}

export interface PublicWorkProject {
  id: string;             // "PRJ-2026-GCC-041"
  roadId: string;         // Foreign key to RoadSegment
  agency: AgencyType;
  category: WorkCategory;
  title: string;
  description: string;
  contractor: string;
  startDate: string;      // "YYYY-MM-DD" (inclusive)
  endDate: string;        // "YYYY-MM-DD" (inclusive)
  status: ProjectStatus;
  segmentStartPct: number; // 0.0 to 1.0 (sub-segment position along road)
  segmentEndPct: number;   // 0.0 to 1.0 (sub-segment position along road)
  coordinates: LatLng[];   // Specific excavation polyline coordinates
  isSimulated: true;       // Explicit flag confirming synthetic demonstration data
}

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface RepeatDigConflict {
  id: string;
  roadId: string;
  roadName: string;
  zone: string;
  severity: ConflictSeverity;
  conflictType: 'DIRECT_SCHEDULE_COLLISION' | 'RECENT_RESURFACING_RISK';
  projectA: PublicWorkProject;
  projectB: PublicWorkProject;
  subsegmentOverlap: {
    startPct: number;     // e.g. 0.35
    endPct: number;       // e.g. 0.80
    overlapMeters: number;// Approximate meters of physical overlap
  };
  temporalOverlap: {
    startDate: string;    // Inclusive overlap start "YYYY-MM-DD"
    endDate: string;      // Inclusive overlap end "YYYY-MM-DD"
    overlapDays: number;  // Inclusive calendar days of conflict
  };
  explanation: string;    // Human-readable, evidence-based civic explanation
  recommendedAction: string; // e.g. "Coordinate joint utility duct laying before surface paving"
}
```

---

## 3. Deterministic Repeat-Dig Conflict Engine

### 3.1. Algorithmic Principles & Boundary Conditions
The Repeat-Dig Conflict Engine is a pure mathematical and calendar algorithm with zero non-deterministic or hallucinated outputs.

1. **Physical Road Identity Match:** Projects $A$ and $B$ must target the identical physical road segment ($A.roadId == B.roadId$).
2. **Subsegment Spatial Overlap Rule:**
   - Road projects often occupy non-overlapping sections of the same thoroughfare (e.g., Anna Salai from km 0.0 to 0.4 vs km 0.9 to 1.4).
   - Projects only have physical spatial overlap if:
     $$\text{Overlap}_{start} = \max(A.segmentStartPct, B.segmentStartPct)$$
     $$\text{Overlap}_{end} = \min(A.segmentEndPct, B.segmentEndPct)$$
     $$\text{HasSpatialOverlap} \iff \text{Overlap}_{end} > \text{Overlap}_{start}$$
   - If $\text{Overlap}_{end} \le \text{Overlap}_{start}$, spatial overlap is 0%, and **no conflict is generated**.
3. **Inclusive Date Boundary Conditions:**
   - All calendar dates ($Start_A, End_A, Start_B, End_B$) are normalized to ISO `YYYY-MM-DD` UTC midnight timestamps.
   - Date ranges are **inclusive on both boundaries**.
   - Two schedules directly collide if and only if:
     $$\max(Start_A, Start_B) \le \min(End_A, End_B)$$
     - **Exact-boundary edge case:** If $End_A == Start_B$, overlap is exactly 1 day.
     - If $Start_B > End_A$, overlap days = 0.
4. **Recent-Resurfacing Coordination Risk (Configurable 180-Day Heuristic):**
   - Applies when one project has category `ROAD_RESURFACING` (Project $A$) and finishes at $End_A$, and an excavation project (Project $B$) is scheduled on an overlapping subsegment.
   - Evaluated using a configurable demonstration heuristic (default: 180 inclusive calendar days).
   - If:
     $$1 \le (Start_B - End_A) \le 180 \text{ calendar days}$$
     and $\text{HasSpatialOverlap} == \text{true}$, the engine flags a `RECENT_RESURFACING_RISK`.
   - **Neutral civic terminology:** This is presented as an operational coordination risk and potential duplicate restoration alert, not a statutory violation or proven crime.
5. **Speculative Financial Calculations Omitted:**
   - In accordance with MVP quality guidelines, unverified reinstatement rate multipliers (e.g. ₹/m² guesses) and speculative rupee savings formulas are omitted. Focus remains on explainable scheduling alignment, physical chainage coordinates, and joint trenching advisories.

```
   +-------------------------------------------------------+
   |                Project Dataset (JSON)                 |
   +-------------------------------------------------------+
                              |
                              v
   +-------------------------------------------------------+
   |         Partition Projects by roadId Group           |
   +-------------------------------------------------------+
                              |
                              v
   +-------------------------------------------------------+
   | Subsegment Check: min(EndPct) > max(StartPct)?        |
   +-------------------------------------------------------+
           |                                       |
        [Yes]                                     [No]
           |                                       |
           v                                       v
   +-------------------------------+      [Zero Conflict]
   | Check Inclusive Temporal Rule |
   +-------------------------------+
            /                              \
           v                                v
  [Direct Overlap?]               [Recent Resurfacing Risk?]
  max(Start) <= min(End)          1 <= (StartB - EndA) <= 180 days
           \                              /
            v                            v
   +-------------------------------------------------------+
   |   Output Explainable Conflict: Chainage, Dates, Action|
   +-------------------------------------------------------+
```

---

## 4. Map Integration Strategy (Next.js + Leaflet)

### 4.1. SSR Safety & Dynamic Loading
Leaflet requires browser globals (`window`, `navigator`, `document`) which do not exist during Next.js server-side compilation. In Next.js App Router, the map wrapper is strictly loaded via `next/dynamic` with SSR disabled:
```tsx
const DigOnceMap = dynamic(() => import('@/components/map/DigOnceMap'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
});
```

### 4.2. Free Tile Attribution & High-Performance Layer
- **Basemap:** CartoDB Positron / OpenStreetMap standard tiles served via HTTPS.
- **Attribution Notice:** Prominently and continuously displayed in the map corner:
  `© OpenStreetMap contributors, © CARTO`.
- **Demo Data Separation:** Map tiles represent actual geographic road paths in Chennai–Kancheepuram. Project layers and work order coordinates are explicitly identified in the UI and code as simulated demonstration data.
- **Vector Styling:** Non-conflicting projects render as clean agency-colored polylines (`4px` stroke). Subsegments identified with repeat-dig conflicts render with animated dashed red polylines (`#DC2626`, `6px` stroke) with warning markers.

---

## 5. Component Boundaries & Application Flow

```
app/
├── layout.tsx                # Base HTML, Inter font, metadata
├── page.tsx                  # Main Coordination Hub (Split Layout)
components/
├── header/
│   ├── TopNavbar.tsx         # DigOnce branding, Demo banner, Role toggle
│   └── SummaryMetrics.tsx    # Live tally: Active digs, Flagged conflicts
├── map/
│   ├── DigOnceMap.tsx        # Dynamic Leaflet canvas, GeoJSON/Polylines
│   ├── MapLegend.tsx         # Agency colors & conflict status indicator
│   └── MapControls.tsx       # Reset bounds, zone quick-jumps
├── explorer/
│   ├── ProjectSidebar.tsx    # Search input, filter dropdowns, project list
│   ├── ProjectCard.tsx       # Card with agency badge, subsegment badge & conflict tag
│   └── ConflictAlertBadge.tsx# Direct link to conflict modal/panel
├── details/
│   ├── ProjectDetailDrawer.tsx # Slide-out drawer with timeline & specs
│   └── ConflictModal.tsx       # Joint trenching advisory & evidence
├── citizen/
│   └── CitizenReportModal.tsx  # Browser-only issue logger with validation
lib/
├── conflictEngine.ts         # Pure deterministic conflict detection logic
├── mockData.ts               # Chennai-Kancheepuram seed data (labeled simulated)
└── utils.ts                  # Date interval and chainage math helpers
```

---

## 6. Antigravity Environment & Tooling Verification

- **Subagents & MCP Capabilities:** Antigravity environment natively supports agentic coding workflows via tool invocations (`run_command`, `write_to_file`, `replace_file_content`, `view_file`, `search_web`, `manage_task`).
- **Investigation of Ponytail:** 
  - Verified from official package registries and documentation: "Ponytail" is an open-source prompt ruleset / Claude Code plugin created by DietrichGebert to enforce YAGNI and minimalist code.
  - It is **not** a built-in Antigravity skill or official npm runtime library.
  - **Decision:** In accordance with instructions, we do not attempt to install unsupported third-party plugins. We apply its sound engineering principles directly (YAGNI, minimal dependencies, standard web APIs, zero bloated code).

---

## 7. Testing, Quality & Milestone Gates

### 7.1. Unit Testing Strategy
Pure unit tests executed via Vitest on `conflictEngine.ts`:
- `test_direct_overlap_same_road_same_subsegment`: Asserts critical collision flagged.
- `test_same_road_different_subsegments_no_conflict`: Asserts subsegments `[0.0, 0.3]` and `[0.7, 1.0]` on the same road do **not** trigger a conflict.
- `test_exact_date_boundary_overlap`: Asserts $End_A == Start_B$ evaluates to exactly 1 overlapping day.
- `test_adjacent_non_overlapping_dates`: Asserts $Start_B == End_A + 1$ does not trigger direct collision.
- `test_recent_resurfacing_heuristic_180_days`: Asserts utility dig within 180 days of road resurfacing is flagged as `RECENT_RESURFACING_RISK`.
- `test_recent_resurfacing_past_180_days`: Asserts utility dig at 181 days is not flagged.
- `test_different_roads_no_conflict`: Asserts separate road IDs never conflict.

### 7.2. Release Gates
Each milestone requires clean verification before proceeding:
1. `npm test` -> 100% passing tests on conflict logic.
2. `npm run lint` -> Zero ESLint errors or unused imports.
3. `npm run build` -> Clean Next.js static build without warnings.
4. Deployment to **Vercel** with live public URL.
