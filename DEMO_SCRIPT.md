# DigOnce — 3-Minute Demo Video Script & Walkthrough

**Title:** DigOnce: Eliminating Wasteful Repeat Road Excavation in Chennai–Kancheepuram  
**Format:** Screen Recording with Voice-over / Captions (Duration: 2:45)

---

### Segment 1: The Civic Problem & Vision (0:00 - 0:35)
- **Visual:** Open on `http://localhost:3000` (or live URL). Full-screen map view centered on the Chennai–Kancheepuram corridor.
- **Narrator / Caption:** 
  > "In municipal corporations across India, roads laid with fresh asphalt are frequently dug up within weeks by water boards, electricity departments, or telecom providers. This lack of inter-agency visibility causes massive traffic disruption, damages existing subterranean utilities, and wastes public capital.
  > 
  > Welcome to **DigOnce** — a unified civic operations coordination platform designed for Greater Chennai Corporation, CMWSSB, TANGEDCO, CMRL, and Kancheepuram districts."

---

### Segment 2: Interactive GIS Map & Project Discovery (0:35 - 1:15)
- **Visual:** Hover over road polylines on Anna Salai and Arcot Road. Point out the agency color coding in the bottom-left legend (Indigo for GCC, Sky for CMWSSB, Orange for TANGEDCO).
- **Action:** Type `"Anna Salai"` in the Project Explorer search bar. Show real-time filtering. Click on `PRJ-2026-GCC-041 (Anna Salai Bitumen Milling & Resurfacing)`.
- **Narrator / Caption:**
  > "DigOnce renders road network polylines and planned work orders on a lightweight, high-performance GIS canvas with complete OpenStreetMap attribution. 
  > 
  > In the Project Explorer, officers can instantly filter by civic department, work category, or street name. Selecting a project card animates the map directly to its subsegment and displays complete contractor and schedule metadata."

---

### Segment 3: The Deterministic Repeat-Dig Conflict Engine (1:15 - 2:05)
- **Visual:** Notice the red badge: `"2 Repeat-Dig Conflicts"`. Click `"Inspect Conflict →"` on the selected project card, switching to the **Conflict Alerts** tab.
- **Action:** Highlight the conflict on Anna Salai (`CNF-CONCURRENT-RD-CH-09-ANNA-01-PRJ-2026-CMWSSB-082-PRJ-2026-GCC-041`).
- **Narrator / Caption:**
  > "Notice how DigOnce identifies a critical scheduling collision between GCC's resurfacing work and CMWSSB's water main replacement.
  > 
  > Unlike naive coordinate-proximity guesses, our **Repeat-Dig Conflict Engine** is 100% deterministic:
  > First, it checks canonical road segment identity.
  > Second, it calculates the physical subsegment chainage overlap — here, 40% to 70% along Anna Salai.
  > Third, it computes the inclusive calendar collision: November 10 to November 20.
  > 
  > Crucially, the map doesn't just color the whole street red — using piecewise linear interpolation, it highlights the exact physical overlapping trench section."

---

### Segment 4: Operational Action & Coordination Sync (2:05 - 2:35)
- **Visual:** Inspect the recommended action in the detail drawer: `"Coordinate joint trenching or sequence works sequentially with an inter-agency NOC review"`.
- **Action:** Click the **"Propose Joint Dig"** button. Show the status badge updating from `Unreviewed` to `Proposed` (`COORDINATION_PROPOSED`). Refresh the browser to demonstrate that the coordination decision persists locally.
- **Narrator / Caption:**
  > "An engineer can immediately take action by clicking 'Propose Joint Dig'. The status instantly updates across the portal, enabling inter-agency teams to sync schedules before asphalt is poured.
  > 
  > We also demonstrate Rule B on Arcot Road: detecting recent-resurfacing risks where utility digs are planned within 180 days of completed road paving."

---

### Segment 5: Verification & Conclusion (2:35 - 2:45)
- **Visual:** Pan back to the full corridor view showing both Chennai and Kancheepuram project sites. Show the clear synthetic demo disclosure banner.
- **Narrator / Caption:**
  > "With 23 automated unit tests, full Playwright browser verification, and zero proprietary API costs, DigOnce transforms uncoordinated road cuts into synchronized civic infrastructure. Thank you."
