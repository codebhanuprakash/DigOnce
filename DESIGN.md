# Design System & UI/UX Specification: DigOnce

**Design Paradigm:** High-Utility Civic Operations & Geospatial Intelligence  
**Aesthetic:** Clean, authoritative, modern civic dashboard tailored for Indian urban management (Chennai–Kancheepuram corridor)

---

## 1. Visual Identity & Brand Philosophy

DigOnce is designed to look like a high-grade municipal coordination center rather than a generic startup template or raw GIS utility. It conveys **precision, inter-agency transparency, and accountability**.

### 1.1. Color Palette & Semantic Tokens

| Token Role | Hex Code | Purpose & Semantic Usage |
|---|---|---|
| **Primary Navy** | `#0F172A` (Slate 900) | Top navigation bar, high-contrast headings, primary borders |
| **Civic Blue** | `#1D4ED8` (Blue 700) | Primary actions, selected road highlight, GCC municipal badge |
| **Conflict Red** | `#DC2626` (Red 600) | Repeat-dig alert badges, conflicting road segment polylines |
| **Moratorium Warning** | `#D97706` (Amber 600) | Recent-resurfacing coordination risk advisory badge |
| **Coordination Green** | `#059669` (Emerald 600)| Resolved / joint trenching alignment status badge |
| **Map Base Neutral** | `#F8FAFC` (Slate 50) | Background canvas, sidebar panel background |
| **Border Neutral** | `#E2E8F0` (Slate 200) | Card borders, dividers, subtle separators |

### 1.2. Agency-Specific Identification Colors

To enable immediate visual differentiation across agencies on both the map and card list:
- **GCC (Greater Chennai Corporation - Roads):** Indigo (`#4338CA`)
- **CMWSSB (Metro Water & Sewerage):** Cyan / Sky (`#0284C7`)
- **TANGEDCO (Electricity Board):** Amber / Orange (`#EA580C`)
- **CMRL (Chennai Metro Rail):** Purple (`#7E22CE`)
- **Telecom / Private Fiber:** Emerald (`#0D9488`)

---

## 2. Typography & Baseline Scale

- **Primary Typeface:** `Inter` (or `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) for high legibility on density-heavy maps and data tables.
- **Monospace Typeface:** `JetBrains Mono` or `ui-monospace` for Work Order IDs (`TND-2026-GCC-041`), Road Segment Codes (`RD-CH-09-ANNA-01`), and coordinate readouts.
- **Scale:**
  - `Display / Page Title`: 20px / Semi-bold (Compact for toolbar)
  - `Section / Drawer Heading`: 16px / Semi-bold
  - `Card Title / Item Label`: 14px / Medium
  - `Body / Metadata Text`: 12px / Regular
  - `Micro Badges & Captions`: 11px / Semi-bold (Uppercase tracking)

---

## 3. Information Architecture & Map-First Layout

The application adopts a **persistent, map-first workspace layout**:

```
+--------------------------------------------------------------------------------------------------+
| Top Navigation Bar: DigOnce Brand | Demo Notice Banner | Role Toggle [Official/Citizen] | + Report|
+------------------------------------+-------------------------------------------------------------+
| Sidebar (400px fixed / collapsible)| Main Interactive GIS Canvas                                 |
|                                    |                                                             |
| [Search Street / Road Name...]    | Leaflet Map View (Chennai - Kancheepuram)                   |
| [Filters: Agency | Type | Status]  |                                                             |
|                                    | - Polyline overlays (colored by agency)                     |
| Repeat-Dig Coordination Banner:    | - Pulsing red markers on detected repeat-dig conflicts      |
| [!] 2 Coordination Risks Flagged   | - Layer control: Roads / Active Digs / Conflicts / Wards    |
|                                    |                                                             |
| Project List (Scrollable Cards):   |                                                             |
|  - PRJ-041: GCC Asphalt Resurface  | Map Legend & Attribution Box (Bottom Right)                 |
|  - PRJ-082: CMWSSB Pipeline Laying | "Data © OpenStreetMap contributors, © CARTO.                |
|  - PRJ-103: TANGEDCO Underground   |  Project records are synthetic demo scenarios."             |
+------------------------------------+-------------------------------------------------------------+
| Slide-out Drawer / Modal: Detailed Road History, Conflict Resolution & Evidence Timeline        |
+--------------------------------------------------------------------------------------------------+
```

### 3.1. Responsive Behavior
- **Desktop (>= 1024px):** Fixed 400px left sidebar for continuous exploration, 100% height map on the right.
- **Tablet / Mobile (< 1024px):** Full-screen map with bottom sheet / collapsible drawer for the project explorer and conflict details.

---

## 4. Interaction States & Transitions

1. **Hover on Project Card:**
   - Sidebar card gains subtle elevation (`shadow-md`) and primary border tint.
   - Corresponding road polyline on map increases stroke weight from `4px` to `7px` with an interactive glow.
2. **Click on Project Card:**
   - Map automatically animates pan-and-zoom (`flyToBounds`) to fit the bounds of the project road segment and subsegment.
   - Opens the `ProjectDetailDrawer` on the right side with complete agency metadata and simulated phase milestone logs.
3. **Conflict Pulse State:**
   - Segments identified with repeat-dig conflicts render with a dashed red polyline (`#DC2626`) and an alert marker.
   - Clicking a conflict card triggers a **Conflict Advisory Dialog** comparing both overlapping timelines side-by-side with recommended joint trenching actions (no speculative rupee estimates).
4. **Citizen Reporting Flow (Browser-Only Demo):**
   - Modal contains a clear disclaimer banner: *"Client-side demonstration only. Reports submitted here are stored strictly in your current browser session and are not transmitted to municipal authorities."*
   - Requires street selection and descriptive text (min 10 characters).
   - On submission, renders an instant confirmation toast and places an orange citizen feedback pin on the map.

---

## 5. Accessibility & Performance Requirements (WCAG 2.1 AA)

- **Color Contrast:** All body text meets minimum contrast ratio of `4.5:1` against backgrounds. Badges use high-contrast dark text on tinted pastel backings.
- **Keyboard Navigation:** Sidebar project cards and filter chips support `Tab`, `Shift+Tab`, and `Enter` activation.
- **Screen Reader Support:** Map markers and conflict flags include descriptive `aria-label` attributes (e.g., `aria-label="Repeat-dig coordination risk between GCC and CMWSSB on Anna Salai"`).
- **Map Focus Trapping:** Interactive map controls have explicit tabindex and accessible labels for zoom in/out and layer toggle.
