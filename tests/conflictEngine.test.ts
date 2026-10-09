import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  calculateSubsegmentOverlap,
  parseISODateToUTCDay,
  utcDayToISODate,
  validateProject,
} from '../lib/conflictEngine';
import { PublicWorkProject } from '../lib/types';
import { MOCK_PROJECTS } from '../lib/mockData';

describe('Deterministic Repeat-Dig Conflict Engine', () => {
  // Helper to construct sample valid simulated project
  const createProject = (overrides: Partial<PublicWorkProject>): PublicWorkProject => ({
    id: 'PRJ-TEST-01',
    roadId: 'RD-TEST-MAIN',
    agency: 'GCC',
    category: 'ROAD_RESURFACING',
    title: 'Test Project',
    description: 'Test Description',
    contractor: 'Test Contractor',
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    status: 'PLANNED',
    segmentStartPct: 0.1,
    segmentEndPct: 0.5,
    coordinates: [{ lat: 13.0, lng: 80.0 }],
    isSimulated: true,
    ...overrides,
  });

  describe('Date Arithmetic and Boundary Conversions', () => {
    it('parses valid ISO YYYY-MM-DD dates to consistent UTC days', () => {
      const day1 = parseISODateToUTCDay('2026-01-01');
      const day2 = parseISODateToUTCDay('2026-01-02');
      expect(day1).not.toBeNull();
      expect(day2).not.toBeNull();
      expect(day2! - day1!).toBe(1);
    });

    it('rejects invalid date strings predictably', () => {
      expect(parseISODateToUTCDay('2026-02-30')).toBeNull(); // Invalid leap/day
      expect(parseISODateToUTCDay('not-a-date')).toBeNull();
      expect(parseISODateToUTCDay('2026/05/01')).toBeNull();
      expect(parseISODateToUTCDay('')).toBeNull();
    });

    it('converts UTC day numbers back to exact ISO date strings', () => {
      const original = '2026-11-15';
      const utcDay = parseISODateToUTCDay(original)!;
      expect(utcDayToISODate(utcDay)).toBe(original);
    });
  });

  describe('Subsegment Overlap Calculation', () => {
    it('detects positive subsegment overlap accurately', () => {
      const p1 = createProject({ segmentStartPct: 0.1, segmentEndPct: 0.6 });
      const p2 = createProject({ segmentStartPct: 0.4, segmentEndPct: 0.9 });
      const overlap = calculateSubsegmentOverlap(p1, p2);
      expect(overlap).not.toBeNull();
      expect(overlap!.startPct).toBe(0.4);
      expect(overlap!.endPct).toBe(0.6);
      expect(overlap!.overlapLengthPct).toBe(0.2);
    });

    it('returns null for zero-length touching boundary subsegments', () => {
      const p1 = createProject({ segmentStartPct: 0.0, segmentEndPct: 0.5 });
      const p2 = createProject({ segmentStartPct: 0.5, segmentEndPct: 1.0 });
      // Point touch [0.5, 0.5] has 0 length and must NOT be flagged
      const overlap = calculateSubsegmentOverlap(p1, p2);
      expect(overlap).toBeNull();
    });

    it('returns null for completely separated subsegments', () => {
      const p1 = createProject({ segmentStartPct: 0.0, segmentEndPct: 0.3 });
      const p2 = createProject({ segmentStartPct: 0.6, segmentEndPct: 0.9 });
      expect(calculateSubsegmentOverlap(p1, p2)).toBeNull();
    });
  });

  describe('Rule A: Concurrent Work Coordination Risk', () => {
    it('flags two overlapping projects on the same road and subsegment with overlapping dates', () => {
      const pA = createProject({
        id: 'PRJ-A',
        roadId: 'RD-01',
        agency: 'GCC',
        category: 'ROAD_RESURFACING',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        segmentStartPct: 0.2,
        segmentEndPct: 0.7,
      });
      const pB = createProject({
        id: 'PRJ-B',
        roadId: 'RD-01',
        agency: 'CMWSSB',
        category: 'WATER_SUPPLY',
        startDate: '2026-06-15',
        endDate: '2026-06-30',
        segmentStartPct: 0.4,
        segmentEndPct: 0.8,
      });

      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(1);
      const conflict = result.conflicts[0];
      expect(conflict.ruleType).toBe('CONCURRENT_WORK_COLLISION');
      expect(conflict.severity).toBe('CRITICAL');
      expect(conflict.temporalDetails.dateOverlap?.overlapDays).toBe(6); // June 15 to June 20 inclusive
      expect(conflict.temporalDetails.dateOverlap?.startDate).toBe('2026-06-15');
      expect(conflict.temporalDetails.dateOverlap?.endDate).toBe('2026-06-20');
    });

    it('flags date intervals that touch on exactly one calendar day (inclusive 1-day overlap)', () => {
      const pA = createProject({
        id: 'PRJ-A',
        roadId: 'RD-01',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
        segmentStartPct: 0.2,
        segmentEndPct: 0.7,
      });
      const pB = createProject({
        id: 'PRJ-B',
        roadId: 'RD-01',
        agency: 'TANGEDCO',
        category: 'POWER_CABLE',
        startDate: '2026-06-10', // Exact touch day
        endDate: '2026-06-20',
        segmentStartPct: 0.2,
        segmentEndPct: 0.7,
      });

      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].temporalDetails.dateOverlap?.overlapDays).toBe(1);
      expect(result.conflicts[0].temporalDetails.dateOverlap?.startDate).toBe('2026-06-10');
      expect(result.conflicts[0].temporalDetails.dateOverlap?.endDate).toBe('2026-06-10');
    });

    it('does not flag projects on different road IDs even if dates and percentages overlap', () => {
      const pA = createProject({ id: 'PRJ-A', roadId: 'RD-01', startDate: '2026-06-01', endDate: '2026-06-20' });
      const pB = createProject({ id: 'PRJ-B', roadId: 'RD-02', startDate: '2026-06-01', endDate: '2026-06-20' });
      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(0);
    });

    it('does not flag projects on the same road if subsegments do not overlap', () => {
      const pA = createProject({
        id: 'PRJ-A',
        roadId: 'RD-01',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        segmentStartPct: 0.0,
        segmentEndPct: 0.3,
      });
      const pB = createProject({
        id: 'PRJ-B',
        roadId: 'RD-01',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        segmentStartPct: 0.5,
        segmentEndPct: 0.9,
      });
      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(0);
    });

    it('does not flag projects on the same road if dates do not overlap', () => {
      const pA = createProject({
        id: 'PRJ-A',
        roadId: 'RD-01',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
        segmentStartPct: 0.2,
        segmentEndPct: 0.7,
      });
      const pB = createProject({
        id: 'PRJ-B',
        roadId: 'RD-01',
        startDate: '2026-06-11', // Adjacent day, 0 overlap
        endDate: '2026-06-20',
        segmentStartPct: 0.2,
        segmentEndPct: 0.7,
      });
      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(0);
    });

    it('ignores COMPLETED or PAUSED projects for concurrent work conflicts', () => {
      const pA = createProject({ id: 'PRJ-A', roadId: 'RD-01', status: 'COMPLETED', startDate: '2026-06-01', endDate: '2026-06-20' });
      const pB = createProject({ id: 'PRJ-B', roadId: 'RD-01', status: 'PAUSED', startDate: '2026-06-05', endDate: '2026-06-15' });
      const result = detectConflicts([pA, pB]);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Rule B: Recent-Resurfacing Coordination Risk (180-Day Heuristic)', () => {
    it('flags excavation starting between 1 and 180 days after completed resurfacing', () => {
      const resurf = createProject({
        id: 'PRJ-RESURF',
        roadId: 'RD-01',
        agency: 'GCC',
        category: 'ROAD_RESURFACING',
        status: 'COMPLETED',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        segmentStartPct: 0.1,
        segmentEndPct: 0.6,
      });
      const excav = createProject({
        id: 'PRJ-EXCAV',
        roadId: 'RD-01',
        agency: 'CMWSSB',
        category: 'WATER_SUPPLY',
        status: 'PLANNED',
        startDate: '2026-03-01', // 45 days after Jan 15
        endDate: '2026-03-20',
        segmentStartPct: 0.3,
        segmentEndPct: 0.8,
      });

      const result = detectConflicts([resurf, excav]);
      expect(result.conflicts).toHaveLength(1);
      const conflict = result.conflicts[0];
      expect(conflict.ruleType).toBe('RECENT_RESURFACING_RISK');
      expect(conflict.severity).toBe('HIGH');
      expect(conflict.temporalDetails.resurfacingInterval?.elapsedDays).toBe(45);
      expect(conflict.temporalDetails.resurfacingInterval?.heuristicThresholdDays).toBe(180);
    });

    it('flags when excavation starts exactly 1 day after resurfacing completion', () => {
      const resurf = createProject({
        id: 'PRJ-RESURF',
        roadId: 'RD-01',
        category: 'ROAD_RESURFACING',
        status: 'COMPLETED',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
      });
      const excav = createProject({
        id: 'PRJ-EXCAV',
        roadId: 'RD-01',
        category: 'POWER_CABLE',
        status: 'PLANNED',
        startDate: '2026-01-16', // Exactly 1 day after
        endDate: '2026-01-30',
      });

      const result = detectConflicts([resurf, excav]);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].temporalDetails.resurfacingInterval?.elapsedDays).toBe(1);
    });

    it('flags when excavation starts exactly 180 days after resurfacing completion', () => {
      const resurf = createProject({
        id: 'PRJ-RESURF',
        roadId: 'RD-01',
        category: 'ROAD_RESURFACING',
        status: 'COMPLETED',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
      });
      // 180 days after 2026-01-01 is 2026-06-30
      const targetDay = parseISODateToUTCDay('2026-01-01')! + 180;
      const startDate = utcDayToISODate(targetDay);

      const excav = createProject({
        id: 'PRJ-EXCAV',
        roadId: 'RD-01',
        category: 'TELECOM_FIBER',
        status: 'PLANNED',
        startDate,
        endDate: '2026-07-15',
      });

      const result = detectConflicts([resurf, excav]);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].temporalDetails.resurfacingInterval?.elapsedDays).toBe(180);
    });

    it('does NOT flag when excavation starts at 181 days after resurfacing', () => {
      const resurf = createProject({
        id: 'PRJ-RESURF',
        roadId: 'RD-01',
        category: 'ROAD_RESURFACING',
        status: 'COMPLETED',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
      });
      const targetDay = parseISODateToUTCDay('2026-01-01')! + 181;
      const startDate = utcDayToISODate(targetDay);

      const excav = createProject({
        id: 'PRJ-EXCAV',
        roadId: 'RD-01',
        category: 'TELECOM_FIBER',
        status: 'PLANNED',
        startDate,
        endDate: '2026-07-20',
      });

      const result = detectConflicts([resurf, excav]);
      expect(result.conflicts).toHaveLength(0);
    });

    it('evaluates Rule B identically when input order is reversed', () => {
      const resurf = createProject({
        id: 'PRJ-RESURF',
        roadId: 'RD-01',
        category: 'ROAD_RESURFACING',
        status: 'COMPLETED',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
      });
      const excav = createProject({
        id: 'PRJ-EXCAV',
        roadId: 'RD-01',
        category: 'WATER_SUPPLY',
        status: 'PLANNED',
        startDate: '2026-02-15',
        endDate: '2026-02-28',
      });

      // Pass excavation first, resurfacing second
      const resultReversed = detectConflicts([excav, resurf]);
      const resultNormal = detectConflicts([resurf, excav]);

      expect(resultReversed.conflicts).toEqual(resultNormal.conflicts);
      expect(resultReversed.conflicts).toHaveLength(1);
    });
  });

  describe('Deduplication and Order Independence', () => {
    it('produces identical deterministic findings regardless of input order', () => {
      const projects = [...MOCK_PROJECTS];
      const reversed = [...MOCK_PROJECTS].reverse();

      const resultA = detectConflicts(projects);
      const resultB = detectConflicts(reversed);

      expect(resultA.conflicts.map(c => c.id)).toEqual(resultB.conflicts.map(c => c.id));
      expect(resultA.conflicts).toEqual(resultB.conflicts);
    });

    it('skips duplicate project IDs and logs a validation error', () => {
      const p1 = createProject({ id: 'DUP-01' });
      const p2 = createProject({ id: 'DUP-01', title: 'Second instance' });

      const result = detectConflicts([p1, p2]);
      expect(result.evaluatedProjectCount).toBe(1);
      expect(result.validationErrors.some(e => e.message.includes('Duplicate project ID'))).toBe(true);
    });
  });

  describe('Validation & Malformed Data Handling', () => {
    it('catches invalid percentages and coordinates without crashing', () => {
      const invalid = createProject({
        id: 'PRJ-BAD',
        segmentStartPct: 0.9,
        segmentEndPct: 0.2, // end < start
      });

      const errs = validateProject(invalid);
      expect(errs.some(e => e.field === 'segmentEndPct')).toBe(true);

      const result = detectConflicts([invalid]);
      expect(result.conflicts).toHaveLength(0);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('catches invalid dates and inverted date ranges', () => {
      const badDates = createProject({
        id: 'PRJ-DATES',
        startDate: '2026-10-20',
        endDate: '2026-10-10', // end < start
      });

      const errs = validateProject(badDates);
      expect(errs.some(e => e.field === 'endDate')).toBe(true);
    });

    it('enforces explicit isSimulated flag for demonstration safety', () => {
      const unflagged = createProject({ isSimulated: false as unknown as true });
      const errs = validateProject(unflagged);
      expect(errs.some(e => e.field === 'isSimulated')).toBe(true);
    });
  });

  describe('Demonstration Dataset Verification (MOCK_PROJECTS)', () => {
    it('evaluates MOCK_PROJECTS and finds exactly the expected conflict pair findings', () => {
      const result = detectConflicts(MOCK_PROJECTS);
      expect(result.validationErrors).toHaveLength(0);
      expect(result.evaluatedProjectCount).toBe(MOCK_PROJECTS.length);

      // We expect exactly 2 distinct conflicts in the demonstration dataset:
      // 1. Concurrent dig on Anna Salai (PRJ-2026-GCC-041 & PRJ-2026-CMWSSB-082)
      // 2. Recent resurfacing risk on Arcot Road (PRJ-2026-GCC-012 & PRJ-2026-TANGEDCO-034)
      expect(result.conflicts).toHaveLength(2);

      const ruleA = result.conflicts.find(c => c.ruleType === 'CONCURRENT_WORK_COLLISION');
      expect(ruleA).toBeDefined();
      expect(ruleA?.roadId).toBe('RD-CH-09-ANNA-01');

      const ruleB = result.conflicts.find(c => c.ruleType === 'RECENT_RESURFACING_RISK');
      expect(ruleB).toBeDefined();
      expect(ruleB?.roadId).toBe('RD-CH-10-ARCOT-02');
    });
  });
});
