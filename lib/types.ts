/**
 * Canonical Domain Model for DigOnce Civic Works Coordination Portal
 *
 * Source of Truth: PRD.md & ARCHITECTURE.md
 * Target Corridor: Chennai–Kancheepuram District
 */

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
  id: string;             // Canonical identifier, e.g. "RD-CH-09-ANNA-01"
  name: string;           // "Anna Salai (Teynampet to Nandanam)"
  wardNumber: number;     // 118
  zone: string;           // "Zone IX (Teynampet)"
  lengthMeters: number;   // 1450
  coordinates: LatLng[];  // Polyline coordinates for map rendering
}

export interface PublicWorkProject {
  id: string;              // Unique project ID, e.g. "PRJ-2026-GCC-041"
  roadId: string;          // Foreign key referencing RoadSegment.id
  agency: AgencyType;      // Coordinating civic agency
  category: WorkCategory;  // Type of municipal infrastructure work
  title: string;           // Short descriptive title
  description: string;     // Work scope description
  contractor: string;      // Assigned contractor or executing division
  startDate: string;       // Inclusive start date in ISO "YYYY-MM-DD"
  endDate: string;         // Inclusive completion date in ISO "YYYY-MM-DD"
  status: ProjectStatus;   // Lifecycle status
  segmentStartPct: number; // Subsegment chainage start [0.0 - 1.0]
  segmentEndPct: number;   // Subsegment chainage end [0.0 - 1.0], must be >= segmentStartPct
  coordinates: LatLng[];   // Specific excavation polyline/boundary coordinates
  isSimulated: true;       // Explicit indicator verifying synthetic demonstration data
}

export type ConflictRuleType =
  | 'CONCURRENT_WORK_COLLISION'
  | 'RECENT_RESURFACING_RISK';

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface SubsegmentSpan {
  startPct: number;      // max(A.segmentStartPct, B.segmentStartPct)
  endPct: number;        // min(A.segmentEndPct, B.segmentEndPct)
  overlapLengthPct: number; // endPct - startPct
  approxOverlapMeters?: number;
}

export interface InclusiveDateRange {
  startDate: string;     // Inclusive ISO "YYYY-MM-DD"
  endDate: string;       // Inclusive ISO "YYYY-MM-DD"
  overlapDays: number;   // Inclusive calendar days of overlap
}

export interface ResurfacingInterval {
  resurfacingEndDate: string; // ISO "YYYY-MM-DD"
  excavationStartDate: string;// ISO "YYYY-MM-DD"
  elapsedDays: number;        // Calendar days elapsed between resurfacing completion and excavation start
  heuristicThresholdDays: number; // Configurable window (default: 180)
}

export interface ConflictFinding {
  id: string;                         // Stable, deterministic finding ID: e.g. "CNF-CONCURRENT-PRJ-01-PRJ-02"
  ruleType: ConflictRuleType;
  severity: ConflictSeverity;
  roadId: string;                     // Shared canonical road segment
  roadName?: string;
  projectAId: string;                 // Normalized: projectAId < projectBId lexicographically
  projectBId: string;
  subsegmentOverlap: SubsegmentSpan;  // Positive overlapping chainage span
  temporalDetails: {
    type: 'DATE_OVERLAP' | 'RESURFACING_INTERVAL';
    dateOverlap?: InclusiveDateRange;
    resurfacingInterval?: ResurfacingInterval;
  };
  evidence: string[];                 // Structured factual observations that triggered the rule
  explanation: string;                // Clear, human-readable civic operational explanation
  recommendedAction: string;          // Actionable review advice (e.g. joint trenching, pre-paving sync)
  limitations?: string[];             // Explicit operational or data limitations
}

export interface DataValidationError {
  projectId?: string;
  field: string;
  message: string;
}

export interface EngineResult {
  conflicts: ConflictFinding[];
  validationErrors: DataValidationError[];
  evaluatedProjectCount: number;
}
