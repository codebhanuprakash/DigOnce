# Technical Architecture: DigOnce

**System:** DigOnce Civic Operations & Conflict Coordination Platform  
**Target Environment:** Node.js v24 LTS (Windows 11 / Vercel Edge/Serverless)  
**Architecture Style:** Client-first Next.js App Router with Deterministic Pure-TypeScript Domain Logic

---

## 1. Selected Stack & Dependency Decisions

To prevent dependency drift, build breakage on Windows/Node 24, and unnecessary weight, we select the minimal reliable package set:

| Component | Selected Library | Exact Package Specifier | Rationale & Corrections to Preliminary Report |
|---|---|---|---|
| **Framework** | Next.js 14+ | `next@^14.2.15`, `react@^18.3.1`, `react-dom@^18.3.1` | Stable App Router, optimized static rendering, seamless Vercel hosting. |
| **Language** | TypeScript | `typescript@^5.6.3` | Strict type safety for geospatial coordinates and conflict intervals. |
| **Styling** | Tailwind CSS | `tailwindcss@^3.4.14`, `postcss`, `autoprefixer` | Standard utility-first engine with zero runtime overhead. |
| **UI Components** | Radix UI + shadcn primitives | Direct CLI installation via `npx shadcn@latest` | **Correction:** `@shadcn/ui` was an outdated npm package name; standard shadcn is installed via `npx shadcn` or `@radix-ui/react-*` + `clsx` + `tailwind-merge`. |
| **Icons** | Lucide React | `lucide-react@^0.453.0` | **Correction:** Report mistakenly referenced `lucide-icons-react` (outdated fork). Official package is `lucide-react`. |
| **GIS Mapping** | Leaflet | `leaflet@^1.9.4`, `@types/leaflet@^1.9.14` | Reliable, cross-browser, no API keys or billing required. Dynamically imported with SSR disabled (`next/dynamic`) to avoid `window is not defined` errors. |
| **Unit Testing** | Vitest | `vitest@^2.1.3` | Lightweight, native ESM/TS support, faster than Jest. |
| **E2E Testing** | Playwright | `@playwright/test` | Headless Chrome/Edge testing on Windows and CI. |

---

## 2. Geospatial & Domain Data Model

The data layer models civic infrastructure entities with precise spatial and temporal coordinates.

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
  moratoriumUntil?: string; // ISO date string (if recently resurfaced)
}

export interface PublicWorkProject {
  id: string;             // "PRJ-2026-GCC-041"
  roadId: string;         // Foreign key to RoadSegment
  agency: AgencyType;
  category: WorkCategory;
  title: string;
  description: string;
  contractor: string;
  budgetInLakhs: number;
  startDate: string;      // "YYYY-MM-DD"
  endDate: string;        // "YYYY-MM-DD"
  status: ProjectStatus;
  segmentStartPct: number; // 0.0 to 1.0 (sub-segment position)
  segmentEndPct: number;   // 0.0 to 1.0
  coordinates: LatLng[];   // Specific excavation polyline/bounding coords
  updatedAt: string;
}

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface RepeatDigConflict {
  id: string;
  roadId: string;
  roadName: string;
  zone: string;
  severity: ConflictSeverity;
  conflictType: 'DIRECT_SCHEDULE_COLLISION' | 'MORATORIUM_BREACH';
  projectA: PublicWorkProject;
  projectB: PublicWorkProject;
  overlapStartDate: string;
  overlapEndDate: string;
  overlapDays: number;
  estimatedWasteInLakhs: number;
  recommendedAction: string;
}
```

---

## 3. Deterministic Repeat-Dig Conflict Engine

### 3.1. Algorithmic Principles
The Repeat-Dig Conflict Engine is a pure mathematical and calendar algorithm with zero non-deterministic or hallucinated outputs:
1. **Spatial Grouping:** Projects are partitioned by their canonical `roadId`. Only projects targeting the identical physical road segment are evaluated.
2. **Chainage/Sub-segment Overlap Test:** Check whether interval $[A_{start}, A_{end}] \cap [B_{start}, B_{end}] \neq \emptyset$.
3. **Temporal Intersection & Moratorium Rules:**
   - **Direct Collision:** $\max(Start_A, Start_B) \le \min(End_A, End_B)$. Two excavations occurring simultaneously cause unmanageable road blockage.
   - **Moratorium Violation:** If Agency $A$ executes `ROAD_RESURFACING` finishing at $End_A$, and Agency $B$ schedules excavation starting at $Start_B$ where:
     $$0 < (Start_B - End_A) \le 180 \text{ days}$$
     This constitutes an illegal or wasteful repeat excavation of fresh asphalt.
4. **Economic Waste Estimation:**
   Estimated waste is calculated based on municipal standard schedule of rates (SSR) for asphalt trench reinstatement ($\approx ₹ 3,200 \text{ per sq. meter}$ multiplied by overlapping trench dimensions).

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
   |   Evaluate Project Pairs (A, B) within same roadId    |
   +-------------------------------------------------------+
            /                                   \
           v                                     v
  [Schedule Overlap?]                   [Post-Paving Moratorium?]
  Overlap >= 1 day                      Within 180 days of paving
           \                                     /
            v                                   v
   +-------------------------------------------------------+
   |   Compute Conflict: Severity, Overlap Days, Waste     |
   |              Generate Actionable Plan                 |
   +-------------------------------------------------------+
```

---

## 4. Map Integration Strategy (Next.js + Leaflet)

### 4.1. SSR Safety & Dynamic Loading
Leaflet accesses the browser `window` and `navigator` objects during instantiation. In Next.js App Router, the map wrapper component is strictly loaded via `next/dynamic`:
```tsx
const DynamicMap = dynamic(() => import('@/components/map/DigOnceMap'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />
});
```

### 4.2. Free Tile Attribution & High-Performance Layer
- **Basemap:** CartoDB Positron / OpenStreetMap standard tiles served via HTTPS.
- **Attribution Control:** Complies fully with OpenStreetMap Foundation guidelines:
  `© OpenStreetMap contributors, © CARTO`.
- **Vector Rendering:** Road segments are rendered using SVG Leaflet `Polyline` paths with glowing conflict states (e.g., `#EF4444` red with animated dash-array or warning markers for critical repeat-dig segments).

---

## 5. Component Boundaries & Application Flow

```
app/
├── layout.tsx                # Base HTML, font variables, theme provider
├── page.tsx                  # Main Coordination Hub (Split Layout)
components/
├── header/
│   ├── TopNavbar.tsx         # GCC/TN branding, Role toggle, Stats summary
│   └── SummaryMetrics.tsx    # Live tally: Active digs, Flagged conflicts, Savings
├── map/
│   ├── DigOnceMap.tsx        # Dynamic Leaflet canvas, GeoJSON/Polylines
│   ├── MapLegend.tsx         # Agency colors & conflict status indicator
│   └── MapControls.tsx       # Reset bounds, zone quick-jumps
├── explorer/
│   ├── ProjectSidebar.tsx    # Search input, filter dropdowns, project list
│   ├── ProjectCard.tsx       # Individual card with agency badge & conflict tag
│   └── ConflictAlertBadge.tsx# Direct link to conflict modal/panel
├── details/
│   ├── ProjectDetailDrawer.tsx # Slide-out drawer with timeline & specs
│   └── ConflictModal.tsx       # Joint trenching advisory & evidence
lib/
├── conflictEngine.ts         # Pure conflict detection logic
├── mockData.ts               # Chennai-Kancheepuram seed data
└── utils.ts                  # Date formatters, currency formatters
```

---

## 6. Testing, Quality & Deployment

### 6.1. Unit Testing Strategy
- Pure unit tests executed via Vitest on `conflictEngine.ts`:
  - `test_direct_overlap_same_road`: Asserts critical conflict generated.
  - `test_moratorium_violation`: Asserts post-paving dig within 180 days flagged.
  - `test_different_roads_no_conflict`: Asserts separate road IDs never generate conflicts.
  - `test_adjacent_dates_no_conflict`: Asserts sequential non-overlapping digs do not trigger false alarms.

### 6.2. Production Build & Deployment Pipeline
1. `npm run lint` & `npm test` executed locally.
2. Verified with `npm run build` locally to ensure no bundle or static generation errors.
3. Git commits pushed to GitHub repository.
4. Auto-deployed on **Vercel** with global CDN caching for static map assets and instant public URL generation.
