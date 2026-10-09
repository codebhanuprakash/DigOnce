import {
  PublicWorkProject,
  ConflictFinding,
  DataValidationError,
  EngineResult,
  SubsegmentSpan,
  WorkCategory,
} from './types';

export interface ConflictEngineConfig {
  /**
   * Maximum calendar days after road resurfacing completion
   * to flag recent-resurfacing coordination risks. Default: 180.
   */
  resurfacingHeuristicDays?: number;
}

/**
 * Standard work categories capable of causing physical road surface disruption
 * or requiring excavation/trenching.
 */
export const EXCAVATION_CAPABLE_CATEGORIES: ReadonlySet<WorkCategory> = new Set<WorkCategory>([
  'WATER_SUPPLY',
  'SEWERAGE',
  'POWER_CABLE',
  'TELECOM_FIBER',
  'METRO_STATION',
]);

export const RESURFACING_CATEGORY: WorkCategory = 'ROAD_RESURFACING';

/**
 * Strict ISO YYYY-MM-DD validator
 */
const ISO_DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/**
 * Parses an ISO YYYY-MM-DD string to UTC Epoch day count.
 * Returns null if the format or date value is invalid.
 */
export function parseISODateToUTCDay(dateStr: string): number | null {
  if (typeof dateStr !== 'string' || !ISO_DATE_REGEX.test(dateStr)) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const d = parseInt(dayStr, 10);

  const dateObj = new Date(Date.UTC(y, m - 1, d));
  if (
    dateObj.getUTCFullYear() !== y ||
    dateObj.getUTCMonth() !== m - 1 ||
    dateObj.getUTCDate() !== d
  ) {
    return null;
  }

  // Number of integer days since UTC Unix Epoch
  return Math.floor(dateObj.getTime() / 86400000);
}

export function utcDayToISODate(utcDay: number): string {
  const d = new Date(utcDay * 86400000);
  return d.toISOString().slice(0, 10);
}

/**
 * Validates a public works project record.
 * Returns a list of validation errors if malformed.
 */
export function validateProject(p: unknown): DataValidationError[] {
  const errors: DataValidationError[] = [];
  if (!p || typeof p !== 'object') {
    return [{ field: 'root', message: 'Project must be a non-null object' }];
  }

  const proj = p as Partial<PublicWorkProject>;
  const pid = typeof proj.id === 'string' && proj.id.trim() ? proj.id.trim() : undefined;

  if (!pid) {
    errors.push({ projectId: pid, field: 'id', message: 'Project ID is required and cannot be empty' });
  }

  if (typeof proj.roadId !== 'string' || !proj.roadId.trim()) {
    errors.push({ projectId: pid, field: 'roadId', message: 'roadId is required and cannot be empty' });
  }

  if (typeof proj.segmentStartPct !== 'number' || isNaN(proj.segmentStartPct) || proj.segmentStartPct < 0 || proj.segmentStartPct > 1) {
    errors.push({ projectId: pid, field: 'segmentStartPct', message: 'segmentStartPct must be a number between 0.0 and 1.0' });
  }

  if (typeof proj.segmentEndPct !== 'number' || isNaN(proj.segmentEndPct) || proj.segmentEndPct < 0 || proj.segmentEndPct > 1) {
    errors.push({ projectId: pid, field: 'segmentEndPct', message: 'segmentEndPct must be a number between 0.0 and 1.0' });
  }

  if (
    typeof proj.segmentStartPct === 'number' &&
    typeof proj.segmentEndPct === 'number' &&
    proj.segmentStartPct > proj.segmentEndPct
  ) {
    errors.push({ projectId: pid, field: 'segmentEndPct', message: 'segmentEndPct must be greater than or equal to segmentStartPct' });
  }

  const startDay = proj.startDate ? parseISODateToUTCDay(proj.startDate) : null;
  if (startDay === null) {
    errors.push({ projectId: pid, field: 'startDate', message: `startDate "${proj.startDate}" is not a valid ISO YYYY-MM-DD date` });
  }

  const endDay = proj.endDate ? parseISODateToUTCDay(proj.endDate) : null;
  if (endDay === null) {
    errors.push({ projectId: pid, field: 'endDate', message: `endDate "${proj.endDate}" is not a valid ISO YYYY-MM-DD date` });
  }

  if (startDay !== null && endDay !== null && startDay > endDay) {
    errors.push({ projectId: pid, field: 'endDate', message: 'endDate cannot be before startDate' });
  }

  if (proj.isSimulated !== true) {
    errors.push({ projectId: pid, field: 'isSimulated', message: 'isSimulated flag must be explicitly true for demonstration safety' });
  }

  return errors;
}

/**
 * Calculates strictly positive subsegment overlap between two projects.
 * Returns null if overlap <= 0.
 */
export function calculateSubsegmentOverlap(
  p1: PublicWorkProject,
  p2: PublicWorkProject
): SubsegmentSpan | null {
  const start = Math.max(p1.segmentStartPct, p2.segmentStartPct);
  const end = Math.min(p1.segmentEndPct, p2.segmentEndPct);
  const overlapLength = end - start;

  // Must have strictly positive overlap (> 0). Touching boundaries (start == end) is 0 length.
  if (overlapLength <= 0.000001) {
    return null;
  }

  return {
    startPct: Number(start.toFixed(4)),
    endPct: Number(end.toFixed(4)),
    overlapLengthPct: Number(overlapLength.toFixed(4)),
  };
}

/**
 * Evaluates the dataset and generates deterministic, explainable repeat-dig conflicts.
 */
export function detectConflicts(
  projects: PublicWorkProject[],
  config: ConflictEngineConfig = {}
): EngineResult {
  const heuristicDays = config.resurfacingHeuristicDays ?? 180;
  const validationErrors: DataValidationError[] = [];
  const validProjects: PublicWorkProject[] = [];
  const seenIds = new Set<string>();

  // 1. Validation and Deduplication Phase
  for (const rawProj of projects) {
    const errs = validateProject(rawProj);
    if (errs.length > 0) {
      validationErrors.push(...errs);
      continue;
    }
    if (seenIds.has(rawProj.id)) {
      validationErrors.push({
        projectId: rawProj.id,
        field: 'id',
        message: `Duplicate project ID "${rawProj.id}" encountered; skipping subsequent instance`,
      });
      continue;
    }
    seenIds.add(rawProj.id);
    validProjects.push(rawProj);
  }

  const conflictsMap = new Map<string, ConflictFinding>();

  // 2. Spatial Grouping by Canonical roadId
  const roadGroups = new Map<string, PublicWorkProject[]>();
  for (const proj of validProjects) {
    const list = roadGroups.get(proj.roadId) ?? [];
    list.push(proj);
    roadGroups.set(proj.roadId, list);
  }

  // 3. Pairwise Evaluation
  for (const [roadId, group] of roadGroups.entries()) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const p1 = group[i];
        const p2 = group[j];

        // Ensure order-independent, canonical ID pairing (lexicographical)
        const [projA, projB] = p1.id.localeCompare(p2.id) < 0 ? [p1, p2] : [p2, p1];

        // 3a. Subsegment positive spatial overlap test
        const subsegmentOverlap = calculateSubsegmentOverlap(projA, projB);
        if (!subsegmentOverlap) {
          continue;
        }

        const startA = parseISODateToUTCDay(projA.startDate)!;
        const endA = parseISODateToUTCDay(projA.endDate)!;
        const startB = parseISODateToUTCDay(projB.startDate)!;
        const endB = parseISODateToUTCDay(projB.endDate)!;

        // -------------------------------------------------------------
        // RULE A: Concurrent Work Coordination Risk
        // -------------------------------------------------------------
        // Status eligibility: Both projects must be active or planned (not COMPLETED or PAUSED)
        const isEligibleStatusA = (s: string) => s === 'PLANNED' || s === 'IN_PROGRESS';
        if (isEligibleStatusA(projA.status) && isEligibleStatusA(projB.status)) {
          // Check inclusive calendar date overlap: max(start) <= min(end)
          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);

          if (overlapStart <= overlapEnd) {
            const overlapDays = overlapEnd - overlapStart + 1; // Inclusive count
            const findingId = `CNF-CONCURRENT-${roadId}-${projA.id}-${projB.id}`;

            const finding: ConflictFinding = {
              id: findingId,
              ruleType: 'CONCURRENT_WORK_COLLISION',
              severity: 'CRITICAL',
              roadId,
              projectAId: projA.id,
              projectBId: projB.id,
              subsegmentOverlap,
              temporalDetails: {
                type: 'DATE_OVERLAP',
                dateOverlap: {
                  startDate: utcDayToISODate(overlapStart),
                  endDate: utcDayToISODate(overlapEnd),
                  overlapDays,
                },
              },
              evidence: [
                `Shared road segment: "${roadId}"`,
                `Subsegment chainage overlap: ${(subsegmentOverlap.startPct * 100).toFixed(1)}% to ${(subsegmentOverlap.endPct * 100).toFixed(1)}% (span: ${(subsegmentOverlap.overlapLengthPct * 100).toFixed(1)}%)`,
                `Inclusive date collision: ${utcDayToISODate(overlapStart)} to ${utcDayToISODate(overlapEnd)} (${overlapDays} inclusive day${overlapDays > 1 ? 's' : ''})`,
                `Agencies involved: ${projA.agency} (${projA.category}) vs ${projB.agency} (${projB.category})`,
                `Project statuses: ${projA.id} is ${projA.status}, ${projB.id} is ${projB.status}`,
              ],
              explanation: `Projects ${projA.id} (${projA.agency}) and ${projB.id} (${projB.agency}) are scheduled concurrently on the identical subsegment of ${roadId}. Simultaneous trenching or road obstruction will result in compounded traffic disruption and potential utility interference.`,
              recommendedAction: 'Coordinate joint trenching or sequence works sequentially with an inter-agency NOC review before commencing excavation.',
              limitations: [
                'Demonstration scenario based on synthetic schedules; actual site permits require field engineer validation.',
              ],
            };

            conflictsMap.set(findingId, finding);
          }
        }

        // -------------------------------------------------------------
        // RULE B: Recent-Resurfacing Coordination Risk (Configurable Heuristic)
        // -------------------------------------------------------------
        // Order-independent identification of resurfacing vs excavation candidate
        const candidates = [
          { resurf: projA, excav: projB, rEnd: endA, eStart: startB },
          { resurf: projB, excav: projA, rEnd: endB, eStart: startA },
        ];

        for (const { resurf, excav, rEnd, eStart } of candidates) {
          if (
            resurf.category === RESURFACING_CATEGORY &&
            resurf.status === 'COMPLETED' &&
            EXCAVATION_CAPABLE_CATEGORIES.has(excav.category) &&
            (excav.status === 'PLANNED' || excav.status === 'IN_PROGRESS')
          ) {
            // Excavation must begin strictly AFTER resurfacing has completed
            const elapsedDays = eStart - rEnd;

            if (elapsedDays >= 1 && elapsedDays <= heuristicDays) {
              const findingId = `CNF-RESURFACING-${roadId}-${resurf.id}-${excav.id}`;

              const finding: ConflictFinding = {
                id: findingId,
                ruleType: 'RECENT_RESURFACING_RISK',
                severity: 'HIGH',
                roadId,
                projectAId: projA.id,
                projectBId: projB.id,
                subsegmentOverlap,
                temporalDetails: {
                  type: 'RESURFACING_INTERVAL',
                  resurfacingInterval: {
                    resurfacingEndDate: utcDayToISODate(rEnd),
                    excavationStartDate: utcDayToISODate(eStart),
                    elapsedDays,
                    heuristicThresholdDays: heuristicDays,
                  },
                },
                evidence: [
                  `Shared road segment: "${roadId}"`,
                  `Subsegment chainage overlap: ${(subsegmentOverlap.startPct * 100).toFixed(1)}% to ${(subsegmentOverlap.endPct * 100).toFixed(1)}%`,
                  `Resurfacing project ${resurf.id} completed on ${utcDayToISODate(rEnd)}`,
                  `Excavation project ${excav.id} (${excav.category}) scheduled to begin on ${utcDayToISODate(eStart)}`,
                  `Elapsed duration: ${elapsedDays} calendar days (within demonstration coordination heuristic of ${heuristicDays} days)`,
                ],
                explanation: `Project ${excav.id} (${excav.agency}) plans excavation on a road subsegment resurfaced only ${elapsedDays} days prior by ${resurf.id} (${resurf.agency}). Cutting newly surfaced asphalt risks road degradation and repetitive restoration.`,
                recommendedAction: 'Initiate municipal inter-agency review to evaluate pre-resurfacing duct availability, trenchless micro-tunneling, or rescheduling.',
                limitations: [
                  `Rule evaluated against a ${heuristicDays}-day demonstration heuristic; this advisory does not constitute a legal finding of violation.`,
                ],
              };

              conflictsMap.set(findingId, finding);
            }
          }
        }
      }
    }
  }

  // Sort conflicts deterministically by ID
  const sortedConflicts = Array.from(conflictsMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  return {
    conflicts: sortedConflicts,
    validationErrors,
    evaluatedProjectCount: validProjects.length,
  };
}
